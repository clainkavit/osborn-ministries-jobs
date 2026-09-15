// Stage 29 (M7). Application domain types.

export type ApplicationStatus =
  | "APPLIED"
  | "REVIEWED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

export type ApplicationActor = "MEMBER" | "ADMIN";

export type ApplicationOutcomeValue =
  | "HIRED"
  | "CONTRACT_AWARDED"
  | "PROJECT_COMPLETED"
  | "SERVICE_DELIVERED"
  | "CONNECTED"
  | "NOT_SELECTED"
  | "CANCELLED"
  | "NO_OUTCOME";

export interface InterviewDetails {
  interviewDate: string | null;
  interviewTime: string | null;
  interviewLocation: string | null;
  interviewInstructions: string | null;
}

export interface ApplicationSummary {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  status: ApplicationStatus;
  appliedAt: string;
  statusUpdatedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary, InterviewDetails {
  memberId: string;
}

export interface ApplicationOutcomeRecord {
  id: string;
  applicationId: string;
  outcome: ApplicationOutcomeValue;
  recordedBy: string;
  recordedAt: string;
  notes: string | null;
}
