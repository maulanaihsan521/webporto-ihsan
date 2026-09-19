/**
 * Supabase Storage — uses the Storage REST API (no extra SDK dependency).
 *
 * Files uploaded here are stored permanently in a Supabase Storage bucket,
 * so they survive re-deploys (unlike /tmp or public/uploads on serverless).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL   e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  (secret — server only, never expose to client)
 *   SUPABASE_STORAGE_BUCKET    bucket name (default: "media")
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

export const isSupabaseStorageEnabled = !!(
  SUPABASE_URL &&
  SERVICE_ROLE_KEY &&
  !SERVICE_ROLE_KEY.startsWith("your_")
);

/** Public URL for an object in the bucket. */
export function supabasePublicUrl(key: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
}

/** True if the given URL points at this project's Supabase Storage bucket. */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!SUPABASE_URL) return false;
  return url.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`);
}

/**
 * Ensure the storage bucket exists (public). Safe to call repeatedly —
 * a 409 "already exists" is treated as success.
 */
export async function ensureBucket(): Promise<void> {
  if (!isSupabaseStorageEnabled) return;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      id: SUPABASE_BUCKET,
      name: SUPABASE_BUCKET,
      public: true,
      file_size_limit: 52428800, // 50MB
    }),
  });
  if (!res.ok && res.status !== 409) {
    const txt = await res.text();
    // Bucket may already exist with a different message; only throw on real errors
    if (!txt.includes("already exists") && !txt.includes("Duplicate")) {
      throw new Error(`Supabase bucket create failed: ${res.status} ${txt}`);
    }
  }
}

/**
 * Upload a buffer to Supabase Storage. Returns the public URL.
 */
export async function uploadToSupabase(
  key: string,
  buffer: Buffer,
  mimeType?: string,
): Promise<string> {
  if (!isSupabaseStorageEnabled) {
    throw new Error("Supabase Storage is not configured.");
  }
  await ensureBucket();

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": mimeType || "application/octet-stream",
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase upload failed: ${res.status} ${txt}`);
  }

  return supabasePublicUrl(key);
}

/**
 * Delete an object from Supabase Storage given its public URL.
 */
export async function deleteFromSupabase(url: string): Promise<void> {
  if (!isSupabaseStorageEnabled) return;
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not a Supabase Storage URL
  const key = url.substring(idx + marker.length);

  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });
  } catch (e) {
    console.error("Supabase delete error:", e);
  }
}
