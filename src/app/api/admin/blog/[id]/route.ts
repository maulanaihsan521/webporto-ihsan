import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify, readingTime } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({
    where: { id },
    include: { category: true, tags: true, author: { select: { id: true, name: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await db.post.findUnique({
      where: { id },
      include: { tags: { select: { id: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || slugify(body.title || existing.title);
    if (slug !== existing.slug) {
      const dup = await db.post.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const published = body.published ?? existing.published;
    const content = body.content ?? existing.content;
    const rt = readingTime(content);

    let publishedAt = existing.publishedAt;
    if (published && !existing.publishedAt) {
      publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
    } else if (!published) {
      publishedAt = null;
    } else if (body.publishedAt) {
      publishedAt = new Date(body.publishedAt);
    }

    const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds.filter(Boolean) : [];
    const currentTagIds = existing.tags.map((t) => t.id);
    const toConnect = tagIds.filter((tid) => !currentTagIds.includes(tid));
    const toDisconnect = currentTagIds.filter((tid) => !tagIds.includes(tid));

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      excerpt: body.excerpt?.trim() || null,
      content,
      coverImage: body.coverImage?.trim() || null,
      published,
      featured: body.featured ?? existing.featured,
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      metaKeywords: body.metaKeywords?.trim() || null,
      canonical: body.canonical?.trim() || null,
      ogImage: body.ogImage?.trim() || null,
      readingTime: rt,
      categoryId: body.categoryId || null,
      publishedAt,
      tags: {
        connect: toConnect.map((tid) => ({ id: tid })),
        disconnect: toDisconnect.map((tid) => ({ id: tid })),
      },
    };

    const updated = await db.post.update({ where: { id }, data, include: { tags: true } });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Post",
        entityId: id,
        userId: session.id,
        detail: `Updated post "${updated.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Post update error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await db.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.post.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Post",
        entityId: id,
        userId: session.id,
        detail: `Deleted post "${existing.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Post delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
