// Stage 23 (M3). Verification domain types.

export type VerificationTrack = "MEMBERSHIP" | "CREDENTIALS";

export type VerificationAction =
  | "APPROVED"
  | "NEEDS_CORRECTION"
  | "RESUBMITTED"
  | "AUTO_REVERIFICATION";

/** An admin's decision on one track. */
export type VerificationDecision = "APPROVED" | "NEEDS_CORRECTION";

export interface VerificationHistoryEntry {
  id: string;
  memberId: string;
  track: VerificationTrack;
  action: VerificationAction;
  note: string | null;
  actorAdminId: string | null;
  actorMemberId: string | null;
  detail: string | null;
  createdAt: string;
}

/** One row of the admin verification queue. */
export interface VerificationQueueRow {
  memberId: string;
  firstName: string;
  lastName: string;
  submittedAt: string; // members.updated_at at submit time, best-effort
  membershipStatus: string;
  credentialsStatus: string;
}

export type VerificationQueueTab =
  | "ALL"
  | "PENDING"
  | "NEEDS_CORRECTION"
  | "APPROVED";

/** The member-facing view of an active correction on one track. */
export interface CorrectionInfo {
  track: VerificationTrack;
  note: string | null;
  requestedAt: string;
}
