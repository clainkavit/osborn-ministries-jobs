// Stage 23 (M3) -- Verification Review. Two-column desktop (profile left,
// controls right), stacked mobile.

import { notFound } from "next/navigation";
import {
  getMemberProfileForAdmin,
  getVerificationHistory,
} from "@/lib/verification/queries";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/member";
import { ReviewPanel } from "@/components/verification/review-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function VerificationReviewPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const profile = await getMemberProfileForAdmin(memberId);
  if (!profile) notFound();
  const history = await getVerificationHistory(memberId);

  const professionName =
    profile.profession?.name ?? profile.professionFreetext ?? "—";
  const cv = profile.documents.find((d) => d.type === "CV");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {professionName}
          {profile.jobTitle ? ` · ${profile.jobTitle}` : ""} ·{" "}
          {profile.location ?? "—"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        {/* left: the submitted profile */}
        <div className="space-y-4">
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
                <p className="text-sm text-muted-foreground">
                  No skills listed.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">CV</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {cv ? (
                <span className="font-medium">{cv.filename}</span>
              ) : (
                <span className="text-muted-foreground">No CV uploaded.</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Verification history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {history.length === 0 ? (
                <p className="text-muted-foreground">No history yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="border-b pb-2 last:border-0">
                    <p>
                      <span className="font-medium">{h.track}</span> —{" "}
                      {h.action.replace(/_/g, " ").toLowerCase()}
                      {h.detail ? ` (${h.detail})` : ""}
                    </p>
                    {h.note ? (
                      <p className="text-xs text-muted-foreground">
                        Note: {h.note}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* right: verification controls */}
        <div className="space-y-4">
          <ReviewPanel
            memberId={memberId}
            membershipStatus={profile.membershipStatus}
            credentialsStatus={profile.credentialsStatus}
          />
        </div>
      </div>
    </div>
  );
}
