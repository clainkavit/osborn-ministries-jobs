// Stage 23 (M3) -- pure verification rules. Unit-tested. No I/O.

import type { CredentialsStatus, MembershipStatus } from "@/types/member";
import type { VerificationQueueRow, VerificationQueueTab } from "@/types/verification";

// ---------------------------------------------------------------------------
// Directory-visibility gate (ACCEPTED PRODUCT RULE, Req 1 / Contradiction C)
//
//   visible  <=>  membership = CONFIRMED
//                 AND credentials IN (REVIEWED, REVIEW_PENDING)
//
// PENDING and NEEDS_CORRECTION credentials are NOT visible. REVIEW_PENDING IS
// visible -- it's the lighter-weight reverification after an Experience edit,
// per stage-7's reverification decision, and this rule is now explicitly
// accepted (see stage-23 "Deviations" + migration 003 header).
// ---------------------------------------------------------------------------
export function isDirectoryVisible(
  membership: MembershipStatus,
  credentials: CredentialsStatus,
): boolean {
  return (
    membership === "CONFIRMED" &&
    (credentials === "REVIEWED" || credentials === "REVIEW_PENDING")
  );
}

// ---------------------------------------------------------------------------
// Stage 25 (M4), Decision 5 -- does a directory-visible member have anything
// an admin could act on right now, i.e. should the Admin Professional
// Profile show a "Review verification" link into Verification Review?
//
// A directory-visible member is, by isDirectoryVisible's own definition,
// always membership = CONFIRMED. So the only way such a member can also
// need attention (same "needs attention" condition the Verification Queue's
// Pending tab already uses, see needsAttention below) is
// credentials = REVIEW_PENDING -- the lighter reverification state that
// keeps a member in the directory while still flagging them for another
// look. A directory-visible member can never be NEEDS_CORRECTION on either
// track (the gate excludes that member entirely), so this reduces to one
// condition, not a re-implementation of the queue's fuller rule.
// ---------------------------------------------------------------------------
export function hasActionableReverification(
  credentials: CredentialsStatus,
): boolean {
  return credentials === "REVIEW_PENDING";
}

// ---------------------------------------------------------------------------
// Reverification-on-edit (Stage 7's 2026-09-10 DECIDED rule)
//
// Given the field a PROFILE_COMPLETE member just edited, what happens to the
// CREDENTIALS track? Membership is NEVER affected by a profile edit.
//
//   profession, education        -> full reset to PENDING (leaves directory)
//   experience (any write)       -> REVIEW_PENDING (stays in directory)
//   everything else              -> no change
//
// Precedence: if the credentials track is already NEEDS_CORRECTION, a
// qualifying edit does NOT auto-reset -- the member is expected to resubmit
// via the correction flow, which moves it to PENDING there. If it's already
// PENDING or REVIEW_PENDING, no further transition (already in/near the
// queue), but the caller still logs the edit.
// ---------------------------------------------------------------------------

export type EditedField =
  | "profession"
  | "education"
  | "experience"
  | "skills"
  | "personal" // photo, DOB, gender, location, job title, industry
  | "availability";

export type ReverificationOutcome =
  | { credentialsTo: "PENDING"; reason: string }
  | { credentialsTo: "REVIEW_PENDING"; reason: string }
  | { credentialsTo: null; reason: null };

const NO_EFFECT: ReverificationOutcome = { credentialsTo: null, reason: null };

export function reverificationEffect(
  field: EditedField,
  currentCredentials: CredentialsStatus,
): ReverificationOutcome {
  // Only a member who has been through review can be "reverified". Before
  // that (NOT_SUBMITTED / during onboarding) there is nothing to reset.
  if (
    currentCredentials === "NOT_SUBMITTED" ||
    currentCredentials === "NEEDS_CORRECTION"
  ) {
    return NO_EFFECT;
  }

  switch (field) {
    case "profession":
      return {
        credentialsTo: "PENDING",
        reason: "Profession changed",
      };
    case "education":
      // Any education write triggers a full reset. Stage 7 left "pure typo
      // fix" as an implementation judgment call; M3's conservative choice is
      // to treat every education write as substantive (documented as an
      // implementation choice in stage-23, not a spec change).
      return {
        credentialsTo: "PENDING",
        reason: "Education changed",
      };
    case "experience":
      // Already PENDING or REVIEW_PENDING: no further transition, caller
      // still logs the edit.
      if (currentCredentials === "REVIEWED") {
        return {
          credentialsTo: "REVIEW_PENDING",
          reason: "Experience updated",
        };
      }
      return NO_EFFECT;
    case "skills":
    case "personal":
    case "availability":
      return NO_EFFECT;
  }
}

