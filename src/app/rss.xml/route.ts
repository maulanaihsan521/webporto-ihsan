// ISR (2026-09-20): feed di-serve dari cache (milidetik), regenerasi tiap
// 1 jam — sebelumnya force-dynamic: query DB + getSettings di SETIAP request
// (±6s per fetch di pooler Supabase). Konsisten dengan migrasi sitemap.ts
// (fix Google Search Console "Couldn't fetch").
export const revalidate = 3600;

import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";
import { truncate, stripHtml } from "@/lib/utils";

/** Base URL deterministik — TANPA headers() agar route tetap cacheable (ISR).
 *  Produksi selalu domain utama; dev localhost. Konsisten dengan sitemap.ts. */
function getFeedBaseUrl(): string {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : SITE_URL;
}

type FeedItem = {
  title: string;
  link: string;
  description: string;
  author: string;
  pubDate: Date | null;
  category?: string;
};

/** Escape teks XML untuk nilai di luar CDATA (mis. "Photo & Video" → "Photo &amp; Video") */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Bungkus teks dalam CDATA — putuskan sekuens "]]>" agar CDATA tidak bocor */
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]&gt;")}]]>`;
}

export async function GET() {
  const baseUrl = getFeedBaseUrl();
  // Resilien saat build/regenerasi: DB unreachable → feed tetap valid
  // (channel tanpa item), build Vercel tidak gagal.
  let settings: Awaited<ReturnType<typeof getSettings>> = {} as Awaited<
    ReturnType<typeof getSettings>
  >;
  let posts: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    publishedAt: Date | null;
    author: { name: string | null } | null;
    category: { name: string } | null;
  }[] = [];
  try {
    [settings, posts] = await Promise.all([
      getSettings(),
      // 2026-09-19: artikel market kini = post blog (kategori Financial Market,
      // hasil migrasi) — otomatis masuk feed lewat query `posts` (link /blog,
      // kategori "Financial Market") dan TETAP ada walau toggle market off.
      db.post.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        // PERF (Task 12): feed cukup 20 item terbaru (standar RSS)
        take: 20,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          publishedAt: true,
          author: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
    ]);
  } catch (e) {
    console.error("[rss] DB unreachable, serving channel-only feed:", e);
  }

  const items: FeedItem[] = posts
    .map((p) => ({
      title: p.title,
      link: `${baseUrl}/blog/${p.slug}`,
      description: p.excerpt || truncate(stripHtml(p.content), 200),
      author: p.author?.name || "Maulana Ihsan Rohim",
      pubDate: p.publishedAt,
      category: p.category?.name,
    }))
    .sort((a, b) => {
      const da = a.pubDate ? +new Date(a.pubDate) : 0;
      const db_ = b.pubDate ? +new Date(b.pubDate) : 0;
      return db_ - da;
    })
    .slice(0, 20);

  const xmlItems = items
    .map((it) => {
      const category = it.category
        ? `\n      <category>${cdata(it.category)}</category>`
        : "";
      return `    <item>
      <title>${cdata(it.title)}</title>
      <link>${it.link}</link>
      <guid>${it.link}</guid>
      <description>${cdata(it.description)}</description>
      <author>${escapeXml(it.author)}</author>
      <pubDate>${it.pubDate ? new Date(it.pubDate).toUTCString() : new Date().toUTCString()}</pubDate>${category}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(settings.site_name || "Maulana Ihsan Rohim")} — Blog</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(settings.seo_meta_description || "Blog Maulana Ihsan Rohim")}</description>
    <language>id-ID</language>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
