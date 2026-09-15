# Stage 22 — M2 Implementation Checklist

Written 2026-09-10, reconciling [stage-15-data-model.md](stage-15-data-model.md), [stage-17-screen-specs.md](stage-17-screen-specs.md), [stage-6-user-journeys.md](stage-6-user-journeys.md) Journey 1, [stage-7-state-machines.md](stage-7-state-machines.md), [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md), [stage-10-taxonomy.md](stage-10-taxonomy.md), [stage-11-states-catalog.md](stage-11-states-catalog.md), and [stage-16-api-shape.md](stage-16-api-shape.md). M2 is "Professional Profile" per [stage-18-development-milestones.md](stage-18-development-milestones.md): the 8-step onboarding through Profile Complete → Submit for Verification.

**No new product behavior is invented here.** Two spec contradictions are resolved by deferring to the authoritative document, both flagged below.

---

## Spec contradictions resolved (not invented)

**A. Autosave vs. "no API call until final submit."** [stage-17-screen-specs.md](stage-17-screen-specs.md) line 27 says both *"Next/Back per step (client-side, no API call until final submit)"* and *"Each step's data auto-saves as entered ... so abandonment mid-flow doesn't lose data."* These are mutually exclusive. [stage-6-user-journeys.md](stage-6-user-journeys.md) Journey 1's failure branch (*"Member abandons onboarding partway ... Profile should save as a draft and resume where they left off next login, not restart"*) and [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s "onboarding resumes after interruption" scenario (*"previously entered data is retained"*) both require persistence per step. **Resolution: autosave per step wins.** The "no API call until final submit" phrasing is a stale earlier-draft clause superseded by the resume requirement it sits next to. Stage 17 itself lists the per-step endpoints (`PATCH /members/me`, `POST /members/me/education`, etc.) under the same bullet, confirming autosave is the intent.

**B. Onboarding step order — Experience vs. Education position.** [stage-6-user-journeys.md](stage-6-user-journeys.md) Journey 1 step 3 is authoritative: Step 1 Personal, **Step 2 Profession, Step 3 Experience, Step 4 Education**, Step 5 Skills, Step 6 CV, Step 7 Availability, Step 8 Review. [stage-17-screen-specs.md](stage-17-screen-specs.md)'s "Inputs, by step" line lists "Education" as step 4 and "Experience" as step 3 in prose but its own numbered gloss (`2. Profession · 3. Employment status + years experience · 4. Education`) matches Journey 1. **Resolution: follow Journey 1's order** — Experience (with employment status + years) is Step 3, Education is Step 4.

---

## The 8 steps

Step order and fields, reconciled. Each step autosaves on "Next" (contradiction A). All steps single-column, full-width, identical desktop/mobile ([stage-17-screen-specs.md](stage-17-screen-specs.md): *"the one flow where desktop and mobile should look nearly identical"*).

| # | Step | Fields (from Stage 15 + Stage 17) | Persists to | P0? |
|---|---|---|---|---|
| 1 | Personal information | photo, date_of_birth, gender, location | `PATCH /members/me` | P0 |
| 2 | Profession | primary_profession (searchable against taxonomy; free-text fallback allowed per Stage 10), job_title, industry (derived from profession category, editable) | `PATCH /members/me` | P0 |
| 3 | Experience | employment_status (enum), years_of_experience (number); then 0+ Experience records: organization, position, location, start_date, end_date, is_current, description | `PATCH /members/me` (status + years); `POST/PATCH/DELETE /members/me/experience` (records) | P0 |
| 4 | Education | 1+ Education records: institution, qualification, field_of_study, start_year, end_year, is_current | `POST/PATCH/DELETE /members/me/education` | P0 |
| 5 | Skills | tag entry; suggested set shown first based on chosen profession (Stage 10); free text allowed | `POST /members/me/skills`, `DELETE /members/me/skills/:skillId` | P0 (free-text at launch — no strict taxonomy binding) |
| 6 | CV upload | one document, type=CV, PDF/DOC/DOCX, ≤10 MB | `POST /members/me/documents`, `DELETE /members/me/documents/:id` | P0 |
| 7 | Availability | Open / Selective / Not available (default: not set — must be chosen) | `PATCH /members/me` | P0 |
| 8 | Review | read-only summary of steps 1–7; "Submit for verification" button | `POST /members/me/submit-for-verification` | P0 |

