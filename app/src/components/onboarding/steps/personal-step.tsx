"use client";

// Step 1 -- Personal information. Fields: photo URL, DOB, gender, location.
// Only `location` gates completeness (Stage 22). Plain state + .safeParse on
// Next -- empty optional inputs coerce to null via blankToNull.

import { useState } from "react";
import {
  personalSchema,
  blankToNull,
} from "@/lib/profile/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardStepProps } from "../onboarding-wizard";
import type { AuthActionResult } from "@/types/auth";

export function PersonalStep({
  profile,
  bindNext,
  save,
}: WizardStepProps & { save: (raw: unknown) => Promise<AuthActionResult> }) {
  const [location, setLocation] = useState(profile.location ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  bindNext(async () => {
    setFieldError(null);
    const parsed = personalSchema.safeParse(
      blankToNull({ location, dateOfBirth, gender, photoUrl }),
    );
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      setFieldError(msg);
      return { success: false, error: msg };
    }
    const res = await save(parsed.data);
    return res.success
      ? { success: true }
      : { success: false, error: res.error };
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">About you</h2>
        <p className="text-sm text-muted-foreground">
          A few basics so the church knows who you are.
        </p>
      </div>

      {fieldError ? (
        <p className="text-sm text-destructive">{fieldError}</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g. Dar es Salaam"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <Input
            id="gender"
            placeholder="Optional"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input
          id="photoUrl"
          placeholder="Optional — a link to a photo of you"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </div>
    </div>
  );
}
