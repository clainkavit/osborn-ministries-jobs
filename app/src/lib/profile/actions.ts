"use server";

// Stage 22 (onboarding) + Stage 23 Gap 1 (post-submission editing).
//
// Every write action:
//  - requires an authenticated member who owns this profile (any
//    profile_status -- REGISTERED during onboarding, PROFILE_COMPLETE after);
//  - re-validates input with the shared Zod schema;
//  - is additionally protected by RLS (member can only touch own rows);
//  - after a successful write, applies the reverification-on-edit effect
//    (Stage 7's DECIDED rule) via applyReverification(). While REGISTERED
//    that is a no-op. While PROFILE_COMPLETE, a credential-bearing edit moves
//    the CREDENTIALS track (never Membership -- Req 2) and logs it.
//
// Onboarding autosave behaviour is unchanged: the wizard calls the same
// actions on "Next"; a REGISTERED member triggers no reverification.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import { getMemberProfile } from "@/lib/profile/queries";
import { checkCompleteness, MISSING_FIELD_LABEL } from "@/lib/profile/completeness";
import { applyReverification } from "@/lib/profile/reverification";
import type { EditedField } from "@/lib/verification/rules";
import {
  availabilitySchema,
  educationRecordSchema,
  experienceRecordSchema,
  experienceStepSchema,
  personalSchema,
  professionSchema,
  MAX_DOCUMENT_BYTES,
  ACCEPTED_CV_MIME,
  ACCEPTED_CV_EXT,
} from "@/lib/profile/schemas";
import type { AuthActionResult } from "@/types/auth";
import type { Member } from "@/types/member";

type ProfileGate =
  | { ok: true; member: Member }
  | { ok: false; error: string };

/** Any authenticated member who owns a profile row. No profile_status
 *  restriction -- onboarding (REGISTERED) and corrections (PROFILE_COMPLETE)
 *  both write through these actions. */
async function requireOwnProfile(): Promise<ProfileGate> {
  const member = await getCurrentMember();
  if (!member) return { ok: false, error: "You need to sign in." };
  return { ok: true, member };
}

/** Run after a member-facing profile write. Applies reverification if the
 *  member is PROFILE_COMPLETE and the field is credential-bearing. */
async function afterEdit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  member: Member,
  field: EditedField,
) {
  await applyReverification(supabase, {
    memberId: member.id,
    profileStatus: member.profileStatus,
    currentCredentials: member.credentialsStatus,
    field,
  });
}

// ---- Step 1: personal ----
export async function savePersonal(raw: unknown): Promise<AuthActionResult> {
  const parsed = personalSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      photo_url: parsed.data.photoUrl ?? null,
      date_of_birth: parsed.data.dateOfBirth ?? null,
      gender: parsed.data.gender ?? null,
      location: parsed.data.location,
    })
    .eq("id", gate.member.id);

  if (error) return { success: false, error: "Couldn't save. Try again." };
  await afterEdit(supabase, gate.member, "personal");
  return { success: true, data: undefined };
}

// ---- Step 2: profession ----
export async function saveProfession(raw: unknown): Promise<AuthActionResult> {
  const parsed = professionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      primary_profession_id: parsed.data.primaryProfessionId ?? null,
      profession_freetext: parsed.data.primaryProfessionId
        ? null
        : (parsed.data.professionFreetext ?? null),
      job_title: parsed.data.jobTitle ?? null,
      industry: parsed.data.industry ?? null,
    })
    .eq("id", gate.member.id);

  if (error) return { success: false, error: "Couldn't save. Try again." };
  await afterEdit(supabase, gate.member, "profession");
  return { success: true, data: undefined };
}

// ---- Step 3: experience (step-level) ----
export async function saveExperienceStep(
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = experienceStepSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      employment_status: parsed.data.employmentStatus as never,
      years_of_experience: parsed.data.yearsOfExperience,
    })
    .eq("id", gate.member.id);

  if (error) return { success: false, error: "Couldn't save. Try again." };
  await afterEdit(supabase, gate.member, "experience");
  return { success: true, data: undefined };
}

// ---- Experience records (repeatable) ----
export async function addExperienceRecord(
  raw: unknown,
): Promise<AuthActionResult<{ id: string }>> {
  const parsed = experienceRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experience")
    .insert({
      member_id: gate.member.id,
      organization: parsed.data.organization,
      position: parsed.data.position,
      location: parsed.data.location ?? null,
      start_date: parsed.data.startDate ?? null,
      end_date: parsed.data.isCurrent ? null : (parsed.data.endDate ?? null),
      is_current: parsed.data.isCurrent,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Couldn't add that. Try again." };
  }
  await afterEdit(supabase, gate.member, "experience");
  return { success: true, data: { id: data.id } };
}

export async function deleteExperienceRecord(
  id: string,
): Promise<AuthActionResult> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("experience")
    .delete()
    .eq("id", id)
    .eq("member_id", gate.member.id);
  if (error) return { success: false, error: "Couldn't remove that." };
  await afterEdit(supabase, gate.member, "experience");
  return { success: true, data: undefined };
}

// ---- Step 4: education records ----
export async function addEducationRecord(
  raw: unknown,
): Promise<AuthActionResult<{ id: string }>> {
  const parsed = educationRecordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("education")
    .insert({
      member_id: gate.member.id,
      institution: parsed.data.institution,
      qualification: parsed.data.qualification,
      field_of_study: parsed.data.fieldOfStudy ?? null,
      start_year: parsed.data.startYear ?? null,
      end_year: parsed.data.isCurrent ? null : (parsed.data.endYear ?? null),
      is_current: parsed.data.isCurrent,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Couldn't add that. Try again." };
  }
  await afterEdit(supabase, gate.member, "education");
  return { success: true, data: { id: data.id } };
}

export async function deleteEducationRecord(
  id: string,
): Promise<AuthActionResult> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("education")
    .delete()
    .eq("id", id)
    .eq("member_id", gate.member.id);
  if (error) return { success: false, error: "Couldn't remove that." };
  await afterEdit(supabase, gate.member, "education");
  return { success: true, data: undefined };
}

