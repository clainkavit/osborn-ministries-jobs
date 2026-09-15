// Stage 25 (M4) -- the real Professionals directory. Replaces the M3-era
// stub. Search + filters (Decisions 1, 2, 3, 4) are read from the URL's
// searchParams, submitted via a plain <form method="GET">: this IS the
// submit-triggered behavior Decision 4 asks for (Enter or the Search
// button navigates with new query params; nothing fires on a keystroke,
// there is no client JS on this page at all) and it matches the existing
// `/admin/verification?tab=` pattern already used elsewhere in the app.
//
// No Verification filter (Decision 1 -- dropped entirely, not shown as a
// disabled/one-value control). Industry filter included (Decision 2).
// Availability is a single "Available now" checkbox, not a 3-way select,
// because the directory's own filter semantics (Stage 13) only ever
// distinguish OPEN from everything else -- there is no second filtered
// state to expose.

import Link from "next/link";
import { Suspense } from "react";
import {
  getDirectoryProfessionals,
  getDirectoryProfessionalCount,
  type DirectoryFilters,
} from "@/lib/directory/queries";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Stage 31 (M9) -- Stage 11's skeleton-rows loading treatment, isolated so
// Suspense can show it while only the results (not the search form above
// them) are still loading.
async function ProfessionalResults({
  filters,
  hasAnyFilter,
}: {
  filters: DirectoryFilters;
  hasAnyFilter: boolean;
}) {
  const professionals = await getDirectoryProfessionals(filters);

  // Decision 6: two distinct empty states. If a search/filter is active and
  // returned nothing, that's "No professionals found" -- but that copy would
  // be misleading with no filter active (there'd be nothing to "adjust"), so
  // an unfiltered empty result needs one extra query to confirm the
  // directory is genuinely empty rather than assume it.
  const directoryIsEmpty =
    professionals.length === 0 &&
    (!hasAnyFilter || (await getDirectoryProfessionalCount()) === 0);

  if (professionals.length === 0) {
    return directoryIsEmpty ? (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No verified professionals yet
        <br />
        Professionals who complete verification will appear here.
      </p>
    ) : (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No professionals match your search. Try a broader profession or
        clear a filter.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {professionals.map((p) => (
        <li key={p.memberId}>
          <Link
            href={`/admin/professionals/${p.memberId}`}
            className="flex flex-col gap-2 px-4 py-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {p.firstName} {p.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.professionName ?? "—"}
                {p.jobTitle ? ` · ${p.jobTitle}` : ""}
                {p.location ? ` · ${p.location}` : ""}
                {p.yearsOfExperience != null
                  ? ` · ${p.yearsOfExperience} yrs`
                  : ""}
              </p>
            </div>
            <VerificationBadges
              membership={p.membershipStatus}
              credentials={p.credentialsStatus}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProfessionalResultsSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default async function ProfessionalsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    minExperience?: string;
    industry?: string;
    available?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters: DirectoryFilters = {
    search: sp.q || undefined,
    location: sp.location || undefined,
    minExperience: sp.minExperience ? Number(sp.minExperience) : undefined,
    industry: sp.industry || undefined,
    availableOnly: sp.available === "1",
  };

  const hasAnyFilter = Object.values(filters).some(
    (v) => v !== undefined && v !== false,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Professionals</h1>
        <p className="text-sm text-muted-foreground">
          Members whose membership is confirmed and whose credentials have
          been reviewed.
        </p>
      </div>

      <form method="GET" className="space-y-3 rounded-md border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input
              id="q"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Name, profession, or skill"
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
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={sp.industry ?? ""}
              placeholder="e.g. Construction"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minExperience">Min. years experience</Label>
            <Input
              id="minExperience"
              name="minExperience"
              type="number"
              min={0}
              defaultValue={sp.minExperience ?? ""}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="available"
              name="available"
              type="checkbox"
              value="1"
              defaultChecked={sp.available === "1"}
              className="size-4 rounded border-input"
            />
            <Label htmlFor="available" className="cursor-pointer">
              Available now
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm">
            Search
          </Button>
          {hasAnyFilter ? (
            <Button asChild type="button" size="sm" variant="ghost">
              <Link href="/admin/professionals">Clear</Link>
            </Button>
          ) : null}
        </div>
      </form>

      <Suspense fallback={<ProfessionalResultsSkeleton />}>
        <ProfessionalResults filters={filters} hasAnyFilter={hasAnyFilter} />
      </Suspense>
    </div>
  );
}
