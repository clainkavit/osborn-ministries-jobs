// Stage 27 (M5) -- pure opportunity rules. Unit-tested. No I/O.
// Mirrors lib/verification/rules.ts's isDecisionActionable pattern exactly.

import type { OpportunityStatus } from "@/types/opportunity";

// ---------------------------------------------------------------------------
// State machine (checklist §6, Champion Decision 3). Exactly this table.
// No other transition exists.
//
//   DRAFT     -> PUBLISHED
//   PUBLISHED -> CLOSED | CANCELLED | FILLED
//   FILLED    -> CLOSED
//   CLOSED    -> COMPLETED
//
// Explicitly forbidden (each must be a real guard, not just an absent UI
// button): PUBLISHED->COMPLETED, FILLED->COMPLETED, CLOSED->PUBLISHED,
// CANCELLED->* (terminal), COMPLETED->* (terminal), PUBLISHED->DRAFT.
//
// "PUBLISHED" is the only stored value for that state -- "Active" is a
// display label computed at render time, never written here.
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS: Record<OpportunityStatus, OpportunityStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["CLOSED", "CANCELLED", "FILLED"],
  CLOSED: ["COMPLETED"],
  CANCELLED: [],
  FILLED: ["CLOSED"],
  COMPLETED: [],
};

export function isOpportunityTransitionAllowed(
  from: OpportunityStatus,
  to: OpportunityStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Publish completeness (checklist §7, Champion §23 items 1 and 2).
//
// Required for Publish:
//   - title non-empty
//   - type is EMPLOYMENT | CHURCH | SERVICE
//   - organization_name non-empty
//   - at least ONE requirement signal: required_profession_id set, OR >=1
//     required skill, OR min_experience_years set, OR
//     required_education_level set. required_profession_id stays nullable --
//     "no specific profession" is valid as long as another signal exists.
//
// NOT required (decided, not merely unbuilt):
//   - location -- PRD's "where applicable" is satisfied by never requiring
//     it, full stop.
//   - a separate approval step -- Publish itself is the approval.
// ---------------------------------------------------------------------------

export type OpportunityCompletenessField =
  | "title"
  | "type"
  | "organizationName"
  | "requirement";

export interface OpportunityCompletenessInput {
  title: string;
  type: string | null;
  organizationName: string;
  requiredProfessionId: string | null;
  minExperienceYears: number | null;
  requiredEducationLevel: string | null;
  requiredSkillCount: number;
}

export interface OpportunityCompletenessResult {
  complete: boolean;
  /** Fields still missing/invalid. Empty when complete. */
  missing: OpportunityCompletenessField[];
}

const VALID_TYPES = new Set(["EMPLOYMENT", "CHURCH", "SERVICE"]);

function hasTitle(o: OpportunityCompletenessInput): boolean {
  return o.title.trim().length > 0;
}

function hasType(o: OpportunityCompletenessInput): boolean {
  return o.type !== null && VALID_TYPES.has(o.type);
}

function hasOrganizationName(o: OpportunityCompletenessInput): boolean {
  return o.organizationName.trim().length > 0;
}

/** At least one requirement signal exists. required_profession_id being
 *  null is NOT itself a failure -- it only fails this check if EVERY other
 *  signal is also empty. */
function hasRequirementSignal(o: OpportunityCompletenessInput): boolean {
  return (
    o.requiredProfessionId !== null ||
    o.requiredSkillCount >= 1 ||
    o.minExperienceYears !== null ||
    o.requiredEducationLevel !== null
  );
}

const CHECKS: Array<
  [OpportunityCompletenessField, (o: OpportunityCompletenessInput) => boolean]
> = [
  ["title", hasTitle],
  ["type", hasType],
  ["organizationName", hasOrganizationName],
  ["requirement", hasRequirementSignal],
];

export function checkOpportunityCompleteness(
  o: OpportunityCompletenessInput,
): OpportunityCompletenessResult {
  const missing = CHECKS.filter(([, ok]) => !ok(o)).map(([field]) => field);
  return { complete: missing.length === 0, missing };
}

/** Human-facing label per missing field, for the inline
 *  "Add your ___ before continuing" error (submitForVerification's style).
 *  "requirement" names the group of options, not one single field, since
 *  any one of the four signals satisfies it. */
export const OPPORTUNITY_MISSING_FIELD_LABEL: Record<
  OpportunityCompletenessField,
  string
> = {
  title: "title",
  type: "opportunity type",
  organizationName: "organization",
  requirement:
    "at least one requirement (profession, a skill, minimum experience, or an education level)",
};
