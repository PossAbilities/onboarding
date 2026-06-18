import "server-only";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import { computeJourney } from "./journey";
import { demoState } from "./demo-store";
import { EMAIL_TEMPLATES, MODULES } from "./seed";
import type {
  Badge,
  Benefit,
  CollectionName,
  CompanyValue,
  Director,
  EmailTemplate,
  Idea,
  IdeaStatus,
  JourneyState,
  Location,
  Manager,
  Module,
  ModuleProgress,
  Pet,
  Profile,
} from "./types";

export type { CollectionName };

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

/* ─────────────────────── Content collections ──────────────────────
 * Directors / benefits / pets / locations / badges. Fully editable from the
 * admin Content Library — mutable in-memory in demo mode, Supabase tables when
 * configured.
 */
export async function getDirectors(): Promise<Director[]> {
  if (!isSupabaseConfigured) return [...demoState().directors].sort(byOrder);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("directors").select("*").order("order");
  return (data ?? []).map(mapDirectorRow);
}
export async function getBenefits(): Promise<Benefit[]> {
  if (!isSupabaseConfigured) return [...demoState().benefits].sort(byOrder);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("benefits").select("*").order("order");
  return (data ?? []).map(mapBenefitRow);
}
export async function getPets(): Promise<Pet[]> {
  if (!isSupabaseConfigured) return [...demoState().pets];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("pets").select("*");
  return (data ?? []).map(mapPetRow);
}
export async function getLocations(): Promise<Location[]> {
  if (!isSupabaseConfigured) return [...demoState().locations];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("locations").select("*");
  return (data ?? []).map(mapLocationRow);
}
export async function getBadges(): Promise<Badge[]> {
  if (!isSupabaseConfigured) return [...demoState().badges];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("badges").select("*");
  return (data ?? []).map(mapBadgeRow);
}
export async function getValues(): Promise<CompanyValue[]> {
  if (!isSupabaseConfigured) return [...demoState().values].sort(byOrder);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("company_values")
    .select("*")
    .order("order");
  return (data ?? []).map(mapValueRow);
}

export async function getManagers(): Promise<Manager[]> {
  if (!isSupabaseConfigured) return [...demoState().managers].sort(byOrder);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("managers").select("*").order("order");
  return (data ?? []).map(mapManagerRow);
}
export async function getManagerById(
  id: string | null,
): Promise<Manager | undefined> {
  if (!id) return undefined;
  return (await getManagers()).find((m) => m.id === id);
}

/** `values` maps to the `company_values` table (`values` is a SQL keyword). */
function tableFor(name: CollectionName): string {
  return name === "values" ? "company_values" : name;
}

/** Create or update one item in a content collection. */
export async function saveCollectionItem(
  name: CollectionName,
  item: Record<string, unknown>,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const arr = demoState()[name] as unknown as Record<string, unknown>[];
    const i = arr.findIndex((x) => x.id === item.id);
    if (i >= 0) arr[i] = { ...arr[i], ...item };
    else arr.push(item);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    .from(tableFor(name))
    .upsert(collectionToRow(name, item), { onConflict: "id" });
}

export async function deleteCollectionItem(
  name: CollectionName,
  id: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState() as unknown as Record<string, { id: string }[]>;
    state[name] = state[name].filter((x) => x.id !== id);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from(tableFor(name)).delete().eq("id", id);
}

