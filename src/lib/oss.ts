/**
 * Alibaba Cloud OSS storage — uses raw REST API (no ali-oss SDK dependency).
 * In serverless environments (Alibaba FC), filesystem is read-only,
 * so we use OSS for file storage instead of local disk.
 *
 * If OSS env vars are NOT set, the app falls back to local filesystem
 * (for local development only).
 */

const hasOssConfig = !!(
  process.env.OSS_REGION &&
  process.env.OSS_ACCESS_KEY_ID &&
  process.env.OSS_ACCESS_KEY_SECRET &&
  process.env.OSS_BUCKET &&
  // Ensure these are real values, not placeholder text
  !process.env.OSS_ACCESS_KEY_ID.startsWith("your_") &&
  !process.env.OSS_ACCESS_KEY_SECRET.startsWith("your_") &&
  !process.env.OSS_BUCKET.startsWith("your_")
);

export const OSS_PUBLIC_BASE =
  process.env.OSS_PUBLIC_BASE ||
  (process.env.OSS_BUCKET && process.env.OSS_REGION
    ? `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`
    : "");

export const isOssEnabled = hasOssConfig;

// OSS endpoint: https://<bucket>.<region>.aliyuncs.com
function getOssEndpoint(): string {
  const bucket = process.env.OSS_BUCKET!;
  const region = process.env.OSS_REGION!;
  return `https://${bucket}.${region}.aliyuncs.com`;
}

/**
 * Create OSS authorization signature (v1 — simple approach).
 * Uses HMAC-SHA1 with AccessKeySecret.
 */
async function createOssSignature(
  method: string,
  contentType: string,
  date: string,
  resource: string,
): Promise<string> {
  const crypto = await import("crypto");
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET!;
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${resource}`;
  const signature = crypto.createHmac("sha1", accessKeySecret).update(stringToSign).digest("base64");
  return signature;
}

/**
 * Upload a file buffer to OSS using PUT request.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToOss(key: string, buffer: Buffer, mimeType?: string): Promise<string> {
  if (!hasOssConfig) {
    throw new Error("OSS is not configured. Set OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET env vars.");
  }

  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!;
  const endpoint = getOssEndpoint();
  const resource = `/${process.env.OSS_BUCKET}/${key}`;
  const date = new Date().toUTCString();
  const contentType = mimeType || "application/octet-stream";

  const signature = await createOssSignature("PUT", contentType, date, resource);
  const url = `${endpoint}/${key}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Date": date,
      "Authorization": `OSS ${accessKeyId}:${signature}`,
      "x-oss-object-acl": "public-read",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OSS upload failed: ${response.status} ${errText}`);
  }

  return `${OSS_PUBLIC_BASE}/${key}`;
}

/**
 * Delete a file from OSS by its URL.
 */
export async function deleteFromOss(url: string): Promise<void> {
  if (!hasOssConfig) return;
  if (!url.startsWith(OSS_PUBLIC_BASE)) return;

  const accessKeyId = process.env.OSS_ACCESS_KEY_ID!;
  const endpoint = getOssEndpoint();
  const key = url.substring(OSS_PUBLIC_BASE.length + 1);
  const resource = `/${process.env.OSS_BUCKET}/${key}`;
  const date = new Date().toUTCString();

  const signature = await createOssSignature("DELETE", "", date, resource);
  const deleteUrl = `${endpoint}/${key}`;

  try {
    await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Date": date,
        "Authorization": `OSS ${accessKeyId}:${signature}`,
      },
    });
  } catch (e) {
    console.error("OSS delete error:", e);
  }
}

/**
 * Resolve a media URL for display.
 */
export function resolveMediaUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return url;
}
