"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Confetti } from "./Confetti";
import { markWelcomeWatchedAction } from "@/app/actions/recruitment";
import { isEmbedVideo, parseVideo } from "@/lib/video";

/**
 * First login: a "Congratulations" pop-up, then Rachel's welcome video. Once
 * the video has been watched the candidate moves on to their offer letter.
 */
export function WelcomeExperience({
  firstName,
  title,
  message,
  videoUrl,
  videoLabel,
  alreadyWatched,
  preview,
}: {
  firstName: string;
  title: string;
  message: string;
  videoUrl: string | null;
  videoLabel: string;
  alreadyWatched: boolean;
  preview: boolean;
}) {
  const router = useRouter();
  const [popup, setPopup] = useState(!alreadyWatched);
  const parsed = parseVideo(videoUrl);
  const embed = isEmbedVideo(parsed.kind);
  // Native videos report when they've been watched; embeds (YouTube/Vimeo)
  // can't, so the candidate confirms instead. No video → nothing to wait for.
  const [watched, setWatched] = useState(
    alreadyWatched || preview || !videoUrl,
  );
  const [confirmedEmbed, setConfirmedEmbed] = useState(false);
  const [pending, startTransition] = useTransition();

  const canContinue = watched || (embed && confirmedEmbed);

  const next = () =>
    startTransition(async () => {
      if (!preview) await markWelcomeWatchedAction();
      router.push("/offer");
    });

  return (
    <>
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
          <Confetti />
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-8 text-center journey-card-shadow float-in">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-purple-pink text-on-primary">
              <Icon name="celebration" size={34} fill />
            </span>
            <h1 className="mt-5 text-2xl font-black text-on-surface md:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-on-surface-variant">
              {firstName ? `${firstName}, ` : ""}
              {message}
            </p>
            <button
              type="button"
              onClick={() => setPopup(false)}
              className="btn-3d mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary"
            >
              <Icon name="play_circle" size={20} fill /> Watch my welcome
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          Welcome to the Poss family
        </p>
        <h1 className="mt-2 text-3xl font-black text-on-surface md:text-4xl">
          {videoLabel}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
          Press play to hear from Rachel. Once you&rsquo;ve watched it,
          you&rsquo;ll be taken to your conditional offer letter.
        </p>
      </div>

      <div className="mt-8">
        {videoUrl ? (
          <VideoPlayer
            src={videoUrl}
            label={videoLabel}
            onWatched={() => setWatched(true)}
            className="journey-card-shadow"
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg bg-primary-container text-on-primary">
            <Icon name="videocam" size={40} />
            <p className="font-bold">The welcome video is coming soon.</p>
          </div>
        )}
      </div>

      {embed && !watched && (
        <label className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-on-surface">
          <input
            type="checkbox"
            checked={confirmedEmbed}
            onChange={(e) => setConfirmedEmbed(e.target.checked)}
            className="h-5 w-5 accent-[#b30069]"
          />
          I&rsquo;ve watched the video
        </label>
      )}

      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={next}
          disabled={!canContinue || pending}
          className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-7 py-4 text-base font-bold text-on-secondary disabled:opacity-50"
        >
          {pending ? "Loading…" : "Continue to my offer letter"}
          <Icon name="arrow_forward" size={20} />
        </button>
        {!canContinue && (
          <p className="text-xs font-bold text-on-surface-variant">
            <Icon name="lock" size={14} className="align-middle" /> Unlocks when
            the video finishes
          </p>
        )}
      </div>
    </>
  );
}
