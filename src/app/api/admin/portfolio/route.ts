import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolios = await db.portfolio.findMany({
    include: {
      category: true,
      _count: { select: { images: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(portfolios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const slug = body.slug?.trim() || slugify(body.title || "");
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.portfolio.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const data: any = {
      title: body.title?.trim() || "",
      slug,
      excerpt: body.excerpt?.trim() || null,
      description: body.description ?? "",
      thumbnail: body.thumbnail?.trim() || null,
      banner: body.banner?.trim() || null,
      videoUrl: body.videoUrl?.trim() || null,
      role: body.role?.trim() || null,
      client: body.client?.trim() || null,
      status: body.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      projectDate: body.projectDate ? new Date(body.projectDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      technologies: body.technologies?.trim() || null,
      githubUrl: body.githubUrl?.trim() || null,
      demoUrl: body.demoUrl?.trim() || null,
      figmaUrl: body.figmaUrl?.trim() || null,
      youtubeUrl: body.youtubeUrl?.trim() || null,
      downloadUrl: body.downloadUrl?.trim() || null,
      featured: !!body.featured,
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      ogImage: body.ogImage?.trim() || null,
      categoryId: body.categoryId || null,
    };

    const created = await db.portfolio.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Portfolio",
        entityId: created.id,
        userId: session.id,
        detail: `Created portfolio "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Portfolio create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
