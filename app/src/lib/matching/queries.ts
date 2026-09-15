// Stage 28 (M6) -- Find Matches: server-side composition of the pure
// eligibility/scoring/rank modules against real data. Admin-only, read-only,
// nothing here writes to opportunities/opportunity_requirements/
// opportunity_required_skills or persists a score anywhere.
//
// requireAdmin() is replicated here, not imported -- matches the pattern
// already independently duplicated in lib/verification/actions.ts,
// lib/verification/queries.ts, lib/opportunities/actions.ts, and
// lib/opportunities/queries.ts (no shared helper exists to import).

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import { isMatchEligible } from "@/lib/matching/eligibility";
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
import { rankCandidates } from "@/lib/matching/rank";
import type {
  Availability,
  CredentialsStatus,
  MembershipStatus,
  ProfileStatus,
} from "@/types/member";

async function requireAdmin() {
  const me = await getCurrentMember();
  if (!me) return { ok: false as const, error: "You need to sign in." };
  if (me.role !== "CHURCH_ADMIN" && me.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "Not authorised." };
  }
  return { ok: true as const, admin: me };
}

export interface MatchBreakdown {
  profession: number;
  skills: number;
  experience: number;
  availability: number;
  location: number;
  education: number;
}

export interface MatchCandidate {
  memberId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  availability: Availability;
  score: number; // 0-100 integer
  label: MatchLabel;
  breakdown: MatchBreakdown; // each sub-score as a 0-100 integer, for display
}

export type FindMatchesResult =
  | { ok: true; opportunityTitle: string; candidates: MatchCandidate[] }
  | { ok: false; reason: "NOT_FOUND" | "NOT_PUBLISHED" | "UNAUTHORIZED" };

/** Find Matches for one opportunity. Admin-only. Returns a typed rejection
 *  (Decision 3) rather than an empty candidate list when the opportunity
 *  doesn't exist or isn't PUBLISHED -- "no eligible candidates for a live
 *  opportunity" and "this opportunity isn't open for matching" must never
 *  be confused with each other by the caller. */
export async function findMatchesForOpportunity(
  opportunityId: string,
): Promise<FindMatchesResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, reason: "UNAUTHORIZED" };

  const supabase = await createClient();

  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("id, title, status, location")
    .eq("id", opportunityId)
    .single();
  if (oppError || !opportunity) return { ok: false, reason: "NOT_FOUND" };
  if (opportunity.status !== "PUBLISHED") {
    return { ok: false, reason: "NOT_PUBLISHED" };
  }

  const { data: requirement } = await supabase
    .from("opportunity_requirements")
    .select("required_profession_id, min_experience_years")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  const { data: skillLinks } = await supabase
    .from("opportunity_required_skills")
    .select("skill_id")
    .eq("opportunity_id", opportunityId);
  const requiredSkillIds = (skillLinks ?? []).map((l) => l.skill_id);

  const requiredProfessionId = requirement?.required_profession_id ?? null;
  const minExperienceYears = requirement?.min_experience_years ?? null;

  // The same directory-visible gate M4 already uses, fetched unfiltered by
  // availability here (availability is asserted in code via
  // isMatchEligible, alongside the profile/membership/credentials check) so
  // there is exactly one place -- the pure eligibility module -- that
  // defines "eligible for matching."
  const { data: memberRows } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, job_title, location, primary_profession_id, years_of_experience, availability, profile_status, membership_status, credentials_status",
    )
    .eq("profile_status", "PROFILE_COMPLETE")
    .eq("membership_status", "CONFIRMED")
    .in("credentials_status", ["REVIEWED", "REVIEW_PENDING"]);

  const candidateRows = (memberRows ?? []).filter((m) =>
    isMatchEligible({
      profileStatus: m.profile_status as ProfileStatus,
      membershipStatus: m.membership_status as MembershipStatus,
      credentialsStatus: m.credentials_status as CredentialsStatus,
      availability: m.availability as Availability,
    }),
  );

  if (candidateRows.length === 0) {
    return { ok: true, opportunityTitle: opportunity.title, candidates: [] };
  }

  const memberIds = candidateRows.map((m) => m.id);
  const { data: skillLinkRows } = await supabase
    .from("member_skills")
    .select("member_id, skill_id")
    .in("member_id", memberIds);

  const skillsByMember = new Map<string, string[]>();
  for (const row of skillLinkRows ?? []) {
    const list = skillsByMember.get(row.member_id) ?? [];
    list.push(row.skill_id);
    skillsByMember.set(row.member_id, list);
  }

  const candidates: MatchCandidate[] = candidateRows.map((m) => {
    const candidateSkillIds = skillsByMember.get(m.id) ?? [];

    const profession = professionMatch(
      requiredProfessionId,
      m.primary_profession_id,
    );
    const skills = skillsMatch(requiredSkillIds, candidateSkillIds);
    const experience = experienceMatch(
      minExperienceYears,
      m.years_of_experience,
    );
    const availability = availabilityMatch(m.availability as Availability);
    const location = locationMatch(opportunity.location, m.location);
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

    return {
      memberId: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      jobTitle: m.job_title,
      location: m.location,
      yearsOfExperience: m.years_of_experience,
      availability: m.availability as Availability,
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
  });

  const ranked = rankCandidates(
    candidates.map((c) => ({
      id: c.memberId,
      lastName: c.lastName,
      matchScore: c.score,
      original: c,
    })),
  ).map((r) => r.original);

  return { ok: true, opportunityTitle: opportunity.title, candidates: ranked };
}
