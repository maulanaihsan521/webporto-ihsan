import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { BlogManager } from "./blog-manager";

export default async function AdminBlogPage() {
  await requireAdminSession();

  const [posts, categories, tags] = await Promise.all([
    db.post.findMany({
      include: {
        category: true,
        author: { select: { id: true, name: true } },
        tags: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { type: "BLOG" },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const data = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    documentUrl: p.documentUrl,
    published: p.published,
    featured: p.featured,
    viewCount: p.viewCount,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    author: p.author ? { id: p.author.id, name: p.author.name } : null,
    tags: p.tags.map((t) => ({ id: t.id, name: t.name })),
  }));

  const cats = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const tagList = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));

  return <BlogManager data={data} categories={cats} tags={tagList} />;
}
