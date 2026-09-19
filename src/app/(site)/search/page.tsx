import Link from "next/link";
import { Suspense } from "react";
import { Search as SearchIcon,
  ArrowRight,
  FileText,
  Briefcase,
  Award,
  Image as ImageIcon,
  FolderSearch,
  Compass,
  type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { formatDate, truncate, stripHtml, cn } from "@/lib/utils";
import { SearchBox } from "./search-box";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Search" },
  description:
    "Cari artikel blog, portofolio, sertifikat, galeri, dan analisis pasar finansial dari Maulana Ihsan Rohim dalam satu halaman.",
  // Search results pages should not be indexed by Google (low-quality auto-gen pages).
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Search",
    description:
      "Cari artikel blog, portofolio, sertifikat, galeri, dan analisis pasar finansial dari Maulana Ihsan Rohim dalam satu halaman.",
    type: "website",
    url: "/search",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Search",
      },
    ],
  },
};

const POPULAR_SEARCHES = ["Digital Marketing", "Photography", "Trading", "Next.js"];

type SearchResultGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  items: ResultItem[];
};

type ResultItem = {
  title: string;
  href: string;
  description: string;
  meta?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // ===== Fetch results when there's a query =====
  let groups: SearchResultGroup[] = [];
  let totalResults = 0;

  if (query) {
    // NOTE: `contains` di PostgreSQL default-nya case-sensitive.
    // mode: "insensitive" agar "fotografi" == "Fotografi" == "FOTOGRAFI".
    // Gunakan `query` (trimmed), bukan `q` mentah.
    // 2026-09-19: artikel market kini = post blog (kategori Financial Market,
    // hasil migrasi) — dicari lewat query `posts` ini (tanpa query terpisah)
    // dan TIDAK digated toggle market (artikel tetap bisa ditemukan).
    const [posts, portfolios, certificates, galleries] = await Promise.all([
      db.post.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: 10,
        orderBy: { publishedAt: "desc" },
      }),
      db.portfolio.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { client: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: 10,
        orderBy: { projectDate: "desc" },
      }),
      db.certificate.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { issuer: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { issueDate: "desc" },
      }),
      db.gallery.findMany({
        where: { title: { contains: query, mode: "insensitive" } },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const blogGroup: SearchResultGroup = {
      key: "blog",
      label: "Blog Posts",
      icon: FileText,
      accent: "from-amber-500 to-orange-500",
      items: posts.map((p) => ({
        title: p.title,
        href: `/blog/${p.slug}`,
        description: p.excerpt ?? truncate(stripHtml(p.content), 140),
        meta: p.publishedAt ? formatDate(p.publishedAt) : undefined,
      })),
    };

    const portfolioGroup: SearchResultGroup = {
      key: "portfolio",
      label: "Portfolio",
      icon: Briefcase,
      accent: "from-teal-500 to-emerald-500",
      items: portfolios.map((p) => ({
        title: p.title,
        href: `/portfolio/${p.slug}`,
        description: p.excerpt ?? truncate(p.description, 140),
        meta: [p.client, p.role].filter(Boolean).join(" • ") || undefined,
      })),
    };

    const certGroup: SearchResultGroup = {
      key: "certificates",
      label: "Certificates",
      icon: Award,
      accent: "from-violet-500 to-fuchsia-500",
      items: certificates.map((c) => ({
        title: c.title,
        href: `/certificates/${c.slug}`,
        description: c.description ?? `Diterbitkan oleh ${c.issuer}`,
        meta: c.issuer,
      })),
    };

    const galleryGroup: SearchResultGroup = {
      key: "gallery",
      label: "Gallery",
      icon: ImageIcon,
      accent: "from-rose-500 to-pink-500",
      items: galleries.map((g) => ({
        title: g.title,
        href: `/gallery`,
        description: g.description ?? truncate(g.title, 120),
        meta: g.album ?? g.type,
      })),
    };

    groups = [blogGroup, portfolioGroup, certGroup, galleryGroup].filter(
      (g) => g.items.length > 0,
    );
    totalResults = groups.reduce((acc, g) => acc + g.items.length, 0);
  }

  // ===== Recent content suggestions (no query) =====
  // Artikel market (kategori Financial Market) kini masuk lewat recentPosts
  // sebagai post biasa — saran market terpisah dihapus; toggle market tidak
  // memengaruhi saran artikel blog.
  const [recentPosts, recentPortfolios] = await Promise.all([
    db.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, publishedAt: true, coverImage: true },
    }),
    db.portfolio.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { projectDate: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, thumbnail: true, client: true },
    }),
  ]);

  return (
    <div className="relative">

      {/* ===== Results / Suggestions ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          {query ? (
            <>
              {/* Result summary */}
              <SectionReveal>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold sm:text-2xl">
                      Hasil untuk{" "}
                      <span className="text-gradient">&ldquo;{query}&rdquo;</span>
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {totalResults > 0
                        ? `${totalResults} hasil ditemukan dalam ${groups.length} kategori`
                        : "Tidak ada hasil yang cocok"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="glass">
                    <Link href="/search">
                      Pencarian Baru
                    </Link>
                  </Button>
                </div>
              </SectionReveal>

              {totalResults === 0 ? (
                // Empty result state
                <SectionReveal delay={0.1}>
                  <Card className="glass p-10 text-center sm:p-16">
                    <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-primary">
                      <FolderSearch className="size-8" />
                    </div>
                    <h2 className="text-xl font-bold sm:text-2xl">
                      Tidak ada hasil ditemukan
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                      Coba gunakan kata kunci yang berbeda atau lebih umum. Anda
                      juga bisa mengeksplorasi kategori di bawah ini.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <Button
                          key={term}
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <Link href={`/search?q=${encodeURIComponent(term)}`}>
                            <SearchIcon className="size-3.5" />
                            {term}
                          </Link>
                        </Button>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <Button asChild variant="outline" className="glass">
                        <Link href="/blog">Jelajahi Blog</Link>
                      </Button>
                      <Button asChild variant="outline" className="glass">
                        <Link href="/portfolio">Lihat Portofolio</Link>
                      </Button>
                    </div>
                  </Card>
                </SectionReveal>
              ) : (
                // Grouped results
                <div className="space-y-10">
                  {groups.map((group, gi) => (
                    <SectionReveal key={group.key} delay={gi * 0.05}>
                      <div>
                        {/* Group header */}
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md",
                              group.accent,
                            )}
                            aria-hidden
                          >
                            <group.icon className="size-5" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-sm font-bold sm:text-xl">
                              {group.label}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {group.items.length} hasil
                            </p>
                          </div>
                        </div>

                        {/* Result cards */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href + item.title}
                              href={item.href}
                              className="group glass lift block rounded-2xl p-5 transition-colors hover:bg-accent/40"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow",
                                    group.accent,
                                  )}
                                  aria-hidden
                                >
                                  <group.icon className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.meta && (
                                    <p className="mt-2 text-xs font-medium text-muted-foreground/80">
                                      {item.meta}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </SectionReveal>
                  ))}
                </div>
              )}
            </>
          ) : (
            // No query: suggestions
            <>
              <SectionReveal>
                <div className="mb-10 text-center">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Mulai Menjelajah
                  </h1>
                  <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                    Belum tahu apa yang dicari? Lihat konten terbaru saya di bawah
                    ini atau pilih dari pencarian populer.
                  </p>
                </div>
              </SectionReveal>

              {/* Grid saran: 2 kolom di layar besar (saran market terpisah
                  dihapus — artikel market kini bagian dari recentPosts) */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recent blog posts */}
                <SectionReveal>
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      <h2 className="font-bold">Artikel Blog Terbaru</h2>
                    </div>
                    <div className="space-y-3">
                      {recentPosts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada artikel.</p>
                      ) : (
                        recentPosts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/blog/${p.slug}`}
                            className="group glass lift block rounded-xl p-4 hover:bg-accent/40"
                          >
                            <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">
                              {p.title}
                            </h3>
                            {p.excerpt && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {p.excerpt}
                              </p>
                            )}
                            {p.publishedAt && (
                              <p className="mt-2 text-[11px] text-muted-foreground">
                                {formatDate(p.publishedAt)}
                              </p>
                            )}
                          </Link>
                        ))
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="mt-3">
                      <Link href="/blog">
                        Semua artikel
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </SectionReveal>

                {/* Recent portfolios */}
                <SectionReveal delay={0.1}>
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <Briefcase className="size-5 text-primary" />
                      <h2 className="font-bold">Portofolio Terbaru</h2>
                    </div>
                    <div className="space-y-3">
                      {recentPortfolios.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada proyek.</p>
                      ) : (
                        recentPortfolios.map((p) => (
                          <Link
                            key={p.id}
                            href={`/portfolio/${p.slug}`}
                            className="group glass lift block rounded-xl p-4 hover:bg-accent/40"
                          >
                            <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">
                              {p.title}
                            </h3>
                            {p.excerpt && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {p.excerpt}
                              </p>
                            )}
                            {p.client && (
                              <p className="mt-2 text-[11px] text-muted-foreground">
                                {p.client}
                              </p>
                            )}
                          </Link>
                        ))
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="mt-3">
                      <Link href="/portfolio">
                        Semua proyek
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </SectionReveal>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
