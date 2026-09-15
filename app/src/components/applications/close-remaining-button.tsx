"use client";

// Stage 29 (M7), Decision 9 -- a single named, explicit admin action for
// the opportunity-close/cancel workflow ONLY. Not a general bulk-selection
// UI, not shown unless the opportunity itself is already Closed/Cancelled
// and open applications remain (the page decides when to render this).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeRemainingApplications } from "@/lib/applications/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CloseRemainingButton({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Stage 30 (M8) Decision 21: the action's own status changes always
  // commit regardless of notification outcome -- this just surfaces the
  // returned counts so the admin knows if any notification didn't go out.
  // Not a new screen/queue/retry UI, just reading the existing return value.
  const [result, setResult] = useState<{
    applicationsClosed: number;
    notificationsFailed: number;
  } | null>(null);

  function closeRemaining() {
    setError(null);
    setResult(null);
    start(async () => {
      const res = await closeRemainingApplications(opportunityId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResult(res.data);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {result ? (
        <p className="text-sm text-muted-foreground">
          {result.applicationsClosed} application
          {result.applicationsClosed === 1 ? "" : "s"} closed.
          {result.notificationsFailed > 0
            ? ` ${result.notificationsFailed} notification${
                result.notificationsFailed === 1 ? "" : "s"
              } couldn't be delivered.`
            : ""}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        This opportunity is closed. Applications still open (Applied,
        Reviewed, Shortlisted, or Interview) can be rejected in bulk.
        Selected, Rejected, and Withdrawn applications are never affected.
      </p>
      <Button variant="outline" onClick={closeRemaining} disabled={isPending}>
        {isPending ? "Closing…" : "Close remaining applications"}
      </Button>
    </div>
  );
}
