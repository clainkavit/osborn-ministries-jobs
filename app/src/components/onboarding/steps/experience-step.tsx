"use client";

// Step 3 -- Experience. Step-level: employment status + years (the
// completeness gate) -- "Next" saves these. Then 0+ job records, each
// persisted immediately on "Add". Both forms validate via .safeParse rather
// than a RHF resolver.

import { useState, useTransition } from "react";
import {
  experienceRecordSchema,
  experienceStepSchema,
} from "@/lib/profile/schemas";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
} from "@/types/member";
import {
  addExperienceRecord,
  deleteExperienceRecord,
} from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardStepProps } from "../onboarding-wizard";
import type { AuthActionResult } from "@/types/auth";

interface RecordDraft {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
const EMPTY_RECORD: RecordDraft = {
  organization: "",
  position: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

export function ExperienceStep({
  profile,
  bindNext,
  refresh,
  save,
}: WizardStepProps & { save: (raw: unknown) => Promise<AuthActionResult> }) {
  const [isBusy, start] = useTransition();
  const [recError, setRecError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rec, setRec] = useState<RecordDraft>(EMPTY_RECORD);

  const [status, setStatus] = useState<string>(profile.employmentStatus ?? "");
  const [years, setYears] = useState<string>(
    profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : "",
  );

  bindNext(async () => {
    const parsed = experienceStepSchema.safeParse({
      employmentStatus: status,
      yearsOfExperience: years === "" ? NaN : Number(years),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const res = await save(parsed.data);
    return res.success
      ? { success: true }
      : { success: false, error: res.error };
  });

  function addRecord() {
    setRecError(null);
    const parsed = experienceRecordSchema.safeParse({
      organization: rec.organization.trim(),
      position: rec.position.trim(),
      location: null,
      startDate: rec.startDate || null,
      endDate: rec.isCurrent ? null : rec.endDate || null,
      isCurrent: rec.isCurrent,
      description: null,
    });
    if (!parsed.success) {
      setRecError(parsed.error.issues[0].message);
      return;
    }
    start(async () => {
      const res = await addExperienceRecord(parsed.data);
      if (!res.success) {
        setRecError(res.error);
        return;
      }
      setRec(EMPTY_RECORD);
      setShowForm(false);
      refresh();
    });
  }

  function removeRecord(id: string) {
    start(async () => {
      await deleteExperienceRecord(id);
      refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Your experience</h2>
        <p className="text-sm text-muted-foreground">
          Your current status and how long you&apos;ve been working.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employmentStatus">Employment status</Label>
        <select
          id="employmentStatus"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Choose…</option>
          {EMPLOYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EMPLOYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="yearsOfExperience">Years of experience</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          min={0}
          value={years}
          onChange={(e) => setYears(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Roles ({profile.experience.length})
          </span>
          {!showForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              Add a role
            </Button>
          ) : null}
        </div>

        {profile.experience.map((x) => (
          <div
            key={x.id}
            className="flex items-start justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {x.position} — {x.organization}
              </p>
              <p className="text-xs text-muted-foreground">
                {x.startDate ?? "—"} to{" "}
                {x.isCurrent ? "Present" : (x.endDate ?? "—")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeRecord(x.id)}
              className="text-xs text-destructive hover:underline"
              disabled={isBusy}
            >
              Remove
            </button>
          </div>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-md border p-3">
            {recError ? (
              <p className="text-sm text-destructive">{recError}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="org">Organization</Label>
                <Input
                  id="org"
                  value={rec.organization}
                  onChange={(e) =>
                    setRec({ ...rec, organization: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pos">Position</Label>
                <Input
                  id="pos"
                  value={rec.position}
                  onChange={(e) =>
                    setRec({ ...rec, position: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sd">Start date</Label>
                <Input
                  id="sd"
                  type="date"
                  value={rec.startDate}
                  onChange={(e) =>
                    setRec({ ...rec, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed">End date</Label>
                <Input
                  id="ed"
                  type="date"
                  value={rec.endDate}
                  onChange={(e) =>
                    setRec({ ...rec, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rec.isCurrent}
                onChange={(e) =>
                  setRec({ ...rec, isCurrent: e.target.checked })
                }
              />
              I currently work here
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addRecord}
                disabled={isBusy}
              >
                {isBusy ? "Adding…" : "Add role"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setRec(EMPTY_RECORD);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
