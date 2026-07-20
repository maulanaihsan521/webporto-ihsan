import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const VALID_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experiences = await db.experience.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(experiences);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.company?.trim()) {
      return NextResponse.json({ error: "Perusahaan wajib diisi" }, { status: 400 });
    }
    if (!body.position?.trim()) {
      return NextResponse.json({ error: "Posisi wajib diisi" }, { status: 400 });
    }
    if (!body.startDate) {
      return NextResponse.json({ error: "Tanggal mulai wajib diisi" }, { status: 400 });
    }

    const type = VALID_TYPES.includes(body.type) ? body.type : "FULL_TIME";
    const current = !!body.current;

    const data: any = {
      company: body.company.trim(),
      logo: body.logo?.trim() || null,
      position: body.position.trim(),
      location: body.location?.trim() || null,
      type,
      startDate: new Date(body.startDate),
      endDate: current ? null : body.endDate ? new Date(body.endDate) : null,
      current,
      description: body.description?.trim() || null,
      technologies: body.technologies?.trim() || null,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
    };

    const created = await db.experience.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Experience",
        entityId: created.id,
        userId: session.id,
        detail: `Created experience "${created.position}" at "${created.company}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Experience create error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
