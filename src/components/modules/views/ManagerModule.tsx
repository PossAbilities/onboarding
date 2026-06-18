/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { ModuleVideo } from "../ModuleVideo";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { getManagerById } from "@/lib/data";
import type { ModuleViewProps } from "../types";

export async function ManagerModule(props: ModuleViewProps) {
  const manager = await getManagerById(props.profile.managerId);

  return (
    <ModuleScaffold
      {...props}
      hero={
        manager?.videoUrl ? (
          <ModuleVideo
            moduleId={props.module.id}
            src={manager.videoUrl}
            poster={props.module.heroPoster}
            label={`A hello from ${manager.name}`}
            alreadyCompleted={props.alreadyCompleted}
          />
        ) : undefined
      }
    >
      {manager ? (
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={manager.photoUrl}
              alt={manager.name}
              width={88}
              height={88}
              className="h-22 w-22 shrink-0 rounded-xl object-cover"
              style={{ width: 88, height: 88 }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Your manager
              </p>
              <p className="text-2xl font-black text-on-surface">{manager.name}</p>
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-secondary">
                <span className="flex items-center gap-1">
                  <Icon name="badge" size={16} /> {manager.role}
                </span>
                {manager.department && (
                  <Chip tone="purple">{manager.department}</Chip>
                )}
              </p>
            </div>
          </div>
          {manager.bio && (
            <p className="mt-4 text-on-surface-variant">{manager.bio}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={
                manager.calendarUrl ??
                `mailto:?subject=${encodeURIComponent(
                  `Intro catch-up with ${manager.name}`,
                )}`
              }
              target={manager.calendarUrl ? "_blank" : undefined}
              rel="noreferrer"
              className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
            >
              <Icon name="event" size={18} /> Schedule an intro call
            </a>
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant">
              <Icon name="play_circle" size={18} /> Watch their welcome above
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-tertiary-fixed bg-tertiary-fixed/40 p-6 text-on-tertiary-fixed-variant">
          <Icon name="hourglass_top" size={28} fill />
          <h2 className="mt-2 text-xl font-black">
            Your manager is being assigned
          </h2>
          <p className="mt-1">
            Hang tight — once your manager is set up, their personal welcome
            video and details will appear right here. You can still mark this
            step complete and come back to it.
          </p>
        </div>
      )}
    </ModuleScaffold>
  );
}
