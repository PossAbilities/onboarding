"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { IdBadge } from "@/components/ui/IdBadge";
import { ImageCropper } from "./ImageCropper";
import { clsx } from "@/lib/cn";
import { uploadMediaAction } from "@/app/actions/media";
import { saveProfilePhotoAction } from "@/app/actions/journey";

const CHECKS = [
  "My whole head and shoulders are in shot, with a little space above my head",
  "Plain, uncluttered background and good, even lighting",
  "Facing the camera, neutral expression, eyes open — no hats or sunglasses",
  "It's a recent, professional photo (not a night-out or holiday snap!)",
];

/** Capture the full current video frame (un-mirrored) as a data URL. */
function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  // Un-mirror so the saved image matches reality (preview is mirrored for comfort).
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

export function PhotoCapture({
  moduleId,
  name,
  role,
  department,
  currentPhoto,
  offices,
}: {
  moduleId: string;
  name: string;
  role: string;
  department: string | null;
  currentPhoto: string | null;
  offices: string[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"intro" | "camera" | "adjust" | "review">(
    "intro",
  );
  const [photo, setPhoto] = useState<string | null>(currentPhoto);
  const [source, setSource] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ID badge details
  const [nameOnBadge, setNameOnBadge] = useState(name);
  const [pronouns, setPronouns] = useState("");
  const [jobTitle, setJobTitle] = useState(role);
  const [office, setOffice] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setView("camera");
      // wait a tick for the video element to mount
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(
        "Couldn't access your camera. Check permissions, or upload a photo instead.",
      );
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    setSource(captureFrame(v));
    stopCamera();
    setView("adjust");
  };

  const onFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSource(String(reader.result));
      setView("adjust");
    };
    reader.onerror = () => setError("That image couldn't be loaded.");
    reader.readAsDataURL(file);
  };

  const allChecked = checks.every(Boolean);

  const save = async () => {
    if (!photo) return;
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", dataUrlToFile(photo, "profile-photo.jpg"));
    const up = await uploadMediaAction(fd);
    if (!("url" in up)) {
      setSaving(false);
      setError(up.error);
      return;
    }
    const res = await saveProfilePhotoAction(moduleId, up.url, {
      nameOnBadge,
      pronouns,
      jobTitle,
      office,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(res.message);
    }
  };

  const reset = () => {
    setChecks([false, false, false, false]);
    setSaved(false);
    setView("intro");
  };

  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
      {error && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-error-container px-3 py-2 text-sm font-bold text-on-error-container">
          <Icon name="error" size={18} /> {error}
        </p>
      )}

      {/* INTRO */}
      {view === "intro" && (
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-black text-on-surface">
              Add your profile photo
            </h2>
            <p className="mt-1 text-on-surface-variant">
              This goes on your staff profile and your ID badge, so let&rsquo;s
              make it a good one. Aim for a <strong>passport-style headshot</strong>.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                { icon: "face", text: "Head and shoulders, centred, with space above your head" },
                { icon: "wb_sunny", text: "Good lighting and a plain background" },
                { icon: "visibility", text: "Look at the camera — no hats or sunglasses" },
                { icon: "block", text: "No night-out or holiday photos — keep it professional" },
              ].map((g) => (
                <li key={g.text} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <Icon name={g.icon} size={20} className="mt-0.5 shrink-0 text-secondary" />
                  {g.text}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
              >
                <Icon name="photo_camera" size={20} /> Take a photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-3d-purple inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary"
              >
                <Icon name="upload" size={20} /> Upload a photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            {photo && (
              <button
                type="button"
                onClick={() => setView("review")}
                className="mt-3 text-sm font-bold text-secondary hover:underline"
              >
                Review current photo →
              </button>
            )}
          </div>

          <div className="hidden md:block">
            <IdBadge name={name} role={role} department={department} photoUrl={photo} />
            <p className="mt-2 text-center text-xs text-on-surface-variant">
              Your ID badge preview
            </p>
          </div>
        </div>
      )}

      {/* CAMERA */}
      {view === "camera" && (
        <div className="flex flex-col items-center">
          <div className="relative overflow-hidden rounded-xl bg-black" style={{ width: 320, maxWidth: "100%" }}>
            <video
              ref={videoRef}
              playsInline
              muted
              className="block w-full"
              style={{ transform: "scaleX(-1)", aspectRatio: "4/5", objectFit: "cover" }}
            />
            {/* Passport framing guide */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-[12%] h-[64%] w-[58%] -translate-x-1/2 rounded-[50%] border-[3px] border-dashed border-white/80" />
              <p className="absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-white drop-shadow">
                Fit your face in the oval, with space above your head
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setView("intro");
              }}
              className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capture}
              className="btn-3d inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-on-secondary"
            >
              <Icon name="camera" size={20} fill /> Capture
            </button>
          </div>
        </div>
      )}

      {/* ADJUST (crop / position) */}
      {view === "adjust" && source && (
        <ImageCropper
          src={source}
          onCancel={() => setView("intro")}
          onCropped={(data) => {
            setPhoto(data);
            setView("review");
          }}
        />
      )}

      {/* REVIEW */}
      {view === "review" && photo && (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="overflow-hidden rounded-xl border-2 border-outline-variant/40" style={{ width: 200 }}>
              <img src={photo} alt="Your photo" className="block w-full" style={{ aspectRatio: "4/5", objectFit: "cover" }} />
            </div>
            <IdBadge
              name={nameOnBadge || name}
              role={[jobTitle || role, pronouns].filter(Boolean).join(" · ")}
              department={department}
              photoUrl={photo}
            />
          </div>

          <div>
            {saved ? (
              <div className="flex h-full flex-col items-start justify-center gap-3 rounded-xl bg-success-green/10 p-5">
                <Icon name="check_circle" className="text-success-green" size={36} fill />
                <p className="text-lg font-black text-[#1b7a44]">Photo saved!</p>
                <p className="text-on-surface-variant">
                  It&rsquo;s now on your profile and ID badge, and synced for your
                  staff record. You can change it any time from this step.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-1 text-sm font-bold text-secondary hover:underline"
                >
                  Choose a different photo
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-black text-on-surface">
                  Your ID badge details
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Check these are right — they&rsquo;ll be printed on your badge.
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <label className="block text-sm font-bold text-on-surface">
                    Name as it should appear on your badge
                    <input
                      value={nameOnBadge}
                      onChange={(e) => setNameOnBadge(e.target.value)}
                      className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-bold text-on-surface">
                      Pronouns
                      <select
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
                      >
                        <option value="">Prefer not to say</option>
                        <option>She / Her</option>
                        <option>He / Him</option>
                        <option>They / Them</option>
                        <option>She / They</option>
                        <option>He / They</option>
                      </select>
                    </label>
                    <label className="block text-sm font-bold text-on-surface">
                      Job title
                      <input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
                      />
                    </label>
                  </div>
                  {offices.length > 0 && (
                    <label className="block text-sm font-bold text-on-surface">
                      Nearest office (where you&rsquo;ll collect your badge)
                      <select
                        value={office}
                        onChange={(e) => setOffice(e.target.value)}
                        className="field-focus mt-1 w-full rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-normal"
                      >
                        <option value="">Select your nearest office…</option>
                        {offices.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <h2 className="mt-5 text-lg font-black text-on-surface">
                  Quick check before we save
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {CHECKS.map((c, i) => (
                    <label
                      key={c}
                      className="flex items-start gap-3 rounded-lg bg-surface-container-low px-3 py-2.5 text-sm font-medium text-on-surface"
                    >
                      <input
                        type="checkbox"
                        checked={checks[i]}
                        onChange={(e) =>
                          setChecks((cs) => cs.map((v, j) => (j === i ? e.target.checked : v)))
                        }
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[#b30069]"
                      />
                      {c}
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container"
                  >
                    <Icon name="refresh" size={18} className="mr-1 align-middle" />
                    Retake / choose another
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={!allChecked || saving}
                    className={clsx(
                      "btn-3d inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-on-secondary",
                      allChecked ? "bg-secondary" : "bg-secondary/50",
                    )}
                  >
                    <Icon name="check" size={20} /> {saving ? "Saving…" : "Use this photo"}
                  </button>
                </div>
                {!allChecked && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Tick all four to confirm your photo meets the guidelines.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
