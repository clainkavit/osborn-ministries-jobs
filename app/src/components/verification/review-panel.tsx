"use client";

// Stage 23 (M3) -- the per-track Approve / Request-correction controls on the
// Verification Review screen. Client component. The two tracks render
// independently (Stage 17: "the one place both tracks' independence must be
// visually obvious").

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  verifyMembership,
  verifyCredentials,
} from "@/lib/verification/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ACTIONABLE = new Set(["PENDING", "REVIEW_PENDING"]);

function TrackControls({
  track,
  status,
  onDecision,
}: {
  track: "MEMBERSHIP" | "CREDENTIALS";
  status: string;
  onDecision: (
    decision: "APPROVED" | "NEEDS_CORRECTION",
    note: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "correcting">("idle");

  const label = track === "MEMBERSHIP" ? "Membership" : "Credentials";
  const done = status === "CONFIRMED" || status === "REVIEWED";
  const canAct = ACTIONABLE.has(status);

  function run(decision: "APPROVED" | "NEEDS_CORRECTION") {
    // Contradiction B: soft-warn (not a hard block) on an empty correction
    // note. Confirming proceeds with a null note; cancelling returns.
    if (decision === "NEEDS_CORRECTION" && note.trim() === "") {
      const proceed = window.confirm(
        "Add a note so the member knows what to fix? Click OK to send the correction without a note.",
      );
      if (!proceed) return;
    }
    setError(null);
    start(async () => {
      const res = await onDecision(decision, note.trim());
      if (!res.success) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setNote("");
      setMode("idle");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {status.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {done ? (
        <p className="text-sm text-muted-foreground">
          Approved. You can still send this back for a correction.
        </p>
      ) : null}

      {status === "NEEDS_CORRECTION" ? (
        <p className="text-sm text-muted-foreground">
          Waiting on the member&rsquo;s correction.
        </p>
      ) : null}

      {mode === "correcting" ? (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border bg-transparent p-2 text-sm"
            rows={3}
            placeholder="What does the member need to fix?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => run("NEEDS_CORRECTION")}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Send correction"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setMode("idle");
                setNote("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(canAct || done) && !done ? (
            <Button
              type="button"
              size="sm"
              onClick={() => run("APPROVED")}
              disabled={isPending}
            >
              {isPending ? "Saving verification…" : `Approve ${label.toLowerCase()}`}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode("correcting")}
            disabled={isPending || status === "NEEDS_CORRECTION"}
          >
            Request correction
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReviewPanel({
  memberId,
  membershipStatus,
  credentialsStatus,
}: {
  memberId: string;
  membershipStatus: string;
  credentialsStatus: string;
}) {
  return (
    <div className="space-y-4">
      <TrackControls
        track="MEMBERSHIP"
        status={membershipStatus}
        onDecision={(decision, note) =>
          verifyMembership(memberId, { decision, note }).then((r) =>
            r.success ? { success: true } : { success: false, error: r.error },
          )
        }
      />
      <TrackControls
        track="CREDENTIALS"
        status={credentialsStatus}
        onDecision={(decision, note) =>
          verifyCredentials(memberId, { decision, note }).then((r) =>
            r.success ? { success: true } : { success: false, error: r.error },
          )
        }
      />
    </div>
  );
}
