# Stage 25 — M4 Implementation Checklist

Written 2026-09-11, by Claude. Reconciles [stage-24-m4-pre-implementation-review.md](stage-24-m4-pre-implementation-review.md)'s findings with Champion's 7 decisions (given the same day) into a single build plan. Nothing here invents new product behavior — every decision below is either lifted directly from Stage 24's own options or is Champion's explicit answer. Do not deviate from this without flagging it, per the standing instruction.

---

## The 7 decisions, as given

1. **Verification filter: DROP.** No fake/one-value filter in the UI. The gate itself (`isDirectoryVisible`) still applies server-side to every query; only the filter *control* is removed from the screen.
2. **Industry filter: INCLUDE.** Scope clarification (Stage 3's mockup already listed it, `members.industry` already exists), not a new feature.
3. **Free-text profession search: YES**, search both `professions.name` (via `members.primary_profession_id`) and `members.profession_freetext`. Exact/substring only, no synonym matching. ("Engineer" matches "Civil Engineer"; "Structural Engineer" does NOT match "Civil Engineer" unless that literal substring is present.)
4. **Search interaction: submit-triggered.** Enter or an explicit Search action. No request per keystroke.
5. **Directory row routing: Directory → Admin Professional Profile → (conditionally) Review Verification.** Not Directory → Verification Review directly. Verification Review stays reachable, but only as a secondary action from the new profile screen, and per Champion's wording "only when there is an actionable verification review" — i.e., not a blanket link that's always present regardless of state.
6. **Empty-state copy — two distinct states, provided verbatim:**
   - Zero search/filter results (some directory-visible members exist, none match): **"No professionals found" / "Try adjusting your search or filters."**
   - Genuinely empty directory (zero directory-visible members exist at all): **"No verified professionals yet" / "Professionals who complete verification will appear here."**
7. **Admin dashboard "Verified Professionals" stat: wire it, in M4, to the exact same gate predicate** (`membership_status = CONFIRMED AND credentials_status IN (REVIEWED, REVIEW_PENDING)`). No separate definition.

**Preserved unchanged (explicit constraint, not a decision to re-derive):** `isDirectoryVisible()` as-is; REVIEW_PENDING stays visible; exact badge wording; contact info hidden; no working Shortlist (no opportunities exist); no opportunities/applications/matching/employer-portal/other-milestone features; no schema changes beyond what's listed below; no new verification/status transitions; no AI/semantic matching.

---

## What Decision 5 means concretely (resolving Stage 24's Gap C)

"Only when there is an actionable verification review" ties the secondary link's presence to whether the member currently has a track an admin could act on — i.e., the same condition the Verification Queue's own "Pending" tab uses (`needsAttention` in `lib/verification/rules.ts`: `membershipStatus === "PENDING"` or `credentialsStatus === "PENDING"` or `credentialsStatus === "REVIEW_PENDING"`). A directory-visible member is, by the gate's own definition, `membership_status = CONFIRMED` — so `needsAttention` on such a member can only ever be true via `credentials_status = REVIEW_PENDING` (the lighter reverification state that keeps them in the directory while still needing another look). A member with `NEEDS_CORRECTION` on either track is, by construction, not directory-visible in the first place (the AND-gate excludes them), so this button will never appear for a "corrected" member reached through the directory — that's expected, not a bug: the directory only ever shows members past that state or in the REVIEW_PENDING re-check state.

So concretely: the Admin Professional Profile shows a "Review verification" button/link to `/admin/verification/[memberId]` **only when `credentials_status === "REVIEW_PENDING"`** for that member (the only way a directory-visible member can have anything actionable). Reusing `needsAttention()` directly (rather than reimplementing the condition) keeps this in sync with the Verification Queue's own definition of "needs attention" — no new predicate invented.

---

## Screens

### 1. Professionals (Directory) — `/admin/professionals` (REPLACE the M3 stub)

- Search box (name / profession / skill, submit-triggered per Decision 4).
- Filters: Profession (dropdown, taxonomy-backed), Location (text or dropdown from distinct values present), Experience (minimum years), Availability (Open only — per Stage 13's directory-specific semantics, already documented in Stage 24 §8: excludes both Selective and Not Available), Industry (dropdown, Decision 2). **No Verification filter** (Decision 1).
- Results: table (desktop) / cards (mobile), each row showing name, profession, experience, location, availability, verification badges (exact wording).
- Row click → Admin Professional Profile (`/admin/professionals/[memberId]`), not Verification Review (Decision 5).
- Empty states: the two distinct copies from Decision 6, chosen by whether ANY directory-visible member exists at all vs. the current search/filter simply matching none.
- Loading skeleton (Stage 17).
- Permissions: Church Admin / Super Admin only, same gate pattern as every other `/admin/*` route.

### 2. Admin Professional Profile — `/admin/professionals/[memberId]` (NEW)

- Two-column desktop / stacked mobile (Stage 17).
- Sections: professional information (profession, job title, industry, location, employment status, years of experience), Experience, Education, Skills, Certifications (empty state — no upload UI exists yet, not M4's job to add one), Documents, Verification history.
- Verification badges, exact wording, reusing `VerificationBadges`.
- Actions: Contact — rendered disabled/hidden, unconditionally, in M4 (no Applications entity, no state in which it could be honest — Stage 24 §3/§8). Shortlist — rendered disabled/hidden, unconditionally (no Opportunity entity exists — Stage 24 §3). "Review verification" — conditionally shown per the concrete rule above (Decision 5 + this doc's resolution of Gap C), linking to `/admin/verification/[memberId]`.
- Data: `getMemberProfileForAdmin(memberId)` + `getVerificationHistory(memberId)` — both already exist from M3, reused as-is, no changes.
- Permissions: Church Admin / Super Admin only. `notFound()` if the member doesn't exist or isn't directory-visible (an admin reaching this route for a non-visible member via a stale link/direct URL should not see a profile that the directory itself would never have shown them — same posture as the directory's own gate, applied at this screen too, since Stage 20's RLS testing note explicitly calls for "an unverified member cannot appear in the directory" as a tested case, and this screen is the directory's own detail view).

### 3. Admin dashboard — wire "Verified Professionals" stat (Decision 7)

- `app/src/app/admin/(protected)/dashboard/page.tsx`: replace the hardcoded `<StatCard label="Verified Professionals" value={0} />` with a real count using the identical gate predicate as the directory query (same `.eq()`/`.in()` clauses, not a duplicated/redefined one — factor into one shared count function if that avoids duplication, or call the same underlying query with a count-only shape).

### 4. `/admin/verification` queue and `/admin/verification/[memberId]` (Verification Review)

- **No changes.** These stay exactly as M3 built them. The only cross-reference is the new, conditional link INTO Verification Review from the new Admin Professional Profile screen (Decision 5) — Verification Review itself gains no new link back out, no new UI, nothing.

---

## Database / queries

**No new tables. No new migration for product schema** (per the "no unnecessary schema changes" constraint). All fields M4 needs already exist (`members.industry`, `members.profession_freetext`, `members.primary_profession_id`, `members.location`, `members.years_of_experience`, `members.availability`).

- **Extend `lib/directory/queries.ts`:**
  - `getDirectoryProfessionals(filters?)` — add optional search text + filter params (profession, location, min-experience, availability=OPEN-only toggle, industry). The existing gate clauses (`profile_status`, `membership_status`, `credentials_status`) stay first/unconditional; filters layer on top, never widen past the gate.
  - Profession search/filter must match against BOTH `professions.name` (joined via `primary_profession_id`) and `profession_freetext` (Decision 3) — an OR condition, substring/ILIKE, no synonym expansion.
  - Add `getDirectoryProfessionalCount()` (or reuse the same query with `{count: 'exact', head: true}`) for the dashboard stat (Decision 7), applying the identical unconditional gate clauses and nothing else (no search/filter params — it's a total, not a filtered count).
  - `getMemberProfileForAdmin`/`isMemberInDirectory` — no changes needed; already correct and reusable.
- **Optional, technical-only, not a product/schema change:** an index migration on `members(membership_status, credentials_status)` and/or `members(first_name, last_name)` to keep the directory query reasonable as data grows (Stage 24 §14's flagged risk). This is infrastructure, not scope — build only if it's cheap and doesn't touch product behavior; skip if it risks scope creep. Decide at implementation time, document either way.

---

## Server actions / API

All read-only, Server Component + `lib/directory/queries.ts` pattern (same as M3 — no new Route Handlers required; filters are read via `searchParams` server-side, matching how `/admin/verification?tab=` already works).

- Extended `getDirectoryProfessionals(filters)` — see above.
- `getDirectoryProfessionalCount()` — see above.
- Reused, unchanged: `getMemberProfileForAdmin`, `getVerificationHistory`.
- No new mutation actions. No new notification types.

---

## Authorization / RLS

No new policies needed — migration 003's admin-read policies on `members`, `education`, `experience`, `member_skills`, `certifications`, `documents`, and storage already cover every read M4 performs (confirmed in Stage 24 §7). The one server-code discipline point restated: every extended query must apply the gate clauses unconditionally before any filter clause, never let a filter parameter bypass or OR around the gate.

---

## Business rules restated (not re-derived, just carried forward into this build)

- Gate: `membership_status = 'CONFIRMED' AND credentials_status IN ('REVIEWED', 'REVIEW_PENDING')`.
- Directory's "Available" filter = `availability = 'OPEN'` only (excludes SELECTIVE and NOT_AVAILABLE) — Stage 13's directory-specific semantics, distinct from M6's future matching-gate semantics (which will exclude only NOT_AVAILABLE). Do not conflate the two when M6 is eventually built.
- Search is exact/substring only (Decision 3, restated).
- Badge wording: "Membership confirmed" / "Credentials reviewed," never "Verified" alone.
- Contact info: always hidden/null in M4, no exceptions, no partial reveal.

---

## Acceptance criteria / tests (m4-acceptance.spec.ts)

Directly from Stage 24 §11, adjusted for the 7 decisions:

1. Directory visibility requires both tracks approved (Confirmed + Pending credentials does NOT appear).
2. Search returns relevant results: substring match on taxonomy profession name works; substring match on `profession_freetext` works (Decision 3); a true-synonym search does NOT match.
3. Availability filter narrows to OPEN only, excluding SELECTIVE and NOT_AVAILABLE.
4. Industry filter narrows correctly (Decision 2).
5. No Verification filter control exists on the page (Decision 1 — a negative assertion, not just an omission).
6. A plain member cannot reach `/admin/professionals` or `/admin/professionals/[memberId]` — redirected.
7. Badge wording regression on both the directory list and the Admin Professional Profile.
8. Contact info never rendered on the Admin Professional Profile.
9. Shortlist action absent/disabled on the Admin Professional Profile.
10. Directory row click opens Admin Professional Profile, NOT Verification Review directly (Decision 5).
11. "Review verification" link appears on the Admin Professional Profile ONLY for a member with `credentials_status = REVIEW_PENDING`; absent otherwise.
12. Empty-state copy: zero-search-results shows "No professionals found" / "Try adjusting your search or filters."; a directory with zero directory-visible members at all shows "No verified professionals yet" / "Professionals who complete verification will appear here." (Decision 6 — both states need a test, they're different copy for different conditions.)
13. Admin dashboard "Verified Professionals" count matches the directory's own gate predicate exactly (Decision 7) — e.g., approve a test member's both tracks, confirm the stat increments by exactly 1.
14. Search is submit-triggered, not live-as-you-type (Decision 4 — assert no result-changing request fires on a keystroke alone, only on Enter/Search).
15. M1 regression (10/10, 1 expected skip), M2 regression (11/11), M3 regression (18/18) all still pass unchanged.

**Unit tests** (`app/tests/unit/`): the extended directory filter/search predicate as a pure function where practical (mirroring M3's `rules.ts` pattern) — profession/freetext OR-match logic, availability=OPEN-only filter, industry filter.

---

## Build order

1. Extend `lib/directory/queries.ts` — search + filters + count, unit-tested first.
2. Build the Admin Professional Profile screen (`/admin/professionals/[memberId]`), reusing existing M3 queries, wiring the conditional Review Verification link per this doc's Gap-C resolution.
3. Replace the Professionals directory screen (`/admin/professionals`) with the real search/filter UI, wired to the extended query, both empty states, Decision 5's routing.
4. Wire the admin dashboard's Verified Professionals stat (Decision 7).
5. Confirm the M3-era stub's old routing (row → Verification Review) is fully replaced, not left as a secondary path anywhere in the directory list itself.
6. `m4-acceptance.spec.ts` + unit tests, run against the live project.
7. Re-run `m1-acceptance`, `m2-acceptance`, `m3-acceptance` unchanged; run typecheck, lint, build, full unit suite.
8. Document any deviations found during the build in this file's own "Implementation deviations" section (added once the build happens), matching the M1-M3 pattern. Any genuinely new ambiguity found during implementation gets flagged here and to Champion, not resolved unilaterally.

---

## Explicitly out of scope (restated from Stage 24, unchanged by any decision)

Opportunities, Applications, Matching, working Shortlist, contact-info reveal, education-level filter (no data field exists), certifications upload UI, any new database migration touching product schema, any new verification/status transition, AI/semantic search.

---

## Implementation deviations (recorded during the M4 build, 2026-09-12)

The build followed this checklist and the 7 decisions exactly. Every item below is either a mechanical difference that does not change product behavior, or a place a test's own bug (not the app's) needed fixing. No product behavior was changed to make a test pass.

### 1. The Verified Professionals dashboard stat did not previously exist

Stage 24's review described it as "currently hardcoded to `0`" — that was inaccurate. No stat card named "Verified Professionals" existed anywhere on the admin dashboard before this build; the nearest hardcoded-`0` card was "Active Opportunities" (a distinct, unrelated M5 stub). Decision 7 explicitly approved wiring "the existing 'Verified Professionals' dashboard stat" to real data. Read narrowly (fulfilling the approved decision, not inventing a new one), this meant **adding** the stat card using `getDirectoryProfessionalCount()` — the same predicate as the directory query, per the decision's own wording ("Do not introduce a separate definition of 'verified professional'"). The existing "Members," "Pending verification," and "Active Opportunities" cards were left untouched; the grid grew from 4 to 5 cards to avoid unilaterally removing anything.

### 2. Search UI built as text inputs, not dropdowns

No `Select`/`Combobox`/`Checkbox` component existed anywhere in the codebase before this build. Profession and Industry filters are plain text inputs matched with substring/ILIKE (same semantics as the search box), not taxonomy-backed dropdowns — building a new dropdown primitive was out of scope for a read-only milestone and the checklist's own build order didn't call for one. The Availability filter is a single "Available now" checkbox (native `<input type="checkbox">`, no Checkbox component existed) rather than a 3-way control, which matches the checklist's own reasoning: the directory's filter semantics only ever distinguish OPEN from everything else, so a 3-way selector would have exposed a state (filtering to Selective or Not Available specifically) nothing in the spec asks for.

### 3. Submit-triggered search implemented as a native `<form method="GET">`, no client JavaScript

Decision 4 asked for Enter/explicit-Search-triggered filtering, no per-keystroke requests. The simplest, most robust way to get exactly that with zero client-side JS is a plain HTML form that GETs to the same URL, landing filter values in `searchParams` — matching the existing `/admin/verification?tab=` pattern already used elsewhere. This also means the whole directory page has no client component at all, keeping with the existing "Server Components by default" architecture note (Stage 20).

### 4. Certifications and Applications sections are static empty states, no new data plumbing

`getMemberProfileForAdmin()` (M3) does not load `certifications` into its return shape, and no `applications` table exists at all. Both sections render fixed, honest empty-state copy rather than querying tables that would always return nothing in M4. Not a product decision — there is genuinely no data source for either section yet, and building one was explicitly out of scope (Stage 24 §3, restated in this checklist's "explicitly out of scope").

### 5. `isMemberInDirectory` re-check on the Admin Professional Profile route

The checklist's build plan called for a `notFound()` guard when a member isn't directory-visible, reasoning by analogy to Stage 20's RLS-testing note ("an unverified member cannot appear in the directory"). Implemented as written: the route re-checks `isMemberInDirectory(memberId)` before loading the full profile, so a stale/direct link to a member who has since dropped out of the directory (e.g. after a profession edit reset their credentials) 404s rather than showing a profile the directory itself would never surface. This is the same posture the directory list already has, applied consistently to its own detail screen — not a new rule.

### 6. Test-file fixes (not app changes) during acceptance testing

Several early test runs failed on locator bugs in the newly-written `m4-acceptance.spec.ts` itself, not the app:
- Test 7's badge-wording assertions were unscoped page-wide `getByText` calls, which became ambiguous once real accumulated test data (from M1-M3's own acceptance runs) populated the directory with multiple visible members. Fixed by scoping to the specific test candidate's own row.
- Test 5 (no Verification filter) initially asserted `getByText(/^Verification$/)` had zero matches anywhere on the page — but the admin sidebar's own "Verification" nav link (to the Verification Queue, an unrelated and correctly-present screen) legitimately matches that pattern. Fixed by scoping the assertion to the search/filter `<form>` only.
- Test 13 (dashboard stat) initially asserted an exact "before + 1" delta across a `newDirectoryMember()` call. This is correct when the test runs alone or within its own serial block, but breaks when the full 19-test suite runs with parallel workers and another block's test legitimately adds its own directory-visible member during the same window — the stat was correctly tracking reality (it just wasn't a delta of exactly 1). Fixed by cross-checking the rendered stat against a direct database count at read-time instead of assuming test isolation between concurrently-running blocks.
- The combined "setup" test that originally drove all 4 of Block B's test candidates through onboard+approve sequentially routinely exceeded even a 240-second test timeout in this environment (each onboard+approve round-trip alone can take 1-2+ minutes here). Split into 4 separate tests, each getting its own timeout budget, with the describe block's serial mode preserving execution order. This is a test-structure fix for environment latency, not a functional change.
- One test title ("...matches the directory gate exactly") accidentally substring-matched an unrelated `-g` grep filter ("Directory gate") used to run a different block in isolation during development. Renamed to avoid the collision; cosmetic only.

None of the above changed any assertion's actual pass/fail criteria against the app — every fix narrowed an over-broad locator or restructured test execution, never weakened what was being proven.

### 7. Regression + local checks that DID run (2026-09-12)

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm run build` — compiles, 27/27 pages generated, including the two new routes (`/admin/professionals` replaced, `/admin/professionals/[memberId]` new).
- `npm run test` (unit) — 54 passed (28 M2 + 26 M3/M4: the M3 suite already covered `reverificationEffect`, the directory-gate predicate, the queue tab filter, and `isDecisionActionable`; M4 added `hasActionableReverification`'s full truth table).
- `npx playwright test m4-acceptance` — **19/19 passed**, confirmed both per-block (3/3, 11/11, 5/5) and as the full 19-test suite run together with parallel workers.
- `npx playwright test m1-acceptance` — 10 passed, 1 skipped (admin path, no `M1_ADMIN_*`). Unchanged from before M4.
- `npx playwright test m2-acceptance` — 11 passed (one earlier run hit a single environment-timing flake on an unchanged test — "availability toggle persists" — that passed cleanly on immediate retry; not a regression, the same class of transient failure documented throughout M3's own testing).
- `npx playwright test m3-acceptance` — 19/19 passed (18 tests + setup). Unchanged from before M4.

No code outside `lib/directory/`, the two `/admin/professionals*` routes, the admin dashboard's stat wiring, and `lib/verification/rules.ts`'s new `hasActionableReverification` export was touched by this milestone.
