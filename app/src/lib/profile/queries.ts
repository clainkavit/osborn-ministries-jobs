// Stage 22 -- GET /members/me (extended): the member row plus every
// sub-collection, mapped to MemberProfile. Server-only. RLS scopes every
// sub-collection read to the caller's own member_id automatically.
//
// Each sub-collection read is defensive: a failure (e.g. PostgREST schema
// cache lag right after migration 002, a transient error) yields an empty
// collection rather than throwing, so a freshly-registered member's
// /onboarding render never crashes.

import { createClient } from "@/lib/supabase/server";
import { mapMemberRow } from "@/lib/auth/queries";
import type {
  Education,
  Experience,
  MemberDocument,
  MemberProfile,
  Profession,
  SkillTag,
} from "@/types/member";

export async function getMemberProfile(): Promise<MemberProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberRow, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (error || !memberRow) return null;

  const member = mapMemberRow(memberRow);

  const [profession, education, experience, skills, documents] =
    await Promise.all([
      loadProfession(supabase, member.primaryProfessionId),
      loadEducation(supabase, member.id),
      loadExperience(supabase, member.id),
      loadSkills(supabase, member.id),
      loadDocuments(supabase, member.id),
    ]);

  return { ...member, profession, education, experience, skills, documents };
}

type SB = Awaited<ReturnType<typeof createClient>>;

async function loadProfession(
  supabase: SB,
  id: string | null,
): Promise<Profession | null> {
  if (!id) return null;
  try {
    const { data } = await supabase
      .from("professions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data
      ? {
          id: data.id,
          name: data.name,
          category: data.category,
          synonyms: data.synonyms,
        }
      : null;
  } catch {
    return null;
  }
}

async function loadEducation(
  supabase: SB,
  memberId: string,
): Promise<Education[]> {
  try {
    const { data } = await supabase
      .from("education")
      .select("*")
      .eq("member_id", memberId)
      .order("start_year", { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      institution: r.institution,
      qualification: r.qualification,
      fieldOfStudy: r.field_of_study,
      startYear: r.start_year,
      endYear: r.end_year,
      isCurrent: r.is_current,
    }));
  } catch {
    return [];
  }
}

async function loadExperience(
  supabase: SB,
  memberId: string,
): Promise<Experience[]> {
  try {
    const { data } = await supabase
      .from("experience")
      .select("*")
      .eq("member_id", memberId)
      .order("start_date", { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      organization: r.organization,
      position: r.position,
      location: r.location,
      startDate: r.start_date,
      endDate: r.end_date,
      isCurrent: r.is_current,
      description: r.description,
    }));
  } catch {
    return [];
  }
}

async function loadSkills(supabase: SB, memberId: string): Promise<SkillTag[]> {
  try {
    // Two-step (not a PostgREST embed) so a schema-cache lag on the FK
    // relationship can't crash the whole profile load.
    const { data: links } = await supabase
      .from("member_skills")
      .select("skill_id")
      .eq("member_id", memberId);
    const ids = (links ?? []).map((l) => l.skill_id);
    if (ids.length === 0) return [];
    const { data: rows } = await supabase
      .from("skills")
      .select("id, name")
      .in("id", ids);
    return (rows ?? []).map((r) => ({ id: r.id, name: r.name }));
  } catch {
    return [];
  }
}

async function loadDocuments(
  supabase: SB,
  memberId: string,
): Promise<MemberDocument[]> {
  try {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("member_id", memberId);
    return (data ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      type: r.type,
      filename: r.filename,
      storagePath: r.storage_path,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
    }));
  } catch {
    return [];
  }
}
