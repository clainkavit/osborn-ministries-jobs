// Stage 29 (M7) -- application reads. Server-only.
//
// Decision 1 -- "Connect" is realized here, not as a status: contact
// fields are included in getApplicationForAdmin's returned shape ONLY when
// status is SHORTLISTED or later. This is a response-shape omission, not a
// client-side hide -- the query itself never selects phone/email unless
// the threshold is met, matching Stage 16's literal instruction ("contact
// info only included in the response once status is Shortlisted or
// later") and this project's established M4/M5/M6 belt-and-suspenders
// posture (query-level gate + RLS, never a CSS-only hide).
//
// Decision 3 -- no persisted score. When an application detail screen
// wants to show M6 match information, it is computed live here by calling
// lib/matching/scoring.ts directly against the application's own
// member_id/opportunity_id -- lib/matching/ itself is never modified.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import {
  professionMatch,
  skillsMatch,
  experienceMatch,
  availabilityMatch,
  locationMatch,
  educationMatch,
  computeMatchScore,
  toScorePercent,
  labelForScore,
  type MatchLabel,
} from "@/lib/matching/scoring";
import type { ApplicationDetail, ApplicationSummary } from "@/types/application";
import type { Availability } from "@/types/member";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

const CONTACT_VISIBLE_STATUSES = new Set([
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
]);

// ---------------------------------------------------------------------------
// Member reads -- own applications only. RLS backs this up independently;
// these queries never accept a member id parameter from the caller, they
// always resolve it from the current session.
// ---------------------------------------------------------------------------

export async function getMyApplications(): Promise<ApplicationSummary[]> {
  const me = await getCurrentMember();
  if (!me) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, opportunity_id, status, applied_at, status_updated_at, opportunities(title, organization_name)",
    )
    .eq("member_id", me.id)
    .order("applied_at", { ascending: false });

  return (data ?? []).map((r) => {
    const opp = r.opportunities as unknown as
      | { title: string; organization_name: string }
      | { title: string; organization_name: string }[]
      | null;
    const oppRow = Array.isArray(opp) ? opp[0] : opp;
    return {
      id: r.id,
      opportunityId: r.opportunity_id,
      opportunityTitle: oppRow?.title ?? "",
      organizationName: oppRow?.organization_name ?? "",
      status: r.status as ApplicationSummary["status"],
      appliedAt: r.applied_at,
      statusUpdatedAt: r.status_updated_at,
    };
  });
}

/** Own application only -- returns null for anything not owned by the
 *  caller, giving the same "not found" experience as a nonexistent id
 *  (no distinguishable error for "exists but isn't yours"). */
export async function getMyApplicationDetail(
  id: string,
): Promise<ApplicationDetail | null> {
  const me = await getCurrentMember();
  if (!me) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("applications")
    .select(
      "id, member_id, opportunity_id, status, applied_at, status_updated_at, interview_date, interview_time, interview_location, interview_instructions, opportunities(title, organization_name)",
    )
    .eq("id", id)
    .eq("member_id", me.id)
    .maybeSingle();
  if (error || !row) return null;

  const opp = row.opportunities as unknown as
    | { title: string; organization_name: string }
    | { title: string; organization_name: string }[]
    | null;
  const oppRow = Array.isArray(opp) ? opp[0] : opp;

  return {
    id: row.id,
    memberId: row.member_id,
    opportunityId: row.opportunity_id,
    opportunityTitle: oppRow?.title ?? "",
    organizationName: oppRow?.organization_name ?? "",
    status: row.status as ApplicationDetail["status"],
    appliedAt: row.applied_at,
    statusUpdatedAt: row.status_updated_at,
    interviewDate: row.interview_date,
    interviewTime: row.interview_time,
    interviewLocation: row.interview_location,
    interviewInstructions: row.interview_instructions,
  };
}

/** True if a non-WITHDRAWN application already exists for this
 *  (member, opportunity) pair -- used both by the member Opportunity
 *  Detail page (to render the right button state) and by
 *  applyToOpportunity's own server-side duplicate check. */
export async function hasNonWithdrawnApplication(
  memberId: string,
  opportunityId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("member_id", memberId)
    .eq("opportunity_id", opportunityId)
    .neq("status", "WITHDRAWN")
    .maybeSingle();
  return !!data;
}

/** The current member's own application for this opportunity, if any
 *  (including a WITHDRAWN one) -- used by the Opportunity Detail page to
 *  show "already applied" / "withdrawn" state rather than just a boolean. */
