import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getJourneyState, getEasterEggsFound } from "@/lib/data";
import { BadgeTile } from "@/components/ui/BadgeTile";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "My Badges" };

export default async function BadgesPage() {
  const profile = await requireProfile();
  const journey = await getJourneyState(profile);
  const eggs = await getEasterEggsFound(profile);
  const earnedCount = journey.earnedBadges.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Badge Collection
      </h1>
      <p className="mt-2 text-on-surface-variant">
        Every mission you complete earns a collectible. Catch &rsquo;em all.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon="workspace_premium" label="Badges earned" value={`${earnedCount}/${journey.badges.length}`} />
        <Stat icon="bolt" label="Journey points" value={`${profile.journeyPoints} XP`} />
        <Stat icon="egg" label="Easter eggs found" value={`${eggs}/3`} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {journey.badges.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            earned={journey.earnedBadges.some((b) => b.badgeId === badge.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 journey-card-shadow">
      <span className="flex h-11 w-11 items-center justify-center rounded-full gradient-purple-pink text-on-primary">
        <Icon name={icon} fill size={22} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        <p className="text-lg font-black text-on-surface">{value}</p>
      </div>
    </div>
  );
}
