import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { clsx } from "@/lib/cn";

type Variant = "primary" | "purple" | "outline" | "ghost" | "teal";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold tracking-wide rounded-xl transition-colors select-none disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-secondary text-on-secondary hover:bg-secondary-container btn-3d",
  purple:
    "bg-primary-container text-on-primary hover:bg-primary btn-3d-purple",
  teal: "bg-teal-accent text-tertiary hover:brightness-95",
  outline:
    "border-2 border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary-container",
  ghost: "text-on-surface-variant hover:bg-surface-container",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-2",
  md: "text-sm px-5 py-3",
  lg: "text-base px-7 py-4",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
