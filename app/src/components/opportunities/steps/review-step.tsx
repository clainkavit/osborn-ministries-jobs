"use client";

// Step 4 -- Review. Read-only summary of steps 1-3. Publish is the wizard
// footer's own button (Champion §23 item 4) -- this step has nothing to
// save on "Next" (there is no Next from here).

import { EDUCATION_LEVEL_LABELS } from "@/types/member";
import type { OpportunityStepProps } from "../opportunity-wizard";

const TYPE_LABEL: Record<string, string> = {
  EMPLOYMENT: "Employment",
  CHURCH: "Church Opportunity",
  SERVICE: "Service",
};

export function OpportunityReviewStep({
  opportunity,
  bindNext,
}: OpportunityStepProps) {
  bindNext(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">
          Check everything looks right, then publish.
        </p>
      </div>

      <dl className="space-y-2 text-sm">
        <Row label="Type" value={TYPE_LABEL[opportunity.type] ?? opportunity.type} />
        <Row label="Title" value={opportunity.title || "—"} />
        <Row label="Organization" value={opportunity.organizationName || "—"} />
        <Row label="Location" value={opportunity.location ?? "—"} />
        <Row
          label="Description"
          value={opportunity.description ?? "—"}
        />
        <Row
          label="Profession"
          value={opportunity.requirement?.professionName ?? "Any profession"}
        />
        <Row
          label="Min. experience"
          value={
            opportunity.requirement?.minExperienceYears != null
              ? `${opportunity.requirement.minExperienceYears} years`
              : "—"
          }
        />
        <Row
          label="Education"
          value={
            opportunity.requirement?.requiredEducationLevel
              ? EDUCATION_LEVEL_LABELS[
                  opportunity.requirement.requiredEducationLevel
                ]
              : "—"
          }
        />
        <Row
          label="Skills"
          value={
            opportunity.requiredSkills.length
              ? opportunity.requiredSkills.map((s) => s.name).join(", ")
              : "—"
          }
        />
        <Row
          label="Number needed"
          value={
            opportunity.headcountRequired != null
              ? String(opportunity.headcountRequired)
              : "—"
          }
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
