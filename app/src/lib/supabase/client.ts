// Stage 21 section 6. Browser-side Supabase client, for use in Client
// Components only. Uses the publishable (anon) key -- never the secret key,
// see server.ts and stage-19/20/21's "critical security rule."

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
