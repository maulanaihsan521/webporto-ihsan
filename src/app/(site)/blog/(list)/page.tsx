import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-site-config";
import { ogImageFor, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/lib/og-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { stripHtml, safeJsonLd } from "@/lib/utils";
import { BlogExplorer,
  type BlogPostItem,
  type BlogCategoryItem,
  type BlogTagItem } from "../blog-explorer";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Blog — Digital Marketing & Finance Insights" },
  description:
    "Artikel terbaru seputar digital marketing, pengembangan web, produksi video, fotografi, branding, dan insight pasar finansial dari Maulana Ihsan Rohim.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Blog — Digital Marketing & Finance Insights",
    description:
      "Artikel terbaru seputar digital marketing, pengembangan web, produksi video, fotografi, branding, dan insight pasar finansial dari Maulana Ihsan Rohim.",
    type: "website",
    url: "/blog",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: ogImageFor(),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: "Maulana Ihsan Rohim | Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Blog — Digital Marketing & Finance Insights",
    description:
      "Artikel terbaru seputar digital marketing, pengembangan web, produksi video, fotografi, branding, dan insight pasar finansial dari Maulana Ihsan Rohim.",
    images: [ogImageFor()],
  },
};

export default async function BlogPage() {
  // 2026-09-19: artikel market kini = post blog (kategori "Financial Market",
  // hasil migrasi) — tidak ada lagi merge MarketArticle & tidak digated toggle
  // market: saat fitur market di-off dari admin, artikel market TETAP tampil
  // di blog (permintaan user: "market di-off, artikel tetap ada").
  const [posts, categories, tags] = await Promise.all([
    db.post.findMany({
      where: { published: true },
      // PERF (Task 12): batasi jumlah + select kolom yang dipakai list saja.
      // FIX (Task 14): `include` + `select` bersamaan = PrismaClientValidationError
      // → halaman /blog kosong diam-diam (status 200 via streaming SSR).
      // Relasi (author/category/tags) sudah didefinisikan di `select`.
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        id: true, title: true, slug: true, excerpt: true, content: true,
        coverImage: true, documentUrl: true, featured: true, viewCount: true,
        readingTime: true, publishedAt: true, createdAt: true,
        author: { select: { name: true, image: true } },
        category: true, tags: true,
      },
    }),
    // SESUAIKAN FILTER (2026-09-20): pill kategori = kategori yang dipakai
    // post published — bukan semua type=BLOG. Menghapus pill hantu
    // (Digital Marketing, Social Media, Videography = 0 post published)
    // dan selalu sinkron dengan data.
    db.category.findMany({
      where: { posts: { some: { published: true } } },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Kategori "Financial Market" — kategori DB biasa (type BLOG), dipakai
  // artikel market hasil migrasi; tampil selalu (artikel market selalu ada).
  const typedCategories: BlogCategoryItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  const typedPosts: BlogPostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    // Teks pencarian prasyarat (bukan HTML mentah) — pangkas 6000 char agar
    // payload klien tetap terikat (search instan tetap bekerja utk isi utama)
    searchText: stripHtml(p.content).toLowerCase().slice(0, 6000),
    coverImage: p.coverImage || null,
    documentUrl: p.documentUrl || null,
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

  const typedTags: BlogTagItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));

  // JSON-LD Blog + ItemList BlogPosting — structured data untuk daftar
  // artikel (selaras dengan detail yang sudah punya BlogPosting).
  // (Task 14) URL JSON-LD selalu domain produksi; dev lokal tetap host dev.
  const blogUrl = `${await getBaseUrl()}/blog`;
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Maulana Ihsan Rohim",
    url: blogUrl,
    inLanguage: "id-ID",
    blogPost: typedPosts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${blogUrl}/${p.slug}`,
      datePublished: new Date(p.publishedAt ?? p.createdAt).toISOString(),
      ...(p.author ? { author: { "@type": "Person", name: p.author.name } } : {}),
      ...(p.excerpt ? { description: p.excerpt } : {}),
    })),
  };

  return (
    <div className="relative">
      {/* Structured data: Blog + ItemList BlogPosting (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(blogJsonLd) }}
      />

      {/* ===== Explorer ===== */}
      <section id="blog-explorer" className="section-pad scroll-mt-24 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Semua Tulisan</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari artikel berdasarkan judul, konten, atau filter berdasarkan
                kategori dan tag. Urutkan sesuai preferensi Anda.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedPosts.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Newspaper className="mx-auto mb-3 size-8 text-muted-foreground" />
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
