import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getJourneyState } from "@/lib/data";
import { statusFor } from "@/lib/journey";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { clsx } from "@/lib/cn";

export const metadata: Metadata = { title: "Milestones" };

export default async function MilestonesPage() {
  const profile = await requireProfile();
  const journey = await getJourneyState(profile);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">Milestones</h1>
      <p className="mt-2 text-on-surface-variant">
        A bird&rsquo;s-eye view of every mission on your induction journey.
      </p>

      <div className="mt-6 rounded-xl bg-surface-container-lowest p-5 journey-card-shadow">
        <div className="flex items-center justify-between">
          <span className="font-bold text-on-surface">Overall completion</span>
          <span className="font-black text-primary-container">
            {journey.percentComplete}%
          </span>
        </div>
        <ProgressBar value={journey.percentComplete} className="mt-2" />
      </div>

      <ol className="mt-6 flex flex-col gap-2">
        {journey.modules.map((m) => {
          const status = statusFor(m.id, journey.progress);
          const completed = status === "completed";
          const locked = status === "locked";
          return (
            <li
              key={m.id}
              className={clsx(
                "flex items-center gap-3 rounded-lg border px-4 py-3",
                completed
                  ? "border-success-green/30 bg-success-green/5"
                  : "border-outline-variant/60 bg-surface-container-lowest",
              )}
            >
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  completed
                    ? "bg-teal-accent text-tertiary"
                    : locked
                      ? "bg-surface-container-highest text-outline"
                      : "bg-secondary text-on-secondary",
                )}
              >
                <Icon
                  name={completed ? "check" : locked ? "lock" : "play_arrow"}
                  fill
                  size={20}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-on-surface">{m.shortTitle}</p>
                <p className="truncate text-xs text-on-surface-variant">
                  {m.title}
                </p>
              </div>
              <Chip tone={completed ? "teal" : locked ? "locked" : "pink"}>
                {completed ? "Done" : locked ? "Locked" : "Open"}
              </Chip>
              {!locked && (
                <Link
                  href={`/modules/${m.slug}`}
                  className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-secondary"
                  aria-label={`Open ${m.shortTitle}`}
                >
                  <Icon name="arrow_forward" size={20} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
