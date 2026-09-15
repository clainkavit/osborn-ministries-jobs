// Stage 29 (M7) -- My Applications. Replaces the ComingSoon stub. Own
// applications only (getMyApplications resolves member_id from the
// session; RLS backs this up independently). No edit once submitted; a
// Withdraw action lives on the detail screen (Decision 10), not here.

import Link from "next/link";
import { getMyApplications } from "@/lib/applications/queries";

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  REVIEWED: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview scheduled",
  SELECTED: "Selected",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

export default async function MyApplicationsPage() {
  const applications = await getMyApplications();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          My Applications
        </h1>
        <p className="text-sm text-muted-foreground">
          Track the status of every opportunity you&apos;ve applied to.
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          You haven&apos;t applied to any opportunities yet. Browse
          opportunities to find one that fits.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {applications.map((a) => (
            <li key={a.id}>
              <Link
                href={`/applications/${a.id}`}
                className="flex flex-col gap-2 px-4 py-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{a.opportunityTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.organizationName}
                  </p>
                </div>
                <span className="text-xs font-medium">
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
