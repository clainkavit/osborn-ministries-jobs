# Stage 26 — M5 Pre-Implementation Review

Written 2026-09-12, by Claude, at Champion's request, before any M5 code, following the same process used for [stage-24-m4-pre-implementation-review.md](stage-24-m4-pre-implementation-review.md). Inspects [stage-18-development-milestones.md](stage-18-development-milestones.md)'s M5 definition against every relevant spec document (Stages 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 20) and the current codebase (M1-M4, done and verified: 19/19 M4 acceptance, 19/19 M3 regression, 11/11 M2 regression, 10/10 M1 regression, 54/54 unit tests). This document does not resolve any contradiction it finds — it names each one and asks for a decision. **No M5 code has been written.**

---

## 1. Exact M5 goal

Per [stage-18-development-milestones.md](stage-18-development-milestones.md):

> **M5 — Opportunities.** Create Opportunity (5-step flow), the Opportunity state machine (Draft→Published→Closed/Cancelled/Filled), member-facing browse/detail screens. **Demoable as:** an admin can publish an opportunity (ideally the actual founding case — 3 drivers, HR Manager, per [stage-14-seed-data.md](stage-14-seed-data.md)) and a member can view it. **No matching or applying yet.**

Three deliverables: (1) the admin's 5-step Create Opportunity flow, (2) the Opportunity entity's lifecycle (Draft/Published/Closed/Cancelled/Filled, per Stage 7, with the correct transitions), (3) member-facing browse + detail screens that display a published opportunity — explicitly without a working Apply button or any match scoring.

---

## 2. M5 scope

From Stage 17's screen specs, Stage 6 Journey 5, Stage 13's acceptance scenarios, and Stage 5's P0 list:

