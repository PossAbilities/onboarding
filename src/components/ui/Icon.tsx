import { clsx } from "@/lib/cn";

/** Material Symbols icon. `name` is a Material Symbols Outlined glyph id. */
export function Icon({
  name,
  className,
  fill = false,
  size,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  size?: number;
}) {
  return (
    <span
      className={clsx("material-symbols-outlined", fill && "fill", className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
