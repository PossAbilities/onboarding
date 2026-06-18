import Link from "next/link";
import { clsx } from "@/lib/cn";

/**
 * PossAbilities wordmark. "Poss" in pink, "Abilities" in purple — per the
 * brand manual logotype. Set as text so it stays crisp and themable.
 */
export function Logo({
  className,
  href = "/journey",
  size = "text-xl",
}: {
  className?: string;
  href?: string | null;
  size?: string;
}) {
  const mark = (
    <span className={clsx("font-avenir font-extrabold tracking-tight", size, className)}>
      <span className="text-brand-pink">Poss</span>
      <span className="text-primary-container">Abilities</span>
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} className="inline-flex items-center">
      {mark}
    </Link>
  );
}
