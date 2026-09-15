// Stage 23 (M3) -- the member correction screen. The Journey 2 destination
// for a PROFILE_COMPLETE member with a NEEDS_CORRECTION track. NOT
// /onboarding (that redirects a PROFILE_COMPLETE member away).
//
// Req 2 (isolation): the member edits only the fields relevant to the
// flagged track(s); resubmit moves only those track(s) to PENDING.

import { redirect } from "next/navigation";
import { getMemberProfile } from "@/lib/profile/queries";
import { getMyCorrections } from "@/lib/verification/queries";
import { CorrectionsForm } from "@/components/verification/corrections-form";

export default async function CorrectionsPage() {
  const profile = await getMemberProfile();
  if (!profile) redirect("/login");

  const corrections = await getMyCorrections();
  if (corrections.length === 0) redirect("/profile");

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Fix your profile
        </h1>
        <p className="text-sm text-muted-foreground">
          The church has asked for a change. Update what&rsquo;s flagged, then
          resubmit.
        </p>
      </div>
      <CorrectionsForm profile={profile} corrections={corrections} />
    </div>
  );
}
