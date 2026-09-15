// Stage 21 sections 14, 16-18. Admin area layout. Middleware already enforces
// admin-role access to /admin/*; this layout fetches the member for the
// display name and applies the admin shell, with a defensive redirect for
// the edge case where the row is missing or the role isn't admin.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth/queries";
import { isAdmin } from "@/lib/authorization/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/admin/login");
  if (!isAdmin(member.role)) redirect("/dashboard");

  return (
    <AppShell variant="admin" displayName={`${member.firstName} (admin)`}>
      {children}
    </AppShell>
  );
}
