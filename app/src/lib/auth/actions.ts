"use server";

// Stage 21 section 27. Write-side auth: register, login, logout,
// requestPasswordReset, resetPassword. Server Actions. Each re-validates its
// input server-side with the same Zod schema the form uses (Stage 21
// section 11 -- "sensitive operations must never depend solely on frontend
// checks"), talks to Supabase Auth for credentials, and for register also
// creates the public.members row (Stage 21 section 7, 10).
//
// On SUCCESS these redirect() from the server -- the Supabase session cookie
// is set in the same request, so a server redirect lands on the protected
// route with the session already valid. (A client-side router.push after the
// action races the router cache and the freshly-set cookie.) redirect()
// throws a NEXT_REDIRECT signal that Next handles; it is intentionally not
// caught here.
//
// On FAILURE they return an AuthActionResult the form renders inline.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
} from "@/lib/validation/auth";
import { getCurrentMember } from "@/lib/auth/queries";
import {
  POST_REGISTRATION_DESTINATION,
  postAuthDestination,
} from "@/lib/auth/redirects";
import type { AuthActionResult } from "@/types/auth";

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Stage 21 section 10-11. Creates the auth user and the members row.
 *  Returns { success: true } on success -- the client then navigates to
 *  onboarding. (A server-side redirect() from here into /onboarding, which
 *  itself may redirect(), gets swallowed by Next 16's chained-redirect
 *  handling and leaves the browser on /register.) */
export async function register(
  raw: unknown,
): Promise<AuthActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { firstName, lastName, emailOrPhone, password } = parsed.data;

  const supabase = await createClient();
  const isEmail = looksLikeEmail(emailOrPhone);

  const { data, error } = await supabase.auth.signUp(
    isEmail
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password },
  );

  if (error) {
    if (
      error.message.toLowerCase().includes("already") ||
      error.status === 422
    ) {
      return {
        success: false,
        error:
          "An account already exists with that email or phone. Sign in instead?",
      };
    }
    return {
      success: false,
      error: "We couldn't create your account. Please try again.",
    };
  }

  const authUserId = data.user?.id;
  if (!authUserId) {
    return {
      success: false,
      error: "We couldn't create your account. Please try again.",
    };
  }

  // Stage 21 section 7: every new user is a MEMBER; the members row is the
  // authorization source of truth.
  const { error: memberError } = await supabase.from("members").insert({
    auth_user_id: authUserId,
    role: "MEMBER",
    first_name: firstName,
    last_name: lastName,
    email: isEmail ? emailOrPhone : null,
    phone: isEmail ? null : emailOrPhone,
  });

  if (memberError) {
    return {
      success: false,
      error: "We couldn't create your account. Please try again.",
    };
  }

  return {
    success: true,
    data: { redirectTo: POST_REGISTRATION_DESTINATION },
  };
}

/** Stage 21 sections 12-14. Same call for member and admin; the destination
 *  is role- and profile-status-derived. Returns { success, data.redirectTo }
 *  and the client navigates -- see the note on register() for why not a
 *  server redirect(). */
export async function login(
  raw: unknown,
): Promise<AuthActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { emailOrPhone, password } = parsed.data;

  const supabase = await createClient();
  const isEmail = looksLikeEmail(emailOrPhone);

  const { error } = await supabase.auth.signInWithPassword(
    isEmail
      ? { email: emailOrPhone, password }
      : { phone: emailOrPhone, password },
  );

  if (error) {
    return { success: false, error: "Incorrect email or password." };
  }

  const member = await getCurrentMember();
  return {
    success: true,
    data: {
      redirectTo: postAuthDestination(
        member?.role ?? null,
        member?.profileStatus,
      ),
    },
  };
}

/** Stage 21 section 30: logout ends the session, then back to /login. */
export async function logout(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Stage 21 section 25. Non-committal response either way (doesn't reveal
 *  whether the email is registered). */
export async function requestPasswordReset(
  raw: unknown,
): Promise<AuthActionResult> {
  const parsed = passwordResetRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  // Always report success -- see screen copy in Stage 21 section 25.
  return { success: true, data: undefined };
}

/** Stage 21 section 25. Runs while the user holds a recovery session from
 *  the emailed link. */
export async function resetPassword(raw: unknown): Promise<AuthActionResult> {
  const parsed = passwordResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return {
      success: false,
      error: "We couldn't update your password. Please try again.",
    };
  }

  return { success: true, data: undefined };
}
