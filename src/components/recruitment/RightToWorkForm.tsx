"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { saveRightToWorkAction } from "@/app/actions/recruitment";
import type { RtwRoute } from "@/lib/recruitment";

/** Pick a nationality group → see exactly which documents are needed. */
export function RightToWorkForm({
  route: initialRoute,
  shareCode: initialCode,
  british,
  restOfWorld,
  received,
}: {
  route: RtwRoute | null;
  shareCode: string;
  british: string[];
  restOfWorld: string[];
  received: boolean;
}) {
  const router = useRouter();
  const [route, setRoute] = useState<RtwRoute | null>(initialRoute);
  const [shareCode, setShareCode] = useState(initialCode);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const list =
    route === "british"
      ? british
      : route === "rest_of_world"
        ? restOfWorld
        : [];
  const required = list.filter((d) => /required/i.test(d));
  const others = list.filter((d) => !/required/i.test(d));

  const save = () =>
    startTransition(async () => {
      if (!route) return;
      const res = await saveRightToWorkAction({ route, shareCode });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });

  const option = (
    value: RtwRoute,
    title: string,
    text: string,
    icon: string,
  ) => (
    <button
      type="button"
      onClick={() => setRoute(value)}
      className={`flex flex-1 items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
        route === value
          ? "border-secondary bg-secondary-fixed/40"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary-container"
      }`}
      aria-pressed={route === value}
    >
      <Icon
        name={icon}
        size={26}
        className="text-secondary"
        fill={route === value}
      />
      <span>
        <span className="block font-extrabold text-on-surface">{title}</span>
        <span className="block text-sm text-on-surface-variant">{text}</span>
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {received && (
        <p className="flex items-center gap-2 rounded-lg bg-success-green/10 px-4 py-3 text-sm font-bold text-[#1b7a44]">
          <Icon name="verified" size={18} /> We&rsquo;ve received your right to
          work documents — thank you.
        </p>
      )}

      <section>
        <h2 className="text-lg font-black text-on-surface">
          What is your nationality?
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          {option(
            "british",
            "British citizen",
            "Including British or Irish passport holders.",
            "flag",
          )}
          {option(
            "rest_of_world",
            "Rest of the world",
            "Any other nationality, including EU citizens.",
            "public",
          )}
        </div>
      </section>

      {route && (
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
          <h2 className="font-extrabold text-on-surface">
            Documents you&rsquo;ll need
          </h2>
          {required.length > 0 && (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-secondary">
                Required
              </p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {required.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 text-sm text-on-surface"
                  >
                    <Icon
                      name="check_circle"
                      size={18}
                      className="text-secondary"
                      fill
                    />
                    {d.replace(/\s*[—-]\s*required\s*$/i, "")}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            {route === "british"
              ? "Plus only ONE of these"
              : "Plus the following, where they apply to you"}
          </p>
          <ul className="mt-1 flex flex-col gap-1.5">
            {others.map((d) => (
              <li
                key={d}
                className="flex items-start gap-2 text-sm text-on-surface"
              >
                <Icon
                  name="description"
                  size={18}
                  className="text-on-surface-variant"
                />
                {d}
              </li>
            ))}
          </ul>

          {route === "rest_of_world" && (
            <div className="mt-5 rounded-lg bg-surface-container-low p-4">
              <label className="block text-sm font-bold text-on-surface">
                Your share code
                <input
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  placeholder="e.g. W7X 9KP 3LM"
                  className="field-focus mt-1 w-full max-w-xs rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2 font-mono font-normal uppercase"
                />
              </label>
              <p className="mt-2 text-xs text-on-surface-variant">
                Get your share code from{" "}
                <a
                  href="https://www.gov.uk/prove-right-to-work"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-secondary underline"
                >
                  gov.uk/prove-right-to-work
                </a>
                .
              </p>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 rounded-lg bg-tertiary-fixed/40 p-3 text-sm text-on-tertiary-fixed-variant">
            <Icon name="info" size={18} />
            Please bring your original documents into your local PossAbilities
            office, or the HR team will arrange how to see them. We&rsquo;ll
            tick this off once they&rsquo;ve been received.
          </p>
        </section>
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

      <button
        type="button"
        onClick={save}
        disabled={!route || pending}
        className="btn-3d inline-flex w-fit items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary disabled:opacity-50"
      >
        <Icon name="save" size={18} /> {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