// ---------------------------------------------------------------------------
// Verification queue tab filter
// ---------------------------------------------------------------------------

/** A member needs an admin's attention on at least one track. */
function needsAttention(row: VerificationQueueRow): boolean {
  return (
    row.membershipStatus === "PENDING" ||
    row.credentialsStatus === "PENDING" ||
    row.credentialsStatus === "REVIEW_PENDING"
  );
}

function hasNeedsCorrection(row: VerificationQueueRow): boolean {
  return (
    row.membershipStatus === "NEEDS_CORRECTION" ||
    row.credentialsStatus === "NEEDS_CORRECTION"
  );
}

function bothApproved(row: VerificationQueueRow): boolean {
  return (
    row.membershipStatus === "CONFIRMED" &&
    (row.credentialsStatus === "REVIEWED" ||
      row.credentialsStatus === "REVIEW_PENDING")
  );
}

export function filterQueue(
  rows: VerificationQueueRow[],
  tab: VerificationQueueTab,
): VerificationQueueRow[] {
  switch (tab) {
    case "ALL":
      return rows;
    case "PENDING":
      return rows.filter(needsAttention);
    case "NEEDS_CORRECTION":
      return rows.filter(hasNeedsCorrection);
    case "APPROVED":
      return rows.filter(bothApproved);
  }
}

/** Counts for the queue tab badges. */
export function queueCounts(rows: VerificationQueueRow[]) {
  return {
    ALL: rows.length,
    PENDING: rows.filter(needsAttention).length,
    NEEDS_CORRECTION: rows.filter(hasNeedsCorrection).length,
    APPROVED: rows.filter(bothApproved).length,
  };
}

// ---------------------------------------------------------------------------
// Which member-editable fields belong to which track (Req 2 / Contradiction A)
// A correction is issued per track; the member may edit any field that track
// covers -- not one field, not the whole profile.
// ---------------------------------------------------------------------------
export const CREDENTIALS_FIELDS: EditedField[] = [
  "profession",
  "education",
  "experience",
  "skills",
];
export const MEMBERSHIP_FIELDS: EditedField[] = ["personal"];

// ---------------------------------------------------------------------------
// Which source statuses an admin decision is valid from (used by
// lib/verification/actions.ts's verifyTrack guard).
//
// APPROVED only makes sense from the queue states (PENDING/REVIEW_PENDING).
// NEEDS_CORRECTION must ALSO be reachable from a terminal-approved state
// (CONFIRMED/REVIEWED) -- Stage 23 checklist test 5 and the review panel's
// own "You can still send this back for a correction" copy both require an
// admin to be able to flag an already-approved track. Neither decision is
// valid from NEEDS_CORRECTION itself (already there; resubmitForReview owns
// that transition, not an admin decision).
//
// (Bug fixed 2026-09-11: verifyTrack originally used one PENDING/
// REVIEW_PENDING-only set for both decisions, so the server silently
// rejected every "send an approved track back for correction" even though
// the UI showed and allowed the button. Caught by the M3 acceptance suite's
// test 5.)
export function isDecisionActionable(
  decision: "APPROVED" | "NEEDS_CORRECTION",
  current: string,
): boolean {
  if (decision === "APPROVED") {
    return current === "PENDING" || current === "REVIEW_PENDING";
  }
  return (
    current === "PENDING" ||
    current === "REVIEW_PENDING" ||
    current === "CONFIRMED" ||
    current === "REVIEWED"
  );
}
