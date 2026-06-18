import "server-only";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { computeJourney } from "./journey";
import { demoState } from "./demo-store";
import {
  BADGES,
  BENEFITS,
  DIRECTORS,
  LOCATIONS,
  MODULES,
  PETS,
} from "./seed";
import type {
  Idea,
  IdeaStatus,
  JourneyState,
  Module,
  ModuleProgress,
  Profile,
} from "./types";

/* ───────────────────────── Mission catalogue ──────────────────────
 * Missions are fully editable via the admin Content Editor. In DEMO MODE they
 * live in a mutable in-memory working copy (src/lib/demo-store.ts). With
 * Supabase configured they live in the `modules` table — read and written here.
 */
export async function getModules(): Promise<Module[]> {
  if (!isSupabaseConfigured) {
    return [...demoState().modules].sort((a, b) => a.order - b.order);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("modules")
    .select("*")
    .order("order", { ascending: true });
  // Fall back to seed if the table is empty (e.g. schema run, seed not yet).
  if (!data || data.length === 0) {
    return [...MODULES].sort((a, b) => a.order - b.order);
  }
  return data.map(mapModuleRow);
}
export async function getModuleBySlug(slug: string): Promise<Module | undefined> {
  return (await getModules()).find((m) => m.slug === slug);
}
export async function getModuleById(id: string): Promise<Module | undefined> {
  return (await getModules()).find((m) => m.id === id);
}

/** Save the full module (all fields incl. content blocks). */
export async function saveModule(mod: Module): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    const i = state.modules.findIndex((m) => m.id === mod.id);
    if (i >= 0) state.modules[i] = mod;
    else state.modules.push(mod);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("modules").upsert(moduleToRow(mod), { onConflict: "id" });
}

/** Create a new blank mission at the end of the path. Returns the new module. */
export async function createModule(): Promise<Module> {
  const all = await getModules();
  const nextOrder = (all.at(-1)?.order ?? 0) + 1;
  const id = `m-custom-${Date.now()}`;
  const mod: Module = {
    id,
    slug: `mission-${nextOrder}`,
    order: nextOrder,
    level: nextOrder,
    kind: "content",
    title: `Mission ${String(nextOrder).padStart(2, "0")}: New Mission`,
    shortTitle: "New Mission",
    description: "Describe what this mission covers.",
    estMinutes: 5,
    required: false,
    badgeId: null,
    rewardXp: 50,
    heroMediaUrl: null,
    heroPoster: null,
    content: [
      { type: "heading", text: "New section" },
      { type: "paragraph", text: "Add your content here." },
    ],
  };
  await saveModule(mod);
  return mod;
}

export async function deleteModule(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    state.modules = state.modules.filter((m) => m.id !== id);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("modules").delete().eq("id", id);
}

/** Reorder by an ordered list of module ids; re-numbers order + level. */
export async function reorderModules(orderedIds: string[]): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    orderedIds.forEach((id, i) => {
      const mod = state.modules.find((m) => m.id === id);
      if (mod) {
        mod.order = i + 1;
        mod.level = i + 1;
      }
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("modules").update({ order: i + 1, level: i + 1 }).eq("id", id),
    ),
  );
}

export const getDirectors = () =>
  [...DIRECTORS].sort((a, b) => a.order - b.order);
export const getBenefits = () =>
  [...BENEFITS].sort((a, b) => a.order - b.order);
export const getBadges = () => BADGES;
export const getPets = () => PETS;
export const getLocations = () => LOCATIONS;

/* ───────────────────────── Journey / progress ───────────────────── */

