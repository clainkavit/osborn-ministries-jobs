// Stage 27 (M5) -- Zod schemas per Create Opportunity wizard step. Same
// pattern as lib/profile/schemas.ts: shared client/server, re-validated
// server-side on every save regardless of client-side checks.

import { z } from "zod";
import { EDUCATION_LEVELS } from "@/types/member";

// ---- Step 1: Type ----
export const opportunityTypeSchema = z.object({
  type: z.enum(["EMPLOYMENT", "CHURCH", "SERVICE"], {
    message: "Choose an opportunity type",
  }),
});
export type OpportunityTypeValues = z.infer<typeof opportunityTypeSchema>;

// ---- Step 2: Details ----
// title/organizationName are NOT required here -- same "per-step save vs.
// publish gate" split as Requirements below. checkOpportunityCompleteness()
// enforces non-empty title/organization at Publish time (checklist §7); a
// Draft must be saveable with either left blank so it can be revisited.
export const opportunityDetailsSchema = z.object({
  title: z.string().max(200),
  organizationName: z.string().max(200),
  location: z.string().max(160).nullish(),
  description: z.string().max(5000).nullish(),
});
export type OpportunityDetailsValues = z.infer<typeof opportunityDetailsSchema>;

// ---- Step 3: Requirements ----
// No .refine() requiring at least one signal here -- that's the PUBLISH
// gate (checkOpportunityCompleteness), not a per-step save gate. A Draft
// can be saved with zero requirements set; it just can't be Published that
// way (Champion §23 item 2).
export const opportunityRequirementsSchema = z.object({
  requiredProfessionId: z.string().uuid().nullable().optional(),
  minExperienceYears: z.number().int().min(0).nullable().optional(),
  requiredEducationLevel: z
    .enum(EDUCATION_LEVELS as unknown as [string, ...string[]])
    .nullable()
    .optional(),
  headcountRequired: z.number().int().min(1).nullable().optional(),
  skillIds: z.array(z.string().uuid()).default([]),
});
export type OpportunityRequirementsValues = z.infer<
  typeof opportunityRequirementsSchema
>;
