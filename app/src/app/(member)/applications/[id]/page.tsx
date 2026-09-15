// Stage 29 (M7), Decision 10 -- dedicated member application detail route.
// getMyApplicationDetail returns null for anything not owned by the caller
// (RLS backs this up independently) -- notFound() covers both "doesn't
// exist" and "not this member's own application," same posture as every
// other detail screen in this codebase.
//
// Never exposes application_outcomes.notes -- that table is admin-internal
// and this page never queries it.

import { notFound } from "next/navigation";
import { getMyApplicationDetail } from "@/lib/applications/queries";
import { WithdrawButton } from "@/components/applications/withdraw-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  REVIEWED: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview scheduled",
  SELECTED: "Selected",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

const WITHDRAWABLE_STATUSES = new Set(["APPLIED", "REVIEWED", "SHORTLISTED"]);

export default async function MyApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getMyApplicationDetail(id);
  if (!application) notFound();

  const showInterview =
    application.status === "INTERVIEW" ||
    application.status === "SELECTED" ||
    application.status === "REJECTED";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {application.opportunityTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {application.organizationName}
        </p>
        <div className="mt-2">
          <Badge>
            {STATUS_LABEL[application.status] ?? application.status}
          </Badge>
        </div>
      </div>

      {application.status === "REJECTED" ? (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          You weren&apos;t selected for {application.opportunityTitle}.
        </p>
      ) : null}

      {showInterview &&
      (application.interviewDate ||
        application.interviewTime ||
        application.interviewLocation) ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Date" value={application.interviewDate ?? "—"} />
            <Row label="Time" value={application.interviewTime ?? "—"} />
            <Row
              label="Location"
              value={application.interviewLocation ?? "—"}
            />
            {application.interviewInstructions ? (
              <Row
                label="Instructions"
                value={application.interviewInstructions}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {WITHDRAWABLE_STATUSES.has(application.status) ? (
        <WithdrawButton applicationId={application.id} />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1">{value}</span>
    </div>
  );
}
