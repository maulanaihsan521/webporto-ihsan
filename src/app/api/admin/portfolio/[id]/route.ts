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

  const { id } = await params;
  const portfolio = await db.portfolio.findUnique({
    where: { id },
    include: { category: true, images: { orderBy: { order: "asc" } } },
  });
  if (!portfolio) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(portfolio);
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
    const existing = await db.portfolio.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || slugify(body.title || existing.title);
    if (slug !== existing.slug) {
      const dup = await db.portfolio.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      excerpt: body.excerpt?.trim() || null,
      description: body.description ?? existing.description,
      thumbnail: body.thumbnail?.trim() || null,
      banner: body.banner?.trim() || null,
      videoUrl: body.videoUrl?.trim() || null,
      role: body.role?.trim() || null,
      client: body.client?.trim() || null,
      status: body.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      projectDate: body.projectDate ? new Date(body.projectDate) : body.projectDate === "" ? null : existing.projectDate,
      startDate: body.startDate ? new Date(body.startDate) : body.startDate === "" ? null : existing.startDate,
      endDate: body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : existing.endDate,
      technologies: body.technologies?.trim() || null,
      githubUrl: body.githubUrl?.trim() || null,
      demoUrl: body.demoUrl?.trim() || null,
      figmaUrl: body.figmaUrl?.trim() || null,
      youtubeUrl: body.youtubeUrl?.trim() || null,
      downloadUrl: body.downloadUrl?.trim() || null,
      featured: body.featured ?? existing.featured,
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      ogImage: body.ogImage?.trim() || null,
      categoryId: body.categoryId || null,
    };

    const updated = await db.portfolio.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Portfolio",
        entityId: id,
        userId: session.id,
        detail: `Updated portfolio "${updated.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Portfolio update error:", e);
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
    const existing = await db.portfolio.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.portfolio.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Portfolio",
        entityId: id,
        userId: session.id,
        detail: `Deleted portfolio "${existing.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Portfolio delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
