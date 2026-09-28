"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { saveDrivingAction } from "@/app/actions/recruitment";
import type { DrivingDetails } from "@/lib/recruitment";

const EMPTY: DrivingDetails = {
  vehicleChecks: [],
  insurer: "",
  policyNumber: "",
  insuranceExpiry: "",
  businessUseCover: false,
  licenceLast8: "",
  checkCode: "",
};

export function DrivingForm({
  drives: initialDrives,
  details,
  vehicleChecklist,
  submittedAt,
  approved,
}: {
  drives: boolean | null;
  details: DrivingDetails | null;
  vehicleChecklist: string[];
  submittedAt: string | null;
  approved: boolean;
}) {
  const router = useRouter();
  const [drives, setDrives] = useState<boolean | null>(initialDrives);
  const [d, setD] = useState<DrivingDetails>(details ?? EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<DrivingDetails>) =>
    setD((x) => ({ ...x, ...patch }));

  const run = (input: Parameters<typeof saveDrivingAction>[0]) =>
    startTransition(async () => {
      setMsg(null);
      const res = await saveDrivingAction(input);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });

  const input =
    "field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-normal";
  const label = "block text-sm font-bold text-on-surface";

  return (
    <div className="flex flex-col gap-6">
      {approved && (
        <p className="flex items-center gap-2 rounded-lg bg-success-green/10 px-4 py-3 text-sm font-bold text-[#1b7a44]">
          <Icon name="verified" size={18} /> Your driving documents have been
          checked — thank you.
        </p>
      )}
      {!approved && submittedAt && (
        <p className="flex items-center gap-2 rounded-lg bg-tertiary-fixed/40 px-4 py-3 text-sm font-bold text-on-tertiary-fixed-variant">
          <Icon name="hourglass_top" size={18} /> Submitted — the HR team will
          check your details.
        </p>
      )}

      <section>
        <h2 className="text-lg font-black text-on-surface">
          Will you drive as part of your job?
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDrives(true)}
            className={`rounded-xl border-2 px-5 py-3 text-sm font-bold ${drives === true ? "border-secondary bg-secondary-fixed/40 text-on-surface" : "border-outline-variant text-on-surface-variant"}`}
          >
            <Icon
              name="directions_car"
              size={18}
              className="mr-1 align-middle"
            />{" "}
            Yes, I&rsquo;ll drive for work
          </button>
          <button
            type="button"
            onClick={() => {
              setDrives(false);
              run({ drives: false });
            }}
            className={`rounded-xl border-2 px-5 py-3 text-sm font-bold ${drives === false ? "border-secondary bg-secondary-fixed/40 text-on-surface" : "border-outline-variant text-on-surface-variant"}`}
          >
            No, this doesn&rsquo;t apply to me
          </button>
        </div>
      </section>

      {drives && (
        <>
          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
            <h2 className="font-extrabold text-on-surface">
              1. Vehicle checklist
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {vehicleChecklist.map((item) => (
                <label
                  key={item}
                  className="flex items-start gap-3 text-sm text-on-surface"
                >
                  <input
                    type="checkbox"
                    checked={d.vehicleChecks.includes(item)}
                    onChange={(e) =>
                      set({
                        vehicleChecks: e.target.checked
                          ? [...d.vehicleChecks, item]
                          : d.vehicleChecks.filter((x) => x !== item),
                      })
                    }
                    className="mt-0.5 h-5 w-5 accent-[#b30069]"
                  />
                  {item}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
            <h2 className="font-extrabold text-on-surface">
              2. Business insurance
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className={label}>
                Insurer
                <input
                  className={input}
                  value={d.insurer}
                  onChange={(e) => set({ insurer: e.target.value })}
                />
              </label>
              <label className={label}>
                Policy number
                <input
                  className={input}
                  value={d.policyNumber}
                  onChange={(e) => set({ policyNumber: e.target.value })}
                />
              </label>
              <label className={label}>
                Expiry date
                <input
                  type="date"
                  className={input}
                  value={d.insuranceExpiry}
                  onChange={(e) => set({ insuranceExpiry: e.target.value })}
                />
              </label>
            </div>
            <label className="mt-3 flex items-start gap-3 text-sm font-bold text-on-surface">
              <input
                type="checkbox"
                checked={d.businessUseCover}
                onChange={(e) => set({ businessUseCover: e.target.checked })}
                className="mt-0.5 h-5 w-5 accent-[#b30069]"
              />
              My insurance includes cover for business use
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">
              Please also bring or email a copy of your insurance certificate to
              the HR team.
            </p>
          </section>

          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
            <h2 className="font-extrabold text-on-surface">
              3. Licence check code
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Generate a code at{" "}
              <a
                href="https://www.gov.uk/view-driving-licence"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-secondary underline"
              >
                gov.uk/view-driving-licence
              </a>{" "}
              (choose &ldquo;Share your licence information&rdquo;). This lets
              us check the status of your licence.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg border-2 border-secondary bg-secondary-fixed/40 p-3 text-sm font-bold text-on-secondary-fixed-variant">
              <Icon name="warning" size={20} fill />
              Reminder: the code is case sensitive — please type upper and lower
              case letters exactly as they appear.
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Last 8 characters of your licence number
                <input
                  className={`${input} font-mono uppercase`}
                  maxLength={8}
                  value={d.licenceLast8}
                  onChange={(e) =>
                    set({ licenceLast8: e.target.value.toUpperCase() })
                  }
                />
              </label>
              <label className={label}>
                Check code (case sensitive)
                <input
                  className={`${input} font-mono`}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={d.checkCode}
                  onChange={(e) => set({ checkCode: e.target.value })}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              Codes expire after 21 days, so please generate yours close to
              submitting.
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => run({ drives: true, details: d, submit: true })}
              disabled={pending}
              className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
            >
              <Icon name="send" size={18} />{" "}
              {pending ? "Saving…" : "Submit driving details"}
            </button>
            <button
              type="button"
              onClick={() => run({ drives: true, details: d })}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-outline-variant px-5 py-3 text-sm font-bold text-on-surface"
            >
              <Icon name="save" size={18} /> Save draft
            </button>
          </div>
        </>
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
    </div>
  );
}
