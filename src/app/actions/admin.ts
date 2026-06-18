"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  bulkInvite,
  createEmailTemplate,
  createModule,
  deleteCollectionItem,
  deleteEmailTemplate,
  deleteModule,
  createDocument,
  deleteDocument,
  inviteStarter,
  reorderCollection,
  reorderModules,
  saveCollectionItem,
  saveDocument,
  saveEmailTemplate,
  saveDepartments,
  saveModule,
  saveOffices,
  saveRoles,
  updateStarter,
  type CollectionName,
} from "@/lib/data";
import {
  createIntegration,
  deleteIntegration,
  saveIntegration,
  testIntegration,
} from "@/lib/integrations";
import { sampleDataFor } from "@/lib/integration-events";
import { createApiKey, revokeApiKey } from "@/lib/inbound";
import type {
  ApiKey,
  EmailTemplate,
  Integration,
  Module,
  SignDocument,
} from "@/lib/types";

export type InviteState =
  | { ok: boolean; message: string }
  | undefined;

export async function inviteStarterAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const admin = await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleTag = String(formData.get("roleTag") ?? "New Starter");
  const department = String(formData.get("department") ?? "").trim() || null;
  const managerId = String(formData.get("managerId") ?? "").trim() || null;

  if (!fullName || !email) {
    return { ok: false, message: "Name and email are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const res = await inviteStarter(admin.id, {
    email,
    fullName,
    roleTag,
    department,
    managerId,
  });
  if (res.ok) {
    const { dispatchEvent } = await import("@/lib/integrations");
    const { getManagerById } = await import("@/lib/data");
    const manager = managerId ? await getManagerById(managerId) : undefined;
    await dispatchEvent("starter.invited", {
      full_name: fullName,
      first_name: fullName.split(" ")[0] ?? "",
      email,
      role: roleTag,
      department: department ?? "",
      manager_name: manager?.name ?? "",
      starter_id: email,
      invited_by: admin.fullName,
    });
  }
  revalidatePath("/admin/starters");
  revalidatePath("/admin");
  return res;
}

/** Reassign a starter's department / manager / role. */
export async function updateStarterAction(
  id: string,
  patch: { department: string | null; managerId: string | null; roleTag: string },
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await updateStarter(id, patch);
  revalidatePath("/admin/starters");
  revalidatePath("/journey");
  revalidatePath("/modules", "layout");
  return { ok: true, message: "Starter updated." };
}

function revalidateContent() {
  revalidatePath("/admin/content");
  revalidatePath("/journey");
  revalidatePath("/milestones");
  revalidatePath("/admin");
  revalidatePath("/modules", "layout");
}

/** Save a full module (all fields incl. content blocks). */
export async function saveModuleAction(
  mod: Module,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!mod?.id) return { ok: false, message: "Missing module id." };
  if (!mod.title?.trim()) return { ok: false, message: "A title is required." };
  if (!mod.slug?.trim()) return { ok: false, message: "A URL slug is required." };

  // Normalise the slug to be URL-safe.
  const slug = mod.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  await saveModule({
    ...mod,
    slug: slug || mod.id,
    estMinutes: Number(mod.estMinutes) || 1,
    rewardXp: Number(mod.rewardXp) || 0,
    content: Array.isArray(mod.content) ? mod.content : [],
  });
  revalidateContent();
  return { ok: true, message: "Saved. Changes are live on every journey." };
}

export async function createModuleAction(): Promise<{ module: Module }> {
  await requireAdmin();
  const created = await createModule();
  revalidateContent();
  return { module: created };
}

export async function deleteModuleAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await deleteModule(id);
  revalidateContent();
  return { ok: true, message: "Mission deleted." };
}

export async function reorderModulesAction(orderedIds: string[]): Promise<void> {
  await requireAdmin();
  await reorderModules(orderedIds);
  revalidateContent();
}

/* ───────────────── Content Library (directors / benefits / pets / … ) ───── */

function revalidateLibrary() {
  revalidatePath("/admin/library");
  revalidatePath("/journey");
  revalidatePath("/badges");
  revalidatePath("/modules", "layout");
}

export async function saveCollectionItemAction(
  name: CollectionName,
  item: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!item?.id) return { ok: false, message: "Missing item id." };
  await saveCollectionItem(name, item);
  revalidateLibrary();
  return { ok: true, message: "Saved." };
}

export async function deleteCollectionItemAction(
  name: CollectionName,
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await deleteCollectionItem(name, id);
  revalidateLibrary();
  return { ok: true, message: "Deleted." };
}

export async function reorderCollectionAction(
  name: CollectionName,
  ids: string[],
): Promise<void> {
  await requireAdmin();
  await reorderCollection(name, ids);
  revalidateLibrary();
}

/* ───────────────────────── Email templates ───────────────────────── */

export async function saveEmailTemplateAction(
  t: EmailTemplate,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!t?.id) return { ok: false, message: "Missing template id." };
  if (!t.name?.trim()) return { ok: false, message: "Give the template a name." };
  if (!t.subject?.trim()) return { ok: false, message: "A subject line is required." };
  await saveEmailTemplate(t);
  revalidatePath("/admin/emails");
  return { ok: true, message: "Email template saved." };
}

