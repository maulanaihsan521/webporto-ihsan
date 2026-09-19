import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/server-site-config";

/**
 * VULN-006 FIX: Hapus path sensitif dari robots.txt
 *
 * Sebelumnya:
 *   disallow: ["/admin", "/api"]  ← BOCOR keberadaan admin & API
 *
 * Sekarang:
 *   Tidak membocorkan path internal apapun.
 *   Path admin (slug obscured, bukan /admin) & API sudah dilindungi auth + middleware,
 *   tidak perlu di-announce di robots.txt. Penyerang harus menebak-nebak.
 *
 * OG-IMAGE FIX: og:image situs melewati proxy /api/og-image (kompres gambar
 * Supabase supaya < 300KB). "Disallow: /api/" ikut memblokir URL tersebut
 * untuk crawler yang patuh robots.txt (Googlebot, Facebook) — padahal og:image
 * adalah satu-satunya endpoint /api yang justru HARUS bisa di-fetch crawler.
 * Solusi: "Allow: /api/og-image" (lebih spesifik, menang dari Disallow /api/
 * berdasarkan aturan longest-match). Endpoint ini read-only + whitelist host
 * Supabase saja (lihat route.ts), aman di-expose ke crawler.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  // Dynamic base URL dari incoming request headers (auto-detect domain)
  const siteUrl = await getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      // Allow /api/og-image HARUS di atas Disallow /api/ — crawler modern
      // (Google) memakai longest-match, tapi konsistensi urutan menjaga
      // kompatibilitas parser lama yang memakai aturan first-match.
      allow: ["/", "/api/og-image"],
      // JANGAN sebutkan /admin atau /api lain di sini!
      // Biarkan penyerang harus menebak-nebak.
      disallow: ["/api/"], // hanya /api/ (dengan trailing slash) untuk cegah indexing API responses
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
