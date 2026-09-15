// Stage 21 section 13.

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Create account
          </Link>
        </>
      }
    >
      <LoginForm variant="member" />
    </AuthCard>
  );
}
