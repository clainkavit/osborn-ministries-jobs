// Stage 22 / Stage 3 -- the `● ○ ○ ○ ○ ○ ○ ○` progress indicator.

import { ONBOARDING_STEPS } from "@/lib/profile/steps";
import { cn } from "@/lib/utils";

export function StepperHeader({ current }: { current: number }) {
  const step = ONBOARDING_STEPS.find((s) => s.n === current);
  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-label={`Step ${current} of ${ONBOARDING_STEPS.length}`}
      >
        {ONBOARDING_STEPS.map((s) => (
          <span
            key={s.n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              s.n < current
                ? "bg-primary"
                : s.n === current
                  ? "bg-primary"
                  : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {current} of {ONBOARDING_STEPS.length}
        {step ? ` — ${step.label}` : ""}
      </p>
    </div>
  );
}
