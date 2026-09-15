// Stage 21 section 14. Separate entry point from /login. Same auth call; the
// role check and redirect to /admin/dashboard happen in the login action +
// middleware. A member who signs in here still lands on /dashboard (the
// destination is role-derived, not screen-derived).

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <AuthCard title="Administrator sign in">
      <LoginForm variant="admin" />
    </AuthCard>
  );
}
