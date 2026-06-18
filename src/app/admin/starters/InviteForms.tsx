"use client";

import { useActionState } from "react";
import {
  bulkInviteAction,
  inviteStarterAction,
  type InviteState,
} from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";

export interface ManagerOption {
  id: string;
  name: string;
  role: string;
}

function Notice({ state }: { state: InviteState }) {
  if (!state) return null;
  return (
    <p
      className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${
        state.ok
          ? "bg-success-green/10 text-[#1b7a44]"
          : "bg-error-container text-on-error-container"
      }`}
    >
      <Icon name={state.ok ? "check_circle" : "error"} size={18} />
      {state.message}
    </p>
  );
}

export function InviteStarterForm({
  managers,
  roles,
  departments,
}: {
  managers: ManagerOption[];
  roles: string[];
  departments: string[];
}) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    inviteStarterAction,
    undefined,
  );
  return (
    <form action={action} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
      <h3 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name="person_add" className="text-secondary" fill /> Invite a starter
      </h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        They&rsquo;ll receive an email to set a password and begin their journey.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Full name
          <input
            name="fullName"
            required
            placeholder="Jamie Rivera"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Work email
          <input
            name="email"
            type="email"
            required
            placeholder="j.rivera@possabilities.org.uk"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Role
          <select
            name="roleTag"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          >
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Department
          <select
            name="department"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          >
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface sm:col-span-2">
          Assigned manager
          <select
            name="managerId"
            defaultValue=""
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          >
            <option value="">— No manager yet —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.role}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-on-surface-variant">
            This sets their personalised &ldquo;Meet Your Manager&rdquo; mission.
          </span>
        </label>
      </div>
      <Notice state={state} />
      <button
        type="submit"
        disabled={pending}
        className="btn-3d mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
      >
        <Icon name="send" size={18} /> {pending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}

export function BulkImportForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    bulkInviteAction,
    undefined,
  );
  return (
    <form
      id="bulk"
      action={action}
      className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow"
    >
      <h3 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name="upload_file" className="text-primary-container" fill /> Bulk import
      </h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Paste one starter per line as{" "}
        <code className="rounded bg-surface-container px-1 font-mono text-xs">
          Full Name, email, Role
        </code>
        . A header row is fine.
      </p>
      <textarea
        name="csv"
        rows={6}
        placeholder={"Jamie Rivera, j.rivera@possabilities.org.uk, Support Worker\nPriya Shah, p.shah@possabilities.org.uk, Manager"}
        className="field-focus mt-3 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm"
      />
      <Notice state={state} />
      <button
        type="submit"
        disabled={pending}
        className="btn-3d-purple mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary"
      >
        <Icon name="group_add" size={18} /> {pending ? "Importing…" : "Import & invite all"}
      </button>
    </form>
  );
}
