/**
 * Image → WebP auto-conversion utility.
 *
 * WHY: Kuota "Cached Egress" Supabase free plan (5GB/bulan) terlampaui karena
 * gambar JPG/PNG full-resolution (hingga 12MB per foto) dilayani langsung ke
 * pengunjung tanpa optimasi. WebP memotong ukuran 60-90% dengan kualitas
 * visual yang tetap bagus untuk web.
 *
 * Design decisions:
 * - Kualitas 82: sweet spot WebP — artifact compression praktis tak terlihat
 *   di layar, tapi ukuran jauh lebih kecil dari JPEG quality apapun.
 * - Max dimensi 2560px (sisi terpanjang): cukup untuk layar 1440p/4K-ish dan
 *   lightbox fullscreen; mencegah foto 6000px (12MB) dilayani utuh.
 *   Tanpa enlargemen: gambar kecil tetap ukuran aslinya.
 * - rotate(): hormati orientasi EXIF (foto HP sering landscape EXIF).
 * - Alpha PNG dipertahankan (WebP mendukung transparansi).
 * - GIF/SVG dilewati: GIF bisa animated, SVG adalah vector (tidak boleh
 *   dirasterisasi).
 */

import sharp from "sharp";

/** Ekstensi yang layak dikonversi ke WebP. */
const CONVERTIBLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const CONVERTIBLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

/** Kualitas WebP (0-100). 82 = visual lossless untuk penggunaan web. */
const WEBP_QUALITY = 82;

/**
 * Batas dimensi sisi terpanjang (px). 2560 cukup untuk seluruh use-case
 * web portfolio (hero, lightbox fullscreen) sambil memotong ukuran file foto
 * kamera full-res secara dramatis.
 */
const WEBP_MAX_DIMENSION = 2560;

/** File di bawah ukuran ini (bytes) dibiarkan apa adanya. */
const MIN_SIZE_TO_CONVERT = 20 * 1024; // 20KB

export interface WebpConvertResult {
  buffer: Buffer;
  width: number;
  height: number;
}

/**
 * Apakah file ini harus dikonversi ke WebP?
 * Berdasarkan ekstensi ATAU mime type (konservatif: keduanya harus bukan
 * gif/svg/webp, salah satu menandakan jpg/png).
 */
export function shouldConvertToWebp(
  filename: string,
  mimeType?: string | null,
  fileSize?: number,
): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const extOk = CONVERTIBLE_EXTENSIONS.has(ext);
  const mimeOk = mimeType ? CONVERTIBLE_MIME_TYPES.has(mimeType.toLowerCase()) : false;

  // Butuh sinyal dari ext ATAU mime bahwa ini jpg/png…
  if (!extOk && !mimeOk) return false;
  // …tapi jika sinyal yang SATU menyebut gif/svg/webp, jangan konversi.
  const forbidden =
    ext === ".gif" ||
    ext === ".svg" ||
    ext === ".webp" ||
    (mimeType ? ["image/gif", "image/svg+xml", "image/webp"].includes(mimeType.toLowerCase()) : false);
  if (forbidden) return false;

  // File mungil (icon, spacer) — konversi tidak sebanding dengan biaya CPU.
  if (fileSize != null && fileSize < MIN_SIZE_TO_CONVERT) return false;

  return true;
}

/**
 * Konversi buffer gambar (JPG/PNG) ke WebP.
 * Return buffer baru + dimensi hasil.
 */
export async function convertImageToWebp(
  input: Buffer,
): Promise<WebpConvertResult> {
  const pipeline = sharp(input)
    // rotate() tanpa argumen = auto-orient berdasarkan EXIF
    .rotate()
    .resize(WEBP_MAX_DIMENSION, WEBP_MAX_DIMENSION, {
      // Jangan perbesar gambar yang sudah di bawah limit
      withoutEnlargement: true,
      // Jangan distorsi: fit di dalam kotak, pertahankan rasio
      fit: "inside",
    })
    .webp({
      quality: WEBP_QUALITY,
      // effort 4 = default sharp; balance encode speed vs kompresi
      effort: 4,
    });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

/**
 * Ganti ekstensi filename menjadi .webp.
 * Contoh: "1783123_foto.JPG" → "1783123_foto.webp"
 */
export function toWebpFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf("."));
  return `${filename.slice(0, filename.length - ext.length)}.webp`;
}

/**
 * Ganti ekstensi di dalam sebuah URL/path (aman untuk URL Supabase
 * maupun path lokal "/uploads/...").
 */
export function toWebpUrl(url: string): string {
  const queryIdx = url.indexOf("?");
  const base = queryIdx === -1 ? url : url.slice(0, queryIdx);
  const rest = queryIdx === -1 ? "" : url.slice(queryIdx);
  const dotIdx = base.lastIndexOf(".");
  if (dotIdx === -1) return url;
  return `${base.slice(0, dotIdx)}.webp${rest}`;
}
