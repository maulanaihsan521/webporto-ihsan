import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_COLORS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await db.service.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Judul layanan wajib diisi" }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugify(body.title);
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    const existing = await db.service.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });

    const color = body.color?.trim() && VALID_COLORS.includes(body.color.trim()) ? body.color.trim() : null;

    const data: any = {
      title: body.title.trim(),
      slug,
      description: body.description?.trim() || null,
      icon: body.icon?.trim() || null,
      color,
      features: body.features?.trim() || null,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.service.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Service",
        entityId: created.id,
        userId: session.id,
        detail: `Created service "${created.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Service create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
