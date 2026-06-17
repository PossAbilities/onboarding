"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  collectEasterEgg,
  completeModule,
  submitIdea,
  voteIdea,
} from "@/lib/data";

export async function completeModuleAction(moduleId: string, score?: number) {
  const profile = await requireProfile();
  const result = await completeModule(profile, moduleId, score ?? null);
  revalidatePath("/journey");
  revalidatePath("/modules", "layout");
  revalidatePath("/badges");
  return result;
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
  return { ok: true as const, idea };
}

export async function voteIdeaAction(ideaId: string) {
  await requireProfile();
  await voteIdea(ideaId);
  revalidatePath("/modules/big-idea");
}
