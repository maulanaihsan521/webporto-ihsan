#!/usr/bin/env python3
"""Stage 2: Audit meta tags SEO semua halaman kunci."""
import subprocess, re, json
from concurrent.futures import ThreadPoolExecutor

SITE = "https://portofoliomaulanaihsan.my.id"
PAGES = ["/", "/about", "/services", "/portfolio", "/skills", "/financial-market",
         "/blog", "/gallery", "/certificates", "/experience", "/education",
         "/testimonials", "/faq", "/contact", "/privacy-policy", "/terms",
         "/blog/fotografi-sebagai-bahasa-visual",
         "/portfolio/projectforge",
         "/financial-market/analisa-saham-tlkm-prospek-2027-2028"]

def fetch(path):
    r = subprocess.run(["curl", "-s", "--max-time", "20", "-H",
                        "User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                        f"{SITE}{path}"], capture_output=True, text=True)
    return r.stdout

def get(html, pattern):
    m = re.search(pattern, html, re.I | re.S)
    return m.group(1).strip() if m else None

def audit(path):
    html = fetch(path)
    out = {"path": path, "ok": bool(html)}
    out["title"] = get(html, r"<title[^>]*>(.*?)</title>")
    out["desc"] = get(html, r'<meta\s+name="description"\s+content="(.*?)"')
    if out["desc"] is None:
        out["desc"] = get(html, r'<meta\s+content="(.*?)"\s+name="description"')
    out["canonical"] = get(html, r'<link\s+rel="canonical"\s+href="(.*?)"')
    out["og_title"] = get(html, r'<meta\s+property="og:title"\s+content="(.*?)"')
    out["og_image"] = get(html, r'<meta\s+property="og:image"\s+content="(.*?)"')
    out["og_url"] = get(html, r'<meta\s+property="og:url"\s+content="(.*?)"')
    out["twitter_card"] = get(html, r'<meta\s+name="twitter:card"\s+content="(.*?)"')
    out["robots_meta"] = get(html, r'<meta\s+name="robots"\s+content="(.*?)"')
    # H1
    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    out["h1_count"] = len(h1s)
    out["h1_first"] = re.sub(r"<[^>]+>", "", h1s[0])[:60] if h1s else None
    # JSON-LD types
    out["jsonld_types"] = re.findall(r'"@type"\s*:\s*"([^"]+)"', html)
    # gambar tanpa alt (SEO image)
    imgs = re.findall(r"<img[^>]*>", html)
    no_alt = [i for i in imgs if 'alt="' not in i and "alt='" not in i and "alt" not in i]
    out["img_total"] = len(imgs)
    out["img_no_alt"] = len(no_alt)
    return out

results = []
with ThreadPoolExecutor(max_workers=6) as ex:
    for r in ex.map(audit, PAGES):
        results.append(r)

print(f"{'PAGE':<45} {'TITLE':<8} {'DESC':<8} {'CANON':<6} {'OG:IMG':<6} {'H1':<4} {'NOALT':<6}")
print("-" * 100)
problems = []
titles_seen, descs_seen = {}, {}
for r in results:
    t_len = len(r["title"] or "")
    d_len = len(r["desc"] or "")
    canon_ok = "✓" if r["canonical"] else "✗"
    ogimg_ok = "✓" if r["og_image"] else "✗"
    h1 = r["h1_count"]
    print(f"{r['path']:<45} {t_len:<8} {d_len:<8} {canon_ok:<6} {ogimg_ok:<6} {h1:<4} {r['img_no_alt']:<6}")

    if not r["ok"]: problems.append(f"{r['path']}: GAGAL fetch")
    if not r["title"]: problems.append(f"{r['path']}: TIDAK ADA title")
    if t_len < 15: problems.append(f"{r['path']}: title terlalu pendek ({t_len})")
    if t_len > 65: problems.append(f"{r['path']}: title > 65 char ({t_len}) — risiko terpotong di SERP")
    if not r["desc"]: problems.append(f"{r['path']}: TIDAK ADA meta description")
    if d_len and d_len < 70: problems.append(f"{r['path']}: description pendek ({d_len})")
    if d_len > 170: problems.append(f"{r['path']}: description > 170 char ({d_len}) — terpotong")
    if not r["canonical"]: problems.append(f"{r['path']}: TIDAK ADA canonical")
    else:
        c = r["canonical"]
        expected = f"{SITE}{r['path']}" if r["path"] != "/" else SITE
        if c.rstrip("/") != expected.rstrip("/"):
            problems.append(f"{r['path']}: canonical MISMATCH → {c}")
    if not r["og_image"]: problems.append(f"{r['path']}: TIDAK ADA og:image")
    if r["robots_meta"] and "noindex" in (r["robots_meta"] or ""):
        problems.append(f"{r['path']}: NOINDEX terdeteksi!")
    if h1 == 0: problems.append(f"{r['path']}: TIDAK ADA H1")
    if h1 > 1: problems.append(f"{r['path']}: H1 lebih dari satu ({h1})")
    if r["img_no_alt"] > 0: problems.append(f"{r['path']}: {r['img_no_alt']} gambar tanpa alt")
    # duplikat title/desc
    if r["title"]: titles_seen.setdefault(r["title"], []).append(r["path"])
    if r["desc"]: descs_seen.setdefault(r["desc"], []).append(r["path"])

print()
dup_t = {t: ps for t, ps in titles_seen.items() if len(ps) > 1}
dup_d = {d: ps for d, ps in descs_seen.items() if len(ps) > 1}
if dup_t:
    problems.append(f"TITLE DUPLIKAT: {json.dumps(dup_t, ensure_ascii=False)}")
if dup_d:
    problems.append(f"DESCRIPTION DUPLIKAT: {json.dumps(dup_d, ensure_ascii=False)}")

print("=== JSON-LD types per halaman (sample) ===")
for r in results[:4]:
    print(f"  {r['path']}: {r['jsonld_types']}")

print()
print("=== MASALAH DITEMUKAN ===")
if problems:
    for p in problems: print(" ⚠", p)
else:
    print(" Tidak ada masalah — semua meta sehat ✓")
