// Stage 23 (M3) -- top-bar notifications bell with an unread count. Server
// component: the count is read in the member layout and passed in. A plain
// link to /notifications; no polling in M3.

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
    >
      <Bell className="size-4" aria-hidden />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-4 text-primary-foreground tabular-nums">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
