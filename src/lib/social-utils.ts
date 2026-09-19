/**
 * Helper untuk validasi URL social media.
 * Tujuan: filter link yang tidak valid (URL kosong, "#", atau URL tanpa
 * username/channel seperti "https://facebook.com/" atau "https://youtube.com/@")
 * dari footer dan social link lain di UI.
 *
 * Pola invalid yang difilter:
 *   - empty string, null, undefined
 *   - "#" (placeholder)
 *   - URL dengan path kosong: "https://facebook.com/" → path = "" → invalid
 *   - URL dengan path "@": "https://youtube.com/@" → path = "@" → invalid
 *
 * Pola valid:
 *   - "https://github.com/maulanaihsan521" → path = "maulanaihsan521" ✓
 *   - "https://wa.me/6285175397747" → path = "6285175397747" ✓
 *
 * Dipakai di:
 *   - src/components/site-footer.tsx
 *   - src/app/(site)/page.tsx (homepage hero socials)
 *
 * Tidak dipakai untuk mailto: links (yang sudah punya format sendiri).
 */

/**
 * Cek apakah URL social media valid (ada username/channel setelah domain).
 *
 * @param url - URL social media dari settings DB (mis. settings.social_facebook)
 * @returns true jika URL valid dan punya username/channel, false jika invalid
 */
export function isValidSocialUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.trim();
  if (!u || u === "#") return false;
  try {
    const parsed = new URL(u);
    // Strip leading & trailing slash, cek apakah ada substance di path
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return false; // "https://facebook.com/" → path = ""
    if (path === "@") return false; // "https://youtube.com/@" → path = "@"
    return true;
  } catch {
    return false; // Bukan URL valid
  }
}
