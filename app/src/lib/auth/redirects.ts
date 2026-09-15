// Stage 21 section 27. Single place that answers "where does this
// authenticated user go?" -- used right after login (sections 13-14) and
// after registration (section 10).

import type { UserRole } from "@/types/roles";
import type { ProfileStatus } from "@/types/member";
import { isAdmin } from "@/lib/authorization/permissions";

/**
 * Landing route for a user immediately after they authenticate.
 * A member who hasn't finished onboarding resumes it (Journey 1); a member
 * who has submitted goes to their dashboard.
 */
export function postAuthDestination(
  role: UserRole | null,
  profileStatus?: ProfileStatus,
): string {
  if (isAdmin(role)) return "/admin/dashboard";
  if (profileStatus === "REGISTERED") return "/onboarding";
  return "/dashboard";
}

/**
 * Where a newly registered member goes. Stage 21 section 10 / Journey 1
 * step 3: registration leads straight into the 8-step onboarding. The
 * /onboarding route gates to profile_status = REGISTERED (which every fresh
 * member is) and opens at step 1.
 */
export const POST_REGISTRATION_DESTINATION = "/onboarding";
