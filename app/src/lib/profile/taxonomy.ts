// Stage 22 -- GET /professions, GET /skills?profession=. Server-only reads of
// the reference tables. Search matches name OR any synonym (Stage 10).

import { createClient } from "@/lib/supabase/server";
import type { Profession, SkillTag } from "@/types/member";

/** Professions matching `q` on name or synonym; all of them if `q` is empty. */
export async function searchProfessions(q: string): Promise<Profession[]> {
  const supabase = await createClient();
  const query = supabase.from("professions").select("*").order("name");

  const { data, error } = q.trim()
    ? await query.or(
        `name.ilike.%${q.trim()}%,synonyms.cs.{${q.trim().toLowerCase()}}`,
      )
    : await query;

  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    synonyms: r.synonyms,
  }));
}

/** Suggested skills for a profession (by its category's typical set), plus a
 *  general fallback. For M2 this is a simple heuristic: skills whose name or
 *  synonym contains a token from the profession name, else the first N. */
export async function suggestedSkills(
  professionId: string | null,
): Promise<SkillTag[]> {
  const supabase = await createClient();

  if (!professionId) {
    const { data } = await supabase
      .from("skills")
      .select("id, name")
      .order("name")
      .limit(12);
    return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
  }

  const { data: prof } = await supabase
    .from("professions")
    .select("name, category")
    .eq("id", professionId)
    .maybeSingle();

  const { data: all } = await supabase
    .from("skills")
    .select("id, name, synonyms")
    .order("name");
  if (!all) return [];

  const tokens = `${prof?.name ?? ""} ${prof?.category ?? ""}`
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 3);

  const scored = all
    .map((s) => {
      const hay = `${s.name} ${(s.synonyms ?? []).join(" ")}`.toLowerCase();
      const score = tokens.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { skill: { id: s.id, name: s.name }, score };
    })
    .sort((a, b) => b.score - a.score);

  const hits = scored.filter((x) => x.score > 0).map((x) => x.skill);
  if (hits.length >= 6) return hits.slice(0, 12);
  // top up with the first alphabetical skills not already included
  const extra = scored
    .filter((x) => x.score === 0)
    .map((x) => x.skill)
    .slice(0, 12 - hits.length);
  return [...hits, ...extra];
}

export async function listAllSkills(): Promise<SkillTag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("id, name")
    .order("name");
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}
