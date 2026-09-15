"use server";

// Stage 23 (M3) -- mark a notification read.

import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/queries";
import type { AuthActionResult } from "@/types/auth";

export async function markNotificationRead(
  id: string,
): Promise<AuthActionResult> {
  const member = await getCurrentMember();
  if (!member) return { success: false, error: "You need to sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("member_id", member.id);

  if (error) return { success: false, error: "Couldn't update that." };
  return { success: true, data: undefined };
}
