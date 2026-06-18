"use client";

import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";
import type { ContentBlock } from "@/lib/types";

const BLOCK_TYPES: { type: ContentBlock["type"]; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "title" },
  { type: "paragraph", label: "Paragraph", icon: "notes" },
  { type: "quote", label: "Quote", icon: "format_quote" },
  { type: "list", label: "Checklist", icon: "checklist" },
  { type: "callout", label: "Callout", icon: "lightbulb" },
];

export function ContentBlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const update = (i: number, patch: Partial<ContentBlock>) =>
    onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const add = (type: ContentBlock["type"]) => {
    const base: ContentBlock =
      type === "list"
        ? { type, items: ["New item"] }
        : type === "quote"
          ? { type, text: "A great quote.", author: "Name, Role" }
          : { type, text: type === "heading" ? "New heading" : "New text." };
    onChange([...blocks, base]);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-on-surface">
          Body content
          <span className="ml-1 font-normal text-on-surface-variant">
            ({blocks.length} block{blocks.length === 1 ? "" : "s"})
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                <Icon
                  name={BLOCK_TYPES.find((t) => t.type === block.type)?.icon ?? "notes"}
                  size={14}
                />
                {block.type}
              </span>
              <div className="flex items-center gap-1">
                <IconBtn icon="arrow_upward" label="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
                <IconBtn icon="arrow_downward" label="Move down" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} />
                <IconBtn icon="delete" label="Delete block" onClick={() => remove(i)} danger />
              </div>
            </div>

            {block.type === "list" ? (
              <ListEditor
                items={block.items ?? []}
                onChange={(items) => update(i, { items })}
              />
            ) : block.type === "heading" ? (
              <input
                value={block.text ?? ""}
                onChange={(e) => update(i, { text: e.target.value })}
                className="field-focus mt-2 w-full rounded-md border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-extrabold text-on-surface"
              />
            ) : (
              <>
                <textarea
                  value={block.text ?? ""}
                  onChange={(e) => update(i, { text: e.target.value })}
                  rows={2}
                  className="field-focus mt-2 w-full rounded-md border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface"
                />
                {block.type === "quote" && (
                  <input
                    value={block.author ?? ""}
                    onChange={(e) => update(i, { author: e.target.value })}
                    placeholder="Attribution (e.g. Sarah Chen, CEO)"
                    className="field-focus mt-2 w-full rounded-md border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface-variant"
                  />
                )}
              </>
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="rounded-lg border border-dashed border-outline-variant px-3 py-4 text-center text-sm text-on-surface-variant">
            No content blocks yet. Add one below.
          </p>
        )}
      </div>

      {/* Add buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {BLOCK_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => add(t.type)}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
          >
            <Icon name="add" size={16} /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Icon name="check_circle" size={18} className="text-teal-accent" />
          <input
            value={item}
            onChange={(e) =>
              onChange(items.map((v, j) => (j === i ? e.target.value : v)))
            }
            className="field-focus w-full rounded-md border-2 border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm text-on-surface"
          />
          <IconBtn
            icon="close"
            label="Remove item"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, "New item"])}
        className="self-start text-xs font-bold text-secondary hover:underline"
      >
        + Add item
      </button>
    </div>
  );
}

function IconBtn({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30",
        danger
          ? "text-error hover:bg-error-container"
          : "text-on-surface-variant hover:bg-surface-container-high",
      )}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
