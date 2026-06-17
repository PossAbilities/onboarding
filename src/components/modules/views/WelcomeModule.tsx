/* eslint-disable @next/next/no-img-element */
import { ModuleScaffold } from "../ModuleScaffold";
import { ModuleVideo } from "../ModuleVideo";
import { EasterEgg } from "../EasterEgg";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { getDirectors } from "@/lib/data";
import { SAMPLE_VIDEO } from "@/lib/seed";
import type { ModuleViewProps } from "../types";

export function WelcomeModule(props: ModuleViewProps) {
  const directors = getDirectors();
  return (
    <ModuleScaffold
      {...props}
      hero={
        <ModuleVideo
          moduleId={props.module.id}
          src={props.module.heroMediaUrl ?? SAMPLE_VIDEO}
          poster={props.module.heroPoster}
          label="CEO Welcome · 'Building PossAbilities'"
          alreadyCompleted={props.alreadyCompleted}
        />
      }
    >
      <div className="rounded-lg bg-surface-container-low p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-on-surface">
          A Message from Sarah Chen
          <EasterEgg eggId="egg-welcome" hint="Sarah hid a treat here!" />
        </h2>
        <p className="mt-2 text-on-surface-variant">
          Press play above to hear our CEO talk about your journey with us. When
          the video finishes your progress saves automatically and you&rsquo;ll
          earn the <strong className="text-secondary">First Contact</strong> badge.
        </p>
      </div>

      <h2 className="mt-10 text-2xl font-black text-on-surface">
        Meet the Directors
      </h2>
      <p className="mt-1 text-on-surface-variant">
        The people steering the ship — and cheering you on.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {directors.map((d) => (
          <Card key={d.id} hover className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <img
                src={d.photoUrl}
                alt={d.name}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-on-surface">{d.name}</p>
                <p className="flex items-center gap-1 text-sm font-bold text-secondary">
                  <Icon name="badge" size={16} /> {d.role}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">{d.bio}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ModuleScaffold>
  );
}
