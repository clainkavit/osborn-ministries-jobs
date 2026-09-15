"use client";

// Stage 21 section 25. Request a reset link. On success, swap the form for
// the non-committal confirmation message (doesn't reveal whether the address
// is registered).

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/lib/auth/actions";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestValues,
} from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  function onSubmit(values: PasswordResetRequestValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.success) {
        setSent(true);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="reset-sent">
        If an account exists for this address, we&apos;ve sent instructions to
        reset your password.
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
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
