// Stage 29 (M7) -- pure application rules. Unit-tested. No I/O. Mirrors
// lib/opportunities/rules.ts's isOpportunityTransitionAllowed pattern, with
// one difference this machine actually needs that M5's doesn't: WHO may
// perform a transition varies by transition (M5's is entirely admin-driven;
// this one has member-only and admin-only transitions both).
//
// State machine (Decision 1, Decision 2, Decision 4, Decision 9), exact:
//
//   APPLIED -> REVIEWED -> SHORTLISTED -> INTERVIEW -> SELECTED
//                                                    -> REJECTED
//   APPLIED | REVIEWED | SHORTLISTED -> WITHDRAWN          (member only)
//   APPLIED | REVIEWED | SHORTLISTED | INTERVIEW -> REJECTED
//                                                        (admin only, via
//                                                         closeRemainingApplications,
//                                                         explicit action only)
//
// Forbidden, explicitly: APPLIED -> SHORTLISTED, APPLIED -> INTERVIEW,
// INTERVIEW -> WITHDRAWN, any transition out of SELECTED/REJECTED/WITHDRAWN
// (all three terminal), any backward transition.
//
// "Connect" (Decision 1) is not a status and has no transition here -- it
// is a query-time visibility rule (see queries.ts), not a state change.

import type { ApplicationActor, ApplicationStatus } from "@/types/application";
import type { OpportunityStatus } from "@/types/opportunity";
import type {
  CredentialsStatus,
  MembershipStatus,
  ProfileStatus,
} from "@/types/member";
import { isDirectoryVisible } from "@/lib/verification/rules";

// ---------------------------------------------------------------------------
// Transition matrix.
// ---------------------------------------------------------------------------

interface Transition {
  to: ApplicationStatus;
  actor: ApplicationActor;
}

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, Transition[]> = {
  APPLIED: [
    { to: "REVIEWED", actor: "ADMIN" },
    { to: "WITHDRAWN", actor: "MEMBER" },
    { to: "REJECTED", actor: "ADMIN" }, // closeRemainingApplications only
  ],
  REVIEWED: [
    { to: "SHORTLISTED", actor: "ADMIN" },
    { to: "WITHDRAWN", actor: "MEMBER" },
    { to: "REJECTED", actor: "ADMIN" }, // closeRemainingApplications only
  ],
  SHORTLISTED: [
    { to: "INTERVIEW", actor: "ADMIN" },
    { to: "WITHDRAWN", actor: "MEMBER" },
    { to: "REJECTED", actor: "ADMIN" }, // closeRemainingApplications only
  ],
  INTERVIEW: [
    { to: "SELECTED", actor: "ADMIN" },
    { to: "REJECTED", actor: "ADMIN" }, // outcome AND closeRemainingApplications
  ],
  SELECTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** True only if `to` is reachable from `from`, AND `actor` is the correct
 *  one for that specific transition. A MEMBER can never perform an
 *  ADMIN-only transition and vice versa -- both dimensions must match. */
export function isApplicationTransitionAllowed(
  from: ApplicationStatus,
  to: ApplicationStatus,
  actor: ApplicationActor,
): boolean {
  return ALLOWED_TRANSITIONS[from].some(
    (t) => t.to === to && t.actor === actor,
  );
}

// ---------------------------------------------------------------------------
// Apply eligibility (Decision 5: availability is NOT an Apply gate).
// ---------------------------------------------------------------------------

export interface ApplicationEligibilityInput {
  opportunityStatus: OpportunityStatus;
  profileStatus: ProfileStatus;
  membershipStatus: MembershipStatus;
  credentialsStatus: CredentialsStatus;
  /** True if a non-WITHDRAWN application already exists for this
   *  (member, opportunity) pair. */
  hasExistingApplication: boolean;
}

export type ApplicationEligibilityReason =
  | "NOT_PUBLISHED"
  | "NOT_VERIFIED"
  | "DUPLICATE";

export interface ApplicationEligibilityResult {
  eligible: boolean;
  reason: ApplicationEligibilityReason | null;
}

/** Decision 5, exact: availability is never checked here. A NOT_AVAILABLE
 *  member remains eligible to apply as long as the other three conditions
 *  hold. This is deliberately a different (looser) gate than M6's
 *  isMatchEligible, which DOES exclude NOT_AVAILABLE -- the two functions
 *  are not the same gate and must not be unified into one. */
export function isApplicationEligible(
  input: ApplicationEligibilityInput,
): ApplicationEligibilityResult {
  if (input.opportunityStatus !== "PUBLISHED") {
    return { eligible: false, reason: "NOT_PUBLISHED" };
  }
  const verified =
    input.profileStatus === "PROFILE_COMPLETE" &&
    isDirectoryVisible(input.membershipStatus, input.credentialsStatus);
  if (!verified) {
    return { eligible: false, reason: "NOT_VERIFIED" };
  }
  if (input.hasExistingApplication) {
    return { eligible: false, reason: "DUPLICATE" };
  }
  return { eligible: true, reason: null };
}

// ---------------------------------------------------------------------------
// Interview scheduling validation (Decision 6).
// ---------------------------------------------------------------------------

export interface InterviewScheduleInput {
  interviewDate: string | null;
  interviewTime: string | null;
  interviewLocation: string | null;
}

/** Decision 6, exact: date, time, AND location are all required together
 *  before SHORTLISTED -> INTERVIEW may proceed. instructions is optional
 *  and not checked here. */
export function isInterviewScheduleComplete(
  input: InterviewScheduleInput,
): boolean {
  return (
    !!input.interviewDate?.trim() &&
    !!input.interviewTime?.trim() &&
    !!input.interviewLocation?.trim()
  );
}

// ---------------------------------------------------------------------------
// closeRemainingApplications eligibility (Decision 9).
// ---------------------------------------------------------------------------

const OPEN_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "REVIEWED",
  "SHORTLISTED",
  "INTERVIEW",
];

/** True only for the four "still open" statuses this action may touch.
 *  SELECTED, REJECTED, and WITHDRAWN must never be affected -- this is the
 *  pure predicate the bulk action filters its candidate rows through
 *  before writing anything. */
export function isEligibleForBulkClose(status: ApplicationStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
