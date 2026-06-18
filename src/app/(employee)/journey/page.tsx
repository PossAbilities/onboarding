import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getJourneyState } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BadgeTile } from "@/components/ui/BadgeTile";
import { ButtonLink } from "@/components/ui/Button";
import { clsx } from "@/lib/cn";
import type { Module, ModuleProgress, ProgressStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My Journey" };

const KIND_ICON: Record<string, string> = {
  video: "play_circle",
  photo: "photo_camera",
  directors: "groups",
  manager: "supervisor_account",
  culture: "diversity_3",
  benefits: "redeem",
  bigidea: "lightbulb",
  pets: "pets",
  locations: "map",
  certificate: "workspace_premium",
  game: "stadia_controller",
  content: "article",
};

export default async function JourneyPage() {
  const profile = await requireProfile();
  const journey = await getJourneyState(profile);
  const status = (id: string): ProgressStatus =>
    journey.progress.find((p) => p.moduleId === id)?.status ?? "locked";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {profile.isAdmin && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary-container/30 bg-primary-fixed/40 px-4 py-3 text-sm font-bold text-on-primary-fixed-variant">
          <Icon name="visibility" size={20} fill />
          Admin preview — every step is unlocked so you can flow through the whole
          journey.
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface md:text-4xl">
            Welcome Home, {profile.fullName.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-on-surface-variant">
            Your adventure at PossAbilities starts here. Follow the path to
            unlock your full potential.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-4 text-right journey-card-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Journey Progress
          </p>
          <p className="text-2xl font-black text-primary-container">
            {journey.percentComplete}% Complete
          </p>
          <ProgressBar value={journey.percentComplete} className="mt-1 w-48" />
        </div>
      </div>

      {/* The Path */}
      <ol className="relative mt-10 flex flex-col gap-6">
        {journey.modules.map((mod, i) => (
          <PathRow
            key={mod.id}
            module={mod}
            status={status(mod.id)}
            progress={journey.progress.find((p) => p.moduleId === mod.id)}
            last={i === journey.modules.length - 1}
          />
        ))}
      </ol>

      {/* Achievement collection */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-black text-on-surface">
          <Icon name="military_tech" className="text-secondary" fill /> Your
          Achievement Collection
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {journey.badges.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              earned={journey.earnedBadges.some((b) => b.badgeId === badge.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PathRow({
  module,
  status,
  progress,
  last,
}: {
  module: Module;
  status: ProgressStatus;
  progress?: ModuleProgress;
  last: boolean;
}) {
  const locked = status === "locked";
  const completed = status === "completed";
  const active = status === "in_progress";

  const nodeIcon = completed
    ? "check"
    : locked
      ? "lock"
      : active
        ? "rocket_launch"
        : (module.icon ?? KIND_ICON[module.kind] ?? "circle");

  return (
    <li className="relative flex gap-5">
      {/* Path node + connector */}
      <div className="flex flex-col items-center">
        <span
          className={clsx(
            "z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-on-primary shadow-md",
            completed && "bg-teal-accent text-tertiary",
            active && "bg-secondary badge-pulse",
            locked && "bg-surface-container-highest text-outline",
            status === "available" && "bg-primary-container",
          )}
        >
          <Icon name={nodeIcon} fill size={24} />
        </span>
        {!last && (
          <span
            className={clsx(
              "w-1.5 flex-1 rounded-full",
              completed ? "bg-teal-accent" : "bg-surface-container-highest",
            )}
          />
        )}
      </div>

      {/* Card */}
      <div
        className={clsx(
          "mb-2 flex-1 rounded-lg border bg-surface-container-lowest p-5 journey-card-shadow",
          active ? "border-secondary/40" : "border-outline-variant/60",
          locked && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Chip
              tone={
                completed ? "teal" : active ? "pink" : locked ? "locked" : "purple"
              }
            >
              Level {module.level} ·{" "}
              {completed
                ? "Completed"
                : active
                  ? "In Progress"
                  : locked
                    ? "Locked"
                    : "Ready"}
            </Chip>
            {module.required && (
              <Chip tone="neutral">Required</Chip>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
            <Icon name="schedule" size={16} /> {module.estMinutes} mins
          </span>
        </div>

        <h3 className="mt-3 text-lg font-extrabold text-on-surface">
          {module.title}
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          {module.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {completed && progress?.completedAt ? (
            <span className="flex items-center gap-1 text-sm font-bold text-[#1b7a44]">
              <Icon name="task_alt" size={18} /> Completed
            </span>
          ) : (
            <span className="text-sm font-bold text-on-surface-variant">
              +{module.rewardXp} XP
            </span>
          )}

          {locked ? (
            <span className="flex items-center gap-1 rounded-lg bg-surface-container-highest px-4 py-2 text-sm font-bold text-outline">
              <Icon name="lock" size={18} /> Locked
            </span>
          ) : (
            <ButtonLink
              href={`/modules/${module.slug}`}
              variant={active ? "primary" : completed ? "outline" : "purple"}
              size="sm"
            >
              {completed ? "Revisit" : active ? "Resume Mission" : "Start"}
              <Icon name="arrow_forward" size={18} />
            </ButtonLink>
          )}
        </div>
      </div>
    </li>
  );
}
