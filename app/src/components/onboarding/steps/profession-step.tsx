"use client";

// Step 2 -- Profession. Searchable list against the taxonomy; free-text
// fallback is accepted and NOT blocking (Stage 10, Stage 22 test 13).
// Industry is prefilled from the chosen profession's category but editable
// (Stage 10).

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { WizardStepProps } from "../onboarding-wizard";
import type { AuthActionResult } from "@/types/auth";
import type { Profession } from "@/types/member";

export function ProfessionStep({
  profile,
  bindNext,
  save,
}: WizardStepProps & { save: (raw: unknown) => Promise<AuthActionResult> }) {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [query, setQuery] = useState(
    profile.profession?.name ?? profile.professionFreetext ?? "",
  );

  useEffect(() => {
    fetch("/api/professions")
      .then((r) => (r.ok ? r.json() : { professions: [] }))
      .then((d: { professions: Profession[] }) =>
        setProfessions(d.professions ?? []),
      )
      .catch(() => setProfessions([]));
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(
    profile.primaryProfessionId,
  );
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? "");
  const [industry, setIndustry] = useState(profile.industry ?? "");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return professions.slice(0, 8);
    return professions
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.synonyms.some((s) => s.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query, professions]);

  function pick(id: string, name: string, category: string) {
    setSelectedId(id);
    setQuery(name);
    if (!industry) setIndustry(category);
  }

  bindNext(async () => {
    const useTaxonomy =
      !!selectedId &&
      professions.find((p) => p.id === selectedId)?.name.toLowerCase() ===
        query.trim().toLowerCase();

    const payload = {
      primaryProfessionId: useTaxonomy ? selectedId : null,
      professionFreetext: useTaxonomy ? null : query.trim() || null,
      jobTitle: jobTitle.trim() || null,
      industry: industry.trim() || null,
    };
    if (!payload.primaryProfessionId && !payload.professionFreetext) {
      return { success: false, error: "Choose a profession or type your own." };
    }
    const res = await save(payload);
    return res.success
      ? { success: true }
      : { success: false, error: res.error };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What do you do?</h2>
        <p className="text-sm text-muted-foreground">
          Your primary profession. If it&apos;s not in the list, just type it.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profession">Primary profession</Label>
        <Input
          id="profession"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          placeholder="Search or type a profession"
          autoComplete="off"
        />
        {matches.length > 0 ? (
          <ul className="rounded-md border">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p.id, p.name, p.category)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                    selectedId === p.id && "bg-muted",
                  )}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input
          id="jobTitle"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Optional — e.g. Project Engineer"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Construction"
        />
      </div>
    </div>
  );
}
