// Stage 23 (M3) + Stage 30 (M8) -- server-only. Insert an in-app
// notification with the Stage 12 copy stored at creation.
//
// This is a same-request, same-client sequence of separate SQL statements,
// not a database transaction -- no Postgres transaction/RPC wraps the
// notification insert and whatever business-state write preceded it. Each
// caller is responsible for its own failure handling per Stage 30 §11: the
// three M3-era verification handlers already issue a compensating update
// to revert their own prior writes on a notification-insert failure (an
// application-level compensating action, not a rollback of a real DB
// transaction); M8's single-recipient application actions follow the same
// pattern; closeRemainingApplications follows Decision 21(c) instead
// (status changes always commit regardless of notification outcome).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  NOTIFICATION_COPY,
  applicationNotificationCopy,
  type ApplicationNotificationType,
} from "@/types/notification";

/** Insert one M3-era notification (fixed copy, no interpolation) for
 *  `memberId`. Returns the insert error (or null). The caller is
 *  responsible for treating a non-null error as a failure of the
 *  triggering action per its own compensating-action rules. */
export async function insertNotification(
  supabase: SupabaseClient<Database>,
  memberId: string,
  type: "MEMBERSHIP_CONFIRMED" | "CREDENTIALS_REVIEWED" | "CORRECTION_REQUESTED",
): Promise<{ error: string | null }> {
  const { body, relatedUrl } = NOTIFICATION_COPY[type];
  const { error } = await supabase.from("notifications").insert({
    member_id: memberId,
    type,
    body_text: body,
    related_url: relatedUrl,
  });
  return { error: error ? error.message : null };
}

/** Insert one M8 application-event notification for `memberId`. Copy is
 *  resolved from Stage 12's exact text with the opportunity title
 *  interpolated by the caller (who already has it loaded from the same
 *  row being transitioned). Returns the insert error (or null) -- same
 *  failure-reporting contract as insertNotification above. */
export async function insertApplicationNotification(
  supabase: SupabaseClient<Database>,
  memberId: string,
  type: ApplicationNotificationType,
  opportunityTitle: string,
  applicationId: string,
): Promise<{ error: string | null }> {
  const { body, relatedUrl } = applicationNotificationCopy(
    type,
    opportunityTitle,
    applicationId,
  );
  const { error } = await supabase.from("notifications").insert({
    member_id: memberId,
    type,
    body_text: body,
    related_url: relatedUrl,
  });
  return { error: error ? error.message : null };
}
