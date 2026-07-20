import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify, readingTime } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await db.post.findMany({
    include: {
      category: true,
      author: { select: { id: true, name: true } },
      tags: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const slug = body.slug?.trim() || slugify(body.title || "");
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.post.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const published = !!body.published;
    const content = body.content ?? "";
    const rt = readingTime(content);

    const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds.filter(Boolean) : [];

    const data: any = {
      title: body.title?.trim() || "",
      slug,
      excerpt: body.excerpt?.trim() || null,
      content,
      coverImage: body.coverImage?.trim() || null,
      published,
      featured: !!body.featured,
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      metaKeywords: body.metaKeywords?.trim() || null,
      canonical: body.canonical?.trim() || null,
      ogImage: body.ogImage?.trim() || null,
      readingTime: rt,
      authorId: session.id,
      categoryId: body.categoryId || null,
      publishedAt: published ? (body.publishedAt ? new Date(body.publishedAt) : new Date()) : null,
      tags: tagIds.length
        ? { connect: tagIds.map((id) => ({ id })) }
        : undefined,
    };

    const created = await db.post.create({
      data,
      include: { tags: true },
    });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Post",
        entityId: created.id,
        userId: session.id,
        detail: `Created post "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Post create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
