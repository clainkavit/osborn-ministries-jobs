# Stage 24 — M4 Pre-Implementation Review

Written 2026-09-11, by Claude, at Champion's request, before any M4 code. Inspects [stage-18-development-milestones.md](stage-18-development-milestones.md)'s M4 definition against every relevant spec document (Stages 3, 5, 6, 7, 8, 9, 13, 15, 16, 17, 20) and the current codebase (M1-M3, done and verified: 18/18 M3 acceptance, 10/10 M1 regression, 11/11 M2 regression, 51/51 unit tests). This document does not resolve any contradiction it finds — it names each one and asks for a decision. **No M4 code has been written.**

---

## 1. The exact M4 goal

Per [stage-18-development-milestones.md](stage-18-development-milestones.md):

> **M4 — Directory.** Professional directory (search/filter), admin professional profile view, the both-tracks-required visibility gate (Stage 13's directory-visibility scenario is the milestone's core acceptance test). **Demoable as:** an admin can search and find M3's verified members. Still no opportunities — this proves the "know your people" half of the product independent of the "connect them to opportunities" half.

Three deliverables: (1) a real Professionals directory screen with search/filter, (2) a real Admin Professional Profile screen, (3) confirmation that the visibility gate (already built and unit-tested in M3) holds under this screen.

---

## 2. M4 scope

From Stage 17's screen specs, Stage 6 Journey 6, Stage 13's acceptance scenarios, and Stage 5's P0 list:

