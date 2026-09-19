import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const { id } = await params;
  const item = await db.gallery.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
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
    const existing = await db.gallery.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || slugify(body.title || existing.title);
    if (slug !== existing.slug) {
      const dup = await db.gallery.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const type = body.type === "VIDEO" ? "VIDEO" : "IMAGE";

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      description: body.description?.trim() || null,
      url: body.url?.trim() ?? existing.url,
      type,
      thumbnail: body.thumbnail?.trim() || null,
      album: body.album?.trim() || null,
      featured: body.featured ?? existing.featured,
      categoryId: body.categoryId || null,
    };

    const updated = await db.gallery.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Gallery",
        entityId: id,
        userId: session.id,
        detail: `Updated gallery item "${updated.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Gallery update error:", e);
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
    const existing = await db.gallery.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.gallery.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Gallery",
        entityId: id,
        userId: session.id,
        detail: `Deleted gallery item "${existing.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Gallery delete error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
