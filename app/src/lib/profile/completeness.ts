// Stage 22 checklist -- "Profile completeness rules". The 7 P0 checks that
// gate Registered -> Profile Complete. Pure functions, unit-tested.
//
// Certifications are NOT checked (P1 per Stage 5). The completion PERCENTAGE
// widget is also P1 -- this module reports pass/fail per rule, nothing more.

import type { MemberProfile } from "@/types/member";

export type CompletenessField =
  | "personal"
  | "profession"
  | "experience"
  | "education"
  | "skills"
  | "cv"
  | "availability";

export interface CompletenessResult {
  complete: boolean;
  /** Fields still missing, in step order. Empty when complete. */
  missing: CompletenessField[];
}

/** Human-facing name for an inline "Add your ___ before continuing" message
 *  (Stage 11 states catalog). */
export const MISSING_FIELD_LABEL: Record<CompletenessField, string> = {
  personal: "location",
  profession: "profession",
  experience: "employment status and years of experience",
  education: "education",
  skills: "at least one skill",
  cv: "CV",
  availability: "availability",
};

function hasPersonal(p: MemberProfile): boolean {
  // Stage 22: be conservative -- require location only (the field matching
  // uses); photo/DOB/gender are collected but not individually blocking.
  return !!p.location && p.location.trim().length > 0;
}

function hasProfession(p: MemberProfile): boolean {
  return (
    !!p.primaryProfessionId ||
    (!!p.professionFreetext && p.professionFreetext.trim().length > 0)
  );
}

function hasExperience(p: MemberProfile): boolean {
  // Step-level: employment status + a number for years. Individual job
  // records are 0+ (Journey 1 lists "years, employment status" for the step).
  return (
    p.employmentStatus !== null &&
    p.yearsOfExperience !== null &&
    p.yearsOfExperience >= 0
  );
}

function hasEducation(p: MemberProfile): boolean {
  return p.education.length >= 1;
}

function hasSkills(p: MemberProfile): boolean {
  return p.skills.length >= 1;
}

function hasCv(p: MemberProfile): boolean {
  return p.documents.some((d) => d.type === "CV");
}

function hasAvailability(p: MemberProfile): boolean {
  return p.availability !== "NOT_SET";
}

const CHECKS: Array<[CompletenessField, (p: MemberProfile) => boolean]> = [
  ["personal", hasPersonal],
  ["profession", hasProfession],
  ["experience", hasExperience],
  ["education", hasEducation],
  ["skills", hasSkills],
  ["cv", hasCv],
  ["availability", hasAvailability],
];

export function checkCompleteness(p: MemberProfile): CompletenessResult {
  const missing = CHECKS.filter(([, ok]) => !ok(p)).map(([field]) => field);
  return { complete: missing.length === 0, missing };
}
