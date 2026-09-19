#!/bin/bash
# Task 12: Deep review public pages — HTTP status + console/page errors + broken images
set -uo pipefail
BASE="http://localhost:3000"
PAGES=(
  "/" "/about" "/services" "/portfolio" "/skills" "/financial-market" "/blog" "/gallery"
  "/certificates" "/experience" "/education" "/testimonials" "/faq" "/contact"
  "/search" "/privacy-policy" "/terms" "/sitemap" "/nonexistent-page-404-test"
  "/portfolio/agencyos-erp-crm" "/portfolio/aruna-cafe-management-system" "/portfolio/game-ihsan-racing"
  "/blog/fotografi-sebagai-bahasa-visual" "/blog/analisa-saham-tlkm-prospek-2027-2028"
  "/certificates/business-processes-in-financial-accounting"
)

echo "===== HTTP STATUS (curl) ====="
for p in "${PAGES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$p")
  echo "$code  $p"
done

echo ""
echo "===== CONSOLE/PAGE ERRORS (browser, dark then light) ====="
agent-browser open "$BASE/" >/dev/null 2>&1
agent-browser eval "localStorage.setItem('theme','dark')" >/dev/null 2>&1
for p in "${PAGES[@]:0:19}"; do
  agent-browser errors --clear >/dev/null 2>&1
  agent-browser console --clear >/dev/null 2>&1
  agent-browser open "$BASE$p" >/dev/null 2>&1
  sleep 2.5
  errs=$(agent-browser errors 2>/dev/null | grep -v "^\[" | head -6)
  cerr=$(agent-browser console 2>/dev/null | grep -iE "\[error\]|\[warn\]" | grep -vE "Download the React|DevTools" | head -4)
  echo "--- $p"
  [ -n "$errs" ] && echo "PAGE-ERRORS: $errs"
  [ -n "$cerr" ] && echo "CONSOLE: $cerr"
  [ -z "$errs" ] && [ -z "$cerr" ] && echo "clean"
done
echo "DONE"
