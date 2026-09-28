"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { saveReferencesAction } from "@/app/actions/recruitment";
import {
  REFERENCE_KIND_LABEL,
  formatDate,
  type CandidateReference,
  type ReferenceKind,
} from "@/lib/recruitment";

type Draft = {
  _k: string; // stable React key
  id?: string;
  kind: ReferenceKind;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  organisation: string;
  refereePosition: string;
  candidateRole: string;
  relationship: string;
  startMonth: string;
  endMonth: string;
};

let seq = 0;
const nextKey = () => `box-${++seq}`;

const blank = (kind: ReferenceKind): Draft => ({
  _k: nextKey(),
  kind,
  refereeName: "",
  refereeEmail: "",
  refereePhone: "",
  organisation: "",
  refereePosition: "",
  candidateRole: "",
  relationship: "",
  startMonth: "",
  endMonth: "",
});

const toDraft = (r: CandidateReference): Draft => ({
  _k: nextKey(),
  id: r.id,
  kind: r.kind,
  refereeName: r.refereeName,
  refereeEmail: r.refereeEmail,
  refereePhone: r.refereePhone,
  organisation: r.organisation,
  refereePosition: r.refereePosition,
  candidateRole: r.candidateRole,
  relationship: r.relationship,
  startMonth: r.startMonth,
  endMonth: r.endMonth,
});

const hasContent = (d: Draft) =>
  [
    d.refereeName,
    d.refereeEmail,
    d.refereePhone,
    d.organisation,
    d.refereePosition,
    d.candidateRole,
    d.relationship,
    d.startMonth,
    d.endMonth,
  ].some((v) => v.trim().length > 0);

/** Once the last box has details in it, add another empty one below. */
function withTrailingBlank(list: Draft[]): Draft[] {
  const last = list.at(-1);
  return !last || hasContent(last) ? [...list, blank("care_education")] : list;
}

