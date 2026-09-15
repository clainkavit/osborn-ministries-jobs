import { describe, it, expect } from "vitest";
import {
  isDirectoryVisible,
  isDecisionActionable,
  hasActionableReverification,
  reverificationEffect,
  filterQueue,
  queueCounts,
  type EditedField,
} from "@/lib/verification/rules";
import type {
  CredentialsStatus,
  MembershipStatus,
} from "@/types/member";
import type { VerificationQueueRow } from "@/types/verification";

// Stage 23 (M3) checklist "Unit tests" section:
//  - reverificationEffect(field) table
//  - directory-gate predicate for every (membership, credentials) combination
//  - verification-queue tab filter

const MEMBERSHIP: MembershipStatus[] = [
  "NOT_SUBMITTED",
  "PENDING",
  "CONFIRMED",
  "NEEDS_CORRECTION",
  "SUSPENDED",
];
const CREDENTIALS: CredentialsStatus[] = [
  "NOT_SUBMITTED",
  "PENDING",
  "REVIEWED",
  "NEEDS_CORRECTION",
  "REVIEW_PENDING",
];

describe("isDirectoryVisible -- the accepted gate (Req 1 / Contradiction C)", () => {
  it("is true ONLY for membership=CONFIRMED AND credentials in {REVIEWED, REVIEW_PENDING}", () => {
    const visible: Array<[MembershipStatus, CredentialsStatus]> = [];
    for (const m of MEMBERSHIP) {
      for (const c of CREDENTIALS) {
        if (isDirectoryVisible(m, c)) visible.push([m, c]);
      }
    }
    expect(visible.sort()).toEqual(
      [
        ["CONFIRMED", "REVIEWED"],
        ["CONFIRMED", "REVIEW_PENDING"],
      ].sort(),
    );
  });

  it("REVIEW_PENDING stays visible (Contradiction C resolution)", () => {
    expect(isDirectoryVisible("CONFIRMED", "REVIEW_PENDING")).toBe(true);
  });

  it("credentials PENDING is NOT visible even with membership CONFIRMED (boolean AND)", () => {
    expect(isDirectoryVisible("CONFIRMED", "PENDING")).toBe(false);
  });

  it("credentials NEEDS_CORRECTION is NOT visible", () => {
    expect(isDirectoryVisible("CONFIRMED", "NEEDS_CORRECTION")).toBe(false);
  });

  it("membership not CONFIRMED is never visible, whatever credentials say", () => {
    for (const m of MEMBERSHIP.filter((x) => x !== "CONFIRMED")) {
      for (const c of CREDENTIALS) {
        expect(isDirectoryVisible(m, c)).toBe(false);
      }
    }
  });
});

describe("reverificationEffect(field, currentCredentials) -- Stage 7 reverification-on-edit", () => {
  const ALL_FIELDS: EditedField[] = [
    "profession",
    "education",
    "experience",
    "skills",
    "personal",
    "availability",
  ];

  it("no effect when credentials are NOT_SUBMITTED (nothing to reverify)", () => {
    for (const f of ALL_FIELDS) {
      expect(reverificationEffect(f, "NOT_SUBMITTED").credentialsTo).toBeNull();
    }
  });

  it("no effect when credentials are NEEDS_CORRECTION (correction flow owns the transition)", () => {
    for (const f of ALL_FIELDS) {
      expect(
        reverificationEffect(f, "NEEDS_CORRECTION").credentialsTo,
      ).toBeNull();
    }
  });

  it("profession edit -> full reset to PENDING (from REVIEWED)", () => {
    expect(reverificationEffect("profession", "REVIEWED").credentialsTo).toBe(
      "PENDING",
    );
  });

  it("education edit -> full reset to PENDING (from REVIEWED)", () => {
    expect(reverificationEffect("education", "REVIEWED").credentialsTo).toBe(
      "PENDING",
    );
  });

  it("experience edit -> REVIEW_PENDING (from REVIEWED)", () => {
    expect(reverificationEffect("experience", "REVIEWED").credentialsTo).toBe(
      "REVIEW_PENDING",
    );
  });

  it("experience edit while already PENDING -> no further transition", () => {
    expect(
      reverificationEffect("experience", "PENDING").credentialsTo,
    ).toBeNull();
  });

  it("experience edit while already REVIEW_PENDING -> no further transition", () => {
    expect(
      reverificationEffect("experience", "REVIEW_PENDING").credentialsTo,
    ).toBeNull();
  });

  it("skills / personal / availability edits -> never touch credentials", () => {
    for (const c of CREDENTIALS) {
      expect(reverificationEffect("skills", c).credentialsTo).toBeNull();
      expect(reverificationEffect("personal", c).credentialsTo).toBeNull();
      expect(reverificationEffect("availability", c).credentialsTo).toBeNull();
    }
  });

  it("profession edit while already PENDING -> stays PENDING (guarded update is a no-op)", () => {
    // rules.ts only short-circuits NOT_SUBMITTED / NEEDS_CORRECTION. From
    // PENDING a profession edit returns "PENDING" again; applyReverification's
    // guarded `.eq(from)` update then does nothing real. Documented as a
    // harmless same-value transition, not a spec deviation.
    expect(reverificationEffect("profession", "PENDING").credentialsTo).toBe(
      "PENDING",
    );
  });
});

