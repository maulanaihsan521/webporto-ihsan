import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { GalleryManager } from "./gallery-manager";

export default async function AdminGalleryPage() {
  await requireAdminSession();

  const [galleries, categories] = await Promise.all([
    db.gallery.findMany({
      include: { category: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    db.category.findMany({
      where: { type: "GALLERY" },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    url: g.url,
    type: g.type,
    thumbnail: g.thumbnail,
    album: g.album,
    featured: g.featured,
    order: g.order,
    category: g.category ? { id: g.category.id, name: g.category.name } : null,
    createdAt: g.createdAt.toISOString(),
  }));

  const cats = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return <GalleryManager data={data} categories={cats} />;
}
