import { isSupabaseConfigured, supabaseUrl } from "./config";

/** Storage bucket and per-user folder that starter photos are uploaded to. */
export const PHOTO_BUCKET = "media";
export const profilePhotoFolder = (userId: string) => `avatars/${userId}`;

const DATA_PHOTO = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;

/**
 * True only for a photo this user uploaded through uploadProfilePhotoAction:
 *  - connected mode: our Supabase Storage public URL under avatars/<userId>/
 *  - demo mode: an inline raster image data URL (nothing leaves the server)
 * Anything else (an outside tracking pixel, someone else's photo) is refused.
 */
export function isOwnProfilePhotoUrl(url: string, userId: string): boolean {
  if (!isSupabaseConfigured) return DATA_PHOTO.test(url);
  try {
    const u = new URL(url);
    const base = new URL(supabaseUrl);
    const prefix = `/storage/v1/object/public/${PHOTO_BUCKET}/${profilePhotoFolder(userId)}/`;
    return (
      u.protocol === base.protocol &&
      u.host === base.host &&
      u.pathname.startsWith(prefix) &&
      !u.pathname.slice(prefix.length).includes("/") &&
      !u.search &&
      !u.hash
    );
  } catch {
    return false;
  }
}
