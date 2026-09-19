#!/bin/bash
# Task 11: Audit semua halaman dark mode — cari border/putih tebal yang bocor
# Threshold: border solid >=1px, warna terang (r,g,b >= 180) alpha >= 0.25
set -uo pipefail

BASE="http://localhost:3000"
PAGES=("/" "/about" "/services" "/portfolio" "/skills" "/financial-market" "/blog" "/gallery" "/certificates" "/experience" "/education" "/testimonials" "/faq" "/contact")

AUDIT_JS='
(() => {
  const parseCol = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(",").map(s => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const path = (el) => {
    let p = [];
    let n = el;
    while (n && n !== document.body && p.length < 4) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += "#" + n.id;
      const cls = (typeof n.className === "string" ? n.className : "").trim().split(/\s+/).slice(0, 3).join(".");
      if (cls) s += "." + cls;
      p.unshift(s);
      n = n.parentElement;
    }
    return p.join(" > ");
  };
  const brightBorder = [];
  const insetWhite = [];
  let pureWhiteText = 0;
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w < 24 && h < 24) continue;
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // 1. border putih terang
    if (cs.borderStyle.includes("solid")) {
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw >= 1) {
        const c = parseCol(cs.borderTopColor);
        if (c && c.r >= 180 && c.g >= 180 && c.b >= 180 && c.a >= 0.25) {
          brightBorder.push({ el: path(el), w: bw, col: cs.borderTopColor, size: w + "x" + h });
        }
      }
    }
    // 2. inset highlight putih tebal
    const bs = cs.boxShadow;
    if (bs && bs.includes("inset")) {
      const im = bs.match(/inset[^,]+rgba?\(([^)]+)\)/);
      if (im) {
        const c = parseCol("rgba(" + im[1] + ")");
        if (c && c.r >= 180 && c.g >= 180 && c.b >= 180 && c.a >= 0.25) {
          insetWhite.push({ el: path(el), col: "rgba(" + im[1] + ")", full: bs.slice(0, 90) });
        }
      }
    }
    // 3. teks pure white
    if (cs.color === "rgb(255, 255, 255)" && el.children.length === 0 && el.textContent.trim()) pureWhiteText++;
  }
  return JSON.stringify({ brightBorder: brightBorder.slice(0, 12), brightBorderTotal: brightBorder.length, insetWhite: insetWhite.slice(0, 6), insetTotal: insetWhite.length, pureWhiteText }, null, 1);
})()
'

# Set tema dark sebelum navigasi
agent-browser open "$BASE/" >/dev/null 2>&1
agent-browser eval "localStorage.setItem('theme','dark')" >/dev/null 2>&1

for p in "${PAGES[@]}"; do
  agent-browser open "$BASE$p" >/dev/null 2>&1
  sleep 2.2
  echo "===== PAGE: $p"
  agent-browser eval "$AUDIT_JS" 2>/dev/null | head -60
  echo ""
done
