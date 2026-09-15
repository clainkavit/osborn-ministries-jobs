"use server";

// Stage 27 (M5) -- opportunity write actions.
//
// requireAdmin() is intentionally a private, unexported function
// replicated here, matching the existing (if duplicated) pattern already
// used independently in lib/verification/actions.ts and
// lib/verification/queries.ts -- there is no shared/exported version to
// import (verified directly against the live codebase before writing this
// file). Extracting one shared helper is a reasonable future cleanup, not
// part of M5's scope.
//
// Transition guard mirrors lib/verification/actions.ts's guardedStatusUpdate
// + verifyTrack pattern exactly: read current status, check
// isOpportunityTransitionAllowed(from, to), reject with a clear error if
// not, then a single .update(...).eq('id', id).eq('status', from) guarded
// against a concurrent-change race.
//
// Champion §23 item 6: no audit-trail table for opportunity transitions.
// Champion §23 item 7: saveOpportunityStep only ever succeeds against a
// DRAFT opportunity -- a Published opportunity's core content can never be
// edited through this path, only through the six named status transitions.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import {
  isOpportunityTransitionAllowed,
  checkOpportunityCompleteness,
  OPPORTUNITY_MISSING_FIELD_LABEL,
} from "@/lib/opportunities/rules";
import {
  opportunityTypeSchema,
  opportunityDetailsSchema,
  opportunityRequirementsSchema,
} from "@/lib/opportunities/schemas";
import type { AuthActionResult } from "@/types/auth";
import type { OpportunityStatus } from "@/types/opportunity";
import type { EducationLevel } from "@/types/member";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

/** Guarded one-column status update -- read current status, check the
 *  transition is legal, then .eq('status', from) guarded write. Mirrors
 *  lib/verification/actions.ts's guardedStatusUpdate exactly, adapted for
 *  opportunities' single status column (no computed-key issue here, so no
 *  branch-per-column is needed the way members' two tracks required). */
async function guardedOpportunityTransition(
  id: string,
  to: OpportunityStatus,
  extraFields: Record<string, unknown> = {},
): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("opportunities")
    .select("status")
    .eq("id", id)
    .single();
  if (readErr || !row) {
    return { success: false, error: "That opportunity could not be found." };
  }

  const from = row.status as OpportunityStatus;
  if (!isOpportunityTransitionAllowed(from, to)) {
    return {
      success: false,
      error: `That status doesn't allow this action.`,
    };
  }

  const { error, count } = await supabase
    .from("opportunities")
    .update({ status: to, ...extraFields }, { count: "exact" })
    .eq("id", id)
    .eq("status", from);

  if (error || count === 0) {
    return {
      success: false,
      error: "Couldn't update the opportunity. Try again.",
    };
  }
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Create + per-step save (Draft only)
// ---------------------------------------------------------------------------

/** Creates a DRAFT opportunity from step 1's Type selection. created_by is
 *  always set server-side from the authenticated admin's own resolved
 *  member id -- never accepted as client input, same discipline
 *  register()'s auth_user_id already uses. */
export async function createOpportunity(
  raw: unknown,
): Promise<AuthActionResult<{ id: string }>> {
  const parsed = opportunityTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      title: "",
      type: parsed.data.type,
      organization_name: "",
      status: "DRAFT",
      created_by: gate.admin.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Couldn't start a new opportunity." };
  }
  return { success: true, data: { id: data.id } };
}

async function requireDraftOwnedByAdmin(id: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("opportunities")
    .select("status")
    .eq("id", id)
    .single();
  if (error || !row) {
    return { ok: false as const, error: "That opportunity could not be found." };
  }
  if (row.status !== "DRAFT") {
    // Champion §23 item 7: Published content is never editable through
    // this path -- only DRAFT. Not a state-machine transition error, a
    // scope boundary.
    return {
      ok: false as const,
      error: "This opportunity can no longer be edited.",
    };
  }
  return { ok: true as const, supabase };
}

/** Step 1 (Type) re-save -- lets the admin change type while still Draft. */
export async function saveOpportunityType(
  id: string,
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = opportunityTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireDraftOwnedByAdmin(id);
  if (!gate.ok) return { success: false, error: gate.error };

  const { error } = await gate.supabase
    .from("opportunities")
    .update({ type: parsed.data.type })
    .eq("id", id)
    .eq("status", "DRAFT");

  if (error) return { success: false, error: "Couldn't save. Try again." };
  return { success: true, data: undefined };
}

/** Step 2 (Details) save. */
export async function saveOpportunityDetails(
  id: string,
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = opportunityDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireDraftOwnedByAdmin(id);
  if (!gate.ok) return { success: false, error: gate.error };

  const { error } = await gate.supabase
    .from("opportunities")
    .update({
      title: parsed.data.title,
      organization_name: parsed.data.organizationName,
      location: parsed.data.location ?? null,
      description: parsed.data.description ?? null,
    })
    .eq("id", id)
    .eq("status", "DRAFT");

  if (error) return { success: false, error: "Couldn't save. Try again." };
  return { success: true, data: undefined };
}

