"use client";

// Step 5 -- Skills. Tag entry; free text allowed (upserts into skills).
// Suggested set from the chosen profession is shown for one-tap add.
// 1+ skill required (completeness gate). Persists immediately (Stage 22).

import { useEffect, useState, useTransition } from "react";
import { addSkill, removeSkill } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WizardStepProps } from "../onboarding-wizard";
import type { SkillTag } from "@/types/member";

export function SkillsStep({ profile, bindNext, refresh }: WizardStepProps) {
  const [isBusy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<SkillTag[]>([]);

  bindNext(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (profile.primaryProfessionId) {
      params.set("profession", profile.primaryProfessionId);
    }
    fetch(`/api/skills?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { skills: [] }))
      .then((d: { skills: SkillTag[] }) => setSuggestions(d.skills ?? []))
      .catch(() => setSuggestions([]));
  }, [profile.primaryProfessionId]);

  const have = new Set(profile.skills.map((s) => s.name.toLowerCase()));

  function addByName(name: string) {
    if (!name.trim()) return;
    setError(null);
    start(async () => {
      const res = await addSkill({ name: name.trim() });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setText("");
      refresh();
    });
  }

  function addById(id: string) {
    setError(null);
    start(async () => {
      const res = await addSkill({ skillId: id });
      if (!res.success) setError(res.error);
      else refresh();
    });
  }

  function remove(skillId: string) {
    start(async () => {
      await removeSkill(skillId);
      refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Skills</h2>
        <p className="text-sm text-muted-foreground">
          Add the skills that best describe what you can do. Add at least one.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <Badge key={s.id} variant="secondary" className="gap-1.5">
            {s.name}
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label={`Remove ${s.name}`}
              className="text-muted-foreground hover:text-foreground"
              disabled={isBusy}
            >
              ×
            </button>
          </Badge>
        ))}
        {profile.skills.length === 0 ? (
          <span className="text-sm text-muted-foreground">No skills yet.</span>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addByName(text);
        }}
        className="flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a skill and press Add"
        />
        <Button type="submit" disabled={isBusy || !text.trim()}>
          Add
        </Button>
      </form>

      {suggestions.filter((s) => !have.has(s.name.toLowerCase())).length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Suggested for your profession
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !have.has(s.name.toLowerCase()))
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addById(s.id)}
                  disabled={isBusy}
                  className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                >
                  + {s.name}
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
