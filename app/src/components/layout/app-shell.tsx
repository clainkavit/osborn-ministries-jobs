// Stage 21 section 18. The shared application shell: top bar (logo, right-side
// slot), desktop sidebar (nav + sign out), main content area. The member
// variant also renders the mobile bottom nav. Server component -- takes the
// display name as a prop from the layout that already fetched the member.

import type { ReactNode } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AppShell({
  variant,
  displayName,
  headerRight,
  children,
}: {
  variant: "member" | "admin";
  displayName: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const homeHref = variant === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
        <Link href={homeHref} className="font-semibold tracking-tight">
          Professional Network
        </Link>
        <div className="flex items-center gap-3">
          {headerRight}
          <span className="hidden text-sm text-muted-foreground md:inline">
            {displayName}
          </span>
          {/* The sidebar (and its own Sign out button) is hidden below the
              md breakpoint with no mobile replacement, which left phone-width
              members and admins with no way to end their session (M10
              cross-browser finding, mobile-360). The header itself is never
              hidden, so it's the one place a sign-out control reaches every
              viewport without restructuring the sidebar or bottom nav. */}
          <SignOutButton className="md:hidden" />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r p-4 md:flex">
          <SidebarNav variant={variant} />
          <SignOutButton className="mt-2 w-full justify-start" />
        </aside>

        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>

      {variant === "member" ? <BottomNav /> : null}
    </div>
  );
}
