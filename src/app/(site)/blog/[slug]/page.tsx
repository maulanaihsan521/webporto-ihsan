import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowLeft,
  Newspaper,
  Calendar,
  Eye,
  Star,
  Clock,
  Sparkles,
  Hash,
  ChevronRight,
  Home,
  PenLine,
  Tag as TagIcon,
  Layers,
  TrendingUp,
  User,
  Mail,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import { ReadingProgress } from "@/components/reading-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { ShareButtons } from "@/components/share-buttons";
import { PdfViewer } from "@/components/pdf-viewer";
import { PdfLinkExtractor } from "@/components/pdf-link-extractor";
import {
  formatDate,
  formatDateShort,
  stripHtml,
  truncate,
  getInitials,
  cn,
} from "@/lib/utils";
import {
  CommentsSection,
  type CommentItem,
  type CommentReplyItem,
} from "./comments-section";

type Params = { params: Promise<{ slug: string }> };

// Build canonical URL from headers safely (server component)
function buildUrl(headers: Headers, slug: string): string {
  const host =
    headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}/blog/${slug}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true } }, category: true },
  });

  if (!post || !post.published) {
    return {
      title: "Artikel Tidak Ditemukan — Maulana Ihsan Rohim",
    };
  }

  const title = post.metaTitle ?? `${post.title} — Blog`;
  const description =
    post.metaDescription ?? post.excerpt ?? truncate(stripHtml(post.content), 160);
  const ogImage = post.ogImage ?? post.coverImage ?? undefined;
  const canonical = post.canonical ?? `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: post.metaKeywords
      ? post.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date(post.createdAt).toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: Params) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, image: true, bio: true } },
      category: true,
      tags: true,
    },
  });

  if (!post || !post.published) notFound();

  // Increment viewCount (fire and forget)
  db.post
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // Fetch approved comments with their approved replies (1 level)
  const rawComments = await db.comment.findMany({
    where: { postId: post.id, approved: true, parentId: null },
    include: {
      replies: {
        where: { approved: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Map to client-safe shapes (strip email)
  const comments: CommentItem[] = rawComments.map((c) => ({
    id: c.id,
    name: c.name,
    content: c.content,
    parentId: c.parentId,
    postId: c.postId,
    createdAt: c.createdAt.toISOString(),
    replies: (c.replies ?? []).map(
      (r): CommentReplyItem => ({
        id: r.id,
        name: r.name,
        content: r.content,
        parentId: r.parentId,
        postId: r.postId,
        createdAt: r.createdAt.toISOString(),
      }),
    ),
  }));

  // Related posts — same category, exclude current, take 3
  const relatedRaw =
    post.categoryId != null
      ? await db.post.findMany({
          where: {
            published: true,
            categoryId: post.categoryId,
            NOT: { id: post.id },
          },
          include: {
            author: { select: { name: true, image: true } },
            category: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 3,
        })
      : [];

  // Backfill with latest posts from other categories if not enough
  let relatedList = relatedRaw;
  if (relatedList.length < 3) {
    const extra = await db.post.findMany({
      where: {
        published: true,
        NOT: { id: post.id },
        id: { notIn: relatedList.map((r) => r.id) },
      },
      include: {
        author: { select: { name: true, image: true } },
        category: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 3 - relatedList.length,
    });
    relatedList = [...relatedList, ...extra];
  }

  // Prev / next post by publishedAt (or createdAt fallback)
  const postDate = post.publishedAt ?? post.createdAt;
  const [prev, next] = await Promise.all([
    db.post.findFirst({
      where: {
        published: true,
        NOT: { id: post.id },
        OR: [
          { publishedAt: { lt: postDate } },
          { publishedAt: null, createdAt: { lt: post.createdAt } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
    db.post.findFirst({
      where: {
        published: true,
        NOT: { id: post.id },
        OR: [
          { publishedAt: { gt: postDate } },
          { publishedAt: null, createdAt: { gt: post.createdAt } },
        ],
      },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  // Canonical URL for share buttons
  const h = await headers();
  const canonicalUrl = buildUrl(h, post.slug);

  // Reading time (fallback if not precomputed)
  const readMins =
    post.readingTime > 0
      ? post.readingTime
      : Math.max(
          1,
          Math.ceil(stripHtml(post.content).split(/\s+/).length / 200),
        );

  const coverImage = post.coverImage || post.ogImage || null;
  const authorName = post.author?.name ?? "Anonim";
  const authorImage = post.author?.image ?? null;
  const authorBio = post.author?.bio ?? null;

  return (
    <article className="relative">
      <ReadingProgress targetSelector="article" />
      {/* ===== Breadcrumb ===== */}
      <div className="border-b border-border bg-background/60 backdrop-blur">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3 text-xs text-muted-foreground sm:px-6"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <ChevronRight className="size-3" />
          <span className="line-clamp-1 max-w-[60vw] text-foreground">
            {post.title}
          </span>
        </nav>
      </div>

      {/* ===== Article header ===== */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="animated-gradient absolute inset-0 -z-10 opacity-30" aria-hidden />
        <div className="mesh-bg absolute inset-0 -z-10 opacity-50" aria-hidden />
        <div className="section-pad relative z-10 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {post.category && (
              <SectionReveal>
                <Link href={`/blog?cat=${post.category.id}`}>
                  <Badge
                    variant="outline"
                    className="mb-5 glass px-3 py-1 text-xs uppercase tracking-wider"
                  >
                    <Layers className="mr-1.5 size-3 text-primary" />
                    {post.category.name}
                  </Badge>
                </Link>
              </SectionReveal>
            )}
            <SectionReveal delay={0.05}>
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
            </SectionReveal>
            {post.excerpt && (
              <SectionReveal delay={0.1}>
                <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  {stripHtml(post.excerpt)}
                </p>
              </SectionReveal>
            )}

            {/* Meta row */}
            <SectionReveal delay={0.15}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                {/* Author */}
                <span className="inline-flex items-center gap-2">
                  <AuthorAvatar
                    name={authorName}
                    image={authorImage}
                    size={28}
                  />
                  <span className="font-medium text-foreground/80">{authorName}</span>
                </span>
                {post.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(post.publishedAt)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {readMins} menit baca
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {post.viewCount.toLocaleString("id-ID")} views
                </span>
              </div>
            </SectionReveal>
          </div>
        </div>
      </header>

      {/* ===== Cover image ===== */}
      {coverImage && (
        <div className="section-pad pt-8 sm:pt-12">
          <SectionReveal>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border shadow-lg">
              <div className="relative aspect-[16/9]">
                <img
                  src={coverImage}
                  alt={post.title}
                  className="size-full object-cover"
                />
              </div>
            </div>
          </SectionReveal>
        </div>
      )}

      {/* ===== Article body + sticky sidebar ===== */}
      <div className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Main column */}
            <div className="min-w-0">
              <SectionReveal>
                <div
                  className="prose-content mx-auto max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                {/* PDF Viewer — show if content contains PDF links */}
                <PdfLinkExtractor content={post.content} title={post.title} />
              </SectionReveal>

              {/* Tags */}
              {post.tags.length > 0 && (
                <SectionReveal delay={0.1}>
                  <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center gap-2 border-t border-border pt-6">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <TagIcon className="size-3.5" />
                      Tag:
                    </span>
                    {post.tags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        <Hash className="size-2.5" />
                        {t.name}
                      </span>
                    ))}
                  </div>
                </SectionReveal>
              )}

              {/* Share row */}
              <SectionReveal delay={0.15}>
                <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/40 p-4">
                  <div>
                    <p className="text-sm font-semibold">Bagikan artikel ini</p>
                    <p className="text-xs text-muted-foreground">
                      Bantu teman Anda menemukan konten ini.
                    </p>
                  </div>
                  <ShareButtons url={canonicalUrl} title={post.title} variant="compact" />
                </div>
              </SectionReveal>

              {/* Author card */}
              <SectionReveal delay={0.2}>
                <div className="mx-auto mt-8 max-w-3xl">
                  <Card className="glass-strong p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <AuthorAvatar
                        name={authorName}
                        image={authorImage}
                        size={56}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PenLine className="size-4 text-primary" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Ditulis oleh
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-bold">{authorName}</h3>
                        {authorBio && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {truncate(stripHtml(authorBio), 240)}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href="/about">
                              <Sparkles className="size-3.5" />
                              Tentang Saya
                            </Link>
                          </Button>
                          <Button asChild size="sm" className="rounded-full">
                            <Link href="/contact">
                              Hubungi
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </SectionReveal>

              {/* Comments */}
              <div className="mx-auto mt-12 max-w-3xl">
                <SectionReveal delay={0.1}>
                  <CommentsSection postId={post.id} initialComments={comments} />
                </SectionReveal>
              </div>
            </div>

            {/* Sidebar (sticky) — share + quick actions */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <TableOfContents contentHtml={post.content} />
                <Card className="glass p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bagikan
                  </h3>
                  <ShareButtons
                    url={canonicalUrl}
                    title={post.title}
                    variant="compact"
                    className="flex-col"
                  />
                </Card>

                {post.category && (
                  <Card className="glass p-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Kategori
                    </h3>
                    <Link
                      href="/blog"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Layers className="size-3.5" />
                      {post.category.name}
                    </Link>
                  </Card>
                )}

                <Card className="glass p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Statistik
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="size-3.5" /> Views
                      </span>
                      <span className="font-semibold tabular-nums">
                        {post.viewCount.toLocaleString("id-ID")}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" /> Baca
                      </span>
                      <span className="font-semibold tabular-nums">
                        {readMins} mnt
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquareMini /> Komentar
                      </span>
                      <span className="font-semibold tabular-nums">
                        {comments.reduce(
                          (acc, c) => acc + 1 + (c.replies?.length ?? 0),
                          0,
                        )}
                      </span>
                    </li>
                  </ul>
                </Card>

                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-5">
                  <TrendingUp className="mb-2 size-6 text-primary" />
                  <p className="text-sm font-semibold">Suka dengan artikel ini?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Baca artikel lainnya atau berlangganan newsletter.
                  </p>
                  <Button asChild size="sm" className="mt-4 w-full rounded-full">
                    <Link href="/blog">Lihat Semua</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ===== Author Bio Card ===== */}
      <section className="section-pad pb-12">
        <div className="mx-auto max-w-3xl">
          <SectionReveal>
            <Card className="glass-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="shrink-0">
                  <AuthorAvatar name={authorName} image={authorImage} size={80} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Penulis</p>
                  <h3 className="text-xl font-bold tracking-tight">{authorName}</h3>
                  {authorBio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{authorBio}</p>}
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    <Link href="/about" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <User className="size-3.5" /> Lihat Profil
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
                      <Mail className="size-3.5" /> Hubungi
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Prev / Next navigation ===== */}
      {(prev || next) && (
        <section className="section-pad pb-8">
          <div className="mx-auto max-w-5xl">
            <SectionReveal>
              <div className="grid gap-4 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/blog/${prev.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <ArrowLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sebelumnya
                      </p>
                      <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                        {prev.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}
                {next ? (
                  <Link
                    href={`/blog/${next.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 text-right transition-colors hover:border-primary/40 hover:bg-accent sm:flex-row-reverse"
                  >
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Berikutnya
                      </p>
                      <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
                        {next.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ===== Related posts ===== */}
      {relatedList.length > 0 && (
        <section className="section-pad py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-8 text-center">
                <Badge
                  variant="outline"
                  className="mb-3 text-xs uppercase tracking-wider"
                >
                  <Sparkles className="mr-1.5 size-3.5 text-primary" />
                  Baca Juga
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Artikel <span className="text-gradient">Terkait</span>
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                  Artikel lain yang mungkin Anda sukai berdasarkan kategori
                  dan topik serupa.
                </p>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedList.map((r) => (
                  <RelatedCard key={r.id} post={r} />
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ===== Final CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Newspaper className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin konsultasi <span className="text-gradient">konten strategis?</span>
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
                    <Link href="/blog">
                      <Sparkles className="size-4" />
                      Semua Artikel
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </article>
  );
}

// ===== Sub-components =====

function AuthorAvatar({
  name,
  image,
  size = 40,
}: {
  name: string;
  image: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-background"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 font-semibold text-primary-foreground ring-2 ring-background"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(name) || "?"}
    </span>
  );
}

function MessageSquareMini() {
  // Tiny inline icon to avoid an extra lucide import
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RelatedCard({
  post,
}: {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    viewCount: number;
    category: { name: string; slug: string } | null;
    author: { name: string | null; image: string | null } | null;
  };
}) {
  const gradient = "from-primary to-chart-2";
  const cover = post.coverImage || null;
  const authorName = post.author?.name ?? "Anonim";
  const authorImage = post.author?.image ?? null;

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="glass relative flex h-full flex-col overflow-hidden p-0 lift">
        <div className="relative aspect-[16/10] overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={post.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center bg-gradient-to-br",
                gradient,
              )}
            >
              <Newspaper className="size-10 text-white/80" />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70"
            aria-hidden
          />
          {post.category && (
            <div className="absolute right-3 top-3">
              <Badge
                variant="secondary"
                className="border-0 bg-black/40 text-white backdrop-blur-md"
              >
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
              {truncate(stripHtml(post.excerpt), 100)}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <AuthorAvatar name={authorName} image={authorImage} size={20} />
              <span className="truncate font-medium text-foreground/80">
                {authorName}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Calendar className="size-3" />
              {formatDateShort(post.publishedAt ?? post.createdAt)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
