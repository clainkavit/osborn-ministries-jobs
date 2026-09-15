"use client";

// Step 7 -- Availability. Must be an explicit choice (completeness gate:
// availability != NOT_SET). "Next" saves the selection.

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardStepProps } from "../onboarding-wizard";
import type { AuthActionResult } from "@/types/auth";
import type { Availability } from "@/types/member";

const OPTIONS: { value: Exclude<Availability, "NOT_SET">; label: string; hint: string }[] =
  [
    {
      value: "OPEN",
      label: "Open to opportunities",
      hint: "You want to hear about relevant openings.",
    },
    {
      value: "SELECTIVE",
      label: "Open to selected opportunities",
      hint: "Only a strong match is worth your time right now.",
    },
    {
      value: "NOT_AVAILABLE",
      label: "Not currently available",
      hint: "You don't want to be matched for now.",
    },
  ];

export function AvailabilityStep({
  profile,
  bindNext,
  save,
}: WizardStepProps & { save: (raw: unknown) => Promise<AuthActionResult> }) {
  const [choice, setChoice] = useState<Availability>(profile.availability);

  bindNext(async () => {
    if (choice === "NOT_SET") {
      return { success: false, error: "Choose an option." };
    }
    const res = await save({ availability: choice });
    return res.success
      ? { success: true }
      : { success: false, error: res.error };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Availability</h2>
        <p className="text-sm text-muted-foreground">
          You can change this any time from your dashboard.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setChoice(o.value)}
            className={cn(
              "flex w-full flex-col items-start rounded-md border p-3 text-left",
              choice === o.value ? "border-primary bg-muted" : "hover:bg-muted/60",
            )}
          >
            <span className="text-sm font-medium">{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
