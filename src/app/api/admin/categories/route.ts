import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await db.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { posts: true, portfolios: true, certificates: true, galleries: true } },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, type, description, color } = await req.json();
  if (!name || !type) return NextResponse.json({ error: "Name and type required" }, { status: 400 });
  const slug = `${type === "BLOG" ? "" : type.toLowerCase().slice(0, 4) + "-"}${slugify(name)}`;
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
  const cat = await db.category.create({ data: { name, slug, type, description, color } });
  await db.activityLog.create({ data: { action: "CREATE", entity: "Category", entityId: cat.id, userId: session.id, detail: name } });
    revalidatePublicPages();
  return NextResponse.json(cat);
}
