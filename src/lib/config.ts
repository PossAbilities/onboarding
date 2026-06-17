/**
 * Whether a real Supabase backend is configured. When false, the app runs in
 * DEMO MODE: seeded in-memory data, a one-click demo login, and no network
 * calls. This lets the site be fully viewable/clickable before any backend is
 * provisioned, then "light up" as a real product once env vars are set.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