async function getProgressRecords(userId: string): Promise<ModuleProgress[]> {
  if (!isSupabaseConfigured) {
    return Object.values(demoState().progress);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("progress")
    .select("module_id,status,completed_at,score")
    .eq("user_id", userId);
  return (data ?? []).map((r) => ({
    moduleId: r.module_id,
    status: r.status,
    completedAt: r.completed_at,
    score: r.score,
  }));
}

export async function getJourneyState(profile: Profile): Promise<JourneyState> {
  const records = await getProgressRecords(profile.id);
  const modules = await getModules();
  const { progress, percentComplete } = computeJourney(records, modules);

  const earnedBadges = isSupabaseConfigured
    ? await getEarnedBadgesFromDb(profile.id)
    : demoState().earnedBadges;

  return {
    profile,
    modules,
    progress,
    badges: BADGES,
    earnedBadges,
    percentComplete,
  };
}

async function getEarnedBadgesFromDb(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_badges")
    .select("badge_id,unlocked_at")
    .eq("user_id", userId);
  return (data ?? []).map((r) => ({
    badgeId: r.badge_id,
    unlockedAt: r.unlocked_at,
  }));
}

/** Mark a module complete, award its badge + XP. Returns the unlocked badge id (if any). */
export async function completeModule(
  profile: Profile,
  moduleId: string,
  score: number | null = null,
): Promise<{ badgeId: string | null; xp: number }> {
  const mod = await getModuleById(moduleId);
  if (!mod) return { badgeId: null, xp: 0 };
  const now = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const state = demoState();
    const already = state.progress[moduleId]?.status === "completed";
    state.progress[moduleId] = {
      moduleId,
      status: "completed",
      completedAt: now,
      score,
    };
    if (!already) {
      state.journeyPoints += mod.rewardXp;
      if (mod.badgeId && !state.earnedBadges.some((b) => b.badgeId === mod.badgeId)) {
        state.earnedBadges.push({ badgeId: mod.badgeId, unlockedAt: now });
      }
    }
    return { badgeId: already ? null : mod.badgeId, xp: mod.rewardXp };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("progress").upsert(
    {
      user_id: profile.id,
      module_id: moduleId,
      status: "completed",
      completed_at: now,
      score,
    },
    { onConflict: "user_id,module_id" },
  );
  await supabase
    .from("profiles")
    .update({
      journey_points: profile.journeyPoints + mod.rewardXp,
      last_activity_at: now,
    })
    .eq("id", profile.id);
  if (mod.badgeId) {
    await supabase
      .from("user_badges")
      .upsert(
        { user_id: profile.id, badge_id: mod.badgeId, unlocked_at: now },
        { onConflict: "user_id,badge_id" },
      );
  }
  return { badgeId: mod.badgeId, xp: mod.rewardXp };
}

/** Easter-egg hunt (Navigator badge). Returns total found so far. */
export async function collectEasterEgg(
  profile: Profile,
  eggId: string,
): Promise<{ found: number; unlockedNavigator: boolean }> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    if (!state.easterEggs.includes(eggId)) state.easterEggs.push(eggId);
    const found = state.easterEggs.length;
    let unlockedNavigator = false;
    if (found >= 3 && !state.earnedBadges.some((b) => b.badgeId === "navigator")) {
      state.earnedBadges.push({
        badgeId: "navigator",
        unlockedAt: new Date().toISOString(),
      });
      state.journeyPoints += 120;
      unlockedNavigator = true;
    }
    return { found, unlockedNavigator };
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("easter_eggs")
    .upsert({ user_id: profile.id, egg_id: eggId }, { onConflict: "user_id,egg_id" });
  const { count } = await supabase
    .from("easter_eggs")
    .select("egg_id", { count: "exact", head: true })
    .eq("user_id", profile.id);
  const found = count ?? 0;
  let unlockedNavigator = false;
  if (found >= 3) {
    const { data } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", profile.id)
      .eq("badge_id", "navigator")
      .maybeSingle();
    if (!data) {
      await supabase.from("user_badges").insert({
        user_id: profile.id,
        badge_id: "navigator",
        unlocked_at: new Date().toISOString(),
      });
      unlockedNavigator = true;
    }
  }
  return { found, unlockedNavigator };
}

export async function getEasterEggsFound(profile: Profile): Promise<number> {
  if (!isSupabaseConfigured) return demoState().easterEggs.length;
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("easter_eggs")
    .select("egg_id", { count: "exact", head: true })
    .eq("user_id", profile.id);
  return count ?? 0;
}

/* ───────────────────────── The BIG Idea portal ──────────────────── */

