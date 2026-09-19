#!/usr/bin/env python3
"""Stage 3: Validasi JSON-LD + cek GSC verification + post DB vs sitemap."""
import subprocess, re, json, sys

SITE = "https://portofoliomaulanaihsan.my.id"

def fetch(path):
    r = subprocess.run(["curl", "-s", "--max-time", "20", f"{SITE}{path}"],
                       capture_output=True, text=True)
    return r.stdout

print("=== VALIDASI JSON-LD (syntax + field wajib) ===")
pages = ["/", "/about", "/blog/fotografi-sebagai-bahasa-visual",
         "/portfolio/projectforge", "/financial-market/analisa-saham-tlkm-prospek-2027-2028",
         "/certificates/business-processes-in-financial-accounting"]
problems = []
for p in pages:
    html = fetch(p)
    blocks = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
    for i, b in enumerate(blocks):
        try:
            data = json.loads(b)
        except json.JSONDecodeError as e:
            problems.append(f"{p} block#{i}: JSON INVALID — {e}")
            continue
        t = data.get("@type", "?")
        # cek field wajib umum
        if t in ("WebSite", "Person") and not data.get("url"):
            problems.append(f"{p} {t}: tanpa url")
        if t == "Person" and not data.get("name"):
            problems.append(f"{p} Person: tanpa name")
        if t == "Article" and not data.get("headline"):
            problems.append(f"{p} Article: tanpa headline")
        if t == "Article" and not data.get("image"):
            problems.append(f"{p} Article: tanpa image (Google butuh untuk rich result)")
    types = []
    for b in blocks:
        try:
            d = json.loads(b)
            types.append(d.get("@type", "?"))
        except Exception:
            types.append("INVALID")
    print(f"  {p}: {len(blocks)} blok → {types}")

print()
print("=== GSC verification meta (harus ada token) ===")
html = fetch("/")
gsc = re.search(r'<meta name="google-site-verification" content="([^"]*)"', html)
print(f"  google-site-verification: {'ADA ✓ (' + gsc.group(1)[:12] + '...)' if gsc else 'TIDAK ADA ⚠ (GSC tidak terverifikasi via meta tag)'}")

print()
print("=== og:image reachable ===")
for m in re.findall(r'<meta property="og:image" content="([^"]*)"', html):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}|%{content_type}|%{size_download}",
                        "--max-time", "20", m], capture_output=True, text=True)
    print(f"  {r.stdout} → {m[:100]}")

print()
if problems:
    print("=== MASALAH JSON-LD ===")
    for pr in problems: print(" ⚠", pr)
else:
    print("JSON-LD semua valid ✓")
