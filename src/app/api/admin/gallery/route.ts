import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const galleries = await db.gallery.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(galleries);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    const slug = body.slug?.trim() || slugify(body.title || "");
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.gallery.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const type = body.type === "VIDEO" ? "VIDEO" : "IMAGE";

    const data: any = {
      title: body.title?.trim() || "",
      slug,
      description: body.description?.trim() || null,
      url: body.url?.trim() || "",
      type,
      thumbnail: body.thumbnail?.trim() || null,
      album: body.album?.trim() || null,
      featured: !!body.featured,
      categoryId: body.categoryId || null,
    };

    const created = await db.gallery.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Gallery",
        entityId: created.id,
        userId: session.id,
        detail: `Created gallery item "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Gallery create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
