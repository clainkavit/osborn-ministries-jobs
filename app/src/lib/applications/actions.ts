"use server";

// Stage 29 (M7) -- application writes. Server-only.
//
// requireAdmin() is replicated here, not imported -- matches the pattern
// already independently duplicated in lib/verification/, lib/opportunities/,
// and lib/matching/ (no shared helper exists to import).
//
// Every state change follows the established M3/M5/M6 discipline exactly:
//   1. authenticate/authorize
//   2. pre-read current status
//   3. evaluate the pure transition predicate (lib/applications/rules.ts)
//   4. guarded update: .eq('id', id).eq('status', from)
//   5. return a controlled AuthActionResult, never throw a raw DB error
//
// member_id is ALWAYS resolved from the caller's own session
// (getCurrentMember().id), never accepted as client input -- same
// discipline as opportunities.created_by and application_outcomes.recorded_by.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import {
  isApplicationTransitionAllowed,
  isApplicationEligible,
  isInterviewScheduleComplete,
  isEligibleForBulkClose,
} from "@/lib/applications/rules";
import { hasNonWithdrawnApplication } from "@/lib/applications/queries";
import { insertApplicationNotification } from "@/lib/notifications/writer";
import type { AuthActionResult } from "@/types/auth";
import type { ApplicationStatus } from "@/types/application";
import type { OpportunityStatus } from "@/types/opportunity";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

async function requireMember() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  return { ok: true as const, member: me };
}

// ---------------------------------------------------------------------------
// Apply -- member-triggered, the one transition with no prior "from" row.
// ---------------------------------------------------------------------------

export async function applyToOpportunity(
  opportunityId: string,
): Promise<AuthActionResult<{ id: string }>> {
  const gate = await requireMember();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("status")
    .eq("id", opportunityId)
    .single();
  if (oppError || !opportunity) {
    return { success: false, error: "That opportunity could not be found." };
  }

  const hasExisting = await hasNonWithdrawnApplication(
    gate.member.id,
    opportunityId,
  );

  const eligibility = isApplicationEligible({
    opportunityStatus: opportunity.status as OpportunityStatus,
    profileStatus: gate.member.profileStatus,
    membershipStatus: gate.member.membershipStatus,
    credentialsStatus: gate.member.credentialsStatus,
    hasExistingApplication: hasExisting,
  });

  if (!eligibility.eligible) {
    const messages: Record<string, string> = {
      NOT_PUBLISHED: "This opportunity is no longer accepting applications.",
      NOT_VERIFIED: "Complete your verification to apply.",
      DUPLICATE: "You've already applied to this opportunity.",
    };
    return {
      success: false,
      error: messages[eligibility.reason!] ?? "You can't apply right now.",
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      member_id: gate.member.id,
      opportunity_id: opportunityId,
      status: "APPLIED",
    })
    .select("id")
    .single();

  if (error || !data) {
    // The DB unique constraint is the second layer of the duplicate guard
    // (a race between the check above and this insert) -- a unique
    // violation surfaces here as a generic insert failure; report the same
    // duplicate copy rather than a raw DB error.
    return {
      success: false,
      error: "You've already applied to this opportunity.",
    };
  }

  return { success: true, data: { id: data.id } };
}

// ---------------------------------------------------------------------------
// Shared guarded-transition helper -- mirrors
// lib/opportunities/actions.ts's guardedOpportunityTransition exactly,
// adapted for this machine's actor-dependent legality.
//
// Stage 30 (M8) extends this to also return the applicant's member_id and
// the opportunity's title on success, since every M8 notification call
// site needs both to compose its notification. This is the ONE point
// every application-status transition already passes through, so reading
// the join here once avoids repeating it at each of the four call sites.
// ---------------------------------------------------------------------------

interface GuardedTransitionSuccess {
  success: true;
  memberId: string;
  opportunityTitle: string;
}
interface GuardedTransitionFailure {
  success: false;
  error: string;
}
type GuardedTransitionResult =
  | GuardedTransitionSuccess
  | GuardedTransitionFailure;

