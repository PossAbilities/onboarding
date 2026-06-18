"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import { ContentBlockEditor } from "./ContentBlockEditor";
import { MediaUpload } from "@/components/admin/MediaUpload";
import {
  createModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  saveModuleAction,
} from "@/app/actions/admin";
import type { Badge, Module, ModuleKind } from "@/lib/types";

const KIND_OPTIONS: { value: ModuleKind; label: string }[] = [
  { value: "video", label: "Welcome video" },
  { value: "photo", label: "Upload your photo (camera + ID badge)" },
  { value: "directors", label: "Meet the Directors (profile grid)" },
  { value: "manager", label: "Meet Your Manager (personalised video)" },
  { value: "culture", label: "Culture & values (with game)" },
  { value: "benefits", label: "Benefits grid" },
  { value: "bigidea", label: "BIG Idea portal" },
  { value: "pets", label: "Very Important Pets" },
  { value: "locations", label: "Locations gallery" },
  { value: "content", label: "Rich content only" },
  { value: "certificate", label: "Completion certificate" },
];

const clone = (m: Module): Module => JSON.parse(JSON.stringify(m));
const isDirty = (a: Module, b: Module) =>
  JSON.stringify(a) !== JSON.stringify(b);
const isVideo = (url: string | null) =>
  !!url && (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith("data:video"));

