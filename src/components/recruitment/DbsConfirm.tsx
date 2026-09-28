"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { confirmDbsAction } from "@/app/actions/recruitment";

/** Candidate confirms they've completed their Ucheck DBS application. */
export function DbsConfirm({ done }: { done: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = () =>
    startTransition(async () => {
      const res = await confirmDbsAction(!done);
      setMsg(res.message);
      router.refresh();
    });
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          done
            ? "inline-flex items-center gap-2 rounded-xl border-2 border-outline-variant px-4 py-2 text-sm font-bold text-on-surface-variant"
            : "btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary"
        }
      >
        <Icon name={done ? "undo" : "task_alt"} size={18} />
        {pending
          ? "Saving…"
          : done
            ? "I haven't finished it yet"
            : "I've completed my Ucheck application"}
      </button>
      {msg && (
        <span className="text-sm font-bold text-on-surface-variant">{msg}</span>
      )}
    </div>
  );
}
