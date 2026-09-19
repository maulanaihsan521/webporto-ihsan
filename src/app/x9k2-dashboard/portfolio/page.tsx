import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { PortfolioManager } from "./portfolio-manager";

export default async function AdminPortfolioPage() {
  await requireAdminSession();

  const [portfolios, categories] = await Promise.all([
    db.portfolio.findMany({
      include: { category: true, _count: { select: { images: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // SESUAIKAN FILTER (2026-09-20): opsi kategori = type PORTFOLIO ∪ kategori
    // yang sedang dipakai portofolio mana pun. Kategori "Photography" (type
    // BLOG, dipakai proyek lama "Fotografer & Editor") kini tetap muncul di
    // dropdown edit — sebelumnya nilainya tidak cocok dengan opsi mana pun.
    db.category.findMany({
      where: {
        OR: [{ type: "PORTFOLIO" }, { portfolios: { some: {} } }],
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates for client
  const data = portfolios.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    thumbnail: p.thumbnail,
    status: p.status,
    featured: p.featured,
    projectDate: p.projectDate ? p.projectDate.toISOString() : null,
    viewCount: p.viewCount,
    client: p.client,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
  }));

  const cats = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return <PortfolioManager data={data} categories={cats} />;
}
