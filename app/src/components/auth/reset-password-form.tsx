"use client";

// Stage 21 section 25. Set a new password. Runs while the user holds a
// recovery session from the emailed link (Supabase puts them in one when
// they land on /reset-password from the email). On success, send them to
// /login to sign in with the new password.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/lib/auth/actions";
import {
  passwordResetSchema,
  type PasswordResetValues,
} from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
  });

  function onSubmit(values: PasswordResetValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await resetPassword(values);
      if (result.success) {
        setDone(true);
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        Your password has been updated. Redirecting you to sign in&hellip;
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <p className="text-sm text-destructive">
            {errors.newPassword.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
