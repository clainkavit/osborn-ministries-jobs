"use server";

// Stage 23 (M3) -- verification write actions.
//
// Req 3 (transaction integrity): every admin decision must land the status
// update, the VerificationHistory row, AND the notification -- or none of the
// visible effect. Supabase's JS client has no client-side multi-statement
// transaction, so the actions do it in a fixed order and TREAT ANY STEP
// FAILURE AS A FULL FAILURE: if the history insert or the notification insert
// fails after the status update, the action rolls the status back and returns
// an error. The status update is written last-but-one specifically so the
// only thing after it (the notification) is the sole rollback case, and the
// history row (the audit trail -- the thing that must never be missing) is
// written and confirmed BEFORE the status changes.
//
// Order per decision:
//   1. auth + assert admin
//   2. load target member; assert PROFILE_COMPLETE and the target track is
//      actionable (PENDING or REVIEW_PENDING)
//   3. INSERT verification_history  (audit first -- if this fails, nothing
//      changed, return error)
//   4. UPDATE members.<track>_status  (guarded by the pre-read status so a
//      concurrent change can't be clobbered)
//   5. INSERT notification  (if this fails: roll the status back to its
//      pre-value, delete the history row, return error)
//
// Req 2 (correction-flow isolation): resubmitForReview moves ONLY the
// track(s) currently in NEEDS_CORRECTION to PENDING. It never touches a
// track that isn't flagged.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import { insertNotification } from "@/lib/notifications/writer";
import { isDecisionActionable } from "@/lib/verification/rules";
import type { AuthActionResult } from "@/types/auth";
import type {
  VerificationDecision,
  VerificationTrack,
} from "@/types/verification";
type VerificationNotificationType =
  | "MEMBERSHIP_CONFIRMED"
  | "CREDENTIALS_REVIEWED"
  | "CORRECTION_REQUESTED";
import type { CredentialsStatus, MembershipStatus } from "@/types/member";

type StatusColumn = "membership_status" | "credentials_status";

const TRACK_COLUMN: Record<VerificationTrack, StatusColumn> = {
  MEMBERSHIP: "membership_status",
  CREDENTIALS: "credentials_status",
};

const APPROVE_TO: Record<VerificationTrack, MembershipStatus | CredentialsStatus> =
  {
    MEMBERSHIP: "CONFIRMED",
    CREDENTIALS: "REVIEWED",
  };

/** Guarded one-column status update, branched on the concrete column so
 *  Supabase's typed query builder accepts both the SET value and the WHERE
 *  guard (a computed key collapses to `never`). Returns rows-affected. */
async function guardedStatusUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  column: StatusColumn,
  from: string,
  to: string,
): Promise<{ error: string | null; count: number }> {
  if (column === "membership_status") {
    const { error, count } = await supabase
      .from("members")
      .update({ membership_status: to as MembershipStatus }, { count: "exact" })
      .eq("id", memberId)
      .eq("membership_status", from as MembershipStatus);
    return { error: error ? error.message : null, count: count ?? 0 };
  }
  const { error, count } = await supabase
    .from("members")
    .update({ credentials_status: to as CredentialsStatus }, { count: "exact" })
    .eq("id", memberId)
    .eq("credentials_status", from as CredentialsStatus);
  return { error: error ? error.message : null, count: count ?? 0 };
}

const APPROVE_NOTIFICATION: Record<VerificationTrack, VerificationNotificationType> = {
  MEMBERSHIP: "MEMBERSHIP_CONFIRMED",
  CREDENTIALS: "CREDENTIALS_REVIEWED",
};

// isDecisionActionable(decision, current) -- see lib/verification/rules.ts
// for the full rationale and the unit-tested pure predicate.

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

interface VerifyInput {
  decision: VerificationDecision;
  note?: string | null;
}

