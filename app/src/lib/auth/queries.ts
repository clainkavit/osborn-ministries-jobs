// Stage 21 section 27 (M1) + Stage 22 (M2). Read-side auth/member helpers,
// server-only. Read from Supabase Auth (identity) and public.members, never
// from client-supplied state.

import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/member";
import type { UserRole } from "@/types/roles";
import type { Database } from "@/types/database";

type MembersRow = Database["public"]["Tables"]["members"]["Row"];

/** Row -> domain Member. Shared by getCurrentMember and profile queries. */
export function mapMemberRow(data: MembersRow): Member {
  return {
    id: data.id,
    authUserId: data.auth_user_id,
    role: data.role,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    email: data.email,
    profileStatus: data.profile_status,
    membershipStatus: data.membership_status,
    credentialsStatus: data.credentials_status,
    photoUrl: data.photo_url,
    dateOfBirth: data.date_of_birth,
    gender: data.gender,
    location: data.location,
    primaryProfessionId: data.primary_profession_id,
    professionFreetext: data.profession_freetext,
    jobTitle: data.job_title,
    industry: data.industry,
    employmentStatus: data.employment_status,
    yearsOfExperience: data.years_of_experience,
    availability: data.availability,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/** The authenticated Supabase Auth user, or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's row from public.members, or null if not signed in. */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !data) return null;
  return mapMemberRow(data);
}

/** The current user's role, or null. */
export async function getCurrentRole(): Promise<UserRole | null> {
  const member = await getCurrentMember();
  return member?.role ?? null;
}
