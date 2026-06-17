import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "../config";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth cookies via Next 16's async `cookies()`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // Called from a Server Component — safe to ignore; the proxy
          // refreshes the session cookie on navigation.
        }
      },
    },
  });
}
