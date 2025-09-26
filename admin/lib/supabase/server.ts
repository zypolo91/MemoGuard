import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { assertSupabaseCredentials } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __memoGuardSupabaseAdmin: SupabaseClient | undefined;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!globalThis.__memoGuardSupabaseAdmin) {
    const { supabaseUrl, supabaseKey } = assertSupabaseCredentials();
    globalThis.__memoGuardSupabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          "X-Client-Info": "memoguard-admin"
        }
      }
    });
  }

  return globalThis.__memoGuardSupabaseAdmin;
}
