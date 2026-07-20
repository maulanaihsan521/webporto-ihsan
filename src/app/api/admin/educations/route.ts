import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const educations = await db.education.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(educations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.institution?.trim()) {
      return NextResponse.json({ error: "Institusi wajib diisi" }, { status: 400 });
    }
    if (!body.degree?.trim()) {
      return NextResponse.json({ error: "Gelar wajib diisi" }, { status: 400 });
    }
    if (!body.startDate) {
      return NextResponse.json({ error: "Tanggal mulai wajib diisi" }, { status: 400 });
    }

    const current = !!body.current;

    const data: any = {
      institution: body.institution.trim(),
      logo: body.logo?.trim() || null,
      degree: body.degree.trim(),
      field: body.field?.trim() || null,
      grade: body.grade?.trim() || null,
      startDate: new Date(body.startDate),
      endDate: current ? null : body.endDate ? new Date(body.endDate) : null,
      current,
      description: body.description?.trim() || null,
      achievements: body.achievements?.trim() || null,
      organization: body.organization?.trim() || null,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.education.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Education",
        entityId: created.id,
        userId: session.id,
        detail: `Created education "${created.degree}" at "${created.institution}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Education create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
