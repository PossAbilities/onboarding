"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bulkInvite, inviteStarter, updateModule } from "@/lib/data";

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

  if (!fullName || !email) {
    return { ok: false, message: "Name and email are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const res = await inviteStarter(admin.id, { email, fullName, roleTag });
  revalidatePath("/admin/starters");
  revalidatePath("/admin");
  return res;
}

export async function updateModuleAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing module id." };

  await updateModule(id, {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    estMinutes: Number(formData.get("estMinutes") ?? 5) || 5,
    rewardXp: Number(formData.get("rewardXp") ?? 0) || 0,
    required: formData.get("required") === "on",
    heroMediaUrl: String(formData.get("heroMediaUrl") ?? "").trim() || null,
  });

  revalidatePath("/admin/content");
  revalidatePath("/journey");
  revalidatePath("/modules", "layout");
  return { ok: true, message: "Module saved. Changes are live on the journey." };
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
