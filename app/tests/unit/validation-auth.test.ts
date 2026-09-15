import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  passwordResetSchema,
} from "@/lib/validation/auth";

// Stage 21 section 30, Registration checklist: weak password rejected,
// mismatched confirmation rejected, valid input accepted. These schemas run
// on both client and server, so testing them here covers both paths.

const validRegister = {
  firstName: "Grace",
  lastName: "Rweyemamu",
  emailOrPhone: "grace@example.com",
  password: "correcthorse",
  confirmPassword: "correcthorse",
};

describe("registerSchema", () => {
  it("accepts a complete, valid registration", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it("rejects a missing first name", () => {
    const r = registerSchema.safeParse({ ...validRegister, firstName: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Please enter your first name.");
    }
  });

  it("rejects a password under 8 characters", () => {
    const r = registerSchema.safeParse({
      ...validRegister,
      password: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(
        "Password must contain at least 8 characters.",
      );
    }
  });

  it("rejects mismatched password confirmation", () => {
    const r = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: "different",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "Passwords do not match.")).toBe(
        true,
      );
    }
  });

  it("accepts a phone number in place of an email", () => {
    const r = registerSchema.safeParse({
      ...validRegister,
      emailOrPhone: "+255712345678",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an obviously invalid email/phone", () => {
    const r = registerSchema.safeParse({
      ...validRegister,
      emailOrPhone: "not valid",
    });
    expect(r.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({
        emailOrPhone: "grace@example.com",
        password: "anything-nonempty",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty password", () => {
    const r = loginSchema.safeParse({
      emailOrPhone: "grace@example.com",
      password: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("accepts matching new passwords of sufficient length", () => {
    expect(
      passwordResetSchema.safeParse({
        newPassword: "brandnewpass",
        confirmPassword: "brandnewpass",
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched new passwords", () => {
    expect(
      passwordResetSchema.safeParse({
        newPassword: "brandnewpass",
        confirmPassword: "nope",
      }).success,
    ).toBe(false);
  });
});