/** Step 3 (Requirements) save -- upserts the single opportunity_requirements
 *  row and replaces the opportunity_required_skills set. */
export async function saveOpportunityRequirements(
  id: string,
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = opportunityRequirementsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireDraftOwnedByAdmin(id);
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = gate.supabase;

  if (parsed.data.headcountRequired !== undefined) {
    const { error: hErr } = await supabase
      .from("opportunities")
      .update({ headcount_required: parsed.data.headcountRequired ?? null })
      .eq("id", id)
      .eq("status", "DRAFT");
    if (hErr) return { success: false, error: "Couldn't save. Try again." };
  }

  const { data: existing } = await supabase
    .from("opportunity_requirements")
    .select("id")
    .eq("opportunity_id", id)
    .maybeSingle();

  const reqFields = {
    required_profession_id: parsed.data.requiredProfessionId ?? null,
    min_experience_years: parsed.data.minExperienceYears ?? null,
    required_education_level:
      (parsed.data.requiredEducationLevel as EducationLevel | undefined) ??
      null,
  };

  if (existing) {
    const { error } = await supabase
      .from("opportunity_requirements")
      .update(reqFields)
      .eq("id", existing.id);
    if (error) return { success: false, error: "Couldn't save. Try again." };
  } else {
    const { error } = await supabase
      .from("opportunity_requirements")
      .insert({ opportunity_id: id, ...reqFields });
    if (error) return { success: false, error: "Couldn't save. Try again." };
  }

  // Replace the required-skills set with exactly what was submitted.
  const { error: delErr } = await supabase
    .from("opportunity_required_skills")
    .delete()
    .eq("opportunity_id", id);
  if (delErr) return { success: false, error: "Couldn't save. Try again." };

  if (parsed.data.skillIds.length > 0) {
    const { error: insErr } = await supabase
      .from("opportunity_required_skills")
      .insert(
        parsed.data.skillIds.map((skillId) => ({
          opportunity_id: id,
          skill_id: skillId,
        })),
      );
    if (insErr) return { success: false, error: "Couldn't save. Try again." };
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Publish (checklist §7)
// ---------------------------------------------------------------------------

export async function publishOpportunity(id: string): Promise<AuthActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  const { data: opp, error: readErr } = await supabase
    .from("opportunities")
    .select("status, title, type, organization_name")
    .eq("id", id)
    .single();
  if (readErr || !opp) {
    return { success: false, error: "That opportunity could not be found." };
  }

  if (!isOpportunityTransitionAllowed(opp.status as OpportunityStatus, "PUBLISHED")) {
    return {
      success: false,
      error: `That status doesn't allow this action.`,
    };
  }

  const { data: reqRow } = await supabase
    .from("opportunity_requirements")
    .select("required_profession_id, min_experience_years, required_education_level")
    .eq("opportunity_id", id)
    .maybeSingle();

  const { count: skillCount } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id", { count: "exact", head: true })
    .eq("opportunity_id", id);

  const { complete, missing } = checkOpportunityCompleteness({
    title: opp.title,
    type: opp.type,
    organizationName: opp.organization_name,
    requiredProfessionId: reqRow?.required_profession_id ?? null,
    minExperienceYears: reqRow?.min_experience_years ?? null,
    requiredEducationLevel: reqRow?.required_education_level ?? null,
    requiredSkillCount: skillCount ?? 0,
  });

  if (!complete) {
    const label = OPPORTUNITY_MISSING_FIELD_LABEL[missing[0]];
    return { success: false, error: `Add your ${label} before continuing.` };
  }

  const { error, count } = await supabase
    .from("opportunities")
    .update(
      { status: "PUBLISHED", published_at: new Date().toISOString() },
      { count: "exact" },
    )
    .eq("id", id)
    .eq("status", "DRAFT");

  if (error || count === 0) {
    return { success: false, error: "Couldn't publish. Try again." };
  }
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Transitions from Published/Filled/Closed
// ---------------------------------------------------------------------------

export async function closeOpportunity(id: string): Promise<AuthActionResult> {
  return guardedOpportunityTransition(id, "CLOSED", {
    closed_at: new Date().toISOString(),
  });
}

export async function cancelOpportunity(id: string): Promise<AuthActionResult> {
  return guardedOpportunityTransition(id, "CANCELLED");
}

export async function markOpportunityFilled(
  id: string,
): Promise<AuthActionResult> {
  return guardedOpportunityTransition(id, "FILLED");
}

export async function markOpportunityCompleted(
  id: string,
): Promise<AuthActionResult> {
  return guardedOpportunityTransition(id, "COMPLETED");
}
