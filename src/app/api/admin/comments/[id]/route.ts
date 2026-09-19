import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { action } = body; // approve | unapprove

  if (action === "approve") {
    await db.comment.update({ where: { id }, data: { approved: true } });
  } else if (action === "unapprove") {
    await db.comment.update({ where: { id }, data: { approved: false } });
  }

  await db.activityLog.create({
    data: {
      action: action === "approve" ? "UPDATE" : "UPDATE",
      entity: "Comment",
      entityId: id,
      userId: session.id,
      detail: `Comment ${action}`,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  const { id } = await params;
  await db.comment.delete({ where: { id } });
  await db.activityLog.create({
    data: { action: "DELETE", entity: "Comment", entityId: id, userId: session.id, detail: "Comment deleted" },
  });
    revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
