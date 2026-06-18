"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  collectEasterEgg,
  completeModule,
  getDocuments,
  getModuleById,
  signDocument,
  starterEventData,
  submitIdea,
  updateMyAvatar,
  voteIdea,
} from "@/lib/data";
import { dispatchEvent } from "@/lib/integrations";

export async function completeModuleAction(moduleId: string, score?: number) {
  const profile = await requireProfile();
  const result = await completeModule(profile, moduleId, score ?? null);
  revalidatePath("/journey");
  revalidatePath("/modules", "layout");
  revalidatePath("/badges");

  const mod = await getModuleById(moduleId);
  if (mod) {
    const base = await starterEventData(profile);
    await dispatchEvent("module.completed", {
      ...base,
      module_id: mod.id,
      module_title: mod.shortTitle,
    });
    if (mod.kind === "certificate") {
      await dispatchEvent("journey.completed", {
        ...base,
        certificate_serial: `PA-${new Date().getFullYear()}-${profile.id
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 4)
          .toUpperCase()}`,
      });
    }
  }
  return result;
}

/** Save the user's profile photo and complete the photo module. */
export async function saveProfilePhotoAction(moduleId: string, url: string) {
  const profile = await requireProfile();
  if (!url) return { ok: false as const, message: "No photo provided." };
  await updateMyAvatar(profile, url);
  const result = await completeModule(profile, moduleId);
  revalidatePath("/journey");
  revalidatePath("/modules", "layout");
  revalidatePath("/badges");
  revalidatePath("/leaderboard");

  const base = await starterEventData(profile);
  await dispatchEvent("photo.submitted", {
    ...base,
    photo_url: url,
    submitted_at: new Date().toISOString(),
  });
  return { ok: true as const, result };
}

/** Record a digital signature on a document. */
export async function signDocumentAction(
  documentId: string,
  signedName: string,
  signatureData: string | null,
) {
  const profile = await requireProfile();
  if (!signedName.trim()) {
    return { ok: false as const, message: "Please type your full name to sign." };
  }
  await signDocument(profile, documentId, signedName.trim(), signatureData);
  revalidatePath("/documents");

  const doc = (await getDocuments()).find((d) => d.id === documentId);
  const base = await starterEventData(profile);
  await dispatchEvent("document.signed", {
    ...base,
    document_id: documentId,
    document_title: doc?.title ?? documentId,
    signed_name: signedName.trim(),
    signed_at: new Date().toISOString(),
  });
  return { ok: true as const };
}

export async function collectEggAction(eggId: string) {
  const profile = await requireProfile();
  const result = await collectEasterEgg(profile, eggId);
  revalidatePath("/journey");
  revalidatePath("/badges");
  return result;
}

export async function submitIdeaAction(input: {
  title: string;
  description: string;
  category: string;
}) {
  const profile = await requireProfile();
  if (!input.title.trim() || !input.description.trim()) {
    return { ok: false as const, message: "Please add a title and description." };
  }
  const idea = await submitIdea(profile, input);
  revalidatePath("/modules/big-idea");
  revalidatePath("/journey");
  revalidatePath("/badges");
  await dispatchEvent("idea.submitted", {
    author_name: profile.fullName,
    title: input.title,
    description: input.description,
    category: input.category,
  });
  return { ok: true as const, idea };
}

export async function voteIdeaAction(ideaId: string) {
  await requireProfile();
  await voteIdea(ideaId);
  revalidatePath("/modules/big-idea");
}
