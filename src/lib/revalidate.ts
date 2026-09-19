import { revalidatePath } from "next/cache";

/**
 * Revalidate all public pages that display CMS content.
 * Call this after any admin mutation (create/update/delete) to ensure
 * changes appear immediately on the public website.
 */
export function revalidatePublicPages() {
  // Revalidate all public pages that depend on CMS data
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/services");
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/[slug]");
  revalidatePath("/skills");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]");
  revalidatePath("/gallery");
  revalidatePath("/certificates");
  revalidatePath("/certificates/[slug]");
  revalidatePath("/experience");
  revalidatePath("/education");
  revalidatePath("/testimonials");
  revalidatePath("/faq");
  revalidatePath("/contact");
  revalidatePath("/financial-market");
  revalidatePath("/financial-market/[slug]");
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
