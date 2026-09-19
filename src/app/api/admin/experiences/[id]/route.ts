import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const { id } = await params;
  const experience = await db.experience.findUnique({ where: { id } });
  if (!experience) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(experience);
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
    const existing = await db.experience.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const type = body.type ? (VALID_TYPES.includes(body.type) ? body.type : existing.type) : existing.type;
    const current = body.current ?? existing.current;

    const data: any = {
      company: body.company?.trim() ?? existing.company,
      logo: body.logo?.trim() || null,
      position: body.position?.trim() ?? existing.position,
      location: body.location?.trim() || null,
      type,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: current ? null : body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : existing.endDate,
      current,
      description: body.description?.trim() || null,
      technologies: body.technologies?.trim() || null,
      order: body.order !== undefined ? (Number.isFinite(Number(body.order)) ? Number(body.order) : existing.order) : existing.order,
    };

    const updated = await db.experience.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Experience",
        entityId: id,
        userId: session.id,
        detail: `Updated experience "${updated.position}" at "${updated.company}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Experience update error:", e);
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
    const existing = await db.experience.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.experience.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Experience",
        entityId: id,
        userId: session.id,
        detail: `Deleted experience "${existing.position}" at "${existing.company}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Experience delete error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
