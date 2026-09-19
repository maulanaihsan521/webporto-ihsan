#!/bin/bash
# Single bash session: start dev, wait, test, kill, write to file.
cd /home/z/my-project/webporto-ihsan
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
sleep 2

OUT=/tmp/audit-results.txt
> $OUT

# Start dev (same process group, will inherit kill at end)
node scripts/run-with-env.js next dev -p 3000 > /tmp/devlog.txt 2>&1 &
DEVPID=$!

# Wait for ready
READY=no
for i in $(seq 1 60); do
  if curl -s --max-time 2 -o /dev/null http://localhost:3000/ 2>/dev/null; then
    READY=yes
    echo "dev-ready-after:${i}s" >> $OUT
    break
  fi
  sleep 1
done

if [ "$READY" != "yes" ]; then
  echo "dev-failed-to-start" >> $OUT
  tail -10 /tmp/devlog.txt >> $OUT
  kill $DEVPID 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  pkill -f "next-server" 2>/dev/null
  exit 1
fi

echo "" >> $OUT
echo "===== TEST 1: 9 ENDPOINT PUBLIK =====" >> $OUT
for path in / /about /services /portfolio /blog /contact /robots.txt /sitemap.xml /favicon.ico; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "http://localhost:3000$path")
  echo "  $CODE $path" >> $OUT
done

echo "" >> $OUT
echo "===== TEST 2: H1 HOMEPAGE =====" >> $OUT
H1=$(curl -s --max-time 20 http://localhost:3000/ | grep -cE "<h1")
echo "  Homepage <h1> count: $H1 (expected: 1)" >> $OUT

echo "" >> $OUT
echo "===== TEST 3: INVALID SOCIAL LINKS =====" >> $OUT
SOCIALS=$(curl -s --max-time 20 http://localhost:3000/ | grep -oE 'href="https://(facebook|youtube)\.com/[^"]*"' | sort -u)
if [ -z "$SOCIALS" ]; then
  echo "  PASS: tidak ada link Facebook/YouTube invalid" >> $OUT
else
  echo "  Found:" >> $OUT
  echo "$SOCIALS" | sed 's/^/    /' >> $OUT
fi

echo "" >> $OUT
echo "===== TEST 4: SECURITY.TXT =====" >> $OUT
curl -s --max-time 10 http://localhost:3000/.well-known/security.txt | grep -E "^(Canonical|Policy):" | sed 's/^/  /' >> $OUT
SEC_V=$(curl -s --max-time 10 http://localhost:3000/.well-known/security.txt | grep -c "vercel.app")
echo "  vercel.app occurrences: $SEC_V (expected: 0)" >> $OUT

echo "" >> $OUT
echo "===== TEST 5: ROBOTS.TXT =====" >> $OUT
curl -s --max-time 15 http://localhost:3000/robots.txt | sed 's/^/  /' >> $OUT

echo "" >> $OUT
echo "===== TEST 6: FAVICON HEADERS =====" >> $OUT
curl -sI --max-time 15 http://localhost:3000/favicon.ico | head -3 | sed 's/^/  /' >> $OUT

echo "" >> $OUT
echo "===== TEST 7: ICON.PNG HEADERS =====" >> $OUT
curl -sI --max-time 15 http://localhost:3000/icon.png | head -3 | sed 's/^/  /' >> $OUT

echo "" >> $OUT
echo "===== TEST 8: PORTFOLIO TTFB =====" >> $OUT
PORTFOLIO=$(curl -s -o /dev/null -w "%{http_code} TTFB=%{time_starttransfer}s Total=%{time_total}s" --max-time 60 http://localhost:3000/portfolio)
echo "  /portfolio: $PORTFOLIO" >> $OUT

echo "" >> $OUT
echo "===== TEST 9: BLOG INDICATORS =====" >> $OUT
curl -s --max-time 30 http://localhost:3000/blog | grep -oE '(Total Artikel|Menampilkan[^<]*)' | head -5 | sed 's/^/  /' >> $OUT

echo "" >> $OUT
echo "===== TEST 10: SITEMAP CONTENT =====" >> $OUT
curl -s --max-time 15 http://localhost:3000/sitemap.xml | head -8 | sed 's/^/  /' >> $OUT

echo "" >> $OUT
echo "===== DONE =====" >> $OUT

# Cleanup
kill $DEVPID 2>/dev/null
sleep 1
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
echo "finished"