// ---- Step 5: skills ----
export async function addSkill(input: {
  skillId?: string;
  name?: string;
}): Promise<AuthActionResult<{ skillId: string }>> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = await createClient();

  let skillId = input.skillId ?? null;

  if (!skillId) {
    const name = (input.name ?? "").trim();
    if (!name) return { success: false, error: "Enter a skill." };

    const { data: existing } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      skillId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("skills")
        .insert({ name })
        .select("id")
        .single();
      if (createErr || !created) {
        return { success: false, error: "Couldn't add that skill." };
      }
      skillId = created.id;
    }
  }

  const { error: linkErr } = await supabase
    .from("member_skills")
    .upsert(
      { member_id: gate.member.id, skill_id: skillId },
      { onConflict: "member_id,skill_id" },
    );
  if (linkErr) return { success: false, error: "Couldn't add that skill." };

  await afterEdit(supabase, gate.member, "skills");
  return { success: true, data: { skillId } };
}

export async function removeSkill(skillId: string): Promise<AuthActionResult> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("member_skills")
    .delete()
    .eq("member_id", gate.member.id)
    .eq("skill_id", skillId);
  if (error) return { success: false, error: "Couldn't remove that skill." };
  await afterEdit(supabase, gate.member, "skills");
  return { success: true, data: undefined };
}

// ---- Step 6: CV upload ----
export async function uploadCv(
  formData: FormData,
): Promise<AuthActionResult<{ id: string; filename: string }>> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to upload." };
  }

  const nameLower = file.name.toLowerCase();
  const extOk = ACCEPTED_CV_EXT.some((e) => nameLower.endsWith(e));
  const mimeOk = (ACCEPTED_CV_MIME as readonly string[]).includes(file.type);
  if (!extOk && !mimeOk) {
    return {
      success: false,
      error: "That file type isn't supported. Upload a PDF, DOC, or DOCX.",
    };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return {
      success: false,
      error: "That file is too large. Documents must be under 10 MB.",
    };
  }

  const supabase = await createClient();
  const ext = ACCEPTED_CV_EXT.find((e) => nameLower.endsWith(e)) ?? ".pdf";
  const storagePath = `${gate.member.id}/cv/cv-${Date.now()}${ext}`;

  const { error: upErr } = await supabase.storage
    .from("member-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: true });
  if (upErr) {
    return {
      success: false,
      error: "Upload failed. Check your connection and try again.",
    };
  }

  await supabase
    .from("documents")
    .delete()
    .eq("member_id", gate.member.id)
    .eq("type", "CV");

  const { data, error } = await supabase
    .from("documents")
    .insert({
      member_id: gate.member.id,
      type: "CV",
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id, filename")
    .single();

  if (error || !data) {
    return { success: false, error: "Upload failed. Try again." };
  }
  // CV is a credential document -- a replacement is an education-class change.
  await afterEdit(supabase, gate.member, "education");
  return { success: true, data: { id: data.id, filename: data.filename } };
}

export async function deleteDocument(id: string): Promise<AuthActionResult> {
  const gate = await requireOwnProfile();
  if (!gate.ok) return { success: false, error: gate.error };
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .eq("member_id", gate.member.id)
    .maybeSingle();
  if (doc?.storage_path) {
    await supabase.storage.from("member-documents").remove([doc.storage_path]);
  }
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("member_id", gate.member.id);
  if (error) return { success: false, error: "Couldn't remove that file." };
  return { success: true, data: undefined };
}

// ---- Step 7: availability ----
// Availability is a live status, not a verified claim -- editable at any
// profile_status, and it triggers NO reverification (Stage 7).
export async function saveAvailability(
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = availabilitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const supabase = await createClient();
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "You need to sign in." };

  const { error } = await supabase
    .from("members")
    .update({ availability: parsed.data.availability })
    .eq("id", member.id);

  if (error) return { success: false, error: "Couldn't save. Try again." };
  return { success: true, data: undefined };
}

// ---- Step 8: submit for verification ----
// Stage 7 / Stage 13: the ONLY place profile_status moves to PROFILE_COMPLETE,
// and it happens together with both verification tracks -> PENDING. Gated by
// the 7-rule completeness check. Unchanged by M3.
export async function submitForVerification(): Promise<AuthActionResult> {
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "You need to sign in." };
  if (member.profileStatus !== "REGISTERED") {
    return { success: false, error: "Your profile has already been submitted." };
  }

  const profile = await getMemberProfile();
  if (!profile) return { success: false, error: "Couldn't load your profile." };

  const { complete, missing } = checkCompleteness(profile);
  if (!complete) {
    const label = MISSING_FIELD_LABEL[missing[0]];
    return {
      success: false,
      error: `Add your ${label} before continuing.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      profile_status: "PROFILE_COMPLETE",
      membership_status: "PENDING",
      credentials_status: "PENDING",
    })
    .eq("id", member.id)
    .eq("profile_status", "REGISTERED"); // guard against a double-submit race

  if (error) {
    return { success: false, error: "Couldn't submit. Try again." };
  }
  return { success: true, data: undefined };
}