describe("filterQueue / queueCounts -- verification queue tabs", () => {
  const rows: VerificationQueueRow[] = [
    row("a", "PENDING", "PENDING"), // needs attention
    row("b", "CONFIRMED", "PENDING"), // needs attention (credentials)
    row("c", "CONFIRMED", "REVIEW_PENDING"), // needs attention + approved-ish
    row("d", "CONFIRMED", "REVIEWED"), // approved
    row("e", "NEEDS_CORRECTION", "REVIEWED"), // needs correction
    row("f", "CONFIRMED", "NEEDS_CORRECTION"), // needs correction
    row("g", "CONFIRMED", "REVIEWED"), // approved
  ];

  function row(
    id: string,
    membership: MembershipStatus,
    credentials: CredentialsStatus,
  ): VerificationQueueRow {
    return {
      memberId: id,
      firstName: id.toUpperCase(),
      lastName: "X",
      submittedAt: "2026-09-10T00:00:00Z",
      membershipStatus: membership,
      credentialsStatus: credentials,
    };
  }

  it("ALL returns every row", () => {
    expect(filterQueue(rows, "ALL").map((r) => r.memberId)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
    ]);
  });

  it("PENDING = at least one track needs the admin (incl. REVIEW_PENDING)", () => {
    expect(filterQueue(rows, "PENDING").map((r) => r.memberId).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("NEEDS_CORRECTION = at least one track flagged", () => {
    expect(
      filterQueue(rows, "NEEDS_CORRECTION")
        .map((r) => r.memberId)
        .sort(),
    ).toEqual(["e", "f"]);
  });

  it("APPROVED = both tracks terminal-approved (REVIEW_PENDING counts)", () => {
    expect(
      filterQueue(rows, "APPROVED")
        .map((r) => r.memberId)
        .sort(),
    ).toEqual(["c", "d", "g"]);
  });

  it("queueCounts matches the filters", () => {
    expect(queueCounts(rows)).toEqual({
      ALL: 7,
      PENDING: 3,
      NEEDS_CORRECTION: 2,
      APPROVED: 3,
    });
  });
});

// Regression test: verifyTrack's server guard originally allowed BOTH
// decisions only from PENDING/REVIEW_PENDING, silently rejecting an admin
// sending an already-approved track back for correction (the UI's own
// "Request correction" button is shown and enabled for a REVIEWED/CONFIRMED
// track -- "You can still send this back for a correction"). Caught by the
// M3 acceptance suite's test 5.
describe("isDecisionActionable -- which source statuses each admin decision is valid from", () => {
  const ALL_STATUSES = [
    "NOT_SUBMITTED",
    "PENDING",
    "REVIEW_PENDING",
    "CONFIRMED",
    "REVIEWED",
    "NEEDS_CORRECTION",
    "SUSPENDED",
  ];

  it("APPROVED is only actionable from PENDING and REVIEW_PENDING", () => {
    const actionable = ALL_STATUSES.filter((s) =>
      isDecisionActionable("APPROVED", s),
    );
    expect(actionable.sort()).toEqual(["PENDING", "REVIEW_PENDING"].sort());
  });

  it("NEEDS_CORRECTION is actionable from PENDING, REVIEW_PENDING, CONFIRMED, and REVIEWED", () => {
    const actionable = ALL_STATUSES.filter((s) =>
      isDecisionActionable("NEEDS_CORRECTION", s),
    );
    expect(actionable.sort()).toEqual(
      ["PENDING", "REVIEW_PENDING", "CONFIRMED", "REVIEWED"].sort(),
    );
  });

  it("neither decision is actionable from NEEDS_CORRECTION itself", () => {
    expect(isDecisionActionable("APPROVED", "NEEDS_CORRECTION")).toBe(false);
    expect(isDecisionActionable("NEEDS_CORRECTION", "NEEDS_CORRECTION")).toBe(
      false,
    );
  });

  it("an already-approved track (REVIEWED/CONFIRMED) CAN be sent back for correction", () => {
    // This is the exact case that was broken: the review panel shows
    // "Request correction" for a done track, and the server must accept it.
    expect(isDecisionActionable("NEEDS_CORRECTION", "REVIEWED")).toBe(true);
    expect(isDecisionActionable("NEEDS_CORRECTION", "CONFIRMED")).toBe(true);
  });
});

// Stage 25 (M4), Decision 5: the Admin Professional Profile shows a "Review
// verification" link ONLY when the (directory-visible) member has something
// actionable. A directory-visible member is always membership=CONFIRMED, so
// this reduces to one condition on the credentials track.
describe("hasActionableReverification -- Stage 25 Decision 5's conditional Review-verification link", () => {
  const CREDENTIALS_STATUSES: CredentialsStatus[] = [
    "NOT_SUBMITTED",
    "PENDING",
    "REVIEWED",
    "NEEDS_CORRECTION",
    "REVIEW_PENDING",
  ];

  it("is true ONLY for REVIEW_PENDING", () => {
    const actionable = CREDENTIALS_STATUSES.filter((c) =>
      hasActionableReverification(c),
    );
    expect(actionable).toEqual(["REVIEW_PENDING"]);
  });

  it("is false for REVIEWED (nothing to review, matches VerificationBadges' 'done' state)", () => {
    expect(hasActionableReverification("REVIEWED")).toBe(false);
  });

  it("is false for PENDING and NEEDS_CORRECTION (neither is reachable for a directory-visible member, but the predicate itself must not mistake them for actionable)", () => {
    expect(hasActionableReverification("PENDING")).toBe(false);
    expect(hasActionableReverification("NEEDS_CORRECTION")).toBe(false);
  });
});
