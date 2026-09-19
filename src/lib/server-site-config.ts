/**
 * Server-only site config — async helpers untuk URL resolution.
 *
 * File ini TIDAK BOLEH di-import di Client Component karena pakai `next/headers`
 * yang server-only. Untuk client-side, pakai `SITE_URL` constant dari
 * `@/lib/site-config`.
 *
 * FIX (2026-09-19, Task 14): URL publik situs (canonical, og:url, JSON-LD,
 * sitemap.xml, robots.txt, rss.xml) SELALU memakai domain produksi
 * https://portofoliomaulanaihsan.my.id — BUKAN domain dari incoming request.
 *
 * WHY (kasus nyata yang baru terjadi): env var NEXT_PUBLIC_SITE_URL di Vercel
 * masih berisi domain LAMA (portofoliomaulanaihsan.vercel.app). Versi lama
 * code menurunkan allowlist host dari env build-time itu, sehingga domain
 * utama .my.id TIDAK PERNAH dikenali sebagai host yang sah → getBaseUrl()
 * selalu jatuh ke fallback env basi → seluruh canonical/og/JSON-LD/sitemap/
 * robots/RSS menunjuk domain lama vercel.app. Google mengindeks domain lama,
 * sitelinks & site-name di SERP jadi kacau.
 *
 * Desain baru (deterministik + anti host-spoofing):
 * - Dev lokal (localhost / 127.0.0.1) → http://<host> — agar og-image dan
 *   preview meta di dev tetap self-consistent.
 * - Selain itu (produksi .my.id, www, preview *.vercel.app, gateway sandbox)
 *   → SELALU https://portofoliomaulanaihsan.my.id.
 * Akibatnya Host/x-forwarded-host palsu dari attacker tidak akan pernah
 * masuk ke URL publik apa pun (SEO poisoning jadi mustahil lewat jalur ini).
 */
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site-config";

function isDevHost(host: string): boolean {
  const h = host.toLowerCase();
  return h.startsWith("localhost") || h.startsWith("127.0.0.1");
}

/**
 * Ambil host request yang bersih: x-forwarded-host duluan (reverse proxy /
 * Vercel), lalu host. x-forwarded-host bisa berisi daftar comma-separated —
 * ambil entry pertama saja.
 */
function requestHost(h: Headers): string {
  const raw = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  return raw.toLowerCase();
}

/**
 * Origin URL untuk SEMUA URL publik (canonical, og:url, JSON-LD, sitemap,
 * robots, RSS). Produksi SELALU domain utama; hanya dev lokal yang memakai
 * host request. Async karena membaca headers().
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = requestHost(h);
    if (host && isDevHost(host)) return `http://${host}`;
  } catch {
    // headers() tidak tersedia (build time / static generation) → produksi
  }
  return SITE_URL;
}

/**
 * Varian sync untuk helper page-level yang sudah memegang objek Headers
 * (buildUrl / buildXxxUrl di halaman detail & list).
 * Aturan sama dengan getBaseUrl(): dev → host lokal; selain itu → domain produksi.
 */
export function siteOriginFromHeaders(h: Headers): string {
  const host = requestHost(h);
  if (host && isDevHost(host)) return `http://${host}`;
  return SITE_URL;
}