- **Create Opportunity** (admin) — the 5-step guided flow: Type → Title/organization/location/description → Requirements (profession, experience, education, skills, headcount) → Review → Publish. Draft-by-default, resumable (same pattern as M2's onboarding wizard).
- **Opportunities (Admin list/manage)** — list of an admin's opportunities with status badges, "Create opportunity" entry point, "Manage" into each one's detail.
- **Opportunity state machine** — Draft → Published → Closed/Cancelled, and Published → Filled → Closed (Stage 7). The `/close`, `/cancel` transitions and their stated non-effect on existing applications (there are none yet in M5, since Applications is M7 — but the *transition itself* and its blocking of new applications is M5's job to implement correctly for when M7 arrives).
- **Opportunities (browse)** (member) — search/filter across **Published** opportunities only.
- **Opportunity Detail** (member) — full opportunity information. **Without** the match breakdown (M6) and **without** a working Apply button (M7) — see §3 for exactly what that means concretely.
- Regression: M1, M2, M3, M4 all pass unchanged.

---

## 3. Explicitly OUT-OF-SCOPE items

Per Stage 18's own milestone boundaries:

- **Matching / Find Matches screen, `GET /admin/opportunities/:id/matches`, any per-criterion breakdown** — M6. Stage 17's own "Opportunity Detail" description bundles "the member's own match breakdown against it" into that screen, but that breakdown does not exist until M6 (see Contradiction 1, §12). M5's Opportunity Detail shows the opportunity's own stated requirements as **plain text/list**, not a personalized match score against any specific member.
- **Applications: Apply button, `POST /opportunities/:id/apply`, My Applications, Application Management, the Application state machine, shortlisting, contact-info reveal, interview logistics, outcomes** — M7 (and M8 in Stage 8's staged-visibility sense). Stage 5 marks "Apply to an opportunity" as P0, and Stage 17's Opportunity Detail spec lists a working Apply action — both predate the milestone split and are now superseded by it (see Contradiction 2, §12). M5's Opportunity Detail shows no working Apply control at all — not disabled-with-a-reason (there's no "unverified" or "already applied" state to represent without Applications existing), just genuinely absent, matching M4's precedent for Contact/Shortlist.
- **Headcount → Filled auto-transition** — Stage 7 itself flags this as unwired to any journey ("not yet wired into any journey... a real gap") and it depends on counting Selected applications, which don't exist until M7. M5 stores `headcount_required` as a field but does not implement the auto-Filled trigger; `Filled` remains a state an admin can reach only if they set it manually (see §13, Gap).
- **Opportunity-published notifications** — no notification type or copy exists in Stage 12 for this event. Not something M5 should invent (see §13, Gap D discussion — settled as a non-gap: there is genuinely nothing to build here without a spec).
- **Project and Business opportunity types** — explicitly P2 per Stage 5, confirmed absent from Stage 2 §26, Stage 6 Journey 5 step 1, and Stage 17's Create Opportunity step 1. Only Employment, Church Opportunity, Service are in scope.
- **Kanban application view, employer portal, AI matching, messaging** — out of scope for the whole MVP per Stage 5, unaffected by M5.
- **Multi-branch / Church / Branch entities** — never built (see §12, Discrepancy 3). M5 must not introduce `church_id`/`branch_id` on `opportunities`, since there is nothing in the live schema to reference.
- **Any change to M1-M4 schema, RLS policy, or behavior** not required to add the new `opportunities`/`opportunity_requirements`/`opportunity_required_skills` tables and their own RLS.

---

## 4. Every screen/page M5 creates or modifies

| Screen | Status | Action |
|---|---|---|
| **Opportunities (Admin list/manage)** — `/admin/opportunities` | Currently a `ComingSoon` stub | **Replace.** List of opportunities with status badges (Draft/Published/Closed/Completed/Cancelled/Filled, "Active" as Published's display label per Stage 7), "Create opportunity" entry, Manage → opportunity detail. |
| **Create Opportunity** — needs a route (Stage 17 implies `/admin/opportunities/new`, matching Stage 20's route sketch) | Does not exist | **Create.** 5-step wizard, same shape as M2's `OnboardingWizard` (step components, resumable via Draft, review step, no premature publish). |
| **Admin Opportunity Detail / Manage** — needs a route (`/admin/opportunities/[id]`) | Does not exist | **Create.** View one opportunity's own info + status + the Close/Cancel actions. Explicitly NOT the Find Matches screen (M6) or Application Management (M7) — those are separate screens per Stage 17 that this screen may eventually link into, once they exist. |
| **Opportunities (browse)** — `/opportunities` | Currently a `ComingSoon` stub | **Replace.** Member-facing search/filter (type, location per Stage 17) over Published opportunities only. |
| **Opportunity Detail (member)** — needs a route (`/opportunities/[id]`) | Does not exist | **Create.** Full opportunity info, requirements shown as plain text/list, no match breakdown, no Apply button. |
| Admin dashboard "Active Opportunities" stat (currently hardcoded `0`) | Stub | Candidate for wiring to a real count of Published opportunities, following M4's exact precedent for "Verified Professionals" (flagged, not assumed — see §13 Gap E). |
| Member dashboard "Opportunities for you" | Currently the dashboard shows no opportunity cards at all (M1/M2 built the dashboard before Opportunity existed) | Stage 17 describes this as **matching-ranked** content ("same matching logic as admin search") — that's M6. M5 should NOT populate this section, since doing so honestly requires either matching (not built) or an arbitrary substitute ordering the spec doesn't define. Left for M6, explicitly (see Contradiction 1). |

---

## 5. Database tables/fields required

**New tables** (no existing table covers any of this):

- **`opportunities`** — per Stage 15 (the canonical logical model): `id, title, type, organization_name, location, description, status, headcount_required, created_by, created_at`. Add `updated_at` and `published_at`/`closed_at` (timestamps for the state transitions, following the same pattern `verification_history.created_at` and the members-status-timestamp conventions already use) — not explicitly listed in Stage 15 but a reasonable, low-risk addition matching Stage 20's own column sketch, not a new product concept.
  - `status` check constraint: `'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED' | 'CANCELLED' | 'FILLED'` (Stage 15's full enum; Stage 7's diagram implies Closed as a precursor to Completed, and Filled as a precursor to Closed — see §12, Contradiction 4 for the exact transition-graph ambiguity this creates).
  - `type` check constraint: `'EMPLOYMENT' | 'CHURCH' | 'SERVICE'` (Stage 2 §26, Stage 6 Journey 5 step 1, Stage 17 step 1 — all three agree).
  - `created_by` references `members(id)` — NOT a separate `Admin` table (Stage 15's own model), following the already-established M1 precedent that admins are `members` rows with `role IN ('CHURCH_ADMIN','SUPER_ADMIN')`. This is not a new decision — it's consistency with what M1 already shipped.
  - No `church_id`/`branch_id` — see §3 and §12 Discrepancy 3.
- **`opportunity_requirements`** — per Stage 15: `id, opportunity_id, required_profession_id (nullable, → professions), min_experience_years, required_education_level`. `required_education_level` can reuse the existing `EducationLevel` type/enum values (`NONE | SECONDARY_CERTIFICATE | DIPLOMA | BACHELORS | MASTERS | DOCTORATE`) already defined in `src/types/member.ts` for M5/M6 — that type exists today but is otherwise unused on any member-side column, so this is its first real use, not a new enum to invent.
  - `location_required` — Stage 15 lists this field on `OpportunityRequirement` but never defines its type or meaning, and it isn't distinguished from `opportunities.location` anywhere. **Needs a decision, not an assumption** — see §13, Gap A.
- **`opportunity_required_skills`** — join table, `opportunity_id, skill_id` (mirrors the existing `member_skills` join exactly, per Stage 15's own stated intent: "mirroring MemberSkill").

**No changes to any existing table** (`members`, `education`, `experience`, `professions`, `skills`, `member_skills`, `certifications`, `documents`, `verification_history`, `notifications`). `notifications.type`'s check constraint stays as M3 defined it — no opportunity-related notification type exists in Stage 12 to add (confirmed: not a gap, genuinely nothing specified).

---

## 6. Server actions/APIs required

Following the established Server Component + `lib/<domain>/{queries,actions}.ts` pattern from M2-M4:

- `lib/opportunities/actions.ts`:
  - `createOpportunity(step1Data)` → creates a Draft row, returns its id (mirrors `register()`'s "create the row, then fill it in" shape more than the onboarding wizard's "profile already exists" shape, since there is no opportunity row until the admin starts).
  - `saveOpportunityStep(id, stepData)` — per-step save while Draft, same "save on Next" pattern as M2's onboarding actions.
  - `publishOpportunity(id)` — Draft → Published, server-validates all required fields per Stage 13's acceptance scenario ("title exists; opportunity type exists; requirements exist; organization/requesting department exists; location exists where applicable"). **Whether "administrator has approved it" (PRD §57) means anything beyond "the creating admin clicked Publish" is Contradiction 2's open question — see §12.**
  - `closeOpportunity(id)` — Published → Closed. Blocks new applications going forward (there are none to block yet in M5, but the transition and the resulting "Apply is hidden on a Closed opportunity" rule on the Detail screen is M5's job).
  - `cancelOpportunity(id)` — Published → Cancelled.
  - No `POST /admin/opportunities/:id/applications/close-remaining` — that's meaningless before Applications exists (M7).
- `lib/opportunities/queries.ts`:
  - `getAdminOpportunities()` — every opportunity, any status, admin-only (mirrors `getVerificationQueue()`'s shape).
  - `getOpportunityForAdmin(id)` — one opportunity's full detail (requirements + skills), admin-only.
  - `getPublishedOpportunities(filters?)` — member-facing browse, **Published status only**, with search/filter params (type, location per Stage 17) — mirrors `getDirectoryProfessionals(filters)`'s exact shape and submit-triggered-filter idiom from M4.
  - `getOpportunityDetail(id)` — one Published opportunity's public detail. Returns `notFound()`/null for a non-Published opportunity requested by a member (a Draft opportunity must never be visible to a member via a guessed/stale URL — same posture M4 gave `isMemberInDirectory`'s not-found guard).
  - `getPublishedOpportunityCount()` — for the admin dashboard stat, if Gap E is resolved to build it (mirrors `getDirectoryProfessionalCount()`).
- No Route Handlers needed — same reasoning as M4 (Server Components read `searchParams` directly; forms POST via Server Actions).

---

## 7. Authorization/RLS requirements

**New RLS policies needed** (no existing policy covers `opportunities`/`opportunity_requirements`/`opportunity_required_skills`, since these tables don't exist yet):

- `opportunities`:
  - Admin (Church Admin / Super Admin, via the existing `is_church_admin()` helper — already `SECURITY DEFINER`-fixed in M3, directly reusable) — full CRUD on any row.
  - Authenticated member — SELECT only, and **only where `status = 'PUBLISHED'`** (the RLS-level mirror of the gate, same pattern M3/M4 established for `isDirectoryVisible()`: enforced in the policy, not left to the frontend to filter).
  - No public/unauthenticated access — Stage 17 says "authenticated member, verified or not" for browsing, so an anonymous visitor should not see opportunities (consistent with M1's `/opportunities` route already sitting behind the authenticated-member middleware gate, not the public one).
- `opportunity_requirements`, `opportunity_required_skills`:
  - Admin — full CRUD (tied to the parent opportunity, matching the `education`/`experience` per-member CRUD pattern's shape but scoped to `opportunity_id` instead of `member_id`).
  - Member — SELECT only where the parent opportunity is Published (same join-through-parent pattern the admin sub-collection SELECT policies from migration 003 already use, just for a different parent entity).

**Server-code discipline restated** (not a new rule, the same one M3/M4 both required): every member-facing query must apply the `status = 'PUBLISHED'` clause unconditionally before any filter, never let a filter parameter or a guessed ID bypass it.

---

## 8. Important business rules

Restated from Stages 2, 6, 7, 13 — inputs to M5, not decisions M5 makes:

- **"Published" is the canonical state name; "Active" is the display label only** (Stage 7's explicit naming note) — do not introduce a literal `ACTIVE` status value.
- **Opportunity type is exactly three values in MVP**: Employment, Church Opportunity, Service. Project and Business are P2 and must not appear as creation options.
- **Closing an opportunity blocks new applications only; it never automatically touches existing applications** (Stage 7's 2026-09-10 decision, reversing an earlier draft). M5 has no applications yet, so this rule's *effect* isn't observable yet, but the *transition itself* (Published → Closed disabling further access) is M5's to implement correctly so M7 inherits a correct foundation.
- **A member cannot see a Draft, Closed, Cancelled, Completed, or Filled opportunity's detail page via any route** — only Published is member-visible. (Whether a member should still see a *Closed* opportunity they already interacted with is an M7-era question once Applications exist; M5 has no such case to handle.)
- **An opportunity requiring "no specific profession"** is valid (`required_profession_id` nullable per Stage 15) — the creation flow must not force a profession selection.
- **`GET /opportunities` is member-facing and only returns Published** (Stage 16's own comment on that exact endpoint) — this is the same predicate the RLS policy in §7 also enforces; the two must agree, not diverge.

---

## 9. User journeys affected

- **Journey 5 — Church Admin creating an opportunity and finding matches.** Steps 1-3 (create, guided form, appears in the admin list and becomes visible to browse) are M5's job. **Steps 4-7 (Find matching professionals, ranked results, Shortlist, shortlist notification) are M6/M7 and explicitly out of scope.** Journey 5's own step 3 note — "becomes visible to matching members in their 'Opportunities for you' and the public Opportunities browse screen" — splits into an M6 half (the matching-ranked dashboard section) and an M5 half (the plain browse screen); only the M5 half is this milestone's job (see Contradiction 1).
- **Journey 1 — new member, steps 9-11** ("Opportunities for you" populated, member opens an opportunity, sees "Your match" breakdown, Apply). Steps 9 and 11 are explicitly NOT M5 (matching-populated dashboard section, and the Apply action). Step 10's first half ("member opens an opportunity... sees requirements") is the one piece of Journey 1 M5 does implement, minus the match breakdown that same step names.
- **Journey 6 — Church Admin searching the directory directly**, step 5's "shortlist directly against an existing opportunity" now has a real opportunity to point at (M5 creates opportunities), but the Shortlist action itself remains unbuilt until M7 — M5 does not change M4's already-correct disabled Shortlist button; an opportunity existing doesn't change what's wired up.

---

## 10. Dependencies on M1-M4

- **M1** — admin auth/role gate, `getCurrentMember()`, the `/admin/*` and authenticated-member middleware matchers (already cover `/admin/opportunities` and `/opportunities` by route pattern, no middleware change needed).
- **M2** — the `OnboardingWizard` component's shape (step components, `bindNext`/`refresh` props, resumable-Draft pattern, a Review step before final submit) is the direct structural precedent for Create Opportunity's own 5-step wizard. The `checkCompleteness`-style pure-predicate module pattern (`lib/profile/completeness.ts`) is the precedent for an equivalent `lib/opportunities/completeness.ts` (or similarly named) that gates Publish the same way M2 gates Submit-for-verification.
- **M3** — `is_church_admin()` (now `SECURITY DEFINER`-safe), the admin-RLS pattern, and the "server-enforced gate, never a frontend filter" discipline all carry forward unchanged.
- **M4** — `getDirectoryProfessionals(filters)`'s shape (a `Filters` interface, unconditional-gate-then-filters query construction, a paired `*Count()` function, submit-triggered search via a native GET form) is the direct precedent for `getPublishedOpportunities(filters)`. `EducationLevel`/`EDUCATION_LEVELS` (built in M2, unused until now) get their first real consumer in `opportunity_requirements.required_education_level`.
- **M5 must not alter any M1-M4 behavior.** All four regression suites (10/10, 11/11, 19/19, 19/19) must still pass unchanged after M5 ships.

---

## 11. Acceptance criteria/tests

From Stage 13's own scenario plus the milestone's stated scope:

1. **Opportunity creation and publish** (Stage 13's own scenario, M5-scoped half) — an admin completes the 5-step flow with all required fields, selects Publish, and the opportunity transitions Draft → Published and becomes immediately visible on the member browse screen. (The scenario's "and in matching" clause is M6's to prove, not M5's.)
2. **Publish is blocked on missing required fields** — mirrors M2's submission-blocked pattern; inline, naming which field, per Stage 13's stated style for the analogous member-profile scenario.
3. **A Draft opportunity is never visible to a member** — direct URL to a Draft opportunity's detail page 404s/redirects for a member; does not appear in browse or any count.
4. **Closing an opportunity removes it from member browse and disables/hides its own Apply-adjacent affordance** — even though Apply doesn't exist yet in M5, the Detail screen's "Closed banner, no Apply button" state (Stage 17/Stage 11) should render correctly once the opportunity is Closed.
5. **Type is restricted to Employment / Church Opportunity / Service** — the creation flow offers no Project/Business option.
6. **A plain member cannot reach `/admin/opportunities`, `/admin/opportunities/new`, or `/admin/opportunities/[id]`** — same redirect pattern as M3/M4's own access-control tests.
7. **Opportunity type, status, and requirements display correctly on both the admin detail and member detail screens**, including a nullable `required_profession_id` (no profession required) rendering sensibly, not as an error or a blank crash.
8. **Search/filter on the browse screen narrows correctly** (type, location) — same submit-triggered pattern M4's Decision 4 established; assert no filtering happens on keystroke alone.
9. **Empty states** — zero Published opportunities at all vs. a search/filter matching none, using distinct, genuine copy (see Gap C, §13 — Stage 11's existing "no opportunities" copy is written for the matching-populated case, not a plain empty browse).
10. **M1 regression (10/10, 1 expected skip), M2 regression (11/11), M3 regression (19/19), M4 regression (19/19)** all still pass unchanged.

---

## 12. Contradictions between the existing specifications

**Contradiction 1 — Opportunity Detail's "match breakdown" is bundled into a screen this milestone must partially build.** Stage 17 describes "Opportunity Detail" as one screen with "full opportunity info plus **the member's own match breakdown against it**." Stage 18 splits browse/detail (M5) from matching (M6) into separate milestones. There is no version of "Opportunity Detail" as Stage 17 describes it that M5 alone can fully deliver — the screen genuinely needs a second pass once M6 exists. This isn't a minor wording gap: a developer following Stage 17 literally would build a match-score UI element with nothing to populate it. **Not resolved here** — M5's Detail screen shows the opportunity's stated requirements as plain informational text/list (no personalized scoring), and the match-breakdown card is explicitly deferred to M6, matching Stage 18's own "no matching... yet" line for this milestone. Flagged so the reduced scope is a deliberate, named choice, not a silent trim.

**Contradiction 2 — "Apply to an opportunity" is Stage 5's own P0, but Stage 18 defers it to M7.** Stage 5's MVP freeze table lists "Apply to an opportunity" as P0, same tier as "Browse/search opportunities." Stage 17's Opportunity Detail spec includes a working `Apply → POST /opportunities/:id/apply` action as part of that same screen. Stage 18's milestone breakdown puts Applications entirely in M7, and explicitly states M5's own demo has "no matching or applying yet." This is the same class of tension M4 already resolved once (Stage 5's P0 filter list vs. Stage 17's later, more specific screen recommendation) — here it's Stage 5's P0 feature list vs. Stage 18's later, more specific milestone sequencing. **Not resolved here.** Given M4's precedent (the later, more specific document won by explicit Champion decision when this exact pattern came up for the Verification filter), the same reasoning would point toward Stage 18 as authoritative for sequencing — but that is exactly the kind of call this review is not supposed to make unilaterally, especially given Stage 5 marks Apply P0 in the same breath as Browse, which M5 IS building. See Decision 1.

**Contradiction 3 — physical schema disagreement between Stage 15 and Stage 20 on where opportunity requirement fields live.** Stage 15 (the canonical logical data model) puts `min_experience_years`, `required_education_level`, and `required_profession_id` on a separate `OpportunityRequirement` entity. Stage 20 (technical architecture) lists `minimum_experience`, `required_education`, and `required_profession_id` as columns directly on the `opportunities` table itself, with no separate requirements table mentioned at all (though it does separately list `opportunity_skills` as its own table). These are two different physical shapes for the same data. Stage 15 is the more detailed, dedicated data-modeling document; Stage 20 is a broader architecture document whose own opening paragraph already flags itself as pre-dating some later decisions ("this document's Section 42... predates seeing that resolution... should be read as historical framing"). **Not resolved here** — flagged because building against the wrong one is expensive to unwind once member-facing queries exist. See Decision 2.

**Contradiction 4 — the Opportunity state machine's terminal-state graph is ambiguous about Filled's and Completed's relationship to Closed.** Stage 7's diagram shows a linear `Published → Closed → Completed` main path, with a side branch `Published → Filled → Closed`. Read literally, Filled always leads back into Closed (so Filled is a waypoint, not a true terminal state), and Completed is only reachable from Closed (never directly from Published or Filled). But Stage 15's `status` enum lists `Closed | Completed | Cancelled | Filled` as five flat sibling values with no stated ordering, and Stage 18's own M5 milestone description says "Draft→Published→Closed/Cancelled/Filled" — listing Filled as a same-tier alternative to Closed/Cancelled, not as a state that must then transition again into Closed. **Not resolved here.** This affects real implementation decisions: can an admin transition an opportunity directly from Published to Completed, or must it always pass through Closed first? Is Filled a genuine terminal state an admin can leave an opportunity in indefinitely, or must the UI force a further Filled → Closed step? See Decision 3.

**Contradiction 5 — whether Publish requires a distinct approval step, beyond the creating admin's own action.** Stage 2 PRD §57's acceptance-criteria example states an opportunity "can be published when... administrator has approved it," listed as one condition among several field-existence checks. Stage 6 Journey 5's own note flags this exact question as unresolved ("the PRD doesn't specify whether a new opportunity is visible to members instantly on publish or only after some admin double-check... **Flag if a review step is wanted**"). Stage 7 restates it as "**Unresolved from Journey 5**." Three documents each touch this and none commits to an answer — the PRD's phrasing is ambiguous enough that "administrator has approved it" could mean nothing more than "the admin clicked Publish" (self-referential, already covered by the flow itself) or could mean a second, distinct admin sign-off is required before member visibility. **Not resolved here.** See Decision 4.

**Contradiction 6 — `OpportunityRequirement.location_required`'s type and relationship to `Opportunity.location` is undefined.** Stage 15 lists `location_required` as a field on `OpportunityRequirement` with no type, no description, and no stated relationship to `Opportunity.location` (which already captures where the role is). No other document mentions this field at all. It could be a duplicate/redundant restatement of the opportunity's own location, a boolean ("is location a hard requirement vs. remote-friendly"), or something else entirely. **Not resolved here.** See Decision 5.

---

## 13. Gaps or ambiguities that require a product decision

**Gap A — see Contradiction 6 above** (folded in as Decision 5, not listed twice).

**Gap B — Admin Opportunity Detail's relationship to Find Matches and Application Management.** Stage 17 lists "Find Matches" and "Application Management" as separate screens from the general opportunity detail/manage view, but doesn't specify whether they're reached via tabs on one screen, separate top-level routes, or something else. M4 faced the analogous question (Gap C there, resolved as Decision 5: Directory → Profile → conditionally into Verification Review) and it mattered enough to get an explicit answer. The M5-scoped version is smaller (M6/M7 screens don't exist yet, so there's nothing to link to today), but the admin Opportunity Detail screen's own layout should probably reserve the IA decision now rather than needing a rework later. Recommend treating this as a "when M6/M7 exist" placeholder question, not blocking M5 — flagged, not assumed resolved.

**Gap C — empty-state copy for the member browse screen with zero Published opportunities.** Stage 11's only opportunity-related empty-state copy ("No opportunities yet. There aren't any opportunities matching your profile right now...") is written for the matching-populated dashboard section (it presumes a member profile being matched against), not a plain unfiltered browse screen with nothing published at all. Using it verbatim on M5's browse screen would be a slight misuse, same class of issue M4 flagged and got explicit copy for (Decision 6 there). Needs new copy, or an explicit decision to adapt/reuse the existing line despite the mismatch. See Decision 6.

**Gap D — opportunity-published notifications.** Checked and confirmed NOT a gap: no notification type or copy exists in Stage 12 for this event, and nothing in Stage 7's Opportunity machine or Stage 6's journeys describes one. M5 should not invent a notification here. (Included for completeness since M4's equivalent review raised and then resolved a similar question — this one resolves itself with "don't build it," no decision needed.)

**Gap E — should the admin dashboard's "Active Opportunities" stat (currently hardcoded `0`) become real in M5?** Same shape as M4's Gap E/Decision 7 (which was approved). Nothing in Stage 18 assigns dashboard-stat wiring to M5 specifically, but it's the same one-line natural side effect M4 already set a precedent for. See Decision 6 — batched with the empty-state copy question since they're both "small polish items following M4's precedent," not structural.

**Gap F — should `opportunity_requirements`' skills be required-vs-preferred, or a flat list?** Stage 15's `OpportunityRequiredSkill` join is described as mirroring `MemberSkill` "many-to-many" with no `required`/`preferred` distinction, but Stage 20's physical sketch calls the join `opportunity_skills (opportunity_id, skill_id, required)` — a boolean `required` column Stage 15 doesn't mention at all. Small, but real: does every listed skill count equally toward Stage 9's future skills_match calculation (M6, not M5's problem to solve), or does M5 need to capture a required/preferred distinction now so M6 doesn't have to retrofit it? Recommend deferring to M6 (add the column then, if M6's algorithm needs it) rather than building an unused distinction now — but flagged rather than assumed, since it's a schema decision that's cheap now and more disruptive to add after data exists.

---

## 14. Technical risks

- **No `Church`/`Branch` tables exist**, despite Stage 15's logical model and Stage 20's physical sketch both assuming `church_id` on every top-level entity. This was already true before M5 (M1's own `members` table omits it) but M5 is the first milestone since M1 to introduce a brand-new top-level entity, making the gap newly relevant. Resolved by precedent, not a risk requiring a decision (§3/§12 Discrepancy 3) — noted here as a risk only in the sense that a future multi-branch requirement would need retrofitting across `members` AND `opportunities` together, not just one.
- **This development environment's network path to the live Supabase project has shown highly variable latency** throughout M3 and M4's own acceptance testing (single requests ranging from sub-second to 25+ seconds; a local HTTP proxy needed explicit bypass; the production server has been observed to silently stop responding mid-test-run at least once). A 5-step Create Opportunity wizard, structurally similar to M2's 8-step onboarding wizard, will be exposed to the same risk M2/M3/M4's acceptance suites already had to work around (splitting long serial test flows into smaller independent tests, generous timeouts, retry-tolerant test design). Worth planning the M5 acceptance suite's structure with this in mind from the start, rather than discovering it mid-build as happened in M3/M4.
- **Reusing `EducationLevel` for `required_education_level` is the first time that type is used anywhere in a live column.** It was defined in M2 for a schema field (`education.level`) that was never actually added to the `education` table (confirmed in M4's review — `education` stores only free-text `qualification`, no normalized level). Using the same TypeScript type for a different table's column is fine technically, but worth double-checking the enum's values are actually right for an *opportunity's* stated requirement (e.g., "Bachelor's or equivalent" reads naturally as a requirement in a way "Doctorate" might not for most of this congregation's likely opportunity types) — not a blocking risk, just worth a sanity check during build, not a reason to invent a second enum.
- **72+ test members already exist in the live database** from M1-M4's own acceptance runs (confirmed in M4's review). M5's browse/search acceptance tests will need to create their own distinguishable opportunities the same way M4's tests created distinguishable members, and should expect real accumulated test data (including, eventually, test opportunities from M5's own repeated runs) rather than assuming a clean slate.

---

## 15. Proposed implementation order

(Proposed only — not started, pending the decisions in §16.)

1. Resolve Decisions 1-6 below.
2. Write `context/stage-27-m5-implementation-checklist.md` (matching the Stage 25 pattern) reconciling this review with the decisions into a concrete build plan.
3. Migration for `opportunities`, `opportunity_requirements`, `opportunity_required_skills` + RLS, per the schema Decision 2 resolves.
4. `lib/opportunities/{queries,actions}.ts` — pure completeness/validation module first (unit-tested, mirroring `lib/profile/completeness.ts`), then the query/action layer.
5. Admin screens: Opportunities list, Create Opportunity (5-step wizard), Admin Opportunity Detail (view + Close/Cancel actions).
6. Member screens: Opportunities browse (search/filter, submit-triggered), Opportunity Detail (no match breakdown, no Apply).
7. Wire the admin dashboard's Active Opportunities stat, if Decision 6 approves it.
8. Unit tests for the pure validation/gate logic; `m5-acceptance.spec.ts` structured from the start around this environment's known latency (small, independent test blocks, same lesson M3/M4 learned the hard way).
9. Re-run `m1-acceptance`, `m2-acceptance`, `m3-acceptance`, `m4-acceptance` unchanged; typecheck, lint, build, full unit suite.
10. Document deviations in the Stage 27 checklist, matching the M1-M4 pattern.

---

## 16. M5 decisions needed

Only the items that genuinely require product/Champion approval before implementation.

1. **Does M5 build a working Apply action, or is Applications fully deferred to M7 as Stage 18 states?** (Contradiction 2.) Stage 5 marks "Apply to an opportunity" P0, same tier as Browse (which M5 is building); Stage 18's milestone sequencing puts Applications entirely in M7 and explicitly says M5's demo has "no... applying yet." Recommend following Stage 18 (M4's precedent already established that the later, more specific document wins this exact class of conflict) — but this is exactly the kind of call that needs your confirmation, not an assumption.
2. **Where do `min_experience_years`, `required_education_level`, and `required_profession_id` physically live** — on a separate `opportunity_requirements` table (Stage 15, the dedicated data-modeling document) or directly on `opportunities` (Stage 20, technical architecture, which flags parts of itself as pre-dating later decisions)? (Contradiction 3.)
3. **Can an opportunity move directly from Published to Completed, or must it always pass through Closed first? Is Filled a real terminal state, or must it always then transition into Closed?** (Contradiction 4.) Affects which transitions the Admin Opportunity Detail screen offers and how the state machine's guard logic is written.
4. **Does publishing an opportunity require any distinct admin approval/review step beyond the creating admin clicking Publish, or is Publish itself sufficient** (matching M1-M4's instant-effect precedent for every other "admin decides, it happens" action)? (Contradiction 5 / Stage 6 Journey 5's own flagged-and-never-answered question.)
5. **What is `OpportunityRequirement.location_required`** — a duplicate of `Opportunity.location`, a boolean "must be local" flag, something else, or should it simply be dropped as an artifact of an underspecified field? (Contradiction 6.)
6. **Small polish items, batched:** (a) new empty-state copy for a browse screen with zero Published opportunities (Gap C) — what should it say? (b) should the admin dashboard's "Active Opportunities" stat get wired to real data as part of M5, matching M4's precedent for "Verified Professionals" (Gap E)?