async function guardedApplicationTransition(
  id: string,
  to: ApplicationStatus,
  actor: "MEMBER" | "ADMIN",
  ownerMemberId: string | null,
  extraFields: Record<string, unknown> = {},
): Promise<GuardedTransitionResult> {
  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("applications")
    .select("status, member_id, opportunity_id, opportunities(title)")
    .eq("id", id)
    .single();
  if (readErr || !row) {
    return { success: false, error: "That application could not be found." };
  }

  if (actor === "MEMBER" && row.member_id !== ownerMemberId) {
    return { success: false, error: "Not authorised." };
  }

  const from = row.status as ApplicationStatus;
  if (!isApplicationTransitionAllowed(from, to, actor)) {
    return {
      success: false,
      error: "That change isn't allowed for this application.",
    };
  }

  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      status: to,
      status_updated_at: new Date().toISOString(),
      ...extraFields,
    })
    .eq("id", id)
    .eq("status", from);

  if (updateErr) {
    return { success: false, error: "Couldn't update the application." };
  }

  const opp = row.opportunities as unknown as
    | { title: string }
    | { title: string }[]
    | null;
  const oppRow = Array.isArray(opp) ? opp[0] : opp;

  return {
    success: true,
    memberId: row.member_id,
    opportunityTitle: oppRow?.title ?? "",
  };
}

/** Stage 30 §11 -- the single-recipient compensating-action pattern.
 *  Mirrors lib/verification/actions.ts's existing precedent exactly: on a
 *  notification-insert failure, issue a second, explicit guarded update
 *  reverting the just-committed transition back to its prior status (and
 *  clearing any extraFields this transition itself set), then report
 *  failure to the caller. This is a compensating action, not a rollback of
 *  a database transaction -- no Postgres transaction wraps any of this. */
async function revertApplicationTransition(
  id: string,
  from: ApplicationStatus,
  to: ApplicationStatus,
  revertFields: Record<string, unknown> = {},
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("applications")
    .update({
      status: from,
      status_updated_at: new Date().toISOString(),
      ...revertFields,
    })
    .eq("id", id)
    .eq("status", to);
}

// ---------------------------------------------------------------------------
// Admin transitions.
// ---------------------------------------------------------------------------

export async function markApplicationReviewed(
  id: string,
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  // Stage 12/30: Reviewed is deliberately silent -- no notification exists
  // for this transition.
  const result = await guardedApplicationTransition(id, "REVIEWED", "ADMIN", null);
  if (!result.success) return result;
  return { success: true, data: undefined };
}

export async function shortlistApplication(
  id: string,
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const result = await guardedApplicationTransition(id, "SHORTLISTED", "ADMIN", null);
  if (!result.success) return result;

  const supabase = await createClient();
  const { error: notifErr } = await insertApplicationNotification(
    supabase,
    result.memberId,
    "APPLICATION_SHORTLISTED",
    result.opportunityTitle,
    id,
  );
  if (notifErr) {
    await revertApplicationTransition(id, "REVIEWED", "SHORTLISTED");
    return {
      success: false,
      error: "Couldn't complete shortlisting. Nothing was changed.",
    };
  }

  return { success: true, data: undefined };
}

export async function scheduleInterview(
  id: string,
  input: {
    interviewDate: string;
    interviewTime: string;
    interviewLocation: string;
    interviewInstructions?: string | null;
  },
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  if (
    !isInterviewScheduleComplete({
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      interviewLocation: input.interviewLocation,
    })
  ) {
    return {
      success: false,
      error: "Add a date, time, and location before scheduling the interview.",
    };
  }

  const result = await guardedApplicationTransition(id, "INTERVIEW", "ADMIN", null, {
    interview_date: input.interviewDate,
    interview_time: input.interviewTime,
    interview_location: input.interviewLocation,
    interview_instructions: input.interviewInstructions ?? null,
  });
  if (!result.success) return result;

  const supabase = await createClient();
  const { error: notifErr } = await insertApplicationNotification(
    supabase,
    result.memberId,
    "APPLICATION_INTERVIEW",
    result.opportunityTitle,
    id,
  );
  if (notifErr) {
    await revertApplicationTransition(id, "SHORTLISTED", "INTERVIEW", {
      interview_date: null,
      interview_time: null,
      interview_location: null,
      interview_instructions: null,
    });
    return {
      success: false,
      error: "Couldn't complete scheduling. Nothing was changed.",
    };
  }

  return { success: true, data: undefined };
}

export async function recordOutcome(
  id: string,
  status: "SELECTED" | "REJECTED",
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  // Decision 7: recording the richer ApplicationOutcome classification is a
  // SEPARATE, optional admin action (see recordApplicationOutcome below) --
  // never required to make this transition succeed.
  const result = await guardedApplicationTransition(id, status, "ADMIN", null);
  if (!result.success) return result;

  const supabase = await createClient();
  const { error: notifErr } = await insertApplicationNotification(
    supabase,
    result.memberId,
    status === "SELECTED" ? "APPLICATION_SELECTED" : "APPLICATION_REJECTED",
    result.opportunityTitle,
    id,
  );
  if (notifErr) {
    await revertApplicationTransition(id, "INTERVIEW", status);
    return {
      success: false,
      error: "Couldn't record the outcome. Nothing was changed.",
    };
  }

  return { success: true, data: undefined };
}

