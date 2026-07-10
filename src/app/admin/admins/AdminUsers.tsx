"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteAdminAction,
  revokeAdminAction,
  type InviteState,
} from "@/app/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export interface AdminRow {
  id: string;
  fullName: string;
  email: string;
  roleTag: string;
  avatarUrl: string | null;
  status: string;
  isSelf: boolean;
}

export function InviteAdminForm({ roles }: { roles: string[] }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    inviteAdminAction,
    undefined,
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow"
    >
      <h3 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name="admin_panel_settings" className="text-secondary" fill /> Add an
        admin
      </h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        They&rsquo;ll get an email to set a password. If they already have an account
        here, they&rsquo;re simply promoted.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Full name
          <input
            name="fullName"
            required
            placeholder="Cymoni Foster"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface">
          Work email
          <input
            name="email"
            type="email"
            required
            placeholder="c.foster@possabilities.org.uk"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-on-surface sm:col-span-2">
          Job role
          <input
            name="roleTag"
            list="admin-roles"
            defaultValue="Administrator"
            className="field-focus rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
          />
          <datalist id="admin-roles">
            {roles.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
      </div>

      {state && (
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
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-3d mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
      >
        <Icon name="send" size={18} />{" "}
        {pending ? "Sending…" : "Grant admin access"}
      </button>
    </form>
  );
}

export function RevokeAdminButton({ admin }: { admin: AdminRow }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (admin.isSelf) {
    return (
      <span className="text-xs font-bold text-on-surface-variant">You</span>
    );
  }

  const revoke = () =>
    startTransition(async () => {
      const res = await revokeAdminAction(admin.id);
      if (!res.ok) setError(res.message);
      setConfirming(false);
      router.refresh();
    });

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className="rounded-lg bg-error-container px-3 py-1.5 text-xs font-bold text-on-error-container"
        >
          {pending ? "Removing…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && (
        <span className="text-xs font-bold text-on-error-container">{error}</span>
      )}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-error-container"
        aria-label={`Remove admin access for ${admin.fullName}`}
      >
        <Icon name="person_remove" size={18} />
      </button>
    </span>
  );
}

export function AdminTable({ admins }: { admins: AdminRow[] }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest journey-card-shadow">
      <div className="border-b border-outline-variant/50 px-5 py-4">
        <h2 className="text-lg font-black text-on-surface">
          Admins{" "}
          <span className="text-on-surface-variant">({admins.length})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface-container-low text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-5 py-3">Person</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-surface-container-low/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={a.avatarUrl} name={a.fullName} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-on-surface">
                        {a.fullName}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {a.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Chip tone="purple">{a.roleTag}</Chip>
                </td>
                <td className="px-5 py-3">
                  <Chip tone={a.status === "invited" ? "locked" : "success"}>
                    {a.status === "invited" ? "invite sent" : "active"}
                  </Chip>
                </td>
                <td className="px-5 py-3 text-right">
                  <RevokeAdminButton admin={a} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
