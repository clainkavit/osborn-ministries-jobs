"use client";

// Stage 21 section 18 (desktop). Persistent sidebar nav. Client component, so
// it imports the nav arrays directly -- the Lucide icon components must not
// cross the server/client boundary as props (they're objects with methods and
// aren't serializable).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MEMBER_NAV, ADMIN_NAV } from "./nav-items";

export function SidebarNav({ variant }: { variant: "member" | "admin" }) {
  const pathname = usePathname();
  const items = variant === "admin" ? ADMIN_NAV : MEMBER_NAV;

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