export async function createEmailTemplateAction(): Promise<{
  template: EmailTemplate;
}> {
  await requireAdmin();
  const template = await createEmailTemplate();
  revalidatePath("/admin/emails");
  return { template };
}

export async function deleteEmailTemplateAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await deleteEmailTemplate(id);
  revalidatePath("/admin/emails");
  return { ok: true, message: "Template deleted." };
}

/** Send a one-off test of a template (using sample data) to an address. */
export async function sendTestEmailAction(
  template: EmailTemplate,
  to: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const { isEmailConfigured, sendTestEmail } = await import("@/lib/mailer");
  if (!isEmailConfigured) {
    return {
      ok: false,
      message: "Email sending isn't configured yet — add RESEND_API_KEY.",
    };
  }
  const res = await sendTestEmail(template, to);
  return res.ok
    ? { ok: true, message: `Test sent to ${to}.` }
    : { ok: false, message: res.error ?? "Send failed." };
}

/* ───────────────────── Documents (e-signing) ─────────────────────── */

function revalidateDocs() {
  revalidatePath("/admin/documents");
  revalidatePath("/documents");
}

export async function saveDocumentAction(
  doc: SignDocument,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!doc?.id) return { ok: false, message: "Missing document id." };
  if (!doc.title?.trim()) return { ok: false, message: "Give the document a title." };
  await saveDocument(doc);
  revalidateDocs();
  return { ok: true, message: "Document saved." };
}

export async function createDocumentAction(): Promise<{ document: SignDocument }> {
  await requireAdmin();
  const document = await createDocument();
  revalidateDocs();
  return { document };
}

export async function deleteDocumentAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await deleteDocument(id);
  revalidateDocs();
  return { ok: true, message: "Document deleted." };
}

export async function saveOfficesAction(
  list: string[],
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await saveOffices(list);
  revalidatePath("/admin/settings");
  revalidatePath("/modules", "layout");
  return { ok: true, message: "Offices saved." };
}

export async function saveRolesAction(
  list: string[],
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await saveRoles(list);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/starters");
  return { ok: true, message: "Job roles saved." };
}

export async function saveDepartmentsAction(
  list: string[],
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await saveDepartments(list);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/starters");
  return { ok: true, message: "Departments saved." };
}

/* ───────────────────── Inbound API keys ──────────────────────────── */

export async function createApiKeyAction(name: string): Promise<{ key: ApiKey }> {
  await requireAdmin();
  const key = await createApiKey(name);
  revalidatePath("/admin/integrations");
  return { key };
}

export async function revokeApiKeyAction(
  id: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await revokeApiKey(id);
  revalidatePath("/admin/integrations");
  return { ok: true };
}

/* ───────────────────────── Integrations ──────────────────────────── */

export async function saveIntegrationAction(
  integration: Integration,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!integration?.id) return { ok: false, message: "Missing id." };
  if (!integration.name?.trim()) return { ok: false, message: "Give it a name." };
  if (!/^https?:\/\//.test(integration.url)) {
    return { ok: false, message: "Enter a valid https:// endpoint URL." };
  }
  await saveIntegration(integration);
  revalidatePath("/admin/integrations");
  return { ok: true, message: "Integration saved." };
}

export async function createIntegrationAction(): Promise<{
  integration: Integration;
}> {
  await requireAdmin();
  const integration = await createIntegration();
  revalidatePath("/admin/integrations");
  return { integration };
}

export async function deleteIntegrationAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  await deleteIntegration(id);
  revalidatePath("/admin/integrations");
  return { ok: true, message: "Integration deleted." };
}

/** Fire one integration with sample data and report the response. */
export async function testIntegrationAction(
  integration: Integration,
): Promise<{ ok: boolean; statusCode: number | null; error: string | null }> {
  await requireAdmin();
  const res = await testIntegration(integration, sampleDataFor(integration.event));
  revalidatePath("/admin/integrations");
  return res;
}

/** Manually run the stalled-starter reminder job (same logic as the cron). */
export async function sendRemindersAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  await requireAdmin();
  const { sendStalledReminders } = await import("@/lib/mailer");
  const res = await sendStalledReminders();
  return { ok: res.ok, message: res.message };
}

/** Bulk import from pasted CSV: `name,email,role` per line (header optional). */
export async function bulkInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const admin = await requireAdmin();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { ok: false, message: "Paste some rows first." };

  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.split(/[,\t]/).map((c) => c.trim()))
    .filter((cols) => cols.length >= 2 && cols[1] && cols[1].includes("@"))
    .map((cols) => ({
      fullName: cols[0],
      email: cols[1].toLowerCase(),
      roleTag: cols[2] || "New Starter",
    }));

  if (rows.length === 0) {
    return {
      ok: false,
      message: "No valid rows found. Use: Full Name, email@domain, Role",
    };
  }

  const res = await bulkInvite(admin.id, rows);
  revalidatePath("/admin/starters");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Invited ${res.invited} starter${res.invited === 1 ? "" : "s"}${
      res.skipped ? `, skipped ${res.skipped} (already invited)` : ""
    }.`,
  };
}