export function MissionEditor({
  modules: initial,
  badges,
}: {
  modules: Module[];
  badges: Badge[];
}) {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [draft, setDraft] = useState<Module>(
    initial[0] ? clone(initial[0]) : ({} as Module),
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const original = modules.find((m) => m.id === selectedId);
  const dirty = original ? isDirty(draft, original) : false;

  const set = <K extends keyof Module>(key: K, value: Module[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const select = (id: string) => {
    if (dirty && !confirm("Discard unsaved changes to this mission?")) return;
    const m = modules.find((x) => x.id === id);
    if (!m) return;
    setSelectedId(id);
    setDraft(clone(m));
    setMsg(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveModuleAction(draft);
      if (res.ok) {
        setModules((list) =>
          list.map((m) => (m.id === draft.id ? draft : m)),
        );
      }
      setMsg({ ok: res.ok, text: res.message });
      router.refresh();
    });

  const addMission = () =>
    startTransition(async () => {
      const { module } = await createModuleAction();
      setModules((list) => [...list, module]);
      setSelectedId(module.id);
      setDraft(clone(module));
      setMsg({ ok: true, text: "New mission added. Edit and save it." });
      router.refresh();
    });

  const removeMission = (id: string) => {
    const m = modules.find((x) => x.id === id);
    if (!m) return;
    if (!confirm(`Delete "${m.shortTitle}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteModuleAction(id);
      const next = modules.filter((x) => x.id !== id);
      setModules(next);
      if (selectedId === id && next[0]) {
        setSelectedId(next[0].id);
        setDraft(clone(next[0]));
      }
      setMsg({ ok: true, text: "Mission deleted." });
      router.refresh();
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = modules.findIndex((m) => m.id === id);
    const j = idx + dir;
    if (j < 0 || j >= modules.length) return;
    const next = [...modules];
    [next[idx], next[j]] = [next[j], next[idx]];
    const renumbered = next.map((m, i) => ({ ...m, order: i + 1, level: i + 1 }));
    setModules(renumbered);
    if (id === selectedId) {
      const me = renumbered.find((m) => m.id === id)!;
      setDraft((d) => ({ ...d, order: me.order, level: me.level }));
    }
    startTransition(() => reorderModulesAction(renumbered.map((m) => m.id)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Mission list */}
      <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          Mission Path
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {modules.map((mod, i) => (
            <li
              key={mod.id}
              className={clsx(
                "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                mod.id === selectedId
                  ? "bg-secondary text-on-secondary"
                  : "hover:bg-surface-container",
              )}
            >
              <button
                type="button"
                onClick={() => select(mod.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    mod.id === selectedId
                      ? "bg-on-secondary/20"
                      : "bg-surface-container-high text-on-surface-variant",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {mod.shortTitle}
                    {mod.id === draft.id && dirty && " *"}
                  </span>
                  <span
                    className={clsx(
                      "block truncate text-xs",
                      mod.id === selectedId
                        ? "text-on-secondary/80"
                        : "text-on-surface-variant",
                    )}
                  >
                    {mod.kind}
                    {mod.required ? " · required" : ""}
                  </span>
                </span>
              </button>
              <div
                className={clsx(
                  "flex shrink-0 items-center",
                  mod.id === selectedId ? "" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <button
                  type="button"
                  onClick={() => move(mod.id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="flex h-6 w-6 items-center justify-center rounded disabled:opacity-30"
                >
                  <Icon name="keyboard_arrow_up" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(mod.id, 1)}
                  disabled={i === modules.length - 1}
                  aria-label="Move down"
                  className="flex h-6 w-6 items-center justify-center rounded disabled:opacity-30"
                >
                  <Icon name="keyboard_arrow_down" size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addMission}
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant px-3 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
        >
          <Icon name="add" size={18} /> Add Mission
        </button>
      </div>

      {/* Editor */}
      {draft.id ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Chip tone="purple">Editing · {draft.shortTitle}</Chip>
            <div className="flex items-center gap-3">
              <Link
                href={`/modules/${draft.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-sm font-bold text-secondary hover:underline"
              >
                <Icon name="visibility" size={18} /> Preview
              </Link>
              <button
                type="button"
                onClick={() => removeMission(draft.id)}
                disabled={pending || modules.length <= 1}
                className="flex items-center gap-1 text-sm font-bold text-error hover:underline disabled:opacity-40"
              >
                <Icon name="delete" size={18} /> Delete
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Field label="Module Title">
              <input
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-lg font-extrabold text-on-surface"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Short title (shown on the path)">
                <input
                  value={draft.shortTitle}
                  onChange={(e) => set("shortTitle", e.target.value)}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold text-on-surface"
                />
              </Field>
              <Field label="URL slug">
                <input
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm text-on-surface"
                />
              </Field>
            </div>

            <Field label="Module Description">
              <textarea
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mission type (layout)">
                <select
                  value={draft.kind}
                  onChange={(e) => set("kind", e.target.value as ModuleKind)}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold text-on-surface"
                >
                  {KIND_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unlockable badge">
                <select
                  value={draft.badgeId ?? ""}
                  onChange={(e) => set("badgeId", e.target.value || null)}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold text-on-surface"
                >
                  <option value="">No badge</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-lg bg-surface-container-low p-4">
              <MediaUpload
                label="Hero media (welcome video or image)"
                value={draft.heroMediaUrl}
                onChange={(url) => set("heroMediaUrl", url)}
                accept="image/*,video/mp4,video/webm"
                kind={isVideo(draft.heroMediaUrl) ? "video" : "image"}
              />
              <div className="mt-4">
                <MediaUpload
                  label="Poster image (shown before a video plays)"
                  value={draft.heroPoster}
                  onChange={(url) => set("heroPoster", url)}
                  accept="image/*"
                  kind="image"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Estimated time (mins)">
                <input
                  type="number"
                  min={1}
                  value={draft.estMinutes}
                  onChange={(e) => set("estMinutes", Number(e.target.value))}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface"
                />
              </Field>
              <Field label="Reward XP">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={draft.rewardXp}
                  onChange={(e) => set("rewardXp", Number(e.target.value))}
                  className="field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface"
                />
              </Field>
            </div>

            <label className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm font-bold text-on-surface">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(e) => set("required", e.target.checked)}
                className="h-5 w-5 accent-[#b30069]"
              />
              Required mission (must be completed to finish induction)
            </label>

            {/* Rich content blocks */}
            <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4">
              <ContentBlockEditor
                blocks={draft.content}
                onChange={(content) => set("content", content)}
              />
            </div>

            {/* Save bar */}
            <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t border-outline-variant/50 bg-surface-container-lowest/95 px-5 py-4 backdrop-blur">
              {msg ? (
                <p
                  className={clsx(
                    "flex items-center gap-1.5 text-sm font-bold",
                    msg.ok ? "text-[#1b7a44]" : "text-error",
                  )}
                >
                  <Icon name={msg.ok ? "check_circle" : "error"} size={18} />
                  {msg.text}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </p>
              )}
              <button
                type="button"
                onClick={save}
                disabled={pending || !dirty}
                className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
              >
                <Icon name="save" size={18} /> {pending ? "Saving…" : "Save & publish"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-12 text-on-surface-variant">
          Add a mission to get started.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-on-surface">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
