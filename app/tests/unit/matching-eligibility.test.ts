import { describe, it, expect } from "vitest";
import { isMatchEligible, type EligibilityInput } from "@/lib/matching/eligibility";
import type {
  Availability,
  CredentialsStatus,
  MembershipStatus,
  ProfileStatus,
} from "@/types/member";

// Stage 28 (M6) checklist §8 -- exhaustive matrix, every case explicitly
// asserted true/false (not asserted-by-omission), matching M3/M4/M5's own
// exhaustive-matrix convention for gate predicates.

const PROFILE_STATUSES: ProfileStatus[] = ["REGISTERED", "PROFILE_COMPLETE"];
const MEMBERSHIP_STATUSES: MembershipStatus[] = [
  "NOT_SUBMITTED",
  "PENDING",
  "CONFIRMED",
  "NEEDS_CORRECTION",
  "SUSPENDED",
];
const CREDENTIALS_STATUSES: CredentialsStatus[] = [
  "NOT_SUBMITTED",
  "PENDING",
  "REVIEWED",
  "NEEDS_CORRECTION",
  "REVIEW_PENDING",
];
const AVAILABILITIES: Availability[] = [
  "NOT_SET",
  "OPEN",
  "SELECTIVE",
  "NOT_AVAILABLE",
];

function make(overrides: Partial<EligibilityInput>): EligibilityInput {
  return {
    profileStatus: "PROFILE_COMPLETE",
    membershipStatus: "CONFIRMED",
    credentialsStatus: "REVIEWED",
    availability: "OPEN",
    ...overrides,
  };
}

describe("isMatchEligible -- verification gate (exact M4 definition)", () => {
  it("passes for PROFILE_COMPLETE + CONFIRMED + REVIEWED + OPEN", () => {
    expect(isMatchEligible(make({}))).toBe(true);
  });

  it("passes for PROFILE_COMPLETE + CONFIRMED + REVIEW_PENDING + OPEN", () => {
    expect(
      isMatchEligible(make({ credentialsStatus: "REVIEW_PENDING" })),
    ).toBe(true);
  });

  it("full exhaustive matrix over profileStatus x membershipStatus x credentialsStatus (availability held at OPEN)", () => {
    for (const profileStatus of PROFILE_STATUSES) {
      for (const membershipStatus of MEMBERSHIP_STATUSES) {
        for (const credentialsStatus of CREDENTIALS_STATUSES) {
          const expected =
            profileStatus === "PROFILE_COMPLETE" &&
            membershipStatus === "CONFIRMED" &&
            (credentialsStatus === "REVIEWED" ||
              credentialsStatus === "REVIEW_PENDING");
          expect(
            isMatchEligible(
              make({ profileStatus, membershipStatus, credentialsStatus }),
            ),
          ).toBe(expected);
        }
      }
    }
  });

  it("REGISTERED profileStatus always fails, even with both tracks approved", () => {
    expect(isMatchEligible(make({ profileStatus: "REGISTERED" }))).toBe(
      false,
    );
  });

  it("PENDING membership fails even with REVIEWED credentials", () => {
    expect(
      isMatchEligible(
        make({ membershipStatus: "PENDING", credentialsStatus: "REVIEWED" }),
      ),
    ).toBe(false);
  });

  it("NEEDS_CORRECTION on either track fails", () => {
    expect(
      isMatchEligible(make({ membershipStatus: "NEEDS_CORRECTION" })),
    ).toBe(false);
    expect(
      isMatchEligible(make({ credentialsStatus: "NEEDS_CORRECTION" })),
    ).toBe(false);
  });

  it("SUSPENDED membership fails", () => {
    expect(isMatchEligible(make({ membershipStatus: "SUSPENDED" }))).toBe(
      false,
    );
  });

  it("NOT_SUBMITTED on either track fails", () => {
    expect(
      isMatchEligible(make({ membershipStatus: "NOT_SUBMITTED" })),
    ).toBe(false);
    expect(
      isMatchEligible(make({ credentialsStatus: "NOT_SUBMITTED" })),
    ).toBe(false);
  });

  it("PENDING credentials fails (not yet reviewed at all)", () => {
    expect(isMatchEligible(make({ credentialsStatus: "PENDING" }))).toBe(
      false,
    );
  });
});

describe("isMatchEligible -- availability gate", () => {
  it("exhaustive matrix over every availability value (verification gate held passing)", () => {
    for (const availability of AVAILABILITIES) {
      const expected = availability === "OPEN" || availability === "SELECTIVE";
      expect(isMatchEligible(make({ availability }))).toBe(expected);
    }
  });

  it("OPEN passes", () => {
    expect(isMatchEligible(make({ availability: "OPEN" }))).toBe(true);
  });

  it("SELECTIVE passes (scored lower, but still eligible)", () => {
    expect(isMatchEligible(make({ availability: "SELECTIVE" }))).toBe(true);
  });

  it("NOT_AVAILABLE fails", () => {
    expect(isMatchEligible(make({ availability: "NOT_AVAILABLE" }))).toBe(
      false,
    );
  });

  it("NOT_SET fails (never a completed member's resting state)", () => {
    expect(isMatchEligible(make({ availability: "NOT_SET" }))).toBe(false);
  });
});

describe("isMatchEligible -- both gates must pass simultaneously", () => {
  it("fails if verification passes but availability fails", () => {
    expect(
      isMatchEligible(make({ availability: "NOT_AVAILABLE" })),
    ).toBe(false);
  });

  it("fails if availability passes but verification fails", () => {
    expect(
      isMatchEligible(make({ membershipStatus: "PENDING", availability: "OPEN" })),
    ).toBe(false);
  });

  it("fails if both fail", () => {
    expect(
      isMatchEligible(
        make({ membershipStatus: "PENDING", availability: "NOT_AVAILABLE" }),
      ),
    ).toBe(false);
  });
});
