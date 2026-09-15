"use client";

// Step 4 -- Education. 1+ records required (completeness gate). Each persists
// immediately on "Add" (Stage 22). "Next" has nothing to save (bindNext(null)).
// The add-form validates by calling the schema's .safeParse directly.

import { useState, useTransition } from "react";
import {
  educationRecordSchema,
  coerceYear,
} from "@/lib/profile/schemas";
import {
  addEducationRecord,
  deleteEducationRecord,
} from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardStepProps } from "../onboarding-wizard";

interface Draft {
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  isCurrent: boolean;
}

const EMPTY: Draft = {
  institution: "",
  qualification: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  isCurrent: false,
};

export function EducationStep({ profile, bindNext, refresh }: WizardStepProps) {
  const [isBusy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(profile.education.length === 0);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  bindNext(null);

  function add() {
    setError(null);
    const parsed = educationRecordSchema.safeParse({
      institution: draft.institution.trim(),
      qualification: draft.qualification.trim(),
      fieldOfStudy: draft.fieldOfStudy.trim() || null,
      startYear: coerceYear(draft.startYear),
      endYear: draft.isCurrent ? null : coerceYear(draft.endYear),
      isCurrent: draft.isCurrent,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    start(async () => {
      const res = await addEducationRecord(parsed.data);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDraft(EMPTY);
      setShowForm(false);
      refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteEducationRecord(id);
      refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Education</h2>
        <p className="text-sm text-muted-foreground">
          Add at least one qualification.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Qualifications ({profile.education.length})
          </span>
          {!showForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              Add education
            </Button>
          ) : null}
        </div>

        {profile.education.map((e) => (
          <div
            key={e.id}
            className="flex items-start justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {e.qualification} — {e.institution}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.fieldOfStudy ? `${e.fieldOfStudy} · ` : ""}
                {e.startYear ?? "—"} to{" "}
                {e.isCurrent ? "Present" : (e.endYear ?? "—")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(e.id)}
              className="text-xs text-destructive hover:underline"
              disabled={isBusy}
            >
              Remove
            </button>
          </div>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-md border p-3">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="inst">Institution</Label>
              <Input
                id="inst"
                value={draft.institution}
                onChange={(e) =>
                  setDraft({ ...draft, institution: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qual">Qualification</Label>
              <Input
                id="qual"
                placeholder="e.g. BSc Civil Engineering"
                value={draft.qualification}
                onChange={(e) =>
                  setDraft({ ...draft, qualification: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fos">Field of study</Label>
              <Input
                id="fos"
                value={draft.fieldOfStudy}
                onChange={(e) =>
                  setDraft({ ...draft, fieldOfStudy: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="sy">Start year</Label>
                <Input
                  id="sy"
                  type="number"
                  value={draft.startYear}
                  onChange={(e) =>
                    setDraft({ ...draft, startYear: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ey">End year</Label>
                <Input
                  id="ey"
                  type="number"
                  value={draft.endYear}
                  onChange={(e) =>
                    setDraft({ ...draft, endYear: e.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isCurrent}
                onChange={(e) =>
                  setDraft({ ...draft, isCurrent: e.target.checked })
                }
              />
              I&apos;m still studying here
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={add}
                disabled={isBusy}
              >
                {isBusy ? "Adding…" : "Add"}
              </Button>
              {profile.education.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setDraft(EMPTY);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
