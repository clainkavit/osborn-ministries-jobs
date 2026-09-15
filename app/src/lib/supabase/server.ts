// Stage 21 section 6. Server-side Supabase client for Server Components,
// Server Actions, and Route Handlers. Reads/writes the session cookie via
// Next.js's cookies() API so auth state stays in sync between client and
// server. Still uses the publishable key here -- this client respects RLS,
// it does not bypass it. The secret/service-role key is not used anywhere
// in this file or in M1; it is reserved for a future admin-only client if
// an operation genuinely needs to bypass RLS (none does in M1).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component -- safe to ignore if
            // middleware.ts is also refreshing the session, which it does.
          }
        },
      },
    },
  );
}
