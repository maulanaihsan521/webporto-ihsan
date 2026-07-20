import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path || "/";
    const referrer = body.referrer || null;
    const sessionId = body.sessionId || null;
    const userAgent = req.headers.get("user-agent") || "";

    let device = "DESKTOP";
    if (/mobile|android|iphone/i.test(userAgent)) device = "MOBILE";
    else if (/tablet|ipad/i.test(userAgent)) device = "TABLET";

    let browser = "OTHER";
    if (/chrome/i.test(userAgent)) browser = "CHROME";
    else if (/firefox/i.test(userAgent)) browser = "FIREFOX";
    else if (/safari/i.test(userAgent)) browser = "SAFARI";
    else if (/edge|edg/i.test(userAgent)) browser = "EDGE";

    await db.visitor.create({
      data: { path, referrer, device, browser, sessionId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await db.visitorCount.findFirst({ where: { date: today, path } });
    if (existing) {
      await db.visitorCount.update({ where: { id: existing.id }, data: { count: { increment: 1 } } });
    } else {
      await db.visitorCount.create({ data: { date: today, path, count: 1, unique: 1 } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