/** Reorder collections that have an `order` field (directors, benefits). */
export async function reorderCollection(
  name: CollectionName,
  ids: string[],
): Promise<void> {
  if (!isSupabaseConfigured) {
    const arr = demoState()[name] as unknown as { id: string; order?: number }[];
    ids.forEach((id, i) => {
      const item = arr.find((x) => x.id === id);
      if (item) item.order = i + 1;
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  const table = tableFor(name);
  await Promise.all(
    ids.map((id, i) => supabase.from(table).update({ order: i + 1 }).eq("id", id)),
  );
}

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/* ───────────────────────── Email templates ───────────────────────── */

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  if (!isSupabaseConfigured) return [...demoState().emailTemplates];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .order("name");
  // Empty table → offer the default templates as a starting point.
  if (!data || data.length === 0) return EMAIL_TEMPLATES.map((t) => ({ ...t }));
  return data.map(mapEmailRow);
}

export async function getEmailTemplate(
  id: string,
): Promise<EmailTemplate | undefined> {
  return (await getEmailTemplates()).find((t) => t.id === id);
}

export async function saveEmailTemplate(t: EmailTemplate): Promise<void> {
  const withTime = { ...t, updatedAt: new Date().toISOString() };
  if (!isSupabaseConfigured) {
    const arr = demoState().emailTemplates;
    const i = arr.findIndex((x) => x.id === t.id);
    if (i >= 0) arr[i] = withTime;
    else arr.push(withTime);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("email_templates").upsert(
    {
      id: withTime.id,
      name: withTime.name,
      trigger: withTime.trigger,
      subject: withTime.subject,
      html: withTime.html,
      enabled: withTime.enabled,
      updated_at: withTime.updatedAt,
    },
    { onConflict: "id" },
  );
}

export async function createEmailTemplate(): Promise<EmailTemplate> {
  const t: EmailTemplate = {
    id: `email-${Date.now()}`,
    name: "New email",
    trigger: "custom",
    subject: "Subject line — try a {{first_name}} merge tag",
    html: '<div style="font-family:Arial,sans-serif;padding:24px;color:#1e1b1c;">\n  <h1>Hi {{first_name}},</h1>\n  <p>Write your email here. Insert merge tags from the palette.</p>\n</div>',
    enabled: false,
    updatedAt: null,
  };
  await saveEmailTemplate(t);
  return t;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = demoState();
    state.emailTemplates = state.emailTemplates.filter((x) => x.id !== id);
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.from("email_templates").delete().eq("id", id);
}

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

  const [earnedBadges, badges] = await Promise.all([
    isSupabaseConfigured
      ? getEarnedBadgesFromDb(profile.id)
      : Promise.resolve(demoState().earnedBadges),
    getBadges(),
  ]);

  return {
    profile,
    modules,
    progress,
    badges,
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
      if (mod.kind === "certificate") await fireCompletionEmail(profile);
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
  if (mod.kind === "certificate") await fireCompletionEmail(profile);
  return { badgeId: mod.badgeId, xp: mod.rewardXp };
}

/** Best-effort completion email — never blocks/throws the completion flow. */
async function fireCompletionEmail(profile: Profile) {
  try {
    const { sendCompletionEmail } = await import("./mailer");
    await sendCompletionEmail(profile);
  } catch {
    /* ignore email failures */
  }
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

export interface InviteInput {
  email: string;
  fullName: string;
  roleTag: string;
  department?: string | null;
  managerId?: string | null;
}

export async function inviteStarter(
  invitedBy: string,
  input: InviteInput,
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
      department: input.department ?? null,
      managerId: input.managerId ?? null,
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
      department: input.department ?? null,
      manager_id: input.managerId ?? null,
      is_admin: false,
      status: "invited",
      invited_by: invitedBy,
    });
  }
  return { ok: true, message: `Invitation emailed to ${input.email}.` };
}

/** Set the signed-in user's profile photo (used for their avatar + ID badge). */
export async function updateMyAvatar(
  profile: Profile,
  url: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    demoState().employeeAvatarUrl = url;
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("profiles")
    .update({ avatar_url: url, last_activity_at: new Date().toISOString() })
    .eq("id", profile.id);
}

/** Update a starter's department / manager / role. */
export async function updateStarter(
  id: string,
  patch: { department?: string | null; managerId?: string | null; roleTag?: string },
): Promise<void> {
  if (!isSupabaseConfigured) {
    const s = demoState().starters.find((x) => x.id === id);
    if (s) {
      if (patch.department !== undefined) s.department = patch.department;
      if (patch.managerId !== undefined) s.managerId = patch.managerId;
      if (patch.roleTag !== undefined) s.roleTag = patch.roleTag;
    }
    return;
  }
  const supabase = await createSupabaseServerClient();
  const row: Record<string, unknown> = {};
  if (patch.department !== undefined) row.department = patch.department;
  if (patch.managerId !== undefined) row.manager_id = patch.managerId;
  if (patch.roleTag !== undefined) row.role_tag = patch.roleTag;
  await supabase.from("profiles").update(row).eq("id", id);
}

export async function bulkInvite(
  invitedBy: string,
  rows: InviteInput[],
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

function mapDirectorRow(r: any): Director {
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? "",
    bio: r.bio ?? "",
    photoUrl: r.photo_url ?? "",
    videoUrl: r.video_url ?? null,
    order: r.order ?? 0,
  };
}
function mapBenefitRow(r: any): Benefit {
  return {
    id: r.id,
    category: r.category ?? "",
    title: r.title,
    description: r.description ?? "",
    icon: r.icon ?? "star",
    order: r.order ?? 0,
    highlight: r.highlight ?? false,
  };
}
function mapPetRow(r: any): Pet {
  return {
    id: r.id,
    name: r.name,
    species: r.species ?? "",
    owner: r.owner ?? "",
    photoUrl: r.photo_url ?? "",
    funFact: r.fun_fact ?? "",
  };
}
function mapLocationRow(r: any): Location {
  return {
    id: r.id,
    name: r.name,
    region: r.region ?? "",
    description: r.description ?? "",
    imageUrl: r.image_url ?? "",
    services: Array.isArray(r.services) ? r.services : [],
  };
}
function mapBadgeRow(r: any): Badge {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    icon: r.icon ?? "star",
    xp: r.xp ?? 0,
    criteria: r.criteria ?? "",
  };
}
function mapEmailRow(r: any): EmailTemplate {
  return {
    id: r.id,
    name: r.name,
    trigger: r.trigger ?? "custom",
    subject: r.subject ?? "",
    html: r.html ?? "",
    enabled: r.enabled ?? false,
    updatedAt: r.updated_at ?? null,
  };
}
function mapManagerRow(r: any): Manager {
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? "",
    department: r.department ?? "",
    bio: r.bio ?? "",
    photoUrl: r.photo_url ?? "",
    videoUrl: r.video_url ?? null,
    calendarUrl: r.calendar_url ?? null,
    order: r.order ?? 0,
  };
}
function mapValueRow(r: any): CompanyValue {
  return {
    id: r.id,
    label: r.label,
    icon: r.icon ?? "star",
    match: r.match ?? "",
    order: r.order ?? 0,
  };
}

