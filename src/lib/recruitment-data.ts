import "server-only";
import { randomBytes } from "node:crypto";
import { isSupabaseConfigured, siteUrl } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { demoState } from "./demo-store";
import { DEMO_USER } from "./seed";
import {
  DEFAULT_SETTINGS,
  REFERENCE_KIND_LABEL,
  emptyRecord,
  isReferenceFilled,
  type CandidateRecord,
  type CandidateReference,
  type ChecklistKey,
  type RecruitmentSettings,
} from "./recruitment";
import type { Profile } from "./types";

/**
 * Recruitment data access. Reads in a signed-in context go through the normal
 * (RLS-protected) client; every write uses the service-role client after the
 * calling server action has checked who is allowed to make it. Candidates
 * cannot write these tables directly, so they can't tick their own checks.
 */

async function adminClient() {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  return createSupabaseAdminClient();
}

/* ───────────────────────────── Settings ───────────────────────────── */

export async function getRecruitmentSettings(): Promise<RecruitmentSettings> {
  if (!isSupabaseConfigured) {
    return { ...DEFAULT_SETTINGS, ...(demoState().recruitmentSettings ?? {}) };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "recruitment")
    .maybeSingle();
  const v = data?.value;
  return v && typeof v === "object" && !Array.isArray(v)
    ? { ...DEFAULT_SETTINGS, ...(v as Partial<RecruitmentSettings>) }
    : { ...DEFAULT_SETTINGS };
}

