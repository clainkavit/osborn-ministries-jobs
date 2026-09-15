# Stage 28 — M6 Implementation Specification: Match → Score → Rank

Written 2026-09-12, by Claude. **Implementation-ready.** All eleven decisions this document originally flagged as open were resolved by Champion on 2026-09-12 and are now approved product decisions for M6 — see §10. No code has been written or modified during planning; this document is the authoritative build target for the implementation phase that follows separate approval.

---

## 0. What already exists (inspection summary)

A full, decided matching algorithm already exists in the spec set, and every field it needs already exists in the live schema:

- **[stage-9-matching-algorithm.md](stage-9-matching-algorithm.md)** — the authoritative weighted formula: Profession 30%, Skills 20%, Experience 20%, Availability 15%, Location 10%, Education 5%. Verification is a gate, not a weighted factor.
- **[stage-20-technical-architecture-v1.md](stage-20-technical-architecture-v1.md) §18-20** — confirms the same formula, specifies the response shape (`{ score, breakdown }`, 0-100 integers), states the breakdown must be server-computed.
- **[stage-16-api-shape.md](stage-16-api-shape.md)** — names the one matching endpoint: `GET /admin/opportunities/:id/matches`.
- **[stage-17-screen-specs.md](stage-17-screen-specs.md)** "Find Matches (Matching screen)" — admin-facing screen spec: result count, mandatory per-candidate breakdown, distinct empty state, responsive behavior.
- **[stage-18-development-milestones.md](stage-18-development-milestones.md)** "M6 — Matching" — the authoritative milestone boundary: the formula + the Find Matches screen + the one API route. **Confirmed authoritative for M6 scope (Decision 2).**

Admin read access to every member field the formula needs (`members`, `education`, `experience`, `member_skills`) is already granted by migration 003's RLS. All opportunity-side fields (`opportunity_requirements`, `opportunity_required_skills`) already exist from M5's migration 004. **No new RLS is required.**

---

## 1. Purpose

**What "Match" means:** given one `PUBLISHED` opportunity, identify which of M4's directory-visible (verified) professionals are eligible candidates, and compute a deterministic, explainable numeric score (0-100) expressing fit against that opportunity's stated requirements — so an admin sees a ranked, justified candidate list instead of manually reviewing every professional.

**Inputs:**
- Opportunity: `opportunity_requirements` (`required_profession_id`, `min_experience_years`, `required_education_level`), `opportunity_required_skills`, `location`.
- Member: `primary_profession_id`, `location`, `years_of_experience`, `availability`, `member_skills`, plus the verification gate (`membership_status`, `credentials_status`, `profile_status`).
- **`profession_freetext` is explicitly excluded from scoring (Decision 9)** — see §2.

Matching is rule-based, deterministic, explainable — not AI/ML, no fuzzy or semantic matching anywhere in this milestone.

---

## 2. Match (eligibility)

**Gate, applied before scoring — a candidate failing the gate never appears in results:**

