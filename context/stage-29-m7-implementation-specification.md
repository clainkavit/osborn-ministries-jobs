# Stage 29 — M7 Implementation Specification: Apply → Review → Shortlist → Connect

Written 2026-09-12, by Claude, following the M5/M6 pre-implementation review process. **Planning only — no code, migrations, or existing files touched.** This document inspects the existing system (Stage 7's state machines, Stage 8's connection model, Stage 6's Journey 7, Stage 13's acceptance criteria, Stage 15's data model, Stage 16's API shape, Stage 17's screen specs, Stage 18's milestone scope, the current M1-M6 codebase) and proposes an implementation-ready M7 boundary. A central scope tension surfaced immediately during inspection — see §3, Decision 1 — and is flagged rather than resolved.

---

## 1. M7 Scope

M7 is the milestone that lets a verified member apply to a Published opportunity, an admin review that application, and — per the existing spec set — the application progress through the rest of its lifecycle (Shortlist, Interview, outcome), with contact information unlocking at Shortlist per Stage 8's decided connection model.

The user-stated boundary for this task is **Apply → Review → Shortlist → Connect**. The existing, already-decided specification set (Stage 7, 8, 15, 16, 17, 18) describes a **6-status Application state machine** (`Applied → Reviewed → Shortlisted → Interview → Selected/Rejected`, plus `Withdrawn`) in which **"Connect" is not a distinct pipeline stage** — it is Stage 8's name for the contact-info-reveal side effect that fires automatically at Shortlisted. These two framings do not describe the same shape. §3 Decision 1 surfaces this precisely; the rest of this document is written to be usable under either resolution, calling out exactly what changes depending on the answer.

---

## 2. M7 Boundary

**M6 ended at:** Match → Score → Rank — an admin-only, read-only computation over existing opportunity and member data. Nothing in M6 writes to any table; nothing in M6 creates a relationship between a member and an opportunity beyond a computed, non-persisted score.

**M7 begins at:** the first point a member and an opportunity become linked by a real, persisted record — an Application. M7 owns:
- Application creation (the Apply action) and its eligibility rules.
- Every subsequent state the Application record can be in, and who can move it between which states.
- The admin's application review surface (per-opportunity list, per-application detail).
- The member's own application visibility (My Applications, application detail).
- Contact-info visibility unlocking (Stage 8) as a consequence of one specific transition (Shortlisted), whichever way Decision 1 resolves.

**M7 does not touch:**
- M6's scoring/ranking algorithm itself — an application may *display* the M6 score computed at apply-time or review-time (a genuine decision, §3 Decision 3), but M7 does not change `lib/matching/scoring.ts`, `eligibility.ts`, or `rank.ts`, and does not introduce a new scoring dimension.
- M5's opportunity state machine (`DRAFT → PUBLISHED → CLOSED/CANCELLED/FILLED → CLOSED → COMPLETED`) or its completeness/publish rules. M7 only reads opportunity status to decide whether Apply is available; it does not add a new opportunity status or a new opportunity transition trigger unless Decision 8 (headcount → Filled) is explicitly approved.
- Notifications (M8) — every application-state transition already has notification copy pre-written (Stage 12), none of it sent by M7.
- Admin dashboard/polish (M9), launch/QA (M10).
- Messaging of any kind — explicitly out of scope per Stage 5's P2 list and Stage 8's own reasoning (interview logistics are structured fields on the Application, not a chat feature).

---

## 3. Existing System Findings

Everything below is a direct restatement of an already-decided document or a directly observed fact from the current codebase — nothing here is invented.

### 3.1 The Application state machine (Stage 7, §3)

```
Applied → Reviewed → Shortlisted → Interview → Selected
                                              → Rejected
[Applied | Reviewed | Shortlisted] → Withdrawn   (member-triggered)
```

