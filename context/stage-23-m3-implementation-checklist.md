# Stage 23 — M3 Implementation Checklist

Written 2026-09-10, reconciling every authoritative spec that touches verification: [stage-7-state-machines.md](stage-7-state-machines.md) (the verification state machine + the 2026-09-10 reverification-on-edit decision + the directory-visibility gate), [stage-6-user-journeys.md](stage-6-user-journeys.md) Journeys 2 & 4, [stage-11-states-catalog.md](stage-11-states-catalog.md), [stage-12-notification-copy.md](stage-12-notification-copy.md), [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md) (the Verification + regression scenarios), [stage-15-data-model.md](stage-15-data-model.md) (VerificationHistory, Admin), [stage-16-api-shape.md](stage-16-api-shape.md) (verification + directory endpoints), [stage-17-screen-specs.md](stage-17-screen-specs.md) (Verification Queue, Verification Review, Admin Professional Profile, Professionals directory), [stage-21-m1-implementation-spec.md](stage-21-m1-implementation-spec.md) (the `members` status enums + RLS foundation), and [stage-22-m2-implementation-checklist.md](stage-22-m2-implementation-checklist.md) (what onboarding already built).

M3 is "Verification" per [stage-18-development-milestones.md](stage-18-development-milestones.md): *"Verification Queue, Verification Review, the two independent tracks (Membership/Credentials) and their state machine, audit trail (VerificationHistory), member-facing correction flow (Journey 2). Demoable as: an admin can review M2's test profiles and approve/reject them; a member sees their badges change and can respond to a correction request."*

**No new product behavior is invented.** Contradictions and gaps are documented below and resolved by authority.

---

## Preserved from earlier stages (must not regress)

