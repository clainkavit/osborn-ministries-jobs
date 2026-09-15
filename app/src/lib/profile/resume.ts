// Stage 22 checklist -- "Autosave / resume behavior". Given the persisted
// profile, compute the step to open onboarding at: the first of steps 1-7
// whose completeness check is unmet; if all 1-7 are met, step 8 (Review).
// Never step 1 for a member who has already entered data; never restart.
//
// Pure function, unit-tested.

import type { MemberProfile } from "@/types/member";
import { checkCompleteness, type CompletenessField } from "./completeness";
import { REVIEW_STEP } from "./steps";

// Maps a completeness field to the onboarding step number that collects it.
const FIELD_TO_STEP: Record<CompletenessField, number> = {
  personal: 1,
  profession: 2,
  experience: 3,
  education: 4,
  skills: 5,
  cv: 6,
  availability: 7,
};

/** The step number onboarding should open at for this member. */
export function resumeStep(p: MemberProfile): number {
  const { missing } = checkCompleteness(p);
  if (missing.length === 0) return REVIEW_STEP;
  // `missing` is already in step order (completeness CHECKS array order).
  return FIELD_TO_STEP[missing[0]];
}
