import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], portfolios: [], certificates: [], marketArticles: [] });
  }

  const [posts, portfolios, certificates, marketArticles] = await Promise.all([
    db.post.findMany({
      where: { published: true, OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] },
      select: { id: true, title: true, slug: true, excerpt: true },
      take: 5,
    }),
    db.portfolio.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { client: { contains: q } }] },
      select: { id: true, title: true, slug: true, excerpt: true, client: true },
      take: 5,
    }),
    db.certificate.findMany({
      where: { OR: [{ title: { contains: q } }, { issuer: { contains: q } }] },
      select: { id: true, title: true, slug: true, issuer: true },
      take: 5,
    }),
    db.marketArticle.findMany({
      where: { published: true, OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] },
      select: { id: true, title: true, slug: true, excerpt: true, instrument: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({ ...p, type: "blog", href: `/blog/${p.slug}` })),
    portfolios: portfolios.map((p) => ({ ...p, type: "portfolio", href: `/portfolio/${p.slug}` })),
    certificates: certificates.map((c) => ({ ...c, type: "certificate", href: `/certificates/${c.slug}` })),
    marketArticles: marketArticles.map((m) => ({ ...m, type: "market", href: `/financial-market/${m.slug}` })),
  });
}
