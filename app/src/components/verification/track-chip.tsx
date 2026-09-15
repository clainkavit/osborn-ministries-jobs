// Stage 23 (M3) -- a compact chip for one verification track's status, for
// the admin queue rows. Distinct from the member-facing VerificationBadges
// (which carry the exact approved wording); this is admin-internal shorthand.

import { Badge } from "@/components/ui/badge";

const MEMBERSHIP_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Membership: not submitted",
  PENDING: "Membership: pending",
  CONFIRMED: "Membership: confirmed",
  NEEDS_CORRECTION: "Membership: needs correction",
  SUSPENDED: "Membership: suspended",
};

const CREDENTIALS_LABEL: Record<string, string> = {
  NOT_SUBMITTED: "Credentials: not submitted",
  PENDING: "Credentials: pending",
  REVIEWED: "Credentials: reviewed",
  REVIEW_PENDING: "Credentials: updates pending",
  NEEDS_CORRECTION: "Credentials: needs correction",
};

function tone(status: string): "default" | "secondary" {
  return status === "CONFIRMED" || status === "REVIEWED"
    ? "default"
    : "secondary";
}

export function TrackChip({
  track,
  status,
}: {
  track: "MEMBERSHIP" | "CREDENTIALS";
  status: string;
}) {
  const label =
    track === "MEMBERSHIP"
      ? (MEMBERSHIP_LABEL[status] ?? status)
      : (CREDENTIALS_LABEL[status] ?? status);
  return <Badge variant={tone(status)}>{label}</Badge>;
}
