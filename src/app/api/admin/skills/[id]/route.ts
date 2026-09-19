import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const VALID_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const { id } = await params;
  const skill = await db.skill.findUnique({ where: { id } });
  if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(skill);
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
    const existing = await db.skill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = body.slug?.trim() || (body.name ? slugify(body.name) : existing.slug);
    if (slug !== existing.slug) {
      const dup = await db.skill.findUnique({ where: { slug } });
      if (dup) return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const level = body.level ? (VALID_LEVELS.includes(body.level) ? body.level : existing.level) : existing.level;

    let percentage: number | undefined = undefined;
    if (body.percentage !== undefined) {
      let p = Number(body.percentage);
      if (!Number.isFinite(p)) p = existing.percentage;
      percentage = Math.max(0, Math.min(100, Math.round(p)));
    }

    const data: any = {
      name: body.name?.trim() ?? existing.name,
      slug,
      category: body.category?.trim() || existing.category,
      level,
      icon: body.icon !== undefined ? (body.icon?.trim() || null) : existing.icon,
      description: body.description !== undefined ? (body.description?.trim() || null) : existing.description,
      color: body.color !== undefined ? (body.color?.trim() || null) : existing.color,
      featured: body.featured ?? existing.featured,
      order: body.order !== undefined ? (Number.isFinite(Number(body.order)) ? Number(body.order) : existing.order) : existing.order,
    };
    if (percentage !== undefined) data.percentage = percentage;

    const updated = await db.skill.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Skill",
        entityId: id,
        userId: session.id,
        detail: `Updated skill "${updated.name}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Skill update error:", e);
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
    const existing = await db.skill.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.skill.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Skill",
        entityId: id,
        userId: session.id,
        detail: `Deleted skill "${existing.name}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Skill delete error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
