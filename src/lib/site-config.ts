/**
 * Site configuration — konfigurasi identitas situs.
 * Domain production: https://portofoliomaulanaihsan.my.id
 *
 * FIX (2026-09-19, Task 14): SITE_URL kini HARDCODE dan TIDAK lagi membaca
 * env var NEXT_PUBLIC_SITE_URL. Env var tersebut di Vercel masih ter-set ke
 * domain LAMA (portofoliomaulanaihsan.vercel.app) dari setup awal project,
 * dan pernah membocorkan domain lama ke canonical/og:url/sitemap/robots/RSS
 * — Google pun mengindeks domain lama, bukan domain utama .my.id.
 *
 * Domain produksi sekarang adalah source-of-truth di kode:
 * ganti domain = edit SATU baris di bawah → commit → push (auto-deploy).
 * Env var basi yang masih ter-set di Vercel tidak berpengaruh apa pun.
 */
export const SITE_URL = "https://portofoliomaulanaihsan.my.id";

export const SITE_CONFIG = {
  /**
   * ⚠️ PROPERTY INI HANYA UNTUK CLIENT-SIDE / BUILD-TIME.
   * Untuk server-side (sitemap, robots, rss, metadata), pakai
   * `await getBaseUrl()` dari `@/lib/server-site-config`.
   */
  url: SITE_URL,
  name: "Maulana Ihsan Rohim",
  /**
   * Alternate name variations — used in WebSite & Person JSON-LD `alternateName`.
   * These are natural short forms of the person's name (not website names).
   * Google uses these to disambiguate entity identity.
   */
  alternateName: [
    "Maulana Ihsan",
    "Ihsan Rohim",
  ] as readonly string[],
  tagline: "Digital Marketing & Financial Market Analyst",
  /** Primary homepage <title> — used as the default metadata title */
  fullTitle: "Maulana Ihsan Rohim — Digital Marketing & Financial Market",
  description:
    "Portfolio profesional Maulana Ihsan Rohim — Freelancer Digital Marketing, Social Media Specialist, Photo & Video Production, Video Editor, dan Financial Market.",
  /** Default OG image — must be an absolute URL for some crawlers */
  ogImage: `${SITE_URL}/uploads/home-preview.webp`,
  locale: "id_ID",
  author: "Maulana Ihsan Rohim",
  twitter: "@maulanaihsan",
} as const;
