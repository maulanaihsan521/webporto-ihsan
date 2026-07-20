import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const item = await db.portfolioHolding.update({ where: { id }, data: { symbol: body.symbol, name: body.name, type: body.type, quantity: Number(body.quantity), buyPrice: Number(body.buyPrice), currentPrice: Number(body.currentPrice), notes: body.notes } });
    revalidatePublicPages();
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.portfolioHolding.delete({ where: { id } });
    revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
