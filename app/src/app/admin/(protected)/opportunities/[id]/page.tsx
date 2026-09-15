// Stage 27 (M5) -- Admin Opportunity Detail / Manage. View + the applicable
// transition actions for the opportunity's current status. Publish is
// performed from the wizard's Review screen; Close/Cancel/Fill/Complete are
// available here according to the state machine (checklist §9, corrected
// wording).
//
// Stage 28 (M6) adds the "Find Matches" link, shown ONLY when status is
// PUBLISHED (Decision 3) -- absent, not disabled, for every other status.
// M6 Find Matches remains read-only -- no Shortlist action was added there
// (Decision 12); this page's own "Applications" link is the only path into
// M7's review/shortlist flow.
//
// Stage 29 (M7) adds the "Applications" link, shown for every status --
// unlike Find Matches, application review remains meaningful even after an
// opportunity closes (existing applications stay visible per Stage 7).

import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityForAdmin } from "@/lib/opportunities/queries";
import { EDUCATION_LEVEL_LABELS } from "@/types/member";
import { OpportunityActions } from "@/components/opportunities/opportunity-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Active",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  FILLED: "Filled",
  COMPLETED: "Completed",
};

const TYPE_LABEL: Record<string, string> = {
  EMPLOYMENT: "Employment",
  CHURCH: "Church Opportunity",
  SERVICE: "Service",
};

export default async function AdminOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunityForAdmin(id);
  if (!opportunity) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {opportunity.title || "Untitled draft"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABEL[opportunity.type] ?? opportunity.type}
            {opportunity.organizationName
              ? ` · ${opportunity.organizationName}`
              : ""}
          </p>
          <div className="mt-2">
            <Badge
              variant={opportunity.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {STATUS_LABEL[opportunity.status] ?? opportunity.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {opportunity.status === "DRAFT" ? (
            <Button asChild size="sm">
              <Link href={`/admin/opportunities/${id}/edit`}>
                Continue editing
              </Link>
            </Button>
          ) : null}
          {opportunity.status === "PUBLISHED" ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/opportunities/${id}/matches`}>
                Find matches
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/opportunities/${id}/applications`}>
              Applications
            </Link>
          </Button>
          <OpportunityActions id={id} status={opportunity.status} />
        </div>
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
