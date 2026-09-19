import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { TagsManager } from "./tags-manager";

export default async function AdminTagsPage() {
  await requireAdminSession();
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  const data = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    postCount: t._count.posts,
    createdAt: t.createdAt.toISOString(),
  }));
  return <TagsManager data={data} />;
}
