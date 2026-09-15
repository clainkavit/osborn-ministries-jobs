# Stage 9 — Matching Algorithm

Written 2026-09-09, by Champion. Item 6 of [stage-4-pre-development-blueprint.md](stage-4-pre-development-blueprint.md)'s new-gaps list. [stage-2-prd.md](stage-2-prd.md) section 29 ranks factors by relative importance (Profession Very High, Skills High, Experience High, Availability High, Location Medium, Education Medium, Verification Very High) but never turns that into a number. This document does.

## The weights

| Factor | Weight | Why this weight |
|---|---:|---|
| Verification (both badges Confirmed/Reviewed) | **Gate, not a weighted factor** | See below — this isn't scored, it's a filter |
| Profession | 30% | The PRD's own "Very High" tier, and the single field every opportunity search starts from (Journey 5, Journey 6) |
| Skills | 20% | "High" tier; most opportunities list several required skills, so this carries real discriminating power between two same-profession candidates |
| Experience (years, vs. opportunity's minimum) | 20% | "High" tier — raised from the PRD's implied parity with Skills to reflect that the businessman's original ask (Journey 1's founding case) was explicitly experience-gated ("5+ years") |
| Availability (Open/Selective vs. Not available) | 15% | "High" tier, but capped below Profession/Skills/Experience since availability is closer to a soft filter than a differentiator — see note below |
| Location | 10% | "Medium" tier |
| Education | 5% | "Medium" tier, weighted lowest of the "Medium" pair since most opportunities in the founding use case (drivers, managers, HRs) don't gate primarily on degree level |
| **Total** | **100%** | |

**Verification is a gate, not a weighted score.** Per [stage-7-state-machines.md](stage-7-state-machines.md)'s decision that both badges must be Confirmed/Reviewed before a member is even discoverable, an unverified member never enters the candidate pool for matching in the first place — there's nothing to weight. This resolves a small inconsistency in the PRD, which listed Verification as a scored factor (section 29) even though section 21's workflow already implies unverified members aren't in the searchable directory to begin with. Treating it as a gate, not a percentage, is more honest to how the rest of the system already works.

**Availability is mostly a filter, not a scoring input.** A "Not available" member shouldn't rank lower, they shouldn't appear at all (the whole point of the availability toggle, PRD section 17, Journey 3). So in practice: Not Available members are excluded before scoring runs; the 15% only differentiates between Open (full weight) and Selective (partial weight, since a Selective member has said they'll only consider suitable opportunities — this one *is* worth scoring, since it signals lower conversion likelihood even when the profession/skills match).

## The formula

For a candidate who has passed the verification gate and the availability filter:

```
match_score =
    (profession_match × 0.30) +
    (skills_match     × 0.20) +
    (experience_match × 0.20) +
    (availability_match × 0.15) +
    (location_match   × 0.10) +
    (education_match  × 0.05)
```

Each sub-score is 0.0–1.0, not a separate weighting scheme:

- **profession_match:** 1.0 if the member's primary profession matches the opportunity's required profession exactly (or, once [Stage 4 item 8's taxonomy](stage-4-pre-development-blueprint.md) exists, matches within the same taxonomy leaf); 0.0 otherwise. Binary, not partial — a mismatched profession isn't "somewhat" a match. **Until the taxonomy exists, this is free-text exact-match, which will under-match near-synonyms (see Stage 4 item 8) — a known limitation, not a bug in this formula.**
- **skills_match:** (number of required skills the member has) ÷ (total required skills). E.g. 4 of 5 required skills = 0.8.
- **experience_match:** 1.0 if member's years ≥ opportunity's minimum; below that, a linear ramp down to 0.0 at half the minimum (e.g. opportunity wants 5+ years, member has 3 → 3/5 = 0.6), floored at 0.0 for anything below half. Avoids a harsh binary cutoff for someone one year short while still meaningfully penalizing a large gap.
- **availability_match:** 1.0 for Open, 0.6 for Selective (members already excluded from the pool entirely if Not Available, per the gate above).
- **location_match:** 1.0 if same city/region as the opportunity, 0.5 if unspecified/unknown, 0.0 if a different, distant region. (Assumes location is a single city/region field, matching PRD section 10's "Location" field — no radius/distance calculation for MVP.)
- **education_match:** 1.0 if member's education level meets or exceeds the opportunity's stated requirement, 0.0 if below, 1.0 if the opportunity specifies no education requirement (don't penalize for a criterion the opportunity didn't ask for).

## The explanation shown to the admin (already decided, restated for completeness)

Per PRD section 29 and [stage-3-ux.md](stage-3-ux.md) section 10's "match explanation" principle, already decided as non-negotiable: never show only the percentage. Every candidate row shows the per-criterion breakdown:

```
96% match

✓ Profession        (exact match)
✓ Skills             4/5 required
✓ Experience         8 yrs (5+ required)
✓ Availability       Open
✓ Location            Dar es Salaam
✓ Education          Bachelor's (met)
```

A criterion below its own full score still shows (e.g. "3/5 required skills," not hidden), so the admin sees exactly where the score came from — this is what makes the number legible rather than a black box, and it's the reason the formula above needs named sub-scores per factor, not just one opaque blended output.

## What this does NOT decide

- The exact **display threshold** for "Strong match" / "Good match" / "Fair match" labels used in Stage 3's mockups (e.g. is 90%+ "Strong"?). Suggest 85%+ Strong, 65-84% Good, below 65% Fair or not shown at all, but this is a cosmetic tuning question, not a structural one — easy to adjust after real matching data exists, unlike the weights above which affect what the query itself returns.
- Whether these weights are configurable by an admin later, or hardcoded. Recommend hardcoded for MVP (no screen or need identified for admin-tunable weights in Stage 5's P0/P1 list) — revisit only if real usage shows the defaults are wrong for this specific congregation's mix of professions.
