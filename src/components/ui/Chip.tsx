import type { ReactNode } from "react";
import { clsx } from "@/lib/cn";

type Tone = "neutral" | "teal" | "pink" | "purple" | "success" | "locked";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  teal: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  pink: "bg-secondary-fixed text-on-secondary-fixed-variant",
  purple: "bg-primary-fixed text-on-primary-fixed-variant",
  success: "bg-success-green/15 text-[#1b7a44]",
  locked: "bg-surface-container-highest text-outline",
};

export function Chip({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
