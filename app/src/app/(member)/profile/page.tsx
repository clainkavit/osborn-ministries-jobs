// Stage 22 -- /profile. Replaces M1's placeholder. Read view of the completed
// profile with verification badges (resolved copy -- Stage 13 regression
// scenario). A REGISTERED member who hasn't finished onboarding is sent into
// /onboarding at their resume step.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberProfile } from "@/lib/profile/queries";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/member";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const profile = await getMemberProfile();
  if (!profile) redirect("/login");
  if (profile.profileStatus === "REGISTERED") redirect("/onboarding");

  const professionName =
    profile.profession?.name ?? profile.professionFreetext ?? "—";
  const cv = profile.documents.find((d) => d.type === "CV");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {profile.firstName} {profile.lastName}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {professionName}
                {profile.jobTitle ? ` · ${profile.jobTitle}` : ""}
              </p>
              {profile.location ? (
                <p className="text-sm text-muted-foreground">
                  {profile.location}
                </p>
              ) : null}
            </div>
            <Button asChild variant="ghost" size="sm">
              {/* Stage 23 Gap 1: PROFILE_COMPLETE reopens the wizard as an
                  explicit edit session via ?edit=1 -- a bare /onboarding
                  visit still redirects to /dashboard (M2 test 10,
                  unchanged). */}
              <Link href="/onboarding?edit=1">Edit</Link>
            </Button>
          </div>
          <div className="mt-3">
            <VerificationBadges
              membership={profile.membershipStatus}
              credentials={profile.credentialsStatus}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {profile.employmentStatus
                ? `${EMPLOYMENT_STATUS_LABELS[profile.employmentStatus]} · ${profile.yearsOfExperience ?? "—"} years`
                : "—"}
            </p>
            {profile.experience.map((x) => (
              <div key={x.id}>
                <p className="font-medium">
                  {x.position} — {x.organization}
                </p>
                <p className="text-xs text-muted-foreground">
                  {x.startDate ?? "—"} to{" "}
                  {x.isCurrent ? "Present" : (x.endDate ?? "—")}
                </p>
              </div>
            ))}
            {profile.experience.length === 0 ? (
              <p className="text-muted-foreground">No roles listed.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.education.map((e) => (
              <div key={e.id}>
                <p className="font-medium">
                  {e.qualification} — {e.institution}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.fieldOfStudy ? `${e.fieldOfStudy} · ` : ""}
                  {e.startYear ?? "—"} to{" "}
                  {e.isCurrent ? "Present" : (e.endYear ?? "—")}
                </p>
              </div>
            ))}
            {profile.education.length === 0 ? (
              <p className="text-muted-foreground">No education listed.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <Badge key={s.id} variant="secondary">
                {s.name}
              </Badge>
            ))}
            {profile.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills listed.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {cv ? (
              <p className="font-medium">{cv.filename}</p>
            ) : (
              <p className="text-muted-foreground">No CV uploaded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
