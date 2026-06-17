"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeModuleAction } from "@/app/actions/journey";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/cn";

export function CompleteModuleButton({
  moduleId,
  rewardXp,
  badgeName,
  nextSlug,
  alreadyCompleted,
  label = "Mark Complete",
  className,
  autoFromWatch,
}: {
  moduleId: string;
  rewardXp: number;
  badgeName?: string | null;
  nextSlug?: string | null;
  alreadyCompleted: boolean;
  label?: string;
  className?: string;
  autoFromWatch?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(alreadyCompleted);
  const [celebrate, setCelebrate] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null);

  const complete = () => {
    if (done && !autoFromWatch) {
      setCelebrate(true);
      return;
    }
    startTransition(async () => {
      const res = await completeModuleAction(moduleId);
      setDone(true);
      setUnlockedBadge(res.badgeId ? (badgeName ?? "a new badge") : null);
      setCelebrate(true);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={complete}
        disabled={pending}
        className={clsx(
          "btn-3d inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-on-secondary",
          done ? "bg-success-green/90" : "bg-secondary",
          className,
        )}
      >
        <Icon name={done ? "task_alt" : "check_circle"} fill size={20} />
        {pending ? "Saving…" : done ? "Completed" : label}
      </button>

      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-container-lowest p-8 text-center float-in journey-card-shadow">
            <Confetti />
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-purple-pink text-on-primary badge-pulse">
              <Icon name="emoji_events" fill size={40} />
            </div>
            <h3 className="mt-4 text-2xl font-black text-on-surface">
              Level Up!
            </h3>
            <p className="mt-1 text-on-surface-variant">
              Mission complete. You earned{" "}
              <span className="font-bold text-secondary">+{rewardXp} XP</span>.
            </p>
            {unlockedBadge && (
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-secondary-fixed px-3 py-2 text-sm font-bold text-on-secondary-fixed-variant">
                <Icon name="workspace_premium" size={18} fill /> Badge unlocked:{" "}
                {unlockedBadge}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              {nextSlug ? (
                <Link
                  href={`/modules/${nextSlug}`}
                  className="btn-3d inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-on-secondary"
                  onClick={() => setCelebrate(false)}
                >
                  Next Mission <Icon name="arrow_forward" size={20} />
                </Link>
              ) : (
                <Link
                  href="/modules/certificate"
                  className="btn-3d inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-on-secondary"
                  onClick={() => setCelebrate(false)}
                >
                  Get my certificate <Icon name="workspace_premium" size={20} />
                </Link>
              )}
              <Link
                href="/journey"
                className="rounded-xl px-6 py-3 font-bold text-on-surface-variant hover:bg-surface-container"
                onClick={() => setCelebrate(false)}
              >
                Back to mission path
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 24 });
  const colors = ["#ec008c", "#48065a", "#5bc3c3", "#2ecc71"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${1.2 + (i % 5) * 0.3}s ease-in ${
              (i % 7) * 0.1
            }s forwards`,
          }}
        />
      ))}
    </div>
  );
}
