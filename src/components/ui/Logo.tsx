import Link from "next/link";
import { clsx } from "@/lib/cn";

/**
 * PossAbilities wordmark. "Poss" in pink; "Abilities" in purple on light
 * backgrounds, or white on dark backgrounds (`onDark`) for contrast.
 */
export function Logo({
  className,
  href = "/journey",
  size = "text-xl",
  onDark = false,
}: {
  className?: string;
  href?: string | null;
  size?: string;
  onDark?: boolean;
}) {
  const mark = (
    <span className={clsx("font-avenir font-extrabold tracking-tight", size, className)}>
      <span className="text-brand-pink">Poss</span>
      <span className={onDark ? "text-white" : "text-primary-container"}>
        Abilities
      </span>
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex items-center">
      {mark}
    </Link>
  );
}
