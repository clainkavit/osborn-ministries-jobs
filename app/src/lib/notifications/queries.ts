// Stage 23 (M3) -- member's own in-app notifications. Server-only. RLS scopes
// to the caller.

import { createClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/types/notification";

export async function getMyNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    memberId: r.member_id,
    type: r.type,
    bodyText: r.body_text,
    relatedUrl: r.related_url,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
}
