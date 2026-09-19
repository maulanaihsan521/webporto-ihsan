#!/bin/bash
# Start dev server, wait for ready, run all smoke tests, kill server at end.
# Task 23: tambah assertion PASS/FAIL, cakup halaman Market + proxy og-image,
# hapus endpoint stale (/api/blog, /api/portfolio tidak pernah ada).
set -e

cd /home/z/my-project/webporto-ihsan

PASS=0
FAIL=0

check() {
  # check <label> <expected_status> <actual_status>
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  PASS  $actual  $label"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $actual (expect $expected)  $label"
    FAIL=$((FAIL+1))
  fi
}

# check_retry: 404/timeout transien (dev cold-compile) → retry sekali setelah 3s
check_retry() {
  local label="$1" expected="$2" url="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000$url")
  if [ "$code" != "$expected" ]; then
    sleep 3
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000$url")
  fi
  check "$label" "$expected" "$code"
}

# Kill any leftover — agresif: next dev, wrapper run-with-env, npm, next-server.
# Task 23: pkill saja tidak cukup — proses parent/npm bisa bertahan dan menjawab
# port 3000 (dua server balapan → request dijawab server lama yang sedang
# hot-reload → 404 transien di detail pages).
pkill -f "next dev" 2>/dev/null || true
pkill -f "run-with-env" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2
# Tunggu sampai port 3000 benar-benar bebas (max 15s)
for i in $(seq 1 15); do
  if ! curl -s --max-time 2 -o /dev/null http://localhost:3000/ 2>/dev/null; then
    break
  fi
  sleep 1
done

# Start dev server in background, capture PID
node scripts/run-with-env.js next dev -p 3000 > /tmp/devlog.txt 2>&1 &
DEVPID=$!
echo "Dev server PID: $DEVPID"

# Wait for dev server to be ready (up to 60s)
echo "Waiting for dev server..."
for i in $(seq 1 60); do
  if curl -s --max-time 2 -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "✓ Dev server ready after ${i}s"
    break
  fi
  sleep 1
  if [ $i -eq 60 ]; then
    echo "✗ Dev server failed to start within 60s"
    cat /tmp/devlog.txt | tail -20
    kill $DEVPID 2>/dev/null || true
    exit 1
  fi
done

echo ""
echo "===== SMOKE TEST: CONTENT PAGES ====="
for path in / /blog /portfolio /certificates /about /contact /services /skills /financial-market /gallery /testimonials /faq /education /experience /search; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000$path")
  check "GET $path" 200 "$CODE"
done

echo ""
echo "===== SMOKE TEST: API ENDPOINTS ====="
# Origin header wajib untuk POST — proteksi CSRF di middleware menolak
# request tanpa Origin (403).
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
  -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d "{\"path\":\"/smoke-test\",\"referrer\":\"\",\"sessionId\":\"smoke-$(date +%s)\"}")
check "POST /api/track (visitor)" 200 "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000/api/search?q=blog")
check "GET /api/search?q=blog" 200 "$CODE"

# Proxy og-image: URL Supabase valid → 200 image/jpeg <300KB
OGSUPA="https://vjijkzlzqksgqsdrgxrm.supabase.co/storage/v1/object/public/media/uploads/1787772108130_ChatGPT_Image_26_Agu_2026__23_52_50.png"
CODE=$(curl -s -o /tmp/og-smoke.jpg -w "%{http_code}" --max-time 30 \
  "http://localhost:3000/api/og-image?u=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$OGSUPA")")
check "GET /api/og-image (proxy Supabase)" 200 "$CODE"
if [ "$CODE" = "200" ]; then
  SIZE=$(stat -c%s /tmp/og-smoke.jpg 2>/dev/null || echo 0)
  if [ "$SIZE" -gt 0 ] && [ "$SIZE" -lt 307200 ]; then
    echo "  PASS  ukuran $SIZE bytes (<300KB, WhatsApp-compliant)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  ukuran $SIZE bytes (harus <300KB)"
    FAIL=$((FAIL+1))
  fi
fi

