import { describe, it, expect } from "vitest";
import {
  professionMatch,
  skillsMatch,
  experienceMatch,
  availabilityMatch,
  locationMatch,
  educationMatch,
  computeMatchScore,
  toScorePercent,
  labelForScore,
  type MatchSubScores,
} from "@/lib/matching/scoring";

// Stage 28 (M6) checklist §8/§10 -- exhaustive coverage of every sub-score,
// including the four missing-data guard clauses, the Decision 7 vs
// Decision 8 distinction, and a full-formula regression anchor.

describe("professionMatch -- 30% weight, binary, no freetext credit (Decision 9)", () => {
  it("exact match returns 1.0", () => {
    expect(professionMatch("prof-1", "prof-1")).toBe(1.0);
  });

  it("mismatched ids return 0.0", () => {
    expect(professionMatch("prof-1", "prof-2")).toBe(0.0);
  });

  it("required profession null (Decision 5) returns 1.0 regardless of candidate", () => {
    expect(professionMatch(null, "prof-1")).toBe(1.0);
    expect(professionMatch(null, null)).toBe(1.0);
  });

  it("candidate has no primary_profession_id against a real requirement returns 0.0 (freetext never substituted in, Decision 9)", () => {
    expect(professionMatch("prof-1", null)).toBe(0.0);
  });
});

describe("skillsMatch -- 20% weight, ratio with zero-required guard (Decision 6)", () => {
  it("zero required skills returns 1.0 (not a 0/0 evaluation)", () => {
    expect(skillsMatch([], [])).toBe(1.0);
    expect(skillsMatch([], ["skill-1"])).toBe(1.0);
  });

  it("full match (N/N) returns 1.0", () => {
    expect(skillsMatch(["a", "b"], ["a", "b"])).toBe(1.0);
    expect(skillsMatch(["a", "b"], ["a", "b", "c"])).toBe(1.0);
  });

  it("zero match (0/N) returns 0.0", () => {
    expect(skillsMatch(["a", "b"], [])).toBe(0.0);
    expect(skillsMatch(["a", "b"], ["c", "d"])).toBe(0.0);
  });

  it("partial match returns the exact ratio", () => {
    expect(skillsMatch(["a", "b", "c", "d", "e"], ["a", "b", "c"])).toBeCloseTo(
      0.6,
    );
    expect(skillsMatch(["a", "b", "c", "d"], ["a"])).toBe(0.25);
  });
});

describe("experienceMatch -- 20% weight, linear ramp with two distinct missing-data rules", () => {
  it("at exactly the minimum returns 1.0", () => {
    expect(experienceMatch(5, 5)).toBe(1.0);
  });

  it("above the minimum returns 1.0, never more than 1.0", () => {
    expect(experienceMatch(5, 10)).toBe(1.0);
    expect(experienceMatch(5, 100)).toBe(1.0);
  });

  it("at exactly half the minimum returns 0.0", () => {
    expect(experienceMatch(10, 5)).toBe(0.0);
  });

  it("below half the minimum is floored at 0.0, never negative", () => {
    expect(experienceMatch(10, 2)).toBe(0.0);
    expect(experienceMatch(10, 0)).toBe(0.0);
  });

  it("between half and the minimum ramps linearly", () => {
    // min=10, half=5: at 7.5 the ramp is (7.5-5)/(10-5) = 0.5
    expect(experienceMatch(10, 7.5)).toBeCloseTo(0.5);
    // min=8, half=4: at 6 the ramp is (6-4)/(8-4) = 0.5
    expect(experienceMatch(8, 6)).toBeCloseTo(0.5);
  });

  it("Decision 7 -- opportunity has no minimum returns 1.0 regardless of candidate experience", () => {
    expect(experienceMatch(null, 0)).toBe(1.0);
    expect(experienceMatch(null, 20)).toBe(1.0);
    expect(experienceMatch(null, null)).toBe(1.0);
  });

  it("Decision 8 -- opportunity HAS a minimum but candidate experience is null returns 0.0, NOT 1.0", () => {
    expect(experienceMatch(5, null)).toBe(0.0);
    expect(experienceMatch(1, null)).toBe(0.0);
  });

  it("Decision 7 and Decision 8 are distinct branches, not the same rule applied twice", () => {
    // Same "null" involved in both, but opposite results depending on
    // which side of the pair is null -- this guards against a future
    // refactor accidentally collapsing them into one null-check.
    expect(experienceMatch(null, null)).toBe(1.0); // opportunity silent -> 1.0
    expect(experienceMatch(5, null)).toBe(0.0); // opportunity asked -> 0.0
  });
});