- **Membership and credentials verification are two independent tracks.** Separate columns (`membership_status`, `credentials_status`), separate endpoints, separately approved. A member can be `membership_status = CONFIRMED` while `credentials_status = PENDING`. Never merge, never couple beyond the shared submit entry point.
- **`REVIEW_PENDING`** (credentials only) exists in the enum for reverification-on-edit — the lighter-weight marker used when a verified member edits Experience. M3 implements the trigger for it.
- **`PROFILE_COMPLETE`** is the submitted-profile state (`profile_status`). M3 never changes `profile_status` — that transition belongs to M2's `submitForVerification`.
- **The M2 onboarding flow is untouched.** M3 adds admin screens + a member correction path; it does not rework the 8-step wizard, the completeness rules, or `submitForVerification`.
- **Approved badge wording is exact**, per [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s regression scenario and the M2 `verification-badges.tsx` component: **"Membership confirmed"** and **"Credentials reviewed"**. Never "Verified", never "Church Verified". M3 reuses `VerificationBadges` verbatim — it already renders every status (Confirmed/Reviewed/Pending/Needs Correction). M3 adds only the `REVIEW_PENDING` display case (credentials: "Credentials — updates in review", tone pending) since M2's component maps `REVIEW_PENDING` to "in review" already — confirm that reads acceptably; no new *approved* wording.
- **Out of scope, unchanged:** AI matching, messaging, employer portal, projects, business network, impact dashboard, Kanban, privacy-settings page, notification preferences. M3 touches none of them.

---

## The verification state machine (from Stage 7, restated for implementation)

Two tracks, each on `public.members`.

**Membership** (`membership_status`): `NOT_SUBMITTED → PENDING → CONFIRMED`, with `PENDING → NEEDS_CORRECTION → (member resubmits) → PENDING`. `SUSPENDED` reserved, no M3 trigger.

**Credentials** (`credentials_status`): `NOT_SUBMITTED → PENDING → REVIEWED`, with `PENDING → NEEDS_CORRECTION → (member resubmits) → PENDING`. Plus `REVIEW_PENDING` — see reverification-on-edit below.

**Transitions M3 implements:**

| From | To | Trigger | Side effects |
|---|---|---|---|
| `PENDING` | `CONFIRMED` (membership) / `REVIEWED` (credentials) | Church Admin approves that track | write VerificationHistory row (Approved); notify member; **if this makes BOTH tracks terminal-approved, member becomes directory-visible** |
| `PENDING` | `NEEDS_CORRECTION` | Church Admin requests correction on that track | write VerificationHistory row (Needs Correction, with note); notify member with the note |
| `NEEDS_CORRECTION` | `PENDING` | Member edits the flagged track's section(s) and resubmits | write VerificationHistory row (Resubmitted); re-enters the admin queue; **NOT straight to CONFIRMED/REVIEWED** ([stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md) is explicit) |
| `CONFIRMED`/`REVIEWED` (credentials) | `PENDING` or `REVIEW_PENDING` | Member edits a credential-affecting field — see reverification-on-edit | write VerificationHistory row (Auto-reverification); re-enters queue |

**M3 never touches `profile_status`.** A member is always `PROFILE_COMPLETE` throughout every M3 flow (they submitted in M2 to get here).

---

## Reverification-on-edit (Stage 7's 2026-09-10 DECIDED rule — M3 implements it)

M2 left this unimplemented (M2's edit actions all gate on `profile_status = REGISTERED`, so a `PROFILE_COMPLETE` member can't currently edit at all — see Gap 1 below). M3 implements both the edit paths and the reverification triggers.

| Field edited (by a `PROFILE_COMPLETE` member) | Effect on `credentials_status` | Effect on `membership_status` |
|---|---|---|
| Phone, profile photo, gender, location, job title, industry | none | none |
| Availability | none (M2's dashboard toggle already allows this while `PROFILE_COMPLETE`) | none |
| **Profession** (`primary_profession_id` / `profession_freetext`) | → `PENDING` (full reset — re-enters queue, leaves the verified directory) | none |
| **Education** — adding/editing a qualification | → `PENDING` (full reset) | none |
| Education — a pure typo fix to an already-reviewed institution name | implementation judgment call, not a rule (Stage 7) — **M3 decision: any education write triggers `PENDING`**, since distinguishing "typo" from "substantive" reliably is not feasible and the conservative choice protects the badge. Documented as an implementation choice, not a spec change. |
| **Experience** — adding/editing/removing a role, or the step-level status/years | → `REVIEW_PENDING` (lighter marker — stays in the directory per Stage 7's reasoning, but flagged for admin re-review) | none |

- `NEEDS_CORRECTION → PENDING` on resubmission takes precedence: if a track is already `NEEDS_CORRECTION`, a qualifying edit + resubmit moves it to `PENDING` (the normal correction path), not a redundant reset.
- Editing while a track is `PENDING` or `REVIEW_PENDING` already: no additional transition (it's already in/near the queue), but still write a VerificationHistory row noting the edit so the admin sees what changed.
- **Membership track is never affected by any profile edit** (Stage 7 — membership is about attendance, not professional claims).

---

## Directory-visibility consequences (Stage 7's DECIDED gate + Stage 13's regression-worthy scenario)

**A member appears in the admin directory / is match-eligible ONLY when `membership_status = CONFIRMED` AND `credentials_status = REVIEWED`.** Both, ANDed, server-enforced.

- `credentials_status = REVIEW_PENDING` does **not** count as approved for the gate — wait: Stage 7 says a `REVIEW_PENDING` member "stays in the directory" because the reset is "lighter-weight". **Contradiction — resolved below (Contradiction C).**
- The gate is enforced in the `GET /professionals` query (`stage-16` note: *"should only ever return members where both verification tracks are Confirmed/Reviewed, enforced server-side, not left to the frontend to filter"*), and mirrored in RLS so an admin's direct table read can't bypass it.
- [stage-17-screen-specs.md](stage-17-screen-specs.md) recommends **dropping the "verification" filter** from the Professionals directory UI, since with the AND-gate every listed member has the same value. M3 follows that recommendation.
- M3 does NOT build the full Professionals directory screen (that's M4). M3 builds only what the demo needs: the gate logic + a minimal admin view of a single member's profile from the Verification Review screen. The `GET /professionals` endpoint's gate can be stubbed/asserted via a test even before the M4 screen exists.

---

## Contradictions found and resolved by authority

**Contradiction A — correction scope: field, section, or whole profile?**
[stage-6-user-journeys.md](stage-6-user-journeys.md) Journey 2 step 3 says *"Member edits the flagged section only (not forced to redo the whole profile)"* and its own note flags that the PRD never pinned this down, assuming "section-level ... since that matches the admin review screen's per-section approve controls". [stage-17-screen-specs.md](stage-17-screen-specs.md) Verification Review has a single free-text Notes field per correction, not per-field.
**Resolution (by authority — Journey 2 + Stage 17):** a correction is issued **per track** (Membership or Credentials), with a free-text note. The member is shown the note and can edit **any field that track covers**:
- Membership track correction → member can edit personal-identity fields (name is fixed at registration; location, and — for M3's minimal scope — that's it, since M3 has no church/branch membership-number field yet; the note tells them what the admin needs, e.g. "confirm which branch you attend" handled out-of-band for now).
- Credentials track correction → member can edit profession, education, experience, skills, CV (the credential-bearing fields).
This is not "one field" and not "the whole profile" — it's "the fields relevant to the track that was flagged", which is what Journey 2's "flagged section" means when there are exactly two tracks. **No new behavior invented** — this is the narrowest reading consistent with both source docs.

**Contradiction B — "Needs correction with no note": hard block or soft warning?**
[stage-11-states-catalog.md](stage-11-states-catalog.md) row: *"Soft warning, not a hard block: 'Add a note so the member knows what to fix?'"* and its closing note: *"this document recommends soft ... a judgment call, not fully decided."* [stage-17-screen-specs.md](stage-17-screen-specs.md): *"Request correction on either (requires — or per Stage 11's soft-warning recommendation, strongly nudges toward — a note)."*
**Resolution (by authority — Stage 11 is the more specific document and states a recommendation):** **soft warning.** The admin can proceed without a note after confirming a "Add a note so the member knows what to fix?" prompt. Journey 2 step 2 requires the note be *visible* if present; it does not require one to exist. Recorded as Stage 11's recommendation adopted, not a new decision.

**Contradiction C — does `REVIEW_PENDING` gate the directory?**
Stage 7's Discoverability rule says both tracks must be `CONFIRMED`/`REVIEWED`. Stage 7's reverification-on-edit rule says a member whose credentials went to `REVIEW_PENDING` (via an Experience edit) "stays in the directory ... rather than pulling the member fully out". These conflict: `REVIEW_PENDING ≠ REVIEWED`, so the AND-gate would exclude them, contradicting "stays in the directory".
**Resolution (by authority — the reverification rule is the later, more specific decision and explicitly reasons about this exact case):** `REVIEW_PENDING` **counts as "still visible" for the directory gate**. The gate is: `membership_status = CONFIRMED` AND `credentials_status IN (REVIEWED, REVIEW_PENDING)`. A member with `credentials_status = PENDING` or `NEEDS_CORRECTION` is NOT visible. This preserves Stage 7's stated intent that an Experience edit "leaves the member in search results". [stage-13-acceptance-criteria.md](stage-13-acceptance-criteria.md)'s "directory visibility requires both tracks approved" scenario still holds as written — it tests `credentials_status = PENDING`, which is correctly excluded.
**Flag:** this is the one place M3's checklist resolves a genuine two-way conflict in Stage 7 itself. If the intent was that `REVIEW_PENDING` should also drop out of the directory, that reverses Stage 7's explicit "stays in" reasoning and needs Champion's call — but the checklist proceeds with "REVIEW_PENDING stays visible" as the reading that honors the more specific, more recent decision.

**Contradiction D — where does the member see the correction note and edit?**
Journey 2 step 2: *"Dashboard shows a flagged item ... with the admin's note visible."* [stage-12-notification-copy.md](stage-12-notification-copy.md): the notification *"links directly to the flagged section."*
**Resolution:** no contradiction, just two surfaces. M3 builds **both**: (a) the member dashboard shows a "Your profile needs a correction" card with the note and a "Fix it" button when either track is `NEEDS_CORRECTION`; (b) the notification links to the same place. The "fix it" destination is a new member-facing **correction screen** (see Screens below) — NOT `/onboarding` (that redirects a `PROFILE_COMPLETE` member away).

---

## Gaps M2 left that M3 must close

**Gap 1 — a `PROFILE_COMPLETE` member cannot edit anything.**
Every M2 edit action (`savePersonal`, `saveProfession`, `addEducationRecord`, etc.) calls `requireRegisteredMember()`, which returns an error unless `profile_status = REGISTERED`. The `/profile` "Edit" link routes to `/onboarding`, which redirects a `PROFILE_COMPLETE` member to `/dashboard`. So Journey 2's "member edits the flagged section" is currently impossible.
**M3 closes this by:** adding a **post-submission edit path** — a set of server actions (or a relaxation of the existing ones) that a `PROFILE_COMPLETE` member can call, gated instead on "member owns this profile" (not on `REGISTERED`). These actions apply the reverification-on-edit rules above. The M2 `REGISTERED`-only actions stay as-is for the onboarding flow; M3 adds parallel `*ForReview` actions or a shared core with a status-aware guard. **Decision: refactor to a shared guard** — `requireOwnProfile()` (any status) for the write, then a `reverificationEffect(field)` helper decides the status change. The onboarding wizard keeps calling the same actions; while `REGISTERED` the reverification effect is a no-op (nothing to reverify yet).

**Gap 2 — no `verification_history` table.**
Stage 15 specifies `VerificationHistory (id, member_id, track, action, admin_id, note, created_at)`. It does not exist. Migration 003 creates it. `action` enum widened from Stage 15's `Approved | Needs Correction` to also include `RESUBMITTED` and `AUTO_REVERIFICATION` (the member-side and system-side transitions Stage 7 describes but Stage 15's two-value list omitted) — **flagged as an enum extension, not a behavior change**: Stage 7 already describes these transitions; they need to be audit-logged per Stage 13's "audit trail exists for every verification decision" scenario, and "decision" reasonably includes the resubmit that re-enters the queue.

**Gap 3 — no admin RLS policies.**
M1's RLS: members see/edit only their own row. M2's RLS: members CRUD only their own sub-collection rows. **Nothing lets a Church Admin read another member's profile or write verification status.** Migration 003 adds admin policies (see Permissions/RLS below).

**Gap 4 — no notifications table / delivery.**
[stage-15-data-model.md](stage-15-data-model.md) specifies a `Notification` entity; [stage-12-notification-copy.md](stage-12-notification-copy.md) has the copy. M2 didn't build it (M2 had no notification triggers). M3 has three member-facing triggers (membership confirmed, credentials reviewed, needs correction). Migration 003 creates `notifications`; M3 builds a minimal in-app notification list + the dashboard bell count. This is P0 per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md) ("In-app notifications | P0") and unavoidable for M3's demo ("a member sees their badges change").

**Gap 5 — `getMemberProfile()` and the member `/profile` view assume the member is viewing themselves.**
M3's admin needs to load *another* member's full profile for the Verification Review screen. Add `getMemberProfileForAdmin(memberId)` — same shape as `getMemberProfile`, admin-authorized, no `auth.uid()` self-scoping.

---

## Database (migration 003)

**New table `verification_history`:**
```
id           uuid pk
member_id    uuid not null → members(id) on delete cascade
track        text not null check in ('MEMBERSHIP', 'CREDENTIALS')
action       text not null check in ('APPROVED', 'NEEDS_CORRECTION', 'RESUBMITTED', 'AUTO_REVERIFICATION')
note         text                       -- present for NEEDS_CORRECTION (optional per Contradiction B); may be present for others
actor_admin_id uuid → members(id)       -- the acting Church Admin; null for RESUBMITTED (member) and AUTO_REVERIFICATION (system)
actor_member_id uuid → members(id)      -- the member, for RESUBMITTED; null otherwise
created_at   timestamptz not null default now()
```
Named `actor_admin_id` / `actor_member_id` rather than Stage 15's single `admin_id` because M3's audit trail must record member-initiated and system-initiated events too (Gap 2). Stage 15's `admin_id` maps to `actor_admin_id`.

**New table `notifications`** (Stage 15's `Notification`, minimal M3 subset):
```
id            uuid pk
member_id     uuid not null → members(id) on delete cascade
type          text not null            -- 'MEMBERSHIP_CONFIRMED' | 'CREDENTIALS_REVIEWED' | 'CORRECTION_REQUESTED'
body_text     text not null            -- the resolved copy, stored at creation
related_url   text                     -- deep link target (e.g. /profile/corrections)
read_at       timestamptz
created_at    timestamptz not null default now()
```
Stage 15's `related_entity_type`/`related_entity_id` polymorphic pair is simplified to a `related_url` string for M3 (the only consumers are three notification types with fixed destinations). Flag: if M4+ needs entity references, widen then.

**No `members` schema change.** All four status enums already have every value M3 needs (`NOT_SUBMITTED, PENDING, CONFIRMED, NEEDS_CORRECTION, SUSPENDED` for membership; `+ REVIEWED, REVIEW_PENDING` for credentials). Confirmed against migration 001.

**RLS (migration 003):**

- `verification_history`:
  - Members `SELECT` their own rows (`member_id = current_member_id()`) — powers the member-facing "what the admin said" view.
  - Church Admin / Super Admin `SELECT` all, `INSERT` (the write happens through a server action that also updates `members`, but the policy must permit it).
  - No `UPDATE`/`DELETE` for anyone — an audit trail is append-only.
- `notifications`:
  - Members `SELECT` + `UPDATE` (to set `read_at`) their own rows.
  - Server actions insert them (admin-triggered or system-triggered); the insert runs in the action's context — needs an `INSERT` policy for `authenticated` scoped so `member_id` can be any member (an admin approving member X creates a notification for X). Scope: `INSERT` allowed when the caller is a Church Admin/Super Admin OR `member_id = current_member_id()` (self, for the resubmit-confirmation case if any).
- `members` (new admin policies):
  - Church Admin / Super Admin `SELECT` any row — needed for the Verification Review screen and the directory gate.
  - Church Admin / Super Admin `UPDATE` `membership_status`, `credentials_status` **only** — not `role`, not `profile_status`, not the profile fields. Postgres RLS can't restrict *which columns* an UPDATE touches, so this is enforced in the server action (the action only ever sets those two columns) and the policy is `UPDATE` for admins with a `WITH CHECK` that the row's `role` is unchanged and still `MEMBER` (defense in depth against an admin escalating someone).
  - A helper `public.is_church_admin()` returning bool (mirrors `current_member_id()`), used by every admin policy.
- Sub-collections (`education`, `experience`, `member_skills`, `certifications`, `documents`): add Church Admin / Super Admin `SELECT` (read-only — admins review, they don't edit member data). Members keep their existing full CRUD on their own rows.
- Storage bucket `member-documents`: add a Church Admin / Super Admin `SELECT` policy so the Verification Review screen can open a member's CV.

**Migration 003 also adds** an admin account seeding note (not SQL): M3's demo needs a `CHURCH_ADMIN`. Per M1's pattern, this is done by registering a normal account then `UPDATE members SET role = 'CHURCH_ADMIN' WHERE email = '…'` in the SQL editor. Documented in the M3 acceptance-test prerequisites, same as M1.

---

## API / server actions M3 implements

From [stage-16-api-shape.md](stage-16-api-shape.md), all four verification endpoints:

```
GET  /admin/verification-queue          — tabs: All | Pending | Approved | Needs correction
POST /admin/members/:id/verify-membership   body: { decision: 'APPROVED' | 'NEEDS_CORRECTION', note?: string }
POST /admin/members/:id/verify-credentials   body: { decision: 'APPROVED' | 'NEEDS_CORRECTION', note?: string }
GET  /admin/members/:id/verification-history
```

Plus, to close the gaps:

```
GET  /admin/members/:id                  — full profile for the Verification Review screen (Gap 5)
GET  /members/me/notifications           — the member's in-app notifications
PATCH /members/me/notifications/:id/read
GET  /members/me/corrections             — the member's active NEEDS_CORRECTION tracks + notes (drives the dashboard card + correction screen)
POST /members/me/resubmit-for-review     — member's "I've fixed it" action: NEEDS_CORRECTION track(s) → PENDING, writes RESUBMITTED history rows, notifies nobody (admin sees it in the queue)
```

Post-submission edit actions (Gap 1) — either new `*` actions or the M2 actions refactored to a status-aware guard (decision: refactor). Each, on a successful write by a `PROFILE_COMPLETE` member, applies `reverificationEffect(field)` per the table above and writes an `AUTO_REVERIFICATION` history row if a status changed.

**Every verify-* action, server-side, in order:** authenticate → assert caller is Church Admin/Super Admin → assert target member exists and is `PROFILE_COMPLETE` → assert the target track is currently `PENDING` or `REVIEW_PENDING` (can't "approve" a `NOT_SUBMITTED` or `CONFIRMED` track) → for `NEEDS_CORRECTION` with no note, the client already showed the soft-warning; server accepts it → update the one status column → insert `verification_history` row → insert `notifications` row with the resolved copy → return updated track state. Matches [stage-16-api-shape.md](stage-16-api-shape.md)'s "the gates, the state-transition rules" requirement.

---

## Screens M3 builds

Per [stage-17-screen-specs.md](stage-17-screen-specs.md). Format: Purpose · Inputs · Actions · Permissions · States · API · Responsive.

### Admin: Verification Queue (`/admin/verification`)
Replaces M1's "Coming in the next stage" placeholder.
- **Inputs:** tab filter — All / Pending / Needs correction / Approved. (Stage 17 says "Approved" tab; keep it.)
- **Actions:** open a member's Verification Review.
- **Permissions:** Church Admin, Super Admin (middleware already gates `/admin/*`).
- **States:** per-row: member name, submitted date, membership track chip, credentials track chip, profile-completeness (always 100% here — they're `PROFILE_COMPLETE` — so show submitted-date instead, per Stage 17's row content). Count badge per tab. Empty Pending tab: **"You're all caught up. No profiles are waiting for review."** (Stage 11, verbatim).
- **API:** `GET /admin/verification-queue`.
- **Responsive:** list at all widths (Stage 17 — no table→card transform needed).

### Admin: Verification Review (`/admin/verification/[memberId]`)
- **Inputs:** a free-text Notes field (used when requesting a correction on a track).
- **Actions:** per track — **Approve Membership** / **Approve Credentials** (→ `verify-*` with `decision: APPROVED`); **Request correction** on either (→ `verify-*` with `decision: NEEDS_CORRECTION`, note). "Request correction" with an empty note shows the soft-warning confirm (Contradiction B). View the member's CV (opens from Storage).
- **Permissions:** Church Admin, Super Admin.
- **States:** the two tracks shown **independently and unmistakably** (Stage 17: *"this screen is the one place both tracks' independence must be visually obvious"*) — each with its own current status, its own Approve/Correct controls, its own last history entry. A track that's already `CONFIRMED`/`REVIEWED` shows as done with no action (an admin can still request a correction to send it back — allowed). `REVIEW_PENDING` credentials show "updates awaiting re-review" with the same Approve/Correct controls as `PENDING`. Loading: "Saving verification…" (Stage 11). Save failure: "Something went wrong saving this. Your changes weren't saved — try again." (Stage 11).
- **Layout:** desktop two-column (profile left, verification controls right — Stage 17); mobile stacked, controls below the profile.
- **API:** `GET /admin/members/:id`, `GET /admin/members/:id/verification-history`, the two `verify-*` endpoints.

### Member: Correction screen (`/profile/corrections`)
New — the Journey 2 destination for a `PROFILE_COMPLETE` member with a `NEEDS_CORRECTION` track. NOT `/onboarding`.
- **Inputs:** the editable fields for whichever track(s) are flagged (Contradiction A resolution). Reuses the M2 step field components where practical.
- **Actions:** edit the relevant fields (autosaves, same as onboarding); **"Resubmit for review"** (→ `POST /members/me/resubmit-for-review`) — enabled once the flagged track has been touched, or always enabled with a "you haven't changed anything — resubmit anyway?" confirm.
- **Permissions:** the owning member only. A member with no `NEEDS_CORRECTION` track visiting this URL is redirected to `/profile`.
- **States:** shows the admin's note prominently per flagged track (Journey 2 step 2). After resubmit → redirect to `/dashboard`, both flagged tracks now `PENDING`, dashboard shows "in review".
- **API:** `GET /members/me/corrections`, the M2 edit actions (now status-aware), `POST /members/me/resubmit-for-review`.

### Member: dashboard — correction card
Extend M2's dashboard. When `membership_status = NEEDS_CORRECTION` OR `credentials_status = NEEDS_CORRECTION`: show a card — "Your profile needs a correction", the admin's note(s), a "Fix it" button → `/profile/corrections`. This replaces the normal "in review" badge display for the flagged track(s). The non-flagged track keeps its normal badge.

### Member: notifications (`/notifications`) + dashboard bell
Replaces M1's "Coming in the next stage" placeholder for `/notifications`.
- **Inputs:** none.
- **Actions:** tap a notification → go to its `related_url`; opening marks it read.
- **States:** list, newest first; unread emphasized; empty: **"You're all caught up."** (Stage 11). Dashboard/topbar bell shows unread count.
- **API:** `GET /members/me/notifications`, `PATCH /members/me/notifications/:id/read`.

### Admin: dashboard — "needs your attention"
Extend M1's admin dashboard. Add a live count: **"Pending verification: N"** linking to `/admin/verification` (Stage 12: *"treat the admin dashboard's live counts as the notification mechanism — no separate admin notification feed"*). N = members with `membership_status = PENDING` OR `credentials_status IN (PENDING, REVIEW_PENDING)`.

### NOT built by M3
The full Professionals directory screen and `GET /professionals` UI (M4). M3 implements the **gate logic** in a query helper + asserts it via tests, and the Verification Review screen's own member-profile view covers "an admin can see a member's full profile". Also not built: any opportunity/matching/application screen, the church/branch membership-number field, suspension workflow.

---

## Notification copy (from Stage 12, verbatim — stored at creation)

| Trigger | `type` | `body_text` | `related_url` |
|---|---|---|---|
| Membership track → `CONFIRMED` | `MEMBERSHIP_CONFIRMED` | "Your membership has been confirmed." | `/profile` |
| Credentials track → `REVIEWED` | `CREDENTIALS_REVIEWED` | "Your professional information has been reviewed." | `/profile` |
| Either track → `NEEDS_CORRECTION` | `CORRECTION_REQUESTED` | "Your profile needs a correction. See what's needed." | `/profile/corrections` |

- One notification per track transition. If an admin approves membership and, in the same session, requests a credentials correction, that's two notifications.
- No notification on `PENDING → REVIEW_PENDING` (system auto-reverification) or on member resubmit — Stage 12 defines no copy for these and the member/admin see the state directly.
- Copy stored at creation (not re-derived on read) so a later copy change doesn't rewrite history.

---

## Permissions / RLS summary

| Actor | Can |
|---|---|
| Member (owning) | read own `verification_history`; read + mark-read own `notifications`; edit own profile fields while `PROFILE_COMPLETE` (triggering reverification per the rules); resubmit own `NEEDS_CORRECTION` tracks |
| Member (other) | nothing — no cross-member reads anywhere |
| Church Admin / Super Admin | read any member row + sub-collections + `verification_history` + their CV; write `membership_status`/`credentials_status` only (server-enforced to those columns; RLS `WITH CHECK` guards `role` unchanged); insert `verification_history` + `notifications` |
| Unauthenticated | nothing (middleware) |

`GET /professionals` gate (server + RLS): return a member only if `membership_status = 'CONFIRMED' AND credentials_status IN ('REVIEWED','REVIEW_PENDING')` (Contradiction C resolution).

---

## Acceptance tests (`app/tests/e2e/m3-acceptance.spec.ts`, serial, live-Supabase guard)

Prerequisites: migrations 001+002+003 applied; a `CHURCH_ADMIN` account (register, then `UPDATE members SET role='CHURCH_ADMIN'`); `M3_ADMIN_EMAIL`/`M3_ADMIN_PASSWORD` env vars; a fully-onboarded `PROFILE_COMPLETE` member (the suite creates one via the M2 flow, or reuses `M3_MEMBER_EMAIL`).

Each maps to a Stage 13 / Stage 7 line:

1. **Queue shows a submitted member** — after a member completes onboarding + submits, they appear on `/admin/verification` Pending tab with both track chips "in review".
2. **Membership approved** (Stage 13 scenario) — admin clicks Approve Membership → member's `membership_status = CONFIRMED`; a `verification_history` row exists (track MEMBERSHIP, action APPROVED, actor_admin_id set, timestamp); member gets a `MEMBERSHIP_CONFIRMED` notification with the exact copy.
3. **Credentials approved independently** — admin approves Credentials (membership still whatever it was) → `credentials_status = REVIEWED`, separate history + notification. Asserts the two tracks move independently.
4. **Both approved → directory-visible** (Stage 13 scenario) — once both tracks terminal-approved, `GET /professionals` returns this member; before that it does not.
5. **Credentials need correction** (Stage 13 scenario) — admin requests correction on Credentials with a note → `credentials_status = NEEDS_CORRECTION`; history row with the note; member gets `CORRECTION_REQUESTED` notification; member dashboard shows the correction card with the note.
6. **Soft-warning on no-note correction** (Contradiction B) — admin clicks Request correction with an empty note → a confirm prompt appears; confirming proceeds; the history row's `note` is null.
7. **Correction resubmission returns to PENDING, not approved** (Stage 13 scenario) — member opens `/profile/corrections`, edits the flagged field, clicks Resubmit → `credentials_status = PENDING` (not REVIEWED); a `RESUBMITTED` history row exists; member reappears on the queue Pending tab.
8. **Directory visibility requires both tracks approved** (Stage 13 scenario, the regression-worthy one) — a member with `membership_status = CONFIRMED` but `credentials_status = PENDING` does NOT appear in `GET /professionals`. (Boolean AND, not OR.)
9. **`REVIEW_PENDING` stays visible** (Contradiction C) — a both-approved member edits an Experience record → `credentials_status = REVIEW_PENDING`, an `AUTO_REVERIFICATION` history row exists, and the member **still** appears in `GET /professionals`. The admin queue's "needs attention" count includes them.
10. **Profession edit fully resets credentials** (Stage 7 reverification rule) — a both-approved member changes their profession → `credentials_status = PENDING`, member is NO longer in `GET /professionals`, history row `AUTO_REVERIFICATION`.
11. **Education edit fully resets credentials** — same as 10 for an education write.
12. **Membership track is never touched by a profile edit** — a both-approved member edits profession/education/experience → `membership_status` stays `CONFIRMED` throughout.
13. **`profile_status` is never touched by M3** — through approve, correct, resubmit, and reverification, `profile_status` stays `PROFILE_COMPLETE`.
14. **Audit trail completeness** (Stage 13 cross-cutting) — every approve/correct/resubmit/auto-reverification in the run produced exactly one `verification_history` row with the right actor and action.
15. **Badge wording regression** (Stage 13 cross-cutting) — after both approved, `/profile` and (where M3 renders them) the admin member view show "Membership confirmed" and "Credentials reviewed" — never "Verified", never "Church Verified". `getByText(/^Verified$/)` has count 0.
16. **A plain member cannot reach `/admin/verification`** — server redirect to `/dashboard` (M1 already proves the `/admin/*` gate; re-assert for the new route).
17. **A member cannot read another member's `verification_history` or profile** — RLS test: authenticated as member A, a direct query for member B's rows returns empty.
18. **Notification read state** — opening a notification marks it read; the bell count decrements; reload preserves it.

**Unit tests** (`app/tests/unit/`):
- `reverificationEffect(field)` — the field→status-change table above, every row.
- The directory-gate predicate — `(membership, credentials) → visible?` for every combination of the two enums.
- The verification-queue tab filter — `(members[]) → rows per tab`.

**M1 + M2 regression:** the existing `m1-acceptance` and `m2-acceptance` suites must still pass unchanged. M3 must not alter registration/login/onboarding behavior. (If the M2 edit-action refactor for Gap 1 changes a signature the M2 wizard uses, the M2 suite catches it.)

---

## Build order

1. **Migration 003** — `verification_history`, `notifications`, `is_church_admin()` helper, all admin RLS policies, sub-collection admin SELECT, storage admin SELECT. Apply to live Supabase; document the `CHURCH_ADMIN` seeding step.
2. **Types** — `src/types/verification.ts` (`VerificationTrack`, `VerificationAction`, `VerificationHistoryEntry`), `src/types/notification.ts`; extend `database.ts` for the two new tables.
3. **`lib/verification/`** — `reverificationEffect(field)`, the directory-gate predicate, the queue tab filter (all pure, unit-tested first); `queries.ts` (`getVerificationQueue`, `getMemberProfileForAdmin`, `getVerificationHistory`, `getMemberCorrections`); `actions.ts` (`verifyMembership`, `verifyCredentials`, `resubmitForReview`, notification-insert helper).
4. **`lib/profile/actions.ts` refactor** — replace `requireRegisteredMember()` with `requireOwnProfile()` + a status-aware `applyReverification()` call after each write. Onboarding behavior unchanged while `REGISTERED`.
5. **`lib/notifications/`** — `getMyNotifications`, `markRead`, the shared `notify(memberId, type)` used by verification actions.
6. **Admin screens** — Verification Queue, Verification Review. Wire the admin-dashboard "Pending verification: N" count.
7. **Member screens** — `/profile/corrections`, the dashboard correction card, `/notifications` + the bell count.
8. **`GET /professionals` gate** — implement the query helper with the Contradiction-C predicate even though the M4 screen doesn't exist; it's needed for tests 4, 8, 9, 10.
9. **`m3-acceptance.spec.ts` + unit tests** — run against live Supabase; fix; document any deviations in this file. Re-run `m1-acceptance` and `m2-acceptance` to confirm no regression.

---

## Implementation deviations (recorded during the M3 build, 2026-09-10)

The build followed Stage 23 as written. Every item below is either an explicitly
accepted product rule (Req 1), an implementation-level choice the checklist
already flagged as a judgment call, or a mechanical difference that does not
change product behavior. No product behavior was changed to make a test pass.

### 1. REVIEW_PENDING stays directory-visible -- ACCEPTED PRODUCT RULE (Req 1)

Per the user's approval instruction, this is recorded here as an explicit,
accepted product rule, not an implicit assumption:

> **A member is directory-visible when `membership_status = 'CONFIRMED'` AND
> `credentials_status IN ('REVIEWED', 'REVIEW_PENDING')`.**
> `PENDING` and `NEEDS_CORRECTION` credentials are NOT directory-visible.
> `REVIEW_PENDING` IS directory-visible -- it is the lighter-weight
> reverification state a Reviewed member enters after an Experience edit
> (Stage 7's reverification decision), and Stage 7's own reasoning is that
> such a member "stays in the directory".

This rule is now stated in three places: this section, the header of
`app/supabase/migrations/003_verification.sql`, and the doc comment on
`isDirectoryVisible()` in `app/src/lib/verification/rules.ts`. The SQL mirror
is `public.member_is_directory_visible(p_membership, p_credentials)`.
`GET /professionals` (the `getDirectoryProfessionals()` / `isMemberInDirectory()`
helpers in `app/src/lib/directory/queries.ts`) enforces it in the query's WHERE
clause, server-side, not as a UI filter.

If the intent was ever that `REVIEW_PENDING` should also drop out of the
directory, that is a one-line predicate change plus a flip of acceptance test 9
-- see the last bullet under "Still genuinely open".

### 2. Correction-flow isolation (Req 2) -- implemented as specified

- Membership correction -> membership `PENDING`; credentials untouched.
- Credentials correction -> credentials `PENDING`; membership untouched.
- Both flagged -> both `PENDING` after one resubmission.

`resubmitForReview()` (`app/src/lib/verification/actions.ts`) reads the member's
current statuses and moves **only** the track(s) currently in
`NEEDS_CORRECTION` to `PENDING`, one guarded update per track
(`.eq(column, 'NEEDS_CORRECTION')`), one `RESUBMITTED` history row per track.
A track not in `NEEDS_CORRECTION` is never written. The member correction
editor (`/profile/corrections`) shows the editable fields for the flagged
track(s) only.

### 3. Verification transaction integrity (Req 3) -- ordered writes with rollback

Postgres/PostgREST from the anon/publishable key gives no interactive
transaction, so `verifyTrack()` uses an explicit ordered sequence with
compensation, not a DB transaction:

1. INSERT the `verification_history` row first.
2. Guarded status UPDATE (`.eq(column, fromStatus)`), asserting exactly one row
   changed.
3. INSERT the notification.
4. If step 3 fails: restore the status to `fromStatus` and DELETE the audit row
   written in step 1, then return an error.

A successful status change therefore cannot leave the audit row or the
notification missing: either all three land, or the status is rolled back and
the call reports failure. This is the closest to atomic the current data-access
path allows; a true transaction (or an RPC/edge function) would need the
service-role key, which is out of M3 scope and not configured.

### 4. Mechanical / non-behavioral differences

- **`guardedStatusUpdate` branches on a literal column name.** Supabase's typed
  query builder collapses `.update({ [dynamicKey]: value })` to `never`, so the
  helper has an `if (column === "membership_status") { ... } else { ... }`
  split. Same runtime behavior; it is a type-system workaround.
- **Server actions return `{ success, error?, data? }`, never `redirect()` into
  a route.** Matches the M1/M2 pattern (Next 16 swallows chained redirects);
  the client does `router.push` + `router.refresh`.
- **`reverificationEffect` returns `"PENDING"` for a profession/education edit
  even when credentials are already `PENDING`.** The rule short-circuits only
  `NOT_SUBMITTED` and `NEEDS_CORRECTION`. From `PENDING` the returned
  transition is the same value, and `applyReverification`'s guarded
  `.eq(from)` update is then a no-op. Documented as a harmless same-value
  transition in the unit test, not a spec change. (Acceptance tests 10/11
  re-approve credentials to `REVIEWED` first so the reset is observable.)
- **Education "any write triggers PENDING".** Stage 7 left "pure typo fix vs
  substantive change" as an implementation judgment call. M3 treats every
  education write as substantive (checklist Contradiction/gap table already
  records this as the M3 decision). Same for a CV replacement, which is
  credential-class.
- **`/notifications` and the top-bar bell are minimal.** A list plus an unread
  count in the member layout's header slot; no polling, no realtime. Stage 23
  scope for M3 is "member sees their badges change and can respond to a
  correction" -- the richer notification centre is later.
- **`/admin/professionals` renders a minimal gated list.** The full M4
  Professionals directory (filters, search, profile drill-in) is not built.
  M3 ships only the gated listing plus the `getDirectoryProfessionals()` /
  `isMemberInDirectory()` helpers, which is what acceptance tests 4, 8, 9, 10
  need. The verification filter is deliberately absent (Stage 17: with the
  AND-gate every listed member has the same verification state).
- **Acceptance test 11 (Education edit) re-approves credentials first.** The M3
  suite runs serially; by the time test 11 runs, test 10 has already moved
  credentials to `PENDING`. Test 11 has the admin re-approve to `REVIEWED`
  before the education edit so the reset from `REVIEWED -> PENDING` is
  observable. This is a test-sequencing accommodation, not a behavior change.

### 5. Not run yet -- live-Supabase steps the developer must do

- **Migration `003_verification.sql` has not been applied to the live project.**
  It must be pasted into the Supabase SQL editor and run. It depends only on
  migrations 001 + 002 (helper `current_member_id()`, bucket `member-documents`,
  the sub-collection tables) -- all present.
- **A `CHURCH_ADMIN` account must be seeded:** register a normal account through
  the app, then `update public.members set role = 'CHURCH_ADMIN' where email =
  '...';`. Set `M3_ADMIN_EMAIL` / `M3_ADMIN_PASSWORD` in `app/.env.local` to it.
- **`m3-acceptance.spec.ts` (18 tests) is gated on those two.** Without them the
  suite skips cleanly (verified: `npx playwright test m3-acceptance` -> 18
  skipped, no errors). Once migration 003 is applied and the admin vars are set,
  run `npx playwright test m3-acceptance --project=chromium` against
  `npm run build && npm run start`.

### 6. Regression + local checks that DID run (2026-09-10)

- `npm run typecheck` -- clean.
- `npm run lint` -- clean.
- `npm run build` -- compiles, 27/27 pages generated.
- `npm run test` (unit) -- 47 passed (28 M2 + 19 new M3: `reverificationEffect`
  table, directory-gate predicate over every enum pair, queue tab filter).
- `npx playwright test m1-acceptance` -- 10 passed, 1 skipped (admin path, no
  `M1_ADMIN_*`). Unchanged from before M3.
- `npx playwright test m2-acceptance` -- 11 passed. Unchanged from before M3;
  the Gap 1 refactor (`requireRegisteredMember` -> `requireOwnProfile` +
  `afterEdit`) did not alter onboarding.

---

## Still genuinely open (not blockers for M3, flagged per the brief)

- **Verification criteria** — Church Admins are the *who*; *on what basis* they approve is still undefined (the single most-repeated open item across every stage). M3 builds the mechanism; the judgment call is a people/policy decision. M3's demo works with an admin approving on any basis.
- **Membership-number / branch-confirmation field** — Stage 6 Journey 4's "confirm which branch you attend" has no data field. M3's Membership track correction note handles it as free-text guidance ("confirm your branch with the office"); a structured field is a later addition, not M3 scope.
- **Suspension workflow** — `SUSPENDED` is in the enum, no trigger. Not M3.
- **Whether `REVIEW_PENDING` should also drop out of the directory** — Contradiction C is resolved as "stays visible" by authority (Stage 7's reverification reasoning), but if Champion intended otherwise this is a one-line predicate change + test-9 flip.
