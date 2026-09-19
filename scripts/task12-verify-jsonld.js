// Task 12: verifikasi JSON-LD semua halaman — block ld+json harus JSON valid
// (escape `<`/`>` benar → tidak ada breakout dari elemen <script>)
const BASE = process.argv[2] || "http://localhost:3000";
const PAGES = [
  "/blog/fotografi-sebagai-bahasa-visual",
  "/blog/analisa-saham-tlkm-prospek-2027-2028",
  "/about", "/services", "/contact", "/portfolio", "/portfolio/agencyos-erp-crm",
  "/skills", "/gallery", "/certificates", "/experience", "/education",
  "/testimonials", "/faq", "/blog",
];

(async () => {
  let total = 0, bad = 0;
  for (const p of PAGES) {
    const res = await fetch(BASE + p);
    if (!res.ok) { console.error("HTTP", res.status, p); bad++; continue; }
    const html = await res.text();
    const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      total++;
      const inner = m[1];
      try {
        JSON.parse(inner);
      } catch (e) {
        bad++;
        console.error("BAD JSON-LD:", p, "—", e.message.slice(0, 80));
        console.error("  head:", inner.slice(0, 100));
      }
    }
  }
  console.log(`ld+json blocks: ${total}, invalid: ${bad}`);
  process.exit(bad === 0 && total > 0 ? 0 : 1);
})().catch(e => { console.error("FATAL", e.message); process.exit(1); });