export async function getIdeas(): Promise<Idea[]> {
  if (!isSupabaseConfigured) {
    return [...demoState().ideas].sort((a, b) => b.votes - a.votes);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .order("votes", { ascending: false });
  return (data ?? []).map(mapIdeaRow);
}

export async function submitIdea(
  profile: Profile,
  input: { title: string; description: string; category: string },
): Promise<Idea> {
  const now = new Date().toISOString();
  const idea: Idea = {
    id: `idea-${Date.now()}`,
    authorId: profile.id,
    authorName: profile.fullName,
    authorAvatar: profile.avatarUrl,
    title: input.title,
    description: input.description,
    category: input.category,
    status: "submitted",
    votes: 1,
    createdAt: now,
  };

  if (!isSupabaseConfigured) {
    demoState().ideas.unshift(idea);
    // Submitting an idea unlocks "The Pioneer".
    const state = demoState();
    if (!state.earnedBadges.some((b) => b.badgeId === "the-pioneer")) {
      state.earnedBadges.push({ badgeId: "the-pioneer", unlockedAt: now });
      state.journeyPoints += 100;
    }
    return idea;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ideas")
    .insert({
      author_id: profile.id,
      author_name: profile.fullName,
      author_avatar: profile.avatarUrl,
      title: input.title,
      description: input.description,
      category: input.category,
      status: "submitted",
      votes: 1,
    })
    .select()
    .single();
  await supabase
    .from("user_badges")
    .upsert(
      { user_id: profile.id, badge_id: "the-pioneer", unlocked_at: now },
      { onConflict: "user_id,badge_id" },
    );
  return data ? mapIdeaRow(data) : idea;
}

export async function voteIdea(ideaId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idea = demoState().ideas.find((i) => i.id === ideaId);
    if (idea) idea.votes += 1;
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("increment_idea_votes", { idea_id: ideaId });
}

/* ───────────────────────── Admin: starters & invites ────────────── */

export async function getStarters(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return demoState().starters;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_admin", false)
    .order("started_at", { ascending: false, nullsFirst: false });
  const { mapProfileRow } = await import("./auth");
  return (data ?? []).map(mapProfileRow);
}

export interface StarterStats {
  activeStarters: number;
  completionRate: number;
  pendingTasks: number;
  moduleSuccess: number;
  completed: number;
  invited: number;
}

export async function getStarterStats(): Promise<StarterStats> {
  const starters = await getStarters();
  const total = starters.length || 1;
  const completed = starters.filter((s) => s.status === "completed").length;
  const invited = starters.filter((s) => s.status === "invited").length;
  const active = starters.filter((s) => s.status === "active").length;
  return {
    activeStarters: active + completed,
    completionRate: Math.round((completed / total) * 100),
    pendingTasks: starters.reduce(
      (acc, s) => acc + (s.status === "active" ? 4 : 0),
      0,
    ),
    moduleSuccess: 92,
    completed,
    invited,
  };
}

export async function inviteStarter(
  invitedBy: string,
  input: { email: string; fullName: string; roleTag: string },
): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    if (state.starters.some((s) => s.email === input.email)) {
      return { ok: false, message: `${input.email} has already been invited.` };
    }
    state.starters.unshift({
      id: `s-${Date.now()}`,
      fullName: input.fullName,
      email: input.email,
      roleTag: input.roleTag,
      avatarUrl: null,
      isAdmin: false,
      journeyPoints: 0,
      status: "invited",
      startedAt: null,
      lastActivityAt: null,
      invitedBy,
    });
    return { ok: true, message: `Invitation sent to ${input.email}.` };
  }

  // Real invite: create an auth user with an invite + a profile row.
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const { siteUrl } = await import("./config");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${siteUrl}/accept-invite`,
    data: { full_name: input.fullName, role_tag: input.roleTag },
  });
  if (error) return { ok: false, message: error.message };
  if (data.user) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      email: input.email,
      full_name: input.fullName,
      role_tag: input.roleTag,
      is_admin: false,
      status: "invited",
      invited_by: invitedBy,
    });
  }
  return { ok: true, message: `Invitation emailed to ${input.email}.` };
}

export async function bulkInvite(
  invitedBy: string,
  rows: { email: string; fullName: string; roleTag: string }[],
): Promise<{ invited: number; skipped: number; messages: string[] }> {
  let invited = 0;
  let skipped = 0;
  const messages: string[] = [];
  for (const row of rows) {
    const res = await inviteStarter(invitedBy, row);
    if (res.ok) invited += 1;
    else {
      skipped += 1;
      messages.push(res.message);
    }
  }
  return { invited, skipped, messages };
}

/* ───────────────────────── Mappers ──────────────────────────────── */
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapModuleRow(row: any): Module {
  return {
    id: row.id,
    slug: row.slug,
    order: row.order,
    level: row.level,
    kind: row.kind,
    title: row.title,
    shortTitle: row.short_title,
    description: row.description ?? "",
    estMinutes: row.est_minutes ?? 5,
    required: row.required ?? false,
    badgeId: row.badge_id ?? null,
    rewardXp: row.reward_xp ?? 0,
    heroMediaUrl: row.hero_media_url ?? null,
    heroPoster: row.hero_poster ?? null,
    content: Array.isArray(row.content) ? row.content : [],
  };
}

function moduleToRow(m: Module): Record<string, unknown> {
  return {
    id: m.id,
    slug: m.slug,
    order: m.order,
    level: m.level,
    kind: m.kind,
    title: m.title,
    short_title: m.shortTitle,
    description: m.description,
    est_minutes: m.estMinutes,
    required: m.required,
    badge_id: m.badgeId,
    reward_xp: m.rewardXp,
    hero_media_url: m.heroMediaUrl,
    hero_poster: m.heroPoster,
    content: m.content,
  };
}

function mapIdeaRow(row: any): Idea {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status as IdeaStatus,
    votes: row.votes ?? 0,
    createdAt: row.created_at,
  };
}
