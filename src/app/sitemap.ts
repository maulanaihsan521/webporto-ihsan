import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSettings, isMarketEnabled } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";

/**
 * SITEMAP — Next.js App Router standard convention (src/app/sitemap.ts).
 * Otomatis di-serve di /sitemap.xml dengan Content-Type application/xml.
 *
 * MIGRASI (2026-09-20, Google Search Console "Couldn't fetch" fix):
 * Sebelumnya sitemap di-serve oleh route handler force-dynamic
 * (src/app/sitemap.xml/route.ts) yang query DB di SETIAP request.
 * Hasil di produksi: 1.5–5.3 detik per fetch (pooler Supabase
 * connection_limit=1 + 4 query paralel). Google Search Console
 * gagal fetch ("Tidak dapat mengambil peta situs", 0 pages found).
 *
 * Sekarang: ISR — sitemap di-generate sekali lalu di-serve dari cache
 * (milidetik), regenerasi tiap 1 jam supaya post/portfolio/certificate
 * baru tetap masuk otomatis. Ini juga cara resmi yang direkomendasikan
 * Next.js (bukan file statis public/sitemap.xml yang cepat basi).
 */
export const revalidate = 3600;

/**
 * Base URL deterministik — TANPA headers() supaya route tetap cacheable
 * (headers() memaksa dynamic rendering dan menghapus ISR).
 * Produksi selalu domain utama; dev localhost.
 * Konsisten dengan SITE_URL di @/lib/site-config (anti host-spoofing).
 */
function getSitemapBaseUrl(): string {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : SITE_URL;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSitemapBaseUrl();

  // Toggle market off → halaman fitur /financial-market tidak di-submit
  // (404 untuk publik). Artikel market kini = post blog (kategori Financial
  // Market, hasil migrasi) → URL-nya otomatis masuk sitemap via `posts`
  // (/blog/[slug]) dan TETAP di-submit walau fitur market off (artikel hidup).
  let marketEnabled = false;
  let posts: { slug: string; updatedAt: Date }[] = [];
  let portfolios: { slug: string; updatedAt: Date }[] = [];
  let certificates: { slug: string; updatedAt: Date }[] = [];
  let galleries: { slug: string; updatedAt: Date }[] = [];

  // Resilien saat build/regenerasi: kalau DB unreachable (mis. maintenance
  // Supabase saat deploy), sitemap tetap ter-serve dengan halaman statis —
  // build Vercel tidak gagal, Google tidak kehilangan sitemap.
  try {
    marketEnabled = isMarketEnabled(await getSettings());
    [posts, portfolios, certificates, galleries] = await Promise.all([
      db.post.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      db.portfolio.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      db.certificate.findMany({ select: { slug: true, updatedAt: true } }),
      db.gallery.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch (e) {
    console.error("[sitemap] DB unreachable, serving static pages only:", e);
  }

  // lastmod untuk halaman statis: pakai tanggal modifikasi konten terbaru
  // (BUKAN waktu request/build — lastmod yang berubah setiap fetch membuat
  // Google tidak percaya lastmod seluruh sitemap dan mengabaikannya).
  const contentLastmod =
    [
      ...posts.map((p) => p.updatedAt),
      ...portfolios.map((p) => p.updatedAt),
      ...certificates.map((c) => c.updatedAt),
      ...galleries.map((g) => g.updatedAt),
    ]
      .sort((a, b) => b.getTime() - a.getTime())[0]
      ?.toISOString() ?? undefined;

  // Primary navigation pages (candidates for Google sitelinks).
  // Ordered by importance — homepage first, then the most-visited nav targets
  // (About, Portfolio, Services, Contact are the typical 4 sitelinks Google picks).
  // CATATAN: /search & /sitemap TIDAK dimasukkan — keduanya noindex
  // (Google Search Console akan error "Submitted URL marked 'noindex'"
  // jika URL noindex di-submit lewat sitemap).
  const staticPages: {
    path: string;
    changefreq: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "", changefreq: "daily", priority: 1.0 },
    { path: "about", changefreq: "monthly", priority: 0.9 },
    { path: "portfolio", changefreq: "weekly", priority: 0.9 },
    { path: "services", changefreq: "monthly", priority: 0.9 },
    { path: "contact", changefreq: "monthly", priority: 0.9 },
    { path: "skills", changefreq: "monthly", priority: 0.8 },
    ...(marketEnabled
      ? [{ path: "financial-market", changefreq: "weekly" as const, priority: 0.8 }]
      : []),
    { path: "blog", changefreq: "weekly", priority: 0.8 },
    { path: "gallery", changefreq: "weekly", priority: 0.7 },
    { path: "certificates", changefreq: "monthly", priority: 0.7 },
    { path: "experience", changefreq: "monthly", priority: 0.7 },
    { path: "education", changefreq: "monthly", priority: 0.7 },
    { path: "testimonials", changefreq: "monthly", priority: 0.7 },
    { path: "faq", changefreq: "monthly", priority: 0.6 },
    { path: "privacy-policy", changefreq: "yearly", priority: 0.3 },
    { path: "terms", changefreq: "yearly", priority: 0.3 },
  ];

  return [
    ...staticPages.map((p) => ({
      url: `${baseUrl}/${p.path}`,
      lastModified: contentLastmod,
      changeFrequency: p.changefreq,
      priority: p.priority,
    })),
    ...posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt.toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...portfolios.map((p) => ({
      url: `${baseUrl}/portfolio/${p.slug}`,
      lastModified: p.updatedAt.toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...certificates.map((c) => ({
      url: `${baseUrl}/certificates/${c.slug}`,
      lastModified: c.updatedAt.toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
