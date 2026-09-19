import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify, readingTime, isSafeHttpUrl } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

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
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

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

    // Validasi Link Dokumen: hanya http/https yang diizinkan (cegah javascript:/data: XSS)
    // (body.documentUrl === undefined → pertahankan nilai existing)
    let documentUrl = existing.documentUrl;
    if (body.documentUrl !== undefined) {
      const rawDocUrl = body.documentUrl?.trim() || null;
      if (rawDocUrl && !isSafeHttpUrl(rawDocUrl)) {
        return NextResponse.json(
          { error: "Link Dokumen harus berupa URL http/https yang valid (contoh: https://drive.google.com/...)" },
          { status: 400 }
        );
      }
      documentUrl = rawDocUrl;
    }

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      // FIX data-loss: sebelumnya field di bawah memakai pola `body.X?.trim() || null`
      // sehingga request partial (mis. toggle Publish yang hanya kirim {published})
      // MENGHAPUS nilai existing. Sekarang: undefined → pertahankan nilai lama.
      excerpt: body.excerpt !== undefined ? (body.excerpt?.trim() || null) : existing.excerpt,
      content,
      coverImage: body.coverImage !== undefined ? (body.coverImage?.trim() || null) : existing.coverImage,
      published,
      featured: body.featured ?? existing.featured,
      metaTitle: body.metaTitle !== undefined ? (body.metaTitle?.trim() || null) : existing.metaTitle,
      metaDescription: body.metaDescription !== undefined ? (body.metaDescription?.trim() || null) : existing.metaDescription,
      metaKeywords: body.metaKeywords !== undefined ? (body.metaKeywords?.trim() || null) : existing.metaKeywords,
      canonical: body.canonical !== undefined ? (body.canonical?.trim() || null) : existing.canonical,
      ogImage: body.ogImage !== undefined ? (body.ogImage?.trim() || null) : existing.ogImage,
      documentUrl,
      readingTime: rt,
      categoryId: body.categoryId !== undefined ? (body.categoryId || null) : existing.categoryId,
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
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

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
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
