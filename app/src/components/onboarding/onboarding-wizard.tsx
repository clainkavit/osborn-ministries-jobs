"use client";

// Stage 22 -- the 8-step onboarding wizard. Client component.
//
// Autosave (Stage 22, resolving the Stage 17 contradiction): on "Next", the
// current step's server action runs BEFORE advancing. If it fails, the error
// shows and the step does not advance. Sub-collection steps (experience
// records, education, skills, CV) persist immediately on add/remove, so their
// "Next" is a no-op save.
//
// Resume (Stage 13): the server computes startStep from persisted data; this
// component opens there. After a reload mid-flow, the page recomputes and
// resumes at the right step, with data pre-filled from the DB.
//
// Step order is Journey 1's: 1 Personal · 2 Profession · 3 Experience ·
// 4 Education · 5 Skills · 6 CV · 7 Availability · 8 Review.

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StepperHeader } from "./stepper-header";
import { REVIEW_STEP, FIRST_STEP } from "@/lib/profile/steps";
import type { MemberProfile } from "@/types/member";
import {
  savePersonal,
  saveProfession,
  saveExperienceStep,
  saveAvailability,
  submitForVerification,
} from "@/lib/profile/actions";
import { PersonalStep } from "./steps/personal-step";
import { ProfessionStep } from "./steps/profession-step";
import { ExperienceStep } from "./steps/experience-step";
import { EducationStep } from "./steps/education-step";
import { SkillsStep } from "./steps/skills-step";
import { CvStep } from "./steps/cv-step";
import { AvailabilityStep } from "./steps/availability-step";
import { ReviewStep } from "./steps/review-step";

export interface WizardStepProps {
  profile: MemberProfile;
  // set by a step to expose "what Next should save"; returns an
  // AuthActionResult-like { success, error? }. Undefined => nothing to save.
  bindNext: (fn: (() => Promise<{ success: boolean; error?: string }>) | null) => void;
  // trigger a refetch of the profile (after sub-collection mutations)
  refresh: () => void;
}

export function OnboardingWizard({
  startStep,
  profile,
  editMode = false,
}: {
  startStep: number;
  profile: MemberProfile;
  // Stage 23 Gap 1: a PROFILE_COMPLETE member reopening /onboarding to edit
  // a section, not a first-time submission. Every step's save action is
  // already status-aware (requireOwnProfile + applyReverification per Stage
  // 23), so the wizard needs only two changes here: the review step's
  // "Submit for verification" becomes "Save and return to profile" and
  // navigates to /profile instead of calling submitForVerification (which is
  // REGISTERED-only and meaningless post-submission).
  editMode?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(startStep);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Steps register "what Next should save" here. A ref, not state -- steps
  // call bindNext during render, and a setState there would loop (React #185).
  const nextFnRef = useRef<
    (() => Promise<{ success: boolean; error?: string }>) | null
  >(null);

  const bindNext = useCallback(
    (fn: (() => Promise<{ success: boolean; error?: string }>) | null) => {
      nextFnRef.current = fn;
    },
    [],
  );
  const refresh = useCallback(() => router.refresh(), [router]);

  const stepProps: WizardStepProps = { profile, bindNext, refresh };

  function goBack() {
    setError(null);
    nextFnRef.current = null;
    setStep((s) => Math.max(FIRST_STEP, s - 1));
  }

  function goNext() {
    setError(null);
    startTransition(async () => {
      const fn = nextFnRef.current;
      if (fn) {
        const res = await fn();
        if (!res.success) {
          setError(res.error ?? "Couldn't save. Try again.");
          return;
        }
      }
      nextFnRef.current = null;
      router.refresh(); // pull the just-saved data back
      setStep((s) => Math.min(REVIEW_STEP, s + 1));
    });
  }

  function submit() {
    setError(null);
    if (editMode) {
      // No submitForVerification call -- the member is already
      // PROFILE_COMPLETE; each step already saved (and reverified where
      // applicable) on its own "Next". This just returns them to /profile.
      router.push("/profile");
      router.refresh();
      return;
    }
    startTransition(async () => {
      const res = await submitForVerification();
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col gap-6 py-4">
      <StepperHeader current={step} />

      {editMode ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Editing your profile. Changes to your profession, education, or
          experience may send your credentials back for review.
        </p>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex-1">
        {step === 1 && <PersonalStep {...stepProps} save={savePersonal} />}
        {step === 2 && <ProfessionStep {...stepProps} save={saveProfession} />}
        {step === 3 && (
          <ExperienceStep {...stepProps} save={saveExperienceStep} />
        )}
        {step === 4 && <EducationStep {...stepProps} />}
        {step === 5 && <SkillsStep {...stepProps} />}
        {step === 6 && <CvStep {...stepProps} />}
        {step === 7 && (
          <AvailabilityStep {...stepProps} save={saveAvailability} />
        )}
        {step === 8 && <ReviewStep {...stepProps} editMode={editMode} />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === FIRST_STEP || isPending}
        >
          Back
        </Button>
        {step < REVIEW_STEP ? (
          <Button type="button" onClick={goNext} disabled={isPending}>
            {isPending ? "Saving…" : "Next"}
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={isPending}>
            {editMode
              ? "Save and return to profile"
              : isPending
                ? "Submitting…"
                : "Submit for verification"}
          </Button>
        )}
      </div>
    </div>
  );
}
