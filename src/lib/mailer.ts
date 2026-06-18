import "server-only";
import { MERGE_TAGS, renderTemplate } from "./email";
import { MODULES, EMAIL_TEMPLATES } from "./seed";
import { siteUrl } from "./config";
import type { EmailTemplate, EmailTrigger, Profile } from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "PossAbilities <onboarding@resend.dev>";
const STALE_DAYS = Number(process.env.REMINDER_STALE_DAYS ?? "3") || 3;
const JOURNEY_NAME = "PossAbilities Induction";

export const isEmailConfigured = RESEND_API_KEY.length > 0;

/** Low-level send via the Resend REST API (no SDK dependency). */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isEmailConfigured) {
    return { ok: false, error: "Resend is not configured (set RESEND_API_KEY)." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}

/** Build the merge-tag data for a recipient. */
export function buildMergeData(
  profile: Pick<Profile, "fullName" | "email" | "roleTag" | "startedAt">,
  extra: { progressPercent?: number; nextMission?: string } = {},
): Record<string, string> {
  const due = profile.startedAt
    ? new Date(new Date(profile.startedAt).getTime() + 14 * 86400000)
    : null;
  return {
    first_name: profile.fullName.split(" ")[0] || "there",
    full_name: profile.fullName,
    email: profile.email,
    role: profile.roleTag,
    journey_name: JOURNEY_NAME,
    progress_percent: `${extra.progressPercent ?? 0}%`,
    next_mission: extra.nextMission ?? "your next mission",
    due_date: due
      ? due.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "soon",
    login_url: `${siteUrl}/login`,
    company: "PossAbilities",
  };
}

/** Render a template's subject+html with data and send it. */
export async function sendTemplate(
  template: EmailTemplate,
  to: string,
  data: Record<string, string>,
) {
  return sendEmail({
    to,
    subject: renderTemplate(template.subject, data),
    html: renderTemplate(template.html, data),
  });
}

/** Test send (uses sample merge data) — used by the editor's "Send test". */
export async function sendTestEmail(template: EmailTemplate, to: string) {
  const sample = Object.fromEntries(MERGE_TAGS.map((t) => [t.key, t.sample]));
  return sendTemplate(template, to, sample);
}

/** Completion email, fired when a starter finishes the journey. Best-effort. */
export async function sendCompletionEmail(profile: Profile) {
  if (!isEmailConfigured) return;
  const template = await pickTemplate("completion");
  if (!template) return;
  const data = buildMergeData(profile, { progressPercent: 100, nextMission: "—" });
  await sendTemplate(template, profile.email, data);
}

/**
 * Find active starters who've stalled and send them the reminder template.
 * Uses the service-role client so it works from an unauthenticated cron.
 */
export async function sendStalledReminders(): Promise<{
  ok: boolean;
  sent: number;
  skipped: number;
  errors: string[];
  message: string;
}> {
  const { isSupabaseConfigured } = await import("./config");
  if (!isSupabaseConfigured)
    return { ok: false, sent: 0, skipped: 0, errors: [], message: "Supabase not configured." };
  if (!isEmailConfigured)
    return { ok: false, sent: 0, skipped: 0, errors: [], message: "Resend not configured." };

  const template = await pickTemplate("reminder");
  if (!template || !template.enabled)
    return { ok: false, sent: 0, skipped: 0, errors: [], message: "No enabled reminder template." };

  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();

  const cutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id,email,full_name,role_tag,started_at,last_activity_at,status,is_admin")
    .eq("is_admin", false)
    .eq("status", "active")
    .or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`)
    .limit(200);
  if (error)
    return { ok: false, sent: 0, skipped: 0, errors: [error.message], message: error.message };

  const requiredOrdered = [...MODULES].sort((a, b) => a.order - b.order);
  const requiredCount = requiredOrdered.filter((m) => m.required).length || 1;

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const p of profiles ?? []) {
    const { data: prog } = await admin
      .from("progress")
      .select("module_id,status")
      .eq("user_id", p.id);
    const completed = new Set(
      (prog ?? []).filter((r) => r.status === "completed").map((r) => r.module_id),
    );
    const completedRequired = requiredOrdered.filter(
      (m) => m.required && completed.has(m.id),
    ).length;
    const percent = Math.round((completedRequired / requiredCount) * 100);
    if (percent >= 100) {
      skipped += 1;
      continue;
    }
    const next = requiredOrdered.find((m) => !completed.has(m.id));
    const data = buildMergeData(
      {
        fullName: p.full_name ?? p.email,
        email: p.email,
        roleTag: p.role_tag ?? "New Starter",
        startedAt: p.started_at,
      },
      { progressPercent: percent, nextMission: next?.shortTitle ?? "your next mission" },
    );
    const res = await sendTemplate(template, p.email, data);
    if (res.ok) sent += 1;
    else errors.push(`${p.email}: ${res.error}`);
  }

  return {
    ok: true,
    sent,
    skipped,
    errors,
    message: `Sent ${sent} reminder${sent === 1 ? "" : "s"}${
      skipped ? `, skipped ${skipped} complete` : ""
    }.`,
  };
}

/** Prefer the admin-managed template for a trigger; fall back to the seed default. */
async function pickTemplate(trigger: EmailTrigger): Promise<EmailTemplate | null> {
  try {
    const { getEmailTemplates } = await import("./data");
    const all = await getEmailTemplates();
    return (
      all.find((t) => t.trigger === trigger && t.enabled) ??
      all.find((t) => t.trigger === trigger) ??
      EMAIL_TEMPLATES.find((t) => t.trigger === trigger) ??
      null
    );
  } catch {
    return EMAIL_TEMPLATES.find((t) => t.trigger === trigger) ?? null;
  }
}
