#!/bin/bash
# Task 12: ADMIN DASHBOARD BROWSER REVIEW + CRUD smoke + visual screenshots
set -uo pipefail
cd /home/z/my-project
BASE="http://localhost:3000"
PASS=0; FAIL=0; RESULTS=""

check() {
  IFS='|' read -ra EXP <<< "$2"
  for e in "${EXP[@]}"; do
    if [ "$e" = "$3" ]; then PASS=$((PASS+1)); RESULTS+="✓ $1 (got $3)\n"; echo "✓ $1 (got $3)"; return; fi
  done
  FAIL=$((FAIL+1)); RESULTS+="✗ $1 — expect $2, got $3\n"; echo "✗ $1 — expect $2, got $3"
}

echo "=== 1. Start server + test admin ==="
pkill -f "next-server" 2>/dev/null; sleep 1
node scripts/run-with-env.js next dev -p 3000 > .zscripts/dev.log 2>&1 &
DEV=$!
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $BASE/ 2>/dev/null)
  [ "$code" = "200" ] && break; sleep 2
done
echo "server ready ($code)"
node scripts/run-with-env.js node scripts/task12-setup-test-users.js

echo "=== 2. CRUD smoke (curl, admin session) ==="
CK=$(mktemp)
curl -s -o /dev/null -c $CK -X POST -H "Origin: $BASE" -H "Content-Type: application/json" \
  -d '{"email":"task12-admin@test.local","password":"TestAdmin12!x"}' "$BASE/api/auth/login"
# POST kategori test
CAT_ID=$(curl -s -b $CK -X POST -H "Origin: $BASE" -H "Content-Type: application/json" \
  -d '{"name":"task12-temp","slug":"task12-temp","type":"BLOG"}' "$BASE/api/admin/categories" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$CAT_ID" ] && check "POST kategori" "OK" "OK" || check "POST kategori" "OK" "FAIL"
# PUT
c=$(curl -s -o /dev/null -w "%{http_code}" -b $CK -X PUT -H "Origin: $BASE" -H "Content-Type: application/json" \
  -d '{"name":"task12-temp-renamed","type":"BLOG"}' "$BASE/api/admin/categories/$CAT_ID")
check "PUT kategori" "200" "$c"
# DELETE
c=$(curl -s -o /dev/null -w "%{http_code}" -b $CK -X DELETE -H "Origin: $BASE" "$BASE/api/admin/categories/$CAT_ID")
check "DELETE kategori" "200" "$c"
# GET settings masih 200
c=$(curl -s -o /dev/null -w "%{http_code}" -b $CK -H "Origin: $BASE" "$BASE/api/admin/settings")
check "GET settings (admin)" "200" "$c"

echo "=== 3. Browser login admin ==="
agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$BASE/" >/dev/null 2>&1; sleep 1
agent-browser eval "localStorage.setItem('theme','dark')" >/dev/null 2>&1
agent-browser open "$BASE/x9k2-dashboard/login" >/dev/null 2>&1; sleep 3
agent-browser errors --clear >/dev/null 2>&1; agent-browser console --clear >/dev/null 2>&1
agent-browser fill 'input[type="email"]' "task12-admin@test.local" >/dev/null 2>&1
agent-browser fill 'input[type="password"]' "TestAdmin12!x" >/dev/null 2>&1
agent-browser click 'button[type="submit"]' >/dev/null 2>&1
sleep 4
URL=$(agent-browser get url)
echo "after login url: $URL"
case "$URL" in *x9k2-dashboard*) check "login redirect ke dashboard" "OK" "OK";; *) check "login redirect ke dashboard" "OK" "FAIL ($URL)";; esac

