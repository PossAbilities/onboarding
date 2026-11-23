import "server-only";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { demoState } from "./demo-store";
import { isReservedHeaderKey, jsonStringEscape, renderTokens } from "./integration-events";
import { sendWebhook } from "./webhook-guard";
import type { Integration, IntegrationDelivery } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapIntegrationRow(r: any): Integration {
  return {
    id: r.id,
    name: r.name,
    event: r.event,
    enabled: r.enabled ?? false,
    method: r.method ?? "POST",
    url: r.url ?? "",
    headers: Array.isArray(r.headers) ? r.headers : [],
    bodyTemplate: r.body_template ?? "",
    updatedAt: r.updated_at ?? null,
  };
}
function integrationToRow(i: Integration) {
  return {
    id: i.id,
    name: i.name,
    event: i.event,
    enabled: i.enabled,
    method: i.method,
    url: i.url,
    headers: i.headers,
    body_template: i.bodyTemplate,
    updated_at: new Date().toISOString(),
  };
}

/* ───────────────────────── Admin reads / writes ───────────────────── */

export async function getIntegrations(): Promise<Integration[]> {
  if (!isSupabaseConfigured) return [...demoState().integrations];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .order("name");
  return (data ?? []).map(mapIntegrationRow);
}

export async function saveIntegration(i: Integration): Promise<void> {
  if (!isSupabaseConfigured) {
    const arr = demoState().integrations;
    const idx = arr.findIndex((x) => x.id === i.id);
    if (idx >= 0) arr[idx] = i;
    else arr.push(i);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("integrations").upsert(integrationToRow(i), { onConflict: "id" });
}

export async function createIntegration(): Promise<Integration> {
  const i: Integration = {
    id: `intg-${Date.now()}`,
    name: "New integration",
    event: "photo.submitted",
    enabled: false,
    method: "POST",
    url: "https://",
    headers: [{ key: "Content-Type", value: "application/json" }],
    bodyTemplate: '{\n  "name": "{{full_name}}"\n}',
    updatedAt: null,
  };
  await saveIntegration(i);
  return i;
}

export async function deleteIntegration(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    state.integrations = state.integrations.filter((x) => x.id !== id);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("integrations").delete().eq("id", id);
}

export async function getDeliveries(limit = 30): Promise<IntegrationDelivery[]> {
  if (!isSupabaseConfigured) {
    return [...demoState().deliveries].slice(-limit).reverse();
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("integration_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    integrationId: r.integration_id,
    integrationName: r.integration_name,
    event: r.event,
    statusCode: r.status_code,
    ok: r.ok,
    error: r.error,
    createdAt: r.created_at,
  }));
}

/* ───────────────────────── Dispatch engine ────────────────────────── */

async function enabledIntegrationsForEvent(event: string): Promise<Integration[]> {
  if (!isSupabaseConfigured) {
    return demoState().integrations.filter((i) => i.enabled && i.event === event);
  }
  // Read with the SERVICE ROLE — the dispatcher runs in employee-context server
  // actions that can't read the admin-only integrations table.
  try {
    const { createSupabaseAdminClient } = await import("./supabase/admin");
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("integrations")
      .select("*")
      .eq("event", event)
      .eq("enabled", true);
    return (data ?? []).map(mapIntegrationRow);
  } catch {
    return [];
  }
}

async function logDelivery(d: Omit<IntegrationDelivery, "id" | "createdAt">) {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const arr = demoState().deliveries;
    arr.push({ ...d, id: `del-${Date.now()}-${arr.length}`, createdAt: now });
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    return;
  }
  try {
    const { createSupabaseAdminClient } = await import("./supabase/admin");
    const admin = createSupabaseAdminClient();
    await admin.from("integration_deliveries").insert({
      integration_id: d.integrationId,
      integration_name: d.integrationName,
      event: d.event,
      status_code: d.statusCode,
      ok: d.ok,
      error: d.error,
      created_at: now,
    });
  } catch {
    /* logging is best-effort */
  }
}

/** Header values must stay on one line. */
function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

/**
 * Pick how to escape token values in the request body: form-encoded bodies get
 * URL encoding, JSON templates get JSON string escaping (so a quote or brace in
 * a starter's name can't add or change keys), and plain text is left as is.
 */
function bodyEscaper(
  template: string,
  headers: Record<string, string>,
): (value: string) => string {
  const contentType =
    Object.entries(headers).find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
  if (/x-www-form-urlencoded/i.test(contentType)) return encodeURIComponent;
  const looksJson = /^\s*[[{]/.test(template);
  if (looksJson || /json/i.test(contentType)) return jsonStringEscape;
  return (v) => v; // plain text: no structure to break

}

async function send(
  integration: Integration,
  data: Record<string, string>,
): Promise<IntegrationDelivery> {
  // Each token value is encoded for where it lands, so employee-supplied text
  // can't change the URL's host/path, inject headers, or add JSON keys.
  const url = renderTokens(integration.url, data, encodeURIComponent);

  // Null-prototype object + fixed header names: an admin-entered "__proto__"
  // (or similar) can't reach Object.prototype. Names are never templated.
  const headers = Object.create(null) as Record<string, string>;
  for (const h of integration.headers) {
    const key = h.key.trim();
    if (!key || isReservedHeaderKey(key)) continue;
    headers[key] = renderTokens(h.value, data, stripLineBreaks);
  }

  const hasBody = integration.method !== "GET";
  const body = hasBody
    ? renderTokens(integration.bodyTemplate, data, bodyEscaper(integration.bodyTemplate, headers))
    : undefined;

  let statusCode: number | null = null;
  let ok = false;
  let error: string | null = null;

  try {
    statusCode = await sendWebhook(url, integration.method, headers, body);
    ok = statusCode >= 200 && statusCode < 300;
    if (!ok) error = `HTTP ${statusCode}`;
  } catch (e) {
    error = e instanceof Error ? e.message : "Request failed";
  }

  const delivery = {
    integrationId: integration.id,
    integrationName: integration.name,
    event: integration.event,
    statusCode,
    ok,
    error,
  };
  await logDelivery(delivery);
  return { ...delivery, id: "", createdAt: new Date().toISOString() };
}

/**
 * Fire all enabled integrations for an event. Best-effort — never throws into
 * the calling user action.
 */
export async function dispatchEvent(
  event: string,
  data: Record<string, string>,
): Promise<void> {
  try {
    const integrations = await enabledIntegrationsForEvent(event);
    await Promise.all(integrations.map((i) => send(i, data)));
  } catch {
    /* swallow — integrations must never break the core flow */
  }
}

/** Admin "send test" — runs one integration with the given (sample) data. */
export async function testIntegration(
  integration: Integration,
  data: Record<string, string>,
): Promise<{ ok: boolean; statusCode: number | null; error: string | null }> {
  const res = await send(integration, data);
  return { ok: res.ok, statusCode: res.statusCode, error: res.error };
}
