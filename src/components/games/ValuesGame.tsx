"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";
import { completeModuleAction } from "@/app/actions/journey";
import type { CompanyValue } from "@/lib/types";

// Deterministic shuffle (no Math.random — stable across renders/SSR).
function shuffle<T>(arr: T[], seed = 3): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ValuesGame({
  moduleId,
  alreadyCompleted,
  values,
}: {
  moduleId: string;
  alreadyCompleted: boolean;
  values: CompanyValue[];
}) {
  const router = useRouter();
  const VALUES = values;
  const descriptions = useMemo(() => shuffle(VALUES), [VALUES]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>(
    alreadyCompleted ? VALUES.map((v) => v.id) : [],
  );
  const [wrong, setWrong] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allMatched = VALUES.length > 0 && matched.length === VALUES.length;

  const pick = (valueId: string) => {
    if (matched.includes(valueId)) return;
    setSelectedValue(valueId);
    setWrong(null);
  };

  const drop = (descId: string) => {
    if (!selectedValue || matched.includes(descId)) return;
    if (selectedValue === descId) {
      const next = [...matched, descId];
      setMatched(next);
      setSelectedValue(null);
      if (next.length === VALUES.length && !alreadyCompleted) {
        startTransition(async () => {
          await completeModuleAction(moduleId);
          router.refresh();
        });
      }
    } else {
      setWrong(descId);
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-on-surface">
          <Icon name="stadia_controller" className="text-secondary" fill />
          Values Match Challenge
        </h3>
        <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold text-on-tertiary-fixed-variant">
          {matched.length}/{VALUES.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">
        Tap a value, then tap the description that matches it. Match all five to
        earn the <strong className="text-secondary">Culture Champion</strong> badge.
      </p>

      {allMatched ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg bg-success-green/10 p-4">
          <Icon name="celebration" className="text-success-green" fill size={28} />
          <p className="font-bold text-[#1b7a44]">
            Brilliant — you know your PossAbilities values inside out!
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Values */}
          <div className="flex flex-col gap-2">
            {VALUES.map((v) => {
              const isMatched = matched.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pick(v.id)}
                  disabled={isMatched}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm font-bold transition-all",
                    isMatched
                      ? "border-success-green/40 bg-success-green/10 text-[#1b7a44]"
                      : selectedValue === v.id
                        ? "border-secondary bg-secondary-fixed text-on-secondary-fixed-variant"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary",
                  )}
                >
                  <Icon name={isMatched ? "check_circle" : v.icon} fill size={20} />
                  {v.label}
                </button>
              );
            })}
          </div>
          {/* Descriptions */}
          <div className="flex flex-col gap-2">
            {descriptions.map((d) => {
              const isMatched = matched.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => drop(d.id)}
                  disabled={isMatched}
                  className={clsx(
                    "rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all",
                    isMatched
                      ? "border-success-green/40 bg-success-green/10 text-[#1b7a44]"
                      : wrong === d.id
                        ? "border-error bg-error-container text-on-error-container"
                        : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-teal-accent",
                  )}
                >
                  {d.match}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
