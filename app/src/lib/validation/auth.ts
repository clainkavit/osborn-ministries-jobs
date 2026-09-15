// Stage 21 section 11. Zod schemas for the auth forms. One place for the
// rules; the same schema validates client-side (react-hook-form resolver)
// and server-side (in the actions). Error messages are the literal copy
// from Stage 21 section 11 / stage-11-states-catalog.md.

import { z } from "zod";

// Accepts either an email or an E.164-ish phone. Kept permissive on the
// phone side for a Tanzanian audience (local formats vary); the real
// verification of a phone/email is Supabase Auth's job, not this schema's.
const emailOrPhone = z
  .string()
  .min(1, "Please enter your email or phone number.")
  .refine(
    (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[0-9\s-]{7,}$/.test(v),
    "Please enter a valid email address or phone number.",
  );

const password = z
  .string()
  .min(8, "Password must contain at least 8 characters.");

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "Please enter your first name."),
    lastName: z.string().min(1, "Please enter your last name."),
    emailOrPhone,
    password,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  emailOrPhone,
  password: z.string().min(1, "Please enter your password."),
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address."),
});

export const passwordResetSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type PasswordResetRequestValues = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetValues = z.infer<typeof passwordResetSchema>;
