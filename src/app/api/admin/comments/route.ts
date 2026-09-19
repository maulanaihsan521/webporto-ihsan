import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | approved | all

  const where: any = {};
  if (status === "pending") where.approved = false;
  else if (status === "approved") where.approved = true;

  const comments = await db.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      post: { select: { title: true, slug: true } },
      replies: { where: { approved: true } },
    },
  });

  return NextResponse.json(comments);
}
