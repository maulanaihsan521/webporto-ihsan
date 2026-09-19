import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitResponse, getClientIP } from "@/lib/security";

export async function GET(req: NextRequest) {
  // SECURITY FIX (audit 2026-09-15): rate limit search publik
  // (30 req/menit per IP) — cegah abuse/DoS ke database via query berulang.
  const ip = getClientIP(req);
  const rl = checkRateLimit(`search:ip:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt, 30);
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  // SECURITY FIX (audit 2026-09-15): potong input panjang (max 100 char)
  // supaya query contains tidak berat saat dipakai abuse.
  const query = q ? q.slice(0, 100) : q;

  if (!query || query.length < 2) {
    return NextResponse.json({ posts: [], portfolios: [], certificates: [] });
  }

  // 2026-09-19: artikel market kini = post blog (kategori Financial Market,
  // hasil migrasi) — hasil market otomatis masuk lewat `posts` (href /blog).
  const [posts, portfolios, certificates] = await Promise.all([
    db.post.findMany({
      where: { published: true, OR: [{ title: { contains: query } }, { excerpt: { contains: query } }] },
      select: { id: true, title: true, slug: true, excerpt: true },
      take: 5,
    }),
    db.portfolio.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: query } }, { excerpt: { contains: query } }, { client: { contains: query } }] },
      select: { id: true, title: true, slug: true, excerpt: true, client: true },
      take: 5,
    }),
    db.certificate.findMany({
      where: { OR: [{ title: { contains: query } }, { issuer: { contains: query } }] },
      select: { id: true, title: true, slug: true, issuer: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    posts: posts.map((p) => ({ ...p, type: "blog", href: `/blog/${p.slug}` })),
    portfolios: portfolios.map((p) => ({ ...p, type: "portfolio", href: `/portfolio/${p.slug}` })),
    certificates: certificates.map((c) => ({ ...c, type: "certificate", href: `/certificates/${c.slug}` })),
  });
}
