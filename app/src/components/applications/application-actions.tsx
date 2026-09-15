"use client";

// Stage 29 (M7) -- the admin application-detail action panel. Only renders
// the actions isApplicationTransitionAllowed actually permits from the
// current status and actor ADMIN -- an absent action is not the
// enforcement (the server action re-checks the same rule), matching
// OpportunityActions's own established pattern.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markApplicationReviewed,
  shortlistApplication,
  scheduleInterview,
  recordOutcome,
} from "@/lib/applications/actions";
import { isApplicationTransitionAllowed } from "@/lib/applications/rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ApplicationStatus } from "@/types/application";

export function ApplicationActions({
  id,
  status,
}: {
  id: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewInstructions, setInterviewInstructions] = useState("");

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await action();
      if (!res.success) {
        setError(res.error ?? "Couldn't update the application.");
        return;
      }
      setShowInterviewForm(false);
      router.refresh();
    });
  }

  const canReview = isApplicationTransitionAllowed(status, "REVIEWED", "ADMIN");
  const canShortlist = isApplicationTransitionAllowed(
    status,
    "SHORTLISTED",
    "ADMIN",
  );
  const canScheduleInterview = isApplicationTransitionAllowed(
    status,
    "INTERVIEW",
    "ADMIN",
  );
  const canRecordOutcome = isApplicationTransitionAllowed(
    status,
    "SELECTED",
    "ADMIN",
  );

  if (
    !canReview &&
    !canShortlist &&
    !canScheduleInterview &&
    !canRecordOutcome
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canReview ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => markApplicationReviewed(id))}
          >
            Mark reviewed
          </Button>
        ) : null}
        {canShortlist ? (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => shortlistApplication(id))}
          >
            Shortlist
          </Button>
        ) : null}
        {canScheduleInterview && !showInterviewForm ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setShowInterviewForm(true)}
          >
            Schedule interview
          </Button>
        ) : null}
        {canRecordOutcome ? (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => run(() => recordOutcome(id, "SELECTED"))}
            >
              Mark selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run(() => recordOutcome(id, "REJECTED"))}
            >
              Mark rejected
            </Button>
          </>
        ) : null}
      </div>

      {showInterviewForm ? (
        <div className="space-y-3 rounded-md border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="interviewDate">Date</Label>
              <Input
                id="interviewDate"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interviewTime">Time</Label>
              <Input
                id="interviewTime"
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interviewLocation">Location</Label>
            <Input
              id="interviewLocation"
              value={interviewLocation}
              onChange={(e) => setInterviewLocation(e.target.value)}
              placeholder="e.g. Church office, or a meeting link"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interviewInstructions">
              Instructions (optional)
            </Label>
            <textarea
              id="interviewInstructions"
              value={interviewInstructions}
              onChange={(e) => setInterviewInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-transparent p-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  scheduleInterview(id, {
                    interviewDate,
                    interviewTime,
                    interviewLocation,
                    interviewInstructions: interviewInstructions || null,
                  }),
                )
              }
            >
              {isPending ? "Scheduling…" : "Confirm interview"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => setShowInterviewForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
