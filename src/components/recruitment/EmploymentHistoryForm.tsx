"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { saveEmploymentHistoryAction } from "@/app/actions/recruitment";
import {
  currentMonth,
  findGaps,
  formatMonth,
  type EmploymentEntry,
  type EmploymentHistory,
} from "@/lib/recruitment";

const newEntry = (): EmploymentEntry => ({
  id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  employer: "",
  jobTitle: "",
  startMonth: "",
  endMonth: "",
  careOrEducation: false,
  reasonForLeaving: "",
});

export function EmploymentHistoryForm({
  initial,
  submittedAt,
  verified,
}: {
  initial: EmploymentHistory | null;
  submittedAt: string | null;
  verified: boolean;
}) {
  const router = useRouter();
  const [leftEducation, setLeftEducation] = useState(
    initial?.leftEducation ?? "",
  );
  const [entries, setEntries] = useState<EmploymentEntry[]>(
    initial?.entries.length ? initial.entries : [newEntry()],
  );
  const [explanations, setExplanations] = useState<Record<string, string>>(
    Object.fromEntries(
      (initial?.gaps ?? []).map((g) => [`${g.from}_${g.to}`, g.explanation]),
    ),
  );
  const [problems, setProblems] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const gaps = useMemo(
    () => findGaps(leftEducation, entries),
    [leftEducation, entries],
  );

  const update = (id: string, patch: Partial<EmploymentEntry>) =>
    setEntries((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );

  const save = (submit: boolean) =>
    startTransition(async () => {
      setMsg(null);
      setProblems([]);
      const history: EmploymentHistory = {
        leftEducation,
        entries: entries.filter(
          (e) => e.employer.trim() || e.jobTitle.trim() || e.startMonth,
        ),
        gaps: gaps.map((g) => ({
          ...g,
          explanation: explanations[`${g.from}_${g.to}`] ?? "",
        })),
      };
      const res = await saveEmploymentHistoryAction(history, submit);
      setMsg({ ok: res.ok, text: res.message });
      setProblems(res.problems ?? []);
      if (res.ok) router.refresh();
    });

  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";
  const max = currentMonth();

  return (
    <div className="flex flex-col gap-6">
      {submittedAt && (
        <p
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold ${
            verified
              ? "bg-success-green/10 text-[#1b7a44]"
              : "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant"
          }`}
        >
          <Icon name={verified ? "verified" : "hourglass_top"} size={18} />
          {verified
            ? "Checked and confirmed by the HR team."
            : "Submitted — the HR team will check it. You can still make changes and re-submit."}
        </p>
      )}

      <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
        <label className={label}>
          When did you leave education or start your first job?
          <input
            type="month"
            max={max}
            className={`${input} max-w-xs`}
            value={leftEducation}
            onChange={(e) => setLeftEducation(e.target.value)}
          />
        </label>
        <p className="mt-2 text-xs text-on-surface-variant">
          Your history needs to cover everything from this month up to today.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-black text-on-surface">Your jobs</h2>
        <p className="-mt-2 text-sm text-on-surface-variant">
          Start with your current or most recent job and work backwards.
        </p>
        {entries.map((e, i) => (
          <div
            key={e.id}
            className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-on-surface">
                {e.employer.trim() || `Job ${i + 1}`}
              </p>
              <button
                type="button"
                onClick={() =>
                  setEntries((list) => list.filter((x) => x.id !== e.id))
                }
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-error"
                aria-label="Remove this job"
              >
                <Icon name="delete" size={20} />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Employer
                <input
                  className={input}
                  value={e.employer}
                  onChange={(ev) => update(e.id, { employer: ev.target.value })}
                />
              </label>
              <label className={label}>
                Job title
                <input
                  className={input}
                  value={e.jobTitle}
                  onChange={(ev) => update(e.id, { jobTitle: ev.target.value })}
                />
              </label>
              <label className={label}>
                Start month
                <input
                  type="month"
                  max={max}
                  className={input}
                  value={e.startMonth}
                  onChange={(ev) =>
                    update(e.id, { startMonth: ev.target.value })
                  }
                />
              </label>
              <label className={label}>
                Finish month
                <input
                  type="month"
                  max={max}
                  className={input}
                  value={e.endMonth}
                  onChange={(ev) => update(e.id, { endMonth: ev.target.value })}
                />
                <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                  Leave blank if you still work here.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm font-bold text-on-surface sm:col-span-2">
                <input
                  type="checkbox"
                  checked={e.careOrEducation}
                  onChange={(ev) =>
                    update(e.id, { careOrEducation: ev.target.checked })
                  }
                  className="mt-0.5 h-5 w-5 accent-[#b30069]"
                />
                This role was in health &amp; social care or education
              </label>
              <label className={`${label} sm:col-span-2`}>
                Reason for leaving
                {e.careOrEducation && e.endMonth && (
                  <span className="text-secondary"> (required)</span>
                )}
                <textarea
                  rows={2}
                  className={input}
                  value={e.reasonForLeaving}
                  onChange={(ev) =>
                    update(e.id, { reasonForLeaving: ev.target.value })
                  }
                />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEntries((list) => [...list, newEntry()])}
          className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-dashed border-outline-variant px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:border-secondary hover:text-secondary"
        >
          <Icon name="add" size={18} /> Add another job
        </button>
      </section>

      <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
        <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
          <Icon name="date_range" size={22} className="text-secondary" /> Gaps
          in employment
        </h2>
        {gaps.length === 0 ? (
          <p className="mt-2 text-sm text-on-surface-variant">
            {leftEducation
              ? "No gaps found — great!"
              : "Add when you left education and your jobs, and we'll check for any gaps."}
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-on-surface-variant">
              Please explain what you were doing during each of these periods
              (for example studying, travelling, caring for family, or looking
              for work).
            </p>
            {gaps.map((g) => {
              const k = `${g.from}_${g.to}`;
              return (
                <label key={k} className={label}>
                  {formatMonth(g.from)}
                  {g.from !== g.to ? ` – ${formatMonth(g.to)}` : ""}
                  <textarea
                    rows={2}
                    className={input}
                    value={explanations[k] ?? ""}
                    onChange={(ev) =>
                      setExplanations((x) => ({ ...x, [k]: ev.target.value }))
                    }
                  />
                </label>
              );
            })}
          </div>
        )}
      </section>

      {msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-bold ${
            msg.ok
              ? "bg-success-green/10 text-[#1b7a44]"
              : "bg-error-container text-on-error-container"
          }`}
        >
          <p className="flex items-center gap-1.5">
            <Icon name={msg.ok ? "check_circle" : "error"} size={18} />{" "}
            {msg.text}
          </p>
          {problems.length > 0 && (
            <ul className="mt-2 list-disc pl-6 font-normal">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => save(true)}
          disabled={pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
        >
          <Icon name="send" size={18} />{" "}
          {pending ? "Saving…" : "Submit employment history"}
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
    </div>
  );
}
