/**
 * Site configuration — reads from environment variable.
 * All URLs across the project should use SITE_URL instead of hardcoding.
 *
 * NOTE: SITE_URL defaults to the production custom domain.
 * Domain production: https://portofoliomaulanaihsan.my.id
 * Set NEXT_PUBLIC_SITE_URL di Vercel env var untuk override (mis. preview/staging).
 *
 * FIX (2026-08-26): Untuk server-side dynamic URL resolution (sitemap, robots,
 * RSS, metadata), pakai `getBaseUrl()` dari `@/lib/server-site-config`.
 * Jangan import `getBaseUrl()` di Client Component — file ini bisa di-import
 * di client (untuk SITE_URL constant), tapi getBaseUrl() butuh `next/headers`
 * yang server-only.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://portofoliomaulanaihsan.my.id";

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
