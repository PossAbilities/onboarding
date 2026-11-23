/**
 * URL safety helpers, shared by server actions (write-time validation) and
 * components (render-time guard). No server-only imports, so both can use it.
 *
 * Anything an admin or employee types into a URL field ends up as an `href` or
 * `src`. Only plain web links and site-relative paths are allowed there:
 * `javascript:`, `vbscript:`, `data:` (except raster images) and friends are
 * rejected, so a stored value can never run script when clicked.
 */

// Browsers ignore leading whitespace/control chars before the scheme, so strip
// them before checking (e.g. "\u0000 javascript:alert(1)").
function normalise(value: string): string {
  return value.replace(/^[\u0000- ]+/, "").trim();
}

/**
 * Data URLs produced by demo-mode uploads: raster images, video and PDF.
 * SVG and HTML are excluded because they can carry script.
 */
const DATA_MEDIA =
  /^data:(image\/(png|jpe?g|gif|webp|avif)|video\/[a-z0-9.+-]+|application\/pdf);base64,/i;

/**
 * True for https/http URLs, mailto:/tel: links and site-relative paths
 * ("/foo", not "//host"). With httpsOnly, only https URLs pass.
 */
export function isSafeLinkUrl(value: string, { httpsOnly = false } = {}): boolean {
  const v = normalise(value);
  if (!v) return false;
  const relative = v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\");
  if (relative) return !httpsOnly;
  try {
    const u = new URL(v);
    if (u.protocol === "https:") return true;
    if (httpsOnly) return false;
    return ["http:", "mailto:", "tel:"].includes(u.protocol);
  } catch {
    return false;
  }
}

/** Like isSafeLinkUrl, but also allows demo-mode `data:` media URLs (images, video, PDF). */
export function isSafeImageUrl(value: string): boolean {
  const v = normalise(value);
  return DATA_MEDIA.test(v) || isSafeLinkUrl(v);
}

/** Render-time guard: the URL if it is a safe link, otherwise `fallback`. */
export function safeHref(value: string | null | undefined, fallback = "#"): string {
  return value && isSafeLinkUrl(value) ? normalise(value) : fallback;
}

/** Render-time guard for image sources. */
export function safeImageSrc(value: string | null | undefined): string | undefined {
  return value && isSafeImageUrl(value) ? normalise(value) : undefined;
}

/** Schemes that must never appear in stored content, whatever the field. */
const DANGEROUS_SCHEME = /^(javascript|vbscript|livescript|data|file|blob):/i;

/**
 * Write-time check for admin-edited content (module blocks, collection items).
 * Walks every string in the object and returns the path of the first value
 * that looks like a dangerous URL, or null if everything is fine. Demo-mode
 * `data:` media uploads (images, video, PDF) are allowed.
 */
export function findUnsafeUrl(input: unknown, path = ""): string | null {
  if (typeof input === "string") {
    const v = normalise(input);
    if (DANGEROUS_SCHEME.test(v) && !DATA_MEDIA.test(v)) return path || "value";
    return null;
  }
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      const hit = findUnsafeUrl(input[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input)) {
      const hit = findUnsafeUrl(v, path ? `${path}.${k}` : k);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Stricter check for fields we know are links: anything ending in url/Url/href
 * must be a safe link (media fields may also be demo-mode data: uploads).
 */
export function findInvalidLinkField(input: Record<string, unknown>): string | null {
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== "string" || !v.trim()) continue;
    if (!/(url|href)$/i.test(k)) continue;
    // Media fields may also hold demo-mode data: uploads; plain links may not.
    const isMedia = /(photo|image|img|avatar|poster|video|media|file|pdf)/i.test(k);
    const ok = isMedia ? isSafeImageUrl(v) : isSafeLinkUrl(v);
    if (!ok) return k;
  }
  return null;
}

/** A drawn signature from the signature pad: an inline PNG, at most ~600 KB. */
export function isSignaturePng(value: string): boolean {
  return (
    value.length <= 800_000 && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}
