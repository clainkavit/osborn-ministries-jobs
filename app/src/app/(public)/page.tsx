// Stage 21 section 16: `/` is public. M1 landing -- minimal, since the real
// public marketing page isn't in M1 scope. Just enough to route people to
// register or sign in.

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Professional Network
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Pastor Tony Osborn Ministries. Build your professional profile so the
          church can connect your skills and experience with real opportunities.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/register">Create account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
