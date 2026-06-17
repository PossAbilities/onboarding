import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { DEMO_ADMIN, DEMO_USER } from "./seed";
import type { Profile } from "./types";

export const DEMO_COOKIE = "poss_demo_role";

/**
 * Resolve the currently signed-in profile, or null. Works in both modes:
 *  - Demo: a cookie records whether the demo employee or admin is "signed in".
 *  - Supabase: reads the auth session and the matching `profiles` row.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const store = await cookies();
    const role = store.get(DEMO_COOKIE)?.value;
    if (role === "admin") return DEMO_ADMIN;
    if (role === "employee") return DEMO_USER;
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) {
    // Authenticated but no profile row yet — return a minimal profile.
    return {
      id: user.id,
      fullName: (user.user_metadata?.full_name as string) ?? user.email ?? "New Starter",
      email: user.email ?? "",
      roleTag: (user.user_metadata?.role_tag as string) ?? "New Starter",
      avatarUrl: null,
      isAdmin: false,
      journeyPoints: 0,
      status: "active",
      startedAt: null,
      lastActivityAt: null,
      invitedBy: null,
    };
  }

  return mapProfileRow(data);
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/journey");
  return profile;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    roleTag: row.role_tag ?? "New Starter",
    avatarUrl: row.avatar_url ?? null,
    isAdmin: row.is_admin ?? false,
    journeyPoints: row.journey_points ?? 0,
    status: row.status ?? "active",
    startedAt: row.started_at ?? null,
    lastActivityAt: row.last_activity_at ?? null,
    invitedBy: row.invited_by ?? null,
  };
}
