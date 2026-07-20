import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const items = await db.watchlist.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const item = await db.watchlist.create({ data: { symbol: body.symbol, name: body.name, type: body.type || "STOCK", notes: body.notes, targetPrice: body.targetPrice } });
    revalidatePublicPages();
  return NextResponse.json(item);
}
