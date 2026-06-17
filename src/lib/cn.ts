/** Tiny className combiner (no dependency). */
export function clsx(
  ...args: Array<string | false | null | undefined>
): string {
  return args.filter(Boolean).join(" ");
}
