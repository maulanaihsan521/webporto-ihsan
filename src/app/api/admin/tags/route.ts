import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const slug = slugify(name);
  // FIX 2026-10-22: cek juga by NAME — slugify bisa menghasilkan slug berbeda
  // dari tag yang sudah ada (mis. "INDEX:COMPOSITE" → "indexcomposite" vs
  // "index-composite" di DB) sehingga cek by-slug saja lolos, lalu create
  // meledak dengan P2002 (unique name) → 500. Sekarang ditangani rapi → 400.
  const existing = await db.tag.findFirst({ where: { OR: [{ slug }, { name }] } });
  if (existing) return NextResponse.json({ error: "Tag sudah ada" }, { status: 400 });
  const tag = await db.tag.create({ data: { name, slug } });
  await db.activityLog.create({ data: { action: "CREATE", entity: "Tag", entityId: tag.id, userId: session.id, detail: name } });
    revalidatePublicPages();
  return NextResponse.json(tag);
}