export function ReferencesForm({
  references,
  permissionSigned,
  submitted,
}: {
  references: CandidateReference[];
  permissionSigned: boolean;
  submitted: boolean;
}) {
  const router = useRouter();
  const sent = references.filter((r) => r.status !== "draft");
  const drafts = references.filter((r) => r.status === "draft");
  const hasSent = (kind: ReferenceKind) => sent.some((r) => r.kind === kind);

  const [employer, setEmployer] = useState<Draft>(
    drafts.find((r) => r.kind === "employer")
      ? toDraft(drafts.find((r) => r.kind === "employer")!)
      : blank("employer"),
  );
  const [personal, setPersonal] = useState<Draft>(
    drafts.find((r) => r.kind === "personal")
      ? toDraft(drafts.find((r) => r.kind === "personal")!)
      : blank("personal"),
  );
  const [care, setCare] = useState<Draft[]>(
    withTrailingBlank(
      drafts.filter((r) => r.kind === "care_education").map(toDraft),
    ),
  );
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const updateCare = (i: number, patch: Partial<Draft>) =>
    setCare((list) =>
      withTrailingBlank(list.map((d, j) => (j === i ? { ...d, ...patch } : d))),
    );

  const payload = () =>
    [
      hasSent("employer") ? null : employer,
      hasSent("personal") ? null : personal,
      ...care,
    ].filter((d): d is Draft => !!d && hasContent(d));

  const save = (submit: boolean) =>
    startTransition(async () => {
      setMsg(null);
      const res = await saveReferencesAction(payload(), submit);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      {sent.length > 0 && (
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
          <h3 className="font-extrabold text-on-surface">Requests sent</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {sent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-on-surface">
                  {r.refereeName}
                </span>
                <span className="text-on-surface-variant">
                  {REFERENCE_KIND_LABEL[r.kind]}
                  {r.organisation ? ` · ${r.organisation}` : ""} · sent{" "}
                  {formatDate(r.requestedAt)}
                </span>
                <Chip
                  tone={r.status === "received" ? "success" : "pink"}
                  className="ml-auto"
                >
                  {r.status === "received" ? "Returned" : "Outstanding"}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasSent("employer") && (
        <RefBox
          title="Most recent employer"
          required
          hint="Your current or most recent employer."
          draft={employer}
          onChange={(p) => setEmployer({ ...employer, ...p })}
        />
      )}

      <section>
        <h3 className="text-lg font-black text-on-surface">
          Health &amp; social care / education employers
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          If you have <strong>ever</strong> worked in health &amp; social care
          or education, add a reference for each of those employments. Another
          box appears each time you fill one in. Leave blank if this
          doesn&rsquo;t apply.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {care.map((d, i) => (
            <RefBox
              key={d._k}
              title={`Employment ${i + 1}`}
              draft={d}
              onChange={(p) => updateCare(i, p)}
              optional
            />
          ))}
        </div>
      </section>

      {!hasSent("personal") && (
        <RefBox
          title="Personal reference"
          required
          hint="Someone who knows you well (not a relative), for example a teacher, neighbour or community leader."
          draft={personal}
          onChange={(p) => setPersonal({ ...personal, ...p })}
        />
      )}

      {msg && (
        <p
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold ${
            msg.ok
              ? "bg-success-green/10 text-[#1b7a44]"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <Icon name={msg.ok ? "check_circle" : "error"} size={18} /> {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => save(true)}
          disabled={pending || !permissionSigned}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
        >
          <Icon name="send" size={18} />
          {pending
            ? "Sending…"
            : submitted
              ? "Send new references"
              : "Submit & send reference requests"}
        </button>
        <button
          type="button"
          onClick={() => save(false)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-outline-variant px-5 py-3 text-sm font-bold text-on-surface"
        >
          <Icon name="save" size={18} /> Save draft
        </button>
      </div>
      {!permissionSigned && (
        <p className="text-sm font-bold text-on-surface-variant">
          <Icon name="lock" size={16} className="align-middle" /> Sign the
          permission form above to send your requests.
        </p>
      )}
    </div>
  );
}

function RefBox({
  title,
  hint,
  draft,
  onChange,
  required,
  optional,
}: {
  title: string;
  hint?: string;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  required?: boolean;
  optional?: boolean;
}) {
  const personal = draft.kind === "personal";
  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";
  return (
    <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-extrabold text-on-surface">{title}</h3>
        {required && <Chip tone="pink">Required</Chip>}
        {optional && <Chip tone="neutral">Optional</Chip>}
      </div>
      {hint && <p className="mt-1 text-sm text-on-surface-variant">{hint}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {!personal && (
          <label className={`${label} sm:col-span-2`}>
            Organisation / employer
            <input
              className={input}
              value={draft.organisation}
              onChange={(e) => onChange({ organisation: e.target.value })}
            />
          </label>
        )}
        <label className={label}>
          Referee&rsquo;s full name
          <input
            className={input}
            value={draft.refereeName}
            onChange={(e) => onChange({ refereeName: e.target.value })}
          />
        </label>
        <label className={label}>
          {personal ? "Their occupation" : "Referee's job title"}
          <input
            className={input}
            value={draft.refereePosition}
            onChange={(e) => onChange({ refereePosition: e.target.value })}
          />
        </label>
        <label className={label}>
          Referee&rsquo;s email
          <input
            type="email"
            className={input}
            value={draft.refereeEmail}
            onChange={(e) => onChange({ refereeEmail: e.target.value })}
          />
        </label>
        <label className={label}>
          Referee&rsquo;s phone
          <input
            type="tel"
            className={input}
            value={draft.refereePhone}
            onChange={(e) => onChange({ refereePhone: e.target.value })}
          />
        </label>
        {personal ? (
          <label className={`${label} sm:col-span-2`}>
            How do they know you, and for how long?
            <input
              className={input}
              placeholder="e.g. Neighbour, known for 8 years"
              value={draft.relationship}
              onChange={(e) => onChange({ relationship: e.target.value })}
            />
          </label>
        ) : (
          <>
            <label className={`${label} sm:col-span-2`}>
              Your job title there
              <input
                className={input}
                value={draft.candidateRole}
                onChange={(e) => onChange({ candidateRole: e.target.value })}
              />
            </label>
            <label className={label}>
              Started
              <input
                type="month"
                className={input}
                value={draft.startMonth}
                onChange={(e) => onChange({ startMonth: e.target.value })}
              />
            </label>
            <label className={label}>
              Finished (leave blank if current)
              <input
                type="month"
                className={input}
                value={draft.endMonth}
                onChange={(e) => onChange({ endMonth: e.target.value })}
              />
            </label>
          </>
        )}
      </div>
    </section>
  );
}
