"use client";

// Step 1 -- Type. Employment / Church Opportunity / Service only --
// Project and Business are P2, never offered as options (checklist §3).

import { useState } from "react";
import { saveOpportunityType } from "@/lib/opportunities/actions";
import { Label } from "@/components/ui/label";
import type { OpportunityStepProps } from "../opportunity-wizard";
import type { OpportunityType } from "@/types/opportunity";

const OPTIONS: { value: OpportunityType; label: string; hint: string }[] = [
  {
    value: "EMPLOYMENT",
    label: "Employment",
    hint: "A company or organization needs employees.",
  },
  {
    value: "CHURCH",
    label: "Church Opportunity",
    hint: "A church department needs a professional.",
  },
  {
    value: "SERVICE",
    label: "Service",
    hint: "Someone needs a professional service.",
  },
];

export function TypeStep({ opportunity, bindNext }: OpportunityStepProps) {
  const [type, setType] = useState<OpportunityType>(opportunity.type);
  const [error, setError] = useState<string | null>(null);

  bindNext(async () => {
    setError(null);
    const res = await saveOpportunityType(opportunity.id, { type });
    if (!res.success) {
      setError(res.error);
      return { success: false, error: res.error };
    }
    return { success: true };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Opportunity type</h2>
        <p className="text-sm text-muted-foreground">
          What kind of opportunity is this?
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary"
          >
            <input
              type="radio"
              name="type"
              value={o.value}
              checked={type === o.value}
              onChange={() => setType(o.value)}
              className="mt-1"
            />
            <span>
              <Label className="cursor-pointer">{o.label}</Label>
              <p className="text-xs text-muted-foreground">{o.hint}</p>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
