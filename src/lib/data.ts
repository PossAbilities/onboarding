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

/* ───────────────────────── Static content ─────────────────────────
 * Content (modules, directors, benefits, pets, locations, badges) is served
 * from the seed catalogue. The admin Content Editor edits this catalogue; with
 * Supabase configured these live in tables seeded from supabase/seed.sql.
 */
export function getModules(): Module[] {
  const overrides = isSupabaseConfigured ? {} : demoState().moduleOverrides;
  return [...MODULES]
    .map((m) => (overrides[m.id] ? { ...m, ...overrides[m.id] } : m))
    .sort((a, b) => a.order - b.order);
}
export function getModuleBySlug(slug: string): Module | undefined {
  return getModules().find((m) => m.slug === slug);
}
export function getModuleById(id: string): Module | undefined {
  return getModules().find((m) => m.id === id);
}

/** Admin content edit. Demo: in-memory override; Supabase: persists to `modules`. */
export async function updateModule(
  id: string,
  patch: Partial<Pick<Module, "title" | "shortTitle" | "description" | "estMinutes" | "rewardXp" | "required" | "heroMediaUrl">>,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    state.moduleOverrides[id] = { ...state.moduleOverrides[id], ...patch };
    return;
  }
  const supabase = await createSupabaseServerClient();
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.shortTitle !== undefined) row.short_title = patch.shortTitle;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.estMinutes !== undefined) row.est_minutes = patch.estMinutes;
  if (patch.rewardXp !== undefined) row.reward_xp = patch.rewardXp;
  if (patch.required !== undefined) row.required = patch.required;
  if (patch.heroMediaUrl !== undefined) row.hero_media_url = patch.heroMediaUrl;
  await supabase.from("modules").update(row).eq("id", id);
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
  const modules = getModules();
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
  const mod = getModuleById(moduleId);
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
