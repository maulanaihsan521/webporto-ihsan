import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { id } = await params;
  const { name, type, description, color } = await req.json();
  if (!name || !type) return NextResponse.json({ error: "Name and type required" }, { status: 400 });
  const cat = await db.category.update({
    where: { id },
    data: { name, type, description, color },
  });
    revalidatePublicPages();
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { id } = await params;
  await db.category.delete({ where: { id } });
  await db.activityLog.create({ data: { action: "DELETE", entity: "Category", entityId: id, userId: session.id } });
    revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
