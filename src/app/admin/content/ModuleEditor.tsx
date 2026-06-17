"use client";

import { useActionState } from "react";
import { updateModuleAction, type InviteState } from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";
import type { Module } from "@/lib/types";

export function ModuleEditor({
  module,
  badgeName,
}: {
  module: Module;
  badgeName: string | null;
}) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    updateModuleAction,
    undefined,
  );

  return (
    // key forces a fresh form (and cleared state) when switching modules
    <form key={module.id} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={module.id} />

      <div>
        <label className="text-sm font-bold text-on-surface">Module Title</label>
        <input
          name="title"
          defaultValue={module.title}
          className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-lg font-extrabold text-on-surface"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-on-surface">
          Module Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={module.description}
          className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-on-surface"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-on-surface">
          Hero media URL{" "}
          <span className="font-normal text-on-surface-variant">
            (native video — .mp4 — or image)
          </span>
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low px-3 py-2.5">
          <Icon name="cloud_upload" className="text-secondary" />
          <input
            name="heroMediaUrl"
            defaultValue={module.heroMediaUrl ?? ""}
            placeholder="https://…/welcome.mp4"
            className="w-full bg-transparent text-sm text-on-surface outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm font-bold text-on-surface">
          Estimated time (mins)
          <input
            name="estMinutes"
            type="number"
            min={1}
            defaultValue={module.estMinutes}
            className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
        <label className="text-sm font-bold text-on-surface">
          AR reward value (XP)
          <input
            name="rewardXp"
            type="number"
            min={0}
            step={10}
            defaultValue={module.rewardXp}
            className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm font-bold text-on-surface">
        <input
          type="checkbox"
          name="required"
          defaultChecked={module.required}
          className="h-5 w-5 accent-[#b30069]"
        />
        Required module (must be completed to finish induction)
      </label>

      <div className="rounded-lg bg-primary-fixed/40 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-on-primary-fixed-variant">
          Unlockable Badge
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-bold text-on-primary-fixed">
          <Icon name="workspace_premium" size={18} fill />
          {badgeName ?? "No badge for this module"}
        </p>
      </div>

      {state && (
        <p
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${
            state.ok
              ? "bg-success-green/10 text-[#1b7a44]"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <Icon name={state.ok ? "check_circle" : "error"} size={18} />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-3d inline-flex items-center justify-center gap-2 self-start rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary"
      >
        <Icon name="save" size={18} /> {pending ? "Saving…" : "Save & publish"}
      </button>
    </form>
  );
}
