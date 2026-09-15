import { describe, it, expect } from "vitest";
import {
  isApplicationTransitionAllowed,
  isApplicationEligible,
  isInterviewScheduleComplete,
  isEligibleForBulkClose,
  type ApplicationEligibilityInput,
} from "@/lib/applications/rules";
import type { ApplicationStatus, ApplicationActor } from "@/types/application";

// Stage 29 (M7) -- exhaustive matrix, every case explicitly asserted
// true/false (not asserted-by-omission), matching M3/M4/M5/M6's own
// exhaustive-matrix convention for transition/gate predicates.

const ALL_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "REVIEWED",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];
const ACTORS: ApplicationActor[] = ["MEMBER", "ADMIN"];

describe("isApplicationTransitionAllowed -- explicitly named forward transitions (Champion's instructions)", () => {
  it("APPLIED -> REVIEWED, admin only", () => {
    expect(isApplicationTransitionAllowed("APPLIED", "REVIEWED", "ADMIN")).toBe(
      true,
    );
    expect(
      isApplicationTransitionAllowed("APPLIED", "REVIEWED", "MEMBER"),
    ).toBe(false);
  });

  it("REVIEWED -> SHORTLISTED, admin only", () => {
    expect(
      isApplicationTransitionAllowed("REVIEWED", "SHORTLISTED", "ADMIN"),
    ).toBe(true);
    expect(
      isApplicationTransitionAllowed("REVIEWED", "SHORTLISTED", "MEMBER"),
    ).toBe(false);
  });

  it("SHORTLISTED -> INTERVIEW, admin only", () => {
    expect(
      isApplicationTransitionAllowed("SHORTLISTED", "INTERVIEW", "ADMIN"),
    ).toBe(true);
    expect(
      isApplicationTransitionAllowed("SHORTLISTED", "INTERVIEW", "MEMBER"),
    ).toBe(false);
  });

  it("INTERVIEW -> SELECTED, admin only", () => {
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "SELECTED", "ADMIN"),
    ).toBe(true);
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "SELECTED", "MEMBER"),
    ).toBe(false);
  });

  it("INTERVIEW -> REJECTED, admin only", () => {
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "REJECTED", "ADMIN"),
    ).toBe(true);
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "REJECTED", "MEMBER"),
    ).toBe(false);
  });

  it("APPLIED/REVIEWED/SHORTLISTED -> WITHDRAWN, member only", () => {
    for (const from of ["APPLIED", "REVIEWED", "SHORTLISTED"] as const) {
      expect(isApplicationTransitionAllowed(from, "WITHDRAWN", "MEMBER")).toBe(
        true,
      );
      expect(isApplicationTransitionAllowed(from, "WITHDRAWN", "ADMIN")).toBe(
        false,
      );
    }
  });
});

describe("isApplicationTransitionAllowed -- explicitly forbidden transitions (Champion's instructions)", () => {
  it("INTERVIEW -> WITHDRAWN is forbidden for both actors", () => {
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "WITHDRAWN", "MEMBER"),
    ).toBe(false);
    expect(
      isApplicationTransitionAllowed("INTERVIEW", "WITHDRAWN", "ADMIN"),
    ).toBe(false);
  });

  it("SELECTED -> anything is forbidden", () => {
    for (const to of ALL_STATUSES) {
      for (const actor of ACTORS) {
        expect(isApplicationTransitionAllowed("SELECTED", to, actor)).toBe(
          false,
        );
      }
    }
  });

  it("REJECTED -> anything is forbidden", () => {
    for (const to of ALL_STATUSES) {
      for (const actor of ACTORS) {
        expect(isApplicationTransitionAllowed("REJECTED", to, actor)).toBe(
          false,
        );
      }
    }
  });

  it("WITHDRAWN -> anything is forbidden", () => {
    for (const to of ALL_STATUSES) {
      for (const actor of ACTORS) {
        expect(isApplicationTransitionAllowed("WITHDRAWN", to, actor)).toBe(
          false,
        );
      }
    }
  });

  it("APPLIED -> SHORTLISTED is forbidden for both actors (Decision 2)", () => {
    expect(
      isApplicationTransitionAllowed("APPLIED", "SHORTLISTED", "ADMIN"),
    ).toBe(false);
    expect(
      isApplicationTransitionAllowed("APPLIED", "SHORTLISTED", "MEMBER"),
    ).toBe(false);
  });

  it("APPLIED -> INTERVIEW is forbidden for both actors (Decision 2)", () => {
    expect(
      isApplicationTransitionAllowed("APPLIED", "INTERVIEW", "ADMIN"),
    ).toBe(false);
    expect(
      isApplicationTransitionAllowed("APPLIED", "INTERVIEW", "MEMBER"),
    ).toBe(false);
  });

  it("no backward transition is ever allowed", () => {
    const backwardPairs: [ApplicationStatus, ApplicationStatus][] = [
      ["REVIEWED", "APPLIED"],
      ["SHORTLISTED", "REVIEWED"],
      ["INTERVIEW", "SHORTLISTED"],
    ];
    for (const [from, to] of backwardPairs) {
      for (const actor of ACTORS) {
        expect(isApplicationTransitionAllowed(from, to, actor)).toBe(false);
      }
    }
  });
});

