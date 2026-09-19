import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const faqs = await db.faq.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(faqs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  try {
    const body = await req.json();

    if (!body.question?.trim()) {
      return NextResponse.json({ error: "Pertanyaan wajib diisi" }, { status: 400 });
    }
    if (!body.answer?.trim()) {
      return NextResponse.json({ error: "Jawaban wajib diisi" }, { status: 400 });
    }

    const data: any = {
      question: body.question.trim(),
      answer: body.answer.trim(),
      category: body.category?.trim() || null,
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
      published: body.published !== undefined ? !!body.published : true,
    };

    const created = await db.faq.create({ data });

    await db.activityLog.create({
      data: {
        action: "CREATE",
        entity: "Faq",
        entityId: created.id,
        userId: session.id,
        detail: `Created FAQ "${created.question.slice(0, 60)}"`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("FAQ create error:", e);
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
