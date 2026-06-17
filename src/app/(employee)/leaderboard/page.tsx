import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getStarters } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { clsx } from "@/lib/cn";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const starters = await getStarters();

  const everyone: Profile[] = [...starters];
  if (!everyone.some((s) => s.id === profile.id) && !profile.isAdmin) {
    everyone.push(profile);
  }
  const ranked = everyone
    .filter((p) => p.status !== "invited")
    .sort((a, b) => b.journeyPoints - a.journeyPoints);

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Hall of Fame
      </h1>
      <p className="mt-2 text-on-surface-variant">
        Friendly competition fuels the journey. Earn XP by completing missions,
        games and submitting ideas.
      </p>

      {/* Podium */}
      <div className="mt-8 grid grid-cols-3 items-end gap-3">
        {[1, 0, 2].map((slot) => {
          const p = podium[slot];
          if (!p) return <div key={slot} />;
          const place = slot + 1;
          const heights = ["h-28", "h-36", "h-24"];
          return (
            <div key={p.id} className="flex flex-col items-center">
              <Avatar src={p.avatarUrl} name={p.fullName} size={slot === 0 ? 64 : 52} ring={slot === 0} />
              <p className="mt-2 text-center text-sm font-extrabold text-on-surface">
                {p.fullName.split(" ")[0]}
              </p>
              <p className="text-xs font-bold text-secondary">{p.journeyPoints} XP</p>
              <div
                className={clsx(
                  "mt-2 flex w-full items-start justify-center rounded-t-xl pt-2 text-on-primary",
                  heights[slot],
                  slot === 0 ? "gradient-purple-pink" : "bg-primary-container",
                )}
              >
                <span className="text-2xl font-black">{place}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest */}
      <ul className="mt-6 flex flex-col gap-2">
        {rest.map((p, i) => {
          const isMe = p.id === profile.id;
          return (
            <li
              key={p.id}
              className={clsx(
                "flex items-center gap-3 rounded-lg border px-4 py-3",
                isMe
                  ? "border-secondary/40 bg-secondary-fixed/40"
                  : "border-outline-variant/60 bg-surface-container-lowest",
              )}
            >
              <span className="w-6 text-center font-black text-on-surface-variant">
                {i + 4}
              </span>
              <Avatar src={p.avatarUrl} name={p.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold text-on-surface">
                  {p.fullName} {isMe && <Chip tone="pink">You</Chip>}
                </p>
                <p className="text-xs text-on-surface-variant">{p.roleTag}</p>
              </div>
              <span className="flex items-center gap-1 font-bold text-secondary">
                <Icon name="bolt" size={18} fill /> {p.journeyPoints}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
