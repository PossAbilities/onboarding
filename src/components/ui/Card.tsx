import type { ReactNode } from "react";
import { clsx } from "@/lib/cn";

export function Card({
  children,
  className,
  hover = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={clsx(
        "rounded-lg bg-surface-container-lowest border border-outline-variant/60 journey-card-shadow",
        hover && "journey-card-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