/** Map an editor item (camelCase) to a Supabase row (snake_case) per collection. */
function collectionToRow(
  name: CollectionName,
  item: Record<string, any>,
): Record<string, unknown> {
  switch (name) {
    case "directors":
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        bio: item.bio,
        photo_url: item.photoUrl,
        video_url: item.videoUrl ?? null,
        order: item.order ?? 0,
      };
    case "benefits":
      return {
        id: item.id,
        category: item.category,
        title: item.title,
        description: item.description,
        icon: item.icon,
        order: item.order ?? 0,
        highlight: item.highlight ?? false,
      };
    case "pets":
      return {
        id: item.id,
        name: item.name,
        species: item.species,
        owner: item.owner,
        photo_url: item.photoUrl,
        fun_fact: item.funFact,
      };
    case "locations":
      return {
        id: item.id,
        name: item.name,
        region: item.region,
        description: item.description,
        image_url: item.imageUrl,
        services: Array.isArray(item.services) ? item.services : [],
      };
    case "badges":
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        xp: item.xp ?? 0,
        criteria: item.criteria,
      };
    case "values":
      return {
        id: item.id,
        label: item.label,
        icon: item.icon,
        match: item.match,
        order: item.order ?? 0,
      };
    case "managers":
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        department: item.department,
        bio: item.bio,
        photo_url: item.photoUrl,
        video_url: item.videoUrl ?? null,
        calendar_url: item.calendarUrl ?? null,
        order: item.order ?? 0,
      };
  }
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
