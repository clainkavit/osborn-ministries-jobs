"use client";

// Step 6 -- CV upload. PDF/DOC/DOCX, <= 10 MB. Client-side pre-check mirrors
// the server validation (Stage 11 copy). Persists immediately on upload.
// 1 CV required (completeness gate).

import { useRef, useState, useTransition } from "react";
import { uploadCv, deleteDocument } from "@/lib/profile/actions";
import {
  ACCEPTED_CV_EXT,
  MAX_DOCUMENT_BYTES,
} from "@/lib/profile/schemas";
import { Button } from "@/components/ui/button";
import type { WizardStepProps } from "../onboarding-wizard";

export function CvStep({ profile, bindNext, refresh }: WizardStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  bindNext(null);

  const cv = profile.documents.find((d) => d.type === "CV") ?? null;

  function onFile(file: File) {
    setError(null);
    const nameLower = file.name.toLowerCase();
    if (!ACCEPTED_CV_EXT.some((e) => nameLower.endsWith(e))) {
      setError("That file type isn't supported. Upload a PDF, DOC, or DOCX.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError("That file is too large. Documents must be under 10 MB.");
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await uploadCv(fd);
      if (!res.success) {
        setError(res.error);
        return;
      }
      refresh();
    });
  }

  function remove() {
    if (!cv) return;
    start(async () => {
      await deleteDocument(cv.id);
      refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Your CV</h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF, DOC, or DOCX. Up to 10 MB.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {cv ? (
        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span className="font-medium">{cv.filename}</span>
          <button
            type="button"
            onClick={remove}
            className="text-xs text-destructive hover:underline"
            disabled={isBusy}
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            {isBusy ? "Uploading…" : "Choose file"}
          </Button>
        </div>
      )}
    </div>
  );
}
