#!/bin/bash
# Audit SEO produksi — portofoliomaulanaihsan.my.id
# Stage 1: Crawlability dasar
SITE="https://portofoliomaulanaihsan.my.id"

echo "=============================================="
echo "STAGE 1: CRAWLABILITY"
echo "=============================================="

echo "--- robots.txt ---"
curl -s "$SITE/robots.txt"
echo
echo "--- x-robots-tag header (harus kosong untuk halaman publik) ---"
curl -s -I "$SITE/" | grep -i "x-robots" || echo "(tidak ada x-robots-tag → halaman BOLEH diindeks) ✓"

echo "--- sitemap.xml: hitung URL ---"
curl -s "$SITE/sitemap.xml" > /tmp/sitemap.xml
python3 -c "
import re
xml = open('/tmp/sitemap.xml').read()
urls = re.findall(r'<loc>(.*?)</loc>', xml)
print(f'Total URL di sitemap: {len(urls)}')
for u in urls[:60]: print(' ', u)
" 2>&1 | head -40

echo
echo "--- cek status semua URL sitemap (sample) ---"
python3 -c "
import re, subprocess
xml = open('/tmp/sitemap.xml').read()
urls = re.findall(r'<loc>(.*?)</loc>', xml)
bad = []
import concurrent.futures
def check(u):
    r = subprocess.run(['curl','-s','-o','/dev/null','-w','%{http_code}','--max-time','15',u], capture_output=True, text=True)
    return u, r.stdout.strip()
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for u, code in ex.map(check, urls):
        if code != '200': bad.append((u, code))
print(f'URL dicek: {len(urls)}')
if bad:
    print('URL BERMASALAH:')
    for u, c in bad: print(f'  {c} → {u}')
else:
    print('Semua URL sitemap → 200 ✓')
"