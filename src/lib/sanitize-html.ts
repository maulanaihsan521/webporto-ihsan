/**
 * Server-side HTML Sanitizer
 *
 * Mencegah Stored XSS pada content yang dirender dengan dangerouslySetInnerHTML.
 * Mengizinkan tag HTML yang aman (untuk rich text editor), tapi hapus:
 * - <script> tags
 * - Event handlers (on*)
 * - javascript: URLs
 * - <iframe>, <object>, <embed>
 * - <style> tags (bisa dipakai CSS injection)
 *
 * Owner: Maulana Ihsan Rohim
 * Updated: 2026-08-04 (Deep Review Fix)
 */

// Tag yang diizinkan untuk rich text content
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "div", "span",
  "strong", "b", "em", "i", "u", "s", "small", "mark",
  "ul", "ol", "li",
  "blockquote", "q", "cite", "code", "pre", "kbd", "samp", "var",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "a", "img",
  "figure", "figcaption",
  "details", "summary",
]);

// Atribut yang diizinkan per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  td: new Set(["colspan", "rowspan", "align"]),
  th: new Set(["colspan", "rowspan", "align"]),
  "*": new Set(["class", "style", "align"]),
};

// Nilai text-align yang aman (untuk fitur rata kiri/kanan/tengah/justify dari rich text editor)
const SAFE_TEXT_ALIGN = new Set(["left", "center", "right", "justify", "start", "end"]);

/**
 * Filter nilai atribut style — HANYA properti text-align dengan nilai aman yang dipertahankan.
 * Properti CSS lain (position, url(), expression, dll) dibuang untuk mencegah CSS injection.
 * Mengembalikan string style yang aman, atau null jika tidak ada deklarasi yang lolos.
 */
function filterStyleAttr(styleValue: string): string | null {
  const safeDecls: string[] = [];
  for (const decl of styleValue.split(";")) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim().toLowerCase();
    if (prop === "text-align" && SAFE_TEXT_ALIGN.has(value)) {
      safeDecls.push(`text-align: ${value}`);
    }
  }
  return safeDecls.length > 0 ? safeDecls.join("; ") : null;
}

/**
 * Validasi atribut align (legacy HTML dari execCommand di beberapa browser).
 * Hanya nilai alignment aman yang diizinkan.
 */
function isSafeAlignValue(value: string): boolean {
  return SAFE_TEXT_ALIGN.has(value.trim().toLowerCase());
}

// Pattern berbahaya di attribute values
// SECURITY FIX 2026-09-17 (audit): dua bypass ditemukan saat pentest —
// 1) Leading whitespace: href=" javascript:..." lolos dari anchor ^
// 2) HTML entity: href="&#106;avascript:..." di-decode browser setelah parser
// Solusi: decode entity numerik/named umum + trim SEBELUM pattern check.
const DANGEROUS_ATTR_PATTERNS = [
  /^[\u0000-\u0020]*javascript:/i,
  /^[\u0000-\u0020]*data:text\/html/i,
  /^[\u0000-\u0020]*vbscript:/i,
];

/**
 * Decode HTML entities di attribute value — browser mendecode ini SETELAH
 * parsing HTML, jadi checker harus membandingkan nilai pasca-decode.
 * Cukup entity yang relevan utk menyamarkan skema URL (j, a, v, s, c, r, i,
 * p, t, titik dua, dsb).
 */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ""; }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return ""; }
    })
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
}

