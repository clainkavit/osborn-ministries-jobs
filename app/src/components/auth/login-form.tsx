"use client";

// Stage 21 sections 12-14. Login form, shared by the member (/login) and
// admin (/admin/login) screens -- same call, role-derived destination. The
// `variant` prop only changes copy/links, not behavior.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login as loginAction } from "@/lib/auth/actions";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({ variant }: { variant: "member" | "admin" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      router.push(result.data.redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="emailOrPhone">
          {variant === "admin" ? "Email" : "Email or phone"}
        </Label>
        <Input
          id="emailOrPhone"
          autoComplete="username"
          {...register("emailOrPhone")}
        />
        {errors.emailOrPhone ? (
          <p className="text-sm text-destructive">
            {errors.emailOrPhone.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
