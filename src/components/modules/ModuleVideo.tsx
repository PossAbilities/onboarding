"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Icon } from "@/components/ui/Icon";
import { completeModuleAction } from "@/app/actions/journey";

/**
 * Native video for a module hero. When watched to ~95% it silently marks the
 * module complete (e.g. unlocks "First Contact") and shows a gentle toast — the
 * explicit Complete button still works for those who skip ahead.
 */
export function ModuleVideo({
  moduleId,
  src,
  poster,
  label,
  alreadyCompleted,
}: {
  moduleId: string;
  src: string;
  poster?: string | null;
  label?: string;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(alreadyCompleted);
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState(false);

  const onWatched = () => {
    if (done) return;
    setDone(true);
    setToast(true);
    startTransition(async () => {
      await completeModuleAction(moduleId);
      router.refresh();
    });
    setTimeout(() => setToast(false), 4000);
  };

  return (
    <div className="relative">
      <VideoPlayer src={src} poster={poster} label={label} onWatched={onWatched} />
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg float-in">
          <Icon name="task_alt" size={16} className="mr-1 align-middle" /> Nice —
          progress saved!
        </div>
      )}
    </div>
  );
}
