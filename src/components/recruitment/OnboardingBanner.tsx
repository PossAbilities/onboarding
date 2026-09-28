import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** Progress banner shown at the top of the candidate's pages. */
export function OnboardingBanner({
  done,
  total,
  percent,
}: {
  done: number;
  total: number;
  percent: number;
}) {
  const complete = total > 0 && done === total;
  return (
    <div className="gradient-purple-pink px-4 py-3 text-on-primary md:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <Icon name={complete ? "verified" : "checklist"} size={20} fill />
          {complete
            ? "Onboarding complete — you're all set!"
            : "Your onboarding progress"}
        </span>
        <div className="flex min-w-[160px] flex-1 items-center gap-3">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-white/25"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Onboarding progress"
          >
            <div
              className="h-full rounded-full bg-teal-accent transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-black">{percent}%</span>
        </div>
        <span className="text-xs font-bold text-white/85">
          {done} of {total} checks complete
        </span>
        <Link
          href="/onboarding"
          className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
        >
          View tasks →
        </Link>
      </div>
    </div>
  );
}
