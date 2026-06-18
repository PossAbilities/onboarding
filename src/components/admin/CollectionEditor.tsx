"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import { MediaUpload } from "./MediaUpload";
import {
  deleteCollectionItemAction,
  reorderCollectionAction,
  saveCollectionItemAction,
} from "@/app/actions/admin";
import type { CollectionName } from "@/lib/types";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "bool"
  | "tags"
  | "icon"
  | "image";

interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  shape?: "avatar" | "square" | "wide";
  placeholder?: string;
}

interface Spec {
  singular: string;
  titleKey: string;
  subtitleKey?: string;
  imageKey?: string;
  iconKey?: string;
  hasOrder: boolean;
  fields: FieldSpec[];
}

const SPECS: Record<CollectionName, Spec> = {
  directors: {
    singular: "Director",
    titleKey: "name",
    subtitleKey: "role",
    imageKey: "photoUrl",
    hasOrder: true,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "photoUrl", label: "Photo", type: "image", shape: "avatar" },
    ],
  },
  benefits: {
    singular: "Benefit",
    titleKey: "title",
    subtitleKey: "category",
    iconKey: "icon",
    hasOrder: true,
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon (Material Symbol name)", type: "icon" },
      { key: "highlight", label: "Feature this benefit (highlighted)", type: "bool" },
    ],
  },
  pets: {
    singular: "Pet",
    titleKey: "name",
    subtitleKey: "species",
    imageKey: "photoUrl",
    hasOrder: false,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "species", label: "Species / role", type: "text" },
      { key: "owner", label: "Owner / team", type: "text" },
      { key: "funFact", label: "Fun fact", type: "textarea" },
      { key: "photoUrl", label: "Photo", type: "image", shape: "square" },
    ],
  },
  locations: {
    singular: "Location",
    titleKey: "name",
    subtitleKey: "region",
    imageKey: "imageUrl",
    hasOrder: false,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "region", label: "Region", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "services", label: "Services (comma separated)", type: "tags" },
      { key: "imageUrl", label: "Photo", type: "image", shape: "wide" },
    ],
  },
  badges: {
    singular: "Badge",
    titleKey: "name",
    subtitleKey: "criteria",
    iconKey: "icon",
    hasOrder: false,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon (Material Symbol name)", type: "icon" },
      { key: "xp", label: "XP value", type: "number" },
      { key: "criteria", label: "How it's earned", type: "text" },
    ],
  },
};

type Item = Record<string, unknown> & { id: string };

function blank(name: CollectionName, spec: Spec): Item {
  const item: Item = { id: `${name.slice(0, 4)}-${Date.now()}` };
  for (const f of spec.fields) {
    item[f.key] =
      f.type === "bool"
        ? false
        : f.type === "number"
          ? 0
          : f.type === "tags"
            ? []
            : f.type === "image"
              ? null
              : "";
  }
  return item;
}

export function CollectionEditor({
  name,
  items: initial,
}: {
  name: CollectionName;
  items: Item[];
}) {
  const spec = SPECS[name];
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [editing, setEditing] = useState<Item | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startNew = () => setEditing(blank(name, spec));
  const startEdit = (item: Item) => setEditing({ ...item });

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveCollectionItemAction(name, editing);
      if (res.ok) {
        setItems((list) => {
          const i = list.findIndex((x) => x.id === editing.id);
          if (i >= 0) return list.map((x) => (x.id === editing.id ? editing : x));
          return [...list, editing];
        });
        setEditing(null);
        setMsg(`${spec.singular} saved.`);
        setTimeout(() => setMsg(null), 3000);
        router.refresh();
      }
    });
  };

  const remove = (item: Item) => {
    if (!confirm(`Delete "${String(item[spec.titleKey])}"?`)) return;
    startTransition(async () => {
      await deleteCollectionItemAction(name, item.id);
      setItems((list) => list.filter((x) => x.id !== item.id));
      if (editing?.id === item.id) setEditing(null);
      router.refresh();
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === id);
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
    startTransition(() => reorderCollectionAction(name, next.map((x) => x.id)));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-on-surface-variant">
          {items.length} {spec.singular.toLowerCase()}
          {items.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={startNew}
          className="btn-3d inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary"
        >
          <Icon name="add" size={18} /> Add {spec.singular}
        </button>
      </div>

      {msg && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-success-green/10 px-3 py-2 text-sm font-bold text-[#1b7a44]">
          <Icon name="check_circle" size={18} /> {msg}
        </p>
      )}

      {/* List */}
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3"
          >
            {spec.imageKey && (
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                {item[spec.imageKey] ? (
                  <img
                    src={String(item[spec.imageKey])}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
            )}
            {spec.iconKey && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
                <Icon name={String(item[spec.iconKey]) || "star"} fill size={24} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-on-surface">
                {String(item[spec.titleKey]) || "(untitled)"}
              </p>
              {spec.subtitleKey && (
                <p className="truncate text-xs text-on-surface-variant">
                  {String(item[spec.subtitleKey] ?? "")}
                </p>
              )}
            </div>
            {spec.hasOrder && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => move(item.id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded disabled:opacity-30"
                >
                  <Icon name="keyboard_arrow_up" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(item.id, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded disabled:opacity-30"
                >
                  <Icon name="keyboard_arrow_down" size={18} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => startEdit(item)}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-secondary"
              aria-label="Edit"
            >
              <Icon name="edit" size={20} />
            </button>
            <button
              type="button"
              onClick={() => remove(item)}
              className="rounded-lg p-2 text-error hover:bg-error-container"
              aria-label="Delete"
            >
              <Icon name="delete" size={20} />
            </button>
          </li>
        ))}
      </ul>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 journey-card-shadow float-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-on-surface">
                {items.some((x) => x.id === editing.id) ? "Edit" : "New"}{" "}
                {spec.singular}
              </h3>
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
              {spec.fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={editing[f.key]}
                  onChange={(v) => setEditing({ ...editing, [f.key]: v })}
                />
              ))}
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
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "field-focus w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface";

  if (field.type === "image") {
    return (
      <MediaUpload
        label={field.label}
        value={(value as string) ?? null}
        onChange={(url) => onChange(url)}
        accept="image/*"
        kind="image"
        shape={field.shape ?? "square"}
      />
    );
  }
  if (field.type === "bool") {
    return (
      <label className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 accent-[#b30069]"
        />
        {field.label}
      </label>
    );
  }
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-bold text-on-surface">
        {field.label}
        {field.type === "icon" && (
          <Chip tone="purple">
            <Icon name={(value as string) || "star"} size={16} fill />
          </Chip>
        )}
      </span>
      <div className="mt-1">
        {field.type === "textarea" ? (
          <textarea
            rows={3}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={base}
          />
        ) : field.type === "tags" ? (
          <input
            value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. Day Services, Outreach"
            className={base}
          />
        ) : field.type === "number" ? (
          <input
            type="number"
            value={Number(value) || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className={base}
          />
        ) : (
          <input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={clsx(base, field.type === "icon" && "font-mono text-sm")}
          />
        )}
      </div>
      {field.type === "icon" && (
        <a
          href="https://fonts.google.com/icons"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs font-bold text-secondary hover:underline"
        >
          Browse icon names ↗
        </a>
      )}
    </label>
  );
}
