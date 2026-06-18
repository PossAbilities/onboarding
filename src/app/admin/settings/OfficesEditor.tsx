"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { saveOfficesAction } from "@/app/actions/admin";

export function OfficesEditor({ offices }: { offices: string[] }) {
  const router = useRouter();
  const [text, setText] = useState(offices.join("\n"));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const list = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      const res = await saveOfficesAction(list);
      setMsg(res.message);
      setTimeout(() => setMsg(null), 3000);
      router.refresh();
    });

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
      <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name="location_city" className="text-secondary" fill /> Offices
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        The offices a new starter can pick as their nearest collection point on
        the ID-badge step. One per line.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="field-focus mt-3 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm"
        placeholder={"Rochdale (Head Office)\nHeywood\nMiddleton"}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
        >
          <Icon name="save" size={18} /> {pending ? "Saving…" : "Save offices"}
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