export async function getMyApplicationForOpportunity(
  opportunityId: string,
): Promise<ApplicationSummary | null> {
  const me = await getCurrentMember();
  if (!me) return null;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("applications")
    .select(
      "id, opportunity_id, status, applied_at, status_updated_at, opportunities(title, organization_name)",
    )
    .eq("member_id", me.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (!row) return null;

  const opp = row.opportunities as unknown as
    | { title: string; organization_name: string }
    | { title: string; organization_name: string }[]
    | null;
  const oppRow = Array.isArray(opp) ? opp[0] : opp;

  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: oppRow?.title ?? "",
    organizationName: oppRow?.organization_name ?? "",
    status: row.status as ApplicationSummary["status"],
    appliedAt: row.applied_at,
    statusUpdatedAt: row.status_updated_at,
  };
}

// ---------------------------------------------------------------------------
// Admin reads.
// ---------------------------------------------------------------------------

// Stage 31 (M9), Decision A -- lifetime total, every status included. Same
// style as getPublishedOpportunityCount: a plain count, no status filter.
export async function getApplicationCount(): Promise<number> {
  const gate = await requireAdmin();
  if (!gate.ok) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

// Stage 31 (M9), Decision B -- "new" means status = APPLIED, the
// dashboard's definition only. Does not introduce a new application state.
export async function getNewApplicationCount(): Promise<number> {
  const gate = await requireAdmin();
  if (!gate.ok) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "APPLIED");
  return count ?? 0;
}

export interface MemberApplicationsForAdminRow {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  status: string;
}

/** Every application this member has (any status), admin-only. Used by the
 *  Admin Professional Profile page to decide whether Contact/Shortlist
 *  have anywhere meaningful to point -- NOT to create an application
 *  (Decision 12: applications remain member-created only). */
export async function getApplicationsForMember(
  memberId: string,
): Promise<MemberApplicationsForAdminRow[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, opportunity_id, status, opportunities(title)")
    .eq("member_id", memberId)
    .order("applied_at", { ascending: false });

  return (data ?? []).map((r) => {
    const opp = r.opportunities as unknown as
      | { title: string }
      | { title: string }[]
      | null;
    const oppRow = Array.isArray(opp) ? opp[0] : opp;
    return {
      id: r.id,
      opportunityId: r.opportunity_id,
      opportunityTitle: oppRow?.title ?? "",
      status: r.status,
    };
  });
}

export interface AdminApplicationRow {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  status: string;
  appliedAt: string;
  statusUpdatedAt: string;
}

/** Per-opportunity list, admin-only. Application Management (Decision 11:
 *  no search/filter, a flat list grouped by status is the caller's job to
 *  render, not this query's). */
export async function getApplicationsForOpportunity(
  opportunityId: string,
): Promise<AdminApplicationRow[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, member_id, status, applied_at, status_updated_at, members(first_name, last_name)",
    )
    .eq("opportunity_id", opportunityId)
    .order("applied_at", { ascending: true });

  return (data ?? []).map((r) => {
    const member = r.members as unknown as
      | { first_name: string; last_name: string }
      | { first_name: string; last_name: string }[]
      | null;
    const memberRow = Array.isArray(member) ? member[0] : member;
    return {
      id: r.id,
      memberId: r.member_id,
      firstName: memberRow?.first_name ?? "",
      lastName: memberRow?.last_name ?? "",
      status: r.status,
      appliedAt: r.applied_at,
      statusUpdatedAt: r.status_updated_at,
    };
  });
}

export interface AdminApplicationDetail {
  id: string;
  memberId: string;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  status: string;
  appliedAt: string;
  statusUpdatedAt: string;
  interviewDate: string | null;
  interviewTime: string | null;
  interviewLocation: string | null;
  interviewInstructions: string | null;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  location: string | null;
  /** Present only once status is SHORTLISTED or later (Decision 1's
   *  Connect rule) -- absent, not null, for an earlier status, so a
   *  caller can distinguish "not shortlisted yet" from "genuinely no
   *  phone on file." */
  contact: { phone: string | null; email: string | null } | null;
  outcome: {
    outcome: string;
    notes: string | null;
    recordedAt: string;
  } | null;
  match: {
    score: number;
    label: MatchLabel;
    breakdown: {
      profession: number;
      skills: number;
      experience: number;
      availability: number;
      location: number;
      education: number;
    };
  } | null;
}

