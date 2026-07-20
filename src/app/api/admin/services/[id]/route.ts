import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_COLORS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const service = await db.service.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
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
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || (body.title ? slugify(body.title) : existing.slug);
    if (slug !== existing.slug) {
      const dup = await db.service.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const color = body.color !== undefined
      ? (body.color?.trim() && VALID_COLORS.includes(body.color.trim()) ? body.color.trim() : null)
      : existing.color;

    const data: any = {
      title: body.title?.trim() ?? existing.title,
      slug,
      description: body.description !== undefined ? (body.description?.trim() || null) : existing.description,
      icon: body.icon !== undefined ? (body.icon?.trim() || null) : existing.icon,
      color,
      features: body.features !== undefined ? (body.features?.trim() || null) : existing.features,
      order: body.order !== undefined ? (Number.isFinite(Number(body.order)) ? Number(body.order) : existing.order) : existing.order,
    };

    const updated = await db.service.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Service",
        entityId: id,
        userId: session.id,
        detail: `Updated service "${updated.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Service update error:", e);
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
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.service.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Service",
        entityId: id,
        userId: session.id,
        detail: `Deleted service "${existing.title}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Service delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
