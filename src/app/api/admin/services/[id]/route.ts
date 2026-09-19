import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_COLORS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
];

/** Validasi URL/path foto layanan — terima path lokal ("/images/...") atau URL http(s) */
function sanitizeImage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("/") && !v.includes("..") && /^[-\w./]+$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch {
    /* invalid URL → null */
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

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
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

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
      image: body.image !== undefined ? sanitizeImage(body.image) : existing.image,
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
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
