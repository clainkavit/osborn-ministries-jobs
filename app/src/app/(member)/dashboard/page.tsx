// Stage 21 §21 (M1) + Stage 22 (M2). Member dashboard -- honest state, no
// fake numbers.
//
// Kept lean: a member who hasn't submitted (profile_status = REGISTERED)
// only needs the member row -- the CTA routes to /onboarding, which computes
// the exact resume step itself. Only a submitted member's dashboard loads
// the full profile (for the verification badges + availability).

import Link from "next/link";
import { getCurrentMember } from "@/lib/auth/queries";
import { getMyCorrections } from "@/lib/verification/queries";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { AvailabilityToggle } from "@/components/profile/availability-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MemberDashboardPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const submitted = member.profileStatus === "PROFILE_COMPLETE";
  const corrections = submitted ? await getMyCorrections() : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome, {member.firstName}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {submitted
            ? "Your profile is with the church for review."
            : "Complete your professional profile so the church can connect your skills with real opportunities."}
        </p>
      </div>

      {corrections.length > 0 ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-medium">Your profile needs a correction</p>
                <p className="text-xs text-muted-foreground">
                  {corrections
                    .map((c) =>
                      c.track === "MEMBERSHIP" ? "Membership" : "Credentials",
                    )
                    .join(" and ")}{" "}
                  flagged. Update what’s needed and resubmit.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/profile/corrections">Fix your profile</Link>
              </Button>
            </div>
            {/* The admin's note per flagged track, visible on the dashboard --
                Stage 6 Journey 2: "Dashboard shows a flagged item ... with
                the admin's note visible." */}
            <div className="space-y-1.5">
              {corrections.map((c) => (
                <p key={c.track} className="text-sm">
                  <span className="font-medium">
                    {c.track === "MEMBERSHIP" ? "Membership" : "Credentials"}:
                  </span>{" "}
                  {c.note ?? "The church asked for a change but left no note."}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!submitted ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm">
              <p className="font-medium">Your professional profile</p>
              <p className="text-xs text-muted-foreground">
                Pick up where you left off
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/onboarding">Continue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <VerificationBadges
                membership={member.membershipStatus}
                credentials={member.credentialsStatus}
              />
            ) : (
              <Badge variant="secondary">Not submitted yet</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityToggle current={member.availability} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-sm text-muted-foreground">Coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