- **Professionals (Directory) screen** — search (name/profession/skill) + filters (profession, location, experience, availability) + results list (table desktop / cards mobile) + empty/loading states.
- **Admin Professional Profile screen** — a real screen (not the current `/admin/verification/[memberId]` stand-in) showing profile sections (professional information, experience, education, skills, certifications, documents, verification history) plus Contact/Shortlist actions in their *correct disabled/hidden state* for a product with no opportunities yet.
- **The directory-visibility gate**, re-confirmed under real search/filter query paths (the gate itself — `isDirectoryVisible()`, the RLS admin-read policies, `getDirectoryProfessionals()` — already exists from M3; M4's job is to build the full-featured screen on top of it, and to prove filters/search never leak a non-visible member).
- Regression: M1, M2, M3 all pass unchanged.

---

## 3. Explicitly OUT-OF-SCOPE items

Per Stage 18's own milestone boundaries and Stage 5's P1/P2 split, none of the following belong in M4:

- **Opportunities, Applications, Matching** (M5/M6/M7) — no Create Opportunity flow, no Application entity, no match scoring, no Find Matches screen.
- **Shortlist as a working action** — Stage 6 Journey 6 step 5 and Stage 17 both describe "shortlist directly against a chosen opportunity," which requires an opportunity to exist. M4 has none. The Shortlist button/action must be either absent or visibly disabled with an honest reason, not a fake success path.
- **Contact info reveal** — Stage 8's staged-visibility model releases phone/email at Shortlisted. With no Applications entity in M4, Contact must render as **disabled/hidden**, never as a working reveal. `GET /professionals/:id`-equivalent must return `phone: null, email: null` unconditionally in M4 (there is no Shortlisted state to check against yet).
- **Education-level filter** — Stage 5 explicitly marks this P1 ("eventually"). Also: no `education.level` column exists in the schema (`qualification` is free text); there's nothing to filter on even if it were in scope.
- **Industry filter** — appears in Stage 3's mockup text but not in Stage 5's P0 filter list (see §12, Discrepancy 2).
- **Verification filter** — appears in Stage 3/5/16's filter lists but Stage 17 flags it as non-functional under the AND-gate (see §12, Discrepancy 1) — do not build a working filter for this without a decision.
- **Certifications upload UI** — the `certifications` table exists (migration 002) but M2 built no UI for it, so every member's certifications list will be empty. The Admin Professional Profile's Certifications section should show a correct empty state, not attempt to backfill upload UI (that's out of M2/M3/M4's stated scope entirely — no stage document assigns it to any milestone yet).
- **Applications section content** — same as above: the section exists in Stage 3's mockup, but no Application entity exists until M7. Empty state only.
- **Analytics/impact dashboard, admin Settings, admin Members (distinct from Professionals), Opportunities/Applications nav pages** — all separate `/admin/*` routes already stubbed as `ComingSoon`; none are M4.
- **Any new database migration touching `members`, `education`, `experience`, `skills`, or verification** — M4 is a **read** milestone. No new write paths, no new status transitions, no schema changes to those tables are implied by anything in Stage 17/18. (A new index migration for search performance is a legitimate *technical* addition — see §14 — but is not a product-schema change.)

---

## 4. Every screen/page M4 is expected to create or modify

| Screen | Status | Action |
|---|---|---|
| **Professionals (Directory)** — `/admin/professionals` | Currently a minimal M3 stub (unstyled list, no search, no filters, links to `/admin/verification/[memberId]`) | **Replace** with the real screen per Stage 17: search input, filter controls, table/card results, loading skeleton, empty-search-results state |
| **Admin Professional Profile** — needs its own route (Stage 17 implies `/admin/professionals/:id`; no such route exists today — the M3 stub links to `/admin/verification/[memberId]` instead, which is the *Verification Review* screen, a different screen with a different purpose) | Does not exist as its own screen | **Create.** Two-column desktop / stacked mobile per Stage 17, sections per Stage 3: professional information, experience, education, skills, certifications, documents, verification history. Contact/Shortlist actions present but disabled (see §3). |
| `/admin/verification/[memberId]` (Verification Review) | Exists, working, M3-scoped | **No change.** Stays the admin's verification-decision screen; the new Admin Professional Profile is a read-only view, a different screen with a different job (Stage 17 lists them as two separate entries). Whether one links to the other is a design decision, not a functional overlap — see §13. |
| Admin dashboard "Verified Professionals" stat (currently hardcoded to `0`, per `app/src/app/admin/(protected)/dashboard/page.tsx`) | Stub | Candidate for a real count once `getDirectoryProfessionals()` (or equivalent) is the M4 source of truth — **flagged, not assumed**, since Stage 18 doesn't explicitly assign this to M4. |

---

## 5. Every database table/field M4 needs

**No new tables.** M4 reads existing tables only:

- `members` — `id, first_name, last_name, location, primary_profession_id, profession_freetext, job_title, industry, employment_status, years_of_experience, availability, membership_status, credentials_status, profile_status, photo_url`. All present since migrations 001/002.
- `professions` — `id, name, category, synonyms` (for profession filter dropdown + display name resolution). Present since 002.
- `skills` / `member_skills` — for the skill search dimension and the Skills section. Present since 002.
- `education`, `experience`, `certifications`, `documents` — for the Admin Professional Profile's sections. Present since 002; already admin-SELECT-able (migration 003).
- `verification_history` — for the Verification history section. Present since 003; already admin-SELECT-able.

**Fields that do NOT exist and would need a decision + migration if wanted:** `education.level` (normalized enum), a phone/email visibility flag independent of Applications (none needed — M4 returns them as always-null per §3), any full-text-search column/index.

---

## 6. Every server action/API M4 needs

All read-only. Following the existing M3 pattern (`lib/<domain>/queries.ts`, Server Components calling them directly — no new Route Handlers required unless a client-side search-as-you-type experience is chosen, see §13):

- **Directory search/filter query** — extends (or replaces) `getDirectoryProfessionals()` in `lib/directory/queries.ts` to accept search text + filter params (profession, location, min-experience, availability) and apply them server-side, on top of the existing gate. The gate predicate itself (`isDirectoryVisible`) does not change.
- **`getMemberProfileForAdmin(memberId)`** — already exists (built in M3 for the Verification Review screen) and already returns the full shape the Admin Professional Profile needs (profession, education, experience, skills, documents). Reusable as-is; whether the new screen imports this directly or the screen's own query wraps it is an implementation detail, not a spec question.
- **`getVerificationHistory(memberId)`** — already exists (M3), reusable for the profile's Verification history section.
- No new mutation actions. No new notification types. No new verification-history actions.

---

## 7. Authorization/RLS requirements

**Already satisfied by migration 003, verified working in M3:**
- `is_church_admin()` (now `SECURITY DEFINER`, recursion bug fixed) — the base admin check.
- `members` SELECT: "Admins read all members" — already in place.
- `education`, `experience`, `member_skills`, `certifications`, `documents` SELECT: admin policies already in place.
- `verification_history` SELECT: admin policy already in place.
- Storage: "Admins read member documents storage" — already in place (so a CV/document link on the Admin Professional Profile can resolve).

**M4 needs no new RLS policies for the read paths listed above.** The one item worth double-checking, not assuming: whether the *directory* query path (as opposed to the *Verification Review* path, which is what actually exercises "Admins read all members" today) is provably gated the same way once real filters run — i.e., a filter parameter must never be able to widen the result set past the `isDirectoryVisible()` predicate. This is a server-code discipline requirement (apply the gate `.eq()`/`.in()` clauses unconditionally, then layer filters on top), not a new policy.

A plain `MEMBER` role must never reach `/admin/professionals` or the new Admin Professional Profile route — already enforced by the existing `/admin/*` middleware gate (M1), re-confirmed by M3's own acceptance test 16 for the sibling `/admin/verification` route. The equivalent test for the new routes belongs in M4's acceptance suite (see §11).

---

## 8. Important business rules

Restated from M1-M3 and the specs read for this review — **none of these should be reinterpreted or re-derived by M4; they are inputs to it:**

- **Directory visibility gate (accepted product rule, established in M3):** `membership_status = 'CONFIRMED' AND credentials_status IN ('REVIEWED', 'REVIEW_PENDING')`. `REVIEW_PENDING` stays visible by deliberate decision (Stage 7's reverification reasoning). This is the single predicate the whole milestone exists to expose through a real screen — it must not change.
- **Availability is a directory filter dimension, and Stage 13's own acceptance scenario gives it a specific semantics for THIS screen:** filtering to "Available" shows `OPEN` members only — `SELECTIVE` and `NOT_AVAILABLE` are both excluded. (Note: this is narrower than M6's matching-gate semantics, where only `NOT_AVAILABLE` is excluded and `SELECTIVE` is scored at partial weight. The two screens have different jobs and, per Stage 9 and Stage 13 read together, legitimately different filter behavior — not a contradiction, but worth stating explicitly so M6 doesn't get built by copying M4's filter logic.)
- **Contact info stays hidden in M4, unconditionally** — Stage 8's staged-visibility model has no state in which M4 (no Applications entity exists) can honestly show phone/email. `null`/hidden is correct, not a placeholder to fix later.
- **Badge wording is exact and regression-tested:** "Membership confirmed" / "Credentials reviewed," never "Verified" alone. Applies to any badge M4 renders (directory list, Admin Professional Profile).
- **The three independent status fields (`profile_status`, `membership_status`, `credentials_status`) are never merged or reinterpreted** — M4 only reads them through the existing gate predicate.
- **Search, per Stage 13's own acceptance scenario, is exact/substring text match only** — no synonym matching (Stage 10's taxonomy classification is P1, not shipped). A search for "Engineer" matching "Civil Engineer" is expected; a search for "Structural Engineer" matching "Civil Engineer" is explicitly NOT expected to work in M4.

