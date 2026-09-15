// Stage 22 -- /onboarding. Server component: gates to REGISTERED, loads the
// profile, computes the resume step (Stage 13's "resume where they left
// off"), and hands both to the client wizard. A bare visit by a
// PROFILE_COMPLETE member is redirected to /dashboard (onboarding is not
// re-enterable by accident -- Stage 17 permissions, Stage 22 checklist test
// 10, unchanged).
//
// Stage 23 Gap 1: a PROFILE_COMPLETE member CAN reopen the same wizard as an
// explicit edit session via /onboarding?edit=1 -- the only place that link
// exists is the "Edit" button on /profile, so this never fires by accident
// and M2's "bare /onboarding redirects" behavior is preserved unchanged. In
// edit mode the wizard starts at step 1 (there's no "resume step" concept
// post-submission -- every step is already filled in) and every step's save
// runs through the same status-aware actions Gap 1 added.
//
// Kept lean on the first render: professions load client-side via
// /api/professions (the profession step needs them, not this page).

import { redirect } from "next/navigation";
import { getMemberProfile } from "@/lib/profile/queries";
import { getMyCorrections } from "@/lib/verification/queries";
import { resumeStep } from "@/lib/profile/resume";
import { FIRST_STEP } from "@/lib/profile/steps";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const editMode = edit === "1";

  const profile = await getMemberProfile();
  if (!profile) redirect("/login");

  if (profile.profileStatus !== "REGISTERED") {
    if (!editMode) redirect("/dashboard");
    // Req 2 isolation: a member with an active NEEDS_CORRECTION track edits
    // through /profile/corrections, which scopes to only the flagged
    // track(s) and resubmits correctly. The general edit wizard here has no
    // such scoping, so it's the wrong tool while a correction is open --
    // send them to the right screen instead.
    const corrections = await getMyCorrections();
    if (corrections.length > 0) redirect("/profile/corrections");
    return (
      <OnboardingWizard startStep={FIRST_STEP} profile={profile} editMode />
    );
  }

  const start = resumeStep(profile);
  return <OnboardingWizard startStep={start} profile={profile} />;
}
