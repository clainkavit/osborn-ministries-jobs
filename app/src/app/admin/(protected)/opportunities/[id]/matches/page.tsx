// Stage 28 (M6) -- Admin Find Matches. Admin-only (Decision 2). Available
// only for a PUBLISHED opportunity (Decision 3): a missing opportunity is a
// 404, a non-Published one shows an explicit "matching only available for
// published opportunities" state -- never a silently-empty candidate list,
// never a computed-but-meaningless result.

import { notFound } from "next/navigation";
import Link from "next/link";
import { findMatchesForOpportunity } from "@/lib/matching/queries";
import { Badge } from "@/components/ui/badge";

export default async function FindMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await findMatchesForOpportunity(id);

  if (!result.ok) {
    if (result.reason === "NOT_FOUND") notFound();
    if (result.reason === "UNAUTHORIZED") notFound();

    // NOT_PUBLISHED -- the opportunity exists, matching just isn't
    // available for its current status (Decision 3).
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Find matches
          </h1>
        </div>
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          Matching is only available for published opportunities.
          <br />
          <Link
            href={`/admin/opportunities/${id}`}
            className="underline underline-offset-2"
          >
            Back to opportunity
          </Link>
        </p>
      </div>
    );
  }

  const { opportunityTitle, candidates } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Find matches
        </h1>
        <p className="text-sm text-muted-foreground">{opportunityTitle}</p>
      </div>

      {candidates.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No matching professionals
          <br />
          No verified, available professionals currently match this
          opportunity.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {candidates.length}{" "}
            {candidates.length === 1
              ? "potential match"
              : "potential matches"}
          </p>
          <ul className="divide-y rounded-md border">
            {candidates.map((c) => (
              <li key={c.memberId} className="flex flex-col gap-3 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.jobTitle ?? "—"}
                      {c.location ? ` · ${c.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums">
                      {c.score}%
                    </span>
                    <Badge
                      variant={
                        c.label === "Strong"
                          ? "default"
                          : c.label === "Good"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {c.label}
                    </Badge>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                  <BreakdownRow
                    label="Profession"
                    value={
                      c.breakdown.profession === 100
                        ? "Match"
                        : "No match"
                    }
                  />
                  <BreakdownRow
                    label="Skills"
                    value={`${c.breakdown.skills}%`}
                  />
                  <BreakdownRow
                    label="Experience"
                    value={
                      c.yearsOfExperience != null
                        ? `${c.yearsOfExperience} yrs`
                        : "Not stated"
                    }
                  />
                  <BreakdownRow
                    label="Availability"
                    value={c.availability === "OPEN" ? "Open" : "Selective"}
                  />
                  <BreakdownRow
                    label="Location"
                    value={
                      c.breakdown.location === 100
                        ? "Same location"
                        : c.breakdown.location === 50
                          ? "Location not specified"
                          : "Different location"
                    }
                  />
                  <BreakdownRow
                    label="Education"
                    value="Not evaluated in M6"
                  />
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 sm:block">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
