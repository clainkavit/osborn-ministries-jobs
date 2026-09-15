"use client";

// Stage 31 (M9) error-state pass. Route-group level boundary -- catches
// rendering/data errors Next.js would otherwise show as its own unstyled
// error screen. Stage 11's system-wide "General network failure" copy,
// since most failures reaching this level are the same underlying class of
// problem (a fetch to Supabase not resolving) regardless of which screen
// triggered it. Feature-specific error copy (wrong password, duplicate
// application, etc.) is unaffected -- those are handled inline, well
// before anything would reach this boundary.

import { Button } from "@/components/ui/button";

export default function MemberError({
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
