"use client";

// Step 3 -- Requirements. Profession (searchable, optional -- nullable per
// Champion §23 item 2's "no specific profession" carve-out), minimum
// experience, required education level, required skills, headcount.
//
// No client-side "at least one signal" enforcement here -- that's the
// PUBLISH gate (checkOpportunityCompleteness), not a per-step save gate. A
// Draft can be saved with zero requirements; it just can't be Published
// that way.

import { useEffect, useMemo, useState } from "react";
import { saveOpportunityRequirements } from "@/lib/opportunities/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EDUCATION_LEVELS, EDUCATION_LEVEL_LABELS } from "@/types/member";
import type { OpportunityStepProps } from "../opportunity-wizard";
import type { Profession, SkillTag } from "@/types/member";

export function RequirementsStep({
  opportunity,
  bindNext,
}: OpportunityStepProps) {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [professionQuery, setProfessionQuery] = useState(
    opportunity.requirement?.professionName ?? "",
  );
  const [professionId, setProfessionId] = useState<string | null>(
    opportunity.requirement?.requiredProfessionId ?? null,
  );

  const [minExperienceYears, setMinExperienceYears] = useState(
    opportunity.requirement?.minExperienceYears != null
      ? String(opportunity.requirement.minExperienceYears)
      : "",
  );
  const [educationLevel, setEducationLevel] = useState<string>(
    opportunity.requirement?.requiredEducationLevel ?? "",
  );
  const [headcountRequired, setHeadcountRequired] = useState(
    opportunity.headcountRequired != null
      ? String(opportunity.headcountRequired)
      : "",
  );

  const [skillSuggestions, setSkillSuggestions] = useState<SkillTag[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SkillTag[]>(
    opportunity.requiredSkills,
  );
  const [skillQuery, setSkillQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/professions")
      .then((r) => (r.ok ? r.json() : { professions: [] }))
      .then((d: { professions: Profession[] }) =>
        setProfessions(d.professions ?? []),
      )
      .catch(() => setProfessions([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (professionId) params.set("profession", professionId);
    fetch(`/api/skills?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { skills: [] }))
      .then((d: { skills: SkillTag[] }) => setSkillSuggestions(d.skills ?? []))
      .catch(() => setSkillSuggestions([]));
  }, [professionId]);

  const professionMatches = useMemo(() => {
    const q = professionQuery.trim().toLowerCase();
    if (!q) return professions.slice(0, 8);
    return professions
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.synonyms.some((s) => s.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [professionQuery, professions]);

  const selectedSkillIds = new Set(selectedSkills.map((s) => s.id));
  const skillMatches = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    const pool = skillSuggestions.filter((s) => !selectedSkillIds.has(s.id));
    if (!q) return pool.slice(0, 8);
    return pool.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillQuery, skillSuggestions, selectedSkills]);

  function addSkill(skill: SkillTag) {
    setSelectedSkills((cur) => [...cur, skill]);
    setSkillQuery("");
  }

  function removeSkill(id: string) {
    setSelectedSkills((cur) => cur.filter((s) => s.id !== id));
  }

  bindNext(async () => {
    setError(null);
    const res = await saveOpportunityRequirements(opportunity.id, {
      requiredProfessionId: professionId,
      minExperienceYears: minExperienceYears.trim()
        ? Number(minExperienceYears)
        : null,
      requiredEducationLevel: educationLevel || null,
      headcountRequired: headcountRequired.trim()
        ? Number(headcountRequired)
        : null,
      skillIds: selectedSkills.map((s) => s.id),
    });
    if (!res.success) {
      setError(res.error);
      return { success: false, error: res.error };
    }
    return { success: true };
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Requirements</h2>
        <p className="text-sm text-muted-foreground">
          What are you looking for? At least one requirement is needed to
          publish.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-1.5">
        <Label htmlFor="profession">Profession</Label>
        <Input
          id="profession"
          value={professionQuery}
          onChange={(e) => {
            setProfessionQuery(e.target.value);
            setProfessionId(null);
          }}
          placeholder="Optional — search or leave blank for any profession"
        />
        {professionQuery && !professionId ? (
          <div className="rounded-md border">
            {professionMatches.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">No matches.</p>
            ) : (
              professionMatches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProfessionId(p.id);
                    setProfessionQuery(p.name);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted/60"
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minExperienceYears">Minimum experience (years)</Label>
          <Input
            id="minExperienceYears"
            type="number"
            min={0}
            value={minExperienceYears}
            onChange={(e) => setMinExperienceYears(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="headcountRequired">Number needed</Label>
          <Input
            id="headcountRequired"
            type="number"
            min={1}
            value={headcountRequired}
            onChange={(e) => setHeadcountRequired(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="educationLevel">Education level</Label>
        <select
          id="educationLevel"
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value)}
          className="h-8 w-full rounded-md border bg-transparent px-2.5 text-sm"
        >
          <option value="">Optional — no requirement</option>
          {EDUCATION_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {EDUCATION_LEVEL_LABELS[lvl]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="skillQuery">Required skills</Label>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((s) => (
            <Badge key={s.id} variant="secondary" className="gap-1">
              {s.name}
              <button
                type="button"
                onClick={() => removeSkill(s.id)}
                aria-label={`Remove ${s.name}`}
                className="ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="skillQuery"
          value={skillQuery}
          onChange={(e) => setSkillQuery(e.target.value)}
          placeholder="Optional — search skills to add"
        />
        {skillQuery ? (
          <div className="rounded-md border">
            {skillMatches.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">No matches.</p>
            ) : (
              skillMatches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-muted/60"
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
