"use client";

// Stage 29 (M7), Decision 4 -- member self-serve Withdraw, own application
// only, only from APPLIED/REVIEWED/SHORTLISTED. The absence of this
// component from INTERVIEW/SELECTED/REJECTED/WITHDRAWN is the primary UI
// enforcement; the server action (withdrawApplication) independently
// re-checks the same rule regardless.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawApplication } from "@/lib/applications/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function withdraw() {
    setError(null);
    start(async () => {
      const res = await withdrawApplication(applicationId);
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
      <Button variant="outline" onClick={withdraw} disabled={isPending}>
        {isPending ? "Withdrawing…" : "Withdraw application"}
      </Button>
    </div>
  );
}