describe("isApplicationTransitionAllowed -- full exhaustive matrix", () => {
  it("every (from, to, actor) triple matches the exact named rule set, nothing implied by omission", () => {
    const expectedTrue = new Set([
      "APPLIED>REVIEWED>ADMIN",
      "APPLIED>WITHDRAWN>MEMBER",
      "APPLIED>REJECTED>ADMIN",
      "REVIEWED>SHORTLISTED>ADMIN",
      "REVIEWED>WITHDRAWN>MEMBER",
      "REVIEWED>REJECTED>ADMIN",
      "SHORTLISTED>INTERVIEW>ADMIN",
      "SHORTLISTED>WITHDRAWN>MEMBER",
      "SHORTLISTED>REJECTED>ADMIN",
      "INTERVIEW>SELECTED>ADMIN",
      "INTERVIEW>REJECTED>ADMIN",
    ]);

    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        for (const actor of ACTORS) {
          const key = `${from}>${to}>${actor}`;
          expect(isApplicationTransitionAllowed(from, to, actor)).toBe(
            expectedTrue.has(key),
          );
        }
      }
    }
  });
});

describe("isApplicationEligible -- Apply gate (Decision 5: availability is NOT checked)", () => {
  function make(
    overrides: Partial<ApplicationEligibilityInput>,
  ): ApplicationEligibilityInput {
    return {
      opportunityStatus: "PUBLISHED",
      profileStatus: "PROFILE_COMPLETE",
      membershipStatus: "CONFIRMED",
      credentialsStatus: "REVIEWED",
      hasExistingApplication: false,
      ...overrides,
    };
  }

  it("eligible when Published, verified, no duplicate", () => {
    expect(isApplicationEligible(make({}))).toEqual({
      eligible: true,
      reason: null,
    });
  });

  it("eligible with REVIEW_PENDING credentials (same verified definition as M4/M6)", () => {
    expect(
      isApplicationEligible(make({ credentialsStatus: "REVIEW_PENDING" })),
    ).toEqual({ eligible: true, reason: null });
  });

  it("ineligible, NOT_PUBLISHED, for every non-Published opportunity status", () => {
    for (const opportunityStatus of [
      "DRAFT",
      "CLOSED",
      "CANCELLED",
      "FILLED",
      "COMPLETED",
    ] as const) {
      expect(isApplicationEligible(make({ opportunityStatus }))).toEqual({
        eligible: false,
        reason: "NOT_PUBLISHED",
      });
    }
  });

  it("ineligible, NOT_VERIFIED, when profile isn't complete", () => {
    expect(
      isApplicationEligible(make({ profileStatus: "REGISTERED" })),
    ).toEqual({ eligible: false, reason: "NOT_VERIFIED" });
  });

  it("ineligible, NOT_VERIFIED, when membership isn't confirmed", () => {
    expect(
      isApplicationEligible(make({ membershipStatus: "PENDING" })),
    ).toEqual({ eligible: false, reason: "NOT_VERIFIED" });
  });

  it("ineligible, NOT_VERIFIED, when credentials are neither Reviewed nor Review_pending", () => {
    for (const credentialsStatus of [
      "NOT_SUBMITTED",
      "PENDING",
      "NEEDS_CORRECTION",
    ] as const) {
      expect(isApplicationEligible(make({ credentialsStatus }))).toEqual({
        eligible: false,
        reason: "NOT_VERIFIED",
      });
    }
  });

  it("ineligible, DUPLICATE, when a non-withdrawn application already exists", () => {
    expect(
      isApplicationEligible(make({ hasExistingApplication: true })),
    ).toEqual({ eligible: false, reason: "DUPLICATE" });
  });

  it("NOT_PUBLISHED takes priority over other failing conditions", () => {
    expect(
      isApplicationEligible(
        make({
          opportunityStatus: "DRAFT",
          profileStatus: "REGISTERED",
          hasExistingApplication: true,
        }),
      ),
    ).toEqual({ eligible: false, reason: "NOT_PUBLISHED" });
  });

  it("Decision 5 -- availability is never part of the input or the decision; the eligibility input has no availability field at all", () => {
    // Compile-time proof: ApplicationEligibilityInput simply has no
    // `availability` key, so a NOT_AVAILABLE member is eligible exactly
    // like an OPEN one when every other condition holds.
    const input = make({});
    expect("availability" in input).toBe(false);
    expect(isApplicationEligible(input).eligible).toBe(true);
  });
});

describe("isInterviewScheduleComplete -- Decision 6: date + time + location required, instructions optional", () => {
  it("complete when all three are present", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: "2026-10-01",
        interviewTime: "10:00",
        interviewLocation: "Church office",
      }),
    ).toBe(true);
  });

  it("incomplete if date is missing", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: null,
        interviewTime: "10:00",
        interviewLocation: "Church office",
      }),
    ).toBe(false);
  });

  it("incomplete if time is missing", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: "2026-10-01",
        interviewTime: null,
        interviewLocation: "Church office",
      }),
    ).toBe(false);
  });

  it("incomplete if location is missing", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: "2026-10-01",
        interviewTime: "10:00",
        interviewLocation: null,
      }),
    ).toBe(false);
  });

  it("incomplete if a required field is blank/whitespace, not just null", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: "2026-10-01",
        interviewTime: "10:00",
        interviewLocation: "   ",
      }),
    ).toBe(false);
  });

  it("all three missing is incomplete", () => {
    expect(
      isInterviewScheduleComplete({
        interviewDate: null,
        interviewTime: null,
        interviewLocation: null,
      }),
    ).toBe(false);
  });
});

describe("isEligibleForBulkClose -- Decision 9: only the four open statuses", () => {
  it("APPLIED, REVIEWED, SHORTLISTED, INTERVIEW are eligible", () => {
    for (const status of [
      "APPLIED",
      "REVIEWED",
      "SHORTLISTED",
      "INTERVIEW",
    ] as const) {
      expect(isEligibleForBulkClose(status)).toBe(true);
    }
  });

  it("SELECTED, REJECTED, WITHDRAWN are NOT eligible -- must remain untouched", () => {
    for (const status of ["SELECTED", "REJECTED", "WITHDRAWN"] as const) {
      expect(isEligibleForBulkClose(status)).toBe(false);
    }
  });
});
