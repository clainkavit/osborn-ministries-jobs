// Stage 23 (M3) -- Admin Verification Queue. Replaces the M1 placeholder.
// Server component: middleware already gates /admin/* to Church/Super Admin.

import Link from "next/link";
import { getVerificationQueue } from "@/lib/verification/queries";
import { filterQueue, queueCounts } from "@/lib/verification/rules";
import type { VerificationQueueTab } from "@/types/verification";
import { TrackChip } from "@/components/verification/track-chip";
import { cn } from "@/lib/utils";

const TABS: { key: VerificationQueueTab; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "NEEDS_CORRECTION", label: "Needs correction" },
  { key: "APPROVED", label: "Approved" },
  { key: "ALL", label: "All" },
];

export default async function VerificationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: VerificationQueueTab =
    tabParam === "ALL" ||
    tabParam === "NEEDS_CORRECTION" ||
    tabParam === "APPROVED"
      ? tabParam
      : "PENDING";

  const rows = await getVerificationQueue();
  const counts = queueCounts(rows);
  const shown = filterQueue(rows, tab);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Review submitted profiles. Membership and credentials are approved
          separately.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/verification?tab=${t.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              tab === t.key
                ? "border-primary bg-muted font-medium"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">
              {counts[t.key]}
            </span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          {tab === "PENDING"
            ? "You're all caught up. No profiles are waiting for review."
            : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.memberId}>
              <Link
                href={`/admin/verification/${r.memberId}`}
                className="flex flex-col gap-2 rounded-md border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(r.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <TrackChip track="MEMBERSHIP" status={r.membershipStatus} />
                  <TrackChip track="CREDENTIALS" status={r.credentialsStatus} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
