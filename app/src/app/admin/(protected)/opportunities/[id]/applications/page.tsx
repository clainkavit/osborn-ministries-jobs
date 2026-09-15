// Stage 29 (M7) -- Admin Application Management, per opportunity. Decision
// 11: no search/filter controls, a flat list grouped/ordered by status --
// not a Kanban board, not bulk-selectable (Decision 9's
// closeRemainingApplications is a single named action below the list, not
// a generic bulk-select UI).

import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityForAdmin } from "@/lib/opportunities/queries";
import { getApplicationsForOpportunity } from "@/lib/applications/queries";
import { CloseRemainingButton } from "@/components/applications/close-remaining-button";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  REVIEWED: "Reviewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const STATUS_ORDER = [
  "APPLIED",
  "REVIEWED",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

export default async function OpportunityApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunityForAdmin(id);
  if (!opportunity) notFound();

  const applications = await getApplicationsForOpportunity(id);
  const sorted = [...applications].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );

  const hasOpenApplications = applications.some((a) =>
    ["APPLIED", "REVIEWED", "SHORTLISTED", "INTERVIEW"].includes(a.status),
  );
  const opportunityIsClosedOrCancelled =
    opportunity.status === "CLOSED" || opportunity.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">{opportunity.title}</p>
      </div>

      {opportunityIsClosedOrCancelled && hasOpenApplications ? (
        <CloseRemainingButton opportunityId={id} />
      ) : null}

      {sorted.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No applications yet
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sorted.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/applications/${a.id}`}
                className="flex flex-col gap-2 px-4 py-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {a.firstName} {a.lastName}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
