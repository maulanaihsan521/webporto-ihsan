import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const messages = await db.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }
    const msg = await db.message.create({
      data: { name, email, phone: phone || null, subject: subject || null, message },
    });
    return NextResponse.json({ ok: true, id: msg.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { id, action, reply } = body;
    const msg = await db.message.findUnique({ where: { id } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (action === "read") {
      await db.message.update({ where: { id }, data: { read: true } });
    } else if (action === "unread") {
      await db.message.update({ where: { id }, data: { read: false } });
    } else if (action === "star") {
      await db.message.update({ where: { id }, data: { starred: !msg.starred } });
    } else if (action === "reply") {
      await db.message.update({ where: { id }, data: { reply, replied: true, replierId: session.id } });
      await db.activityLog.create({
        data: {
          action: "REPLY",
          entity: "Message",
          entityId: id,
          userId: session.id,
          detail: `Replied to message from ${msg.name} <${msg.email}>`,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.message.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
