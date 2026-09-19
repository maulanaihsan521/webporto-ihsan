import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { CommentsManager } from "./comments-manager";

export default async function AdminCommentsPage() {
  await requireAdminSession();
  const comments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      post: { select: { title: true, slug: true } },
    },
  });

  const data = comments.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    content: c.content,
    approved: c.approved,
    parentId: c.parentId,
    post: c.post ? { title: c.post.title, slug: c.post.slug } : null,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CommentsManager data={data} />;
}
