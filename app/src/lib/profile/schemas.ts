// Stage 22 checklist -- Zod schemas per onboarding step. Shared client/server
// (react-hook-form resolver + server-action re-validation), same pattern as
// M1's auth schemas.

import { z } from "zod";
import { EDUCATION_LEVELS, EMPLOYMENT_STATUSES } from "@/types/member";

const currentYear = new Date().getFullYear();

/** Normalise a form value that should be a year-or-nothing. NaN (empty number
 *  input via valueAsNumber), "", null, undefined all become null. */
export function coerceYear(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** "" (and whitespace-only) -> null for a flat object's string fields. Used
 *  by step components before .safeParse so an untouched optional input
 *  doesn't fail .url() / length checks. */
export function blankToNull<T extends Record<string, unknown>>(o: T): {
  [K in keyof T]: T[K] extends string ? string | null : T[K];
} {
  const out: Record<string, unknown> = { ...o };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string" && (out[k] as string).trim() === "") {
      out[k] = null;
    }
  }
  return out as {
    [K in keyof T]: T[K] extends string ? string | null : T[K];
  };
}

const optionalYear = z
  .number()
  .int()
  .min(1950, "Enter a year after 1950")
  .max(currentYear + 10, "That year is too far in the future")
  .nullable();

// ---- Step 1: personal ----
// photoUrl/dateOfBirth/gender optional; blankToNull is applied in the step
// before validation so an untouched input doesn't fail .url() etc.
export const personalSchema = z.object({
  photoUrl: z.string().url("Enter a valid URL").nullish(),
  dateOfBirth: z.string().nullish(),
  gender: z.string().max(50).nullish(),
  location: z.string().min(1, "Enter your location"),
});
export type PersonalValues = z.infer<typeof personalSchema>;

// ---- Step 2: profession ----
export const professionSchema = z
  .object({
    primaryProfessionId: z.string().uuid().nullable().optional(),
    professionFreetext: z.string().max(120).nullable().optional(),
    jobTitle: z.string().max(120).nullable().optional(),
    industry: z.string().max(120).nullable().optional(),
  })
  .refine(
    (v) =>
      !!v.primaryProfessionId ||
      (!!v.professionFreetext && v.professionFreetext.trim().length > 0),
    {
      message: "Choose a profession or type your own",
      path: ["professionFreetext"],
    },
  );
export type ProfessionValues = z.infer<typeof professionSchema>;

// ---- Step 3: experience (step-level fields) ----
export const experienceStepSchema = z.object({
  employmentStatus: z.enum(
    EMPLOYMENT_STATUSES as unknown as [string, ...string[]],
    { message: "Choose your employment status" },
  ),
  yearsOfExperience: z
    .number({ message: "Enter your years of experience" })
    .int()
    .min(0, "Can't be negative")
    .max(70, "That seems too high"),
});
export type ExperienceStepValues = z.infer<typeof experienceStepSchema>;

// ---- Experience record (repeatable) ----
export const experienceRecordSchema = z
  .object({
    organization: z.string().min(1, "Enter the organization"),
    position: z.string().min(1, "Enter your position"),
    location: z.string().max(120).nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => v.isCurrent || !!v.endDate || !v.startDate, {
    message: "Add an end date or mark this as current",
    path: ["endDate"],
  });
export type ExperienceRecordValues = z.infer<typeof experienceRecordSchema>;

// ---- Step 4: education record (repeatable, >= 1 required) ----
// The record forms validate with .safeParse directly (not a RHF resolver),
// so the schema can carry proper null-year handling without the resolver's
// input/output type friction.
export const educationRecordSchema = z
  .object({
    institution: z.string().min(1, "Enter the institution"),
    qualification: z.string().min(1, "Enter the qualification"),
    fieldOfStudy: z.string().max(160).nullable().optional(),
    startYear: optionalYear,
    endYear: optionalYear,
    isCurrent: z.boolean(),
  })
  .refine(
    (v) =>
      v.startYear == null || v.endYear == null || v.endYear >= v.startYear,
    { message: "End year can't be before start year", path: ["endYear"] },
  );
export type EducationRecordValues = z.infer<typeof educationRecordSchema>;

// education level (used in per-record edit / matching later; ordered enum)
export const educationLevelSchema = z.enum(
  EDUCATION_LEVELS as unknown as [string, ...string[]],
);

// ---- Step 5: skills ----
export const skillInputSchema = z.object({
  // Either an existing skill id, or a new name to upsert.
  skillId: z.string().uuid().optional(),
  name: z.string().min(1).max(80).optional(),
});
export type SkillInputValues = z.infer<typeof skillInputSchema>;

// ---- Step 7: availability ----
export const availabilitySchema = z.object({
  availability: z.enum(["OPEN", "SELECTIVE", "NOT_AVAILABLE"], {
    message: "Choose an option",
  }),
});
export type AvailabilityValues = z.infer<typeof availabilitySchema>;

// ---- CV upload constraints (Stage 11) ----
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_CV_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const ACCEPTED_CV_EXT = [".pdf", ".doc", ".docx"] as const;