1. **Verification gate** — the exact predicate M4 already uses: `profile_status = 'PROFILE_COMPLETE' AND membership_status = 'CONFIRMED' AND credentials_status IN ('REVIEWED', 'REVIEW_PENDING')`. Same three-condition definition as `getDirectoryProfessionalCount()`. No new definition of "verified" is introduced.
2. **Availability gate** — `availability != 'NOT_AVAILABLE'`. `NOT_SET` is also excluded (never a completed member's resting state).
3. **Opportunity must be `PUBLISHED`** — enforced as an access rule, not silently as an empty result (Decision 3, §6).

**No other eligibility gate exists.** (Decision 4 confirms: no minimum-score exclusion — every gate-passing candidate is scored and returned.)

**Fields that participate in scoring:** `required_profession_id`, `opportunity_required_skills`, `min_experience_years`, `required_education_level` (opportunity side); `primary_profession_id`, `member_skills`, `years_of_experience`, `availability`, `location` (member side).

**Fields that explicitly do NOT participate:** `opportunities.type`, `organization_name`, `description`, `headcount_required`; `members.profession_freetext` (Decision 9); `education.qualification` (Decision 1 — see §3's `education_match` rule instead).

---

## 3. Score

**Formula — exact, unchanged, fixed weights, no renormalization under any condition:**

```
match_score =
    (profession_match   × 0.30) +
    (skills_match       × 0.20) +
    (experience_match   × 0.20) +
    (availability_match × 0.15) +
    (location_match     × 0.10) +
    (education_match    × 0.05)
```

Each sub-score ∈ [0.0, 1.0]. Reported to the UI/API as an integer 0-100 via `Math.round(match_score * 100)`.

**Every scoring component — approved, exact:**

| Component | Weight | Rule |
|---|---:|---|
| `profession_match` | 30% | 1.0 if member's `primary_profession_id` equals the opportunity's `required_profession_id` exactly. 0.0 if both are set and differ. **1.0 if `required_profession_id` is null** (Decision 5 — opportunity didn't ask). `profession_freetext` never participates (Decision 9) — a freetext-only member with a null `primary_profession_id` scores 0.0 against a real requirement, exactly as an exact-match rule implies; no substring/synonym/fuzzy credit under any circumstance. |
| `skills_match` | 20% | (count of `opportunity_required_skills` present in the member's `member_skills`) ÷ (total `opportunity_required_skills`). **1.0 if the opportunity has zero required skills** (Decision 6 — guard clause before the division, not a 0/0 evaluation). |
| `experience_match` | 20% | 1.0 if `years_of_experience ≥ min_experience_years`; linear ramp down to 0.0 at `min_experience_years / 2`; floored at 0.0 below that. **1.0 if the opportunity has no `min_experience_years`** (Decision 7 — nothing to fall short of). **0.0 if the opportunity has a stated minimum but the member has no recorded `years_of_experience`** (Decision 8 — a real requirement exists and the candidate has no evidence against it; this is deliberately the opposite of Decision 7's rule, since here the opportunity DID ask). |
| `availability_match` | 15% | 1.0 for `OPEN`, 0.6 for `SELECTIVE`. (`NOT_AVAILABLE`/`NOT_SET` never reach scoring — excluded by the gate.) |
| `location_match` | 10% | 1.0 if member `location` equals the opportunity `location` (exact string match on the existing single free-text `location` column both tables already use — no normalization/geocoding, see below); 0.5 if either is null; 0.0 if both are set and differ. No radius, no distance API, no geographic proximity algorithm. |
| `education_match` | 5% | **Always 1.0 for every candidate, unconditionally** (Decision 1). Documented as a known M6 implementation limitation — see §9. |

**Location comparison, exact interpretation:** both `members.location` and `opportunities.location` are single `text` columns (no city/region decomposition exists anywhere in the schema). "Same city/region" is implemented as a case-insensitive exact string comparison between these two columns after trimming whitespace — nothing fancier. This is a direct, honest reading of the existing stored data, not a new location-matching feature: if the two free-text fields happen to be entered inconsistently (e.g. "Mwanza" vs "Mwanza, Tanzania"), that mismatch scores 0.0, matching Stage 9's binary "same/different/unknown" framing exactly as the schema allows it to be implemented today. No new location infrastructure, normalization table, or geocoding is introduced.

**Partial-credit factors:** `skills_match` (ratio), `experience_match` (linear ramp), `location_match` (0.5 middle state). **Binary/discrete factors:** `profession_match`, `availability_match`, `education_match` (always 1.0, not a real binary in this milestone but not a scale either).

**Minimum/maximum score:** 0 and 100. No exclusion below any threshold (Decision 4).

**Persisted or computed:** **computed on demand, never persisted.** No `matches`/`match_scores` table. No score-history table. This matches Stage 9/18's total silence on persistence and the explicit "necessary indexes only if genuinely required" instruction — nothing here requires one.

---

## 4. Rank

**Order:** descending by `match_score`.

**Tie-break (Decision 10, exact, approved):**
1. `match_score` DESC (primary).
2. Candidate `last_name` ASC (secondary).
3. Candidate `id` ASC as a final deterministic tiebreaker, used only to guarantee stable ordering when `match_score` and `last_name` are both identical — **this is not a ranking signal**, it exists purely so two runs of the same query return the same order. It must not be described, documented, or displayed as meaning anything about candidate quality.

No other secondary sort (experience, verification date, registration date) is used anywhere in the ordering.

**Scope:** strictly per-opportunity. `GET /admin/opportunities/:id/matches`-equivalent ranks candidates for one specific opportunity. No cross-opportunity or per-member ranking exists in M6 (Decision 2).

**Deterministic:** yes, by construction — every input is a stored field, the tie-break chain is total (score → last name → id can never produce two candidates in an undefined relative order), no randomness, no external service.

---

## 5. Data model

**No migration is required for the core Match → Score → Rank computation.** Verified during this planning pass:

- All opportunity-side fields already exist (migration 004, M5): `opportunities`, `opportunity_requirements`, `opportunity_required_skills`.
- All member-side fields already exist (migrations 001-002): `members.primary_profession_id`, `members.location`, `members.years_of_experience`, `members.availability`, `members.membership_status`, `members.credentials_status`, `members.profile_status`, `member_skills`.
- Education is deliberately NOT read from `education.qualification` for scoring (Decision 1 — `education_match` is a constant, not a query result), so the free-text/no-scale problem never reaches the implementation at all. No education-related schema change of any kind.
- No RLS changes — migration 003's existing admin-read policies on `members`/`education`/`experience`/`member_skills` already cover every read this milestone performs. (`education` itself isn't queried for scoring at all, per the above, so this is moot in practice, but the general admin-read policy set already covers it either way.)

**Indexes:** none anticipated. The computation is: fetch the one opportunity's requirements + required skills, fetch the directory-visible/available candidate pool (same query shape M4's `getDirectoryProfessionals` already uses, which needs no new index), score in application code, sort in application code. At this project's expected scale (Stage 14: 200-300 profiles), this is not a database-performance-sensitive operation. If real usage later shows otherwise, that is a follow-up optimization, not an M6 blocker — per your instruction, no index is added speculatively.

**Conclusion: migration 005 is not needed.**

---

## 6. UI

**In scope:**
- **Admin "Find Matches" screen** at `/admin/opportunities/[id]/matches`, reached via a new link/button on the existing Admin Opportunity Detail screen (`/admin/opportunities/[id]`), shown **only when the opportunity's status is `PUBLISHED`** (Decision 3). For every other status, the link/button is absent — matching M5's established "absent, not disabled" convention, not a disabled control.
- **Direct-URL access to `/admin/opportunities/[id]/matches` for a non-`PUBLISHED` opportunity must be explicitly rejected**, not silently show an empty candidate list (Decision 3). The distinction matters: "no eligible candidates for a live opportunity" and "this opportunity isn't open for matching at all" are different facts and must produce visibly different outcomes — the former is Stage 17's "no matching professionals" empty state, the latter is a clear "Matching is only available for published opportunities" state (implemented as a `notFound()`/redirect-style guard at the top of the page, mirroring `getOpportunityForAdmin`'s existing not-found pattern, not a client-side conditional that still fetches and renders an empty table).
- Every result row/card shows: candidate identity (name — same fields M4's directory row already shows), the overall score, its label (Decision 11), and the **full per-criterion breakdown** — mandatory, not optional (Stage 17). The breakdown must accurately describe what was actually computed:
  - Profession — "exact match" / "no required profession" / "no match" (never implies fuzzy/freetext credit was considered)
  - Skills — "N/M required"
  - Experience — "X years / Y+ required" or "not stated" (when the candidate has no recorded experience against a real requirement — Decision 8) or "no minimum required" (Decision 7)
  - Availability — "Open" / "Selective"
  - Location — "same location" / "location not specified" / "different location"
  - Education — **"not evaluated in M6"** or equivalent explicit wording. It must NOT read as though education was semantically assessed (no "meets requirement" / "below requirement" language for this factor in this milestone) — the copy must make the temporary always-1.0 rule legible, not hide it behind normal-looking breakdown text.
- Empty state: "no matching professionals" copy, distinct from the generic zero-result state — verify against Stage 11's states catalog during implementation rather than inventing new copy.
- Responsive: table desktop / cards mobile, breakdown stacked vertically per candidate on mobile (Stage 17, explicit).

**Explicitly absent from M6 (not disabled — not rendered at all):**
- No Shortlist action/button anywhere on this screen.
- No Contact/reveal action.
- No Apply button (not relevant here — this screen is admin-only).
- **No member-facing surface of any kind** (Decision 2): no "Opportunities for you" dashboard card, no member-side match-breakdown card on `/opportunities/[id]`, no re-ordering of the member `/opportunities` browse list by a match score. `/dashboard` (member) and `/opportunities`, `/opportunities/[id]` (member) are untouched by M6 — they must render in M6 exactly as M5 left them.

**Admin vs member visibility:** matching/scoring is admin-only in this milestone, full stop. The scoring/eligibility functions themselves are written as plain, pure, opportunity-and-candidate-pool-agnostic modules (see §7) so a future milestone can call them per-member without a rewrite — but no member-facing route, component, or query is built now.

**Exact routes/components affected:**
- New: `app/src/app/admin/(protected)/opportunities/[id]/matches/page.tsx`
- New: a results component (table/cards, responsive — follow `admin/professionals`'s existing responsive-list precedent rather than inventing a new pattern)
- Modified (additive only): `app/src/app/admin/(protected)/opportunities/[id]/page.tsx` gains a "Find Matches" link, shown only when `status === 'PUBLISHED'`, alongside the existing `OpportunityActions` transition buttons. This does not touch the M5 state machine, completeness rules, or any existing button/action already on that page.

---

## 7. Authorization / security

**Who can view scores:** Church Admin / Super Admin only, via the same private, unexported `requireAdmin()` pattern already independently replicated in `lib/verification/actions.ts`, `lib/verification/queries.ts`, `lib/opportunities/actions.ts`, `lib/opportunities/queries.ts`. M6's module (proposed: `lib/matching/queries.ts`) replicates this pattern again rather than importing a shared helper, following this project's established precedent.

**Can scores be manipulated by clients:** no. The score and breakdown are always computed server-side (a Server Component read, following this project's existing Server-Component-by-default architecture) and never accepted as client input, never trusted from a request parameter.

**Server-side enforcement requirements:**
- `requireAdmin()` gate on the matches read.
- The opportunity must be independently loaded and its status verified as `PUBLISHED` before computing anything — a `notFound()`-equivalent guard for both "opportunity doesn't exist" and "opportunity exists but isn't Published," mirroring `getOpportunityForAdmin`'s existing pattern and satisfying Decision 3's "reject clearly, don't fake an empty list" requirement.
- No RLS change needed — every read this milestone performs is already covered by existing admin-read policies (§5).

---

## 8. Testing

**Unit tests — eligibility gate (pure, no I/O), proposed module `lib/matching/eligibility.ts`:**
- `isMatchEligible(member)` — exhaustive matrix: every `(profileStatus, membershipStatus, credentialsStatus)` combination relevant to the verification gate, explicitly asserted true/false (not asserted-by-omission); every `availability` value (`OPEN`, `SELECTIVE`, `NOT_AVAILABLE`, `NOT_SET`) explicitly asserted true/false.

**Unit tests — scoring (pure, no I/O), proposed module `lib/matching/scoring.ts`:**
- `professionMatch`: exact match → 1.0; different ids → 0.0; opportunity's `required_profession_id` null → 1.0; member's `primary_profession_id` null with a real requirement → 0.0 (explicitly confirming `profession_freetext` is never read/considered here — a test with only `profession_freetext` set and `primary_profession_id` null must still return 0.0 against a real requirement).
- `skillsMatch`: 0/N, N/N, partial ratio (e.g. 3/5); zero required skills → 1.0 (explicit 0/0 guard test, not just "happens not to crash").
- `experienceMatch`: at minimum → 1.0; above minimum → 1.0 (never >1.0); at exactly half-minimum → 0.0; below half → floored at 0.0 (not negative); opportunity has no minimum → 1.0; opportunity has a minimum but member experience is null → 0.0 (this exact case must have its own named test asserting it is NOT 1.0, to guard the Decision 7 vs Decision 8 distinction against a future refactor collapsing them).
- `availabilityMatch`: `OPEN` → 1.0, `SELECTIVE` → 0.6.
- `locationMatch`: equal strings (case/whitespace-insensitive) → 1.0; either null → 0.5; both set and different → 0.0.
- `educationMatch`: always 1.0, regardless of any input — a test that passes every possible `required_education_level` value (including each of the six enum values and null) and confirms the result is always exactly 1.0, documenting the Decision 1 rule as a locked, tested constant rather than an accidental default.
- Full-formula integration test: one fixed member + one fixed opportunity with known field values → exact expected weighted total, as a regression anchor.

**Unit tests — ranking (pure, no I/O), proposed module `lib/matching/rank.ts`:**
- Descending by score.
- Tie on score → alphabetical by last name.
- Tie on score AND last name → stable via the id tiebreaker (assert the same two inputs always sort into the same relative order across repeated calls).
- A candidate with missing optional data (e.g. null `years_of_experience` against a real requirement) still appears, ranked by its (correctly low) score — never dropped, matching Decision 4/8.

**E2E acceptance scenarios** (`m6-acceptance.spec.ts`, following M3/M4/M5's small-independent-block convention given this environment's known latency):
1. Admin opens Find Matches for a Published opportunity with known candidates; sees them ranked descending by score with the full per-criterion breakdown visible on every row.
2. A candidate who fails the verification gate never appears, regardless of how well other fields would score.
3. A candidate with `NOT_AVAILABLE` never appears.
4. A candidate with `SELECTIVE` appears, scored lower on availability than an otherwise-identical `OPEN` candidate.
5. An opportunity with zero eligible candidates shows the distinct "no matching professionals" empty state.
6. A plain member is redirected away from `/admin/opportunities/[id]/matches` (same pattern as every other admin-only route test in M3/M4/M5).
7. The "Find Matches" link/button is absent from the Admin Opportunity Detail screen for a Draft/Closed/Cancelled/Filled/Completed opportunity.
8. Direct navigation to `/admin/opportunities/[id]/matches` for a non-Published opportunity shows the explicit rejection state, not an empty results table.
9. A candidate whose opportunity has no required profession is not penalized on the profession criterion (breakdown reads "no required profession," score contribution full).
10. A candidate with zero required skills on the opportunity is not penalized on skills (breakdown reads accordingly).
11. A low-scoring candidate (e.g. failing profession, skills, and experience) still appears in the results list, at the bottom — proving no score floor exists.
12. The education breakdown line explicitly reads as "not evaluated" (or equivalent), never as though a real comparison happened.
13. Two candidates with an identical score appear in alphabetical-by-last-name order.

**M1-M5 regression requirement (unchanged from M5's own precedent):** M6 must not modify `lib/verification/`, `lib/directory/`, `lib/profile/`, `lib/opportunities/rules.ts`, or any existing migration. The only additive touch to existing M5 code is the new "Find Matches" link on `/admin/opportunities/[id]`. Full M1-M5 acceptance suites re-run unchanged after implementation, same discipline M5 applied against M1-M4. Per your instruction, this regression pass is deferred until an actual M6 code change exists — not run again now.

---

## 9. Out of scope (unchanged, restated)

- Apply, Application review, Shortlisting, Connect, Notifications, messaging, contact unlocking — all M7/M8, none touched.
- Persisted match scores or score history — no table, confirmed in §5.
- Configurable/admin-tunable scoring weights — hardcoded, per Stage 9's own MVP recommendation.
- AI/ML matching, fuzzy/semantic/synonym profession matching — `profession_freetext` is excluded from scoring entirely (Decision 9); no substring or partial-credit logic exists anywhere in `profession_match`.
- Distance/radius/geocoding location matching — exact-string comparison only (§3).
- New education taxonomy or structured education field — explicitly not built in M6 (Decision 1); `education_match` is a hardcoded constant.
- M2 onboarding changes — none; M6 reads existing M2 fields only, adds nothing to onboarding.
- Any change to M5's opportunity publishing/state-machine/completeness behavior — M6 only reads `opportunities`/`opportunity_requirements`/`opportunity_required_skills`, never writes to them.
- Member-facing matching in any form (Decision 2) — deferred to a future milestone; the engine is written to be reusable then, but nothing member-facing ships now.

---

## 10. Approved decisions (Champion, 2026-09-12)

All eleven items previously flagged as **NEW PRODUCT DECISION REQUIRED** are now resolved. Nothing below is open.

1. **Education matching — Decision B.** `education_match = 1.0` unconditionally for every candidate, for the life of M6. The 5% weight is preserved unchanged; the other five weights are NOT renormalized. This is documented as a known M6 implementation limitation relative to Stage 9's fully-realized concept (structured education comparison), but is NOT a deviation from M6's approved scope — the scope itself now includes this rule as written. Revisiting this requires a future milestone that adds structured member education data; M6 does not attempt it.
2. **M6 visibility — Decision C.** M6 is admin-only: the Find Matches screen, `/admin/opportunities/[id]/matches`, per-candidate score and breakdown. No member "Opportunities for you" feed, no member dashboard matching card, no member opportunity-detail match score, no member-facing breakdown of any kind. Stage 18 is authoritative for M6's scope. The scoring/eligibility/ranking modules are written as plain functions taking a member and an opportunity/candidate-pool as arguments (not coupled to the admin route or any admin-only assumption in their internal logic) so a future milestone can reuse them per-member — but that reuse is not built now.
3. **Non-Published opportunities — Decision A.** Find Matches is available only when `status = 'PUBLISHED'`. The action is absent (not disabled) from the Admin Opportunity Detail screen for every other status. Direct access to the matches route for a non-Published opportunity is rejected with an explicit state — never a silently-empty candidate list, never a computed-but-meaningless result, never a persisted "historical" match set.
4. **Low-scoring candidates — Decision A.** Every candidate who passes the eligibility gate (verification + availability) is scored and returned, ranked descending. No minimum-score threshold exists anywhere in the query, computation, or display logic.
5. **Missing required profession — Decision A.** `required_profession_id` null → `profession_match = 1.0`. Weight stays 30%, not redistributed.
6. **Zero required skills — Decision A.** Zero rows in `opportunity_required_skills` for the opportunity → `skills_match = 1.0` (explicit guard before any division). Weight stays 20%, not redistributed.
7. **Missing minimum experience — Decision A.** `min_experience_years` null → `experience_match = 1.0`. Weight stays 20%, not redistributed.
8. **Missing member experience — Decision A.** Opportunity has a stated `min_experience_years`, but the candidate's `years_of_experience` is null → `experience_match = 0.0`. The candidate is NOT excluded from the pool — they remain visible, scored low on this one factor, with the breakdown stating the reason plainly (e.g. "not stated"). This is deliberately the inverse of Decisions 5-7: those are "the opportunity didn't ask" (full credit); this is "the opportunity asked and there's no evidence" (zero credit on that factor only).
9. **`profession_freetext` — Decision A.** Does not participate in scoring under any circumstance. `profession_match` is computed from `primary_profession_id` only, per Stage 9's originally-specified rule. No substring, synonym, semantic, or partial credit for a freetext-only profession. This does not change M4's own decision that `profession_freetext` is searchable in the directory — that remains a search-only behavior, unrelated to scoring.
10. **Tie-breaking — Decision A.** `match_score` DESC, then `last_name` ASC, then `id` ASC as a pure determinism guarantee (not a ranking signal, never described or displayed as one). No use of experience, verification date, registration date, or any other factor as a tiebreaker.
11. **Score labels — Decision A.** Stage 9's suggested display thresholds are implemented: ≥85% "Strong", ≥65% and <85% "Good", <65% "Fair". These are presentation-only, computed by a small pure function isolated from the scoring engine (e.g. `labelForScore(score: number): "Strong" | "Good" | "Fair"`), so the thresholds can be retuned later without touching `match_score`'s calculation. Labels never affect inclusion or ranking.

---

## 11. Implementation order (proposed, for approval alongside this document)

Mirrors M5's own successful order (Stage 27 §22):

1. Pure modules first, exhaustively unit-tested before anything else is built: `lib/matching/eligibility.ts` (the gate), `lib/matching/scoring.ts` (all six sub-scores + the weighted formula + `labelForScore`), `lib/matching/rank.ts` (sort + tie-break).
2. Server-side data-fetching module: `lib/matching/queries.ts` — `requireAdmin()`, load one opportunity's requirements/required-skills, load the eligible candidate pool (reusing the same underlying query shape as `getDirectoryProfessionals`, filtered to the eligibility gate rather than the directory's own filter set), compose scores via the pure modules from step 1, return the ranked, labeled result. Guards the `PUBLISHED`-only rule here (Decision 3).
3. Admin UI: `/admin/opportunities/[id]/matches` page + results component; the additive "Find Matches" link on the existing Admin Opportunity Detail page.
4. `m6-acceptance.spec.ts` — the 13 scenarios in §8, in small independent blocks.
5. M1-M5 regression re-run, full quality gates (unit suite, typecheck, lint, build) — only once actual M6 code exists, per your instruction not to re-run them speculatively now.

---

**M6 specification is implementation-ready; awaiting implementation approval.**
