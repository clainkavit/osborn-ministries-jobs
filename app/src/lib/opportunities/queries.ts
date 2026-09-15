// Stage 27 (M5) -- opportunity reads. Server-only. Admin reads rely on the
// migration-004 admin RLS policies; member reads are Published-only, gated
// twice (the query's own unconditional WHERE clause, and RLS) -- same
// belt-and-suspenders posture M3/M4 established for their own gates.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import type {
  OpportunityDetail,
  OpportunityListRow,
  OpportunityStatus,
  OpportunityType,
  PublishedOpportunityRow,
} from "@/types/opportunity";
import type { EducationLevel } from "@/types/member";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

// ---------------------------------------------------------------------------
// Shared: load one opportunity's requirement + required skills, joined with
// the profession/skill names for display. Used by both admin and member
// detail loaders.
// ---------------------------------------------------------------------------
async function loadRequirementAndSkills(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opportunityId: string,
): Promise<{
  requirement: OpportunityDetail["requirement"];
  requiredSkills: OpportunityDetail["requiredSkills"];
}> {
  const { data: reqRow } = await supabase
    .from("opportunity_requirements")
    .select("id, required_profession_id, min_experience_years, required_education_level")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  let professionName: string | null = null;
  if (reqRow?.required_profession_id) {
    const { data: prof } = await supabase
      .from("professions")
      .select("name")
      .eq("id", reqRow.required_profession_id)
      .maybeSingle();
    professionName = prof?.name ?? null;
  }

  const { data: skillLinks } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id")
    .eq("opportunity_id", opportunityId);

  const skillIds = (skillLinks ?? []).map((l) => l.skill_id);
  const { data: skillRows } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds)
    : { data: [] as { id: string; name: string }[] };

  return {
    requirement: reqRow
      ? {
          id: reqRow.id,
          requiredProfessionId: reqRow.required_profession_id,
          professionName,
          minExperienceYears: reqRow.min_experience_years,
          requiredEducationLevel:
            reqRow.required_education_level as EducationLevel | null,
        }
      : null,
    requiredSkills: (skillRows ?? []).map((s) => ({ id: s.id, name: s.name })),
  };
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

/** Every opportunity, any status, admin-only. Mirrors getVerificationQueue's
 *  shape. */
export async function getAdminOpportunities(): Promise<OpportunityListRow[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, type, organization_name, status, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as OpportunityType,
    organizationName: r.organization_name,
    status: r.status as OpportunityStatus,
    createdAt: r.created_at,
  }));
}

/** One opportunity's full detail, admin-only, any status. notFound()-
 *  equivalent (null) if missing. */
export async function getOpportunityForAdmin(
  id: string,
): Promise<OpportunityDetail | null> {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !row) return null;

  const { requirement, requiredSkills } = await loadRequirementAndSkills(
    supabase,
    id,
  );

  return {
    id: row.id,
    title: row.title,
    type: row.type as OpportunityType,
    organizationName: row.organization_name,
    location: row.location,
    description: row.description,
    status: row.status as OpportunityStatus,
    headcountRequired: row.headcount_required,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    requirement,
    requiredSkills,
  };
}

// ---------------------------------------------------------------------------
// Member reads -- Published only, enforced here AND by RLS.
// ---------------------------------------------------------------------------

export interface PublishedOpportunityFilters {
  /** Matches opportunities.title AND opportunities.organization_name only
   *  (Champion §23 item 3) -- substring/ILIKE. Explicitly NOT description,
   *  NOT anything on opportunity_requirements/opportunity_required_skills. */
  search?: string;
  type?: OpportunityType;
  location?: string;
}

/** Published opportunities only, matching the given filters. The gate
 *  clause (status = 'PUBLISHED') is unconditional and applied first;
 *  filters layer on top and can never widen past it. */
export async function getPublishedOpportunities(
  filters: PublishedOpportunityFilters = {},
): Promise<PublishedOpportunityRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("id, title, type, organization_name, location, published_at")
    .eq("status", "PUBLISHED");

  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }
  if (filters.search) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,organization_name.ilike.%${term}%`,
      );
    }
  }

  const { data } = await query.order("published_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type as OpportunityType,
    organizationName: r.organization_name,
    location: r.location,
    publishedAt: r.published_at,
  }));
}

/** One Published opportunity's public detail. Returns null for anything
 *  not PUBLISHED -- a member must get the same "not found" experience for
 *  a Draft/Closed/Cancelled/Filled/Completed opportunity as for a
 *  nonexistent id, never a distinguishable error. */
export async function getOpportunityDetail(
  id: string,
): Promise<OpportunityDetail | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("status", "PUBLISHED")
    .maybeSingle();
  if (error || !row) return null;

  const { requirement, requiredSkills } = await loadRequirementAndSkills(
    supabase,
    id,
  );

  return {
    id: row.id,
    title: row.title,
    type: row.type as OpportunityType,
    organizationName: row.organization_name,
    location: row.location,
    description: row.description,
    status: row.status as OpportunityStatus,
    headcountRequired: row.headcount_required,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    requirement,
    requiredSkills,
  };
}

/** Total Published opportunity count -- Decision 6b's admin dashboard stat.
 *  The SAME unconditional gate clause as getPublishedOpportunities, no
 *  filter params. */
export async function getPublishedOpportunityCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("status", "PUBLISHED");
  return count ?? 0;
}