/** Decision 7 -- the separate, decoupled ApplicationOutcome entity.
 *  Never required for SELECTED/REJECTED; may be recorded any time
 *  afterward, once, by an admin. notes are admin-internal (never exposed
 *  to the member -- see queries.ts, which never reads this table for a
 *  member-facing response). */
export async function recordApplicationOutcome(
  applicationId: string,
  outcome:
    | "HIRED"
    | "CONTRACT_AWARDED"
    | "PROJECT_COMPLETED"
    | "SERVICE_DELIVERED"
    | "CONNECTED"
    | "NOT_SELECTED"
    | "CANCELLED"
    | "NO_OUTCOME",
  notes?: string | null,
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase.from("application_outcomes").upsert(
    {
      application_id: applicationId,
      outcome,
      recorded_by: gate.admin.id,
      notes: notes ?? null,
    },
    { onConflict: "application_id" },
  );

  if (error) {
    return { success: false, error: "Couldn't record the outcome." };
  }
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Withdraw -- member-triggered, own application only (Decision 4).
// ---------------------------------------------------------------------------

export async function withdrawApplication(id: string): Promise<AuthActionResult> {
  const gate = await requireMember();
  if (!gate.ok) return { success: false, error: gate.error };
  // Decision 19: withdrawal creates no notification, to the member or any
  // admin -- nothing to do here beyond the transition itself.
  const result = await guardedApplicationTransition(
    id,
    "WITHDRAWN",
    "MEMBER",
    gate.member.id,
  );
  if (!result.success) return result;
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Close remaining applications -- Decision 9. A NAMED, narrow, explicit
// action for the opportunity-close/cancel workflow ONLY. Not a general
// bulk-management feature; not triggered automatically by any opportunity
// status change (this action must always be called deliberately).
// ---------------------------------------------------------------------------

/** Stage 30 Decision 21(c) -- application status changes always commit
 *  regardless of notification outcome. A notification failure never rolls
 *  back the application's already-committed REJECTED status and never
 *  prevents another eligible application in the same call from being
 *  processed. Failures are counted and returned, never silently swallowed.
 *  No retry/queue/delivery-service/new admin UI is built -- a failed
 *  notification insert is recorded in the returned count and nothing more. */
export async function closeRemainingApplications(
  opportunityId: string,
): Promise<
  AuthActionResult<{ applicationsClosed: number; notificationsFailed: number }>
> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data: opportunity, error: oppErr } = await supabase
    .from("opportunities")
    .select("title")
    .eq("id", opportunityId)
    .single();
  if (oppErr || !opportunity) {
    return { success: false, error: "That opportunity could not be found." };
  }

  const { data: rows, error: readErr } = await supabase
    .from("applications")
    .select("id, status, member_id")
    .eq("opportunity_id", opportunityId);
  if (readErr) {
    return { success: false, error: "Couldn't load applications." };
  }

  const eligible = (rows ?? []).filter((r) =>
    isEligibleForBulkClose(r.status as ApplicationStatus),
  );

  let applicationsClosed = 0;
  let notificationsFailed = 0;

  // Processed one application at a time, on purpose (Decision 21c): each
  // row's status update is guarded independently (.eq('status', from)
  // re-asserted per row, closing the same concurrent-modification race the
  // prior bulk .in() update guarded, but now per-row so one row's
  // notification failure can never affect another row's already-committed
  // status change).
  for (const row of eligible) {
    const from = row.status as ApplicationStatus;
    const { data: updated, error: updateErr } = await supabase
      .from("applications")
      .update({ status: "REJECTED", status_updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", from)
      .select("id");

    if (updateErr || !updated || updated.length === 0) {
      // This specific row's status did not change (e.g. it was already
      // moved by a concurrent action between the read above and this
      // write) -- not counted as closed, and no notification is attempted
      // for it. Not a notification failure; the application-state
      // operation itself did not occur for this row.
      continue;
    }

    applicationsClosed += 1;

    const { error: notifErr } = await insertApplicationNotification(
      supabase,
      row.member_id,
      "APPLICATION_OPPORTUNITY_CLOSED",
      opportunity.title,
      row.id,
    );
    if (notifErr) {
      // Decision 21(c): the status change already committed and MUST NOT
      // be reverted because the notification failed. Count the failure and
      // continue to the next eligible application -- never abort the batch,
      // never swallow the failure silently.
      notificationsFailed += 1;
    }
  }

  return {
    success: true,
    data: { applicationsClosed, notificationsFailed },
  };
}
