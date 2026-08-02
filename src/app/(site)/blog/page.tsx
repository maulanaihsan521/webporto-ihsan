import Link from "next/link";
import { ArrowRight, Newspaper, Rss } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { BlogExplorer,
  type BlogPostItem,
  type BlogCategoryItem,
  type BlogTagItem } from "./blog-explorer";

export const metadata = {
  title: "Blog — Maulana Ihsan Rohim",
  description:
    "Artikel terbaru seputar digital marketing, pengembangan web, produksi video, fotografi, branding, dan insight pasar finansial dari Maulana Ihsan Rohim.",
};

export default async function BlogPage() {
  const [posts, categories, tags] = await Promise.all([
    db.post.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true, image: true } },
        category: true,
        tags: true,
      },
      orderBy: { publishedAt: "desc" },
    }),
    db.category.findMany({
      where: { type: "BLOG" },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Map to client-safe typed items
  const typedPosts: BlogPostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverImage: p.coverImage || null,
    featured: p.featured,
    viewCount: p.viewCount,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt ?? p.createdAt,
    createdAt: p.createdAt,
    author: p.author
      ? { name: p.author.name, image: p.author.image }
      : null,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          color: p.category.color,
        }
      : null,
    tags: p.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }));

  const typedCategories: BlogCategoryItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  const typedTags: BlogTagItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));

  return (
    <div className="relative">

      {/* ===== Explorer ===== */}
      <section id="blog-explorer" className="section-pad scroll-mt-24 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Semua Tulisan</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari artikel berdasarkan judul, konten, atau filter berdasarkan
                kategori dan tag. Urutkan sesuai preferensi Anda.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedPosts.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Newspaper className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                <p className="text-base font-medium">Belum ada artikel yang dipublikasikan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Artikel baru akan segera hadir. Nantikan!
                </p>
              </Card>
            ) : (
              <BlogExplorer
                posts={typedPosts}
                categories={typedCategories}
                tags={typedTags}
              />
            )}
          </SectionReveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Newspaper className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin konten yang <span className="text-gradient">lebih dalam?</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Mari diskusikan ide Anda. Saya terbuka untuk kolaborasi
                  konten, konsultasi strategi digital, maupun workshop
                  branding &amp; marketing.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/about">
                      Tentang Saya
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
