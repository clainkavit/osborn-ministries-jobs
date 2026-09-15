"use client";

// Step 8 -- Review. Read-only summary of steps 1-7, plus the pass/fail
// checklist of the 7 completeness rules (NOT a percentage -- that widget is
// P1). "Submit for verification" is on the wizard's footer; the server
// re-checks completeness and returns an inline "Add your ___" error if
// something's missing (Stage 13 scenario).

import {
  checkCompleteness,
  MISSING_FIELD_LABEL,
  type CompletenessField,
} from "@/lib/profile/completeness";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/member";
import type { WizardStepProps } from "../onboarding-wizard";

const ROW_LABELS: Record<CompletenessField, string> = {
  personal: "Personal information",
  profession: "Profession",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  cv: "CV",
  availability: "Availability",
};

export function ReviewStep({
  profile,
  bindNext,
  editMode = false,
}: WizardStepProps & { editMode?: boolean }) {
  bindNext(null);
  const { missing } = checkCompleteness(profile);
  const missingSet = new Set(missing);

  const professionName =
    profile.profession?.name ?? profile.professionFreetext ?? "—";
  const cv = profile.documents.find((d) => d.type === "CV");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">
          {editMode
            ? "Check everything looks right, then save."
            : "Check everything looks right, then submit for verification."}
        </p>
      </div>

      <dl className="space-y-2 text-sm">
        <Row label="Location" value={profile.location ?? "—"} />
        <Row label="Profession" value={professionName} />
        <Row
          label="Employment"
          value={
            profile.employmentStatus
              ? `${EMPLOYMENT_STATUS_LABELS[profile.employmentStatus]}, ${profile.yearsOfExperience ?? "—"} yrs`
              : "—"
          }
        />
        <Row
          label="Education"
          value={
            profile.education.length
              ? profile.education
                  .map((e) => `${e.qualification} (${e.institution})`)
                  .join("; ")
              : "—"
          }
        />
        <Row
          label="Skills"
          value={
            profile.skills.length
              ? profile.skills.map((s) => s.name).join(", ")
              : "—"
          }
        />
        <Row label="CV" value={cv ? cv.filename : "—"} />
        <Row
          label="Availability"
          value={
            profile.availability === "NOT_SET"
              ? "—"
              : profile.availability
                  .toLowerCase()
                  .replace("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
          }
        />
      </dl>

      <div className="rounded-md border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Completeness
        </p>
        <ul className="space-y-1 text-sm">
          {(Object.keys(ROW_LABELS) as CompletenessField[]).map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span
                className={
                  missingSet.has(f) ? "text-destructive" : "text-green-600"
                }
              >
                {missingSet.has(f) ? "○" : "✓"}
              </span>
              <span>{ROW_LABELS[f]}</span>
              {missingSet.has(f) ? (
                <span className="text-xs text-muted-foreground">
                  — add your {MISSING_FIELD_LABEL[f]}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
