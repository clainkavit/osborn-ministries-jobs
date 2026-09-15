// Stage 23 (M3) -- verification reads. Server-only. Admin reads rely on the
// migration-003 RLS admin policies; member reads are self-scoped.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember, mapMemberRow } from "@/lib/auth/queries";
import type { MemberProfile } from "@/types/member";
import type {
  CorrectionInfo,
  VerificationHistoryEntry,
  VerificationQueueRow,
} from "@/types/verification";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

// Stage 31 (M9) -- extracted verbatim from the admin dashboard's own
// previously-inlined pendingVerificationCount(): a submitted member with at
// least one track still waiting on the admin (PENDING or REVIEW_PENDING).
// Same predicate, same meaning, no behavior change.
export async function getPendingVerificationCount(): Promise<number> {
  const gate = await requireAdmin();
  if (!gate.ok) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("profile_status", "PROFILE_COMPLETE")
    .or(
      "membership_status.eq.PENDING,credentials_status.eq.PENDING,credentials_status.eq.REVIEW_PENDING",
    );
  return count ?? 0;
}

/** Every submitted member, for the admin queue. Tab filtering is done in the
 *  screen with the pure filterQueue(). */
export async function getVerificationQueue(): Promise<VerificationQueueRow[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, updated_at, membership_status, credentials_status, profile_status",
    )
    .eq("profile_status", "PROFILE_COMPLETE")
    .order("updated_at", { ascending: true });

  return (data ?? []).map((r) => ({
    memberId: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    submittedAt: r.updated_at,
    membershipStatus: r.membership_status,
    credentialsStatus: r.credentials_status,
  }));
}

/** Full profile of ONE member, for the Verification Review screen. Admin-only,
 *  not self-scoped (Gap 5). Same shape as the member's own getMemberProfile. */
export async function getMemberProfileForAdmin(
  memberId: string,
): Promise<MemberProfile | null> {
  const gate = await requireAdmin();
  if (!gate.ok) return null;

  const supabase = await createClient();
  const { data: memberRow, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .single();
  if (error || !memberRow) return null;

  const member = mapMemberRow(memberRow);

  const [
    { data: professionRow },
    { data: educationRows },
    { data: experienceRows },
    { data: skillLinks },
    { data: documentRows },
  ] = await Promise.all([
    member.primaryProfessionId
      ? supabase
          .from("professions")
          .select("*")
          .eq("id", member.primaryProfessionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("education")
      .select("*")
      .eq("member_id", memberId)
      .order("start_year", { ascending: false }),
    supabase
      .from("experience")
      .select("*")
      .eq("member_id", memberId)
      .order("start_date", { ascending: false }),
    supabase.from("member_skills").select("skill_id").eq("member_id", memberId),
    supabase.from("documents").select("*").eq("member_id", memberId),
  ]);

  const skillIds = (skillLinks ?? []).map((l) => l.skill_id);
  const { data: skillRows } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds)
    : { data: [] as { id: string; name: string }[] };

  return {
    ...member,
    profession: professionRow
      ? {
          id: professionRow.id,
          name: professionRow.name,
          category: professionRow.category,
          synonyms: professionRow.synonyms,
        }
      : null,
    education: (educationRows ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      institution: r.institution,
      qualification: r.qualification,
      fieldOfStudy: r.field_of_study,
      startYear: r.start_year,
      endYear: r.end_year,
      isCurrent: r.is_current,
    })),
    experience: (experienceRows ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      organization: r.organization,
      position: r.position,
      location: r.location,
      startDate: r.start_date,
      endDate: r.end_date,
      isCurrent: r.is_current,
      description: r.description,
    })),
    skills: (skillRows ?? []).map((r) => ({ id: r.id, name: r.name })),
    documents: (documentRows ?? []).map((r) => ({
      id: r.id,
      memberId: r.member_id,
      type: r.type,
      filename: r.filename,
      storagePath: r.storage_path,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
    })),
  };
}

function mapHistory(rows: unknown[]): VerificationHistoryEntry[] {
  return (rows as Array<{
    id: string;
    member_id: string;
    track: "MEMBERSHIP" | "CREDENTIALS";
    action: VerificationHistoryEntry["action"];
    note: string | null;
    actor_admin_id: string | null;
    actor_member_id: string | null;
    detail: string | null;
    created_at: string;
  }>).map((r) => ({
    id: r.id,
    memberId: r.member_id,
    track: r.track,
    action: r.action,
    note: r.note,
    actorAdminId: r.actor_admin_id,
    actorMemberId: r.actor_member_id,
    detail: r.detail,
    createdAt: r.created_at,
  }));
}

/** Verification history for a member -- admin view (any member). */
export async function getVerificationHistory(
  memberId: string,
): Promise<VerificationHistoryEntry[]> {
  const gate = await requireAdmin();
  if (!gate.ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("verification_history")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  return mapHistory(data ?? []);
}

/** The current member's active NEEDS_CORRECTION tracks + the admin's notes.
 *  Drives the dashboard card and /profile/corrections. */
export async function getMyCorrections(): Promise<CorrectionInfo[]> {
  const member = await getCurrentMember();
  if (!member) return [];

  const flagged: CorrectionInfo["track"][] = [];
  if (member.membershipStatus === "NEEDS_CORRECTION") flagged.push("MEMBERSHIP");
  if (member.credentialsStatus === "NEEDS_CORRECTION")
    flagged.push("CREDENTIALS");
  if (flagged.length === 0) return [];

  const supabase = await createClient();
  // The most recent NEEDS_CORRECTION history row per flagged track carries
  // the note the admin left.
  const { data } = await supabase
    .from("verification_history")
    .select("track, note, created_at, action")
    .eq("member_id", member.id)
    .eq("action", "NEEDS_CORRECTION")
    .order("created_at", { ascending: false });

  return flagged.map((track) => {
    const row = (data ?? []).find((r) => r.track === track);
    return {
      track,
      note: row?.note ?? null,
      requestedAt: row?.created_at ?? "",
    };
  });
}

export async function getMemberHistorySelf(): Promise<VerificationHistoryEntry[]> {
  const member = await getCurrentMember();
  if (!member) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("verification_history")
    .select("*")
    .order("created_at", { ascending: false });
  return mapHistory(data ?? []);
}
