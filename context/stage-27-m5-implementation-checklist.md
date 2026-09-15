# Stage 27 — M5 Implementation Checklist

Written 2026-09-12, by Claude. Reconciles [stage-26-m5-pre-implementation-review.md](stage-26-m5-pre-implementation-review.md)'s findings with Champion's 6 decisions (given the same day) into a single, implementation-ready build plan. Every schema field, transition, and behavior below is either lifted directly from Stage 26's own findings or is Champion's explicit answer. Nothing here invents new product behavior. **No application code has been written or modified for this document — checklist only.**

---

## 1. Exact M5 goal

Per [stage-18-development-milestones.md](stage-18-development-milestones.md), narrowed by Decision 1: an admin can create and publish an Opportunity through a 5-step guided flow; the Opportunity has a correct, server-guarded lifecycle (Draft→Published→Closed/Cancelled/Filled→Closed→Completed); a member can browse and view Published opportunities. **No matching, no scoring, no Apply — those are M6/M7.**

---

## 2. Explicit scope

- **Create Opportunity** (admin, 5-step wizard, Draft-by-default, resumable) — Type → Title/organization/location/description → Requirements (profession, experience, education, skills, headcount) → Review → Publish.
- **Admin Opportunities list** (`/admin/opportunities`) — every opportunity, any status, status badges, "Create opportunity" entry.
- **Admin Opportunity Detail / Manage** (`/admin/opportunities/[id]`) — one opportunity's full info + status + the Close/Cancel/Fill/Complete transition actions this milestone implements.
- **Opportunity state machine** — exactly Decision 3's transition table, server-guarded the same way M3's `verifyTrack`/`isDecisionActionable` guards status changes (a pre-read + guarded update, never a blind write).
- **Member Opportunities browse** (`/opportunities`) — search/filter over Published opportunities only, submit-triggered (M4's pattern).
- **Member Opportunity Detail** (`/opportunities/[id]`) — full opportunity info + requirements as plain text/list. No match breakdown, no Apply control, no "unverified"/"already applied" messaging (those states don't exist without Applications).
- **Admin dashboard "Active Opportunities" stat** — wired to `count(status = 'PUBLISHED')` (Decision 6b).
- Regression: M1, M2, M3, M4 all pass unchanged.

---

## 3. Explicit out-of-scope

Restated as binding, not advisory — do not build any of the following in M5:

- Apply button, `POST /opportunities/:id/apply`, My Applications, the Application entity/table, the Application state machine, Application Management, shortlisting (working), contact-info reveal, interview logistics, outcomes. (Decision 1.) The existing M4 "Contact"/"Shortlist" disabled buttons on the Admin Professional Profile are untouched by M5 — no opportunity existing yet changes their disabled state, and M5 does not wire them up.
- `opportunities.location_required`, or any remote/hybrid/radius/relocation semantics. (Decision 5.)
- An `ACTIVE` database status value anywhere. "Active" is a display label only, computed from `status = 'PUBLISHED'`, never stored. (Decisions 3 and 6b.)
- A second approval/review workflow, approval status, approval queue, or approval entity for publishing. (Decision 4.)
- `Church`/`Branch` tables, `church_id`/`branch_id` on any table (including `opportunities`) — no such tables exist anywhere in the live schema; do not introduce them for M5.
- Opportunity-published notifications — no notification type or copy exists for this event in Stage 12; do not invent one.
- AI/semantic matching, the Find Matches screen, `GET /admin/opportunities/:id/matches`, any per-criterion match breakdown (M6).
- Project and Business opportunity types (P2, confirmed absent from every spec that lists the type enum).
- Editing a Published opportunity's core content (title, description, requirements) — the only changes a Published opportunity can undergo are the six named status transitions in §6. No edit-after-publish workflow. (Decision, §23 item 7.)
- A persistent opportunity status-history/audit table. The transition stays server-guarded and exhaustively unit-tested, but no `opportunity_history`-equivalent entity is created. (Decision, §23 item 6.)
- Any change to M1-M4 schema, RLS policy, or behavior beyond what's needed to add the three new tables and their own RLS.

**The authoritative M5/M6/M7 boundary (Champion, 2026-09-12), restated here as the single sentence that governs every scope call in this document:**
- **M5** is Create → Draft → Review → Publish → Browse → View.
- **M6** is Match → Score → Rank.
- **M7** is Apply → Review → Shortlist → Connect.

No functionality moves between these three during M5's build. Anything that would require crossing this boundary is a stop-and-flag situation, not an implementation judgment call.

---

## 4. Final resolved schema (Decision 2)

Migration `004_opportunities.sql`, following the established numbering (`001_initial_schema.sql`, `002_professional_profile.sql`, `003_verification.sql`, `003b_fix_is_church_admin_recursion.sql`).

```sql
create table public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  type                text not null check (type in ('EMPLOYMENT', 'CHURCH', 'SERVICE')),
  organization_name   text not null,
  location            text,
  description         text,
  status              text not null default 'DRAFT'
    check (status in ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED', 'FILLED', 'COMPLETED')),
  headcount_required  integer check (headcount_required is null or headcount_required >= 1),
  created_by          uuid not null references public.members(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz,
  closed_at           timestamptz
);

create table public.opportunity_requirements (
  id                      uuid primary key default gen_random_uuid(),
  opportunity_id          uuid not null references public.opportunities(id) on delete cascade,
  required_profession_id  uuid references public.professions(id),
  min_experience_years    integer check (min_experience_years is null or min_experience_years >= 0),
  required_education_level text
    check (required_education_level is null or required_education_level in
      ('NONE', 'SECONDARY_CERTIFICATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE'))
);

create table public.opportunity_required_skills (
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  skill_id       uuid not null references public.skills(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (opportunity_id, skill_id)
);
```

Notes:
- `created_by references public.members(id)`, NOT a separate `Admin` table — matches the already-established M1 precedent (admins are `members` rows with `role IN ('CHURCH_ADMIN','SUPER_ADMIN')`), not Stage 15's own separate `Admin` entity, which was never built.
- `required_education_level` reuses the exact `EducationLevel` enum values already defined in `app/src/types/member.ts` (`EDUCATION_LEVELS`) — first real use of that type in a live column (it exists today but nothing uses it).
- No `location_required` column (Decision 5). No `church_id`/`branch_id` anywhere (established precedent, restated in Decision 2's own instruction).
- `opportunity_requirements` is one row per opportunity in practice (M5 never creates more than one), but modeled as its own table per Decision 2, not a 1:1 collapse onto `opportunities` — do not add a uniqueness constraint that would prevent a future opportunity type needing multiple requirement sets; that's not this milestone's call either way, just don't accidentally foreclose it.
- `opportunity_required_skills` mirrors `member_skills`'s join shape exactly (composite PK, no surrogate `id`, `on delete cascade` on both FKs, a `created_at` column — verified directly against migration 002's live `member_skills` definition, not assumed).

**One index recommendation, technical only, not a product decision:** `create index opportunities_status_idx on public.opportunities (status);` — mirrors the same class of read-heavy filter M4 flagged (unindexed status/filter columns) as a technical risk, not a blocker. Include it in the same migration since it costs nothing and matches Stage 20's read-heavy-filter reasoning; skip only if it turns out to conflict with something else during the build (unlikely).

---

## 5. RLS policies and authorization rules

Following the migration-003 admin-policy pattern exactly (reuse `is_church_admin()`, already `SECURITY DEFINER`-safe — do not touch that function).

**`opportunities`:**
```sql
alter table public.opportunities enable row level security;

-- Admins: full CRUD on any row.
create policy "Admins manage all opportunities"
  on public.opportunities for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

-- Members: SELECT only, Published only. Server-enforced gate, mirrored here
-- so a direct table read can't bypass it -- same posture as M3/M4's
-- directory-visibility gate.
create policy "Members read published opportunities"
  on public.opportunities for select to authenticated
  using (status = 'PUBLISHED');
```

**Why no `status`-specific `WITH CHECK` here, unlike M3's `members` admin-update policy:** M3's `"Admins update member verification status"` policy restricts *which columns* an admin update may touch (defense-in-depth against privilege escalation via `role`/`profile_status`) — a concern specific to a table admins share write access to alongside members' own writes. `opportunities` has no such shared-write concern (members never write to it at all), and an admin IS the sole legitimate authority over every field on this table, `status` included. The thing that actually needs guarding is *transition legality* (can `status` go from THIS value to THAT value) — RLS's `WITH CHECK` cannot see the row's previous value without a trigger, so that guard belongs where §6 puts it: the server action's own pre-read + `isOpportunityTransitionAllowed()` + guarded `.eq('status', from)` update. This is the same division of labor M3 already used (`guardedStatusUpdate`'s `.eq(column, from)` is the real transition guard there too, not RLS) — not a gap, a consistent application of the existing pattern.

**`opportunity_requirements`, `opportunity_required_skills`:**
```sql
alter table public.opportunity_requirements enable row level security;
alter table public.opportunity_required_skills enable row level security;

create policy "Admins manage all opportunity requirements"
  on public.opportunity_requirements for all to authenticated
  using (public.is_church_admin())
  with check (public.is_church_admin());

create policy "Members read requirements of published opportunities"
  on public.opportunity_requirements for select to authenticated
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.status = 'PUBLISHED'
    )
  );

-- (mirror both policies for opportunity_required_skills, same join-through-parent shape)
```

**`professions` and `skills` need no new policy.** Both already have `"Anyone authenticated can read professions/skills" ... using (true)` from migration 002 — confirmed directly, not assumed. A member reading a Published opportunity's `required_profession_id`/skill names resolves those joins under the existing open-read policy; nothing new to add.

**No public/unauthenticated access anywhere** — `/opportunities` sits behind the authenticated-member middleware matcher exactly like every other member route (no middleware change needed; route-pattern matching already covers it, confirmed against `src/middleware.ts`).

**Server-code discipline (restated, not new):** every member-facing query applies `status = 'PUBLISHED'` unconditionally before any search/filter clause — same discipline M3/M4 required for their own gates. A filter parameter must never be able to widen the result set past this predicate.

---

## 6. State-machine transition table and server-side guards (Decision 3)

Exactly this table. No other transition exists.

| From | To | Trigger |
|---|---|---|
| `DRAFT` | `PUBLISHED` | admin publishes (§7 validation must pass) |
| `PUBLISHED` | `CLOSED` | admin closes |
| `PUBLISHED` | `CANCELLED` | admin cancels |
| `PUBLISHED` | `FILLED` | admin marks filled (manual in M5 — no auto-Filled-on-headcount trigger, that needs Applications/M7) |
| `FILLED` | `CLOSED` | admin closes |
| `CLOSED` | `COMPLETED` | admin marks completed |

Explicitly forbidden (restated from Champion's decision, each must be a real guard, not just an absent UI button):
- `PUBLISHED → COMPLETED` (must pass through `CLOSED`)
- `FILLED → COMPLETED` (must pass through `CLOSED`)
- `CLOSED → PUBLISHED`
- `CANCELLED → *` (terminal)
- `COMPLETED → *` (terminal)
- `PUBLISHED → DRAFT`

**Implementation pattern — mirror `lib/verification/rules.ts`'s `isDecisionActionable`:** a pure function `isOpportunityTransitionAllowed(from: OpportunityStatus, to: OpportunityStatus): boolean` checking membership in exactly this table, unit-tested with the full from/to matrix (every disallowed pair explicitly asserted false, not just the allowed ones asserted true — same rigor the M3/M4 unit tests already established for `isDecisionActionable`/`hasActionableReverification`).

**Server action guard — mirror `guardedStatusUpdate`/`verifyTrack`'s pattern exactly:** read current status, check `isOpportunityTransitionAllowed`, reject with a clear error if not, then `.update(...).eq('id', id).eq('status', from)` (guarded against a concurrent-change race, same shape as M3's `guardedStatusUpdate`). Set `published_at`/`closed_at` at the matching transitions (`published_at` on `→ PUBLISHED`, `closed_at` on `→ CLOSED`). **No audit-trail table for opportunity transitions — decided (§23 item 6), not merely unbuilt.** The transition stays server-guarded and exhaustively unit-tested (§20), but no persistent status-history entity is created in M5.

"PUBLISHED" is the only stored value for that state. Any UI surface showing "Active" derives that label client/server-side from `status === 'PUBLISHED'` at render time — never write `'ACTIVE'` anywhere.

---

## 7. Completeness/publish validation rules

Mirror `lib/profile/completeness.ts` + `submitForVerification`'s exact two-layer pattern: a pure predicate module, then a server action that calls it before allowing the transition.

**`lib/opportunities/completeness.ts`** (pure, unit-tested, no I/O — same shape as `checkCompleteness`):

Required for Publish, per PRD §57's acceptance-criteria example, Stage 17's Create Opportunity spec, and Champion's §23 clarifications (2026-09-12) — every item below is decided, not an implementer's reading:
- `title` — non-empty.
- `type` — one of `EMPLOYMENT | CHURCH | SERVICE`.
- `organization_name` — non-empty ("organization/requesting department exists").
- `location` — NOT required. Stays optional at the schema level (§4) and is never checked by this module. Decided (§23 item 1): PRD §57's "location exists where applicable" is satisfied by never hard-requiring it, full stop.
- **At least one requirement signal exists** — decided (§23 item 2), reversing the earlier "step-completion only" reading. Publish is blocked unless at least ONE of the following is true:
  - `opportunity_requirements.required_profession_id` is set, OR
  - at least one row exists in `opportunity_required_skills` for this opportunity, OR
  - `opportunity_requirements.min_experience_years` is set, OR
  - `opportunity_requirements.required_education_level` is set.

  `required_profession_id` remaining nullable is still correct and unchanged — "no specific profession" is valid publish content as long as at least one of the other three signals is present. A completely requirement-less opportunity (all four null/empty) must stay `DRAFT`; the inline error should name this plainly (e.g. `"Add at least one requirement (profession, a skill, minimum experience, or an education level) before continuing."`), following the same "name what's missing" style as `submitForVerification`'s errors, even though this one names a group of options rather than one single field.
- No separate approval check (Decision 4 — Publish itself is the approval, nothing else gates it).

**`publishOpportunity(id)` server action** (mirrors `submitForVerification` exactly):
1. `requireAdmin()` (reuse the exact pattern from `lib/verification/actions.ts`).
2. Load the opportunity; assert `status === 'DRAFT'` (via `isOpportunityTransitionAllowed('DRAFT', 'PUBLISHED')`, not a bespoke check).
3. Run `checkOpportunityCompleteness()`; if incomplete, return `{ success: false, error: "Add your ___ before continuing." }` — same inline, naming-which-field style as `submitForVerification`.
4. Guarded update: `status: 'PUBLISHED', published_at: now()`, `.eq('status', 'DRAFT')`.
5. Return success; caller navigates to the admin opportunity list or detail (client decides, same as M2's wizard `router.push`).

---

## 8. Server actions/queries required

`lib/opportunities/actions.ts` (mirrors `lib/profile/actions.ts` + `lib/verification/actions.ts`'s combined shape):
- `createOpportunity(step1Data)` → creates a `DRAFT` row (title/type at minimum, or an empty-ish draft row if the wizard's step 1 is Type-only — see §17), returns `{ id }`. **`created_by` is always set server-side from `requireAdmin()`'s own resolved member id — never accepted as client input**, same discipline M1's `register()` already uses for `auth_user_id` (tied to the caller's own session, not a request parameter).
- `saveOpportunityStep(id, stepKey, stepData)` — per-step save while `DRAFT` ONLY, guarded by `requireAdmin()` + `.eq('status', 'DRAFT')`. **Decided (§23 item 7): editing a Published opportunity's core content is out of scope for M5, full stop** — this action must never succeed against any status other than `DRAFT`. A Published opportunity changes only via the six named transitions (§6); there is no content-edit path for it anywhere in this milestone.
- `publishOpportunity(id)` — §7.
- `closeOpportunity(id)` — `PUBLISHED → CLOSED` or `FILLED → CLOSED`, via `isOpportunityTransitionAllowed`.
- `cancelOpportunity(id)` — `PUBLISHED → CANCELLED`.
- `markOpportunityFilled(id)` — `PUBLISHED → FILLED`. Manual only in M5 (no headcount-driven auto-trigger — that needs Applications/M7, per Stage 7's own flagged gap).
- `markOpportunityCompleted(id)` — `CLOSED → COMPLETED`.

`lib/opportunities/queries.ts` (mirrors `lib/directory/queries.ts` + `lib/verification/queries.ts`'s combined shape):
- `getAdminOpportunities()` — every opportunity, any status, admin-only (`requireAdmin()` guard, mirrors `getVerificationQueue()`).
- `getOpportunityForAdmin(id)` — one opportunity's full detail (+ requirements + skills), admin-only, `notFound()`-equivalent (`null`) if missing.
- `getPublishedOpportunities(filters?: OpportunityFilters)` — member-facing browse. Gate clause (`status = 'PUBLISHED'`) unconditional and first, filters (type, location — Stage 17's stated filter set for this screen) layered after, exact structural mirror of `getDirectoryProfessionals(filters)`.
- `getOpportunityDetail(id)` — one Published opportunity's public detail. Returns `null` for anything not `PUBLISHED` — a member must get the same "not found" experience for a Draft/Closed/Cancelled/Filled/Completed opportunity as for a nonexistent id, never a distinguishable error that reveals the opportunity exists in some other state.
- `getPublishedOpportunityCount()` — mirrors `getDirectoryProfessionalCount()`, for Decision 6b's dashboard stat.

No new Route Handlers — same reasoning as M4 (Server Components read `searchParams` directly; the browse filter form is a plain `<form method="GET">`, same as M4's Decision-4 pattern).

---

## 9. Admin screens/routes

| Route | Purpose | Notes |
|---|---|---|
| `/admin/opportunities` | List, replaces the `ComingSoon` stub | Status badges using "Active" as `PUBLISHED`'s display label (never a stored value); "Create opportunity" entry point; each row → its detail. |
| `/admin/opportunities/new` | Create Opportunity wizard entry | Creates a Draft row on first real input (mirrors how `register()` creates a `members` row immediately, not deferred) — see §17 for the exact step-1 mechanics to decide during build, not invent ad hoc. |
| `/admin/opportunities/[id]` | Admin Opportunity Detail / Manage | View + the applicable transition actions for the opportunity's current status. Publish is performed from the wizard's Review screen; Close/Cancel/Fill/Complete are available here according to the state machine. No Find Matches, no Application Management links (those screens don't exist — do not add a dead link or a "coming soon" placeholder inside this screen for them; that would be inventing UI for unbuilt features). |

All three: `requireAdmin()`-equivalent gate, same pattern as `/admin/verification` and `/admin/professionals` — a plain member hitting any of these redirects to `/dashboard`.

---

## 10. Member screens/routes

| Route | Purpose | Notes |
|---|---|---|
| `/opportunities` | Browse, replaces the `ComingSoon` stub | Search + Type/Location filters, submit-triggered (native `<form method="GET">`, M4's exact Decision-4 pattern — no client JS, no per-keystroke requests). Two distinct empty states per Decision 6a. |
| `/opportunities/[id]` | Opportunity Detail | Full info + requirements as plain text/list (profession name or "Any profession", min experience, education level, required skills as badges — same visual idiom `Badge` already uses for member skills on the profile screens). No match card, no Apply button — not disabled, absent, matching M4's precedent for Contact/Shortlist on a screen with nothing yet to back it. |

Both: authenticated-member gate only (no verification requirement — Stage 17 explicitly says "authenticated member, verified or not" for browsing). `notFound()`-equivalent for any non-Published opportunity id.

---

## 11. Dashboard stat wiring (Decision 6b)

`app/src/app/admin/(protected)/dashboard/page.tsx`: replace the hardcoded `<StatCard label="Active Opportunities" value={0} />` with `getPublishedOpportunityCount()`, same pattern M4 used for "Verified Professionals." Link the card to `/admin/opportunities`, matching the existing "Verified Professionals" → `/admin/professionals` and "Pending verification" → `/admin/verification` link pattern already on that page.

Do NOT touch the "Applications" stat card (still correctly `0` — Applications is M7).

---

## 12. Browse/search/filter behavior

Mirrors M4's Decision 4 exactly: submit-triggered, native GET form, `searchParams`-driven, no client component needed for the page itself.

- **Search** — free text, matching `opportunities.title` AND `opportunities.organization_name` only, substring/ILIKE. Decided (§23 item 3): explicitly NOT `description`, NOT anything on `opportunity_requirements`/`opportunity_required_skills`.
- **Type filter** — exact match against `EMPLOYMENT | CHURCH | SERVICE` (Stage 17's stated filter set for this screen).
- **Location filter** — substring/ILIKE against `opportunities.location`, same idiom as M4's location filter.
- **No profession/experience filter on this screen** — Stage 17 explicitly says "profession/experience filters are less useful here since the member's own profile already implies relevance" for this specific screen (distinct from the admin directory, which does have those filters). Do not add them.

---

## 13. Empty states (Decision 6a)

Two distinct states, exact copy:

- **Zero Published opportunities at all:** "No opportunities yet" / "Published opportunities will appear here when they become available."
- **Search/filter returns none, but Published opportunities exist:** "No opportunities found" / "Try adjusting your search or filters."

Same disambiguation mechanic M4 used (Decision 6 there): compute `hasAnyFilter`; if results are empty and no filter is active, it's the "genuinely empty" case; if a filter is active and results are empty, cross-check `getPublishedOpportunityCount()` to tell "the directory has some, this filter matched none" apart from "there's nothing published at all, no matter what you searched." (Exact same disambiguation logic already implemented in `app/src/app/admin/(protected)/professionals/page.tsx` for the M4 directory — reuse the pattern.)

---

## 14. Member visibility rules

- A member sees ONLY `status = 'PUBLISHED'` opportunities, everywhere (browse list, detail page, any future dashboard section once M6 exists). Enforced twice: the query's own unconditional WHERE clause (§8), and the RLS policy (§5) — same belt-and-suspenders posture M3/M4 established for the verification/directory gates.
- A member requesting a Draft/Closed/Cancelled/Filled/Completed opportunity's detail page by direct/guessed URL gets the same not-found experience as a nonexistent id — no status-specific error message that would leak the opportunity's existence or state to an unauthorized viewer.
- Browsing does not require verification (Stage 17, restated) — an unverified, even a still-`REGISTERED` (pre-submission) member can browse and view opportunity details. (There is no Apply button to gate in M5 anyway, per Decision 1, so this rule has no enforcement surface yet beyond "don't accidentally require verification to load the page" — worth stating so nobody adds an unnecessary gate.)

---

## 15. Admin access rules

- `requireAdmin()`-equivalent (Church Admin or Super Admin) on every `/admin/opportunities*` route and every action in `lib/opportunities/actions.ts`. **Note on the existing pattern, verified directly:** `requireAdmin()` is currently a private, unexported ~5-line function independently duplicated in both `lib/verification/actions.ts` and `lib/verification/queries.ts` (not shared even between those two files) — there is no existing shared/exported version to import. M5 should replicate the identical logic in `lib/opportunities/actions.ts` and `lib/opportunities/queries.ts`, matching the established (if duplicated) pattern exactly, rather than trying to import a helper that doesn't exist. Extracting a single shared `requireAdmin()` into `lib/authorization/` is a reasonable cleanup but is NOT part of M5's scope — flagged here only so the duplication is a known, deliberate continuation of the existing pattern, not a new inconsistency M5 introduces.
- A plain `MEMBER` role hitting any `/admin/opportunities*` route redirects to `/dashboard` — same pattern as M3's test 16 / M4's test 6, needs the equivalent acceptance test here (§18).
- No new admin sub-role or permission tier — `is_church_admin()` already covers both `CHURCH_ADMIN` and `SUPER_ADMIN` identically, matching M1-M4's precedent that Super Admin has no distinct MVP screens.

---

## 16. Error/loading/not-found behavior

- **Loading:** a loading skeleton on the browse screen's first paint (Stage 17, restated) — reuse the existing `Skeleton` component already in `src/components/ui/skeleton.tsx` (built in M1, used nowhere yet per earlier inventories — first real consumer).
- **Not-found:** `notFound()`/`null`-returning pattern, exact mirror of M4's `isMemberInDirectory` + `AdminProfessionalProfilePage`'s guard — a member's `/opportunities/[id]` for a non-Published id 404s; an admin's `/admin/opportunities/[id]` for a nonexistent id 404s (admins CAN see any status, so the admin route's guard is existence-only, not status-filtered).
- **Validation errors:** inline, field-naming, same style as `submitForVerification`'s `"Add your ___ before continuing."` — no generic "something went wrong" where a specific missing field is knowable.
- **Transition errors:** if an admin somehow reaches a disallowed transition (stale UI, double-click race), the server action returns a clear rejection (`"That status doesn't allow this action."` or similarly specific, mirroring `verifyTrack`'s own rejection copy style: `"This track is already ${x}."` / `"This track can't be sent back from ${x}."`) — never a silent no-op or a generic 500.

---

## 17. Wizard autosave/resume behavior

Mirrors `OnboardingWizard`'s exact mechanics (`app/src/components/onboarding/onboarding-wizard.tsx`), adapted for Opportunity's 5 steps instead of Member's 8:

- **Step order (decided, §23 item 4): 1 Type · 2 Details (title, organization, location, description) · 3 Requirements (profession, experience, education, skills, headcount) · 4 Review · 5 Publish.** Five conceptual steps, but Publish is the action taken ON the Review screen (a button on step 4's own screen), not a separate 6th/5th screen — exact mirror of M2's wizard, where step 8 Review and the "Submit for verification" button live on the same screen. Do not build a distinct "step 5 screen" whose only content is a Publish button.
- `bindNext`/`refresh` props, same shape as `WizardStepProps` — a step registers "what Next should save" via a `useCallback`-wrapped ref-setter (React #185 avoidance, exact same reasoning already documented in `onboarding-wizard.tsx`'s own comments).
- **Resume (decided, §23 item 5): reopening a Draft always starts the wizard at Step 1, with every field prefilled from what's already saved.** No computed resume-step function (no `resumeStep()`-equivalent) is built for M5 — this was the earlier recommendation, now a confirmed rule, not an implementer's default. The admin clicks through from Step 1 regardless of how far they'd previously gotten; nothing is lost (every field arrives prefilled), but nothing auto-skips either.
- No "edit mode" equivalent to M3's Gap-1 `?edit=1` pattern exists in M5 — Publish is the only forward gate from Draft, and there's no "PROFILE_COMPLETE"-equivalent state to reopen after the fact (editing a Published opportunity is decided out of scope, §7, §23 item 7).

---

## 18. Acceptance tests (`m5-acceptance.spec.ts`)

Structured from the start in small, independent blocks (M3/M4's hard-won lesson about this environment's latency — do not build one long combined setup test; split by concern, same as M4's Block A/B/C split).

1. **Opportunity creation and publish** — admin completes the 5-step flow with all required fields, selects Publish, opportunity transitions `DRAFT → PUBLISHED`, `published_at` is set, and it immediately appears on the member browse screen.
2. **Publish is blocked when title/type/organization is missing**, AND separately, **Publish is blocked when zero requirement signals are set** (all four of profession/skills/min-experience/education-level empty) — two distinct cases, both inline errors, opportunity stays `DRAFT` in both. A third case confirms the requirement rule's nullable-profession carve-out: an opportunity with `required_profession_id` null but at least one skill (or min-experience, or education level) set DOES publish successfully — "no specific profession" alone is not what blocks it.
3. **Type is restricted to Employment / Church Opportunity / Service** — no Project/Business option anywhere in the creation flow.
4. **A Draft opportunity is never visible to a member** — direct URL 404s; does not appear in browse, count, or search results.
5. **`PUBLISHED → CLOSED`** works; the closed opportunity disappears from member browse and its detail page shows a closed state (Stage 11/17's "no longer accepting" framing, minus the Apply-button-specific wording since there's no Apply button in M5 to disable).
6. **`PUBLISHED → CANCELLED`** works; same visibility consequence as Closed.
7. **`PUBLISHED → FILLED`** works; a Filled opportunity is NOT member-visible (only `PUBLISHED` is, per §14) — confirms Filled behaves like every other non-Published state for visibility purposes even though it's mid-lifecycle, not terminal.
8. **`FILLED → CLOSED`** works.
9. **`CLOSED → COMPLETED`** works.
10. **Every disallowed transition is rejected server-side**, not just hidden in the UI: `PUBLISHED → COMPLETED`, `FILLED → COMPLETED`, `CLOSED → PUBLISHED`, any transition FROM `CANCELLED`, any transition FROM `COMPLETED`, `PUBLISHED → DRAFT`. (Call the server action directly for at least one or two of these, the way M3's `isDecisionActionable` unit tests proved the pure predicate exhaustively — an E2E test proving the button is absent is necessary but not sufficient; the server guard itself needs proving.)
11. **A plain member cannot reach `/admin/opportunities`, `/admin/opportunities/new`, or `/admin/opportunities/[id]`** — redirected to `/dashboard`, same pattern as M3 test 16 / M4 test 6.
12. **Search narrows correctly** (title/organization substring match).
13. **Type filter narrows correctly.**
14. **Location filter narrows correctly.**
15. **Search/filter is submit-triggered, not live** — same assertion shape as M4's test 14 (no URL change on keystroke alone, only on Enter/Search).
16. **Both empty states render the correct, distinct copy** (Decision 6a) — one test for "no opportunities at all," one for "filter matched none."
17. **Admin dashboard "Active Opportunities" stat matches `count(status = 'PUBLISHED')` exactly** — same cross-check-against-a-direct-DB-count pattern M4's test 13 used to survive concurrent parallel test blocks, not a fragile before/after delta assumption.
18. **An unverified (even still-`REGISTERED`) member can browse and view opportunity details** — confirms §14's "browsing doesn't require verification" rule holds.
19. **No Apply button, application state, or match-score UI renders anywhere on the member Opportunity Detail screen** — a direct, explicit negative assertion (mirrors M4's test 5 pattern of proving an absence, not just failing to test for a presence).

**M1-M4 regression:** re-run `m1-acceptance` (10/10, 1 expected skip), `m2-acceptance` (11/11), `m3-acceptance` (19/19), `m4-acceptance` (19/19) — all unchanged.

---

## 19. M1-M4 regression requirements

No code outside `lib/opportunities/`, the new `/admin/opportunities*` and `/opportunities*` routes, the admin dashboard's stat wiring, and the new migration should be touched by this milestone. If implementation reveals a need to touch anything in `lib/verification/`, `lib/directory/`, `lib/profile/`, or their migrations, that is a signal to stop and flag it, not proceed — none of Stage 26 or this checklist identifies any such need.

---

## 20. Unit-test requirements

`app/tests/unit/opportunity-rules.test.ts` (or similarly named, matching `verification-rules.test.ts`'s convention):
- `isOpportunityTransitionAllowed(from, to)` — full matrix, every allowed pair asserted true, every disallowed pair explicitly asserted false (not just "not in the allowed list" by omission — write the negative assertions out, same rigor as M3/M4's `isDecisionActionable`/`hasActionableReverification` tests).
- `checkOpportunityCompleteness()` (or whatever the publish-validation module ends up named) — the required-field table from §7. Test the "at least one requirement signal" rule exhaustively: each of the four signals (profession / skill / min-experience / education-level) alone is sufficient on its own; all four empty together fails; `location` empty never fails; `required_profession_id` null with another signal set still passes (the nullable-profession carve-out).
- Any pure search/filter predicate worth extracting from `getPublishedOpportunities`, same spirit as M4's directory-filter tests (most of the actual filter logic lives inside the Supabase query builder and isn't independently pure/testable, same situation M4 was in — don't force extraction that doesn't naturally exist).

---

## 21. Typecheck/lint/build requirements

Same bar as every prior milestone: `npm run typecheck`, `npm run lint`, `npm run build` all clean before considering M5 done. No new `any`, no new lint-suppression comments, no new client components where a server component would do (mirrors the "Server Components by default" discipline already established).

---

## 22. Recommended implementation order

1. Migration `004_opportunities.sql` (§4) + RLS (§5). Apply to live Supabase (same manual paste-and-run process used for every prior migration — cannot be run by the assistant directly).
2. `lib/opportunities/rules.ts` (or `completeness.ts` + a transitions module) — pure, unit-tested first, mirroring `lib/verification/rules.ts`'s own build order from M3.
3. `lib/opportunities/actions.ts` + `lib/opportunities/queries.ts`.
4. Admin screens: Opportunities list → Create Opportunity wizard → Admin Opportunity Detail (transition actions).
5. Member screens: Opportunities browse → Opportunity Detail.
6. Dashboard stat wiring (§11).
7. `m5-acceptance.spec.ts`, structured in small independent blocks from the start (§18's own instruction, not an afterthought).
8. Re-run `m1-acceptance`, `m2-acceptance`, `m3-acceptance`, `m4-acceptance` unchanged; typecheck, lint, build, full unit suite.
9. Document deviations in this checklist's own "Implementation deviations" section (added once the build happens), matching the M1-M4 pattern exactly.

---

## 23. Resolved implementation decisions (Champion, 2026-09-12)

Every item this section previously flagged as an unresolved-but-recommended reading has been given a final answer. Nothing below is open. Cross-referenced sections have been updated to match.

1. **Location is never required for Publish.** `opportunities.location` stays optional at the schema level (§4) and is NOT part of the publish completeness check (§7). Confirmed, not just recommended.
2. **At least one requirement signal is required for Publish.** A completely requirement-less opportunity must remain Draft. "At least one" means: `required_profession_id` is set, OR ≥1 row exists in `opportunity_required_skills`, OR `min_experience_years` is set, OR `required_education_level` is set. `required_profession_id` stays nullable — "no specific profession" is valid publish content as long as at least one of the other three signals is present. This reverses the earlier recommendation (which read "requirements exist" as step-completion only); the stricter reading is now the decided rule. §7 updated accordingly.
3. **Browse search matches `opportunities.title` and `opportunities.organization_name` only**, substring/ILIKE. Explicitly NOT `description`, NOT anything in `opportunity_requirements`/`opportunity_required_skills`. Confirmed, not just recommended (§12).
4. **The wizard has 5 conceptual steps (Type, Details, Requirements, Review, Publish), but Publish is the action taken on the Review screen, not a 6th/separate screen.** Matches the earlier recommendation, now confirmed as decided, not an implementer's reading (§17).
5. **Draft resume always reopens at Step 1 with saved data prefilled.** No computed resume-step function for M5 — explicitly ruled out, not merely unbuilt-for-now. `resumeStep()`-equivalent logic is NOT part of this milestone (§17).
6. **No opportunity status-history/audit table in M5.** The state-machine transition stays server-guarded and exhaustively unit-tested (§6, §20), but no persistent transition-history entity is built. Confirmed as a decision, not a flagged absence.
7. **Editing a Published opportunity's core content is out of scope for M5, full stop.** `saveOpportunityStep()` only ever modifies a `DRAFT` opportunity (§8) — the guard was already written this way; it is now a decided rule, not an implementer's default. A Published opportunity can only change via the exact six transitions in §6 (Published→Closed, Published→Cancelled, Published→Filled, Filled→Closed, Closed→Completed, plus the one entry transition Draft→Published) — never a content edit. No edit-after-publish workflow, not even a "fix a typo" affordance, exists anywhere in M5.

**Final M5/M6/M7 boundary (restated verbatim, authoritative):**
- M5: Create → Draft → Review → Publish → Browse → View.
- M6: Match → Score → Rank.
- M7: Apply → Review → Shortlist → Connect.

No functionality moves between these milestones during M5's implementation. If anything encountered during the build would require crossing this boundary, that is a signal to stop and flag it to Champion, not to solve it by borrowing scope from M6/M7.

---

## 24. Implementation deviations (final, post-verification, 2026-09-12)

M5 is implementation-complete and fully verified against this checklist. Every decision in §23 was implemented exactly as written; nothing in the build required a new product decision. Two things surfaced during acceptance testing that are recorded here for completeness — one real (small) application defect that was fixed, and a batch of test-file defects in `m5-acceptance.spec.ts` itself that were fixed without touching any acceptance criterion.

### Application fix

- **`lib/opportunities/schemas.ts` — `opportunityDetailsSchema` incorrectly required non-empty `title`/`organizationName` at the per-step save layer.** This silently prevented a Draft with a blank Details step from ever advancing past Step 2, contradicting §7/§8's explicit two-layer design: per-step Zod schemas validate shape/type only, and `checkOpportunityCompleteness()` alone enforces non-empty title/organization, and only at Publish time. The Requirements schema already carried a code comment stating this exact principle; the Details schema simply hadn't been brought in line with it. Fixed by loosening `title`/`organizationName` to `z.string().max(200)` (no `.min(1)`). This does not change any decided rule — `checkOpportunityCompleteness()` (§7, unchanged) still blocks Publish on an empty title/organization exactly as specified; only the *earlier, incorrect* per-step block was removed. Verified via the full unit suite (unchanged, still 78/78 — this module has no dedicated unit tests of its own, correctness is covered by the M5 acceptance suite's tests 2a and 1) and M5 acceptance test 2a (publish-blocked-on-missing-title/org), which now passes for the right reason: blocked at Publish, not at step-save.

### Test-file fixes (no acceptance criteria changed)

All of the following were defects in `tests/e2e/m5-acceptance.spec.ts` itself, caught and fixed during verification. None weakened, removed, or reinterpreted any assertion — each fix made the test correctly drive the real (correct) UI flow it was already trying to test.

- **Missing intermediate wizard click.** Several tests (the `fillWizardThroughReview` helper, and inline flows in tests 2a, 2b, and the Browse-block setup tests) clicked `/admin/opportunities/new`'s "Continue" button and then immediately asserted the Details step was visible. In reality, "Continue" only creates the Draft and redirects into the wizard, which always opens at the wizard's own Step 1 (Type) per §23 item 5 (no computed resume) — a second, separate "Next" click on the wizard's own Step 1 is required to reach Step 2 (Details). The tests were missing that second click. Fixed by adding the intermediate `expect(heading "Opportunity type").toBeVisible()` + `Next` click everywhere this pattern occurred.
- **Missing authenticated session in Browse-block tests 12–16.** These tests navigated directly to `/opportunities?...` without first calling `loginAdmin()`, assuming the prior setup tests' session would carry over. Playwright gives every test its own fresh browser context by default (session cookies do not persist across tests even within a `serial` describe block), so these tests were actually hitting the login redirect, not the browse page. Fixed by adding `await loginAdmin(page);` as the first line of each.

### Environment notes (not test or app defects, recorded for anyone re-running this suite)

- The app must be served by a process that does **not** inherit this environment's `HTTP_PROXY`/`HTTPS_PROXY` variables — an inherited proxy causes Server Actions to abort mid-stream ("the destination stream closed early"), which looks like a silently-failing form submit. `playwright.config.ts` already strips the proxy for the *test runner's own* requests; the app server process itself must be started the same way (`env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy npm run start`).
- A `next start` (production) server process serves whatever build was on disk when it started. If `npm run build` runs again while an old `next start` process is still up, that process keeps serving stale JS chunk references, which 404 client-side and silently prevent hydration (forms fall back to native GET submission). Restart the server after every rebuild.

### Verification results

- **M5 acceptance (`m5-acceptance.spec.ts`): 22/22 passed**, chromium, after the fixes above.
- **M1–M4 regression:** M1 10/11 passed, 1 skipped (pre-existing — `M1_ADMIN_EMAIL`/`M1_ADMIN_PASSWORD` not configured in `.env.local`, unrelated to M5), M2 11/11 passed, M3 19/19 passed, M4 19/19 passed. (One M2 test showed transient timeout contention inside a single combined 60-test/4-worker run and passed cleanly 11/11 on an isolated re-run — confirmed environment flakiness under parallel load, not a regression; no M2 code was touched during M5.)
- **Unit suite:** 78/78 passed (54 pre-existing + 24 new `opportunity-rules.test.ts`).
- **Typecheck, lint, build:** all clean.
- **Migration 004 (`opportunities`, `opportunity_requirements`, `opportunity_required_skills`):** applied to the live Supabase project by Champion; confirmed live and queryable with the exact column shapes this checklist specifies.
- **Scope check:** no file under `lib/verification/`, `lib/directory/`, `lib/profile/`, or migrations 001–003b was modified. The only shared file touched was `admin/dashboard/page.tsx` (the §Phase 6 / Decision 6b stat-wiring change, explicitly in scope), verified to be a clean additive change alongside the unmodified M3/M4 stat logic already on that page.
