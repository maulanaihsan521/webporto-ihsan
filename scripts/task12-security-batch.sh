#!/bin/bash
# Task 12: ACTIVE SECURITY TESTING v2 — check() mendukung alternatif, urutan benar
set -uo pipefail
cd /home/z/my-project
BASE="http://localhost:3000"
PASS=0; FAIL=0; RESULTS=""

check() { # name, expected(alt dipisah |), actual
  IFS='|' read -ra EXP <<< "$2"
  for e in "${EXP[@]}"; do
    if [ "$e" = "$3" ]; then PASS=$((PASS+1)); RESULTS+="✓ $1 (got $3)\n"; echo "✓ $1 (got $3)"; return; fi
  done
  FAIL=$((FAIL+1)); RESULTS+="✗ $1 — expect $2, got $3\n"; echo "✗ $1 — expect $2, got $3"
}

echo "=== 1. Start dev server ==="
pkill -f "next-server" 2>/dev/null; sleep 1
node scripts/run-with-env.js next dev -p 3000 > .zscripts/dev.log 2>&1 &
DEV=$!
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $BASE/ 2>/dev/null)
  [ "$code" = "200" ] && break; sleep 2
done
echo "server ready (status $code)"

echo "=== 2. Setup test users ==="
node scripts/run-with-env.js node scripts/task12-setup-test-users.js

echo "=== 3. SECURITY TESTS ==="

# --- A. Login test users DULU (sebelum brute-force menyetir rate limit) ---
ADMIN_COOKIE=$(mktemp)
c=$(curl -s -o /dev/null -w "%{http_code}" -c $ADMIN_COOKIE -X POST -H "Origin: $BASE" -H "Content-Type: application/json" \
  -d '{"email":"task12-admin@test.local","password":"TestAdmin12!x"}' "$BASE/api/auth/login")
check "login test admin" "200" "$c"

EDITOR_COOKIE=$(mktemp)
c=$(curl -s -o /dev/null -w "%{http_code}" -c $EDITOR_COOKIE -X POST -H "Origin: $BASE" -H "Content-Type: application/json" \
  -d '{"email":"task12-editor@test.local","password":"TestEditor12!x"}' "$BASE/api/auth/login")
check "login test editor" "200" "$c"

# --- B. /api/auth/me mengembalikan user admin ---
c=$(curl -s -b $ADMIN_COOKIE "$BASE/api/auth/me" | grep -c '"role":"ADMIN"' || true)
check "me route role=ADMIN" "1" "$c"

# --- C. Admin APIs tanpa auth → 401 ---
for ep in "admin/blog" "admin/services" "admin/users" "admin/settings" "admin/comments" "media" "admin/backup"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: $BASE" "$BASE/api/$ep")
  check "no-auth GET /api/$ep" "401" "$c"
done
c=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Origin: $BASE" -H "Content-Type: application/json" -d '{}' "$BASE/api/admin/blog")
check "no-auth POST /api/admin/blog" "401" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE -H "Origin: $BASE" "$BASE/api/media?id=x")
check "no-auth DELETE /api/media" "401" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/media/file/nonexistent")
check "no-auth GET /api/media/file/[id]" "401" "$c"

# --- D. EDITOR (auth tapi non-admin) → 403 (role enforcement fix) ---
for ep in "admin/blog" "admin/services" "admin/comments" "admin/settings" "admin/users" "media"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE -H "Origin: $BASE" "$BASE/api/$ep")
  check "editor GET /api/$ep → 403" "403" "$c"
done
c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE -X POST -H "Origin: $BASE" -H "Content-Type: application/json" -d '{"title":"hack"}' "$BASE/api/admin/blog")
check "editor POST /api/admin/blog → 403" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE -X PUT -H "Origin: $BASE" -H "Content-Type: application/json" -d '{"title":"hack"}' "$BASE/api/admin/blog/nonexistent-id")
check "editor PUT admin blog → 403" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE -H "Origin: $BASE" "$BASE/api/contact")
check "editor GET /api/contact (PII) → 403" "403" "$c"

# --- E. Admin legit → 200 ---
c=$(curl -s -o /dev/null -w "%{http_code}" -b $ADMIN_COOKIE -H "Origin: $BASE" "$BASE/api/admin/blog")
check "admin GET /api/admin/blog" "200" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" -b $ADMIN_COOKIE -H "Origin: $BASE" "$BASE/api/admin/settings")
check "admin GET /api/admin/settings" "200" "$c"

