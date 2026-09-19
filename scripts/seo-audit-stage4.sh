#!/bin/bash
# Stage 4: HTTPS/HSTS, duplicate content vectors, TTFB, ikon, post DB vs sitemap
SITE="https://portofoliomaulanaihsan.my.id"

echo "=== HTTPS & security headers ==="
curl -s -I "$SITE/" | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|content-security" | sed 's/^/  /'

echo
echo "=== Redirect http → https ==="
curl -s -o /dev/null -w "  http:// → %{http_code} redirect ke %{redirect_url}\n" "http://portofoliomaulanaihsan.my.id/"

echo
echo "=== Duplicate content: www vs non-www ==="
curl -s -o /dev/null -w "  www → %{http_code} → %{redirect_url}\n" "https://www.portofoliomaulanaihsan.my.id/" --max-time 15

echo
echo "=== Trailing slash behavior ==="
curl -s -o /dev/null -w "  /about/  → %{http_code} → %{redirect_url}\n" "$SITE/about/" --max-time 15
curl -s -o /dev/null -w "  /about   → %{http_code}\n" "$SITE/about" --max-time 15

echo
echo "=== TTFB (3x homepage) ==="
for i in 1 2 3; do curl -s -o /dev/null -w "  %{time_starttransfer}s (total %{time_total}s)\n" "$SITE/"; done

echo
echo "=== Favicon & ikon & manifest ==="
for f in /favicon.ico /logo-mi.png /apple-touch-icon.png /icon-192.png /icon-512.png /manifest.json; do
  curl -s -o /dev/null -w "  $f → %{http_code} %{content_type}\n" "$SITE$f" --max-time 15
done

echo
echo "=== RSS feed ==="
curl -s -o /dev/null -w "  /rss.xml → %{http_code}\n" "$SITE/rss.xml"
curl -s "$SITE/rss.xml" | grep -c "<item>" | xargs echo "  jumlah item RSS:"

echo
echo "=== Post DB vs sitemap ==="
cd /home/z/my-project/webporto-ihsan
node scripts/run-with-env.js node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const posts = await p.post.findMany({ select: { title: true, slug: true, published: true, status: true } });
  const markets = await p.marketArticle.findMany({ select: { title: true, slug: true, published: true, featured: true, status: true } });
  console.log('  BLOG POSTS di DB:', posts.length);
  for (const x of posts) console.log('   ', (x.published ? '[PUBLISHED]' : '[DRAFT]    '), x.slug);
  console.log('  MARKET ARTICLES di DB:', markets.length);
  for (const x of markets) console.log('   ', (x.published ? '[PUBLISHED]' : '[DRAFT]    '), x.slug);
  await p.\$disconnect();
})();
"