// Stage 27 (M5), Champion §23 item 4 -- the 5 conceptual Create Opportunity
// steps: Type, Details, Requirements, Review, Publish. Publish is the
// action taken ON the Review screen (step 4), not a separate 5th screen --
// mirrors M2's own step 8 Review + "Submit for verification" button on the
// same screen. So the wizard itself renders 4 screens; "Publish" is the
// footer button's label on the 4th.

export const OPPORTUNITY_STEPS = [
  { n: 1, key: "type", label: "Type" },
  { n: 2, key: "details", label: "Details" },
  { n: 3, key: "requirements", label: "Requirements" },
  { n: 4, key: "review", label: "Review" },
] as const;

export type OpportunityStepKey = (typeof OPPORTUNITY_STEPS)[number]["key"];

export const FIRST_STEP = 1;
export const REVIEW_STEP = 4;
