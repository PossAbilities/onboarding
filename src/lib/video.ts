/** Detect how a video URL should be played. Client-safe. */

export type VideoKind = "vimeo" | "youtube" | "file" | "none";

export interface ParsedVideo {
  kind: VideoKind;
  embedUrl?: string;
}

export function parseVideo(url: string | null | undefined): ParsedVideo {
  if (!url) return { kind: "none" };
  const u = url.trim();

  let m = u.match(/vimeo\.com\/(?:video\/|channels\/[\w]+\/|groups\/[\w]+\/videos\/)?(\d+)/i);
  if (m) {
    return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${m[1]}` };
  }
  if (/player\.vimeo\.com\/video\/\d+/i.test(u)) {
    return { kind: "vimeo", embedUrl: u };
  }

  m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (m) {
    return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${m[1]}` };
  }

  if (/^data:video\//i.test(u) || /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(u)) {
    return { kind: "file" };
  }
  return { kind: "none" };
}

export const isEmbedVideo = (kind: VideoKind) =>
  kind === "vimeo" || kind === "youtube";

/** True if the URL looks like a playable video (file or embed). */
export function looksLikeVideo(url: string | null | undefined): boolean {
  return parseVideo(url).kind !== "none";
}
