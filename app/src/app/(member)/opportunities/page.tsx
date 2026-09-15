// Stage 27 (M5) -- the real member-facing Opportunities browse screen.
// Replaces the ComingSoon stub. Search + Type/Location filters, submit-
// triggered (native <form method="GET">, M4's exact Decision-4 pattern --
// no client JS, no per-keystroke requests).
//
// Published only, everywhere -- enforced by the query's own unconditional
// gate clause AND by RLS. Browsing does not require verification (Stage 17):
// an unverified, even still-REGISTERED member can browse and view detail.

import Link from "next/link";
import { Suspense } from "react";
import {
  getPublishedOpportunities,
  getPublishedOpportunityCount,
} from "@/lib/opportunities/queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpportunityType } from "@/types/opportunity";

const TYPE_LABEL: Record<string, string> = {
  EMPLOYMENT: "Employment",
  CHURCH: "Church Opportunity",
  SERVICE: "Service",
};

// Stage 31 (M9) -- Stage 11's loading-state row calls for skeleton rows
// here specifically ("no copy needed"). Isolated in its own async component
// so Suspense can show the skeleton while only the results (not the search
// form above them) are still loading.
async function OpportunityResults({
  filters,
  hasAnyFilter,
}: {
  filters: { search?: string; type?: OpportunityType; location?: string };
  hasAnyFilter: boolean;
}) {
  const opportunities = await getPublishedOpportunities(filters);

  // Decision 6a: two distinct empty states, same disambiguation mechanic
  // M4 used for the directory.
  const noneAtAll =
    opportunities.length === 0 &&
    (!hasAnyFilter || (await getPublishedOpportunityCount()) === 0);

  if (opportunities.length === 0) {
    return noneAtAll ? (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No opportunities yet
        <br />
        Published opportunities will appear here when they become
        available.
      </p>
    ) : (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No opportunities found
        <br />
        Try adjusting your search or filters.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {opportunities.map((o) => (
        <li key={o.id}>
          <Link
            href={`/opportunities/${o.id}`}
            className="block rounded-md border p-4 text-sm hover:bg-muted/50"
          >
            <p className="font-medium">{o.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {TYPE_LABEL[o.type] ?? o.type}
              {o.organizationName ? ` · ${o.organizationName}` : ""}
            </p>
            {o.location ? (
              <p className="text-xs text-muted-foreground">{o.location}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OpportunityResultsSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-24 w-full" />
        </li>
      ))}
    </ul>
  );
}

export default async function OpportunitiesBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; location?: string }>;
}) {
  const sp = await searchParams;
  const filters: {
    search?: string;
    type?: OpportunityType;
    location?: string;
  } = {
    search: sp.q || undefined,
    type:
      sp.type === "EMPLOYMENT" || sp.type === "CHURCH" || sp.type === "SERVICE"
        ? sp.type
        : undefined,
    location: sp.location || undefined,
  };

  const hasAnyFilter = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Employment, church, and service opportunities.
        </p>
      </div>

      <form method="GET" className="space-y-3 rounded-md border p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Title or organization"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={sp.location ?? ""}
              placeholder="e.g. Mwanza"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={sp.type ?? ""}
              className="h-8 w-full rounded-md border bg-transparent px-2.5 text-sm"
            >
              <option value="">All types</option>
              <option value="EMPLOYMENT">Employment</option>
              <option value="CHURCH">Church Opportunity</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm">
            Search
          </Button>
          {hasAnyFilter ? (
            <Button asChild type="button" size="sm" variant="ghost">
              <Link href="/opportunities">Clear</Link>
            </Button>
          ) : null}
        </div>
      </form>

      <Suspense fallback={<OpportunityResultsSkeleton />}>
        <OpportunityResults filters={filters} hasAnyFilter={hasAnyFilter} />
      </Suspense>
    </div>
  );
}
