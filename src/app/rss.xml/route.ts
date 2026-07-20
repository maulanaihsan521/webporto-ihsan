export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";

export async function GET() {
  const settings = await getSettings();
  const baseUrl = SITE_URL;
  const posts = await db.post.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 20, select: { title: true, slug: true, excerpt: true, content: true, publishedAt: true, author: { select: { name: true } } } });

  const items = posts.map((p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${baseUrl}/blog/${p.slug}</link>
      <guid>${baseUrl}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt || ""}]]></description>
      <author>${p.author?.name || "Maulana Ihsan Rohim"}</author>
      <pubDate>${p.publishedAt ? new Date(p.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
    </item>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${settings.site_name || "Maulana Ihsan Rohim"} — Blog</title>
    <link>${baseUrl}/blog</link>
    <description>${settings.seo_meta_description || "Blog Maulana Ihsan Rohim"}</description>
    <language>id-ID</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
