// Stage 21 section 28 (M1) + Stage 22 checklist (M2). The three-field
// verification model stays as three INDEPENDENT unions -- see
// stage-7-state-machines.md. A member can be membership_status = "CONFIRMED"
// while credentials_status = "PENDING" at the same time; never merge them.

import type { UserRole } from "./roles";

export type ProfileStatus = "REGISTERED" | "PROFILE_COMPLETE";

export type MembershipStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "CONFIRMED"
  | "NEEDS_CORRECTION"
  | "SUSPENDED";

export type CredentialsStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "REVIEWED"
  | "NEEDS_CORRECTION"
  | "REVIEW_PENDING"; // set when a Reviewed member edits Experience (M3+);
  // in the enum now so a later milestone needs no breaking ALTER.

// M2: onboarding step 7 forces an explicit choice, so NOT_SET must be
// representable until the member picks one (Stage 22 checklist). Once chosen,
// it is one of the three real values from Journey 1 step 7.
export type Availability = "NOT_SET" | "OPEN" | "SELECTIVE" | "NOT_AVAILABLE";

// Stage 10 taxonomy -- ordered list, PRD section 11.
export type EmploymentStatus =
  | "EMPLOYED"
  | "SELF_EMPLOYED"
  | "BUSINESS_OWNER"
  | "FREELANCER"
  | "STUDENT"
  | "UNEMPLOYED"
  | "RETIRED"
  | "OTHER";

export const EMPLOYMENT_STATUSES: readonly EmploymentStatus[] = [
  "EMPLOYED",
  "SELF_EMPLOYED",
  "BUSINESS_OWNER",
  "FREELANCER",
  "STUDENT",
  "UNEMPLOYED",
  "RETIRED",
  "OTHER",
] as const;

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  EMPLOYED: "Employed",
  SELF_EMPLOYED: "Self-employed",
  BUSINESS_OWNER: "Business owner",
  FREELANCER: "Freelancer",
  STUDENT: "Student",
  UNEMPLOYED: "Unemployed",
  RETIRED: "Retired",
  OTHER: "Other",
};

// Stage 10 -- ordered scale (matters for stage-9 education_match). Kept in
// this order, not alphabetical.
export type EducationLevel =
  | "NONE"
  | "SECONDARY_CERTIFICATE"
  | "DIPLOMA"
  | "BACHELORS"
  | "MASTERS"
  | "DOCTORATE";

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  "NONE",
  "SECONDARY_CERTIFICATE",
  "DIPLOMA",
  "BACHELORS",
  "MASTERS",
  "DOCTORATE",
] as const;

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  NONE: "No formal education stated",
  SECONDARY_CERTIFICATE: "Secondary / Certificate",
  DIPLOMA: "Diploma",
  BACHELORS: "Bachelor's",
  MASTERS: "Master's",
  DOCTORATE: "Doctorate",
};

// ---------------------------------------------------------------------------
// Sub-collections (migration 002)
// ---------------------------------------------------------------------------

export interface Education {
  id: string;
  memberId: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  isCurrent: boolean;
}

export interface Experience {
  id: string;
  memberId: string;
  organization: string;
  position: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface Profession {
  id: string;
  name: string;
  category: string;
  synonyms: string[];
}

export interface SkillTag {
  id: string;
  name: string;
}

export type DocumentType = "CV" | "CERTIFICATE" | "OTHER";

export interface MemberDocument {
  id: string;
  memberId: string;
  type: DocumentType;
  filename: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

// ---------------------------------------------------------------------------
// Member (migration 001 + 002)
// ---------------------------------------------------------------------------

/** The public.members row. */
export interface Member {
  id: string;
  authUserId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  profileStatus: ProfileStatus;
  membershipStatus: MembershipStatus;
  credentialsStatus: CredentialsStatus;
  // migration 002
  photoUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  location: string | null;
  primaryProfessionId: string | null;
  professionFreetext: string | null;
  jobTitle: string | null;
  industry: string | null;
  employmentStatus: EmploymentStatus | null;
  yearsOfExperience: number | null;
  availability: Availability;
  createdAt: string;
  updatedAt: string;
}

/** Member plus their sub-collections, as returned by GET /members/me in M2. */
export interface MemberProfile extends Member {
  profession: Profession | null;
  education: Education[];
  experience: Experience[];
  skills: SkillTag[];
  documents: MemberDocument[];
}
