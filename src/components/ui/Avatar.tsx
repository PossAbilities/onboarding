/* eslint-disable @next/next/no-img-element */
import { clsx } from "@/lib/cn";

export function Avatar({
  src,
  name,
  size = 40,
  className,
  ring = false,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary font-bold",
        ring && "ring-2 ring-secondary ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
