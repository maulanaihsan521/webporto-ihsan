import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function getHomeData() {
  const [settings, featuredPortfolios, latestPosts, latestCerts, latestGalleries, services, testimonials, skills, featuredMarketArticles] = await Promise.all([
    getSettings(),
    db.portfolio.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    // Post blog terbaru — KATEGORI financial-market DIKECUALIKAN agar tidak
    // dobel dengan featuredMarketArticles (artikel market featured) di bawah;
    // saat market off, artikel market tetap ada di /blog (hanya tidak
    // ditonjolkan di homepage).
    db.post.findMany({
      where: {
        published: true,
        OR: [{ category: null }, { category: { slug: { not: "financial-market" } } }],
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { name: true, image: true } }, category: true },
    }),
    db.certificate.findMany({
      take: 3,
      orderBy: { issueDate: "desc" },
      include: { category: true },
    }),
    db.gallery.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    // Semua layanan (maks 8) — sebelumnya take 6 membuat layanan
    // Financial Market Research tidak pernah tampil di homepage
    db.service.findMany({ orderBy: { order: "asc" }, take: 8 }),
    db.testimonial.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 6 }),
    db.skill.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 8 }),
    // Artikel Market yang di-featured (kini post blog kategori Financial
    // Market) ikut tampil di "Artikel Terbaru" homepage — tetap digated
    // toggle market agar etalase market di home hanya muncul saat fitur ON.
    db.post.findMany({
      where: { published: true, featured: true, category: { slug: "financial-market" } },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        createdAt: true,
        publishedAt: true,
        readingTime: true,
        tags: { select: { name: true } },
      },
    }),
  ]);

  return {
    settings,
    featuredPortfolios,
    latestPosts,
    latestCerts,
    latestGalleries,
    services,
    testimonials,
    skills,
    featuredMarketArticles,
  };
}
