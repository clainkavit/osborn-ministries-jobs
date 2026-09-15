// Stage 21 section 27. Role predicates. Pure functions over a UserRole so
// they can be used on the server (after getCurrentRole) or in a component
// that already has the role in hand. They never fetch -- caller supplies the
// role, which must itself have come from the database (Stage 21 section 8).

import type { UserRole } from "@/types/roles";

export function isMember(role: UserRole | null): boolean {
  return role === "MEMBER";
}

export function isChurchAdmin(role: UserRole | null): boolean {
  return role === "CHURCH_ADMIN";
}

export function isSuperAdmin(role: UserRole | null): boolean {
  return role === "SUPER_ADMIN";
}

/** Any role that may enter /admin/*. */
export function isAdmin(role: UserRole | null): boolean {
  return role === "CHURCH_ADMIN" || role === "SUPER_ADMIN";
}
