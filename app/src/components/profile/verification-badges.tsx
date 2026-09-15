// Stage 13 regression scenario + Stage 3 resolved copy. The two verification
// badges must read as "Membership confirmed" / "Credentials reviewed" (or
// their Pending / Needs-correction forms), NEVER a bare "Verified". Kept in
// one component so every screen renders them identically.

import { Badge } from "@/components/ui/badge";
import type { MembershipStatus, CredentialsStatus } from "@/types/member";

function membershipLabel(s: MembershipStatus): {
  text: string;
  tone: "ok" | "pending" | "warn";
} {
  switch (s) {
    case "CONFIRMED":
      return { text: "Membership confirmed", tone: "ok" };
    case "PENDING":
      return { text: "Membership — in review", tone: "pending" };
    case "NEEDS_CORRECTION":
      return { text: "Membership — needs correction", tone: "warn" };
    case "SUSPENDED":
      return { text: "Membership suspended", tone: "warn" };
    default:
      return { text: "Membership not submitted", tone: "pending" };
  }
}

function credentialsLabel(s: CredentialsStatus): {
  text: string;
  tone: "ok" | "pending" | "warn";
} {
  switch (s) {
    case "REVIEWED":
      return { text: "Credentials reviewed", tone: "ok" };
    case "PENDING":
    case "REVIEW_PENDING":
      return { text: "Credentials — in review", tone: "pending" };
    case "NEEDS_CORRECTION":
      return { text: "Credentials — needs correction", tone: "warn" };
    default:
      return { text: "Credentials not submitted", tone: "pending" };
  }
}

export function VerificationBadges({
  membership,
  credentials,
}: {
  membership: MembershipStatus;
  credentials: CredentialsStatus;
}) {
  const m = membershipLabel(membership);
  const c = credentialsLabel(credentials);
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={m.tone === "ok" ? "default" : "secondary"}>{m.text}</Badge>
      <Badge variant={c.tone === "ok" ? "default" : "secondary"}>{c.text}</Badge>
    </div>
  );
}
