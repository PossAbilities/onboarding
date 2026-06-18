"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import {
  INTEGRATION_EVENTS,
  eventDef,
} from "@/lib/integration-events";
import {
  createIntegrationAction,
  deleteIntegrationAction,
  saveIntegrationAction,
  testIntegrationAction,
} from "@/app/actions/admin";
import type {
  Integration,
  IntegrationDelivery,
  IntegrationHeader,
} from "@/lib/types";

const clone = (i: Integration): Integration => ({
  ...i,
  headers: i.headers.map((h) => ({ ...h })),
});
const dirtyOf = (a: Integration, b: Integration) =>
  JSON.stringify(a) !== JSON.stringify(b);

export function IntegrationsManager({
  integrations: initial,
  deliveries,
}: {
  integrations: Integration[];
  deliveries: IntegrationDelivery[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [draft, setDraft] = useState<Integration | null>(
    initial[0] ? clone(initial[0]) : null,
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const original = items.find((i) => i.id === selectedId);
  const dirty = original && draft ? dirtyOf(draft, original) : false;
  const def = draft ? eventDef(draft.event) : undefined;

  const set = <K extends keyof Integration>(k: K, v: Integration[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const select = (id: string) => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    const i = items.find((x) => x.id === id);
    if (!i) return;
    setSelectedId(id);
    setDraft(clone(i));
    setMsg(null);
  };

  const insertToken = (token: string) => {
    if (!draft) return;
    const el = bodyRef.current;
    const pos = el?.selectionStart ?? draft.bodyTemplate.length;
    const next =
      draft.bodyTemplate.slice(0, pos) + token + draft.bodyTemplate.slice(pos);
    set("bodyTemplate", next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos + token.length, pos + token.length);
    });
  };

  const setHeader = (i: number, patch: Partial<IntegrationHeader>) =>
    set(
      "headers",
      (draft?.headers ?? []).map((h, j) => (j === i ? { ...h, ...patch } : h)),
    );

  const save = () =>
    draft &&
    startTransition(async () => {
      const res = await saveIntegrationAction(draft);
      if (res.ok) setItems((l) => l.map((i) => (i.id === draft.id ? draft : i)));
      setMsg({ ok: res.ok, text: res.message });
      router.refresh();
    });

  const add = () =>
    startTransition(async () => {
      const { integration } = await createIntegrationAction();
      setItems((l) => [...l, integration]);
      setSelectedId(integration.id);
      setDraft(clone(integration));
      router.refresh();
    });

  const remove = (id: string) => {
    const i = items.find((x) => x.id === id);
    if (!i || !confirm(`Delete "${i.name}"?`)) return;
    startTransition(async () => {
      await deleteIntegrationAction(id);
      const next = items.filter((x) => x.id !== id);
      setItems(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? "");
        setDraft(next[0] ? clone(next[0]) : null);
      }
      router.refresh();
    });
  };

  const test = () =>
    draft &&
    startTransition(async () => {
      const res = await testIntegrationAction(draft);
      setMsg({
        ok: res.ok,
        text: res.ok
          ? `Test delivered — HTTP ${res.statusCode}.`
          : `Test failed: ${res.error ?? `HTTP ${res.statusCode}`}.`,
      });
      router.refresh();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* List */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Integrations
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => select(i.id)}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left",
                    i.id === selectedId
                      ? "bg-secondary text-on-secondary"
                      : "hover:bg-surface-container",
                  )}
                >
                  <span
                    className={clsx(
                      "h-2 w-2 shrink-0 rounded-full",
                      i.enabled ? "bg-success-green" : "bg-outline",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {i.name}
                      {i.id === draft?.id && dirty && " *"}
                    </span>
                    <span
                      className={clsx(
                        "block truncate text-xs",
                        i.id === selectedId
                          ? "text-on-secondary/80"
                          : "text-on-surface-variant",
                      )}
                    >
                      {i.event}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={add}
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:border-secondary hover:text-secondary"
          >
            <Icon name="add" size={18} /> New integration
          </button>
        </div>

        {/* Recent deliveries */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Recent deliveries
          </p>
          {deliveries.length === 0 ? (
            <p className="px-2 py-2 text-xs text-on-surface-variant">
              No deliveries yet.
            </p>
          ) : (
            <ul className="mt-1 flex max-h-72 flex-col gap-1 overflow-y-auto">
              {deliveries.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                >
                  <Icon
                    name={d.ok ? "check_circle" : "error"}
                    size={16}
                    className={d.ok ? "text-success-green" : "text-error"}
                    fill
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-on-surface">
                      {d.integrationName}
                    </span>
                    <span className="block truncate text-on-surface-variant">
                      {d.ok ? `HTTP ${d.statusCode}` : d.error ?? "failed"} ·{" "}
                      {new Date(d.createdAt).toLocaleString("en-GB")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Editor */}
      {draft ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Chip tone={draft.enabled ? "success" : "locked"}>
              {draft.enabled ? "Enabled" : "Disabled"}
            </Chip>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={test}
                disabled={pending}
                className="flex items-center gap-1 text-sm font-bold text-secondary hover:underline"
              >
                <Icon name="bolt" size={18} fill /> Send test
              </button>
              <button
                type="button"
                onClick={() => remove(draft.id)}
                disabled={pending}
                className="flex items-center gap-1 text-sm font-bold text-error hover:underline"
              >
                <Icon name="delete" size={18} /> Delete
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-on-surface">
                  Trigger event
                </span>
                <select
                  value={draft.event}
                  onChange={(e) => set("event", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold"
                >
                  {INTEGRATION_EVENTS.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {def && (
              <p className="-mt-2 text-xs text-on-surface-variant">{def.description}</p>
            )}

            <label className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm font-bold text-on-surface">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
                className="h-5 w-5 accent-[#b30069]"
              />
              Enabled — fire this whenever the event happens
            </label>

            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Method</span>
                <select
                  value={draft.method}
                  onChange={(e) => set("method", e.target.value as Integration["method"])}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold"
                >
                  {["POST", "PUT", "PATCH", "GET"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Endpoint URL</span>
                <input
                  value={draft.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://your-system.example.com/api/…"
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm"
                />
              </label>
            </div>

            {/* Headers */}
            <div>
              <span className="text-sm font-bold text-on-surface">
                Headers (auth, content-type…)
              </span>
              <div className="mt-2 flex flex-col gap-2">
                {draft.headers.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={h.key}
                      onChange={(e) => setHeader(i, { key: e.target.value })}
                      placeholder="Header"
                      className="field-focus w-1/3 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-mono text-sm"
                    />
                    <input
                      value={h.value}
                      onChange={(e) => setHeader(i, { value: e.target.value })}
                      placeholder="Value"
                      className="field-focus flex-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        set("headers", draft.headers.filter((_, j) => j !== i))
                      }
                      aria-label="Remove header"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-error hover:bg-error-container"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set("headers", [...draft.headers, { key: "", value: "" }])}
                  className="self-start text-xs font-bold text-secondary hover:underline"
                >
                  + Add header
                </button>
              </div>
            </div>

            {/* Token palette */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Available fields (click to insert into the body)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(def?.fields ?? []).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => insertToken(`{{${f.key}}}`)}
                    title={`${f.label} · e.g. ${f.sample}`}
                    className="rounded-full bg-primary-fixed px-2.5 py-1 font-mono text-xs font-bold text-on-primary-fixed-variant hover:bg-secondary-fixed"
                  >
                    {`{{${f.key}}}`}
                  </button>
                ))}
              </div>
            </div>

            {draft.method !== "GET" && (
              <label className="block">
                <span className="text-sm font-bold text-on-surface">
                  Request body (decide what data goes where)
                </span>
                <textarea
                  ref={bodyRef}
                  value={draft.bodyTemplate}
                  onChange={(e) => set("bodyTemplate", e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-[#1e1b1c] px-3 py-2.5 font-mono text-xs leading-relaxed text-[#f8efef]"
                />
              </label>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-4">
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
                <Icon name="save" size={18} /> {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-12 text-on-surface-variant">
          Create an integration to get started.
        </div>
      )}
    </div>
  );
}
