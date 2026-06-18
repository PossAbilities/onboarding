"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { MediaUpload } from "@/components/admin/MediaUpload";
import {
  createDocumentAction,
  deleteDocumentAction,
  saveDocumentAction,
} from "@/app/actions/admin";
import type { SignDocument } from "@/lib/types";

const clone = (d: SignDocument): SignDocument => ({ ...d });

export function DocumentsManager({
  documents: initial,
  counts,
}: {
  documents: SignDocument[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState(initial);
  const [editing, setEditing] = useState<SignDocument | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof SignDocument>(key: K, value: SignDocument[K]) =>
    setEditing((d) => (d ? { ...d, [key]: value } : d));

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveDocumentAction(editing);
      if (res.ok) {
        setDocs((list) => {
          const i = list.findIndex((d) => d.id === editing.id);
          return i >= 0
            ? list.map((d) => (d.id === editing.id ? editing : d))
            : [...list, editing];
        });
        setEditing(null);
        setMsg(res.message);
        setTimeout(() => setMsg(null), 3000);
        router.refresh();
      } else setMsg(res.message);
    });
  };

  const add = () =>
    startTransition(async () => {
      const { document } = await createDocumentAction();
      setDocs((l) => [...l, document]);
      setEditing(clone(document));
      router.refresh();
    });

  const remove = (id: string) => {
    const d = docs.find((x) => x.id === id);
    if (!d || !confirm(`Delete "${d.title}"?`)) return;
    startTransition(async () => {
      await deleteDocumentAction(id);
      setDocs((l) => l.filter((x) => x.id !== id));
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-on-surface-variant">
          {docs.length} document{docs.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={add}
          className="btn-3d inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary"
        >
          <Icon name="add" size={18} /> Add document
        </button>
      </div>

      {msg && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-success-green/10 px-3 py-2 text-sm font-bold text-[#1b7a44]">
          <Icon name="check_circle" size={18} /> {msg}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {docs.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
              <Icon name={d.fileUrl ? "picture_as_pdf" : "description"} fill size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-on-surface">{d.title}</p>
              <p className="truncate text-xs text-on-surface-variant">{d.description}</p>
            </div>
            {d.required && <Chip tone="pink">Required</Chip>}
            <Chip tone="teal" icon={<Icon name="draw" size={14} />}>
              {counts[d.id] ?? 0} signed
            </Chip>
            <button
              type="button"
              onClick={() => setEditing(clone(d))}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-secondary"
              aria-label="Edit"
            >
              <Icon name="edit" size={20} />
            </button>
            <button
              type="button"
              onClick={() => remove(d.id)}
              className="rounded-lg p-2 text-error hover:bg-error-container"
              aria-label="Delete"
            >
              <Icon name="delete" size={20} />
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-surface-container-lowest p-6 journey-card-shadow float-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-on-surface">Edit document</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Title</span>
                <input
                  value={editing.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-bold"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-on-surface">Description</span>
                <input
                  value={editing.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5"
                />
              </label>

              <div className="rounded-lg bg-surface-container-low p-4">
                <MediaUpload
                  label="Upload a PDF (optional — overrides the text below)"
                  value={editing.fileUrl}
                  onChange={(url) => set("fileUrl", url)}
                  accept="application/pdf"
                  kind="image"
                  shape="wide"
                />
                {editing.fileUrl && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    A PDF is attached. Remove it to use the text body instead.
                  </p>
                )}
              </div>

              {!editing.fileUrl && (
                <label className="block">
                  <span className="text-sm font-bold text-on-surface">
                    Document text (HTML allowed)
                  </span>
                  <textarea
                    value={editing.body ?? ""}
                    onChange={(e) => set("body", e.target.value)}
                    rows={8}
                    className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm"
                  />
                </label>
              )}

              <label className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm font-bold text-on-surface">
                <input
                  type="checkbox"
                  checked={editing.required}
                  onChange={(e) => set("required", e.target.checked)}
                  className="h-5 w-5 accent-[#b30069]"
                />
                Required — starters must sign this to finish their induction
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn-3d rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
              >
                {pending ? "Saving…" : "Save & publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