---

## 9. User journeys affected

- **Journey 6 — Church Admin searching the directory directly.** This is M4's primary journey. Steps 1-4 (open directory, search/filter, see results, open a profile) are fully in scope. **Step 5 ("shortlist directly against an existing opportunity, or note them for a future one") is NOT in scope** — no opportunity exists to shortlist against in M4. The journey document itself calls the "note for later" path P2 and out of its own scope, so M4 need not build a substitute either.
- **Journey 5 — Church Admin creating an opportunity and finding matches.** Not M4's journey (M5/M6), but Journey 5's closing note says "Both [Journey 5 and 6] use the same directory/filter machinery underneath" — meaning the search/filter query logic M4 builds should be written in a way M6's Find Matches screen can plausibly reuse or parallel later, without over-engineering for that now (no requirement to abstract prematurely; just don't paint into a corner with journey-6-only assumptions baked into the query shape).
- **No member-facing journey is affected.** M4 is entirely admin-facing; nothing in it changes what a member sees or can do.

---

## 10. Dependencies on M1, M2, and M3

- **M1** — admin auth/role gate (`/admin/*` middleware), `getCurrentMember()`. Unmodified, reused as-is.
- **M2** — the profile fields being searched/filtered/displayed (profession, education, experience, skills, documents) all come from M2's data model and write actions. M4 reads; it must never write to any M2-owned field or table.
- **M3** — this is the load-bearing dependency. M4 cannot exist without:
  - The `isDirectoryVisible()` gate predicate and its unit tests.
  - The admin RLS policies on `members` and every sub-collection (migration 003, now recursion-fixed).
  - `getMemberProfileForAdmin()` and `getVerificationHistory()` — both already built for the Verification Review screen and directly reusable for the new Admin Professional Profile.
  - The `getDirectoryProfessionals()` stub, which M4 extends rather than replaces from scratch.
  - The verification badges component (`VerificationBadges`) for consistent wording.

  **M4 must not alter any M3 behavior** — the verification queue, verification review, correction flow, notifications, and the gate predicate itself are all frozen inputs. M3's regression suite (18 tests) must still pass 18/18 after M4 ships.

