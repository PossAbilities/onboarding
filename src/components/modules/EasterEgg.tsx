"use client";

import { useState, useTransition } from "react";
import { collectEggAction } from "@/app/actions/journey";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";

/**
 * A hidden collectible. Three are scattered across the journey; finding all
 * three unlocks the "Navigator" badge. Subtle by design — the fun is spotting it.
 */
export function EasterEgg({
  eggId,
  className,
  hint = "You found a hidden gem!",
}: {
  eggId: string;
  className?: string;
  hint?: string;
}) {
  const [found, setFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const collect = () => {
    if (found) return;
    setFound(true);
    startTransition(async () => {
      const res = await collectEggAction(eggId);
      setToast(
        res.unlockedNavigator
          ? "🧭 Navigator badge unlocked — you found all 3!"
          : `${hint} (${res.found}/3 found)`,
      );
      setTimeout(() => setToast(null), 4000);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={collect}
        aria-label="Hidden collectible"
        className={clsx(
          "inline-flex h-6 w-6 items-center justify-center rounded-full transition-all",
          found
            ? "bg-secondary text-on-secondary"
            : "text-outline-variant/40 hover:text-secondary hover:scale-125",
          className,
        )}
      >
        <Icon name={found ? "auto_awesome" : "egg"} size={16} fill={found} />
      </button>
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-xl float-in lg:bottom-8">
          {toast}
        </div>
      )}
    </>
  );
}
