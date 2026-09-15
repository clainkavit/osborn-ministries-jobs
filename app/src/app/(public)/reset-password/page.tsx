// Stage 21 section 25.

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Create a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
