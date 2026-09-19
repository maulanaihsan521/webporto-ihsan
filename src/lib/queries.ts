import { db } from "@/lib/db";
import { getSettings, isMarketEnabled } from "@/lib/settings";

export async function getHomeData() {
  // Settings dulu — keputusan filter post terbaru bergantung toggle market
  // (market OFF → artikel financial-market TETAP tampil di "Artikel Terbaru",
  // permintaan user 2026-09-20: "yang telkom tampilkan juga di home").
  const settings = await getSettings();
  const marketEnabled = isMarketEnabled(settings);

  const [featuredPortfolios, latestPosts, latestCerts, latestGalleries, services, testimonials, skills, featuredMarketArticles] = await Promise.all([
    db.portfolio.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    // Post blog terbaru (3).
    // - Market ON: kategori financial-market DIKECUALIKAN agar tidak dobel
    //   dengan featuredMarketArticles (artikel market featured) di bawah.
    // - Market OFF (kondisi sekarang): SEMUA kategori ikut — artikel market
    //   (mis. Analisa Saham TLKM) tetap tampil di homepage sebagai kartu
    //   blog biasa; featuredMarketArticles memang tidak dirender saat market
    //   off, jadi tidak mungkin dobel. Artinya tetap hidup di /blog.
    db.post.findMany({
      where: {
        published: true,
        ...(marketEnabled
          ? {
              OR: [{ category: null }, { category: { slug: { not: "financial-market" } } }],
            }
          : {}),
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
