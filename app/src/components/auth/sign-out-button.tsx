"use client";

// Stage 21 sections 18-20, 30. Sign out -> ends the session -> back to /login.
// The action redirects server-side, so nothing to do here after the await.

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "default";
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={onClick}
      disabled={isPending}
    >
      <LogOut className="size-4" aria-hidden />
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
