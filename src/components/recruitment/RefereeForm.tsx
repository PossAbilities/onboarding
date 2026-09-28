"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { submitRefereeFormAction } from "@/app/actions/recruitment";

type Q = {
  key: string;
  label: string;
  type: "text" | "textarea" | "yesno" | "month";
};

const EMPLOYER_QS: Q[] = [
  { key: "employed_from", label: "Employed from", type: "month" },
  {
    key: "employed_to",
    label: "Employed to (leave blank if current)",
    type: "month",
  },
  { key: "job_title", label: "The candidate's job title", type: "text" },
  { key: "reason_for_leaving", label: "Reason for leaving", type: "textarea" },
  {
    key: "conduct",
    label: "Please comment on their reliability, attendance and conduct",
    type: "textarea",
  },
  {
    key: "disciplinary",
    label: "Are you aware of any current disciplinary action or warnings?",
    type: "yesno",
  },
  {
    key: "safeguarding",
    label:
      "Are you aware of any safeguarding concerns about this person working with children or adults at risk?",
    type: "yesno",
  },
  { key: "reemploy", label: "Would you re-employ them?", type: "yesno" },
];

const PERSONAL_QS: Q[] = [
  {
    key: "known_for",
    label: "How long have you known the candidate?",
    type: "text",
  },
  {
    key: "capacity",
    label: "In what capacity do you know them?",
    type: "text",
  },
  {
    key: "character",
    label: "Please comment on their character and honesty",
    type: "textarea",
  },
  {
    key: "suitability",
    label:
      "Do you consider them suitable to support people with disabilities or additional needs? Please explain.",
    type: "textarea",
  },
  {
    key: "safeguarding",
    label:
      "Are you aware of any reason they should not work with children or adults at risk?",
    type: "yesno",
  },
];

export function RefereeForm({
  token,
  personal,
  defaults,
}: {
  token: string;
  personal: boolean;
  defaults: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));

  const submit = () =>
    startTransition(async () => {
      const res = await submitRefereeFormAction(token, values);
      setMsg({ ok: res.ok, text: res.message });
    });

  if (msg?.ok) {
    return (
      <div className="rounded-xl bg-success-green/10 p-6 text-center">
        <Icon name="task_alt" size={40} className="text-[#1b7a44]" />
        <p className="mt-2 text-lg font-black text-on-surface">{msg.text}</p>
        <p className="mt-1 text-sm text-on-surface-variant">
          You can now close this page.
        </p>
      </div>
    );
  }

  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";
  const qs = personal ? PERSONAL_QS : EMPLOYER_QS;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Your full name *
          <input
            className={input}
            value={values.referee_name ?? ""}
            onChange={(e) => set("referee_name", e.target.value)}
          />
        </label>
        <label className={label}>
          Your position / occupation
          <input
            className={input}
            value={values.referee_position ?? ""}
            onChange={(e) => set("referee_position", e.target.value)}
          />
        </label>
        {!personal && (
          <label className={label}>
            Organisation
            <input
              className={input}
              value={values.organisation ?? ""}
              onChange={(e) => set("organisation", e.target.value)}
            />
          </label>
        )}
        <label className={label}>
          Phone number
          <input
            className={input}
            value={values.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
          />
        </label>
      </section>

      <section className="flex flex-col gap-4">
        {qs.map((q) => (
          <div key={q.key}>
            {q.type === "yesno" ? (
              <fieldset>
                <legend className={label}>{q.label}</legend>
                <div className="mt-2 flex gap-2">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set(q.key, opt)}
                      className={`rounded-lg border-2 px-4 py-1.5 text-sm font-bold ${
                        values[q.key] === opt
                          ? "border-secondary bg-secondary-fixed/40 text-on-surface"
                          : "border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {values[q.key] === (q.key === "reemploy" ? "No" : "Yes") && (
                  <textarea
                    rows={2}
                    placeholder="Please give details"
                    className={input}
                    value={values[`${q.key}_details`] ?? ""}
                    onChange={(e) => set(`${q.key}_details`, e.target.value)}
                  />
                )}
              </fieldset>
            ) : (
              <label className={label}>
                {q.label}
                {q.type === "textarea" ? (
                  <textarea
                    rows={3}
                    className={input}
                    value={values[q.key] ?? ""}
                    onChange={(e) => set(q.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={q.type === "month" ? "month" : "text"}
                    className={input}
                    value={values[q.key] ?? ""}
                    onChange={(e) => set(q.key, e.target.value)}
                  />
                )}
              </label>
            )}
          </div>
        ))}
        <label className={label}>
          Any other comments
          <textarea
            rows={3}
            className={input}
            value={values.comments ?? ""}
            onChange={(e) => set("comments", e.target.value)}
          />
        </label>
      </section>

      <label className="flex items-start gap-3 rounded-lg bg-surface-container-low px-3 py-3 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={values.confirm === "yes"}
          onChange={(e) => set("confirm", e.target.checked ? "yes" : "")}
          className="mt-0.5 h-5 w-5 accent-[#b30069]"
        />
        I confirm the information I have given is accurate to the best of my
        knowledge, and I understand it may be shared with the candidate on
        request.
      </label>

      {msg && !msg.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">
          <Icon name="error" size={18} /> {msg.text}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="btn-3d inline-flex w-fit items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
      >
        <Icon name="send" size={18} />{" "}
        {pending ? "Sending…" : "Submit reference"}
      </button>
    </div>
  );
}
