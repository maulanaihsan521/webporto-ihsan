import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function getHomeData() {
  const [settings, featuredPortfolios, latestPosts, latestCerts, latestGalleries, services, testimonials, skills] = await Promise.all([
    getSettings(),
    db.portfolio.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    db.post.findMany({
      where: { published: true },
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
    db.service.findMany({ orderBy: { order: "asc" }, take: 6 }),
    db.testimonial.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 6 }),
    db.skill.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 8 }),
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
  };
}
