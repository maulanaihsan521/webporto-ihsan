export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-site-config";
import { getSettings, isMarketEnabled } from "@/lib/settings";

export async function GET() {
  // Dynamic base URL dari incoming request headers (auto-detect domain).
  // Sebelumnya pakai SITE_URL yang di-inject saat build time, sehingga kalau
  // env var NEXT_PUBLIC_SITE_URL di Vercel tidak update, sitemap tetap pakai
  // domain lama. Sekarang baca runtime, akan pakai domain yang user akses.
  const baseUrl = await getBaseUrl();

  // Toggle market off → halaman fitur /financial-market tidak di-submit
  // (404 untuk publik). Artikel market kini = post blog (kategori Financial
  // Market, hasil migrasi) → URL-nya otomatis masuk sitemap via `posts`
  // (/blog/[slug]) dan TETAP di-submit walau fitur market off (artikel hidup).
  const marketEnabled = isMarketEnabled(await getSettings());

  const [posts, portfolios, certificates, galleries] = await Promise.all([
    db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.portfolio.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.certificate.findMany({ select: { slug: true, updatedAt: true } }),
    db.gallery.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  // lastmod untuk halaman statis: pakai tanggal modifikasi konten terbaru
  // (BUKAN waktu request — lastmod yang berubah setiap fetch membuat Google
  // tidak percaya lastmod seluruh sitemap dan mengabaikannya).
  const contentLastmod = [
    ...posts.map((p) => p.updatedAt),
    ...portfolios.map((p) => p.updatedAt),
    ...certificates.map((c) => c.updatedAt),
    ...galleries.map((g) => g.updatedAt),
  ]
    .sort((a, b) => b.getTime() - a.getTime())[0]
    ?.toISOString();

  // Primary navigation pages (candidates for Google sitelinks).
  // Ordered by importance — homepage first, then the most-visited nav targets
  // (About, Portfolio, Services, Contact are the typical 4 sitelinks Google picks).
  // CATATAN: /search & /sitemap TIDAK dimasukkan — keduanya noindex
  // (Google Search Console akan error "Submitted URL marked 'noindex'"
  // jika URL noindex di-submit lewat sitemap).
  const staticPages: { path: string; changefreq: string; priority: string }[] = [
    { path: "", changefreq: "daily", priority: "1.0" },
    { path: "about", changefreq: "monthly", priority: "0.9" },
    { path: "portfolio", changefreq: "weekly", priority: "0.9" },
    { path: "services", changefreq: "monthly", priority: "0.9" },
    { path: "contact", changefreq: "monthly", priority: "0.9" },
    { path: "skills", changefreq: "monthly", priority: "0.8" },
    ...(marketEnabled
      ? [{ path: "financial-market", changefreq: "weekly", priority: "0.8" }]
      : []),
    { path: "blog", changefreq: "weekly", priority: "0.8" },
    { path: "gallery", changefreq: "weekly", priority: "0.7" },
    { path: "certificates", changefreq: "monthly", priority: "0.7" },
    { path: "experience", changefreq: "monthly", priority: "0.7" },
    { path: "education", changefreq: "monthly", priority: "0.7" },
    { path: "testimonials", changefreq: "monthly", priority: "0.7" },
    { path: "faq", changefreq: "monthly", priority: "0.6" },
    { path: "privacy-policy", changefreq: "yearly", priority: "0.3" },
    { path: "terms", changefreq: "yearly", priority: "0.3" },
  ];

  const urls = [
    ...staticPages.map(
      (p) =>
        `  <url>\n    <loc>${baseUrl}/${p.path}</loc>\n    <lastmod>${contentLastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...posts.map(
      (p) =>
        `  <url>\n    <loc>${baseUrl}/blog/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ),
    ...portfolios.map(
      (p) =>
        `  <url>\n    <loc>${baseUrl}/portfolio/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
    ...certificates.map(
      (c) =>
        `  <url>\n    <loc>${baseUrl}/certificates/${c.slug}</loc>\n    <lastmod>${c.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
