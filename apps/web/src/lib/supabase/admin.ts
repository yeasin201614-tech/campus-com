import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

/**
 * Server-only Supabase Service Role client.
 * NEVER import this module in any client component.
 * Only invoke after explicitly verifying the caller's session & role on the server.
 */
export function createAdminSupabaseClient() {
  const { url, isConfigured } = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfigured || !serviceKey || serviceKey.includes("your-supabase-service-role-key")) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
