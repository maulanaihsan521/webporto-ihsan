import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  // ITERATION: tambah session check — route admin jangan expose data tanpa auth
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const items = await db.portfolioHolding.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const body = await req.json();
  const item = await db.portfolioHolding.create({ data: { symbol: body.symbol, name: body.name, type: body.type || "STOCK", quantity: Number(body.quantity), buyPrice: Number(body.buyPrice), currentPrice: Number(body.currentPrice), notes: body.notes } });
    revalidatePublicPages();
  return NextResponse.json(item);
}
