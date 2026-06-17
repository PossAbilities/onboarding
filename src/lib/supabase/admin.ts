import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "../config";

/**
 * Service-role Supabase client — SERVER ONLY. Bypasses RLS for privileged
 * admin actions (inviting starters, bulk import). Never import this into a
 * Client Component.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are required for admin actions.",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
