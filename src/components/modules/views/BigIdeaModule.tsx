import { ModuleScaffold } from "../ModuleScaffold";
import { EasterEgg } from "../EasterEgg";
import { Icon } from "@/components/ui/Icon";
import { IdeaPortal } from "@/components/games/IdeaPortal";
import { getIdeas } from "@/lib/data";
import type { ModuleViewProps } from "../types";

export async function BigIdeaModule(props: ModuleViewProps) {
  const ideas = await getIdeas();
  return (
    <ModuleScaffold {...props}>
      {/* Hero band */}
      <div className="overflow-hidden rounded-xl gradient-purple-pink p-6 text-on-primary">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-2xl font-black">
              Movement of thinkers &amp; builders
              <EasterEgg eggId="egg-bigidea" hint="An idea spark, hidden!" />
            </h2>
            <p className="mt-2 text-primary-fixed">
              Got a better way to do things? Submit it, rally votes from the
              team, and watch it climb the Mastermind ladder. Implemented ideas
              earn real rewards.
            </p>
          </div>
          <div className="rounded-xl bg-on-primary/15 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-fixed">
              Rewards up to
            </p>
            <p className="text-3xl font-black">£500</p>
            <p className="text-xs text-primary-fixed">+ a bonus holiday</p>
          </div>
        </div>
      </div>

      {/* Reward tiers */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { tier: "Explorer", icon: "explore", note: "Submit your first idea" },
          { tier: "Builder", icon: "construction", note: "Get 100+ votes" },
          { tier: "Mastermind", icon: "workspace_premium", note: "Idea implemented" },
        ].map((t) => (
          <div
            key={t.tier}
            className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 text-center journey-card-shadow"
          >
            <Icon name={t.icon} className="text-secondary" size={28} fill />
            <p className="mt-1 font-extrabold text-on-surface">{t.tier}</p>
            <p className="text-xs text-on-surface-variant">{t.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <IdeaPortal initialIdeas={ideas} />
      </div>
    </ModuleScaffold>
  );
}