export async function saveRecruitmentSettings(
  s: RecruitmentSettings,
): Promise<void> {
  if (!isSupabaseConfigured) {
    demoState().recruitmentSettings = s;
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("app_settings")
    .upsert(
      { key: "recruitment", value: s, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}

/* ───────────────────────── Candidate records ──────────────────────── */

function normalise(
  userId: string,
  raw: Partial<CandidateRecord> | null | undefined,
): CandidateRecord {
  return {
    ...emptyRecord(userId),
    ...(raw ?? {}),
    userId,
    checks: { ...(raw?.checks ?? {}) },
  };
}

/** The candidate's record, or null if they were never set up as a candidate. */
export async function getCandidateRecord(
  userId: string,
): Promise<CandidateRecord | null> {
  if (!isSupabaseConfigured) {
    const r = demoState().candidateRecords[userId];
    return r ? normalise(userId, r) : null;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("candidate_records")
    .select("record")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? normalise(userId, data.record) : null;
}

/** All records, keyed by user id (admin views). */
export async function getAllCandidateRecords(): Promise<
  Record<string, CandidateRecord>
> {
  if (!isSupabaseConfigured) {
    return Object.fromEntries(
      Object.entries(demoState().candidateRecords).map(([id, r]) => [
        id,
        normalise(id, r),
      ]),
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("candidate_records")
    .select("user_id,record");
  return Object.fromEntries(
    (data ?? []).map((r) => [r.user_id, normalise(r.user_id, r.record)]),
  );
}

/** Merge `patch` into the user's record (creating it if needed). */
export async function updateCandidateRecord(
  userId: string,
  patch: Partial<CandidateRecord>,
): Promise<CandidateRecord> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured) {
    const state = demoState();
    const next = normalise(userId, {
      ...state.candidateRecords[userId],
      ...patch,
      updatedAt: now,
    });
    state.candidateRecords[userId] = next;
    return next;
  }
  const admin = await adminClient();
  const { data } = await admin
    .from("candidate_records")
    .select("record")
    .eq("user_id", userId)
    .maybeSingle();
  const next = normalise(userId, {
    ...(data?.record ?? {}),
    ...patch,
    updatedAt: now,
  });
  const { error } = await admin
    .from("candidate_records")
    .upsert(
      { user_id: userId, record: next, updated_at: now },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
  return next;
}

/** Admin: look up a single starter (or the demo employee) by id. */
export async function getProfileById(id: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    if (id === DEMO_USER.id) return DEMO_USER;
    return demoState().starters.find((s) => s.id === id) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { mapProfileRow } = await import("./auth");
  return mapProfileRow(data);
}

/* ──────────────────────────── References ──────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRefRow(r: any): CandidateReference {
  return {
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    refereeName: r.referee_name ?? "",
    refereeEmail: r.referee_email ?? "",
    refereePhone: r.referee_phone ?? "",
    organisation: r.organisation ?? "",
    refereePosition: r.referee_position ?? "",
    candidateRole: r.candidate_role ?? "",
    relationship: r.relationship ?? "",
    startMonth: r.start_month ?? "",
    endMonth: r.end_month ?? "",
    status: r.status ?? "draft",
    token: r.token ?? "",
    requestedAt: r.requested_at ?? null,
    lastSentAt: r.last_sent_at ?? null,
    reminderCount: r.reminder_count ?? 0,
    receivedAt: r.received_at ?? null,
    response: r.response ?? null,
    lastError: r.last_error ?? null,
    createdAt: r.created_at,
  };
}
function refToRow(r: CandidateReference) {
  return {
    id: r.id,
    user_id: r.userId,
    kind: r.kind,
    referee_name: r.refereeName,
    referee_email: r.refereeEmail,
    referee_phone: r.refereePhone,
    organisation: r.organisation,
    referee_position: r.refereePosition,
    candidate_role: r.candidateRole,
    relationship: r.relationship,
    start_month: r.startMonth,
    end_month: r.endMonth,
    status: r.status,
    token: r.token,
    requested_at: r.requestedAt,
    last_sent_at: r.lastSentAt,
    reminder_count: r.reminderCount,
    received_at: r.receivedAt,
    response: r.response,
    last_error: r.lastError,
    created_at: r.createdAt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const byCreated = (a: CandidateReference, b: CandidateReference) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * Columns a signed-in user may read. The referee-form `token` (the only
 * credential for submitting a reference) and the referee's `response` are
 * never readable through the normal client — not even by the candidate — so
 * a candidate can't complete or read their own references.
 */
const REF_SAFE_COLUMNS =
  "id,user_id,kind,referee_name,referee_email,referee_phone,organisation,referee_position,candidate_role,relationship,start_month,end_month,status,requested_at,last_sent_at,reminder_count,received_at,last_error,created_at";

const withoutSecrets = (r: CandidateReference): CandidateReference => ({
  ...r,
  token: "",
  response: null,
});

/**
 * A user's references. By default secrets (token, response) are stripped so
 * the result is safe to render for the candidate. `withSecrets` reads them
 * via the service role — only for admin views and sending emails.
 */
export async function getReferences(
  userId: string,
  { withSecrets = false }: { withSecrets?: boolean } = {},
): Promise<CandidateReference[]> {
  if (!isSupabaseConfigured) {
    const refs = demoState()
      .references.filter((r) => r.userId === userId)
      .sort(byCreated);
    return withSecrets ? refs.map((r) => ({ ...r })) : refs.map(withoutSecrets);
  }
  if (withSecrets) {
    const admin = await adminClient();
    const { data } = await admin
      .from("candidate_references")
      .select("*")
      .eq("user_id", userId);
    return (data ?? []).map(mapRefRow).sort(byCreated);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("candidate_references")
    .select(REF_SAFE_COLUMNS)
    .eq("user_id", userId);
  return (data ?? []).map(mapRefRow).map(withoutSecrets).sort(byCreated);
}

/** Every reference, without secrets (admin starters list progress). */
export async function getAllReferences(): Promise<CandidateReference[]> {
  if (!isSupabaseConfigured) return demoState().references.map(withoutSecrets);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("candidate_references")
    .select(REF_SAFE_COLUMNS);
  return (data ?? []).map(mapRefRow).map(withoutSecrets);
}

export type ReferenceInput = Pick<
  CandidateReference,
  | "kind"
  | "refereeName"
  | "refereeEmail"
  | "refereePhone"
  | "organisation"
  | "refereePosition"
  | "candidateRole"
  | "relationship"
  | "startMonth"
  | "endMonth"
> & { id?: string };

const newToken = () => randomBytes(24).toString("hex");

/**
 * Save the candidate's reference details. References already sent to a referee
 * are kept as they are; draft ones are replaced by the submitted list.
 */
export async function saveReferences(
  userId: string,
  input: ReferenceInput[],
): Promise<CandidateReference[]> {
  const existing = await getReferences(userId, { withSecrets: true });
  const locked = existing.filter((r) => r.status !== "draft");
  const lockedIds = new Set(locked.map((r) => r.id));

  const drafts: CandidateReference[] = input
    .filter((r) => !(r.id && lockedIds.has(r.id)))
    .filter(isReferenceFilled)
    .map((r, i) => {
      const prev = existing.find((e) => e.id === r.id);
      return {
        id:
          prev?.id ??
          `ref-${Date.now()}-${i}-${randomBytes(3).toString("hex")}`,
        userId,
        kind: r.kind,
        refereeName: r.refereeName.trim(),
        refereeEmail: r.refereeEmail.trim().toLowerCase(),
        refereePhone: r.refereePhone.trim(),
        organisation: r.organisation.trim(),
        refereePosition: r.refereePosition.trim(),
        candidateRole: r.candidateRole.trim(),
        relationship: r.relationship.trim(),
        startMonth: r.startMonth,
        endMonth: r.endMonth,
        status: "draft",
        token: prev?.token ?? newToken(),
        requestedAt: null,
        lastSentAt: null,
        reminderCount: 0,
        receivedAt: null,
        response: null,
        lastError: null,
        createdAt: prev?.createdAt ?? new Date(Date.now() + i).toISOString(),
      };
    });

  if (!isSupabaseConfigured) {
    const state = demoState();
    state.references = [
      ...state.references.filter(
        (r) => r.userId !== userId || lockedIds.has(r.id),
      ),
      ...drafts,
    ];
  } else {
    const admin = await adminClient();
    await admin
      .from("candidate_references")
      .delete()
      .eq("user_id", userId)
      .eq("status", "draft");
    if (drafts.length) {
      const { error } = await admin
        .from("candidate_references")
        .insert(drafts.map(refToRow));
      if (error) throw new Error(error.message);
    }
  }
  return [...locked, ...drafts].sort(byCreated);
}

export async function updateReference(
  id: string,
  patch: Partial<CandidateReference>,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const r = demoState().references.find((x) => x.id === id);
    if (r) Object.assign(r, patch);
    return;
  }
  const admin = await adminClient();
  const current = await admin
    .from("candidate_references")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!current.data) return;
  const row = refToRow({ ...mapRefRow(current.data), ...patch });
  await admin.from("candidate_references").update(row).eq("id", id);
}

export async function deleteReference(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const s = demoState();
    s.references = s.references.filter((r) => r.id !== id);
    return;
  }
  const admin = await adminClient();
  await admin.from("candidate_references").delete().eq("id", id);
}

/** Public referee form: look a reference up by its secret token (no session). */
export async function getReferenceByToken(token: string): Promise<{
  reference: CandidateReference;
  candidateName: string;
} | null> {
  if (!token || token.length < 16) return null;
  if (!isSupabaseConfigured) {
    const ref = demoState().references.find((r) => r.token === token);
    if (!ref) return null;
    const p = await getProfileById(ref.userId);
    return { reference: ref, candidateName: p?.fullName ?? "the candidate" };
  }
  const admin = await adminClient();
  const { data } = await admin
    .from("candidate_references")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const { data: prof } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", data.user_id)
    .maybeSingle();
  return {
    reference: mapRefRow(data),
    candidateName: prof?.full_name ?? "the candidate",
  };
}

export function referenceLink(ref: Pick<CandidateReference, "token">): string {
  return `${siteUrl}/reference/${ref.token}`;
}

/**
 * Email a reference request (or reminder) to the referee and record it.
 * In demo mode nothing is emailed — the request is simply marked as sent so
 * the referee link (shown to admins) can be tried out.
 */
export async function sendReferenceEmail(
  ref: CandidateReference,
  candidateName: string,
  kind: "request" | "reminder",
): Promise<{ ok: boolean; message: string }> {
  const now = new Date().toISOString();
  const sentPatch: Partial<CandidateReference> = {
    status: "requested",
    requestedAt: ref.requestedAt ?? now,
    lastSentAt: now,
    reminderCount:
      kind === "reminder" ? ref.reminderCount + 1 : ref.reminderCount,
    lastError: null,
  };

  if (!isSupabaseConfigured) {
    await updateReference(ref.id, sentPatch);
    return {
      ok: true,
      message: `Demo mode: ${kind} marked as sent to ${ref.refereeEmail}.`,
    };
  }

  const { sendReferenceTemplate } = await import("./mailer");
  const settings = await getRecruitmentSettings();
  const res = await sendReferenceTemplate(
    kind,
    ref.refereeEmail,
    {
      referee_name: ref.refereeName,
      candidate_name: candidateName,
      reference_link: referenceLink(ref),
      reference_type: REFERENCE_KIND_LABEL[ref.kind].toLowerCase(),
      organisation: ref.organisation,
    },
    settings.referenceFormUrl,
  );

  if (!res.ok) {
    await updateReference(ref.id, { lastError: res.error ?? "Send failed" });
    return { ok: false, message: res.error ?? "Send failed" };
  }
  await updateReference(ref.id, sentPatch);
  return { ok: true, message: `Sent to ${ref.refereeEmail}.` };
}

/** Send every draft reference for a candidate (after they submit their details). */
export async function sendDraftReferences(
  userId: string,
  candidateName: string,
) {
  const refs = await getReferences(userId, { withSecrets: true });
  const results = [];
  for (const r of refs.filter((x) => x.status === "draft")) {
    results.push(await sendReferenceEmail(r, candidateName, "request"));
  }
  return results;
}

/**
 * Cron: remind referees who haven't responded, every `reminderDays` days, up
 * to `maxReminders` times. Uses the service-role client (no session).
 */
export async function sendReferenceReminders(): Promise<{
  sent: number;
  errors: string[];
}> {
  const settings = await getRecruitmentSettings().catch(() => DEFAULT_SETTINGS);
  const days = Math.max(1, settings.reminderDays || 3);
  const cutoff = Date.now() - days * 86400000 + 60 * 60 * 1000; // 1h slack for cron timing
  let refs: CandidateReference[];
  const names = new Map<string, string>();

  if (!isSupabaseConfigured) {
    refs = [...demoState().references];
  } else {
    const admin = await adminClient();
    const { data } = await admin
      .from("candidate_references")
      .select("*")
      .eq("status", "requested")
      .limit(500);
    refs = (data ?? []).map(mapRefRow);
    const ids = [...new Set(refs.map((r) => r.userId))];
    if (ids.length) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id,full_name")
        .in("id", ids);
      for (const p of profs ?? []) names.set(p.id, p.full_name ?? "");
    }
  }

  let sent = 0;
  const errors: string[] = [];
  for (const r of refs) {
    if (r.status !== "requested") continue;
    if (settings.maxReminders > 0 && r.reminderCount >= settings.maxReminders)
      continue;
    const last = new Date(r.lastSentAt ?? r.requestedAt ?? 0).getTime();
    if (last > cutoff) continue;
    const name =
      names.get(r.userId) ||
      (await getProfileById(r.userId).catch(() => null))?.fullName ||
      "a candidate";
    const res = await sendReferenceEmail(r, name, "reminder");
    if (res.ok) sent += 1;
    else errors.push(`${r.refereeEmail}: ${res.message}`);
  }
  return { sent, errors };
}

/** Referee submits the online form. */
export async function submitReferenceResponse(
  token: string,
  response: Record<string, string>,
): Promise<{ ok: boolean; message: string; userId?: string }> {
  const found = await getReferenceByToken(token);
  if (!found)
    return { ok: false, message: "This reference link is not valid." };
  if (found.reference.status === "received") {
    return {
      ok: false,
      message: "This reference has already been submitted — thank you.",
    };
  }
  await updateReference(found.reference.id, {
    status: "received",
    receivedAt: new Date().toISOString(),
    response,
  });
  return {
    ok: true,
    message: "Thank you — your reference has been received.",
    userId: found.reference.userId,
  };
}

/** Inbound API (Ucheck / Occupational Health): tick a checklist item by email. */
export async function setCheckByEmail(
  email: string,
  key: ChecklistKey,
  done: boolean,
  source: string,
): Promise<{ ok: boolean; message: string }> {
  let userId: string | null = null;
  if (!isSupabaseConfigured) {
    userId =
      demoState().starters.find((s) => s.email.toLowerCase() === email)?.id ??
      null;
  } else {
    const admin = await adminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = data?.id ?? null;
  }
  if (!userId)
    return { ok: false, message: `No candidate with email ${email}.` };
  const rec = await getCandidateRecord(userId).catch(() => null);
  const checks = { ...(rec?.checks ?? {}) };
  checks[key] = { done, at: new Date().toISOString(), by: source };
  await updateCandidateRecord(userId, { checks });
  return { ok: true, message: `${key} set to ${done} for ${email}.` };
}
