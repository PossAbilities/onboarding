import "server-only";
import { randomBytes } from "node:crypto";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { demoState } from "./demo-store";
import type { ApiKey, InboundEvent } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapKeyRow(r: any): ApiKey {
  return {
    id: r.id,
    name: r.name,
    key: r.key,
    revoked: r.revoked ?? false,
    lastUsedAt: r.last_used_at ?? null,
    createdAt: r.created_at,
  };
}

/* ───────────────────────── API keys (admin) ───────────────────────── */

export async function listApiKeys(): Promise<ApiKey[]> {
  if (!isSupabaseConfigured) return [...demoState().apiKeys].reverse();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapKeyRow);
}

export async function createApiKey(name: string): Promise<ApiKey> {
  const key = `pa_live_${randomBytes(24).toString("hex")}`;
  const now = new Date().toISOString();
  const row: ApiKey = {
    id: `key-${Date.now()}`,
    name: name.trim() || "API key",
    key,
    revoked: false,
    lastUsedAt: null,
    createdAt: now,
  };
  if (!isSupabaseConfigured) {
    demoState().apiKeys.push(row);
    return row;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("api_keys").insert({
    id: row.id,
    name: row.name,
    key: row.key,
    revoked: false,
    created_at: now,
  });
  return row;
}

export async function revokeApiKey(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const k = demoState().apiKeys.find((x) => x.id === id);
    if (k) k.revoked = true;
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
}

export async function getInboundEvents(limit = 30): Promise<InboundEvent[]> {
  if (!isSupabaseConfigured) {
    return [...demoState().inboundEvents].slice(-limit).reverse();
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("inbound_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    endpoint: r.endpoint,
    ok: r.ok,
    status: r.status,
    summary: r.summary,
    createdAt: r.created_at,
  }));
}

/* ───────────────────── Inbound request handling ───────────────────── */

/** Validate a presented key against active keys (service-role, no session). */
export async function validateApiKey(key: string | null): Promise<boolean> {
  if (!key) return false;
  if (!isSupabaseConfigured) {
    const k = demoState().apiKeys.find((x) => x.key === key && !x.revoked);
    if (k) k.lastUsedAt = new Date().toISOString();
    return !!k;
  }
  try {
    const { createSupabaseAdminClient } = await import("./supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("api_keys")
      .select("id,revoked")
      .eq("key", key)
      .maybeSingle();
    if (!data || data.revoked) return false;
    await admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
    return true;
  } catch {
    return false;
  }
}

export async function logInbound(
  endpoint: string,
  ok: boolean,
  status: number,
  summary: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const arr = demoState().inboundEvents;
    arr.push({ id: `in-${Date.now()}-${arr.length}`, endpoint, ok, status, summary, createdAt: now });
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    return;
  }
  try {
    const { createSupabaseAdminClient } = await import("./supabase/admin");
    const admin = createSupabaseAdminClient();
    await admin.from("inbound_events").insert({ endpoint, ok, status, summary, created_at: now });
  } catch {
    /* best-effort */
  }
}

export interface StarterUpsert {
  email: string;
  full_name?: string;
  role?: string;
  department?: string;
  manager_id?: string;
  badge_status?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Upsert a starter from an external system. Updates an existing profile (by
 * email) or creates+invites a new one. Custom fields (e.g. badge_status) are
 * merged into the profile's `metadata`.
 */
export async function upsertStarterInbound(
  input: StarterUpsert,
): Promise<{ ok: boolean; action: string; message: string }> {
  const meta = { ...(input.metadata ?? {}) };
  if (input.badge_status) meta.badge_status = input.badge_status;

  if (!isSupabaseConfigured) {
    const state = demoState();
    const existing = state.starters.find((s) => s.email === input.email);
    if (existing) {
      if (input.role) existing.roleTag = input.role;
      if (input.department) existing.department = input.department;
      if (input.manager_id) existing.managerId = input.manager_id;
      return { ok: true, action: "updated", message: `Updated ${input.email}.` };
    }
    state.starters.unshift({
      id: `s-${Date.now()}`,
      fullName: input.full_name ?? input.email,
      email: input.email,
      roleTag: input.role ?? "New Starter",
      department: input.department ?? null,
      managerId: input.manager_id ?? null,
      avatarUrl: null,
      isAdmin: false,
      journeyPoints: 0,
      status: "invited",
      startedAt: null,
      lastActivityAt: null,
      invitedBy: "inbound",
    });
    return { ok: true, action: "created", message: `Created ${input.email}.` };
  }

  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id,metadata")
    .eq("email", input.email)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (input.role) patch.role_tag = input.role;
  if (input.department) patch.department = input.department;
  if (input.manager_id) patch.manager_id = input.manager_id;
  if (input.full_name) patch.full_name = input.full_name;

  if (existing) {
    patch.metadata = { ...(existing.metadata ?? {}), ...meta };
    await admin.from("profiles").update(patch).eq("id", existing.id);
    return { ok: true, action: "updated", message: `Updated ${input.email}.` };
  }

  // New starter — invite them so they get a login.
  const { siteUrl } = await import("./config");
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${siteUrl}/accept-invite`,
    data: { full_name: input.full_name ?? input.email, role_tag: input.role ?? "New Starter" },
  });
  if (error) return { ok: false, action: "error", message: error.message };
  if (data.user) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      email: input.email,
      full_name: input.full_name ?? input.email,
      role_tag: input.role ?? "New Starter",
      department: input.department ?? null,
      manager_id: input.manager_id ?? null,
      is_admin: false,
      status: "invited",
      invited_by: "inbound",
      metadata: meta,
    });
  }
  return { ok: true, action: "created", message: `Invited ${input.email}.` };
}
