// Stage 28 (M6) -- pure matching eligibility gate. Unit-tested. No I/O.
//
// Two independent conditions, both must pass before a candidate is even
// scored (Stage 28 checklist §2, §10 Decision 4: no score-based exclusion
// exists -- this gate is the ONLY exclusion mechanism in M6).
//
//   1. Verification gate -- the EXACT M4 definition of "verified
//      professional", already used by getDirectoryProfessionalCount() and
//      isDirectoryVisible(). No new definition of "verified" for M6.
//   2. Availability gate -- excludes NOT_AVAILABLE (and NOT_SET, which is
//      never a completed member's resting state). OPEN/SELECTIVE both pass
//      the gate; the distinction between them is a SCORE, not a gate
//      (see scoring.ts's availabilityMatch).

import { isDirectoryVisible } from "@/lib/verification/rules";
import type {
  Availability,
  CredentialsStatus,
  MembershipStatus,
  ProfileStatus,
} from "@/types/member";

export interface EligibilityInput {
  profileStatus: ProfileStatus;
  membershipStatus: MembershipStatus;
  credentialsStatus: CredentialsStatus;
  availability: Availability;
}

/** True only if the candidate passes BOTH the verification gate and the
 *  availability gate. This is the sole exclusion mechanism for M6 matching
 *  (Stage 28 §10 Decision 4) -- nothing else removes a candidate from the
 *  pool, and nothing here is a score. */
export function isMatchEligible(input: EligibilityInput): boolean {
  return (
    input.profileStatus === "PROFILE_COMPLETE" &&
    isDirectoryVisible(input.membershipStatus, input.credentialsStatus) &&
    input.availability !== "NOT_AVAILABLE" &&
    input.availability !== "NOT_SET"
  );
}
