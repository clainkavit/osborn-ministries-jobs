// Stage 21 sections 6 and 17. Session refresh + route protection, called
// from the root middleware.ts. Keeps the Supabase auth cookie fresh on every
// request and enforces the access rules from Stage 21 section 16-17:
//
//   public route            -> always allowed
//   protected, no session   -> redirect to /login
//   /admin/*, not an admin   -> redirect to /dashboard (do NOT reveal that
//                              admin areas exist; a plain member just lands
//                              back on their own dashboard)
//
// Role is read from public.members, never from client state -- Stage 21
// section 8's rule.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/roles";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/admin/login",
  "/forgot-password",
  "/reset-password",
];

const ADMIN_ROLES: readonly UserRole[] = ["CHURCH_ADMIN", "SUPER_ADMIN"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return (
    !!url &&
    !!key &&
    url !== "REPLACE_ME" &&
    key !== "REPLACE_ME" &&
    /^https?:\/\//.test(url)
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes never need a session check -- return before touching
  // Supabase so the app is fully browsable before .env.local is filled in.
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }

  // Protected route but Supabase isn't wired up yet: send to /login rather
  // than crash. (In a configured environment this branch is never taken.)
  if (!isSupabaseConfigured()) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session if it has expired -- required before any auth check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every non-public route requires a session.
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin area requires an admin role, checked against the database.
  if (pathname.startsWith("/admin")) {
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!member || !ADMIN_ROLES.includes(member.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
