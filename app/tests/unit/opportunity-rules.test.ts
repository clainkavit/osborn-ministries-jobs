import { describe, it, expect } from "vitest";
import {
  isOpportunityTransitionAllowed,
  checkOpportunityCompleteness,
  type OpportunityCompletenessInput,
} from "@/lib/opportunities/rules";
import type { OpportunityStatus } from "@/types/opportunity";

// Stage 27 (M5) checklist §20 "Unit-test requirements":
//  - isOpportunityTransitionAllowed(from, to) -- full matrix, every allowed
//    pair asserted true, every disallowed pair explicitly asserted false.
//  - checkOpportunityCompleteness() -- the required-field table from §7,
//    including the "at least one requirement signal" rule exhaustively.

const ALL_STATUSES: OpportunityStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "CANCELLED",
  "FILLED",
  "COMPLETED",
];

describe("isOpportunityTransitionAllowed -- the exact state machine (Champion Decision 3)", () => {
  it("DRAFT -> PUBLISHED is the only transition allowed from DRAFT", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("DRAFT", to),
    );
    expect(allowed).toEqual(["PUBLISHED"]);
  });

  it("PUBLISHED -> CLOSED, CANCELLED, FILLED are the only transitions allowed from PUBLISHED", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("PUBLISHED", to),
    );
    expect(allowed.sort()).toEqual(["CANCELLED", "CLOSED", "FILLED"].sort());
  });

  it("FILLED -> CLOSED is the only transition allowed from FILLED", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("FILLED", to),
    );
    expect(allowed).toEqual(["CLOSED"]);
  });

  it("CLOSED -> COMPLETED is the only transition allowed from CLOSED", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("CLOSED", to),
    );
    expect(allowed).toEqual(["COMPLETED"]);
  });

  it("CANCELLED is terminal -- no transition is allowed from it", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("CANCELLED", to),
    );
    expect(allowed).toEqual([]);
  });

  it("COMPLETED is terminal -- no transition is allowed from it", () => {
    const allowed = ALL_STATUSES.filter((to) =>
      isOpportunityTransitionAllowed("COMPLETED", to),
    );
    expect(allowed).toEqual([]);
  });

  // Each explicitly-forbidden pair from the checklist, asserted false one
  // by one -- not just implied by the "only X is allowed" tests above.
  it("PUBLISHED -> COMPLETED is forbidden (must pass through CLOSED)", () => {
    expect(isOpportunityTransitionAllowed("PUBLISHED", "COMPLETED")).toBe(
      false,
    );
  });

  it("FILLED -> COMPLETED is forbidden (must pass through CLOSED)", () => {
    expect(isOpportunityTransitionAllowed("FILLED", "COMPLETED")).toBe(false);
  });

  it("CLOSED -> PUBLISHED is forbidden", () => {
    expect(isOpportunityTransitionAllowed("CLOSED", "PUBLISHED")).toBe(false);
  });

  it("PUBLISHED -> DRAFT is forbidden", () => {
    expect(isOpportunityTransitionAllowed("PUBLISHED", "DRAFT")).toBe(false);
  });

  it("no self-transition is allowed for any status", () => {
    for (const s of ALL_STATUSES) {
      expect(isOpportunityTransitionAllowed(s, s)).toBe(false);
    }
  });

  it("full matrix: every disallowed pair is explicitly false, every allowed pair is explicitly true", () => {
    const ALLOWED_SET = new Set([
      "DRAFT>PUBLISHED",
      "PUBLISHED>CLOSED",
      "PUBLISHED>CANCELLED",
      "PUBLISHED>FILLED",
      "FILLED>CLOSED",
      "CLOSED>COMPLETED",
    ]);
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const key = `${from}>${to}`;
        expect(isOpportunityTransitionAllowed(from, to)).toBe(
          ALLOWED_SET.has(key),
        );
      }
    }
  });
});

describe("checkOpportunityCompleteness -- Publish validation (Champion §23 items 1 and 2)", () => {
  function base(): OpportunityCompletenessInput {
    return {
      title: "Driver",
      type: "EMPLOYMENT",
      organizationName: "Osborn Ministries",
      requiredProfessionId: "11111111-1111-1111-1111-111111111111",
      minExperienceYears: null,
      requiredEducationLevel: null,
      requiredSkillCount: 0,
    };
  }

  it("passes when title, type, organization, and a profession are all set", () => {
    const result = checkOpportunityCompleteness(base());
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("fails when title is empty", () => {
    const result = checkOpportunityCompleteness({ ...base(), title: "  " });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("title");
  });

  it("fails when type is null", () => {
    const result = checkOpportunityCompleteness({ ...base(), type: null });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("type");
  });

  it("fails when type is not one of EMPLOYMENT | CHURCH | SERVICE (e.g. PROJECT)", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      type: "PROJECT",
    });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("type");
  });

  it("fails when organizationName is empty", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      organizationName: "",
    });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("organizationName");
  });

  it("location is NEVER checked -- not a field this module even accepts, confirming it can never block Publish", () => {
    // OpportunityCompletenessInput has no `location` field at all -- the
    // absence itself is the proof (decided, §23 item 1).
    const result = checkOpportunityCompleteness(base());
    expect(result).not.toHaveProperty("location");
  });

  // "At least one requirement signal" -- each of the four signals alone is
  // sufficient; all four empty together fails.
  it("passes with ONLY required_profession_id set (skills/experience/education all empty)", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      requiredProfessionId: "11111111-1111-1111-1111-111111111111",
      minExperienceYears: null,
      requiredEducationLevel: null,
      requiredSkillCount: 0,
    });
    expect(result.complete).toBe(true);
  });

  it("passes with ONLY a skill set (profession null, experience/education empty) -- the nullable-profession carve-out", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      requiredProfessionId: null,
      minExperienceYears: null,
      requiredEducationLevel: null,
      requiredSkillCount: 1,
    });
    expect(result.complete).toBe(true);
  });

  it("passes with ONLY min_experience_years set (profession null, no skills, education empty)", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      requiredProfessionId: null,
      minExperienceYears: 3,
      requiredEducationLevel: null,
      requiredSkillCount: 0,
    });
    expect(result.complete).toBe(true);
  });

  it("passes with ONLY required_education_level set (profession null, no skills, no experience)", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      requiredProfessionId: null,
      minExperienceYears: null,
      requiredEducationLevel: "DIPLOMA",
      requiredSkillCount: 0,
    });
    expect(result.complete).toBe(true);
  });

  it("fails when ALL FOUR requirement signals are empty (a completely requirement-less opportunity stays Draft)", () => {
    const result = checkOpportunityCompleteness({
      ...base(),
      requiredProfessionId: null,
      minExperienceYears: null,
      requiredEducationLevel: null,
      requiredSkillCount: 0,
    });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("requirement");
  });

  it("multiple missing fields are all reported together, not just the first", () => {
    const result = checkOpportunityCompleteness({
      title: "",
      type: null,
      organizationName: "",
      requiredProfessionId: null,
      minExperienceYears: null,
      requiredEducationLevel: null,
      requiredSkillCount: 0,
    });
    expect(result.complete).toBe(false);
    expect(result.missing.sort()).toEqual(
      ["title", "type", "organizationName", "requirement"].sort(),
    );
  });
});
