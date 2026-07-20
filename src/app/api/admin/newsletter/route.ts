import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscribers = await db.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(subscribers);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    await db.newsletter.delete({ where: { id } });
  } else {
    await db.newsletter.deleteMany({ where: { active: false } });
  }
    revalidatePublicPages();
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, active } = await req.json();
  await db.newsletter.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}
