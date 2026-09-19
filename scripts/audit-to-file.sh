#!/bin/bash
# Start dev, run tests, write results to /tmp/audit-results.txt, kill dev.
cd /home/z/my-project/webporto-ihsan
pkill -f "next dev" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
sleep 2

OUT=/tmp/audit-results.txt
> $OUT

node scripts/run-with-env.js next dev -p 3000 > /tmp/devlog.txt 2>&1 &
DEVPID=$!

# Wait for ready (max 30s)
READY=no
for i in $(seq 1 30); do
  if curl -s --max-time 1 -o /dev/null http://localhost:3000/ 2>/dev/null; then
    READY=yes
    echo "dev-ready-after:${i}s" >> $OUT
    break
  fi
  sleep 1
done

if [ "$READY" != "yes" ]; then
  echo "dev-failed-to-start" >> $OUT
  tail -5 /tmp/devlog.txt >> $OUT
  kill $DEVPID 2>/dev/null
  exit 1
fi

# 9 endpoints
echo "--- 9-endpoint-test ---" >> $OUT
for path in / /about /services /portfolio /blog /contact /robots.txt /sitemap.xml /favicon.ico; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "http://localhost:3000$path")
  echo "  $CODE $path" >> $OUT
done

# H1 count
H1=$(curl -s --max-time 20 http://localhost:3000/ | grep -cE "<h1")
echo "h1-count: $H1" >> $OUT

# Social invalid check
SOCIALS=$(curl -s --max-time 20 http://localhost:3000/ | grep -oE 'href="https://(facebook|youtube)\.com/[^"]*"' | sort -u)
if [ -z "$SOCIALS" ]; then
  echo "invalid-social-links: 0 (PASS)" >> $OUT
else
  echo "invalid-social-links: FOUND" >> $OUT
  echo "$SOCIALS" | sed 's/^/  /' >> $OUT
fi

# Security.txt
echo "--- security.txt ---" >> $OUT
curl -s --max-time 10 http://localhost:3000/.well-known/security.txt | grep -E "^(Canonical|Policy):" >> $OUT

# Robots
echo "--- robots.txt ---" >> $OUT
curl -s --max-time 15 http://localhost:3000/robots.txt >> $OUT

# Favicon + icon headers
echo "--- favicon headers ---" >> $OUT
curl -sI --max-time 15 http://localhost:3000/favicon.ico | head -3 >> $OUT
echo "--- icon.png headers ---" >> $OUT
curl -sI --max-time 15 http://localhost:3000/icon.png | head -3 >> $OUT

# Portfolio TTFB
PORTFOLIO=$(curl -s -o /dev/null -w "%{http_code} TTFB=%{time_starttransfer}s" --max-time 60 http://localhost:3000/portfolio)
echo "portfolio: $PORTFOLIO" >> $OUT

# Blog snippet
echo "--- blog indicators ---" >> $OUT
curl -s --max-time 30 http://localhost:3000/blog | grep -oE '(Total Artikel|Menampilkan[^<]*)' | head -5 >> $OUT

# Cleanup
kill $DEVPID 2>/dev/null
sleep 1
pkill -f "next dev" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
echo "--- done ---" >> $OUT
