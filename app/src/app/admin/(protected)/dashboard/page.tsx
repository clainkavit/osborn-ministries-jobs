// Stage 21 section 22 (M1) + Stage 31 (M9). Admin dashboard -- honest
// zero-states, not invented numbers. M9 replaces the placeholder Applications
// KPI with a real total and adds the Needs Attention section (Decision B):
// two actionable tiles, distinct from the KPI cards above them, that stay
// visible even at zero (a calm "caught up" state, not an absent tile).

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDirectoryProfessionalCount } from "@/lib/directory/queries";
import { getPublishedOpportunityCount } from "@/lib/opportunities/queries";
import { getApplicationCount, getNewApplicationCount } from "@/lib/applications/queries";
import { getPendingVerificationCount } from "@/lib/verification/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function memberCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}

function AttentionTile({
  label,
  value,
  caughtUpCopy,
  href,
}: {
  label: string;
  value: number;
  caughtUpCopy: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {value > 0 ? (
            <span className="text-2xl font-semibold tabular-nums">{value}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{caughtUpCopy}</span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const members = await memberCount();
  const pendingVerification = await getPendingVerificationCount();
  // Stage 25 (M4), Decision 7: the SAME gate predicate as the directory
  // query -- one definition of "verified professional" anywhere in the app.
  const verifiedProfessionals = await getDirectoryProfessionalCount();
  // Stage 27 (M5), Decision 6b: count(opportunities WHERE status = 'PUBLISHED').
  // No ACTIVE database status exists -- "Active" is a display label only.
  const activeOpportunities = await getPublishedOpportunityCount();
  // Stage 31 (M9), Decision A: total applications ever created, every status.
  const applications = await getApplicationCount();
  // Stage 31 (M9), Decision B: applications currently in APPLIED status.
  const newApplications = await getNewApplicationCount();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome to the Professional Network
        </h1>
        <p className="text-sm text-muted-foreground">
          The platform is ready for administration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={members} />
        <Link href="/admin/verification" className="block">
          <StatCard label="Pending verification" value={pendingVerification} />
        </Link>
        <Link href="/admin/professionals" className="block">
          <StatCard label="Verified Professionals" value={verifiedProfessionals} />
        </Link>
        <Link href="/admin/opportunities" className="block">
          <StatCard label="Active Opportunities" value={activeOpportunities} />
        </Link>
        <StatCard label="Applications" value={applications} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <AttentionTile
            label="Pending verification"
            value={pendingVerification}
            caughtUpCopy="You're all caught up. No profiles are waiting for review."
            href="/admin/verification"
          />
          <AttentionTile
            label="New applications"
            value={newApplications}
            caughtUpCopy="You're all caught up. No new applications to review."
            href="/admin/opportunities"
          />
        </div>
      </div>
    </div>
  );
}
