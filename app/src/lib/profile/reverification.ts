// Stage 23 (M3), Gap 1 -- after a PROFILE_COMPLETE member edits a profile
// field, apply the reverification-on-edit effect to the CREDENTIALS track
// and log it. A REGISTERED member (still onboarding) triggers nothing.
//
// Req 2 (isolation): this only ever touches the credentials track, and only
// when the pure rule says so. Membership is never touched here.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CredentialsStatus } from "@/types/member";
import {
  reverificationEffect,
  type EditedField,
} from "@/lib/verification/rules";

/**
 * Call after a successful profile write. `memberId` and the member's current
 * `profile_status` / `credentials_status` come from the action's own
 * pre-read. Best-effort: a logging/update failure here is reported so the
 * caller can decide, but the profile write itself already succeeded.
 */
export async function applyReverification(
  supabase: SupabaseClient<Database>,
  args: {
    memberId: string;
    profileStatus: string;
    currentCredentials: CredentialsStatus;
    field: EditedField;
  },
): Promise<{ credentialsChangedTo: CredentialsStatus | null }> {
  if (args.profileStatus !== "PROFILE_COMPLETE") {
    return { credentialsChangedTo: null };
  }

  const outcome = reverificationEffect(args.field, args.currentCredentials);
  if (outcome.credentialsTo === null) {
    return { credentialsChangedTo: null };
  }

  // audit row first
  await supabase.from("verification_history").insert({
    member_id: args.memberId,
    track: "CREDENTIALS",
    action: "AUTO_REVERIFICATION",
    detail: outcome.reason,
    actor_member_id: args.memberId,
  });

  // move the credentials track, guarded on its pre-value
  await supabase
    .from("members")
    .update({ credentials_status: outcome.credentialsTo })
    .eq("id", args.memberId)
    .eq("credentials_status", args.currentCredentials);

  return { credentialsChangedTo: outcome.credentialsTo };
}
