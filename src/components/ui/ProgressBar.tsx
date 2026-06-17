import { clsx } from "@/lib/cn";

export function ProgressBar({
  value,
  className,
  height = "h-2.5",
  showLabel = false,
}: {
  value: number;
  className?: string;
  height?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div
        className={clsx(
          "flex-1 rounded-full bg-surface-container-highest overflow-hidden",
          height,
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full gradient-progress transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-on-surface-variant tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
}
