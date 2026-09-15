// Stage 27 (M5) -- Member Opportunity Detail. Published only: getOpportunityDetail
// returns null for anything else (DRAFT/CLOSED/CANCELLED/FILLED/COMPLETED all
// hidden from members per the M5/M6/M7 boundary), so notFound() covers both
// "doesn't exist" and "not currently visible."
//
// No match breakdown (M6) -- that's admin-only (Decision 2, M6). Stage 29
// (M7) adds the Apply action -- eligible + Published -> Apply; already
// applied -> the application's own status instead of another Apply button;
// unverified -> disabled + "Complete your verification to apply"
// (Stage 17's exact copy). Decision 5: NOT_AVAILABLE members are still
// shown a working Apply button -- availability is never checked here.

import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityDetail } from "@/lib/opportunities/queries";
import { getMyApplicationForOpportunity } from "@/lib/applications/queries";
import { getCurrentMember } from "@/lib/auth/queries";
import { isDirectoryVisible } from "@/lib/verification/rules";
import { EDUCATION_LEVEL_LABELS } from "@/types/member";
import { ApplyButton } from "@/components/applications/apply-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  REVIEWED: "Applied — under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview scheduled",
  SELECTED: "Selected",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

const TYPE_LABEL: Record<string, string> = {
  EMPLOYMENT: "Employment",
  CHURCH: "Church Opportunity",
  SERVICE: "Service",
};

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunityDetail(id);
  if (!opportunity) notFound();

  const member = await getCurrentMember();
  const existingApplication = await getMyApplicationForOpportunity(id);
  const isVerified =
    !!member &&
    member.profileStatus === "PROFILE_COMPLETE" &&
    isDirectoryVisible(member.membershipStatus, member.credentialsStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {opportunity.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {TYPE_LABEL[opportunity.type] ?? opportunity.type}
          {opportunity.organizationName
            ? ` · ${opportunity.organizationName}`
            : ""}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Badge>Active</Badge>
        </div>
      </div>

      <div>
        {existingApplication && existingApplication.status !== "WITHDRAWN" ? (
          <Button asChild variant="outline">
            <Link href={`/applications/${existingApplication.id}`}>
              {APPLICATION_STATUS_LABEL[existingApplication.status] ??
                existingApplication.status}{" "}
              — view status
            </Link>
          </Button>
        ) : !isVerified ? (
          <Button disabled title="Complete your verification to apply">
            Apply
          </Button>
        ) : (
          <ApplyButton opportunityId={id} />
        )}
        {!isVerified ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Complete your verification to apply.
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Location" value={opportunity.location ?? "—"} />
          <Row label="Description" value={opportunity.description ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row
            label="Profession"
            value={opportunity.requirement?.professionName ?? "Any profession"}
          />
          <Row
            label="Min. experience"
            value={
              opportunity.requirement?.minExperienceYears != null
                ? `${opportunity.requirement.minExperienceYears} years`
                : "—"
            }
          />
          <Row
            label="Education"
            value={
              opportunity.requirement?.requiredEducationLevel
                ? EDUCATION_LEVEL_LABELS[
                    opportunity.requirement.requiredEducationLevel
                  ]
                : "—"
            }
          />
          <Row
            label="Skills"
            value={
              opportunity.requiredSkills.length
                ? opportunity.requiredSkills.map((s) => s.name).join(", ")
                : "—"
            }
          />
          <Row
            label="Number needed"
            value={
              opportunity.headcountRequired != null
                ? String(opportunity.headcountRequired)
                : "—"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1">{value}</span>
    </div>
  );
}
