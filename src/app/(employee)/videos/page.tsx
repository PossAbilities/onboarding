import type { Metadata } from "next";
import { getVideos } from "@/lib/data";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Icon } from "@/components/ui/Icon";
import type { StaffVideo } from "@/lib/types";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage() {
  const videos = await getVideos();
  const groups: { name: string; items: StaffVideo[] }[] = [];
  for (const v of videos) {
    let g = groups.find((x) => x.name === v.category);
    if (!g) {
      g = { name: v.category || "Videos", items: [] };
      groups.push(g);
    }
    g.items.push(v);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-3xl font-black text-on-surface md:text-4xl">
        Videos from staff &amp; the people we support
      </h1>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        Hear first-hand what life at PossAbilities is like.
      </p>

      {groups.length === 0 && (
        <p className="mt-8 flex items-center gap-2 rounded-xl bg-surface-container-low p-5 text-on-surface-variant">
          <Icon name="smart_display" size={22} /> Videos are coming soon.
        </p>
      )}

      {groups.map((g) => (
        <section key={g.name} className="mt-10">
          <h2 className="text-2xl font-black text-on-surface">{g.name}</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {g.items.map((v) => (
              <article
                key={v.id}
                className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest journey-card-shadow"
              >
                {v.videoUrl ? (
                  <VideoPlayer
                    src={v.videoUrl}
                    poster={v.posterUrl || null}
                    label={v.speaker}
                    className="rounded-none"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-primary-container text-on-primary">
                    <Icon name="videocam" size={36} />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-extrabold text-on-surface">{v.title}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                    {v.speaker}
                  </p>
                  {v.description && (
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {v.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