/** Full detail, admin-only. Contact fields are omitted from the query's
 *  own select list entirely below the Shortlisted threshold -- not
 *  fetched-then-hidden. Match score/breakdown (Decision 3) is computed
 *  live via lib/matching/scoring.ts, never read from any stored column. */
export async function getApplicationForAdmin(
  id: string,
): Promise<AdminApplicationDetail | null> {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("applications")
    .select(
      "id, member_id, opportunity_id, status, applied_at, status_updated_at, interview_date, interview_time, interview_location, interview_instructions, opportunities(title, organization_name, location)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return null;

  const opp = row.opportunities as unknown as
    | { title: string; organization_name: string; location: string | null }
    | { title: string; organization_name: string; location: string | null }[]
    | null;
  const oppRow = Array.isArray(opp) ? opp[0] : opp;

  const contactUnlocked = CONTACT_VISIBLE_STATUSES.has(row.status);
  const memberSelect = contactUnlocked
    ? "first_name, last_name, job_title, location, phone, email, primary_profession_id, years_of_experience, availability"
    : "first_name, last_name, job_title, location, primary_profession_id, years_of_experience, availability";

  const { data: memberRow } = await supabase
    .from("members")
    .select(memberSelect)
    .eq("id", row.member_id)
    .maybeSingle();

  const { data: outcomeRow } = await supabase
    .from("application_outcomes")
    .select("outcome, notes, recorded_at")
    .eq("application_id", id)
    .maybeSingle();

  let match: AdminApplicationDetail["match"] = null;
  if (memberRow) {
    const { data: requirement } = await supabase
      .from("opportunity_requirements")
      .select("required_profession_id, min_experience_years")
      .eq("opportunity_id", row.opportunity_id)
      .maybeSingle();
    const { data: skillLinks } = await supabase
      .from("opportunity_required_skills")
      .select("skill_id")
      .eq("opportunity_id", row.opportunity_id);
    const requiredSkillIds = (skillLinks ?? []).map((l) => l.skill_id);
    const { data: memberSkillLinks } = await supabase
      .from("member_skills")
      .select("skill_id")
      .eq("member_id", row.member_id);
    const candidateSkillIds = (memberSkillLinks ?? []).map((l) => l.skill_id);

    const m = memberRow as unknown as {
      primary_profession_id: string | null;
      years_of_experience: number | null;
      availability: string;
      location: string | null;
    };

    const profession = professionMatch(
      requirement?.required_profession_id ?? null,
      m.primary_profession_id,
    );
    const skills = skillsMatch(requiredSkillIds, candidateSkillIds);
    const experience = experienceMatch(
      requirement?.min_experience_years ?? null,
      m.years_of_experience,
    );
    const availability = availabilityMatch(m.availability as Availability);
    const location = locationMatch(oppRow?.location ?? null, m.location);
    const education = educationMatch();

    const rawScore = computeMatchScore({
      profession,
      skills,
      experience,
      availability,
      location,
      education,
    });
    const score = toScorePercent(rawScore);

    match = {
      score,
      label: labelForScore(score),
      breakdown: {
        profession: toScorePercent(profession),
        skills: toScorePercent(skills),
        experience: toScorePercent(experience),
        availability: toScorePercent(availability),
        location: toScorePercent(location),
        education: toScorePercent(education),
      },
    };
  }

  const memberDisplay = memberRow as unknown as {
    first_name: string;
    last_name: string;
    job_title: string | null;
    location: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  return {
    id: row.id,
    memberId: row.member_id,
    opportunityId: row.opportunity_id,
    opportunityTitle: oppRow?.title ?? "",
    organizationName: oppRow?.organization_name ?? "",
    status: row.status,
    appliedAt: row.applied_at,
    statusUpdatedAt: row.status_updated_at,
    interviewDate: row.interview_date,
    interviewTime: row.interview_time,
    interviewLocation: row.interview_location,
    interviewInstructions: row.interview_instructions,
    firstName: memberDisplay?.first_name ?? "",
    lastName: memberDisplay?.last_name ?? "",
    jobTitle: memberDisplay?.job_title ?? null,
    location: memberDisplay?.location ?? null,
    contact: contactUnlocked
      ? {
          phone: memberDisplay?.phone ?? null,
          email: memberDisplay?.email ?? null,
        }
      : null,
    outcome: outcomeRow
      ? {
          outcome: outcomeRow.outcome,
          notes: outcomeRow.notes,
          recordedAt: outcomeRow.recorded_at,
        }
      : null,
    match,
  };
}
