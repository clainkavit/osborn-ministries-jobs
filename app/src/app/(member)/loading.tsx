// Stage 31 (M9) loading-state pass. Route-group level, per Stage 18's own
// framing of M9 as the pass that fills in states earlier milestones
// stubbed. Next.js renders this while the segment's page (and its data
// fetches) are still resolving -- it does not wrap the layout, so this has
// no access to AppShell and is a plain, generic content skeleton.

import { Skeleton } from "@/components/ui/skeleton";

export default function MemberLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
