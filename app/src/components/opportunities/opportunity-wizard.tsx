"use client";

// Stage 27 (M5) -- the Create Opportunity wizard. Client component. Exact
// structural mirror of components/onboarding/onboarding-wizard.tsx:
// bindNext/refresh props, a useCallback-wrapped ref for "what Next should
// save" (React #185 avoidance), save-before-advance autosave.
//
// Champion §23 item 4: 4 screens (Type, Details, Requirements, Review).
// Publish is the footer button's label/action on the Review screen, not a
// separate 5th screen.
//
// Champion §23 item 5: reopening a Draft ALWAYS starts at Step 1 with every
// field prefilled from what's already saved -- no computed resume-step
// function exists for M5. The page that renders this component is
// responsible for always passing startStep=1; this component does not
// compute one itself.

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OpportunityStepperHeader } from "./stepper-header";
import { REVIEW_STEP, FIRST_STEP } from "@/lib/opportunities/steps";
import { publishOpportunity } from "@/lib/opportunities/actions";
import type { OpportunityDetail } from "@/types/opportunity";
import { TypeStep } from "./steps/type-step";
import { DetailsStep } from "./steps/details-step";
import { RequirementsStep } from "./steps/requirements-step";
import { OpportunityReviewStep } from "./steps/review-step";

export interface OpportunityStepProps {
  opportunity: OpportunityDetail;
  bindNext: (fn: (() => Promise<{ success: boolean; error?: string }>) | null) => void;
  refresh: () => void;
}

export function OpportunityWizard({
  opportunity,
}: {
  opportunity: OpportunityDetail;
}) {
  const router = useRouter();
  const [step, setStep] = useState(FIRST_STEP);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextFnRef = useRef<
    (() => Promise<{ success: boolean; error?: string }>) | null
  >(null);

  const bindNext = useCallback(
    (fn: (() => Promise<{ success: boolean; error?: string }>) | null) => {
      nextFnRef.current = fn;
    },
    [],
  );
  const refresh = useCallback(() => router.refresh(), [router]);

  const stepProps: OpportunityStepProps = { opportunity, bindNext, refresh };

  function goBack() {
    setError(null);
    nextFnRef.current = null;
    setStep((s) => Math.max(FIRST_STEP, s - 1));
  }

  function goNext() {
    setError(null);
    startTransition(async () => {
      const fn = nextFnRef.current;
      if (fn) {
        const res = await fn();
        if (!res.success) {
          setError(res.error ?? "Couldn't save. Try again.");
          return;
        }
      }
      nextFnRef.current = null;
      router.refresh();
      setStep((s) => Math.min(REVIEW_STEP, s + 1));
    });
  }

  function publish() {
    setError(null);
    startTransition(async () => {
      const res = await publishOpportunity(opportunity.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(`/admin/opportunities/${opportunity.id}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col gap-6 py-4">
      <OpportunityStepperHeader current={step} />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex-1">
        {step === 1 && <TypeStep {...stepProps} />}
        {step === 2 && <DetailsStep {...stepProps} />}
        {step === 3 && <RequirementsStep {...stepProps} />}
        {step === 4 && <OpportunityReviewStep {...stepProps} />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === FIRST_STEP || isPending}
        >
          Back
        </Button>
        {step < REVIEW_STEP ? (
          <Button type="button" onClick={goNext} disabled={isPending}>
            {isPending ? "Saving…" : "Next"}
          </Button>
        ) : (
          <Button type="button" onClick={publish} disabled={isPending}>
            {isPending ? "Publishing…" : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
}
