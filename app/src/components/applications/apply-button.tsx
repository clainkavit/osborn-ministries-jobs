"use client";

// Stage 29 (M7) -- the Apply action on the member Opportunity Detail
// screen. Mirrors OpportunityActions's structure: server action call via
// useTransition, router.refresh() on success so the page re-fetches the
// member's own application state and swaps to the "already applied" view.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToOpportunity } from "@/lib/applications/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ApplyButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    start(async () => {
      const res = await applyToOpportunity(opportunityId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button onClick={apply} disabled={isPending}>
        {isPending ? "Applying…" : "Apply"}
      </Button>
    </div>
  );
}
