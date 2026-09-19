/**
 * OG Image helper — pusat logika og:image untuk seluruh situs.
 *
 * MASALAH YANG DIPERBAIKI (Task 22):
 * 1. og:image fallback sebelumnya absolut dari NEXT_PUBLIC_SITE_URL (domain lama
 *    vercel.app yang menjawab 308 redirect). WhatsApp/Facebook TIDAK mengikuti
 *    redirect og:image → preview gambar gagal muncul saat link dibagikan.
 *    SOLUSI: semua og:image berupa RELATIVE path — Next.js me-resolve-nya
 *    terhadap `metadataBase` (root layout, diambil dari request headers runtime)
 *    sehingga selalu domain yang benar tanpa redirect.
 * 2. Cover artikel via Supabase ~2MB PNG — melebihi batas preview WhatsApp
 *    (~300KB). SOLUSI: cover Supabase diarahkan ke proxy /api/og-image yang
 *    me-resize + kompres jadi JPG < 300KB.
 *
 * FIX 2026-09-17 (preview OG tidak muncul di sosial media):
 * Path LOKAL (mis. "/uploads/banner.webp") sebelumnya disajikan mentah —
 * file .webp terkirim sebagai image/webp. WhatsApp TIDAK merender preview
 * WebP (hanya JPEG/PNG/GIF) → link halaman portfolio/about/contact (semua
 * yang og:image-nya aset lokal) tidak memunculkan gambar saat dibagikan.
 * SOLUSI: path lokal kini juga melewati proxy `/api/og-image?p=...` yang
 * mengonversi ke JPEG 1200x630 < 300KB — termasuk fallback default situs.
 */

export const DEFAULT_OG_IMAGE = "/uploads/og-default.webp";
/** URL og:image default siap-meta (via proxy, selalu JPEG). */
export const DEFAULT_OG_IMAGE_URL = `/api/og-image?p=${encodeURIComponent(DEFAULT_OG_IMAGE)}`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const SUPABASE_HOST_SUFFIXES = [".supabase.co", ".supabase.in"];

/**
 * Bentuk URL proxy untuk path aset lokal (di bawah /uploads).
 * Proxy membaca file, resize 1200x630, dan menyajikan JPEG < 300KB.
 */
function localOgProxyPath(path: string): string {
  return `/api/og-image?p=${encodeURIComponent(path)}`;
}

/**
 * URL og:image untuk metadata Next.js (openGraph.images / twitter.images).
 * Hasil SELALU berupa relative path (kecuali URL eksternal non-Supabase)
 * supaya di-resolve metadataBase → domain runtime yang benar.
 *
 * - null/undefined/kosong → default og image situs (via proxy, JPEG)
 * - path lokal ("/uploads/..") → proxy terkompresi `/api/og-image?p=...`
 *   (FIX 2026-09-17: .webp lokal tidak dirender WhatsApp sebagai preview)
 * - URL Supabase → proxy terkompresi `/api/og-image?u=...` (JPG < 300KB)
 * - URL http(s) lain → apa adanya (mis. CDN eksternal milik sendiri)
 */
export function ogImageFor(src?: string | null): string {
  const value = (src ?? "").trim();
  if (!value) return DEFAULT_OG_IMAGE_URL;
  // Guard anti proxy ganda: nilai yang sudah berupa path proxy relatif
  // (mis. tersimpan di DB oleh admin) tidak di-proxy ulang — kalau tidak,
  // proxy mem-fetch dirinya sendiri dan mengonversi gambar dua kali.
  if (value.startsWith("/api/og-image")) return value;
  if (value.startsWith("/")) return localOgProxyPath(value);
  try {
    const u = new URL(value);
    if (SUPABASE_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s))) {
      return `/api/og-image?u=${encodeURIComponent(value)}`;
    }
    return value;
  } catch {
    return DEFAULT_OG_IMAGE_URL;
  }
}

/**
 * URL og:image ABSOLUTE — untuk JSON-LD (schema.org image) & RSS yang TIDAK
 * di-resolve metadataBase oleh Next.js. `baseUrl` boleh URL lengkap apa pun;
 * path "/" di src me-reset ke origin (perilaku standar `new URL`).
 */
export function absoluteOgImage(src: string | null | undefined, baseUrl: string): string {
  const value = (src ?? "").trim();
  if (!value) return new URL(DEFAULT_OG_IMAGE_URL, baseUrl).toString();
  if (value.startsWith("/")) return new URL(value, baseUrl).toString();
  return value;
}

/**
 * Normalisasi og:image dari ADMIN SEO SETTING (seo_og_image) — nilainya
 * bebas: URL Supabase, URL absolut domain lama, atau path relatif.
 * - kosong → default situs (via proxy)
 * - path relatif → proxy terkompresi (FIX 2026-09-17: konversi WebP → JPEG)
 * - URL Supabase → proxy terkompresi (WhatsApp < 300KB)
 * - URL absolut aset /uploads di host BERBEDA dari runtime (mis. domain lama
 *   vercel.app yang menjawab redirect 308) → ambil path-nya saja supaya
 *   resolve ke domain runtime
 * - URL absolut lain (CDN eksternal) → apa adanya
 */
export function adminOgImageFor(value: string | null | undefined, runtimeOrigin: string): string {
  const v = (value ?? "").trim();
  if (!v) return DEFAULT_OG_IMAGE_URL;
  if (v.startsWith("/")) return ogImageFor(v);
  try {
    const u = new URL(v);
    if (u.pathname.startsWith("/uploads/") && u.origin !== runtimeOrigin) {
      // Aset situs sendiri tapi dihosting di domain lain → pakai path relatif
      // (lalu lewat proxy konversi via ogImageFor)
      return ogImageFor(u.pathname);
    }
    return ogImageFor(v);
  } catch {
    return DEFAULT_OG_IMAGE_URL;
  }
}
