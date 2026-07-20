import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { CategoriesManager } from "./categories-manager";

export default async function AdminCategoriesPage() {
  await requireAdminSession();
  const categories = await db.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { posts: true, portfolios: true, certificates: true, galleries: true } },
    },
  });
  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type,
    description: c.description,
    color: c.color,
    counts: {
      posts: c._count.posts,
      portfolios: c._count.portfolios,
      certificates: c._count.certificates,
      galleries: c._count.galleries,
    },
    createdAt: c.createdAt.toISOString(),
  }));
  return <CategoriesManager data={data} />;
}
