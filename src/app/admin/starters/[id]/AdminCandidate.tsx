"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import {
  deleteReferenceAction,
  markReferenceReceivedAction,
  resetOfferAction,
  sendReferenceAction,
  setCheckAction,
  updateCandidateDetailsAction,
} from "@/app/actions/recruitment";
import {
  CHECKLIST_HOW,
  REFERENCE_KIND_LABEL,
  formatDate,
  type CandidateRecord,
  type CandidateReference,
  type ChecklistItem,
} from "@/lib/recruitment";

type Msg = { ok: boolean; text: string } | null;

function Notice({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p
      className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${
        msg.ok
          ? "bg-success-green/10 text-[#1b7a44]"
          : "bg-error-container text-on-error-container"
      }`}
    >
      <Icon name={msg.ok ? "check_circle" : "error"} size={18} /> {msg.text}
    </p>
  );
}

/* ───────────────────────── Personal details ───────────────────────── */

export function CandidateDetailsForm({
  userId,
  record,
}: {
  userId: string;
  record: CandidateRecord;
}) {
  const router = useRouter();
  const [v, setV] = useState({
    address: record.address,
    dateOfBirth: record.dateOfBirth,
    niNumber: record.niNumber,
    jobTitle: record.jobTitle,
    salary: record.salary,
    contractHours: record.contractHours,
    startDate: record.startDate,
  });
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof v, val: string) =>
    setV((x) => ({ ...x, [k]: val }));
  const save = () =>
    startTransition(async () => {
      const res = await updateCandidateDetailsAction(userId, v);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });

  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>
          Address
          <textarea
            rows={3}
            className={input}
            value={v.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </label>
        <label className={label}>
          Date of birth
          <input
            type="date"
            className={input}
            value={v.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </label>
        <label className={label}>
          National Insurance number
          <input
            className={`${input} uppercase`}
            value={v.niNumber}
            onChange={(e) => set("niNumber", e.target.value)}
          />
        </label>
        <label className={label}>
          Job title (offer letter)
          <input
            className={input}
            value={v.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </label>
        <label className={label}>
          Start date
          <input
            type="date"
            className={input}
            value={v.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </label>
        <label className={label}>
          Salary
          <input
            className={input}
            value={v.salary}
            onChange={(e) => set("salary", e.target.value)}
          />
        </label>
        <label className={label}>
          Contractual hours
          <input
            className={input}
            value={v.contractHours}
            onChange={(e) => set("contractHours", e.target.value)}
          />
        </label>
      </div>
      <Notice msg={msg} />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="btn-3d mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
      >
        <Icon name="save" size={18} /> {pending ? "Saving…" : "Save details"}
      </button>
    </div>
  );
}

/* ─────────────────────────── Checklist ─────────────────────────── */

export function AdminChecklist({
  userId,
  items,
  overridden,
}: {
  userId: string;
  items: ChecklistItem[];
  overridden: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const toggle = (key: ChecklistItem["key"], done: boolean | null) => {
    setBusy(key);
    startTransition(async () => {
      await setCheckAction(userId, key, done);
      setBusy(null);
      router.refresh();
    });
  };

  return (
    <ul className="divide-y divide-outline-variant/40">
      {items.map((c) => (
        <li
          key={c.key}
          className={`flex flex-wrap items-center gap-3 py-3 ${c.applicable ? "" : "opacity-60"}`}
        >
          <input
            type="checkbox"
            checked={c.done}
            disabled={pending && busy === c.key}
            onChange={(e) => toggle(c.key, e.target.checked)}
            className="h-6 w-6 accent-[#2ecc71]"
            aria-label={`Mark ${c.label} as ${c.done ? "not complete" : "complete"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-on-surface">
              {c.label}
              {!c.applicable && (
                <span className="ml-2 text-xs font-normal">
                  (not applicable)
                </span>
              )}
            </p>
            <p className="text-xs text-on-surface-variant">
              {CHECKLIST_HOW[c.key]}
            </p>
          </div>
          <div className="text-right text-xs text-on-surface-variant">
            <p className="font-bold text-on-surface">
              {c.done ? "Complete" : c.status}
            </p>
            {c.done && c.doneAt && (
              <p>
                {formatDate(c.doneAt)}
                {c.by ? ` · ${c.by}` : ""}
              </p>
            )}
            {overridden.includes(c.key) && (
              <button
                type="button"
                onClick={() => toggle(c.key, null)}
                className="font-bold text-secondary hover:underline"
              >
                Reset to automatic
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────── References ─────────────────────────── */

export function AdminReferences({
  userId,
  references,
  linkBase,
}: {
  userId: string;
  references: CandidateReference[];
  linkBase: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      router.refresh();
    });

  if (references.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        No references provided yet.
      </p>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {references.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-outline-variant/60 p-4"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-on-surface">
                  {r.refereeName}
                  {r.refereePosition && (
                    <span className="font-normal text-on-surface-variant">
                      {" "}
                      · {r.refereePosition}
                    </span>
                  )}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  {REFERENCE_KIND_LABEL[r.kind]}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {r.organisation && <>{r.organisation} · </>}
                  {r.refereeEmail}
                  {r.refereePhone && <> · {r.refereePhone}</>}
                </p>
                {r.kind === "personal" ? (
                  r.relationship && (
                    <p className="text-sm text-on-surface-variant">
                      {r.relationship}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    {r.candidateRole || "Role not given"} ·{" "}
                    {r.startMonth || "?"} to {r.endMonth || "present"}
                  </p>
                )}
                <p className="mt-1 text-xs text-on-surface-variant">
                  {r.requestedAt
                    ? `Requested ${formatDate(r.requestedAt)}`
                    : "Not sent yet"}
                  {r.reminderCount > 0 &&
                    ` · ${r.reminderCount} reminder${r.reminderCount === 1 ? "" : "s"} (last ${formatDate(r.lastSentAt)})`}
                  {r.receivedAt && ` · Returned ${formatDate(r.receivedAt)}`}
                </p>
                {r.lastError && (
                  <p className="mt-1 text-xs font-bold text-error">
                    Last send failed: {r.lastError}
                  </p>
                )}
              </div>
              <Chip
                tone={
                  r.status === "received"
                    ? "success"
                    : r.status === "requested"
                      ? "pink"
                      : "locked"
                }
              >
                {r.status === "received"
                  ? "Returned"
                  : r.status === "requested"
                    ? "Outstanding"
                    : "Not sent"}
              </Chip>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== "received" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => sendReferenceAction(r.id, userId))}
                  className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-on-secondary"
                >
                  <Icon name="send" size={16} />{" "}
                  {r.status === "draft" ? "Send request" : "Send reminder now"}
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    markReferenceReceivedAction(
                      r.id,
                      userId,
                      r.status !== "received",
                    ),
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border-2 border-outline-variant px-3 py-1 text-xs font-bold text-on-surface"
              >
                <Icon
                  name={r.status === "received" ? "undo" : "mark_email_read"}
                  size={16}
                />
                {r.status === "received" ? "Mark outstanding" : "Mark received"}
              </button>
              {r.response && (
                <button
                  type="button"
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="inline-flex items-center gap-1 rounded-lg border-2 border-outline-variant px-3 py-1 text-xs font-bold text-on-surface"
                >
                  <Icon name="visibility" size={16} />{" "}
                  {open === r.id ? "Hide" : "View"} reference
                </button>
              )}
              {r.status !== "received" && (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      `${linkBase}/reference/${r.token}`,
                    );
                    setMsg({ ok: true, text: "Referee link copied." });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border-2 border-outline-variant px-3 py-1 text-xs font-bold text-on-surface"
                >
                  <Icon name="link" size={16} /> Copy referee link
                </button>
              )}
              {r.status === "draft" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteReferenceAction(r.id, userId))}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold text-error hover:bg-error-container"
                >
                  <Icon name="delete" size={16} /> Remove
                </button>
              )}
            </div>

            {open === r.id && r.response && (
              <dl className="mt-3 grid gap-2 rounded-lg bg-surface-container-low p-3 text-sm">
                {Object.entries(r.response)
                  .filter(([k]) => k !== "confirm")
                  .map(([k, val]) => (
                    <div key={k}>
                      <dt className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                        {k.replace(/_/g, " ")}
                      </dt>
                      <dd className="whitespace-pre-wrap text-on-surface">
                        {val || "—"}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
      <Notice msg={msg} />
    </div>
  );
}

export function ResetOfferButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Ask the candidate to sign the offer letter again? Use this if their salary or hours changed.",
          )
        )
          return;
        startTransition(async () => {
          await resetOfferAction(userId);
          router.refresh();
        });
      }}
      className="text-xs font-bold text-secondary hover:underline"
    >
      Ask them to re-sign
    </button>
  );
}
