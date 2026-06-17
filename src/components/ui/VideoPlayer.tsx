"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { clsx } from "@/lib/cn";

/**
 * Native HTML5 video player with a branded play overlay and an `onWatched`
 * callback that fires once the viewer reaches ~95% — used to auto-complete
 * video modules. No third-party player; plays straight from the site/CDN.
 */
export function VideoPlayer({
  src,
  poster,
  label,
  className,
  onWatched,
}: {
  src: string;
  poster?: string | null;
  label?: string;
  className?: string;
  onWatched?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const watchedFired = useRef(false);

  const play = () => {
    ref.current?.play();
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg bg-primary group",
        className,
      )}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        controls={playing}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover aspect-video bg-black"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (
            !watchedFired.current &&
            v.duration > 0 &&
            v.currentTime / v.duration >= 0.95
          ) {
            watchedFired.current = true;
            onWatched?.();
          }
        }}
      />
      {!playing && (
        <button
          type="button"
          onClick={play}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary/30 backdrop-blur-[1px] transition-colors hover:bg-primary/20"
          aria-label="Play video"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg btn-3d transition-transform group-hover:scale-105">
            <Icon name="play_arrow" fill size={36} />
          </span>
          {label && (
            <span className="rounded-md bg-primary/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-primary">
              {label}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
