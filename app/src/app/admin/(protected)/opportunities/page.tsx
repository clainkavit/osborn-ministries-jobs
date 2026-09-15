// Stage 27 (M5) -- Admin Opportunities list. Replaces the ComingSoon stub.
// Server component: middleware already gates /admin/* to Church/Super Admin.

import Link from "next/link";
import { Suspense } from "react";
import { getAdminOpportunities } from "@/lib/opportunities/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// "Active" is PUBLISHED's display label only -- never a stored value
// (Champion Decision 3 / checklist §3).
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

// Stage 31 (M9) -- Stage 11's skeleton-rows loading treatment, isolated so
// Suspense can show it independently of the header/Create button above it.
async function AdminOpportunityList() {
  const opportunities = await getAdminOpportunities();

  if (opportunities.length === 0) {
    return (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No opportunities yet.
        <br />
        Create one to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {opportunities.map((o) => (
        <li key={o.id}>
          <Link
            href={`/admin/opportunities/${o.id}`}
            className="flex flex-col gap-2 px-4 py-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{o.title || "Untitled draft"}</p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABEL[o.type] ?? o.type}
                {o.organizationName ? ` · ${o.organizationName}` : ""}
              </p>
            </div>
            <Badge variant={o.status === "PUBLISHED" ? "default" : "secondary"}>
              {STATUS_LABEL[o.status] ?? o.status}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AdminOpportunityListSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function AdminOpportunitiesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Opportunities
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage opportunities for the professional network.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/opportunities/new">Create opportunity</Link>
        </Button>
      </div>

      <Suspense fallback={<AdminOpportunityListSkeleton />}>
        <AdminOpportunityList />
      </Suspense>
    </div>
  );
}