async function verifyTrack(
  memberId: string,
  track: VerificationTrack,
  input: VerifyInput,
): Promise<AuthActionResult<{ newStatus: string }>> {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const supabase = await createClient();
  const column = TRACK_COLUMN[track];

  // 2. load + assert
  const { data: member, error: readErr } = await supabase
    .from("members")
    .select(`id, profile_status, ${column}`)
    .eq("id", memberId)
    .single();
  if (readErr || !member) {
    return { success: false, error: "That member could not be found." };
  }
  if (member.profile_status !== "PROFILE_COMPLETE") {
    return {
      success: false,
      error: "That member has not submitted a profile for verification.",
    };
  }
  const current = (member as Record<string, string>)[column];
  if (!isDecisionActionable(input.decision, current)) {
    return {
      success: false,
      error:
        current === "NEEDS_CORRECTION"
          ? "This track is waiting on the member's correction."
          : input.decision === "APPROVED"
            ? `This track is already ${current.toLowerCase()}.`
            : `This track can't be sent back from ${current.toLowerCase()}.`,
    };
  }

  const isApprove = input.decision === "APPROVED";
  const newStatus = isApprove ? APPROVE_TO[track] : "NEEDS_CORRECTION";
  const note = input.note?.trim() ? input.note.trim() : null;

  // 3. audit row FIRST
  const { data: historyRow, error: histErr } = await supabase
    .from("verification_history")
    .insert({
      member_id: memberId,
      track,
      action: isApprove ? "APPROVED" : "NEEDS_CORRECTION",
      note,
      actor_admin_id: gate.admin.id,
    })
    .select("id")
    .single();
  if (histErr || !historyRow) {
    return {
      success: false,
      error: "Couldn't record this decision. Nothing was changed.",
    };
  }

  // 4. status update, guarded by the pre-read value
  const upd = await guardedStatusUpdate(
    supabase,
    memberId,
    column,
    current,
    newStatus,
  );
  if (upd.error || upd.count === 0) {
    // roll back the audit row -- the decision did not take effect
    await supabase.from("verification_history").delete().eq("id", historyRow.id);
    return {
      success: false,
      error: "Couldn't save the decision. Nothing was changed.",
    };
  }

  // 5. notification
  const notifType: VerificationNotificationType = isApprove
    ? APPROVE_NOTIFICATION[track]
    : "CORRECTION_REQUESTED";
  const { error: notifErr } = await insertNotification(
    supabase,
    memberId,
    notifType,
  );
  if (notifErr) {
    // roll everything back: status to its pre-value, delete the audit row
    await guardedStatusUpdate(supabase, memberId, column, newStatus, current);
    await supabase.from("verification_history").delete().eq("id", historyRow.id);
    return {
      success: false,
      error: "Couldn't notify the member. Nothing was changed — try again.",
    };
  }

  return { success: true, data: { newStatus } };
}

export async function verifyMembership(
  memberId: string,
  input: VerifyInput,
): Promise<AuthActionResult<{ newStatus: string }>> {
  return verifyTrack(memberId, "MEMBERSHIP", input);
}

export async function verifyCredentials(
  memberId: string,
  input: VerifyInput,
): Promise<AuthActionResult<{ newStatus: string }>> {
  return verifyTrack(memberId, "CREDENTIALS", input);
}

// ---------------------------------------------------------------------------
// Member: "I've fixed it" -- resubmit ONLY the flagged track(s).
// Req 2: never touch a track that isn't in NEEDS_CORRECTION.
// ---------------------------------------------------------------------------
export async function resubmitForReview(): Promise<AuthActionResult> {
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "You need to sign in." };
  if (member.profileStatus !== "PROFILE_COMPLETE") {
    return { success: false, error: "There's nothing to resubmit." };
  }

  const flagged: VerificationTrack[] = [];
  if (member.membershipStatus === "NEEDS_CORRECTION") flagged.push("MEMBERSHIP");
  if (member.credentialsStatus === "NEEDS_CORRECTION")
    flagged.push("CREDENTIALS");

  if (flagged.length === 0) {
    return { success: false, error: "Your profile isn't awaiting a correction." };
  }

  const supabase = await createClient();

  for (const track of flagged) {
    const column = TRACK_COLUMN[track];
    // audit row first
    const { data: histRow, error: histErr } = await supabase
      .from("verification_history")
      .insert({
        member_id: member.id,
        track,
        action: "RESUBMITTED",
        actor_member_id: member.id,
      })
      .select("id")
      .single();
    if (histErr || !histRow) {
      return {
        success: false,
        error: "Couldn't resubmit. Try again.",
      };
    }
    // move ONLY this flagged track to PENDING, guarded on NEEDS_CORRECTION
    const upd = await guardedStatusUpdate(
      supabase,
      member.id,
      column,
      "NEEDS_CORRECTION",
      "PENDING",
    );
    if (upd.error || upd.count === 0) {
      await supabase.from("verification_history").delete().eq("id", histRow.id);
      return { success: false, error: "Couldn't resubmit. Try again." };
    }
  }

  return { success: true, data: undefined };
}
