"use server";

import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const BUCKET = "media";

export type UploadResult = { url: string } | { error: string };

/**
 * Upload an image/video from the admin dashboard.
 *  - Connected mode: stored in the Supabase Storage `media` bucket (auto-created,
 *    public) and a durable public URL is returned.
 *  - Demo mode: returned as a self-contained data URL (works immediately in the
 *    running preview; connect Supabase for durable hosting).
 */
export async function uploadMediaAction(
  formData: FormData,
): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is too large (max 12 MB). Try an optimised image." };
  }
  if (!/^(image|video)\//.test(file.type)) {
    return { error: "Only image or video files are allowed." };
  }

  if (!isSupabaseConfigured) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type};base64,${buffer.toString("base64")}` };
  }

  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const admin = createSupabaseAdminClient();

    // Ensure the public bucket exists (ignore "already exists").
    await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-").slice(-64);
    const path = `uploads/${Date.now()}-${safeName}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { error: error.message };

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}