# --- F. Upload file berbahaya sebagai ADMIN → ditolak allowlist ---
SVG_PAYLOAD='<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script></svg>'
printf '%s' "$SVG_PAYLOAD" > /tmp/evil.svg
printf '<html><script>alert(1)</script></html>' > /tmp/evil.html
printf 'MZ\x90\x00' > /tmp/evil.exe
RESP=$(curl -s -b $ADMIN_COOKIE -H "Origin: $BASE" -F "files=@/tmp/evil.svg;type=image/svg+xml" "$BASE/api/media")
echo "$RESP" | grep -q "Tipe file tidak diizinkan" && check "upload .svg+script ditolak" "OK" "OK" || check "upload .svg+script ditolak" "OK" "LEAK: $(echo $RESP | head -c 120)"
RESP=$(curl -s -b $ADMIN_COOKIE -H "Origin: $BASE" -F "files=@/tmp/evil.html;type=text/html" "$BASE/api/media")
echo "$RESP" | grep -q "Tipe file tidak diizinkan" && check "upload .html ditolak" "OK" "OK" || check "upload .html ditolak" "OK" "LEAK"
RESP=$(curl -s -b $ADMIN_COOKIE -H "Origin: $BASE" -F "files=@/tmp/evil.exe;type=application/x-msdownload" "$BASE/api/media")
echo "$RESP" | grep -q "Tipe file tidak diizinkan" && check "upload .exe ditolak" "OK" "OK" || check "upload .exe ditolak" "OK" "LEAK"

# --- G. CSRF: POST tanpa Origin → 403; origin evil.vercel.app → 403 ---
c=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"email":"x@x.com","password":"x"}' "$BASE/api/auth/login")
check "CSRF: login tanpa Origin" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Origin: https://evil-attacker.vercel.app" -H "Content-Type: application/json" -d '{"email":"x@x.com","password":"x"}' "$BASE/api/auth/login")
check "CSRF: wildcard evil.vercel.app ditolak" "403" "$c"

# --- H. WAF payloads ---
c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/search?q=1%27%20OR%20%271%27%3D%271")
check "WAF blok SQLi tautology" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/search?q=union%20select%20from")
check "WAF blok UNION SELECT" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E")
check "WAF blok XSS script tag" "403" "$c"
c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/search?q=..%2F..%2Fetc%2Fpasswd")
check "WAF blok path traversal" "403" "$c"

# --- I. Forged cookie → 401 ---
echo -n "admin_token=forged.token.value" > /tmp/forged_cookie
c=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/forged_cookie -H "Origin: $BASE" "$BASE/api/admin/blog")
check "forged cookie ditolak" "401" "$c"

# --- J. Admin pages tanpa login → redirect 307 ---
for pg in "" "blog" "users" "settings" "media" "messages" "analytics"; do
  c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/x9k2-dashboard/$pg")
  check "no-login /x9k2-dashboard/$pg → redirect" "307|308" "$c"
done

# --- K. Editor buka halaman admin → redirect (role guard) ---
c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE "$BASE/x9k2-dashboard/blog")
check "editor buka halaman admin → 307" "307" "$c"

# --- L. Session invalid setelah user dihapus ---
node scripts/run-with-env.js node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.deleteMany({ where: { email: 'task12-editor@test.local' } }).then(r => { console.log('editor deleted:', r.count); return p.\$disconnect(); });
" 2>&1 | tail -1
c=$(curl -s -o /dev/null -w "%{http_code}" -b $EDITOR_COOKIE -H "Origin: $BASE" "$BASE/api/admin/blog")
check "session user terhapus → 401" "401" "$c"

# --- M. Brute-force login → rate limit 429 (paling akhir agar tidak gangguu test lain) ---
RL_OK=0
for i in 1 2 3 4 5 6 7 8; do
  c=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Origin: $BASE" -H "Content-Type: application/json" \
    -d '{"email":"bruteforce2@test.local","password":"wrong'$i'"}' "$BASE/api/auth/login")
  [ "$c" = "429" ] && RL_OK=1
  echo "  bruteforce attempt $i -> $c"
done
check "login brute force → 429" "1" "$RL_OK"

# --- N. JSON-LD: setiap block ld+json harus JSON valid (escape benar = tidak breakout) ---
LD_OK=$(node scripts/task12-verify-jsonld.js "$BASE" > /tmp/ldcheck.log 2>&1 && echo OK || echo BAD)
tail -2 /tmp/ldcheck.log
check "JSON-LD valid & ter-escape (5 halaman)" "OK" "$LD_OK"

echo "=== 4. Cleanup ==="
node scripts/run-with-env.js node scripts/task12-cleanup-test-users.js

kill $DEV 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 1
echo "================ SECURITY TEST SUMMARY v2 ================"
echo -e "$RESULTS" > scripts/task12-security-results.txt
echo "PASS: $PASS  FAIL: $FAIL"
[ $FAIL -eq 0 ] && echo "ALL SECURITY TESTS PASSED" || echo "SOME TESTS FAILED — lihat scripts/task12-security-results.txt"
