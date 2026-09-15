// Stage 23 (M3) + Stage 30 (M8) -- the member's in-app notifications list.
// Verification decisions and application-status updates (shortlisted,
// interview, selected, rejected) land here with Stage 12 copy stored at
// creation.

import { getMyNotifications } from "@/lib/notifications/queries";
import { NotificationRow } from "@/components/notifications/notification-row";

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Updates about your profile and your applications.
        </p>
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          Nothing yet. We&rsquo;ll let you know when there&rsquo;s an update
          on your profile or an application.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationRow notification={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
