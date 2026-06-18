"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import {
  addCredentialAction,
  deleteCredentialAction,
} from "@/app/actions/journey";
import type { Credential } from "@/lib/types";

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

export function CredentialVault({ items }: { items: Credential[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: "", username: "", secret: "", url: "", notes: "" });
  const [revealed, setRevealed] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const add = () =>
    startTransition(async () => {
      const res = await addCredentialAction(form);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setForm({ platform: "", username: "", secret: "", url: "", notes: "" });
        setOpen(false);
        router.refresh();
      }
    });

  const remove = (c: Credential) => {
    if (!confirm(`Delete your saved login for "${c.platform}"?`)) return;
    startTransition(async () => {
      await deleteCredentialAction(c.id);
      setList((l) => l.filter((x) => x.id !== c.id));
      router.refresh();
    });
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div>
      {/* Security explainer */}
      <div className="flex items-start gap-3 rounded-xl border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
        <Icon name="lock" size={22} fill />
        <div>
          <p className="font-bold">Private &amp; encrypted</p>
          <p className="mt-0.5">
            Only you can see these — they&rsquo;re encrypted and not visible to
            admins. They&rsquo;re a temporary helper while you find your feet and
            are <strong>automatically deleted 30 days after your start date</strong>.
            Tip: where you can, switch to single sign-on instead of storing passwords.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-bold text-on-surface-variant">
          {list.length} saved login{list.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-3d inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-on-secondary"
        >
          <Icon name="add" size={18} /> Add a login
        </button>
      </div>

      {msg && (
        <p
          className={clsx(
            "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold",
            msg.ok ? "bg-success-green/10 text-[#1b7a44]" : "bg-error-container text-on-error-container",
          )}
        >
          <Icon name={msg.ok ? "check_circle" : "error"} size={18} /> {msg.text}
        </p>
      )}

      {open && (
        <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow float-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-on-surface">
              Platform / system
              <input
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                placeholder="e.g. Rota system, Email, CarePlanner"
                className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-bold text-on-surface">
              Login URL (optional)
              <input
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
                className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-bold text-on-surface">
              Username / email
              <input
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                autoComplete="off"
                className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-bold text-on-surface">
              Password
              <input
                value={form.secret}
                onChange={(e) => set("secret", e.target.value)}
                type="text"
                autoComplete="off"
                className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono"
              />
            </label>
            <label className="text-sm font-bold text-on-surface sm:col-span-2">
              Notes (optional)
              <input
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="e.g. PIN 1234, security question answer"
                className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="btn-3d rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
            >
              <Icon name="lock" size={16} className="mr-1 align-middle" />
              {pending ? "Saving…" : "Save securely"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {list.map((c) => {
          const show = revealed.includes(c.id);
          const left = daysLeft(c.expiresAt);
          return (
            <li
              key={c.id}
              className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 journey-card-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-extrabold text-on-surface">
                  <Icon name="vpn_key" size={18} className="text-secondary" />
                  {c.platform}
                </p>
                <div className="flex items-center gap-2">
                  {left !== null && (
                    <Chip tone={left <= 5 ? "pink" : "neutral"}>
                      {left === 0 ? "expires today" : `${left} day${left === 1 ? "" : "s"} left`}
                    </Chip>
                  )}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-secondary"
                      aria-label="Open login page"
                    >
                      <Icon name="open_in_new" size={18} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="rounded-lg p-1.5 text-error hover:bg-error-container"
                    aria-label="Delete"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Field label="Username" value={c.username} onCopy={() => copy(c.username)} />
                <Field
                  label="Password"
                  value={show ? c.secret : "••••••••••"}
                  mono
                  onCopy={() => copy(c.secret)}
                  trailing={
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((r) =>
                          r.includes(c.id) ? r.filter((x) => x !== c.id) : [...r, c.id],
                        )
                      }
                      className="rounded p-1 text-on-surface-variant hover:text-secondary"
                      aria-label={show ? "Hide" : "Show"}
                    >
                      <Icon name={show ? "visibility_off" : "visibility"} size={18} />
                    </button>
                  }
                />
              </div>
              {c.notes && (
                <p className="mt-2 text-xs text-on-surface-variant">📝 {c.notes}</p>
              )}
            </li>
          );
        })}
        {list.length === 0 && !open && (
          <li className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-on-surface-variant">
            No logins saved yet. Add the systems you use to keep them handy.
          </li>
        )}
      </ul>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  onCopy,
  trailing,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface-container-low px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className={clsx("min-w-0 flex-1 truncate text-on-surface", mono && "font-mono")}>
          {value || "—"}
        </span>
        {trailing}
        <button
          type="button"
          onClick={onCopy}
          className="rounded p-1 text-on-surface-variant hover:text-secondary"
          aria-label={`Copy ${label}`}
        >
          <Icon name="content_copy" size={16} />
        </button>
      </div>
    </div>
  );
}
