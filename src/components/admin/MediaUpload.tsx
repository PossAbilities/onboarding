"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { uploadMediaAction } from "@/app/actions/media";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { clsx } from "@/lib/cn";

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB (direct upload)

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-60);
}

/**
 * Admin media picker: upload a photo/video (or paste a URL) with a live preview.
 * Uploads go to Supabase Storage when configured, otherwise an in-preview data URL.
 */
export function MediaUpload({
  value,
  onChange,
  accept = "image/*",
  kind = "image",
  shape = "wide",
  label,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  kind?: "image" | "video";
  shape?: "wide" | "square" | "avatar";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  const pick = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      if (file.size > MAX_BYTES) {
        throw new Error("That file is too large (max 200 MB).");
      }
      if (isSupabaseConfigured) {
        // Upload straight from the browser to Supabase Storage — no serverless
        // payload limit, so large images and videos work.
        const supabase = createSupabaseBrowserClient();
        const path = `uploads/${Date.now()}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        onChange(data.publicUrl);
      } else {
        // Demo mode — small files become an in-preview data URL via the action.
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadMediaAction(fd);
        if ("url" in res) onChange(res.url);
        else throw new Error(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const frame =
    shape === "avatar"
      ? "h-24 w-24 rounded-full"
      : shape === "square"
        ? "aspect-square w-full max-w-[200px] rounded-lg"
        : "aspect-video w-full rounded-lg";

  return (
    <div>
      {label && (
        <p className="mb-1 text-sm font-bold text-on-surface">{label}</p>
      )}
      <div className="flex flex-wrap items-start gap-4">
        {/* Preview */}
        <div
          className={clsx(
            "relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant bg-surface-container-low",
            frame,
          )}
        >
          {value ? (
            kind === "video" ? (
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <Icon
              name={kind === "video" ? "movie" : "image"}
              size={28}
              className="text-outline"
            />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/70 text-xs font-bold text-on-surface">
              Uploading…
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-sm font-bold text-on-primary"
          >
            <Icon name="upload" size={18} /> Upload {kind}
          </button>
          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowUrl((s) => !s)}
              className="text-secondary hover:underline"
            >
              {showUrl ? "Hide URL" : "or paste a URL"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-error hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {showUrl && (
            <input
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value || null)}
              placeholder="https://…"
              className="field-focus w-64 rounded-md border-2 border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm"
            />
          )}
          {error && (
            <p className="flex items-center gap-1 text-xs font-bold text-error">
              <Icon name="error" size={14} /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
