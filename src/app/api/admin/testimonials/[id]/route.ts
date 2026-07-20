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
  const testimonial = await db.testimonial.findUnique({ where: { id } });
  if (!testimonial) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(testimonial);
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
    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let rating: number | undefined = undefined;
    if (body.rating !== undefined) {
      let r = Number(body.rating);
      if (!Number.isFinite(r)) r = existing.rating;
      rating = Math.max(1, Math.min(5, Math.round(r)));
    }

    const data: any = {
      name: body.name?.trim() ?? existing.name,
      position: body.position !== undefined ? (body.position?.trim() || null) : existing.position,
      company: body.company !== undefined ? (body.company?.trim() || null) : existing.company,
      avatar: body.avatar !== undefined ? (body.avatar?.trim() || null) : existing.avatar,
      content: body.content?.trim() ?? existing.content,
      featured: body.featured ?? existing.featured,
      order: body.order !== undefined ? (Number.isFinite(Number(body.order)) ? Number(body.order) : existing.order) : existing.order,
    };
    if (rating !== undefined) data.rating = rating;

    const updated = await db.testimonial.update({ where: { id }, data });

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Testimonial",
        entityId: id,
        userId: session.id,
        detail: `Updated testimonial from "${updated.name}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Testimonial update error:", e);
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
    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.testimonial.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        action: "DELETE",
        entity: "Testimonial",
        entityId: id,
        userId: session.id,
        detail: `Deleted testimonial from "${existing.name}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Testimonial delete error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