/**
 * Sanitasi HTML content untuk render yang aman.
 *
 * @param html - Raw HTML string dari database
 * @returns Sanitized HTML string (aman untuk dangerouslySetInnerHTML)
 *
 * @example
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  let result = "";

  // Parser sederhana: process tag by tag
  let i = 0;
  while (i < html.length) {
    // Cari tag pembuka <
    const openIdx = html.indexOf("<", i);
    if (openIdx === -1) {
      // Sisa text content
      result += html.slice(i);
      break;
    }

    // Tambahkan text content sebelum tag
    result += html.slice(i, openIdx);

    // Cari tag penutup >
    const closeIdx = html.indexOf(">", openIdx);
    if (closeIdx === -1) {
      // Tidak ada > lagi, treat sebagai text
      result += html.slice(openIdx);
      break;
    }

    const tag = html.slice(openIdx, closeIdx + 1);

    // Parse tag
    const tagContent = tag.slice(1, -1).trim();

    // Cek jika ini closing tag </tag>
    if (tagContent.startsWith("/")) {
      const tagName = tagContent.slice(1).trim().toLowerCase().split(/\s/)[0];
      if (ALLOWED_TAGS.has(tagName)) {
        result += `</${tagName}>`;
      }
      i = closeIdx + 1;
      continue;
    }

    // Cek jika ini self-closing tag <tag />
    const isSelfClosing = tagContent.endsWith("/");
    const tagBody = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent;

    // Extract tag name (first word)
    const tagNameMatch = tagBody.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
    if (!tagNameMatch) {
      // Invalid tag, skip
      i = closeIdx + 1;
      continue;
    }

    const tagName = tagNameMatch[1].toLowerCase();

    // Cek apakah tag diizinkan
    if (!ALLOWED_TAGS.has(tagName)) {
      // Tag tidak diizinkan — skip tag tapi keep content (untuk div/span)
      // Untuk script/style/iframe — hapus content juga
      if (["script", "style", "iframe", "object", "embed", "noscript", "template"].includes(tagName)) {
        // Cari closing tag
        const closingTag = `</${tagName}`;
        const closingIdx = html.toLowerCase().indexOf(closingTag, closeIdx);
        if (closingIdx !== -1) {
          const endCloseIdx = html.indexOf(">", closingIdx);
          if (endCloseIdx !== -1) {
            i = endCloseIdx + 1;
            continue;
          }
        }
      }
      i = closeIdx + 1;
      continue;
    }

    // Parse attributes
    const attrRegex = /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
    const cleanAttrs: string[] = [];
    let attrMatch;
    while ((attrMatch = attrRegex.exec(tagBody)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      let attrValue = attrMatch[2];

      // Remove quotes
      if ((attrValue.startsWith('"') && attrValue.endsWith('"')) ||
          (attrValue.startsWith("'") && attrValue.endsWith("'"))) {
        attrValue = attrValue.slice(1, -1);
      }

      // Cek apakah attribute diizinkan
      const allowedForTag = ALLOWED_ATTRS[tagName] || new Set();
      const allowedForAll = ALLOWED_ATTRS["*"] || new Set();

      if (!allowedForTag.has(attrName) && !allowedForAll.has(attrName)) {
        continue; // Skip attribute
      }

      // SECURITY FIX 2026-09-17: cek pattern pada nilai yang sudah di-decode
      // dan dinormalisasi sesuai perilaku browser (WHATWG URL spec):
      // - decode HTML entities (browser decode SETELAH parser HTML)
      // - hapus tab/newline/CR di mana pun (browser strip dari URL)
      // - trim karakter kontrol/spasi awal
      // Ini menutup bypass: " javascript:…", "&#106;avascript:…",
      // "jav&#x09;ascript:…", "\njavascript:…"
      const normalizedValue = decodeHtmlEntities(attrValue)
        .replace(/[\t\n\r]/g, "")
        .replace(/^[\u0000-\u0020]+/, "");
      const isDangerous = DANGEROUS_ATTR_PATTERNS.some(p => p.test(normalizedValue));
      if (isDangerous) {
        continue; // Skip attribute
      }

      // Cek event handlers (on*)
      if (attrName.startsWith("on")) {
        continue; // Skip event handler
      }

      // Filter khusus atribut style: hanya text-align aman yang dipertahankan
      if (attrName === "style") {
        const safeStyle = filterStyleAttr(attrValue);
        if (!safeStyle) continue; // Tidak ada deklarasi aman → buang atribut
        cleanAttrs.push(`style="${safeStyle}"`);
        continue;
      }

      // Filter khusus atribut align (legacy): validasi nilai
      if (attrName === "align") {
        if (!isSafeAlignValue(attrValue)) continue;
        cleanAttrs.push(`align="${attrValue.trim().toLowerCase()}"`);
        continue;
      }

      // Special handling untuk <a target="_blank">
      if (tagName === "a" && attrName === "target" && attrValue === "_blank") {
        // Pastikan ada rel="noopener noreferrer"
        const hasRel = cleanAttrs.some(a => a.startsWith("rel="));
        if (!hasRel) {
          cleanAttrs.push('rel="noopener noreferrer"');
        }
      }

      // Escape quotes di value
      const escapedValue = attrValue.replace(/"/g, "&quot;");
      cleanAttrs.push(`${attrName}="${escapedValue}"`);
    }

    // Rebuild tag
    const attrsStr = cleanAttrs.length > 0 ? " " + cleanAttrs.join(" ") : "";
    if (isSelfClosing && ["img", "br", "hr"].includes(tagName)) {
      result += `<${tagName}${attrsStr} />`;
    } else {
      result += `<${tagName}${attrsStr}>`;
    }

    i = closeIdx + 1;
  }

  return result;
}

/**
 * Bungkus setiap <table> dengan <div class="table-wrap"> agar tabel lebar
 * bisa di-scroll horizontal di layar kecil (mobile) tanpa merusak layout halaman.
 * Dipanggil SETELAH sanitizeHtml() di titik render (bukan saat save, agar
 * konten di editor & DB tetap murni hasil editor).
 *
 * Sanitizer menormalisasi tag (huruf kecil, atribut ter-escape), sehingga
 * cukup cocokkan <table ...> dan </table> — tabel tidak bersarang di konten
 * yang dihasilkan rich text editor.
 */
export function wrapResponsiveTables(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<table(\s[^>]*)?>/gi, '<div class="table-wrap"><table$1>')
    .replace(/<\/table\s*>/gi, "</table></div>");
}

/**
 * Alternative: Strip semua HTML tags (untuk plain text preview)
 * Lebih ketat dari sanitizeHtml — untuk excerpt, meta description, dll
 */
export function stripAllHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
