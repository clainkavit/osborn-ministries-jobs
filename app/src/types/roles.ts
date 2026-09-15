// Stage 21 section 28. Centralized role type — never scatter role string
// literals through individual files.

export type UserRole = "MEMBER" | "CHURCH_ADMIN" | "SUPER_ADMIN";

export const USER_ROLES: readonly UserRole[] = [
  "MEMBER",
  "CHURCH_ADMIN",
  "SUPER_ADMIN",
] as const;
