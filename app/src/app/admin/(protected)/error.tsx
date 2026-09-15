"use client";

// Stage 31 (M9) error-state pass. Same reasoning as the member route
// group's error.tsx.

import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm font-medium">
        Connection lost. Check your internet and try again.
      </p>
      <Button onClick={reset} size="sm">
        Try again
      </Button>
    </div>
  );
}