---

## 11. Acceptance criteria/tests

Directly from Stage 13's Directory & search section, restated as the concrete tests M4 must pass, plus the regression carryover:

1. **Directory visibility requires both tracks approved.** A member with Membership: Confirmed, Credentials: Pending does NOT appear in directory results. (Stage 13's own flagged "double-check the AND, not OR" scenario — the predicate already exists and is unit-tested; this test proves the *screen* doesn't leak around it.)
2. **Search returns relevant results.** A verified member with profession "Civil Engineer" appears when searching "Civil Engineer"; substring match "Engineer" also finds them; a true synonym search ("Structural Engineer") is NOT expected to match (Stage 10 not shipped).
3. **Filters narrow correctly.** Filtering to "Available" (per §8's stated M4-specific semantics) shows only `OPEN` members, excluding both `SELECTIVE` and `NOT_AVAILABLE`.
4. **A plain member cannot reach `/admin/professionals` or the new Admin Professional Profile route** — redirected, same pattern as M3's test 16.
5. **Badge wording regression** — the directory list and Admin Professional Profile both show "Membership confirmed" / "Credentials reviewed," never "Verified" alone. `getByText(/^Verified$/)` count 0.
6. **Contact info is never rendered** on the Admin Professional Profile in M4 (no state exists where it should show).
7. **Empty states render correctly** — directory with zero search results; a member with no certifications/experience/education/documents/applications shows the correct empty copy for each section, not a broken layout.
8. **M1 regression (10/10, 1 expected skip), M2 regression (11/11), M3 regression (18/18)** all still pass unchanged.

---

## 12. Contradictions between the existing specifications and the current implementation

**Discrepancy 1 — the "Verification" filter.** Stage 3 (UX mockup), Stage 5 (MVP freeze, marked **P0**), and Stage 16 (API shape, listed as a `GET /professionals` query param) all list "Verification" as a directory filter dimension. Stage 17 (screen specs) explicitly flags this as **non-functional**: *"verification filter is largely moot since only both-verified members appear at all, per Stage 7's gate, so a 'verification' filter here would only ever show one value... recommend dropping it from the UI... unless partial-visibility gets revisited."* This is a genuine three-document-vs-one-document conflict, not a minor wording gap — Stage 5 marks it P0 (must-build) while Stage 17 (written after, and closer to implementation) says building it is pointless. **Not resolved here.** See Decision 1 below.

**Discrepancy 2 — the "Industry" filter.** Stage 3's UX mockup text lists filters as "Profession, Industry, Location, Experience, Availability, Verification." Stage 5's P0 table lists only "profession, location, experience, availability, verification" — Industry is absent from Stage 5's authoritative P0 list. The `members.industry` column exists in the schema (migration 002), so building the filter is technically trivial, but Stage 5 (the scope-freeze document) doesn't ask for it. **Not resolved here.** See Decision 2 below.

**Discrepancy 3 — status-name looseness in Stage 20.** Stage 20 (technical architecture) states the gate as *"Membership = CONFIRMED AND Credentials = REVIEWED/CONFIRMED"* — but `CONFIRMED` is not a valid `credentials_status` value (the enum is `NOT_SUBMITTED | PENDING | REVIEWED | NEEDS_CORRECTION | REVIEW_PENDING`; membership's `CONFIRMED` and credentials' `REVIEWED` are distinct labels for the two tracks' terminal states). This reads as loose phrasing rather than a real behavioral disagreement — Stage 20 predates M3's precise implementation — but it's worth naming exactly since a careless re-read of Stage 20 alone could reintroduce a wrong predicate. The implemented, tested, and Stage-23-ratified rule (`REVIEWED` or `REVIEW_PENDING`) is authoritative; Stage 20's phrasing is not a competing decision, just imprecise.

**Discrepancy 4 — the Admin Professional Profile route doesn't exist yet, and the M3 stub links somewhere else.** Stage 17 lists "Admin Professional Profile" (`GET /professionals/:id`) as a screen distinct from "Verification Review" (`GET /admin/members/:id` implied by the verify actions). The M3-built directory stub (`/admin/professionals`) currently links each row to `/admin/verification/[memberId]` — the Verification Review screen — because that was the only detail view that existed at M3 time. This is not a spec contradiction so much as **an M3-era placeholder decision M4 must now correct**: M4 should link directory rows to the new Admin Professional Profile screen, not continue borrowing the Verification Review screen for that purpose. Flagged so the wiring change is deliberate, not accidental.

---

## 13. Gaps or ambiguities that require a product decision

**Gap A — free-text profession search.** No spec document says whether directory search-by-profession should match `members.profession_freetext` (for a member whose profession wasn't in the taxonomy at onboarding) in addition to `professions.name` (for a member who picked from the taxonomy). Both fields exist; the search behavior for the free-text case is undefined. Needs a decision.

**Gap B — where the directory's search/filter logic lives relative to a future M6 reuse.** Journey 5's closing note says Journeys 5 and 6 "use the same directory/filter machinery underneath," but no document specifies whether that means literally shared code, or just conceptually similar logic independently built per-milestone. Given M4 and M6 already have *different* availability-filter semantics (per §8), building one literally shared function risks smuggling M4's semantics into M6 or vice versa. Recommend building M4's query as its own function now, and revisiting sharing (if any) when M6 is actually specified — but this is a judgment call worth naming, not silently deciding.

**Gap C — does the directory list link to the new Admin Professional Profile, the existing Verification Review screen, or both (e.g., a tab or a "Verification" button within the profile screen)?** Stage 17 describes them as two separate screens with two separate purposes (view vs. decide), but doesn't specify their cross-navigation. The M3 stub's current behavior (row → Verification Review) won't be correct once the real Admin Professional Profile exists, but nothing says whether an admin should also be able to jump from the new profile screen *into* Verification Review, or only the other direction. Needs a decision (a design decision, but one with real IA consequences worth deciding now rather than mid-build).

**Gap D — empty-state copy for a directory search returning zero results.** Stage 11 (states catalog) has copy for the *matching* zero-results case ("No matching professionals right now...") but nothing for a plain directory search/filter returning zero. Needs product copy, or an explicit decision to reuse/adapt the matching copy (which would be a slight misuse, since it's specifically worded around opportunity requirements, not a search).

**Gap E — should the admin dashboard's "Verified Professionals" stat (currently hardcoded `0`) become real in M4?** Nothing in Stage 18 assigns dashboard-stat wiring to M4 specifically, but it's a one-line natural side effect of M4 existing. Flagged rather than assumed, per the instruction not to expand scope for "nice to have."

---

## 14. Technical risks

- **No indexes on `members` for any searchable/filterable column** (`first_name`, `last_name`, `primary_profession_id`, `location`, `membership_status`, `credentials_status`, `availability` are all unindexed). At current scale (72 test members, single-digit real directory-visible members) this is invisible; it is a real risk if the congregation-scale rollout the product is meant for actually happens. Not a blocker for M4's acceptance criteria, but worth a follow-up migration (index-only, no schema/product change) either in M4 or immediately after.
- **This development environment's network path to the live Supabase project has shown highly variable latency** (documented at length during M3's testing — single queries ranging from ~200ms to 25+ seconds under load, root-caused partly to a local HTTP proxy and partly to the connection itself). A search-as-you-type UI (if chosen, see Decision 4) would be materially more exposed to this than M4's other, more static screens. Worth choosing a submit-triggered search over live-filter-as-you-type specifically to reduce request volume, independent of any UX preference.
- **72 test members already exist in the live database** from M1-M3's acceptance runs, most with obviously fake names/emails (`@m1test.com`, `@m2test.com`, `@m3test.com` patterns). M4's directory will display these once it's built. Not a bug, but worth deciding whether to clean up test data before a real demo, and whether M4's own acceptance tests should account for this pre-existing noise when asserting exact result counts (recommend asserting a specific test member's presence/absence, not a total count, exactly as M3's own tests already do).
- **`getMemberProfileForAdmin()` currently issues 5 sequential/parallel Supabase calls per profile load** (profession, education, experience, skills, documents) — fine for a single Verification Review page load, but if the Admin Professional Profile is opened frequently (the "most-used admin screen" per Stage 3), this is worth being aware of, not necessarily optimizing preemptively.

---

## 15. Proposed implementation order

(Proposed only — not started, pending the decisions in §16.)

1. Write an `stage-24-m4-implementation-checklist.md`-equivalent build plan once the decisions below are made (matching the M2/M3 pattern: reconcile specs, document decisions, THEN build).
2. Extend `getDirectoryProfessionals()` (or its replacement) with search text + filter params, still server-enforcing the gate first.
3. Build the Admin Professional Profile screen and its query wiring (mostly reusing `getMemberProfileForAdmin`/`getVerificationHistory` as-is).
4. Build the real Professionals directory screen (search box, filter controls, results table/cards, loading/empty states) wired to the extended query.
5. Fix the M3-era stub's routing (directory row → new Admin Professional Profile, not Verification Review) per Gap C's resolution.
6. Unit tests for the extended filter/search predicate (pure logic, same pattern as M3's `rules.ts` tests).
7. `m4-acceptance.spec.ts` covering §11's scenarios; re-run `m1-acceptance`, `m2-acceptance`, `m3-acceptance` unchanged.
8. Document deviations, exactly as Stages 21-23 each did for their own milestone.

---

## 16. M4 decisions needed

Only the items that genuinely require product/Champion approval before implementation — everything else above is either already decided by an earlier stage document or is an implementation detail I can make without changing product behavior.

1. **The Verification filter (Discrepancy 1).** Stage 5 marks it P0; Stage 17 says it's non-functional and recommends dropping it. Build a filter that will only ever show one value (matching Stage 5's letter), or drop it from the UI (matching Stage 17's later, more specific recommendation)?
2. **The Industry filter (Discrepancy 2).** Not in Stage 5's authoritative P0 filter list, but present in Stage 3's mockup and trivial to build (column exists). In scope for M4, or deferred?
3. **Free-text profession search (Gap A).** Should directory search match `profession_freetext` in addition to the taxonomy `professions.name`?
4. **Search interaction model (technical-risk-adjacent, but a real UX decision).** Submit-triggered search (button/Enter) vs. live filter-as-you-type? Recommend submit-triggered given this environment's connection variability, but it's your call.
5. **Directory-row → profile screen routing (Gap C).** Does a directory row link to the new Admin Professional Profile only, or should there also be a path from there into Verification Review (and if so, is it a button, a tab, or something else)?
6. **Zero-results empty-state copy (Gap D).** New copy needed for "directory search/filter returned nothing" — none exists in Stage 11. What should it say?
7. **Admin dashboard "Verified Professionals" stat (Gap E).** Wire it to real data as a side effect of M4, or leave it at the hardcoded `0` until a milestone explicitly claims it?
