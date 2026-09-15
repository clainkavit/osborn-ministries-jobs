"use client";

// Stage 27 (M5) -- the transition action buttons on the Admin Opportunity
// Detail screen. Only shows the buttons that isOpportunityTransitionAllowed
// actually permits from the current status -- an absent button is not the
// enforcement (the server action re-checks the same rule), but the UI
// should never offer an action the server would reject.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closeOpportunity,
  cancelOpportunity,
  markOpportunityFilled,
  markOpportunityCompleted,
} from "@/lib/opportunities/actions";
import { isOpportunityTransitionAllowed } from "@/lib/opportunities/rules";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OpportunityStatus } from "@/types/opportunity";

export function OpportunityActions({
  id,
  status,
}: {
  id: string;
  status: OpportunityStatus;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await action();
      if (!res.success) {
        setError(res.error ?? "Couldn't update the opportunity.");
        return;
      }
      router.refresh();
    });
  }

  const canClose = isOpportunityTransitionAllowed(status, "CLOSED");
  const canCancel = isOpportunityTransitionAllowed(status, "CANCELLED");
  const canFill = isOpportunityTransitionAllowed(status, "FILLED");
  const canComplete = isOpportunityTransitionAllowed(status, "COMPLETED");

  if (!canClose && !canCancel && !canFill && !canComplete) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {canFill ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => markOpportunityFilled(id))}
        >
          Mark filled
        </Button>
      ) : null}
      {canClose ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => closeOpportunity(id))}
        >
          Close
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => cancelOpportunity(id))}
        >
          Cancel
        </Button>
      ) : null}
      {canComplete ? (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => run(() => markOpportunityCompleted(id))}
        >
          Mark completed
        </Button>
      ) : null}
    </div>
  );
}
