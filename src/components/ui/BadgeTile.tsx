import { Icon } from "./Icon";
import { clsx } from "@/lib/cn";
import type { Badge } from "@/lib/types";

export function BadgeTile({
  badge,
  earned,
  className,
}: {
  badge: Badge;
  earned: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 text-center transition-colors",
        earned
          ? "border-secondary/30 bg-surface-container-lowest"
          : "border-outline-variant/50 bg-surface-container opacity-70",
        className,
      )}
    >
      <div
        className={clsx(
          "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full",
          earned ? "gradient-purple-pink text-on-primary" : "bg-surface-container-highest text-outline",
        )}
      >
        <Icon name={earned ? badge.icon : "lock"} fill size={30} />
      </div>
      <p className="text-sm font-extrabold text-on-surface">{badge.name}</p>
      <p className="mt-1 text-xs text-on-surface-variant leading-snug">
        {badge.description}
      </p>
      <p
        className={clsx(
          "mt-2 text-xs font-bold uppercase tracking-wide",
          earned ? "text-secondary" : "text-outline",
        )}
      >
        {earned ? `Unlocked · +${badge.xp} XP` : "Locked"}
      </p>
    </div>
  );
}
