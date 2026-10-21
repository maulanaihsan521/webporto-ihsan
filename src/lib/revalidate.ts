import { revalidatePath } from "next/cache";

/**
 * Revalidate all public pages that display CMS content.
 * Call this after any admin mutation (create/update/delete) to ensure
 * changes appear immediately on the public website.
 */
export function revalidatePublicPages() {
  // Revalidate all public pages that depend on CMS data.
  // FIX 2026-10-22: path dinamis (/[slug]) wajib menyertakan parameter "type"
  // ("page") — tanpa itu Next.js mengabaikan panggilan ini (warning dev:
  // "was passed to revalidatePath, but the type parameter is missing") dan
  // halaman detail TIDAK ikut ter-revalidate di produksi.
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/services");
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/[slug]", "page");
  revalidatePath("/skills");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/gallery");
  revalidatePath("/certificates");
  revalidatePath("/certificates/[slug]", "page");
  revalidatePath("/experience");
  revalidatePath("/education");
  revalidatePath("/testimonials");
  revalidatePath("/faq");
  revalidatePath("/contact");
  revalidatePath("/financial-market");
  revalidatePath("/financial-market/[slug]", "page");
  revalidatePath("/search");
  revalidatePath("/sitemap");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
}

/**
 * Revalidate specific paths after settings change
 */
export function revalidateSettings() {
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/services");
}
