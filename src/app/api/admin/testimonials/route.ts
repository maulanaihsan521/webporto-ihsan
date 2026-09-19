import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const testimonials = await db.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(testimonials);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  try {
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Isi testimoni wajib diisi" }, { status: 400 });
    }

    let rating = Number(body.rating);
    if (!Number.isFinite(rating)) rating = 5;
    rating = Math.max(1, Math.min(5, Math.round(rating)));

    const data: any = {
      name: body.name.trim(),
      position: body.position?.trim() || null,
      company: body.company?.trim() || null,
      avatar: body.avatar?.trim() || null,
      rating,
      content: body.content.trim(),
      featured: !!body.featured,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.testimonial.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Testimonial",
        entityId: created.id,
        userId: session.id,
        detail: `Created testimonial from "${created.name}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Testimonial create error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