- Every forward transition (Reviewed, Shortlisted, Interview, Selected, Rejected) is **admin-triggered**. Applied is member-triggered. Withdrawn is member-triggered.
- Stage 7 explicitly recommends Withdrawn be reachable from Applied, Reviewed, or Shortlisted, **not** from Interview onward ("at that point, treat as a Rejected outcome with an internal note instead, since an interview implies real coordination already happened").
- **Rejected is also reachable as a system-generated side effect** when an opportunity is Closed/Cancelled and the admin chooses to bulk-close remaining applications (Stage 7 §2, decided 2026-09-10: this is always an explicit admin choice, per-application or bulk — never automatic).
- No transition skips a state in the forward direction in any source document (an application cannot go straight from Applied to Shortlisted without passing through Reviewed, per Journey 7's own numbered steps) — this is itself worth confirming as a decision rather than an assumption, since some real admin workflows might reasonably want to shortlist immediately without a separate "mark reviewed" click. Flagged in §12 Decision 2.

### 3.2 The Connection model (Stage 8) — contact-info visibility, not a pipeline stage

```
Applied / Reviewed   → no contact exchange; admin sees profile, not phone/email
Shortlisted          → member notified; admin's view of THIS candidate now shows phone/email
Interview            → structured interview_date/time/location/instructions entered by admin,
                        shared with the member in-platform (fields on Application, not messaging)
Selected / Rejected  → outcome recorded; no further access change
```

Stage 8 explicitly rejected three alternative designs (reveal-on-any-interest, a formal accept/decline connection request, and built-in messaging) in favor of this staged model. The existing M4 code already anticipates this exactly: `admin/professionals/[memberId]/page.tsx`'s Contact button is disabled with the tooltip "Available once shortlisted for an opportunity," written during M4 before any Application entity existed.

### 3.3 The existing data model (Stage 15, decided, unbuilt)

```
Application:
  id, member_id (-> Member), opportunity_id (-> Opportunity),
  status (Applied | Reviewed | Shortlisted | Interview | Selected | Rejected | Withdrawn),
  applied_at, status_updated_at,
  interview_date, interview_time, interview_location, interview_instructions
    (all nullable, populated only once status reaches Interview)

ApplicationOutcome (separate entity, 1:1 with Application):
  id, application_id (-> Application), outcome
    (Hired | Contract awarded | Project completed | Service delivered |
     Connected | Not selected | Cancelled | No outcome),
  recorded_by (-> Admin), recorded_at, notes (admin-internal, never shown to member)
```

Stage 15's own rationale for splitting `ApplicationOutcome` out: it's a different concept from workflow state (an eventual impact-dashboard entity, PRD §46) and shouldn't overload `Application.status`.

### 3.4 The API shape (Stage 16, decided)

```
POST   /opportunities/:id/apply              reject if already applied; reject if member unverified
GET    /members/me/applications              My Applications
GET    /admin/opportunities/:id/applications  per-opportunity list
PATCH  /admin/applications/:id/status         body: { status }, server enforces legal transitions
POST   /admin/applications/:id/shortlist      convenience endpoint, kept separate from the generic
                                               PATCH because the contact-info side effect deserves
                                               its own explicit action
GET    /admin/applications/:id                full detail; contact info included only once
                                               Shortlisted or later
```

This project's actual architecture (established across M1-M6) implements "API routes" as Server Actions/Server Components, not literal REST handlers — §10 translates this shape into that convention, the same way M6's `GET /admin/opportunities/:id/matches` became `findMatchesForOpportunity()`.

### 3.5 Screen specs (Stage 17, decided)

- **My Applications** (member): table/list per status; no edit once submitted; a Withdraw action is explicitly flagged by Stage 17 itself as "a small addition this document is making... not something Stage 3 specified" — i.e. even the existing spec set treats Withdraw's exact UI placement as slightly provisional, though the state itself (Stage 7) is decided.
- **Admin Professional Profile**: Contact (enabled only once Shortlisted somewhere), Shortlist (against a chosen active opportunity) — both already stubbed disabled in M4's actual code.
- **Application Management (per opportunity)**: a funnel view; status changes **per-application, not bulk** for MVP (Kanban bulk-drag is explicitly P1); record outcome once status reaches Selected/Rejected.
- **Find Matches** (M6, built): Stage 17 originally described a "Shortlist per candidate row" action on this exact screen — M6 deliberately did not build it (Stage 28 §6, "no Shortlist action... M6 has no reason to promise a future action"). M7 is precisely the milestone that fills this gap in.

### 3.6 Current M1-M6 code precedents to follow

- `requireAdmin()` — private, unexported, ~5 lines, independently replicated in every admin-facing `actions.ts`/`queries.ts` module (`lib/verification/`, `lib/opportunities/`, `lib/matching/`). M7 replicates it again in its own module, per established precedent — no shared helper exists to import.
- `is_church_admin()` — SQL, `SECURITY DEFINER`, already treats `CHURCH_ADMIN` and `SUPER_ADMIN` identically for every RLS policy in the schema. There is no broader Super-Admin-only tier anywhere in this codebase; M7 introduces none.
- `current_member_id()` — SQL helper already used by every "member owns this row" RLS policy (`education`, `experience`, `member_skills`, `certifications`, `documents`, the M3 correction-request flow). This is the exact primitive for "a member can read/create their own Application rows."
- `guardedOpportunityTransition` (`lib/opportunities/actions.ts`) — the established three-step pattern: pre-read current status → pure predicate (`isOpportunityTransitionAllowed`) → guarded `.update(...).eq('status', from)`. This is the pattern M7's own application-status guard must follow.
- `opportunities.headcount_required` exists (M5) but nothing currently reads or checks it against any count — Stage 7's own flagged gap ("no mechanism to know a '3 drivers' opportunity is done") is still genuinely open in the actual implementation, not just the spec. Directly relevant to §12 Decision 8.
- M4's Contact/Shortlist buttons on `admin/professionals/[memberId]/page.tsx` are already written, disabled, with comments naming exactly what M7 needs to satisfy to enable them.
- No prior M7 planning document exists in `context/` — Stage 28 (M6) is the latest.

---

## 4. Proposed Application/Data Model

Following Stage 15 exactly, adjusted only for this codebase's real conventions (snake_case columns, `uuid` PKs, the same `created_at`/`updated_at` trigger pattern migrations 001-004 already use).

```sql
create table public.applications (
  id                    uuid primary key default gen_random_uuid(),
  member_id             uuid not null references public.members(id) on delete cascade,
  opportunity_id        uuid not null references public.opportunities(id) on delete cascade,
  status                text not null default 'APPLIED'
    check (status in ('APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW',
                       'SELECTED', 'REJECTED', 'WITHDRAWN')),
  applied_at            timestamptz not null default now(),
  status_updated_at     timestamptz not null default now(),
  interview_date        date,
  interview_time        time,
  interview_location    text,
  interview_instructions text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint applications_one_per_member_opportunity
    unique (member_id, opportunity_id)
);

create index applications_opportunity_idx on public.applications (opportunity_id);
create index applications_member_idx on public.applications (member_id);
create index applications_status_idx on public.applications (status);

create table public.application_outcomes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  outcome        text not null
    check (outcome in ('HIRED', 'CONTRACT_AWARDED', 'PROJECT_COMPLETED',
                        'SERVICE_DELIVERED', 'CONNECTED', 'NOT_SELECTED',
                        'CANCELLED', 'NO_OUTCOME')),
  recorded_by    uuid not null references public.members(id),
  recorded_at    timestamptz not null default now(),
  notes          text,

  constraint application_outcomes_one_per_application unique (application_id)
);
```

**Design notes:**
- `unique (member_id, opportunity_id)` is the database-level duplicate-application guard — belt-and-suspenders alongside the server action's own pre-check, matching every other gate in this codebase (query filter + RLS, or predicate + DB constraint).
- `applications.status_updated_at` is separate from `updated_at` (Stage 15's own field) so a future read can distinguish "any row edit" from "the status specifically changed" — mirrors why `opportunities` has both `updated_at` and status-specific timestamps (`published_at`, `closed_at`).
- No `withdrawn_at` column proposed distinctly from `status_updated_at` — Withdrawn is just another status value with the same timestamp semantics as every other transition, unless Decision 4 says otherwise.
- `on delete cascade` on both FKs mirrors every other member/opportunity-owned child table in this schema (`education`, `member_skills`, `opportunity_required_skills`).
- `application_outcomes.recorded_by` references `members(id)` (the admin who recorded it), matching the pattern `opportunities.created_by` already established in M5.
- **No `match_score`/`match_breakdown` columns on `applications`** unless Decision 3 explicitly requires persisting the M6 score at apply-time — see that decision; M6 itself was built with an explicit "computed on demand, never persisted" rule (Stage 28 §3), and extending that into M7 without a deliberate decision would silently reopen a resolved M6 principle.

**RLS (proposed, following established precedent exactly):**

```sql
alter table public.applications enable row level security;
alter table public.application_outcomes enable row level security;

-- Members: can create their own applications, can read their own, cannot
-- update/delete once created (all subsequent transitions are admin-only
-- per Stage 7, except Withdrawn -- see below).
create policy "Members create own applications"
  on public.applications for insert to authenticated
  with check (member_id = public.current_member_id());

create policy "Members read own applications"
  on public.applications for select to authenticated
  using (member_id = public.current_member_id());

-- Pending Decision 4: if members can self-serve Withdraw, they need an
-- UPDATE policy scoped to status = 'WITHDRAWN' only, guarded the same way
-- migration 003 restricts what an admin update on members.<track>_status
-- may touch. If Withdraw is admin-mediated instead (member requests,
-- admin executes), no member UPDATE policy is needed at all.

create policy "Admins manage all applications"
  on public.applications for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

create policy "Admins manage all application outcomes"
  on public.application_outcomes for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

-- No member SELECT policy on application_outcomes needed if outcome notes
-- are admin-internal only (Stage 15) and the member-visible "Selected" /
-- "Not selected" fact is read from applications.status directly, not from
-- this table. If a member-visible outcome summary belongs on My
-- Applications, confirm it derives from status, not from a read of this
-- table's `notes` field.
```

**Audit/history table:** not proposed. Nothing in Stage 7/8/15/16/17/18 describes a persisted status-history table for applications (unlike verification, which has an explicit `VerificationHistory`/`verification_history` audit entity in Stage 15 and migration 003). `status_updated_at` is the only history retained, matching Stage 15's own Application entity exactly. If a full audit trail is wanted, that is a new requirement beyond what any source document specifies — flagged in §12 Decision 9 rather than added silently.

---

## 5. Application State Machine

**Transition matrix — exact, derived from Stage 7 §3 (pending Decision 1's resolution of the Interview/Connect question):**

| From | To | Trigger | Guard |
|---|---|---|---|
| (none) | APPLIED | Member clicks Apply | Opportunity is PUBLISHED; member passes the eligibility gate (§7); no existing non-Withdrawn application by this member for this opportunity |
| APPLIED | REVIEWED | Admin opens/marks reviewed | Admin only |
| REVIEWED | SHORTLISTED | Admin shortlists | Admin only |
| SHORTLISTED | INTERVIEW | Admin schedules interview | Admin only; requires interview_date/time (Decision 6 on exact required fields) |
| INTERVIEW | SELECTED | Admin records outcome | Admin only |
| INTERVIEW | REJECTED | Admin records outcome | Admin only |
| APPLIED | WITHDRAWN | Member withdraws | Member only, own application |
| REVIEWED | WITHDRAWN | Member withdraws | Member only, own application |
| SHORTLISTED | WITHDRAWN | Member withdraws | Member only, own application |
| APPLIED / REVIEWED / SHORTLISTED / INTERVIEW | REJECTED | Admin bulk/individual close-out when opportunity Closes/Cancels | Admin only, explicit action (never automatic — Stage 7, decided) |

**Forbidden, explicitly (every one of these must be a real server guard, not just an absent UI control, per this project's established M3/M5/M6 discipline):**
- SELECTED → anything (terminal)
- REJECTED → anything (terminal)
- WITHDRAWN → anything (terminal)
- INTERVIEW → WITHDRAWN (Stage 7's explicit recommendation — once interviewing, withdrawal isn't offered; treat as Rejected with an internal note instead)
- Any transition skipping a forward state (e.g. APPLIED → SHORTLISTED directly) — pending Decision 2
- Any transition backward (e.g. SHORTLISTED → APPLIED, INTERVIEW → REVIEWED)
- A member transitioning anything other than their own APPLIED/REVIEWED/SHORTLISTED application to WITHDRAWN
- An admin creating an application on a member's behalf (Applied is member-only-triggered per Stage 7)

**Server-side guard pattern (mirrors `guardedOpportunityTransition` exactly):**
1. Pre-read the application's current `status` (and `member_id`, for the withdraw-is-mine check).
2. Pure predicate: `isApplicationTransitionAllowed(from, to, actor: 'MEMBER' | 'ADMIN')` — a pure function, unit-tested exhaustively, that also encodes *who* may perform each transition, since (unlike M5's opportunity machine, which is entirely admin-driven) this machine has actor-dependent legality.
3. Guarded update: `.update({ status: to, status_updated_at: now() }).eq('id', id).eq('status', from)`.

---

## 6. Review/Shortlist/Connect Model

**Review:** the REVIEWED status. Per Stage 7, purely a workflow marker — no side effect beyond the status change itself (explicitly no notification, Stage 12 confirms this in writing). Pending Decision 2: is a separate "mark reviewed" click required before Shortlist, or can an admin shortlist directly from Applied?

**Shortlist:** the SHORTLISTED status, plus its Stage 8 side effect — the admin's view of *this specific candidate* now includes phone/email. This is a response-shape rule (contact fields present/absent in the query result), not a UI-only hide/show — mirrors exactly how M4/M5 already gate visibility (query-level gate + RLS, not a client-side conditional).

**Connect — the central open question (Decision 1).** Under the existing spec set, "Connect" has no independent meaning beyond what Shortlist already causes: contact info becomes visible, the admin/organization proceeds off-platform (phone, WhatsApp, whatever they already use). There is no `POST /connect` endpoint, no separate status, no connection record in Stage 15's data model. If the user's stated 4-stage boundary intends Connect as a genuinely separate, later action (e.g. an explicit "Mark connected" button, distinct from Shortlisted, perhaps aligned with Stage 15's `ApplicationOutcome.outcome = 'CONNECTED'` value), that is new product surface beyond what any document currently describes, and needs to be decided, not inferred.

---

## 7. Eligibility Rules

**To Apply (proposed, following Stage 13/16's decided rules plus M5/M6 precedent):**
1. Opportunity status is `PUBLISHED` (Stage 16: reject otherwise; Stage 17: Closed/Cancelled shows a closed banner, no Apply button).
2. Member passes the same verification gate M6 already uses (`isMatchEligible`'s verification half): `profile_status = PROFILE_COMPLETE AND membership_status = CONFIRMED AND credentials_status IN (REVIEWED, REVIEW_PENDING)`. Stage 13's own scenario language says "a verified member" applies — this is the existing definition of verified everywhere else in this codebase; no new definition is introduced.
3. No existing non-Withdrawn application by this member for this opportunity (the duplicate-application gate, Stage 13's explicit scenario).
4. **Availability — genuinely unresolved, see Decision 5.** M6's eligibility gate additionally excludes `NOT_AVAILABLE`/`NOT_SET` members from *matching*, but Apply is a member's own affirmative action, not something computed for them — nothing in Stage 7/8/13/16/17 says a `NOT_AVAILABLE` member is blocked from applying. This may be an intentional difference (matching finds candidates *for* an opportunity; applying is the candidate choosing *for themselves*, availability toggle notwithstanding) or an oversight. Flagged, not assumed.

**To view an application (member):** own applications only (`current_member_id()`).

**To view/manage applications (admin):** any application, via `is_church_admin()` — this codebase has no per-admin scoping (no "admin only sees applications for opportunities they created" concept anywhere; M5's `getAdminOpportunities()` already returns every opportunity to every admin, unscoped by creator).

---

## 8. Authorization & RLS

Covered in full in §4's RLS block. Summary:
- **Create:** member, own `member_id` only.
- **Read (member):** own applications only.
- **Read/manage (admin):** any application, via existing `is_church_admin()` — Church Admin and Super Admin are equivalent for every RLS purpose in this codebase; M7 introduces no new tier.
- **Update (status transitions):** enforced server-side via the guarded-transition pattern (§5), never a raw client-writable status field. RLS's admin policy permits the *row-level* write; the *transition-legality* check happens in the server action, exactly matching M5's own documented division of labor ("transition legality is guarded in the server action layer, the same division of labor M3 already uses for members.<track>_status").
- **Withdraw:** pending Decision 4 — if member-initiated via a direct client update, needs a scoped member UPDATE RLS policy (`with check` restricted to `status = 'WITHDRAWN'` and only from an allowed `from`, mirroring migration 003's column-restricting admin update policy on `members`); if admin-mediated, no new member RLS is needed.
- **`application_outcomes`:** admin-only read/write. No member SELECT policy proposed (§4) unless Decision 7 requires exposing outcome data directly to members rather than deriving the member-visible fact from `applications.status`.

---

## 9. Routes & UI

### Member

| Route | Purpose | Auth | Data | Actions | Empty/error states |
|---|---|---|---|---|---|
| (existing) `/opportunities/[id]` | Apply entry point | authenticated member | `getOpportunityDetail` (existing) + this member's own application, if any | Apply (new) | Disabled + "Complete your verification to apply" if ineligible (Stage 17); disabled + "Already applied — view status" if a prior application exists; opportunity Closed/Cancelled shows a closed banner, no Apply button |
| `/applications` (already a nav stub, `implemented: false`) | My Applications | authenticated member | own applications, joined with opportunity title/org | View → detail | Empty state per Stage 11 (verify exact copy there, don't invent); loading skeleton |
| `/applications/[id]` (new, or a detail panel on the list — see Decision 10) | One application's status + (if Interview) logistics | member, own application only | one application row + opportunity summary | Withdraw (if Decision 4 approves self-serve withdrawal, and status allows it) | 404/redirect if not this member's own application |

### Admin

| Route | Purpose | Auth | Data | Actions | Empty/error states |
|---|---|---|---|---|---|
| `/admin/opportunities/[id]/applications` (new) | Application Management (per-opportunity funnel) | admin | all applications for this opportunity, with member name/status | Open → detail; per Stage 17, no bulk actions | Empty state distinct from "opportunity has zero applications yet" vs. "no applications match a filter," if filtering is added (Decision 11) |
| `/admin/applications/[id]` (new) | Full application detail | admin | application + member profile summary + (if Shortlisted+) contact info + (if built) M6 score/breakdown | Mark Reviewed, Shortlist, Schedule Interview, Record Outcome (Selected/Rejected), per the state machine | 404 if application doesn't exist |
| (existing) `/admin/opportunities/[id]/matches` | M6 Find Matches | admin | unchanged from M6 | Pending Decision 12: does a "Shortlist"-style action get added here now that Applications exist, or does shortlisting stay confined to reviewing an actual Application? | unchanged |
| (existing) `/admin/professionals/[memberId]` | Admin Professional Profile | admin | unchanged, PLUS this member's application history (already listed as a planned section per Stage 17 §"States") | Contact (enabled once Shortlisted for ≥1 application — already stubbed), Shortlist (against a chosen opportunity — already stubbed) | unchanged for the profile itself |

**Explicitly absent from M7 (belongs elsewhere or is undecided):**
- No notification of any kind (M8) — no "shortlisted" toast/email/in-app alert is sent, even though the state transition that would trigger it exists.
- No Kanban/bulk-status board (explicitly P1 per Stage 17).
- No messaging/chat UI (permanently out of scope per Stage 5/8).
- No employer-portal/external-organization access (Stage 5's P2/future-facing role).
- No impact dashboard reading `application_outcomes` (P2, M9 territory at best).

---

## 10. Server Actions / APIs / Queries

Following this codebase's real convention (Server Actions/Components, not literal route handlers), proposed module `lib/applications/`:

**`lib/applications/rules.ts`** (pure, unit-tested):
- `isApplicationTransitionAllowed(from, to, actor)` — the full matrix from §5.
- `isApplicationEligible(member, opportunity, existingApplication)` — the gate from §7.

**`lib/applications/actions.ts`**:
- `applyToOpportunity(opportunityId)` — validates §7's gate, inserts an APPLIED row with `member_id` from the caller's own session (never client input, matching every other "who did this" field in this codebase — `created_by`, `recorded_by` precedent). Returns the new application id or a named error ("You've already applied," "This opportunity is no longer accepting applications," "Complete your verification to apply").
- `markApplicationReviewed(id)`, `shortlistApplication(id)`, `scheduleInterview(id, { date, time, location, instructions })`, `recordOutcome(id, outcome: 'SELECTED' | 'REJECTED', notes?)` — each a thin guarded-transition wrapper, admin-only, following §5's pattern.
- `withdrawApplication(id)` — member-only, own application, guarded to the allowed `from` statuses (pending Decision 4 on whether this exists at all as a direct action vs. an admin-mediated one).
- `closeRemainingApplications(opportunityId)` — the explicit bulk action Stage 7 describes for when an opportunity closes (admin choice, never automatic) — pending Decision 9 on whether this ships in M7 or is deferred.

**`lib/applications/queries.ts`**:
- `getMyApplications()` — member, own applications only, joined with opportunity title/type/org/status for display.
- `getMyApplicationDetail(id)` — member, own application only, 404-equivalent otherwise.
- `getApplicationsForOpportunity(opportunityId)` — admin-only, per-opportunity list.
- `getApplicationForAdmin(id)` — admin-only, full detail; contact fields (`members.phone`, `members.email`) included in the returned shape **only if** `status` is SHORTLISTED or later — the Stage 8 rule implemented as a response-shape omission, not a client-side hide, exactly matching Stage 16's own instruction ("contact info only included in the response once status is Shortlisted or later").
- `hasAppliedToOpportunity(memberId, opportunityId)` — used by the member Opportunity Detail page to render the correct Apply-button state.

**All state changes are server actions; nothing accepts a client-supplied status value that bypasses the pure predicate.**

---

## 11. Validation Rules

- `applyToOpportunity`: opportunity must exist and be PUBLISHED; caller must pass the eligibility gate (§7); no existing non-Withdrawn application for this (member, opportunity) pair (checked in code AND enforced by the DB unique constraint as a second layer, same belt-and-suspenders posture as every other M3-M6 gate).
- `scheduleInterview`: at minimum `interview_date` required before the transition succeeds (Decision 6 on whether time/location/instructions are also required or optional).
- `recordOutcome`: only legal from INTERVIEW (per §5's matrix); `outcome` must be one of the two member-facing values (`SELECTED`/`REJECTED`) at the `applications.status` level — the richer `application_outcomes.outcome` enum (Hired/Contract awarded/etc.) is a separate, admin-only classification recorded alongside, per Decision 7.
- `withdrawApplication`: only legal from APPLIED/REVIEWED/SHORTLISTED, and only by the application's own member.

---

## 12. M7 Decisions Required

Twelve decisions surfaced during inspection. None resolved here.

### Decision 1 — What does "Connect" mean in M7? (the central tension)

**Question:** the user's stated M7 boundary is `Apply → Review → Shortlist → Connect` — four stages, with Connect as a distinct final stage. The existing, already-decided spec set (Stage 7, 8, 15, 16, 17, 18) describes a 6-status machine (`Applied → Reviewed → Shortlisted → Interview → Selected/Rejected`, plus `Withdrawn`) in which Connect is not a stage at all — it is Stage 8's name for the contact-info-reveal side effect of reaching Shortlisted. Which is authoritative for M7?

**Options:**
- **(a) Treat Stage 7/8/15-18 as authoritative** (this document's default framing). Build the full 6-status machine exactly as decided: Applied → Reviewed → Shortlisted → Interview → Selected/Rejected, plus Withdrawn. "Connect" is realized as the Stage 8 contact-info unlock at Shortlisted — no separate "Connect" button/status/table. This is the option every other prior spec document agrees with, including the one (Stage 18) that has been authoritative for M5's and M6's own scope in this exact process.
- **(b) Treat the user's 4-word boundary as authoritative and reshape the machine to match it** — `Applied → Reviewed → Shortlisted → Connected`, dropping Interview and Selected/Rejected as separate M7 states (deferring them to a later milestone, or folding "Interview" into "Review," or treating "Connect" as literally `ApplicationOutcome.outcome = 'CONNECTED'` promoted to a first-class status). This requires actively overriding Stage 7's decided machine and Stage 15's decided data model, which is a real, consequential product decision, not an implementation detail — no existing document supports this shape.
- **(c) Build (a)'s full machine, but ALSO add an explicit "Connect" action/status as a genuinely new addition** on top of Shortlisted — e.g. a `CONNECTED` status between Shortlisted and Interview, or a `POST /admin/applications/:id/connect` action that formally records "the admin and member have exchanged contact and made contact," distinct from the passive fact that contact info is merely *visible*. This adds new product surface no source document describes, but keeps everything Stage 7/8 already decided intact rather than removing it.

**What changes depending on the answer:** this affects the entire state machine (§5), the data model's status enum (§4), every route in §9 that shows application status, every server action in §10, and the full E2E test plan in §13. This is the single highest-impact decision in this document — nothing else in this specification can be finalized as "the" shape until this is resolved. I have written §5-§13 against option (a) as the working default (since it's what every prior authoritative document already says), but flagged every place Interview/Selected/Rejected/Connect-as-side-effect would need to change if (b) or (c) is chosen instead.

### Decision 2 — Can Shortlist happen directly from Applied, or must Review happen first?

**Question:** Stage 7/Journey 7 present Applied → Reviewed → Shortlisted as sequential, admin-driven steps. Is "mark reviewed" a required, separate click before Shortlist is available, or can an admin shortlist a fresh Applied-status application directly (with Reviewed either skipped, or auto-set as a side effect of the Shortlist action)?

**Options:**
- **(a) Sequential, exactly as written** — Shortlist is only offered from REVIEWED; an admin must explicitly mark Reviewed first. Matches Journey 7's literal numbered steps.
- **(b) Shortlist directly from Applied is allowed**, and the transition itself sets status straight to SHORTLISTED (skipping a separately-recorded REVIEWED state) — likely faster for a real admin who already knows they want to shortlist this candidate, but removes REVIEWED's value as a distinct "I've looked at this" marker if it's frequently skipped.
- **(c) Shortlist from Applied is allowed, but silently also stamps REVIEWED first** (two status writes, or a single write with an implied REVIEWED timestamp) — preserves the funnel's data completeness without forcing an extra click.

**Recommendation:** (a), for literal fidelity to the one document that actually describes this flow step-by-step. But this is a real UX tradeoff an admin doing this daily might reasonably want relaxed — not something to decide silently.

### Decision 3 — Does an Application store the M6 match score, or is it only ever recomputed/displayed live?

**Question:** should `applications` (or a related table) persist the `match_score`/breakdown that existed at the time of apply or first review, or should the admin's application detail screen simply call M6's existing scoring functions live against current data whenever it's viewed?

**Options:**
- **(a) Never persist — always recompute live**, reusing `lib/matching/scoring.ts` directly against the application's `member_id`/`opportunity_id` pair whenever the admin views it. Consistent with M6's own explicit "computed on demand, never persisted" principle (Stage 28 §3) — extends that principle rather than reopening it.
- **(b) Snapshot the score at apply-time** (a new nullable `match_score_at_apply`/breakdown column) — preserves what the score *was* when the member applied, even if their profile or the opportunity's requirements change afterward. Useful for fairness/audit ("this is the score that made them eligible then"), but is new schema no source document requests, and reopens exactly the staleness problem M6's own spec explicitly avoided by choosing not to persist.
- **(c) Don't show the M6 score on the application screens at all** — treat Find Matches and Application Management as two genuinely separate admin tools that don't reference each other's data, since no source document explicitly says the score must appear on the application detail screen (only that it must appear on Find Matches, which M6 already built).

**Recommendation:** (a) if a score is shown at all, otherwise (c). Either avoids new persistence; (b) is the option that would require the most justification, since it directly reopens a principle Stage 28 explicitly closed.

### Decision 4 — Is Withdraw member-self-serve, or admin-mediated?

**Question:** Stage 7 adds Withdrawn as a state and recommends it be reachable from Applied/Reviewed/Shortlisted, but Stage 17 itself flags the *exact UI* for this as "a small addition this document is making... not something Stage 3 specified." Does a member click a "Withdraw" button directly (requiring a scoped member UPDATE RLS policy, §8), or does a member only *request* withdrawal (e.g. a message to the admin, or simply not being able to do anything and the admin manually marks it) with an admin performing the actual status change?

**Options:**
- **(a) Direct member self-serve** — a Withdraw button on My Applications (Stage 17's own suggested placement), member-initiated, no admin involved. Requires the scoped RLS policy noted in §4/§8.
- **(b) Admin-mediated** — Withdrawn exists as a status an admin can set (e.g. because the member emailed/called to say they're no longer interested), but there's no member-facing Withdraw button in M7. Simpler RLS (admin-only write, same as every other transition), but doesn't give the member the self-service Stage 7 seems to anticipate ("a member gets a job elsewhere, or changes their mind").

**Recommendation:** (a) — Stage 7 explicitly frames this as a member action ("member withdraws"), and Stage 17 suggests exactly where it goes; the "not something Stage 3 specified" caveat is about the UI never having been drawn, not about who performs the action.

### Decision 5 — Can a NOT_AVAILABLE member apply?

**Question:** M6's matching gate excludes `NOT_AVAILABLE`/`NOT_SET` members from being surfaced *to* an opportunity. Does that same exclusion apply to a member applying *themselves*, or is Apply available to any verified member regardless of their own availability toggle?

**Options:**
- **(a) Availability is irrelevant to Apply** — only the verification gate (§7 item 2) and duplicate-check matter. A `NOT_AVAILABLE` member can still choose to apply (they set that toggle for matching/discoverability purposes, not as a hard block on their own initiative).
- **(b) `NOT_AVAILABLE` also blocks Apply**, treating availability as a blanket eligibility gate everywhere it appears, matching M6's own gate 1:1.

**Recommendation:** (a). Nothing in Stage 7/8/13/16/17 ties Apply eligibility to the availability toggle; only verification is named as the gate ("reject if member isn't verified," Stage 16, verbatim). Availability governs whether a member is *found*, not whether they can act on an opportunity they already found themselves (e.g. via direct browse).

### Decision 6 — Which interview fields are required to transition to INTERVIEW?

**Question:** Stage 15 lists `interview_date, interview_time, interview_location, interview_instructions`, all nullable. Is `interview_date` alone sufficient to transition SHORTLISTED → INTERVIEW, or must all four (or some subset) be filled before the transition is allowed?

**Options:**
- **(a) `interview_date` required; the rest optional** — an admin can schedule with just a date and fill in details later (the transition and the data-completeness aren't coupled).
- **(b) `interview_date` AND `interview_time` AND `interview_location` required; `interview_instructions` optional** — ensures the member is told something actionable before being notified (even though M7 doesn't send that notification, M8 eventually will, and an interview invite with no location is not useful).
- **(c) All four required.**

**Recommendation:** (b) — a bare date with no time or location isn't a real interview invite yet, but requiring free-text instructions for every interview is unnecessarily strict.

### Decision 7 — What is the exact relationship between `applications.status` (SELECTED/REJECTED) and `application_outcomes.outcome`?

**Question:** Stage 15 keeps these as two different concepts (workflow state vs. business outcome), with the outcome enum having 8 values (`Hired, Contract awarded, Project completed, Service delivered, Connected, Not selected, Cancelled, No outcome`) that don't map 1:1 onto the two application statuses. When an admin transitions an application to SELECTED, are they *also* required to immediately pick one of the outcome values (e.g. Hired vs. Contract awarded vs. Connected), or can `application_outcomes` remain empty for a while after SELECTED, filled in later (or never, for MVP)?

**Options:**
- **(a) Recording an outcome is required at the moment of SELECTED/REJECTED** — the transition and the outcome-recording happen in one action, one form.
- **(b) They're decoupled** — SELECTED/REJECTED can be set without ever creating an `application_outcomes` row; outcome recording is a separate, optional admin action, possibly deferred indefinitely (Stage 6 Journey 7 step 6 does note "the data should exist from day one so it's not backfilled later," which leans toward (a), but doesn't explicitly forbid (b)).

**Recommendation:** (a) for SELECTED (an admin selecting someone should know *why* — Hired vs. Contract awarded vs. Connected are meaningfully different outcomes worth capturing in the moment); REJECTED could default to a lighter requirement since "Not selected" and "Cancelled" are closer together in meaning. This is a genuine product judgment call, not purely mine to make.

### Decision 8 — Does reaching headcount auto-transition the opportunity to FILLED?

**Question:** Stage 7 flags this as still-open ("does an opportunity auto-transition to Filled when headcount is reached, and is headcount even tracked against Selected count anywhere yet?"). M5 built `opportunities.headcount_required` and a manual `markOpportunityFilled` action, but nothing counts Selected applications against it. Does M7 wire this up?

**Options:**
- **(a) No auto-transition in M7** — `markOpportunityFilled` stays a manual admin action, exactly as M5 left it. M7 only adds the applications that *could* feed such a count later; it doesn't build the counting/triggering logic itself.
- **(b) M7 adds the count-and-suggest** — e.g. the Application Management screen shows "3 of 3 roles filled" once enough SELECTED applications exist, as an informational cue, but the FILLED transition stays a manual admin click (informational, not automatic).
- **(c) M7 auto-transitions the opportunity to FILLED** the moment the Nth application reaches SELECTED — a real, automatic write to `opportunities.status` triggered from application-side logic, which is new cross-milestone coupling (an M7 action writing to an M5-owned table's status column) that no source document currently describes as automatic (Stage 7 itself only asks the question, doesn't answer it).

**Recommendation:** (a) for M7's own scope discipline — this task's own instructions say "do not modify M1-M6 behavior... preserve the existing M5 opportunity state machine unless M7 explicitly requires a change." Nothing about Applications *requires* this; it's a nice-to-have Stage 7 itself only poses as an open question. (b) is a reasonable middle ground if you want the visibility without the automation. (c) would need to be a deliberate, explicit decision given how directly it touches M5-owned state.

### Decision 9 — Does M7 build the bulk "close remaining applications" action?

**Question:** Stage 7 describes this exactly ("Close remaining applications: bulk-transition to Rejected, with the system reason 'Opportunity closed'"), triggered when an opportunity Closes/Cancels while applications are still open. Does M7 build this admin action, or does it ship without it (leaving an admin to individually reject each remaining application if they want that outcome)?

**Options:**
- **(a) Build it** — `closeRemainingApplications(opportunityId)`, a genuine bulk action, admin-triggered, only available when the opportunity is Closed/Cancelled and open applications exist.
- **(b) Defer it** — ship M7 with only per-application transitions; an admin who wants to reject everyone after closing does it one at a time (slower, but is just repeated use of the same single-application action, not new code).

**Recommendation:** no strong lean — this is a real feature named explicitly in Stage 7, but Stage 17's screen spec explicitly says "status changes happen per-application, not in bulk, for MVP (Kanban bulk-drag view is explicitly P1)," which could be read as ruling this specific bulk action out too, or as only ruling out the *Kanban* bulk-drag UI specifically while still permitting this one named exception. Worth an explicit answer either way.

### Decision 10 — Is application detail its own route, or a panel/expansion on the list?

**Question:** neither Stage 17 nor Stage 16 mandates a dedicated `/applications/[id]` page for the member, or forecloses one. Given this codebase's existing convention (M4's directory list → dedicated profile page; M5's opportunity list → dedicated detail page), is a dedicated detail route the right pattern here too, or does My Applications show everything inline (status, interview details if applicable) without a separate page?

**Recommendation:** a dedicated route, for consistency with every other list→detail pattern already established in this codebase (directory, opportunities, verification queue all work this way) — but flagging since neither source document requires it explicitly either way; a simpler inline-expansion design is not obviously wrong.

### Decision 11 — Does Application Management support search/filter, or is it a flat unfiltered list?

**Question:** Stage 17 describes Application Management as "a funnel view of one opportunity's applications" without naming search/filter controls (unlike the Professionals directory or Find Matches's implicit "24 potential matches" framing). Is a flat list (grouped/sorted by status) sufficient for M7, or does it need filtering (e.g. "show only Shortlisted")?

**Recommendation:** flat list, grouped by status, matching Stage 17's literal description — no filter controls invented. A single opportunity's application count is expected to be small (this congregation's likely scale), so a search bar isn't obviously needed the way it was for the whole-directory Professionals screen.

### Decision 12 — Does Find Matches (M6) get a "Shortlist" action now that Applications exist?

**Question:** Stage 17's original (pre-M6) screen spec for the Matching screen included "Shortlist per candidate row." M6 deliberately omitted it (Stage 28 §6: "M6 has no reason to promise a future action... the cleaner precedent... is to not render a Shortlist control at all"), explicitly because M7 didn't exist yet as a concrete next milestone. Now that M7 does exist, should M6's Find Matches screen gain a "Shortlist this candidate" action that creates an Application directly (member never applied — admin-initiated), or does Shortlisting remain strictly a review action on an Application a member already submitted?

**Why it matters:** these are two different product models. If shortlisting can happen *without* an application (admin proactively reaches out to a matched candidate who never applied), that's a fundamentally different flow from "member applies, then admin reviews/shortlists" — it would mean Applications can be admin-created too, contradicting §5's "Applied is member-only-triggered" rule and requiring a real design decision about what status such an admin-initiated record starts in.

**Options:**
- **(a) No change to Find Matches** — it stays read-only (score/rank/breakdown only, as M6 built it). Shortlisting only ever happens through reviewing a real, member-submitted Application. This is the option that requires zero change to M6's existing screen and keeps "Applied is always member-initiated" intact.
- **(b) Add a Shortlist/invite action to Find Matches** that creates an application on the member's behalf, likely starting at a status that reflects "admin-initiated, not member-applied" (which would require adding a new status or a flag, since none of the 7 existing statuses represent this) — real new scope, not hinted at by any source document as something M7 itself should build (Stage 18's M7 description names "Apply flow... Shortlist and its Stage 8 side effect," which reads as shortlisting an *existing* application, not creating one).

**Recommendation:** (a) — matches Stage 18's own M7 description most literally, and avoids inventing a new "admin-initiated application" status/flow with no textual support anywhere in the spec set.

---

## 13. Testing Plan

Written against Decision 1's option (a) as the working default; flagged inline where (b)/(c) would change the plan materially.

### Unit tests (pure, no I/O)

**`lib/applications/rules.ts`:**
- `isApplicationTransitionAllowed(from, to, actor)` — exhaustive matrix over all 7 statuses × both actors × all 7 target statuses, every legal pair asserted true, every illegal pair explicitly asserted false (not asserted by omission) — same rigor as M3/M5/M6's own transition-matrix tests. Explicit named tests for the two trickiest forbidden cases: INTERVIEW → WITHDRAWN (forbidden even though WITHDRAWN is otherwise reachable from three earlier statuses), and every terminal-status → anything (SELECTED, REJECTED, WITHDRAWN all have zero legal outgoing transitions).
- `isApplicationEligible(...)` — exhaustive matrix: opportunity status × verification gate × duplicate-application presence, each combination explicitly asserted.

### E2E acceptance scenarios (`m7-acceptance.spec.ts`, small independent blocks per this environment's established latency lesson)

1. An eligible, verified member applies to a Published opportunity; sees "Application submitted"; the application appears in My Applications with status Applied.
2. An unverified member cannot apply — server rejects, error copy matches Stage 11's stated wording (verify exact text there before writing this test).
3. A member cannot apply to a Draft/Closed/Cancelled/Filled/Completed opportunity — no Apply button shown; direct action rejected server-side too.
4. A member who has already applied cannot apply again — server rejects with the duplicate-application copy; no second row is created (assert via a direct count, not just UI absence).
5. The application appears to the admin on `/admin/opportunities/[id]/applications` immediately after submission.
6. Admin marks an application Reviewed; member is NOT notified (no notification exists to assert against in M7 — this test instead asserts the transition succeeds and no error surfaces, since actual notification absence is inherently untestable as a positive assertion until M8 exists).
7. Admin shortlists a Reviewed application; the admin's view of that specific candidate now shows phone/email; a different, non-shortlisted candidate's contact info remains hidden in the same session.
8. Admin schedules an interview (Decision 6's required fields filled); status moves to Interview; the member's own application detail shows the interview logistics.
9. Admin records outcome Selected on an Interview-status application; member's own view shows the Selected status with no admin notes exposed (mirrors M3's existing "no detail exposed on rejection" pattern, applied here to the outcome-notes field).
10. Admin records outcome Rejected; member sees "You weren't selected for [opportunity]," no detailed reason.
11. A member withdraws an Applied application (if Decision 4 approves self-serve); status becomes Withdrawn; the application no longer shows an active-pipeline state.
12. Withdraw is unavailable once status reaches Interview (button absent, and the server action itself rejects a direct call).
13. A plain member cannot reach any `/admin/applications*`/`/admin/opportunities/*/applications` route — redirected, same pattern as every other admin-only route test in M3-M6.
14. An admin cannot read another admin's... — not applicable, since all admins have equal access in this codebase; instead: a member cannot read another member's application via a direct query (mirrors M3's existing cross-member RLS test).
15. Every forbidden transition in §5 is rejected server-side, not just hidden in the UI — call the action directly for at least the two trickiest cases (INTERVIEW → WITHDRAWN, SELECTED → anything), matching M5/M6's own "prove the server guard, not just the button's absence" discipline.
16. Contact info is genuinely absent from the admin application-detail response (not just hidden by CSS) for an Applied/Reviewed-status application — assert on the actual payload/rendered text, not just visual state.
17. (Decision-8-dependent) if headcount auto/suggested-transition is approved, a scenario proving it fires exactly at the Nth Selected application, not before or after.
18. (Decision-9-dependent) if the bulk close-remaining-applications action is approved, a scenario proving it only rejects still-open applications and leaves Selected/Rejected/Withdrawn ones untouched.

### M1-M6 regression requirement

M7 must not modify `lib/verification/`, `lib/directory/`, `lib/profile/`, `lib/opportunities/rules.ts` (M5's state machine), `lib/matching/` (M6's scoring/eligibility/rank), or any existing migration. The only anticipated additive touches to existing code: enabling the already-stubbed Contact/Shortlist buttons on `admin/professionals/[memberId]/page.tsx`, and adding a link from the member Opportunity Detail page to the new Apply action. Full M1-M6 acceptance suites re-run unchanged, same discipline every prior milestone applied.

---

## 14. Regression Plan

After implementation: full M1, M2, M3, M4, M5, M6 acceptance suites (unchanged), full unit suite, typecheck, lint, production build — identical gate sequence to M5/M6's own closing process. No test weakened or rewritten to accommodate M7.

---

## 15. Implementation Order (proposed, for approval alongside the rest of this document)

Mirrors M5/M6's own successful order:

1. Migration (`005_applications.sql`) — `applications`, `application_outcomes`, RLS, indexes — only after all decisions above are resolved, since the exact status enum, required columns, and RLS shape all depend on Decisions 1, 3, 4, 6, 7.
2. Pure modules first, exhaustively unit-tested: `lib/applications/rules.ts`.
3. Server actions/queries: `lib/applications/actions.ts`, `lib/applications/queries.ts`.
4. Member UI: Apply action on `/opportunities/[id]`, My Applications list + detail.
5. Admin UI: Application Management per opportunity, application detail, enabling the existing stubbed Contact/Shortlist buttons.
6. `m7-acceptance.spec.ts` — all scenarios from §13, in small independent blocks.
7. M1-M6 regression re-run, full quality gates.
8. Stage 29 updated with an implementation-deviations section, only after implementation completes.

---

## 16. Expected Files Changed

**New:**
- `app/supabase/migrations/005_applications.sql`
- `src/lib/applications/rules.ts`, `actions.ts`, `queries.ts`
- `src/types/application.ts`
- Member: `src/app/(member)/applications/page.tsx` (currently a nav stub), `src/app/(member)/applications/[id]/page.tsx` (pending Decision 10)
- Admin: `src/app/admin/(protected)/opportunities/[id]/applications/page.tsx`, `src/app/admin/(protected)/applications/[id]/page.tsx`
- `tests/unit/application-rules.test.ts`
- `tests/e2e/m7-acceptance.spec.ts`

**Modified, additive only:**
- `src/app/(member)/opportunities/[id]/page.tsx` — add the Apply action and application-status-aware button states.
- `src/app/admin/(protected)/professionals/[memberId]/page.tsx` — enable the existing stubbed Contact/Shortlist buttons.
- `src/components/navigation/nav-items.ts` — flip member `Applications` from `implemented: false` to `true`.
- Possibly `src/app/admin/(protected)/opportunities/[id]/page.tsx` — a link to the new Application Management screen, alongside the existing Find Matches link.

No file under `lib/verification/`, `lib/directory/`, `lib/profile/`, `lib/opportunities/rules.ts`, `lib/matching/`, or any existing migration is expected to change.

---

## 17. Migration Requirement

**Yes, a migration is required** — `applications` and `application_outcomes` are genuinely new entities with no existing schema support. Unlike M6 (which needed zero schema changes because every field it read already existed), M7 introduces the first new persisted relationship between a member and an opportunity beyond what M1-M6 built. The exact column list, status enum values, and RLS shape depend on Decisions 1, 3, 4, 6, and 7 above — the migration is not written in this document, per the task's explicit instruction, and should not be finalized until those decisions are resolved.

---

## 18. Scope / Non-Goals

Explicitly out of scope for M7, regardless of how the decisions above resolve:
- Notifications of any kind (M8) — the state machine exists and fires correctly; nothing is sent to anyone.
- Admin dashboard stats/polish, empty/loading/error-state audit pass across all M1-M9 screens (M9).
- Launch/QA/seed-data-at-scale work (M10).
- Any change to the M5 opportunity state machine or publish/completeness rules, except the specific, optional, explicitly-decided headcount-to-Filled question (Decision 8).
- Any change to the M6 matching/scoring/ranking algorithm.
- Messaging, chat, or any in-platform communication beyond the structured interview-logistics fields already named in Stage 15.
- External-organization/employer self-service access (Stage 5's future-facing, MVP-excluded role).
- A persisted application status-history/audit table (unlike verification's own audit trail) — not requested by any source document.
- Kanban/bulk-drag application boards (explicitly P1).
- Configurable/admin-tunable anything.
- AI/ML of any kind.

---

## 19. Acceptance Criteria

M7 is complete when:
1. Every decision in §12 has been explicitly resolved by Champion, not inferred.
2. The migration in §17, shaped by those resolved decisions, is applied to the live Supabase project (by Champion, per this project's established migration-application discipline — never applied automatically by the assistant).
3. Every scenario in §13's E2E plan passes, adjusted for whichever decisions were made.
4. Full M1-M6 regression passes unchanged.
5. Full unit suite, typecheck, lint, and production build all pass cleanly.
6. A final diff review confirms no file outside §16's expected list was touched, and specifically that `lib/verification/`, `lib/directory/`, `lib/profile/`, `lib/opportunities/rules.ts`, and `lib/matching/` are untouched.
7. The demoable outcome Stage 18 names for M7 actually works end to end: a member applies, an admin reviews and shortlists (contact info unlocks), and an outcome is recorded — matching whichever shape Decision 1 ultimately settles on.

---

## Summary for your review

The single most consequential finding from this inspection is Decision 1: the user-stated M7 boundary and the existing, already-decided specification set describe different shapes for the same milestone. Everything else in this document (§4-§11, §13) is written against the existing spec set as the working default, since that is what has been authoritative for M5's and M6's own scope throughout this exact process — but nothing has been built, and nothing will be, until that tension and the other eleven decisions in §12 are resolved by you. No code, migration, or existing file was touched while producing this document.
