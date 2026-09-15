// Stage 22 checklist -- the 8 onboarding steps, in Journey 1 order
// (Experience is step 3, Education step 4). Single source of truth for step
// identity, labels, and ordering; both the stepper UI and the resume-step
// calculator read this.

export const ONBOARDING_STEPS = [
  { n: 1, key: "personal", label: "About you" },
  { n: 2, key: "profession", label: "What do you do?" },
  { n: 3, key: "experience", label: "Your experience" },
  { n: 4, key: "education", label: "Education" },
  { n: 5, key: "skills", label: "Skills" },
  { n: 6, key: "cv", label: "Your CV" },
  { n: 7, key: "availability", label: "Availability" },
  { n: 8, key: "review", label: "Review" },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

export const FIRST_STEP = 1;
export const REVIEW_STEP = 8;
export const LAST_INPUT_STEP = 7;

export function stepByNumber(n: number) {
  return ONBOARDING_STEPS.find((s) => s.n === n) ?? null;
}
