// Stage 21 section 25.

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot your password?">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
