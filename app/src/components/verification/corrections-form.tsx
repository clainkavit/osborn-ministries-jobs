"use client";

// Stage 23 (M3) -- the member correction editor.
//
// Per flagged track it shows the admin's note and the editable fields for
// that track (Req 2 / Contradiction A: the fields the track covers -- not one
// field, not the whole profile). Reuses the M2 step components for the
// credential fields.
//
// The record steps (education, skills, CV, experience records) autosave on
// their own add/remove. The column-update steps (personal, profession,
// experience step-level) register their save via bindNext -- the same
// useCallback+ref pattern the M2 wizard uses -- and a per-section "Save"
// button fires it.
//
// "Resubmit for review" calls resubmitForReview(), which moves ONLY the
// flagged track(s) to PENDING.

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resubmitForReview } from "@/lib/verification/actions";
import {
  savePersonal,
  saveProfession,
  saveExperienceStep,
} from "@/lib/profile/actions";
import { PersonalStep } from "@/components/onboarding/steps/personal-step";
import { ProfessionStep } from "@/components/onboarding/steps/profession-step";
import { ExperienceStep } from "@/components/onboarding/steps/experience-step";
import { EducationStep } from "@/components/onboarding/steps/education-step";
import { SkillsStep } from "@/components/onboarding/steps/skills-step";
import { CvStep } from "@/components/onboarding/steps/cv-step";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { MemberProfile } from "@/types/member";
import type { CorrectionInfo } from "@/types/verification";
import type { AuthActionResult } from "@/types/auth";

type SaveFn = () => Promise<{ success: boolean; error?: string }>;
type BindNext = (fn: SaveFn | null) => void;

export function CorrectionsForm({
  profile,
  corrections,
}: {
  profile: MemberProfile;
  corrections: CorrectionInfo[];
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sectionMsg, setSectionMsg] = useState<Record<string, string>>({});

  const membershipFlagged = corrections.some((c) => c.track === "MEMBERSHIP");
  const credentialsFlagged = corrections.some((c) => c.track === "CREDENTIALS");

  const refresh = useCallback(() => router.refresh(), [router]);

  // One registered save per column-update step. Refs, not state, so a step
  // calling bindNext during its render doesn't loop (React #185). Same shape
  // as the M2 wizard's nextFnRef.
  const personalSaveRef = useRef<SaveFn | null>(null);
  const professionSaveRef = useRef<SaveFn | null>(null);
  const experienceSaveRef = useRef<SaveFn | null>(null);

  const bindPersonal = useCallback<BindNext>((fn) => {
    personalSaveRef.current = fn;
  }, []);
  const bindProfession = useCallback<BindNext>((fn) => {
    professionSaveRef.current = fn;
  }, []);
  const bindExperience = useCallback<BindNext>((fn) => {
    experienceSaveRef.current = fn;
  }, []);
  const noBind = useCallback<BindNext>(() => {}, []);

  // Each handler mirrors the M2 wizard's goNext: the ref read happens INSIDE
  // the transition callback, never in an outer expression. This is also what
  // keeps react-hooks/refs quiet.
  function savePersonalSection() {
    setSectionMsg((m) => ({ ...m, personal: "" }));
    start(async () => {
      const fn = personalSaveRef.current;
      if (!fn) return;
      const res = await fn();
      setSectionMsg((m) => ({
        ...m,
        personal: res.success ? "Saved." : (res.error ?? "Couldn't save."),
      }));
    });
  }
  function saveProfessionSection() {
    setSectionMsg((m) => ({ ...m, profession: "" }));
    start(async () => {
      const fn = professionSaveRef.current;
      if (!fn) return;
      const res = await fn();
      setSectionMsg((m) => ({
        ...m,
        profession: res.success ? "Saved." : (res.error ?? "Couldn't save."),
      }));
    });
  }
  function saveExperienceSection() {
    setSectionMsg((m) => ({ ...m, experience: "" }));
    start(async () => {
      const fn = experienceSaveRef.current;
      if (!fn) return;
      const res = await fn();
      setSectionMsg((m) => ({
        ...m,
        experience: res.success ? "Saved." : (res.error ?? "Couldn't save."),
      }));
    });
  }

  function resubmit() {
    setError(null);
    start(async () => {
      const res = await resubmitForReview();
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  const wrap =
    (fn: (raw: unknown) => Promise<AuthActionResult>) => (raw: unknown) =>
      fn(raw);

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {corrections.map((c) => (
        <Alert key={c.track} variant="destructive">
          <AlertTitle>
            {c.track === "MEMBERSHIP" ? "Membership" : "Credentials"} needs a
            correction
          </AlertTitle>
          <AlertDescription>
            {c.note
              ? c.note
              : "The church asked for a change but left no note."}
          </AlertDescription>
        </Alert>
      ))}

      {membershipFlagged ? (
        <section className="space-y-3 rounded-md border p-3">
          <h3 className="text-sm font-semibold">Your details</h3>
          <PersonalStep
            profile={profile}
            bindNext={bindPersonal}
            refresh={refresh}
            save={wrap(savePersonal)}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={savePersonalSection}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save this section"}
            </Button>
            {sectionMsg.personal ? (
              <span className="text-xs text-muted-foreground">
                {sectionMsg.personal}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {credentialsFlagged ? (
        <div className="space-y-4">
          <section className="space-y-3 rounded-md border p-3">
            <h3 className="text-sm font-semibold">Profession</h3>
            <ProfessionStep
              profile={profile}
              bindNext={bindProfession}
              refresh={refresh}
              save={wrap(saveProfession)}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={saveProfessionSection}
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save this section"}
              </Button>
              {sectionMsg.profession ? (
                <span className="text-xs text-muted-foreground">
                  {sectionMsg.profession}
                </span>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-md border p-3">
            <h3 className="text-sm font-semibold">Experience</h3>
            <ExperienceStep
              profile={profile}
              bindNext={bindExperience}
              refresh={refresh}
              save={wrap(saveExperienceStep)}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={saveExperienceSection}
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save this section"}
              </Button>
              {sectionMsg.experience ? (
                <span className="text-xs text-muted-foreground">
                  {sectionMsg.experience}
                </span>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <EducationStep
              profile={profile}
              bindNext={noBind}
              refresh={refresh}
            />
            <SkillsStep profile={profile} bindNext={noBind} refresh={refresh} />
            <CvStep profile={profile} bindNext={noBind} refresh={refresh} />
          </section>
        </div>
      ) : null}

      <Button type="button" onClick={resubmit} disabled={isPending}>
        {isPending ? "Resubmitting…" : "Resubmit for review"}
      </Button>
    </div>
  );
}
