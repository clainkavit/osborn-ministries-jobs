// Stage 27 (M5). Opportunity domain types.

import type { EducationLevel } from "@/types/member";

export type OpportunityType = "EMPLOYMENT" | "CHURCH" | "SERVICE";

export type OpportunityStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "CANCELLED"
  | "FILLED"
  | "COMPLETED";

export interface OpportunityRequirementInput {
  requiredProfessionId: string | null;
  minExperienceYears: number | null;
  requiredEducationLevel: EducationLevel | null;
  /** Skill ids, resolved from the taxonomy the same way member skills are. */
  skillIds: string[];
}

/** One opportunity's full detail -- shared shape for both the admin and
 *  member detail screens (the member screen just omits fields it doesn't
 *  show, e.g. created_by). */
export interface OpportunityDetail {
  id: string;
  title: string;
  type: OpportunityType;
  organizationName: string;
  location: string | null;
  description: string | null;
  status: OpportunityStatus;
  headcountRequired: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
  requirement: {
    id: string;
    requiredProfessionId: string | null;
    professionName: string | null;
    minExperienceYears: number | null;
    requiredEducationLevel: EducationLevel | null;
  } | null;
  requiredSkills: { id: string; name: string }[];
}

/** One row of the admin Opportunities list. */
export interface OpportunityListRow {
  id: string;
  title: string;
  type: OpportunityType;
  organizationName: string;
  status: OpportunityStatus;
  createdAt: string;
}

/** One row of the member-facing browse screen. */
export interface PublishedOpportunityRow {
  id: string;
  title: string;
  type: OpportunityType;
  organizationName: string;
  location: string | null;
  publishedAt: string | null;
}
