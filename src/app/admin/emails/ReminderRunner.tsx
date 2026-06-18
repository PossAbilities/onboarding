"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { sendRemindersAction } from "@/app/actions/admin";

export function ReminderRunner({ staleDays }: { staleDays: number }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const res = await sendRemindersAction();
      setMsg({ ok: res.ok, text: res.message });
    });

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 journey-card-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-bold text-on-surface">
            <Icon name="schedule_send" size={20} className="text-secondary" />
            Stalled-starter reminders
          </p>
          <p className="text-sm text-on-surface-variant">
            Runs automatically every day. Nudges active starters with no activity
            for {staleDays}+ days using the enabled <strong>reminder</strong>{" "}
            template.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary disabled:opacity-50"
        >
          <Icon name="send" size={18} /> {pending ? "Sending…" : "Send reminders now"}
        </button>
      </div>
      {msg && (
        <p
          className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${
            msg.ok ? "bg-success-green/10 text-[#1b7a44]" : "bg-error-container text-on-error-container"
          }`}
        >
          <Icon name={msg.ok ? "check_circle" : "error"} size={18} /> {msg.text}
        </p>
      )}
    </div>
  );
}
