// Stage 21 sections 16-18. Member area layout. Middleware already guarantees
// a session here; this layout fetches the member for the display name and
// wraps children in the member shell. A defensive redirect stays in case the
// members row is somehow missing (e.g. registration half-completed).
//
// Stage 23 (M3): also reads the unread-notification count for the top-bar bell.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/queries";
import { getUnreadCount } from "@/lib/notifications/queries";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const unreadCount = await getUnreadCount();

  return (
    <AppShell
      variant="member"
      displayName={member.firstName}
      headerRight={<NotificationBell unreadCount={unreadCount} />}
    >
      {children}
    </AppShell>
  );
}
