import { ModuleScaffold } from "../ModuleScaffold";
import { ModuleVideo } from "../ModuleVideo";
import { EasterEgg } from "../EasterEgg";
import { Icon } from "@/components/ui/Icon";
import { SAMPLE_VIDEO } from "@/lib/seed";
import type { ModuleViewProps } from "../types";

export function WelcomeModule(props: ModuleViewProps) {
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

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-on-tertiary-fixed-variant">
        <Icon name="groups" size={24} fill />
        <p className="text-sm font-bold">
          Up next: Mission 02 — Meet the Directors. You&rsquo;ll get to know the
          leadership team and earn the People Person badge.
        </p>
      </div>
    </ModuleScaffold>
  );
}
