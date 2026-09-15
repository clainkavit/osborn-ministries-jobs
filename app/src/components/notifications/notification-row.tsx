"use client";

// Stage 23 (M3) -- one notification. Clicking it marks it read (best-effort)
// and navigates to its related URL (/profile, or /profile/corrections for a
// correction request).

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification";

export function NotificationRow({
  notification,
}: {
  notification: AppNotification;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const unread = notification.readAt === null;

  function open() {
    start(async () => {
      if (unread) await markNotificationRead(notification.id);
      const href = notification.relatedUrl ?? "/dashboard";
      router.push(href);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={isPending}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50",
        unread ? "font-medium" : "text-muted-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          unread ? "bg-primary" : "bg-transparent",
        )}
      />
      <span className="flex-1">
        <span className="block">{notification.bodyText}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </span>
    </button>
  );
}
