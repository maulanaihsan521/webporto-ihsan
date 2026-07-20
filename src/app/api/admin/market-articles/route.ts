import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const articles = await db.marketArticle.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, slug, excerpt, content, type, instrument, published, featured, publishedAt } = body;
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  const article = await db.marketArticle.create({
    data: {
      title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt, content, type: type || "ANALYSIS", instrument,
      published: !!published, featured: !!featured,
      publishedAt: published ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
    },
  });
  await db.activityLog.create({ data: { action: "CREATE", entity: "MarketArticle", entityId: article.id, userId: session.id, detail: title } });
    revalidatePublicPages();
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, published, featured } = body;
  const article = await db.marketArticle.update({ where: { id }, data: { published, featured, publishedAt: published ? new Date() : null } });
  return NextResponse.json(article);
}
