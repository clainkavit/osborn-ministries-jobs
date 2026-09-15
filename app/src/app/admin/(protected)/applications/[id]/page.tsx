// Stage 29 (M7) -- Admin Application Detail. Decision 1: contact fields
// are present in getApplicationForAdmin's own returned shape ONLY once
// status is SHORTLISTED or later -- this page never receives contact data
// to hide, so there's nothing here that could accidentally leak it via
// CSS. Decision 3: M6 match score/breakdown, if shown, is computed live by
// the query layer -- nothing here reads a stored score.

import { notFound } from "next/navigation";
import { getApplicationForAdmin } from "@/lib/applications/queries";
import { ApplicationActions } from "@/components/applications/application-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/application";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplicationForAdmin(id);
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {application.firstName} {application.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {application.opportunityTitle}
            {application.organizationName
              ? ` · ${application.organizationName}`
              : ""}
          </p>
          <div className="mt-2">
            <Badge
              variant={
                application.status === "SELECTED" ? "default" : "secondary"
              }
            >
              {STATUS_LABEL[application.status] ?? application.status}
            </Badge>
          </div>
        </div>
      </div>

      <ApplicationActions
        id={application.id}
        status={application.status as ApplicationStatus}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Candidate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Job title" value={application.jobTitle ?? "—"} />
          <Row label="Location" value={application.location ?? "—"} />
          <Row
            label="Contact"
            value={
              application.contact
                ? [application.contact.phone, application.contact.email]
                    .filter(Boolean)
                    .join(" · ") || "—"
                : "Available once shortlisted"
            }
          />
        </CardContent>
      </Card>

      {application.match ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Match — {application.match.score}% ({application.match.label})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row
              label="Profession"
              value={`${application.match.breakdown.profession}%`}
            />
            <Row
              label="Skills"
              value={`${application.match.breakdown.skills}%`}
            />
            <Row
              label="Experience"
              value={`${application.match.breakdown.experience}%`}
            />
            <Row
              label="Availability"
              value={`${application.match.breakdown.availability}%`}
            />
            <Row
              label="Location"
              value={`${application.match.breakdown.location}%`}
            />
            <Row label="Education" value="Not evaluated in M6" />
          </CardContent>
        </Card>
      ) : null}

      {application.status === "INTERVIEW" ||
      application.status === "SELECTED" ||
      application.status === "REJECTED" ? (
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
            <Row
              label="Instructions"
              value={application.interviewInstructions ?? "—"}
            />
          </CardContent>
        </Card>
      ) : null}

      {application.outcome ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Outcome" value={application.outcome.outcome} />
            <Row label="Notes" value={application.outcome.notes ?? "—"} />
          </CardContent>
        </Card>
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
