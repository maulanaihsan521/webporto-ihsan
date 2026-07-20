export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-config";

export async function GET() {
  const baseUrl = SITE_URL;

  const [posts, portfolios, certificates, galleries, marketArticles] = await Promise.all([
    db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.portfolio.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.certificate.findMany({ select: { slug: true, updatedAt: true } }),
    db.gallery.findMany({ select: { slug: true, updatedAt: true } }),
    db.marketArticle.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages = [
    "", "about", "services", "portfolio", "skills", "financial-market", "blog",
    "gallery", "certificates", "experience", "education", "testimonials", "faq",
    "contact", "search", "sitemap", "privacy-policy", "terms",
  ];

  const urls = [
    ...staticPages.map((p) => `  <url>\n    <loc>${baseUrl}/${p}</loc>\n    <changefreq>${p === "" ? "daily" : "weekly"}</changefreq>\n    <priority>${p === "" ? "1.0" : "0.8"}</priority>\n  </url>`),
    ...posts.map((p) => `  <url>\n    <loc>${baseUrl}/blog/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`),
    ...portfolios.map((p) => `  <url>\n    <loc>${baseUrl}/portfolio/${p.slug}</loc>\n    <lastmod>${p.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
    ...certificates.map((c) => `  <url>\n    <loc>${baseUrl}/certificates/${c.slug}</loc>\n    <lastmod>${c.updatedAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`),
    ...marketArticles.map((m) => `  <url>\n    <loc>${baseUrl}/financial-market/${m.slug}</loc>\n    <lastmod>${m.updatedAt.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
