import { MODULES } from "./seed";
import type { Module, ModuleProgress } from "./types";

/**
 * Given the raw per-module progress records, compute the full unlock state for
 * the journey path. Rules:
 *  - A module is `completed` if it has a completed record.
 *  - A module unlocks once every *required* module before it is completed
 *    (sequential unlock; optional modules never block progress).
 *  - The first unlocked, not-yet-completed module is marked `in_progress`.
 */
export function computeJourney(
  records: ModuleProgress[],
  modules: Module[] = MODULES,
): { progress: ModuleProgress[]; percentComplete: number } {
  const byId = new Map(records.map((r) => [r.moduleId, r]));
  const ordered = [...modules].sort((a, b) => a.order - b.order);

  const result: ModuleProgress[] = [];
  let markedInProgress = false;

  for (const mod of ordered) {
    const existing = byId.get(mod.id);
    if (existing?.status === "completed") {
      result.push({ ...existing, status: "completed" });
      continue;
    }

    const requiredBefore = ordered.filter(
      (m) => m.order < mod.order && m.required,
    );
    const unlocked = requiredBefore.every(
      (m) => byId.get(m.id)?.status === "completed",
    );

    if (!unlocked) {
      result.push({
        moduleId: mod.id,
        status: "locked",
        completedAt: null,
        score: existing?.score ?? null,
      });
      continue;
    }

    // Unlocked. The first unlocked+incomplete module is the active one.
    const status = !markedInProgress ? "in_progress" : "available";
    markedInProgress = true;
    result.push({
      moduleId: mod.id,
      status: existing?.status === "in_progress" ? "in_progress" : status,
      completedAt: null,
      score: existing?.score ?? null,
    });
  }

  const requiredModules = ordered.filter((m) => m.required);
  const completedRequired = requiredModules.filter(
    (m) => byId.get(m.id)?.status === "completed",
  ).length;
  const percentComplete =
    requiredModules.length === 0
      ? 0
      : Math.round((completedRequired / requiredModules.length) * 100);

  return { progress: result, percentComplete };
}

export function statusFor(
  moduleId: string,
  progress: ModuleProgress[],
): ModuleProgress["status"] {
  return progress.find((p) => p.moduleId === moduleId)?.status ?? "locked";
}