echo "=== 4. Kunjungi semua halaman admin (console error check) ==="
ADMIN_PAGES=("" "dashboard" "blog" "categories" "tags" "services" "portfolio" "gallery" "media" "messages" "comments" "users" "analytics" "seo" "settings" "backup" "skills" "certificates" "experience" "education" "testimonials" "faq" "newsletter" "market" "activity-log" "visitors")
for pg in "${ADMIN_PAGES[@]}"; do
  agent-browser errors --clear >/dev/null 2>&1; agent-browser console --clear >/dev/null 2>&1
  agent-browser open "$BASE/x9k2-dashboard/$pg" >/dev/null 2>&1
  sleep 3
  T=$(agent-browser get title 2>/dev/null | head -c 50)
  HTTPISH=$(curl -s -o /dev/null -w "%{http_code}" -b $CK "$BASE/x9k2-dashboard/$pg")
  errs=$(agent-browser errors 2>/dev/null | grep -v "^\[" | head -3)
  cerr=$(agent-browser console 2>/dev/null | grep -iE "\[error\]" | grep -vE "Download the React|DevTools|FIREBASE" | head -3)
  status="ok"
  [ "$HTTPISH" != "200" ] && status="HTTP$HTTPISH"
  [ -n "$errs" ] && status="$status +PAGEERR"
  [ -n "$cerr" ] && status="$status +CONSOLE"
  if [ "$status" = "ok" ]; then PASS=$((PASS+1)); echo "✓ /x9k2-dashboard/$pg — $T"; else FAIL=$((FAIL+1)); echo "✗ /x9k2-dashboard/$pg — $status | $errs $cerr" ; fi
done

echo "=== 5. Screenshot halaman admin kunci ==="
mkdir -p scripts/shots
agent-browser open "$BASE/x9k2-dashboard" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-admin-dashboard.png >/dev/null 2>&1
agent-browser open "$BASE/x9k2-dashboard/blog" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-admin-blog.png >/dev/null 2>&1
agent-browser open "$BASE/x9k2-dashboard/services" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-admin-services.png >/dev/null 2>&1
agent-browser open "$BASE/x9k2-dashboard/media" >/dev/null 2>&1; sleep 4
agent-browser screenshot scripts/shots/task12-admin-media.png >/dev/null 2>&1
echo "screenshots saved"

echo "=== 6. Public visual regression (dark) ==="
agent-browser open "$BASE/" >/dev/null 2>&1; sleep 3
agent-browser eval "window.scrollTo(0,800)" >/dev/null 2>&1; sleep 1.5
agent-browser screenshot scripts/shots/task12-home-dark.png >/dev/null 2>&1
agent-browser open "$BASE/services" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-services-dark.png >/dev/null 2>&1
agent-browser open "$BASE/blog" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-blog-dark.png >/dev/null 2>&1
agent-browser open "$BASE/portfolio" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-portfolio-dark.png >/dev/null 2>&1

echo "=== 7. Public visual regression (light) ==="
agent-browser eval "localStorage.setItem('theme','light')" >/dev/null 2>&1
agent-browser open "$BASE/" >/dev/null 2>&1; sleep 3
agent-browser eval "window.scrollTo(0,800)" >/dev/null 2>&1; sleep 1.5
agent-browser screenshot scripts/shots/task12-home-light.png >/dev/null 2>&1
agent-browser open "$BASE/services" >/dev/null 2>&1; sleep 3
agent-browser screenshot scripts/shots/task12-services-light.png >/dev/null 2>&1
agent-browser eval "localStorage.setItem('theme','dark')" >/dev/null 2>&1

echo "=== 8. Broken image check (public, dark) ==="
for p in "/" "/services" "/blog" "/portfolio" "/gallery"; do
  agent-browser open "$BASE$p" >/dev/null 2>&1; sleep 3
  BAD=$(agent-browser eval "(() => { let bad = 0; document.querySelectorAll('img').forEach(i => { if (i.complete && i.naturalWidth === 0 && i.src && !i.src.includes('data:')) bad++; }); return bad; })()" 2>/dev/null | tr -d '"')
  check "broken images $p" "0" "${BAD:-?}"
done

echo "=== 9. Cleanup + kill ==="
node scripts/run-with-env.js node scripts/task12-cleanup-test-users.js
kill $DEV 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 1
echo ""
echo "================ ADMIN REVIEW SUMMARY ================"
echo -e "$RESULTS" > scripts/task12-admin-results.txt
echo "PASS: $PASS  FAIL: $FAIL"
[ $FAIL -eq 0 ] && echo "ALL ADMIN TESTS PASSED" || echo "ADA YANG GAGAL — cek scripts/task12-admin-results.txt"
