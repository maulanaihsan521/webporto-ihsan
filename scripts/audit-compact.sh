#!/bin/bash
# Compact: start dev, run tests, kill dev, all in one shell.
cd /home/z/my-project/webporto-ihsan
pkill -f "next dev" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
sleep 2

# Start dev server in background, output to file
node scripts/run-with-env.js next dev -p 3000 > /tmp/devlog.txt 2>&1 &
DEVPID=$!

# Wait for ready
for i in $(seq 1 60); do
  curl -s --max-time 1 -o /dev/null http://localhost:3000/ 2>/dev/null && break
  sleep 1
done

# Compact tests, output minimal
RESULTS=""
for path in / /about /services /portfolio /blog /contact /robots.txt /sitemap.xml /favicon.ico; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "http://localhost:3000$path")
  RESULTS="$RESULTS $CODE $path"
done
echo "9-endpoint-test:$RESULTS"

# H1 count
H1=$(curl -s --max-time 20 http://localhost:3000/ | grep -cE "<h1")
echo "h1-count:$H1"

# Social invalid check
SOCIALS=$(curl -s --max-time 20 http://localhost:3000/ | grep -oE 'href="https://(facebook|youtube)\.com/[^"]*"' | sort -u | wc -l)
echo "invalid-social-links:$SOCIALS"

# Security.txt
SEC=$(curl -s --max-time 10 http://localhost:3000/.well-known/security.txt | grep -E "^(Canonical|Policy):" | tr '\n' '|')
echo "security-txt:$SEC"

# Sitemap first line
SITEMAP=$(curl -s --max-time 15 http://localhost:3000/sitemap.xml | head -5 | tr '\n' '|')
echo "sitemap-first5:$SITEMAP"

# Robots
ROBOTS=$(curl -s --max-time 15 http://localhost:3000/robots.txt | tr '\n' '|')
echo "robots:$ROBOTS"

# Favicon headers
FAV_HEADERS=$(curl -sI --max-time 15 http://localhost:3000/favicon.ico | head -3 | tr '\n' '|')
echo "favicon-headers:$FAV_HEADERS"

# Icon headers
ICON_HEADERS=$(curl -sI --max-time 15 http://localhost:3000/icon.png | head -3 | tr '\n' '|')
echo "icon-headers:$ICON_HEADERS"

# Portfolio TTFB
PORTFOLIO_TTFB=$(curl -s -o /dev/null -w "%{time_starttransfer}s" --max-time 60 http://localhost:3000/portfolio)
echo "portfolio-ttfb:$PORTFOLIO_TTFB"

# Blog page snippet
BLOG_SNIPPET=$(curl -s --max-time 30 http://localhost:3000/blog | grep -oE '(Total Artikel|Menampilkan[^<]*)' | head -3 | tr '\n' '|')
echo "blog-snippet:$BLOG_SNIPPET"

# Cleanup
kill $DEVPID 2>/dev/null
sleep 1
pkill -f "next dev" 2>/dev/null
pkill -f "run-with-env" 2>/dev/null
echo "done"
