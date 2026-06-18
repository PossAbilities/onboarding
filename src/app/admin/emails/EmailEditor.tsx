"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import {
  EMAIL_TRIGGERS,
  MERGE_TAGS,
  SAMPLE_DATA,
  renderTemplate,
} from "@/lib/email";
import {
  createEmailTemplateAction,
  deleteEmailTemplateAction,
  saveEmailTemplateAction,
  sendTestEmailAction,
} from "@/app/actions/admin";
import type { EmailTemplate, EmailTrigger } from "@/lib/types";

const clone = (t: EmailTemplate): EmailTemplate => ({ ...t });
const dirtyOf = (a: EmailTemplate, b: EmailTemplate) =>
  JSON.stringify(a) !== JSON.stringify(b);

const TRIGGER_TONE: Record<EmailTrigger, "teal" | "pink" | "success" | "purple"> = {
  welcome: "teal",
  reminder: "pink",
  completion: "success",
  custom: "purple",
};

export function EmailEditor({ templates: initial }: { templates: EmailTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [draft, setDraft] = useState<EmailTemplate | null>(
    initial[0] ? clone(initial[0]) : null,
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const focused = useRef<"subject" | "body">("body");
  const [testTo, setTestTo] = useState("");

  const original = templates.find((t) => t.id === selectedId);
  const dirty = original && draft ? dirtyOf(draft, original) : false;

  const set = <K extends keyof EmailTemplate>(key: K, value: EmailTemplate[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const select = (id: string) => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSelectedId(id);
    setDraft(clone(t));
    setMsg(null);
  };

  const insertTag = (tag: string) => {
    if (!draft) return;
    if (focused.current === "subject") {
      const el = subjectRef.current;
      const pos = el?.selectionStart ?? draft.subject.length;
      const next = draft.subject.slice(0, pos) + tag + draft.subject.slice(pos);
      set("subject", next);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(pos + tag.length, pos + tag.length);
      });
    } else {
      const el = bodyRef.current;
      const pos = el?.selectionStart ?? draft.html.length;
      const next = draft.html.slice(0, pos) + tag + draft.html.slice(pos);
      set("html", next);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(pos + tag.length, pos + tag.length);
      });
    }
  };

  const save = () => {
    if (!draft) return;
    startTransition(async () => {
      const res = await saveEmailTemplateAction(draft);
      if (res.ok) {
        setTemplates((list) =>
          list.map((t) => (t.id === draft.id ? draft : t)),
        );
      }
      setMsg({ ok: res.ok, text: res.message });
      router.refresh();
    });
  };

  const sendTest = () => {
    if (!draft) return;
    startTransition(async () => {
      const res = await sendTestEmailAction(draft, testTo.trim());
      setMsg({ ok: res.ok, text: res.message });
    });
  };

  const addTemplate = () =>
    startTransition(async () => {
      const { template } = await createEmailTemplateAction();
      setTemplates((list) => [...list, template]);
      setSelectedId(template.id);
      setDraft(clone(template));
      setMsg({ ok: true, text: "New template created." });
      router.refresh();
    });

  const removeTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t || !confirm(`Delete "${t.name}"?`)) return;
    startTransition(async () => {
      await deleteEmailTemplateAction(id);
      const next = templates.filter((x) => x.id !== id);
      setTemplates(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? "");
        setDraft(next[0] ? clone(next[0]) : null);
      }
      router.refresh();
    });
  };

  const previewHtml = draft ? renderTemplate(draft.html, SAMPLE_DATA) : "";
  const previewSubject = draft ? renderTemplate(draft.subject, SAMPLE_DATA) : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Template list */}
      <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3 journey-card-shadow">
        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          Templates
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => select(t.id)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
                  t.id === selectedId
                    ? "bg-secondary text-on-secondary"
                    : "hover:bg-surface-container",
                )}
              >
                <span
                  className={clsx(
                    "h-2 w-2 shrink-0 rounded-full",
                    t.enabled ? "bg-success-green" : "bg-outline",
                  )}
                  title={t.enabled ? "Enabled" : "Disabled"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {t.name}
                    {t.id === draft?.id && dirty && " *"}
                  </span>
                  <span
                    className={clsx(
                      "block truncate text-xs",
                      t.id === selectedId ? "text-on-secondary/80" : "text-on-surface-variant",
                    )}
                  >
                    {t.trigger}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addTemplate}
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:border-secondary hover:text-secondary"
        >
          <Icon name="add" size={18} /> New template
        </button>
      </div>

      {/* Editor + preview */}
      {draft ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Editor */}
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Chip tone={TRIGGER_TONE[draft.trigger]}>{draft.trigger}</Chip>
              <button
                type="button"
                onClick={() => removeTemplate(draft.id)}
                disabled={pending || templates.length <= 1}
                className="flex items-center gap-1 text-sm font-bold text-error hover:underline disabled:opacity-40"
              >
                <Icon name="delete" size={18} /> Delete
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Template name</span>
                <input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold text-on-surface"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-on-surface">Sends on</span>
                  <select
                    value={draft.trigger}
                    onChange={(e) => set("trigger", e.target.value as EmailTrigger)}
                    className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold text-on-surface"
                  >
                    {EMAIL_TRIGGERS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-end gap-3 pb-1">
                  <span className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(e) => set("enabled", e.target.checked)}
                      className="h-5 w-5 accent-[#b30069]"
                    />
                    Enabled
                  </span>
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-on-surface">Subject line</span>
                <input
                  ref={subjectRef}
                  value={draft.subject}
                  onFocus={() => (focused.current = "subject")}
                  onChange={(e) => set("subject", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface"
                />
              </label>

              {/* Merge tag palette */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  Insert a system tag (into the last-focused field)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MERGE_TAGS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => insertTag(t.tag)}
                      title={`${t.label} · e.g. ${t.sample}`}
                      className="rounded-full bg-primary-fixed px-2.5 py-1 font-mono text-xs font-bold text-on-primary-fixed-variant hover:bg-secondary-fixed"
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-on-surface">HTML body</span>
                <textarea
                  ref={bodyRef}
                  value={draft.html}
                  onFocus={() => (focused.current = "body")}
                  onChange={(e) => set("html", e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-[#1e1b1c] px-3 py-2.5 font-mono text-xs leading-relaxed text-[#f8efef]"
                />
              </label>

              {/* Save bar */}
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

              {/* Send a test */}
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  <Icon name="send" size={16} /> Send yourself a test
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="email"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="you@possabilities.org.uk"
                    className="field-focus min-w-0 flex-1 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={sendTest}
                    disabled={pending || !testTo.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                  >
                    <Icon name="outgoing_mail" size={18} /> Send test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-4 journey-card-shadow">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                <Icon name="visibility" size={18} /> Live preview
              </p>
              <div className="flex rounded-lg bg-surface-container-high p-0.5">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={clsx(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold",
                      device === d
                        ? "bg-surface-container-lowest text-secondary"
                        : "text-on-surface-variant",
                    )}
                  >
                    <Icon name={d === "desktop" ? "desktop_windows" : "smartphone"} size={16} />
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-surface-container-lowest p-3">
              <p className="text-xs text-on-surface-variant">Subject</p>
              <p className="font-bold text-on-surface">{previewSubject}</p>
            </div>

            <div className="mt-3 flex justify-center overflow-hidden rounded-lg bg-surface-container-highest p-3">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={previewHtml}
                className="h-[520px] rounded-md border border-outline-variant/50 bg-white transition-all"
                style={{ width: device === "mobile" ? 380 : "100%" }}
              />
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              Preview uses sample data (e.g. {SAMPLE_DATA.first_name},{" "}
              {SAMPLE_DATA.due_date}). Real values are filled per recipient when sent.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-12 text-on-surface-variant">
          Create a template to get started.
        </div>
      )}
    </div>
  );
}
