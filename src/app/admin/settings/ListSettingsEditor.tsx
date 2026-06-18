"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type SaveAction = (list: string[]) => Promise<{ ok: boolean; message: string }>;

/**
 * Reusable editor for a simple admin-managed list (offices, job roles,
 * departments). One item per line; saved via the provided server action.
 */
export function ListSettingsEditor({
  title,
  description,
  icon,
  items,
  placeholder,
  saveAction,
}: {
  title: string;
  description: string;
  icon: string;
  items: string[];
  placeholder?: string;
  saveAction: SaveAction;
}) {
  const router = useRouter();
  const [text, setText] = useState(items.join("\n"));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const list = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      const res = await saveAction(list);
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3000);
      router.refresh();
    });

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
      <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name={icon} className="text-secondary" fill /> {title}
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="field-focus mt-3 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm"
        placeholder={placeholder}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
        >
          <Icon name="save" size={18} /> {pending ? "Saving…" : "Save"}
        </button>
        {msg && (
          <span className="flex items-center gap-1 text-sm font-bold text-[#1b7a44]">
            <Icon name="check_circle" size={18} /> {msg}
          </span>
        )}
      </div>
    </div>
  );
}
