/**
 * Server-only site config — async helpers untuk dynamic URL resolution.
 *
 * File ini TIDAK BOLEH di-import di Client Component karena pakai `next/headers`
 * yang server-only. Untuk client-side, pakai `SITE_URL` constant dari
 * `@/lib/site-config` (yang di-inject saat build time).
 *
 * FIX (2026-08-26): Karena NEXT_PUBLIC_SITE_URL di-embed sebagai string literal
 * saat build time oleh Next.js, perubahan env var butuh rebuild+redeploy.
 * getBaseUrl() baca headers() saat RUNTIME sehingga sitemap/robots/RSS/metadata
 * auto-pakai domain dari incoming request — tidak terikat env var lagi.
 *
 * Priority:
 * 1. x-forwarded-host + x-forwarded-proto (reverse proxy / Vercel / preview gateway)
 * 2. host header (direct request)
 * 3. NEXT_PUBLIC_SITE_URL env var (build-time fallback)
 * 4. https://portofoliomaulanaihsan.my.id (last resort default)
 */
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site-config";

/**
 * Async helper untuk dapatkan base URL dari incoming request.
 *
 * Dipakai di: sitemap.xml, robots.ts, rss.xml, layout generateMetadata,
 * blog/portfolio/certificates detail pages (buildUrl function).
 *
 * WHY: Karena NEXT_PUBLIC_SITE_URL di-embed sebagai string literal saat build time
 * oleh Next.js, perubahan env var butuh rebuild+redeploy. getBaseUrl() baca
 * runtime headers, jadi otomatis pakai domain yang user akses (mis. production
 * pakai portofoliomaulanaihsan.my.id, preview pakai *.vercel.app, dev pakai
 * localhost:3000) — tidak ada redeploy kalau user ganti domain di Vercel.
 */
/**
 * SECURITY (Task 12): allowlist hostname — Host/x-forwarded-host bisa DIBUAT
 * oleh penyerang (request dgn Host: evil.com). Tanpa allowlist, canonical URL,
 * og:url, sitemap, dan RSS bisa menunjuk ke domain penyerang (SEO poisoning).
 * Host tak dikenal → fallback ke SITE_URL (domain resmi).
 */
function isKnownHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  // Dev lokal
  if (h === "localhost" || h.startsWith("localhost:") || h.startsWith("127.0.0.1")) return true;
  // Domain produksi resmi (+ www)
  const siteHost = (() => {
    try {
      return new URL(SITE_URL).hostname.toLowerCase();
    } catch {
      return "portofoliomaulanaihsan.my.id";
    }
  })();
  if (h === siteHost || h === "www." + siteHost) return true;
  // Preview deployment milik proyek ini di Vercel
  if (/^portofoliomaulanaihsan[a-z0-9-]*\.vercel\.app$/.test(h)) return true;
  // Preview gateway sandbox (hanya untuk URL generation — bukan kepercayaan CSRF)
  if (/\.space-z\.ai$/.test(h) || h === "space-z.ai") return true;
  return false;
}

export async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    // Vercel / reverse proxy kirim x-forwarded-host
    const xfh = h.get("x-forwarded-host");
    if (xfh && isKnownHost(xfh)) {
      const xfp = h.get("x-forwarded-proto") || "https";
      return `${xfp}://${xfh}`;
    }
    // Direct request kirim host header
    const host = h.get("host");
    if (host && isKnownHost(host)) {
      // Deteksi protocol dari x-forwarded-proto (Vercel kirim "https"), atau
      // default "http" untuk dev lokal (Next.js dev server tidak set x-forwarded-proto)
      const xfp = h.get("x-forwarded-proto");
      if (xfp) return `${xfp}://${host}`;
      // Dev lokal: host = "localhost:3000", pakai http
      if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
        return `http://${host}`;
      }
      // Production direct request tanpa x-forwarded-proto: assume https
      return `https://${host}`;
    }
  } catch {
    // headers() tidak tersedia (build time / static generation) → fallback
  }
  // Fallback: env var atau default production domain
  return SITE_URL;
}
