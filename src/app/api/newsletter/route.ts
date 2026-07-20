import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const existing = await db.newsletter.findUnique({ where: { email } });
    if (existing) {
      if (!existing.active) {
        await db.newsletter.update({ where: { email }, data: { active: true } });
        return NextResponse.json({ ok: true, message: "Re-subscribed" });
      }
      return NextResponse.json({ ok: true, message: "Already subscribed" });
    }
    await db.newsletter.create({ data: { email } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    await db.newsletter.update({ where: { email }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
