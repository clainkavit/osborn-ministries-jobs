// Stage 23 (M3) + Stage 30 (M8). In-app notification type -- M3's original
// 3-event subset, extended by M8 with M7's application events (Stage 30
// §3/§14). Still the minimal subset of Stage 15's Notification entity --
// `related_url` is a single resolved string, not the original polymorphic
// related_entity_type/related_entity_id design (a simplification M3 already
// made and M8 continues, unchanged).

export type NotificationType =
  | "MEMBERSHIP_CONFIRMED"
  | "CREDENTIALS_REVIEWED"
  | "CORRECTION_REQUESTED"
  | "APPLICATION_SHORTLISTED"
  | "APPLICATION_INTERVIEW"
  | "APPLICATION_SELECTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_OPPORTUNITY_CLOSED";

export interface AppNotification {
  id: string;
  memberId: string;
  type: NotificationType;
  bodyText: string;
  relatedUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Stage 12 copy, verbatim, for the 3 M3-era types with no interpolation --
 *  stored at creation, keyed here for the writer. */
export const NOTIFICATION_COPY: Record<
  "MEMBERSHIP_CONFIRMED" | "CREDENTIALS_REVIEWED" | "CORRECTION_REQUESTED",
  { body: string; relatedUrl: string }
> = {
  MEMBERSHIP_CONFIRMED: {
    body: "Your membership has been confirmed.",
    relatedUrl: "/profile",
  },
  CREDENTIALS_REVIEWED: {
    body: "Your professional information has been reviewed.",
    relatedUrl: "/profile",
  },
  CORRECTION_REQUESTED: {
    body: "Your profile needs a correction. See what's needed.",
    relatedUrl: "/profile/corrections",
  },
};

export type ApplicationNotificationType =
  | "APPLICATION_SHORTLISTED"
  | "APPLICATION_INTERVIEW"
  | "APPLICATION_SELECTED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_OPPORTUNITY_CLOSED";

/** Stage 12 copy, verbatim, for M8's application events -- these need the
 *  opportunity title interpolated at write time (the caller already has
 *  it loaded from the same row it's transitioning), so this is a function
 *  of (opportunityTitle, applicationId) rather than a fixed lookup entry.
 *  relatedUrl is always the application's own detail page. */
export function applicationNotificationCopy(
  type: ApplicationNotificationType,
  opportunityTitle: string,
  applicationId: string,
): { body: string; relatedUrl: string } {
  const relatedUrl = `/applications/${applicationId}`;
  switch (type) {
    case "APPLICATION_SHORTLISTED":
      return {
        body: `You've been shortlisted for ${opportunityTitle}.`,
        relatedUrl,
      };
    case "APPLICATION_INTERVIEW":
      return {
        body: `You've been invited to interview for ${opportunityTitle}.`,
        relatedUrl,
      };
    case "APPLICATION_SELECTED":
      return {
        body: `Congratulations — you've been selected for ${opportunityTitle}.`,
        relatedUrl,
      };
    case "APPLICATION_REJECTED":
      return {
        body: `You weren't selected for ${opportunityTitle} this time.`,
        relatedUrl,
      };
    case "APPLICATION_OPPORTUNITY_CLOSED":
      return {
        body: `${opportunityTitle} has closed. Your application wasn't carried forward.`,
        relatedUrl,
      };
  }
}
