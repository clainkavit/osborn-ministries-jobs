// Stage 27 (M5) -- the Create Opportunity progress indicator. Exact mirror
// of components/onboarding/stepper-header.tsx, adapted to the 4-screen
// wizard (OPPORTUNITY_STEPS).

import { OPPORTUNITY_STEPS } from "@/lib/opportunities/steps";
import { cn } from "@/lib/utils";

export function OpportunityStepperHeader({ current }: { current: number }) {
  const step = OPPORTUNITY_STEPS.find((s) => s.n === current);
  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={OPPORTUNITY_STEPS.length}
        aria-label={`Step ${current} of ${OPPORTUNITY_STEPS.length}`}
      >
        {OPPORTUNITY_STEPS.map((s) => (
          <span
            key={s.n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              s.n <= current ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Step {current} of {OPPORTUNITY_STEPS.length}
        {step ? ` — ${step.label}` : ""}
      </p>
    </div>
  );
}