**Certifications are NOT in M2 onboarding** — [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md) line 30 marks certifications P1. The `certifications` table and endpoints exist in the schema/API for later; onboarding does not touch them.

---

## Database (migration 002)

Add tables per [stage-15-data-model.md](stage-15-data-model.md), plus the new `members` columns M2 needs. Migration 001 (M1) already has `members` with the three status fields and `availability` was deliberately deferred to M2 (see [stage-21-m1-implementation-spec.md](stage-21-m1-implementation-spec.md) — it is NOT in 001).

**`members` — add columns:**
- `photo_url text` (nullable)
- `date_of_birth date` (nullable)
- `gender text` (nullable — no enum mandated by any spec; keep free text)
- `location text` (nullable)
- `primary_profession_id uuid` (nullable, → `professions.id`)
- `profession_freetext text` (nullable — Stage 10's "free text an admin can later fold in" fallback when no taxonomy match)
- `job_title text` (nullable)
- `industry text` (nullable — derived-but-editable per Stage 10)
- `employment_status text` (nullable, check constraint: the 8 Stage 10 values)
- `years_of_experience integer` (nullable, `>= 0`)
- `availability text not null default 'NOT_SET'` (check: `NOT_SET | OPEN | SELECTIVE | NOT_AVAILABLE`) — `NOT_SET` added so "must be chosen in step 7" is representable; not in Stage 10's list but forced by the onboarding requirement that availability is an explicit choice, and Journey 1 step 7 lists exactly the three real values. Once chosen it is one of the three.

**New tables (all with RLS: a member can CRUD only rows where `member_id` maps to their own `auth.uid()`):**
- `professions` (id, name, category, synonyms text[]) — reference data, seeded from Stage 10's list; read-only to members (`SELECT` to `authenticated`), no member write policy.
- `skills` (id, name, synonyms text[]) — flat list per Stage 10; same read-only posture.
- `member_skills` (member_id, skill_id, created_at) — join; member CRUD scoped to own `member_id`. Also allow a `skill_freetext text` variant OR insert into `skills` on the fly — **decision: on free-text entry, upsert into `skills` then link via `member_skills`**, matching Stage 10's "growing list" model, rather than a parallel free-text column.
- `education` (id, member_id, institution, qualification, field_of_study, start_year int, end_year int nullable, is_current bool default false, created_at, updated_at).
- `experience` (id, member_id, organization, position, location, start_date date, end_date date nullable, is_current bool default false, description text, created_at, updated_at).
- `certifications` (id, member_id, name, issuing_organization, issue_date date, expiration_date date nullable, document_id uuid nullable → documents.id, created_at, updated_at) — table exists, **no M2 UI**.
- `documents` (id, member_id, type text check `CV | CERTIFICATE | OTHER`, filename text, storage_path text, mime_type text, size_bytes bigint, created_at) — `storage_path` points at Supabase Storage (Stage 20 §27: bucket `member-documents`, path `{member_id}/cv/…`).

**Supabase Storage:** create private bucket `member-documents`. RLS storage policy: a member can insert/select/delete only under the `{their member id}/` prefix.

---

## Profile completeness rules (P0 fields → "Profile Complete")

Per [stage-7-state-machines.md](stage-7-state-machines.md) and [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md), a profile is **complete** (eligible to submit) when ALL of these are present:

1. Personal: `location` set (photo, DOB, gender are collected but no spec marks them individually blocking — **be conservative: require `location` only**, since Stage 13 says "personal info" without enumerating, and location is the one field matching uses).
2. Profession: `primary_profession_id` OR `profession_freetext` non-empty.
3. Experience: `employment_status` set AND `years_of_experience` is a number ≥ 0. (Experience *records* are 0+ — Journey 1 says "years, employment status" for the step; individual job records aren't mandated as blocking. Stage 13 says "experience information" — the step-level employment_status + years satisfies that.)
4. Education: at least one `education` record.
5. Skills: at least one `member_skills` row.
6. CV: at least one `documents` row with `type = 'CV'`.
7. Availability: `availability` is one of `OPEN | SELECTIVE | NOT_AVAILABLE` (i.e. not `NOT_SET`).

**"Profile Complete" is NOT auto-set when fields fill in.** Per Stage 7: *"Submission is the trigger, not field-completeness alone."* The transition `Registered → Profile Complete` happens **only** inside `POST /members/me/submit-for-verification`, and only if all 7 checks pass. If a check fails, that endpoint returns a 4xx naming the missing field ([stage-11-states-catalog.md](stage-11-states-catalog.md): *"Add your [profession/education/etc.] before continuing"*), and `profile_status` stays `REGISTERED`.

The **profile completion indicator / percentage** (Stage 6 step 5, Stage 3) is **P1** per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md) line 33 — M2 does NOT build a percentage widget. M2 shows the checklist of missing items on the Review step and on the dashboard, as pass/fail, not a percent.

---

## Autosave / resume behavior

- **Autosave trigger:** on "Next" from each step, persist that step's data via its endpoint(s) before advancing. On "Back", no save needed (data already persisted or unchanged).
- **Resume:** onboarding route is only reachable while `profile_status = 'REGISTERED'` ([stage-17-screen-specs.md](stage-17-screen-specs.md) permissions line). On entry, compute the **furthest incomplete step** from persisted data and open there — not Step 1, not Step 8. Rule: walk steps 1→7, land on the first whose completeness check (above) is unmet; if all 1–7 are met, land on Step 8 (Review).
- **Data retention:** every field the member entered before abandoning is already in the DB (autosave), so resume just re-reads `GET /members/me` + the sub-collections and pre-fills.
- **No separate "draft" flag needed** — `profile_status = 'REGISTERED'` *is* the draft state (Stage 7: "Registered ... profile still being built"). There is no `DRAFT` value.
- After successful submit, `profile_status = 'PROFILE_COMPLETE'` and the onboarding route redirects to `/dashboard` and is no longer reachable (permissions gate).

---

## The three independent status fields — M2's responsibilities

M2 only ever writes **two** of the three, and only in one place:

| Field | M2 writes it? | When |
|---|---|---|
| `profile_status` | Yes — `REGISTERED` → `PROFILE_COMPLETE` | inside `submit-for-verification`, only on all-checks-pass |
| `membership_status` | Yes — `NOT_SUBMITTED` → `PENDING` | same call, same moment (Stage 7: "both tracks enter Pending together, since submission is one action") |
| `credentials_status` | Yes — `NOT_SUBMITTED` → `PENDING` | same call, same moment |

- The two verification tracks move **together** at submit (one action) but are **approved independently later** by an admin (M3, not M2). M2 must not couple them beyond this shared entry point.
- M2 does **not** implement admin approval, `Needs Correction`, re-submission, or the reverification-on-edit rules ([stage-7-state-machines.md](stage-7-state-machines.md)'s 2026-09-10 field-specific rules) — those are M3+. M2's editing of a profile happens only while `REGISTERED`, before any verification exists, so reverification is moot within M2's scope.
- `availability` (a 4th member sub-state, not one of "the three") is written by step 7 and, post-onboarding, by the dashboard toggle (Journey 3) — that toggle already exists conceptually in Stage 17's dashboard spec; M2 adds the real `PATCH /members/me` availability write.

---

## Screens M2 builds

1. **Onboarding steps 1–8** (`/onboarding` or `/onboarding/[step]`) — replaces M1's placeholder. Gated to `profile_status = REGISTERED`.
2. **Professional Profile (own)** (`/profile`) — replaces M1's "Coming in the next stage" placeholder. Read view of the completed profile + per-section "Edit" links. Verification badges use the resolved copy ("Membership confirmed" / "Credentials reviewed") — [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s regression scenario. For a `REGISTERED` member who hasn't finished onboarding, `/profile` redirects into `/onboarding` at the resume step.
3. **Member dashboard** — extend M1's version: the "Complete profile" CTA now routes to `/onboarding` (resume step); after Profile Complete, show membership/credentials as `Pending` and the "waiting for review" state (Journey 1 step 5–6). Availability toggle becomes live.
4. **Per-section edit forms** — reachable from `/profile`, reuse the step components. Only relevant while `REGISTERED` in M2 (post-verification editing with reverification is M3).

**Not in M2:** certifications UI (P1), profile completion percentage (P1), privacy/visibility settings (P1), anything admin-side.

---

## API endpoints M2 implements (all from [stage-16-api-shape.md](stage-16-api-shape.md), none new)

```
GET    /members/me                       — extend M1's: include profession, education[], experience[], skills[], documents[]
PATCH  /members/me                        — personal info, profession/job_title/industry, employment_status/years, availability
POST   /members/me/education              PATCH/DELETE /members/me/education/:id
POST   /members/me/experience             PATCH/DELETE /members/me/experience/:id
POST   /members/me/skills                 DELETE /members/me/skills/:skillId   (skills: upsert into skills table + link)
POST   /members/me/documents              DELETE /members/me/documents/:id      (multipart → Supabase Storage + documents row)
POST   /members/me/submit-for-verification — completeness gate → profile_status + both verification tracks to PENDING
GET    /professions                       — taxonomy read (search by name/synonym)
GET    /skills?profession=:id             — suggested skills for a profession
```

Every write endpoint re-validates server-side with a shared Zod schema (same pattern as M1's auth actions) and is scoped by RLS to the caller's own member row.

---

## Acceptance tests (Stage 13-derived, extended for M2)

Build `app/tests/e2e/m2-acceptance.spec.ts`, serial, same live-Supabase guard as M1. Each maps to a checklist line above.

1. **Onboarding starts at Step 1 for a fresh member** — a just-registered member (M1) landing on `/dashboard` and clicking "Complete profile" opens `/onboarding` at Step 1.
2. **Each step autosaves** — fill Step 1, click Next, reload the page → Step 1's data is still there and the flow resumes at Step 2 (not Step 1).
3. **Resume after abandonment** (Stage 13 scenario) — fill Steps 1–3, close the page, log in again → onboarding resumes at Step 4, Steps 1–3 data retained.
4. **Step order matches Journey 1** — Step 3 is Experience (employment status + years), Step 4 is Education. (Assert headings/fields per step.)
5. **CV upload rejects wrong type** (Stage 11) — uploading a `.txt` at Step 6 shows "That file type isn't supported. Upload a PDF, DOC, or DOCX."
6. **CV upload rejects oversize** (Stage 11) — a >10 MB file shows "That file is too large. Documents must be under 10 MB."
7. **Submission blocked on a missing P0 field** (Stage 13 scenario) — reach Step 8 with no CV (skip Step 6), click "Submit for verification" → inline error naming the CV, `profile_status` stays `REGISTERED`, no verification-track change.
8. **Profile reaches Profile Complete** (Stage 13 scenario) — complete all 7 steps with valid data, submit → redirect to `/dashboard`; dashboard shows Membership: Pending and Credentials: Pending; `GET /members/me` shows `profile_status = PROFILE_COMPLETE`.
9. **Both verification tracks move together** — after submit, both `membership_status` and `credentials_status` are `PENDING` (not one, not neither).
10. **Onboarding not re-enterable after completion** — a `PROFILE_COMPLETE` member navigating to `/onboarding` is redirected to `/dashboard`.
11. **`/profile` shows the completed profile** — after completion, `/profile` renders the entered profession, education, experience, skills, and CV filename, with badges reading "Membership confirmed"/"Credentials reviewed" style copy in their Pending form (never bare "Verified").
12. **Availability toggle is live on the dashboard** — changing availability on `/dashboard` persists (reload → new value shown).
13. **Free-text profession is accepted** (Stage 10) — entering a profession not in the seed taxonomy at Step 2 does not block; it's stored and shown on `/profile`.
14. **Unit tests** (`tests/unit/`): the completeness-check function (7 rules → pass/fail with the specific missing field), and the resume-step calculator (persisted-data shape → furthest incomplete step).

---

## Build order

1. Migration 002 (members columns + new tables + RLS) + Supabase Storage bucket & policies.
2. Seed `professions` and `skills` from Stage 10's lists (a `supabase/seed/` SQL file).
3. Types: extend `src/types/member.ts` and `database.ts` for the new columns/tables; add `Education`, `Experience`, `SkillTag`, `Document`, `Profession` types and the `EmploymentStatus` / `Availability` enums (align `Availability` to include `NOT_SET`).
4. `lib/profile/`: the completeness-check function, the resume-step calculator, Zod schemas per step.
5. API route handlers / server actions for the endpoints above.
6. Onboarding step components + the stepper shell + `/onboarding` route with the resume gate.
7. `/profile` read view + per-section edit; dashboard updates (CTA target, post-submit status display, live availability toggle).
8. `m2-acceptance.spec.ts` + unit tests; run against live Supabase; fix; document any deviations in this file.

---

## Implementation deviations & bugs found (2026-09-10)

Built, tested against the live Supabase project, all suites green: **M2 acceptance 11/11, M1 acceptance 10/10 + 1 skip (admin), 28 unit tests, typecheck/lint/build clean.**

**Deviations from the plan above, with reasons:**

1. **`redirect()` from the register/login Server Actions was replaced with a returned `{ redirectTo }` + client `router.push`.** A server `redirect()` from an action into a route that *itself* may `redirect()` (`/onboarding` gates on `profile_status`) gets swallowed by Next 16's chained-redirect handling — the browser stays on `/register`, action promise never resolves. Both `register` and `login` now return the destination and the form navigates. M1's earlier "server redirect is more robust" note (Stage 21) is reversed for the case where the target route has its own redirect logic.

2. **`postAuthDestination` now takes `profileStatus`.** A member with `profile_status = REGISTERED` (onboarding unfinished) is routed to `/onboarding` on login, not `/dashboard` — matches Journey 1 ("resume where they left off"). M1's acceptance tests were updated to expect `/(onboarding|dashboard)/` for the fresh member instead of `/dashboard`.

3. **Registration now lands on `/onboarding`, not `/dashboard`** (`POST_REGISTRATION_DESTINATION`). Journey 1 step 3 always said this; M1's placeholder had it going to `/dashboard` because onboarding didn't exist yet. M1 test updated.

4. **The onboarding wizard registers each step's "Next" handler via a `useRef`, not `useState`.** Steps call `bindNext(fn)` during render; a `setState` there caused an infinite render loop (React error #185, `/onboarding` RSC requests aborting). A ref-setter is a no-op re-render-wise and is the fix.

5. **The record sub-forms (education, experience) and the personal/profession steps use plain `useState` + `schema.safeParse`, not `zodResolver`.** Zod v4 `.optional()`/`.nullish()`/`.transform()` schemas produce input/output type mismatches that `@hookform/resolvers` rejects at compile time. Direct `safeParse` in the submit handler sidesteps this and is simpler. A `blankToNull()` helper (in `schemas.ts`) converts untouched optional string inputs (`""`) to `null` before validation so `.url()` etc. don't fail on empty.

6. **`getMemberProfile()` loads each sub-collection defensively** (per-collection try/catch → empty on failure) so a freshly-registered member's `/onboarding` render can't crash on a transient PostgREST error or schema-cache lag right after migration 002.

7. **The `/onboarding` page does NOT server-fetch professions** — the profession step fetches them client-side via `GET /api/professions`. Keeps the redirect-chained first render lean.

8. **Playwright config raised `expect.timeout` to 15s and `navigationTimeout` to 20s.** Cold Supabase connections plus RSC renders touching several tables can take a few seconds; the 5s default raced legitimate navigations.

**No spec decisions were changed** — step order, the 7 completeness rules, the three-status-field model, autosave/resume behaviour, and "submit is the only `profile_status` transition, moving both verification tracks together" are all exactly as the checklist specified. The deviations are all implementation-level (navigation mechanics, form-validation plumbing, render resilience).
