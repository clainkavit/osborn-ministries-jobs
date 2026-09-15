# Stage 17 — Screen-by-Screen Functional Specification

Written 2026-09-09, by Champion. Item 3 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list — the largest single item. [stage-3-ux.md](stage-3-ux.md) describes every screen narratively (layout, tone, content). This document turns each **P0** screen (per [stage-5-mvp-freeze.md](stage-5-mvp-freeze.md)) into inputs, actions, permissions, states, and responsive behavior — precise enough to build without re-deriving decisions from five other documents each time.

P1/P2 screens (Kanban view, impact dashboard, employer portal, etc.) are not specified here — building them out ahead of their feature tier would contradict Stage 5's freeze. Where a screen name differs slightly between Stage 3 and the source blueprint, Stage 3's naming is used, since it's this project's own document.

Each spec follows one shape: **Purpose · Inputs · Actions · Permissions · States · API · Responsive.**

---

## Member screens

### Registration

**Purpose:** create an account, nothing more (Stage 3: "don't ask for their entire CV during registration").
**Inputs:** first name, last name, phone or email, password, confirm password.
**Actions:** Create account → `POST /auth/register`, redirects to profile onboarding Step 1. Link to Sign in.
**Permissions:** public/unauthenticated.
**States:** default; inline validation errors per field (weak password, mismatched confirm, duplicate phone/email per [stage-11-states-catalog.md](stage-11-states-catalog.md)); submitting (button disabled, "Creating account…").
**API:** `POST /auth/register` ([stage-16-api-shape.md](stage-16-api-shape.md)).
**Responsive:** single-column form at all widths, no layout branching needed.

### Profile onboarding (8 steps)