# Proxy og-image: host terlarang → 302 redirect ke default
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "http://localhost:3000/api/og-image?u=https%3A%2F%2Fevil.example.com%2Fx.png")
check "GET /api/og-image (host terlarang → 302)" 302 "$CODE"

# File default og image
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "http://localhost:3000/uploads/og-default.jpg")
check "GET /uploads/og-default.jpg" 200 "$CODE"

echo ""
echo "===== SMOKE TEST: DETAIL PAGES ====="
# Pick first slug from blog listing page
BLOG_HTML=$(curl -s --max-time 15 http://localhost:3000/blog)
SLUG=$(echo "$BLOG_HTML" | grep -oE 'href="/blog/[^"]+"' | head -1 | sed 's|href="/blog/||;s|"||g' | tr -d ' ')
if [ -n "$SLUG" ]; then
  check_retry "GET /blog/$SLUG" 200 "/blog/$SLUG"
else
  echo "  SKIP  tidak ada slug blog ditemukan"
fi

# Market article slug: ambil dari sitemap.xml — halaman /financial-market
# memakai Radix Tabs yang TIDAK merender tab non-aktif (analysis) ke SSR HTML,
# jadi href artikel tidak pernah muncul di HTML awal. Sitemap selalu memuatnya.
MSLUG=$(curl -s --max-time 15 http://localhost:3000/sitemap.xml | grep -oE '/financial-market/[a-z0-9-]+' | head -1 | sed 's|/financial-market/||')
if [ -n "$MSLUG" ]; then
  check_retry "GET /financial-market/$MSLUG" 200 "/financial-market/$MSLUG"
else
  echo "  SKIP  tidak ada artikel market di sitemap"
fi

# Pick first slug from portfolio listing page
PORT_HTML=$(curl -s --max-time 15 http://localhost:3000/portfolio)
PSLUG=$(echo "$PORT_HTML" | grep -oE 'href="/portfolio/[^"]+"' | head -1 | sed 's|href="/portfolio/||;s|"||g' | tr -d ' ')
if [ -n "$PSLUG" ]; then
  check_retry "GET /portfolio/$PSLUG" 200 "/portfolio/$PSLUG"
else
  echo "  SKIP  tidak ada slug portfolio ditemukan"
fi

# Pick first slug from certificates listing page
CERT_HTML=$(curl -s --max-time 15 http://localhost:3000/certificates)
CSLUG=$(echo "$CERT_HTML" | grep -oE 'href="/certificates/[^"]+"' | head -1 | sed 's|href="/certificates/||;s|"||g' | tr -d ' ')
if [ -n "$CSLUG" ]; then
  check_retry "GET /certificates/$CSLUG" 200 "/certificates/$CSLUG"
else
  echo "  SKIP  tidak ada slug certificate ditemukan"
fi

echo ""
echo "===== SMOKE TEST: SITEMAP / ROBOTS / RSS ====="
for path in /sitemap.xml /robots.txt /rss.xml; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000$path")
  check "GET $path" 200 "$CODE"
done

# RSS valid XML (parse via python)
RSS_OK=$(curl -s --max-time 15 http://localhost:3000/rss.xml | python3 -c "
import sys, xml.etree.ElementTree as ET
try:
    ET.fromstring(sys.stdin.read())
    print('valid')
except Exception:
    print('invalid')
")
if [ "$RSS_OK" = "valid" ]; then
  echo "  PASS  rss.xml well-formed XML"
  PASS=$((PASS+1))
else
  echo "  FAIL  rss.xml bukan XML valid"
  FAIL=$((FAIL+1))
fi

echo ""
echo "===== RINGKASAN ====="
echo "PASS: $PASS  FAIL: $FAIL"
if [ $FAIL -gt 0 ]; then
  echo "✗ SMOKE TEST GAGAL"
  echo ""
  echo "===== DEV SERVER LOG (last 20 lines) ====="
  tail -20 /tmp/devlog.txt
fi

echo ""
echo "===== CLEANUP: kill dev server ====="
kill $DEVPID 2>/dev/null || true
sleep 2
pkill -f "next dev" 2>/dev/null || true
pkill -f "run-with-env" 2>/dev/null || true
echo "Done."

[ $FAIL -eq 0 ]
