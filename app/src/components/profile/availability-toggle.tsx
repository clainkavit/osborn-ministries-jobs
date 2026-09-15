"use client";

// Stage 22 / Journey 3 -- the live availability toggle on the dashboard.
// Persists immediately via saveAvailability (no REGISTERED gate -- editable
// post-onboarding).

import { useState, useTransition } from "react";
import { saveAvailability } from "@/lib/profile/actions";
import type { Availability } from "@/types/member";

const OPTIONS: { value: Exclude<Availability, "NOT_SET">; label: string }[] = [
  { value: "OPEN", label: "Open to opportunities" },
  { value: "SELECTIVE", label: "Open to selected" },
  { value: "NOT_AVAILABLE", label: "Not available" },
];

export function AvailabilityToggle({ current }: { current: Availability }) {
  const [value, setValue] = useState<Availability>(current);
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(next: Exclude<Availability, "NOT_SET">) {
    if (next === value || isPending) return;
    const prev = value;
    setValue(next);
    setError(null);
    start(async () => {
      const res = await saveAvailability({ availability: next });
      if (!res.success) {
        setValue(prev);
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="availability"
              checked={value === o.value}
              onChange={() => choose(o.value)}
              disabled={isPending}
            />
            {o.label}
          </label>
        ))}
      </div>
      {value === "NOT_SET" ? (
        <p className="text-xs text-muted-foreground">Not set yet.</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
