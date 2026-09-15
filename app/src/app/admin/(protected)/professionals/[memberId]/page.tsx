// Stage 25 (M4) -- Admin Professional Profile. The admin's read-only view of
// one directory-visible member: professional information, experience,
// education, skills, certifications (empty state -- no upload UI exists
// anywhere yet), documents, verification history. Two-column desktop,
// stacked mobile (Stage 17).
//
// Decision 5: this is the directory's real destination -- NOT Verification
// Review. A "Review verification" link into Verification Review appears
// only when this member has something actionable (see
// hasActionableReverification in lib/verification/rules.ts): a
// directory-visible member is always membership=CONFIRMED, so the only way
// they can also need attention is credentials=REVIEW_PENDING.
//
// Stage 29 (M7) enables Contact/Shortlist per Decision 12: applications
// remain member-created only, so neither button creates one. "Shortlist"
// links to this member's own most relevant existing application (if any)
// so an admin can act on it there -- it never fabricates a new
// application from this screen. "Contact" shows phone/email directly on
// THIS page once the member has at least one Shortlisted-or-later
// application anywhere (Stage 8's "shortlisted for at least one active
// opportunity" rule) -- computed from getApplicationsForMember, never a
// CSS-only reveal.
//
// notFound() if the member isn't directory-visible -- an admin reaching a
// stale/direct link for a member the directory itself would never show
// should not see a working profile here either (Stage 20's RLS-testing
// note: "an unverified member cannot appear in the directory").

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMemberProfileForAdmin,
  getVerificationHistory,
} from "@/lib/verification/queries";
import { isMemberInDirectory } from "@/lib/directory/queries";
import { hasActionableReverification } from "@/lib/verification/rules";
import { getApplicationsForMember } from "@/lib/applications/queries";
import { EMPLOYMENT_STATUS_LABELS } from "@/types/member";
import { VerificationBadges } from "@/components/profile/verification-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CONTACT_VISIBLE_STATUSES = new Set([
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
]);

export default async function AdminProfessionalProfilePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  const visible = await isMemberInDirectory(memberId);
  if (!visible) notFound();

  const profile = await getMemberProfileForAdmin(memberId);
  if (!profile) notFound();
  const history = await getVerificationHistory(memberId);

  const professionName =
    profile.profession?.name ?? profile.professionFreetext ?? "—";
  const cv = profile.documents.find((d) => d.type === "CV");
  const otherDocuments = profile.documents.filter((d) => d.type !== "CV");

  const showReviewLink = hasActionableReverification(profile.credentialsStatus);

  const memberApplications = await getApplicationsForMember(memberId);
  const shortlistedOrLater = memberApplications.find((a) =>
    CONTACT_VISIBLE_STATUSES.has(a.status),
  );
  const contactUnlocked = !!shortlistedOrLater;
  const mostRecentApplication = memberApplications[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {professionName}
            {profile.jobTitle ? ` · ${profile.jobTitle}` : ""} ·{" "}
            {profile.location ?? "—"}
          </p>
          <div className="mt-2">
            <VerificationBadges
              membership={profile.membershipStatus}
              credentials={profile.credentialsStatus}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Decision 5: conditional, not blanket. Only when this member has
              something actionable. */}
          {showReviewLink ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/verification/${memberId}`}>
                Review verification
              </Link>
            </Button>
          ) : null}
          {contactUnlocked ? (
            <Button size="sm" disabled>
              {[profile.phone, profile.email].filter(Boolean).join(" · ") ||
                "No contact on file"}
            </Button>
          ) : (
            <Button size="sm" disabled title="Available once shortlisted for an opportunity">
              Contact
            </Button>
          )}
          {mostRecentApplication ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/applications/${mostRecentApplication.id}`}>
                View application
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              title="This member has no application yet -- Shortlisting happens by reviewing an application they've submitted"
            >
              Shortlist
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Professional information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <Row label="Profession" value={professionName} />
                <Row label="Job title" value={profile.jobTitle ?? "—"} />
                <Row label="Industry" value={profile.industry ?? "—"} />
                <Row label="Location" value={profile.location ?? "—"} />
                <Row
                  label="Employment"
                  value={
                    profile.employmentStatus
                      ? `${EMPLOYMENT_STATUS_LABELS[profile.employmentStatus]} · ${profile.yearsOfExperience ?? "—"} years`
                      : "—"
                  }
                />
                <Row
                  label="Availability"
                  value={
                    profile.availability === "NOT_SET"
                      ? "—"
                      : profile.availability
                          .toLowerCase()
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
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
              <CardTitle className="text-sm">Certifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {/* No certification-upload surface exists anywhere in the
                  product yet (migration 002's own comment: "M2 has no
                  certifications UI") -- this is always empty in M4, by
                  design, not a missing feature to add here. */}
              <p className="text-muted-foreground">No certifications listed.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {cv ? (
                <p>
                  <span className="font-medium">CV:</span> {cv.filename}
                </p>
              ) : (
                <p className="text-muted-foreground">No CV uploaded.</p>
              )}
              {otherDocuments.map((d) => (
                <p key={d.id}>
                  <span className="font-medium">{d.type}:</span> {d.filename}
                </p>
              ))}
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

        <div className="space-y-4">
          {/* Stage 25: no Applications entity exists in M4, so there is
              nothing to show here yet -- an honest empty state, matching
              Stage 3's mockup section name without inventing data. */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Applications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">
                No applications yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
