// Stage 23 (M3) built the gate + a minimal listing. Stage 25 (M4) extends it
// with real search + filters + a count, per the 7 decisions in
// context/stage-25-m4-implementation-checklist.md. The gate itself does not
// change: every function here applies the same unconditional WHERE clauses
// FIRST, then layers filters on top -- a filter parameter must never be able
// to widen the result set past isDirectoryVisible().
//
// Gate (Req 1 / Contradiction C, ACCEPTED PRODUCT RULE, unchanged since M3):
//
//   visible  <=>  membership_status = 'CONFIRMED'
//                 AND credentials_status IN ('REVIEWED', 'REVIEW_PENDING')

import { createClient } from "@/lib/supabase/server";
import { isDirectoryVisible } from "@/lib/verification/rules";
import type { Availability } from "@/types/member";

export interface DirectoryProfessional {
  memberId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  location: string | null;
  industry: string | null;
  employmentStatus: string | null;
  yearsOfExperience: number | null;
  availability: Availability;
  membershipStatus: "CONFIRMED";
  credentialsStatus: "REVIEWED" | "REVIEW_PENDING";
  professionName: string | null;
}

/** Search + filters for the Professionals directory (Stage 25 build order
 *  §1). All fields optional -- an empty object returns every directory-
 *  visible member, matching the M3-era behavior exactly. */
export interface DirectoryFilters {
  /** Matches name, taxonomy profession name, OR profession_freetext.
   *  Decision 3: exact/substring only, no synonym expansion. */
  search?: string;
  location?: string;
  /** Minimum years of experience (inclusive). */
  minExperience?: number;
  /** Decision-6 note: the directory's own "Available" filter (Stage 13's
   *  scenario) means OPEN only -- SELECTIVE and NOT_AVAILABLE are both
   *  excluded. This is a boolean toggle, not a 3-way select, for exactly
   *  that reason: there is only one filtered state worth exposing here.
   *  (Distinct from M6's future matching-gate semantics, which will exclude
   *  only NOT_AVAILABLE -- do not copy this toggle's meaning into M6.) */
  availableOnly?: boolean;
  industry?: string;
}

function applyFilters<
  Q extends {
    or: (expr: string) => Q;
    ilike: (col: string, pattern: string) => Q;
    gte: (col: string, val: number) => Q;
    eq: (col: string, val: string) => Q;
  },
>(query: Q, filters: DirectoryFilters, professionIdsMatchingSearch: string[]) {
  let q = query;
  if (filters.location) {
    q = q.ilike("location", `%${filters.location}%`);
  }
  if (filters.minExperience != null) {
    q = q.gte("years_of_experience", filters.minExperience);
  }
  if (filters.availableOnly) {
    q = q.eq("availability", "OPEN");
  }
  if (filters.industry) {
    q = q.ilike("industry", `%${filters.industry}%`);
  }
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      // Decision 3: profession search matches EITHER the taxonomy name
      // (resolved to profession ids below, before this call) OR the
      // free-text profession, OR the member's name -- substring match only.
      const escaped = term.replace(/[%,]/g, "");
      const orParts = [
        `first_name.ilike.%${escaped}%`,
        `last_name.ilike.%${escaped}%`,
        `profession_freetext.ilike.%${escaped}%`,
      ];
      if (professionIdsMatchingSearch.length > 0) {
        orParts.push(
          `primary_profession_id.in.(${professionIdsMatchingSearch.join(",")})`,
        );
      }
      q = q.or(orParts.join(","));
    }
  }
  return q;
}

/** Every directory-visible professional matching the given filters. The
 *  gate's WHERE clauses are unconditional and applied before any filter. */
export async function getDirectoryProfessionals(
  filters: DirectoryFilters = {},
): Promise<DirectoryProfessional[]> {
  const supabase = await createClient();

  // Decision 3: resolve the search term against taxonomy profession names
  // first, so the main query can OR against matching profession ids.
  let professionIdsMatchingSearch: string[] = [];
  const term = filters.search?.trim();
  if (term) {
    const { data: matchedProfessions } = await supabase
      .from("professions")
      .select("id")
      .ilike("name", `%${term.replace(/[%,]/g, "")}%`);
    professionIdsMatchingSearch = (matchedProfessions ?? []).map((p) => p.id);
  }

  let query = supabase
    .from("members")
    .select(
      "id, first_name, last_name, job_title, location, industry, employment_status, years_of_experience, availability, primary_profession_id, membership_status, credentials_status, profile_status",
    )
    .eq("profile_status", "PROFILE_COMPLETE")
    .eq("membership_status", "CONFIRMED")
    .in("credentials_status", ["REVIEWED", "REVIEW_PENDING"]);

  query = applyFilters(query, filters, professionIdsMatchingSearch);

  const { data } = await query.order("first_name", { ascending: true });
  const rows = data ?? [];

  const professionIds = Array.from(
    new Set(
      rows
        .map((r) => r.primary_profession_id)
        .filter((v): v is string => v != null),
    ),
  );
  const { data: professions } = professionIds.length
    ? await supabase
        .from("professions")
        .select("id, name")
        .in("id", professionIds)
    : { data: [] as { id: string; name: string }[] };
  const nameById = new Map(
    (professions ?? []).map((p) => [p.id, p.name] as const),
  );

  return rows.map((r) => ({
    memberId: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    jobTitle: r.job_title,
    location: r.location,
    industry: r.industry,
    employmentStatus: r.employment_status,
    yearsOfExperience: r.years_of_experience,
    availability: r.availability as Availability,
    membershipStatus: r.membership_status as "CONFIRMED",
    credentialsStatus: r.credentials_status as "REVIEWED" | "REVIEW_PENDING",
    professionName: r.primary_profession_id
      ? (nameById.get(r.primary_profession_id) ?? null)
      : null,
  }));
}

/** Total directory-visible members, unfiltered -- Decision 7's admin
 *  dashboard stat. The SAME unconditional gate clauses as
 *  getDirectoryProfessionals, no search/filter params: this is a total,
 *  not a filtered count, so there is exactly one definition of "verified
 *  professional" anywhere in the app. */
export async function getDirectoryProfessionalCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("profile_status", "PROFILE_COMPLETE")
    .eq("membership_status", "CONFIRMED")
    .in("credentials_status", ["REVIEWED", "REVIEW_PENDING"]);
  return count ?? 0;
}

/** Is ONE member directory-visible right now? Re-reads the row and applies
 *  the same predicate. Used by tests, the Admin Professional Profile's
 *  not-found guard, and any single-member check. */
export async function isMemberInDirectory(memberId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("membership_status, credentials_status, profile_status")
    .eq("id", memberId)
    .maybeSingle();

  if (!data) return false;
  if (data.profile_status !== "PROFILE_COMPLETE") return false;
  return isDirectoryVisible(data.membership_status, data.credentials_status);
}
