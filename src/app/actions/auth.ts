"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/auth";

const COOKIE_OPTS = {
  httpOnly: true,
  // HTTPS-only in production. Browsers treat localhost as secure, so local dev still works.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

/** DEMO MODE: sign in as the sample employee or admin with one click. */
export async function demoLogin(role: "employee" | "admin") {
  const store = await cookies();
  store.set(DEMO_COOKIE, role, COOKIE_OPTS);
  redirect(role === "admin" ? "/admin" : "/home");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    const store = await cookies();
    store.delete(DEMO_COOKIE);
  }
  redirect("/login");
}

export type AuthFormState = { error?: string } | undefined;

/** Real sign-in (Supabase email + password). */
export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("email", email)
    .maybeSingle();
  redirect(data?.is_admin ? "/admin" : "/home");
}

/** New starter accepting an invite — sets their password & activates them. */
export async function acceptInvite(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.is_admin ?? false;
    // status/started_at aren't user-writable (migration 0013), so the server
    // sets them, and only once: when a pending invite is first accepted. Re-running
    // this action can't reset a completed starter or restart their start date.
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data: current } = await admin
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    if (current?.status === "invited") {
      // Admins are already active; only stamp the journey start for real starters.
      const patch: { status: string; started_at?: string } = { status: "active" };
      if (!isAdmin) patch.started_at = new Date().toISOString();
      await admin
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .eq("status", "invited");
    }
  }
  redirect(isAdmin ? "/admin" : "/home");
}
