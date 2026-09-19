#!/bin/bash
# Verifikasi post-build: dev server + curl 9 endpoint + cek P8/P9/P11/P16
set -e
cd /home/z/my-project/webporto-ihsan

# Kill leftover
pkill -f "next dev" 2>/dev/null || true
pkill -f "run-with-env" 2>/dev/null || true
sleep 2

# Start dev server in background
node scripts/run-with-env.js next dev -p 3000 > /tmp/devlog.txt 2>&1 &
DEVPID=$!
echo "Dev server PID: $DEVPID"

# Wait for ready
echo "Waiting for dev server..."
for i in $(seq 1 60); do
  if curl -s --max-time 2 -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "✓ Dev server ready after ${i}s"
    break
  fi
  sleep 1
done

echo ""
echo "===== TEST 1: 9 ENDPOINT PUBLIK (HARUS HTTP 200) ====="
for path in / /about /services /portfolio /blog /contact /robots.txt /sitemap.xml /favicon.ico; do
  curl -s -o /dev/null -w "  %{http_code}  TTFB=%{time_starttransfer}s  $path\n" --max-time 30 "http://localhost:3000$path"
done

echo ""
echo "===== TEST 2: P9 H1 HOMEPAGE (harus 1, bukan 2) ====="
H1_COUNT=$(curl -s --max-time 30 http://localhost:3000/ | grep -cE "<h1")
echo "  Homepage <h1> count: $H1_COUNT (expected: 1)"
if [ "$H1_COUNT" = "1" ]; then
  echo "  ✓ PASS — single H1"
else
  echo "  ✗ FAIL — expected 1, got $H1_COUNT"
fi

echo ""
echo "===== TEST 3: P8 SOCIAL LINKS (tidak boleh ada URL invalid) ====="
SOCIAL_URLS=$(curl -s --max-time 30 http://localhost:3000/ | grep -oE 'href="https://(facebook|youtube)\.com/[^"]*"' | sort -u)
if [ -z "$SOCIAL_URLS" ]; then
  echo "  ✓ PASS — tidak ada link Facebook/YouTube invalid di homepage"
else
  echo "  ✗ FAIL — link invalid ditemukan:"
  echo "$SOCIAL_URLS" | sed 's/^/    /'
fi

echo ""
echo "===== TEST 4: P16 SECURITY.TXT (harus pakai my.id) ====="
SEC_TXT=$(curl -s --max-time 15 http://localhost:3000/.well-known/security.txt)
if echo "$SEC_TXT" | grep -q "portofoliomaulanaihsan.my.id"; then
  echo "  ✓ PASS — security.txt pakai my.id"
  echo "  Canonical: $(echo "$SEC_TXT" | grep -E "^Canonical:" | head -1)"
  echo "  Policy:    $(echo "$SEC_TXT" | grep -E "^Policy:" | head -1)"
else
  echo "  ✗ FAIL — security.txt belum pakai my.id"
fi
if echo "$SEC_TXT" | grep -q "vercel.app"; then
  echo "  ✗ FAIL — masih ada vercel.app di security.txt"
else
  echo "  ✓ PASS — tidak ada vercel.app di security.txt"
fi

echo ""
echo "===== TEST 5: P11 BLOG (ambil jumlah artikel, harus konsisten) ====="
BLOG_HTML=$(curl -s --max-time 30 http://localhost:3000/blog)
TOTAL_ARTIKEL=$(echo "$BLOG_HTML" | grep -oE 'Total Artikel' | head -1)
MENAMPILKAN=$(echo "$BLOG_HTML" | grep -oE 'Menampilkan[^<]*' | head -1)
echo "  Total Artikel indicator: ${TOTAL_ARTIKEL:-not found}"
echo "  Menampilkan: ${MENAMPILKAN:-not found}"

echo ""
echo "===== TEST 6: SITEMAP validasi (Content-Type + URL pakai my.id) ====="
SITEMAP_HEADERS=$(curl -sI --max-time 15 http://localhost:3000/sitemap.xml | head -5)
echo "  $SITEMAP_HEADERS" | sed 's/^/  /'
echo ""
SITEMAP_BODY=$(curl -s --max-time 15 http://localhost:3000/sitemap.xml | head -10)
echo "  Sitemap body (first 10 lines):"
echo "$SITEMAP_BODY" | sed 's/^/    /'

echo ""
echo "===== TEST 7: ROBOTS.TXT validasi ====="
ROBOTS_BODY=$(curl -s --max-time 15 http://localhost:3000/robots.txt)
echo "  $ROBOTS_BODY" | sed 's/^/  /'

echo ""
echo "===== TEST 8: PORTFOLIO PAGE TTFB (P10 verifikasi tidak timeout) ====="
curl -s -o /dev/null -w "  HTTP %{http_code}  TTFB=%{time_starttransfer}s  Total=%{time_total}s  /portfolio\n" --max-time 60 http://localhost:3000/portfolio

echo ""
echo "===== TEST 9: FAVICON HEADERS (P1) ====="
curl -sI --max-time 15 http://localhost:3000/favicon.ico | head -5 | sed 's/^/  /'
echo ""
curl -sI --max-time 15 http://localhost:3000/icon.png | head -5 | sed 's/^/  /'

echo ""
echo "===== CLEANUP ====="
kill $DEVPID 2>/dev/null || true
sleep 1
pkill -f "next dev" 2>/dev/null || true
pkill -f "run-with-env" 2>/dev/null || true
echo "Done."
