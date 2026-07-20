import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const education = await db.education.findUnique({ where: { id } });
  if (!education) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(education);
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
    const existing = await db.education.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const current = body.current ?? existing.current;

    const data: any = {
      institution: body.institution?.trim() ?? existing.institution,
      logo: body.logo?.trim() || null,
      degree: body.degree?.trim() ?? existing.degree,
      field: body.field?.trim() || null,
      grade: body.grade?.trim() || null,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: current ? null : body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : existing.endDate,
      current,
      description: body.description?.trim() || null,
      achievements: body.achievements?.trim() || null,
      organization: body.organization?.trim() || null,
      order: body.order !== undefined ? (Number.isFinite(Number(body.order)) ? Number(body.order) : existing.order) : existing.order,
    };

    const updated = await db.education.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Education",
        entityId: id,
        userId: session.id,
        detail: `Updated education "${updated.degree}" at "${updated.institution}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Education update error:", e);
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
    const existing = await db.education.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.education.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Education",
        entityId: id,
        userId: session.id,
        detail: `Deleted education "${existing.degree}" at "${existing.institution}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Education delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