**Purpose:** build the P0 profile fields, stepped per Stage 3 section 9, not one long form.
**Inputs, by step:** 1. Personal info (photo, DOB, gender, location) · 2. Profession (searchable field against `GET /professions`, Stage 16) · 3. Employment status + years experience · 4. Education (repeatable: institution, qualification, field, years) · 5. Skills (tag entry, suggested set from `GET /skills?profession=`) · 6. CV upload (PDF/DOC/DOCX, size limit per Stage 11) · 7. Availability (Open/Selective/Not available) · 8. Review — read-only summary of all above.
**Actions:** Next/Back per step (client-side, no API call until final submit); on Step 8, "Submit for verification" → `POST /members/me/submit-for-verification`. Each step's data auto-saves as entered (`PATCH /members/me`, `POST /members/me/education` etc.) so abandonment mid-flow doesn't lose data (Stage 13's resume scenario).
**Permissions:** authenticated member, own profile only, only reachable while profile_status = Registered.
**States:** progress indicator per Stage 3 (`● ○ ○ ○ ○ ○ ○ ○`); resumed mid-flow (Stage 13); Step 6 upload failure/wrong-type/too-large (Stage 11); Step 8 submit blocked if a P0 field is missing, inline naming which one (Stage 13's submission-blocked scenario).
**API:** per-step PATCH/POST calls listed under Inputs above; final `POST /members/me/submit-for-verification`.
**Responsive:** single column, full-width steps at all breakpoints — this is the one flow where desktop and mobile should look nearly identical, since Stage 3 explicitly designs onboarding mobile-first for everyone, not just phone users.

### Member Dashboard

**Purpose:** answer Stage 3 section 11's four questions — how am I doing, am I verified, am I available, what's relevant to me.
**Inputs:** none (read-only view).
**Actions:** "Complete profile" (if incomplete) → profile edit; "Update" on availability → inline toggle, `PATCH /members/me`; "View opportunity" per card → Opportunity Detail.
**Permissions:** authenticated member, own dashboard only.
**States:** normal (populated); empty "Opportunities for you" (Stage 11's copy) if no matches yet — expected and common for a newly-verified member with a niche profession, not necessarily a bug; loading skeleton on first paint.
**API:** `GET /members/me`, `GET /opportunities` (filtered/ranked for this member — same matching logic as admin search, applied from the member's own profile as the implicit query).
**Responsive:** desktop: profile card + status cards side by side, opportunity cards in a 3-column grid (per the published UI artifact). Mobile: stacked single column, opportunity cards full-width.

### Professional Profile (own)

**Purpose:** member's view of their own profile as employers/admins will see it, plus edit access.
**Inputs:** none directly (view); "Edit profile" routes to per-section edit forms reusing onboarding's field-level inputs.
**Actions:** Edit profile (per section, not a full re-onboarding); download own CV.
**Permissions:** authenticated member, own profile.
**States:** verification badges shown per current track status (Stage 7) — both badges, Confirmed/Reviewed, Pending, or Needs Correction, using [stage-3-ux.md](stage-3-ux.md)'s resolved copy exactly ("Membership confirmed" / "Credentials reviewed"), never "Verified" alone (Stage 13's regression scenario exists specifically for this).
**API:** `GET /members/me` plus the per-section PATCH/POST/DELETE endpoints under Inputs above.
**Responsive:** desktop: header block + two-column body (experience/skills left, education/documents right, per the published artifact). Mobile: header block, then each section as a tappable row that opens its own screen (Stage 3 section 35's explicit mobile pattern — not a shrunk two-column layout).

### Opportunities (browse)

**Purpose:** member-facing search/browse of open opportunities.
**Inputs:** search text, filters (type, location — per Stage 3 section 15; profession/experience filters are less useful here since the member's own profile already implies relevance).
**Actions:** View opportunity per card.
**Permissions:** authenticated member, verified or not (browsing is fine for an unverified member; applying is not — see Opportunity Detail below).
**States:** normal; empty (Stage 11); loading.
**API:** `GET /opportunities`.
**Responsive:** grid (3-col desktop, per artifact) collapsing to single column on mobile; filters collapse into a drawer/sheet on mobile rather than an inline row (Stage 4 item #31's explicit responsive rule, not yet stated elsewhere in this project until now).

### Opportunity Detail

**Purpose:** full opportunity info plus the member's own match breakdown against it.
**Inputs:** none.
**Actions:** Apply → `POST /opportunities/:id/apply`.
**Permissions:** authenticated member. **Apply is blocked if the member isn't fully verified** (both tracks) — Stage 11's error copy ("Complete your verification to apply") — and blocked if already applied (Stage 11/13's duplicate scenario). Both are server-enforced, not just hidden client-side.
**States:** default; Apply button disabled + explanatory copy if unverified; disabled + "Already applied — [view status]" if a prior application exists; opportunity Closed/Cancelled shows a closed banner and no Apply button (Stage 11).
**API:** `GET /opportunities/:id`, `POST /opportunities/:id/apply`.
**Responsive:** desktop: two-column (description/requirements left, match breakdown card right, per the published artifact's HR Manager detail layout). Mobile: single column, match breakdown moves below requirements.

### Applications (My Applications)

**Purpose:** track every application's status.
**Inputs:** none.
**Actions:** View per application → detail or back to Opportunity Detail; none are editable once submitted (no withdraw button in this list — see note).
**Permissions:** authenticated member, own applications only.
**States:** table/list per status (Applied/Reviewed/Shortlisted/Interview/Selected/Rejected/Withdrawn, per Stage 7); empty (Stage 11).
**API:** `GET /members/me/applications`.
**Responsive:** table on desktop, cards on mobile (Stage 3's general table→card responsive rule, section 21).
**Note:** Stage 7 introduced Withdrawn as a state but no screen in Stage 3's inventory has a "Withdraw" action. This screen is the natural place for it (a Withdraw button on Applied/Reviewed/Shortlisted rows, per Stage 7's recommendation not to allow it after Interview) — **flagged as a small addition this document is making to the screen inventory, not something Stage 3 specified.**

### Notifications

**Purpose:** list of in-app notifications (Stage 12's copy), actionable.
**Inputs:** none.
**Actions:** tap a notification → routes to its related entity (opportunity, application, verification status) per Stage 15's Notification.related_entity fields; mark as read happens automatically on open.
**Permissions:** authenticated member, own notifications.
**States:** unread (bold/highlighted) vs. read; empty ("You're all caught up," Stage 11).
**API:** `GET /members/me/notifications`, `PATCH /members/me/notifications/:id/read`.
**Responsive:** list at all widths, no layout branching needed.

---

## Admin screens

### Admin Login

**Purpose:** separate from member login per Stage 3's inventory (item #25), though it may share the same underlying auth endpoint with a role check.
**Inputs:** email, password.
**Actions:** Sign in → `POST /auth/login`, server returns role; if role isn't Admin/Super Admin, redirect to member experience rather than showing an admin-specific error (avoids leaking who has admin access).
**Permissions:** public/unauthenticated until login succeeds.
**States:** default; invalid credentials (Stage 11).
**Responsive:** single-column form.

### Admin Dashboard

**Purpose:** Stage 3 section 20/55's overview — KPIs plus "needs your attention."
**Inputs:** none.
**Actions:** each "needs attention" tile links to its queue (Pending verification → Verification Queue; New applications → relevant Opportunity's application list).
**Permissions:** Church Admin, Super Admin.
**States:** normal; the published artifact's mockup numbers (2,450 members etc.) are illustrative — a freshly-launched instance should show real, likely small, numbers without looking broken (zero-state KPI tiles just show 0, not an error).
**API:** aggregate counts — likely a dedicated summary endpoint, not itemized here since it's a read-only aggregation of entities already defined in Stage 15/16.
**Responsive:** KPI grid 4-column desktop → 2-column tablet → single column mobile (Stage 3 section 36's admin-mobile pattern: condensed cards with direct action links).

### Professionals (Directory)

**Purpose:** the most-used admin screen (Stage 3 section 21) — search/filter the verified pool.
**Inputs:** search text, filters (profession, location, experience, availability — verification filter is largely moot since only both-verified members appear at all, per Stage 7's gate, so a "verification" filter here would only ever show one value; **flagged as a discrepancy with Stage 3's original filter list**, which included a Verification filter — recommend dropping it from the UI since Stage 7's later decision makes it non-functional, unless partial-visibility gets revisited).
**Actions:** open a professional's full profile; shortlist directly against a chosen opportunity (Journey 6).
**Permissions:** Church Admin, Super Admin only — never a member, never (in MVP) an external employer.
**States:** normal (table); empty search results (Stage 11); loading skeleton.
**API:** `GET /professionals`.
**Responsive:** table (desktop) → cards (mobile), per Stage 3's stated pattern.

### Admin Professional Profile

**Purpose:** an admin's full view of one member, including verification and application history.
**Inputs:** none (view); Notes field appears only in the context of a verification decision (see Verification Review below), not here.
**Actions:** Contact (only enabled once Shortlisted somewhere, per [stage-8-connection-model.md](stage-8-connection-model.md) — otherwise disabled/hidden); Shortlist (against a chosen active opportunity).
**Permissions:** Church Admin, Super Admin. Contact info (phone/email) only rendered in the response/UI if this member has at least one Shortlisted-or-later application (Stage 8, Stage 16's API note) — this is a server-side response-shape rule, not just a hidden UI element.
**States:** verification badges (Stage 3's resolved copy); sections per PRD section 24 (experience, education, skills, certifications, documents, verification history, applications).
**API:** `GET /professionals/:id`.
**Responsive:** two-column desktop, stacked mobile — same general pattern as the member's own profile screen.

### Verification Queue

**Purpose:** Stage 3 section 23 — the trust-model's operational core.
**Inputs:** tab filter (All / Pending / Approved / Needs correction).
**Actions:** open a member's Verification Review.
**Permissions:** Church Admin, Super Admin.
**States:** count badge per tab; empty "You're all caught up" (Stage 11) on the Pending tab specifically — a genuinely good state, not a failure.
**API:** `GET /admin/verification-queue`.
**Responsive:** list at all widths; each row is compact enough not to need a table→card transformation.

### Verification Review

**Purpose:** Stage 3 section 24 — where Journey 4's actual approve/correct decisions happen.
**Inputs:** Notes field (free text, tied to a correction decision).
**Actions:** Approve Membership → `POST /admin/members/:id/verify-membership`; Approve Credentials → `POST /admin/members/:id/verify-credentials`; Request correction on either (requires — or per Stage 11's soft-warning recommendation, strongly nudges toward — a note).
**Permissions:** Church Admin, Super Admin.
**States:** each track shown independently (Pending/Confirmed/Needs Correction, per Stage 7 — this screen is the one place both tracks' independence must be visually obvious, since Journey 4 depends on admins understanding they're two separate decisions, not one).
**API:** the two verify-* endpoints ([stage-16-api-shape.md](stage-16-api-shape.md)).
**Responsive:** desktop: two-column (profile left, verification controls right, per Stage 3 section 24). Mobile: stacked, verification controls below the full profile rather than beside it.

### Opportunities (Admin list/manage)

**Purpose:** Stage 3 section 25.
**Inputs:** none directly; "Create opportunity" routes to the creation flow.
**Actions:** Create opportunity; Manage (open) an existing one → its detail/candidate view.
**Permissions:** Church Admin, Super Admin.
**States:** status badges per Stage 7 (Draft/Published/Closed/Completed/Cancelled/Filled — using "Active" as Published's display label per Stage 7's naming note).
**API:** `GET /admin/opportunities` (implied, not explicitly listed in Stage 16 but follows the same pattern as the member-facing GET).
**Responsive:** list/table desktop, cards mobile.

### Create Opportunity

**Purpose:** the 5-step guided creation flow, Stage 3 section 26.
**Inputs, by step:** 1. Type (Employment / Church opportunity / Service — Project/Business NOT offered, P2 per Stage 5) · 2. Title, organization, location, description · 3. Requirements (profession, experience, education, skills, headcount) · 4. Review · 5. Publish.
**Actions:** Next/Back; Save as Draft (implicit — the entity starts in Draft per Stage 7 until explicitly published, so a partial creation can be abandoned and resumed, same resume principle as member onboarding); Publish → `POST /admin/opportunities/:id/publish`.
**Permissions:** Church Admin, Super Admin.
**States:** step progress; validation per step (can't reach Publish without required fields, mirroring the member onboarding's submission-blocked pattern).
**API:** `POST /admin/opportunities` (creates as Draft), `PATCH /admin/opportunities/:id` (per-step edits), `POST /admin/opportunities/:id/publish`.
**Responsive:** single column at all widths, same reasoning as member onboarding.

### Find Matches (Matching screen)

**Purpose:** Stage 3 section 27 — "potentially the most impressive screen in the entire product," and the literal "aha moment" (Stage 4 item #52).
**Inputs:** none beyond the already-published opportunity's own requirements.
**Actions:** Shortlist per candidate row; View full profile per candidate.
**Permissions:** Church Admin, Super Admin.
**States:** result count ("24 potential matches"); each row shows the full per-criterion breakdown per [stage-9-matching-algorithm.md](stage-9-matching-algorithm.md) — **this is a hard requirement, not a nice-to-have**: a version of this screen that only shows a percentage without the breakdown does not meet spec; empty (Stage 11's "no matching professionals" copy, distinct from a zero-result search).
**API:** `GET /admin/opportunities/:id/matches`.
**Responsive:** table desktop, cards mobile — match breakdown (the ✓/✕ grid) needs its own compact mobile treatment since a 6-column checkmark grid doesn't fit a phone width; stack the criteria vertically per candidate card instead of as table columns.

### Application Management (per opportunity)

**Purpose:** Stage 3 section 30 — funnel view of one opportunity's applications.
**Inputs:** none (view); status changes happen per-application, not in bulk, for MVP (Kanban bulk-drag view is explicitly P1 per Stage 5).
**Actions:** open an application → change status (`PATCH /admin/applications/:id/status`, or the dedicated Shortlist convenience endpoint per Stage 16); record outcome once status reaches Selected/Rejected.
**Permissions:** Church Admin, Super Admin.
**States:** funnel counts per status; a simple sorted/filtered list stands in for the Kanban board at MVP (Stage 5's explicit P1 deferral of the Kanban view — this screen should still work, just without drag-and-drop).
**API:** `GET /admin/opportunities/:id/applications`, `PATCH /admin/applications/:id/status`.
**Responsive:** list/table desktop, cards mobile.

---

## What this document does not specify

P1/P2 screens (Kanban application board, impact dashboard, employer portal, project management screens, privacy/visibility settings page) — building functional specs for features not yet in scope would front-run Stage 5's freeze. If any of those get promoted to P0 later, this document's format (Purpose · Inputs · Actions · Permissions · States · API · Responsive) is the template to extend it with, not a new format to invent.