describe("availabilityMatch -- 15% weight, two discrete values", () => {
  it("OPEN returns 1.0", () => {
    expect(availabilityMatch("OPEN")).toBe(1.0);
  });

  it("SELECTIVE returns 0.6", () => {
    expect(availabilityMatch("SELECTIVE")).toBe(0.6);
  });
});

describe("locationMatch -- 10% weight, exact string comparison only", () => {
  it("equal strings return 1.0", () => {
    expect(locationMatch("Mwanza", "Mwanza")).toBe(1.0);
  });

  it("case-insensitive equal strings return 1.0", () => {
    expect(locationMatch("Mwanza", "MWANZA")).toBe(1.0);
  });

  it("whitespace-insensitive equal strings return 1.0", () => {
    expect(locationMatch("  Mwanza  ", "Mwanza")).toBe(1.0);
  });

  it("either null returns 0.5", () => {
    expect(locationMatch(null, "Mwanza")).toBe(0.5);
    expect(locationMatch("Mwanza", null)).toBe(0.5);
    expect(locationMatch(null, null)).toBe(0.5);
  });

  it("blank string is treated as unspecified (0.5), not a literal empty match", () => {
    expect(locationMatch("", "Mwanza")).toBe(0.5);
    expect(locationMatch("   ", "Mwanza")).toBe(0.5);
  });

  it("both set and different returns 0.0", () => {
    expect(locationMatch("Mwanza", "Arusha")).toBe(0.0);
  });

  it("no radius/distance logic -- nearby-but-different strings still score 0.0", () => {
    expect(locationMatch("Mwanza", "Mwanza, Tanzania")).toBe(0.0);
  });
});

describe("educationMatch -- 5% weight, always 1.0 (Decision 1)", () => {
  it("returns 1.0 unconditionally, with no arguments", () => {
    expect(educationMatch()).toBe(1.0);
  });
});

describe("computeMatchScore -- exact fixed-weight formula, never renormalized", () => {
  it("all sub-scores at 1.0 produce a total of 1.0", () => {
    const sub: MatchSubScores = {
      profession: 1,
      skills: 1,
      experience: 1,
      availability: 1,
      location: 1,
      education: 1,
    };
    expect(computeMatchScore(sub)).toBeCloseTo(1.0);
  });

  it("all sub-scores at 0.0 produce a total of 0.0", () => {
    const sub: MatchSubScores = {
      profession: 0,
      skills: 0,
      experience: 0,
      availability: 0,
      location: 0,
      education: 0,
    };
    expect(computeMatchScore(sub)).toBe(0.0);
  });

  it("full-formula regression anchor: a fixed, known input produces the exact expected weighted total", () => {
    // profession 1.0*0.30=0.30, skills 0.8*0.20=0.16, experience 1.0*0.20=0.20,
    // availability 0.6*0.15=0.09, location 0.5*0.10=0.05, education 1.0*0.05=0.05
    // total = 0.30+0.16+0.20+0.09+0.05+0.05 = 0.85
    const sub: MatchSubScores = {
      profession: 1.0,
      skills: 0.8,
      experience: 1.0,
      availability: 0.6,
      location: 0.5,
      education: 1.0,
    };
    expect(computeMatchScore(sub)).toBeCloseTo(0.85);
    expect(toScorePercent(computeMatchScore(sub))).toBe(85);
  });

  it("weights sum to 1.0 (sanity check the constants themselves)", () => {
    const sub: MatchSubScores = {
      profession: 1,
      skills: 0,
      experience: 0,
      availability: 0,
      location: 0,
      education: 0,
    };
    // isolates the profession weight
    expect(computeMatchScore(sub)).toBeCloseTo(0.3);
  });
});

describe("toScorePercent -- 0.0-1.0 to integer 0-100", () => {
  it("rounds to the nearest integer", () => {
    expect(toScorePercent(0.94)).toBe(94);
    expect(toScorePercent(1.0)).toBe(100);
    expect(toScorePercent(0.0)).toBe(0);
    expect(toScorePercent(0.005)).toBe(1); // rounds 0.5 up
  });
});

describe("labelForScore -- presentation only, isolated from the scoring engine (Decision 11)", () => {
  it("85 and above is Strong", () => {
    expect(labelForScore(85)).toBe("Strong");
    expect(labelForScore(100)).toBe("Strong");
  });

  it("65 up to but not including 85 is Good", () => {
    expect(labelForScore(65)).toBe("Good");
    expect(labelForScore(84)).toBe("Good");
  });

  it("below 65 is Fair", () => {
    expect(labelForScore(64)).toBe("Fair");
    expect(labelForScore(0)).toBe("Fair");
  });
});
