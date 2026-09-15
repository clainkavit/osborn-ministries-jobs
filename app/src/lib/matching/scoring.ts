// Stage 28 (M6) -- pure scoring engine. Unit-tested. No I/O.
//
// Stage 9's weighted formula, exact, fixed weights, NEVER renormalized
// (Stage 28 §10, every missing-data decision explicitly preserves the
// original weight rather than redistributing it):
//
//   match_score =
//       (profession_match   x 0.30) +
//       (skills_match       x 0.20) +
//       (experience_match   x 0.20) +
//       (availability_match x 0.15) +
//       (location_match     x 0.10) +
//       (education_match    x 0.05)
//
// Each sub-score is 0.0-1.0. The weighted sum is reported to callers as an
// integer 0-100 via toScorePercent().

import type { Availability } from "@/types/member";

// ---------------------------------------------------------------------------
// profession_match -- 30%. Binary. profession_freetext NEVER participates
// (Decision 9) -- only primary_profession_id is compared, ever.
// ---------------------------------------------------------------------------

/** 1.0 if the opportunity has no required profession (Decision 5 -- nothing
 *  to fall short of). 1.0 if the candidate's primary profession exactly
 *  equals the required profession. 0.0 otherwise, INCLUDING when the
 *  candidate has no primary_profession_id (a freetext-only profession is
 *  never substituted in -- Decision 9). */
export function professionMatch(
  requiredProfessionId: string | null,
  candidatePrimaryProfessionId: string | null,
): number {
  if (requiredProfessionId === null) return 1.0;
  if (candidatePrimaryProfessionId === requiredProfessionId) return 1.0;
  return 0.0;
}

// ---------------------------------------------------------------------------
// skills_match -- 20%. Ratio, with a guard for the zero-required-skills case
// (Decision 6 -- 1.0, not a 0/0 evaluation).
// ---------------------------------------------------------------------------

/** (count of required skill ids present in candidateSkillIds) / (total
 *  required skill ids). 1.0 if there are zero required skills. */
export function skillsMatch(
  requiredSkillIds: readonly string[],
  candidateSkillIds: readonly string[],
): number {
  if (requiredSkillIds.length === 0) return 1.0;
  const owned = new Set(candidateSkillIds);
  const matched = requiredSkillIds.filter((id) => owned.has(id)).length;
  return matched / requiredSkillIds.length;
}

// ---------------------------------------------------------------------------
// experience_match -- 20%. Linear ramp, with two distinct missing-data
// rules that must NOT be collapsed into one (Decisions 7 and 8):
//   - opportunity has no minimum -> 1.0 (nothing to fall short of)
//   - opportunity HAS a minimum, candidate has no recorded experience
//     -> 0.0 (a real requirement exists; no evidence of meeting it)
// ---------------------------------------------------------------------------

/** 1.0 at or above the minimum; linear ramp down to 0.0 at half the
 *  minimum; floored at 0.0 below that. 1.0 if the opportunity states no
 *  minimum (Decision 7). 0.0 if the opportunity states a minimum but the
 *  candidate's years of experience is null (Decision 8) -- this is the
 *  opposite of Decision 7's rule and must stay a distinct branch. */
export function experienceMatch(
  minExperienceYears: number | null,
  candidateYearsOfExperience: number | null,
): number {
  if (minExperienceYears === null) return 1.0;
  if (candidateYearsOfExperience === null) return 0.0;

  if (candidateYearsOfExperience >= minExperienceYears) return 1.0;

  const half = minExperienceYears / 2;
  if (candidateYearsOfExperience <= half) return 0.0;

  return (candidateYearsOfExperience - half) / (minExperienceYears - half);
}

// ---------------------------------------------------------------------------
// availability_match -- 15%. Two discrete values (NOT_AVAILABLE/NOT_SET
// never reach this function -- excluded by the eligibility gate first).
// ---------------------------------------------------------------------------

export function availabilityMatch(availability: Availability): number {
  if (availability === "OPEN") return 1.0;
  if (availability === "SELECTIVE") return 0.6;
  return 0.0;
}

// ---------------------------------------------------------------------------
// location_match -- 10%. Exact, case/whitespace-insensitive string
// comparison on the existing single free-text location columns. No
// geocoding, no radius, no distance calculation (Stage 28 §3).
// ---------------------------------------------------------------------------

function normalizeLocation(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
}

/** 1.0 if both locations are set and equal (case/whitespace-insensitive);
 *  0.5 if either is null/blank; 0.0 if both are set and differ. */
export function locationMatch(
  opportunityLocation: string | null,
  candidateLocation: string | null,
): number {
  const a = normalizeLocation(opportunityLocation);
  const b = normalizeLocation(candidateLocation);
  if (a === null || b === null) return 0.5;
  return a === b ? 1.0 : 0.0;
}

// ---------------------------------------------------------------------------
// education_match -- 5%. Always 1.0, unconditionally, for the life of M6
// (Decision 1 -- member education is free text with no comparable ordinal
// scale; NOT queried, NOT interpreted, NOT inferred). This is a documented
// M6 implementation limitation, not an oversight -- see Stage 28 §9/§10.
// ---------------------------------------------------------------------------

/** Always returns 1.0. Takes no arguments on purpose -- there is nothing to
 *  evaluate in M6; education.qualification is never read for scoring. */
export function educationMatch(): number {
  return 1.0;
}

// ---------------------------------------------------------------------------
// The weighted formula. Fixed weights, never renormalized.
// ---------------------------------------------------------------------------

export interface MatchSubScores {
  profession: number;
  skills: number;
  experience: number;
  availability: number;
  location: number;
  education: number;
}

const WEIGHTS = {
  profession: 0.3,
  skills: 0.2,
  experience: 0.2,
  availability: 0.15,
  location: 0.1,
  education: 0.05,
} as const;

/** The weighted sum, 0.0-1.0. Use toScorePercent() to get the 0-100
 *  integer reported to callers/UI. */
export function computeMatchScore(sub: MatchSubScores): number {
  return (
    sub.profession * WEIGHTS.profession +
    sub.skills * WEIGHTS.skills +
    sub.experience * WEIGHTS.experience +
    sub.availability * WEIGHTS.availability +
    sub.location * WEIGHTS.location +
    sub.education * WEIGHTS.education
  );
}

/** 0.0-1.0 -> integer 0-100, matching Stage 20's response-shape example
 *  ("score": 94). */
export function toScorePercent(matchScore: number): number {
  return Math.round(matchScore * 100);
}

// ---------------------------------------------------------------------------
// labelForScore -- presentation-only (Decision 11). Isolated from the
// scoring engine on purpose: retuning these thresholds later must never
// require touching computeMatchScore or any sub-score function. Labels
// never affect inclusion or ranking.
// ---------------------------------------------------------------------------

export type MatchLabel = "Strong" | "Good" | "Fair";

/** Takes the 0-100 integer score (i.e. the output of toScorePercent), not
 *  the raw 0.0-1.0 match_score. */
export function labelForScore(scorePercent: number): MatchLabel {
  if (scorePercent >= 85) return "Strong";
  if (scorePercent >= 65) return "Good";
  return "Fair";
}
