import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import type { Metadata } from "next";
import { ArrowRight,
  ArrowLeft,
  Newspaper,
  Calendar,
  Eye,
  Star,
  Clock,
  Hash,
  ChevronRight,
  Home,
  PenLine,
  Tag as TagIcon,
  Layers,
  TrendingUp,
  User,
  Mail,
  FileText,
  ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL, SITE_CONFIG } from "@/lib/site-config";
import { siteOriginFromHeaders } from "@/lib/server-site-config";
import { ogImageFor, absoluteOgImage, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/lib/og-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import { ReadingProgress } from "@/components/reading-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { ShareButtons } from "@/components/share-buttons";
import { PdfViewer } from "@/components/pdf-viewer";
import { PdfLinkExtractor } from "@/components/pdf-link-extractor";
import { OptimizedImage } from "@/components/optimized-image";
import { formatDate,
  formatDateShort,
  stripHtml,
  truncate,
  getInitials,
  isSafeHttpUrl,
  cn, safeJsonLd } from "@/lib/utils";
import { CommentsSection,
  type CommentItem,
  type CommentReplyItem } from "./comments-section";
import { sanitizeHtml, wrapResponsiveTables } from "@/lib/sanitize-html";

// DRAFT SELALU TERSEMBUNYI DARI PUBLIK (update Task 17, request user
// 2026-09-28: "yang di draft jangan ditampilkan ke publik"):
// Halaman detail blog TIDAK PERNAH merender draft — di dev, preview sandbox,
// mapupun produksi. URL draft selalu 404 + noindex. Review draft dilakukan
// lewat dashboard admin (Blog Posts → Edit → tombol Preview), lalu publish
// dari sana saat sudah siap.

type Params = { params: Promise<{ slug: string }> };

// Satu fetch di-cache per request — dipakai bersama oleh generateMetadata
// DAN halaman. Tanpa cache(), artikel yang sama di-query 2x (duplikat
// roundtrip DB lintas-region: Vercel → Supabase Singapura).
const getPost = cache(async (slug: string) =>
  db.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, image: true, bio: true } },
      category: true,
      tags: true,
    },
  }),
);

// URL kanonik artikel — SELALU domain produksi (Task 14); host request hanya
// dipakai saat dev lokal. Anti host-spoofing: host apa pun tak masuk URL publik.
function buildUrl(headers: Headers, slug: string): string {
  return `${siteOriginFromHeaders(headers)}/blog/${slug}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    return {
      title: { absolute: "Artikel Tidak Ditemukan — Maulana Ihsan Rohim" },
      // noindex: beberapa URL draft pernah terindeks (via domain lama vercel.app)
      // — bantu Google drop cepat dengan robots meta eksplisit.
      robots: { index: false, follow: false },
    };
  }

  // metaTitle dari author dipakai APA ADANYA (absolute) — hindari duplikasi
  // suffix brand karena root layout menerapkan template "%s | <site name>"
  // (mis. metaTitle "... — Maulana Ihsan Rohim" + template → nama muncul 2x).
  const fallbackTitle = `${post.title} — Blog`;
  const title = post.metaTitle ?? fallbackTitle;
  // Deskripsi satu baris rapi (excerpt bisa mengandung newline → meta tag
  // terpecah multi-baris di HTML, jelek di snippet share).
  const description = (
    post.metaDescription ?? post.excerpt ?? truncate(stripHtml(post.content), 160)
  )
    .replace(/\s+/g, " ")
    .trim();
  // og:image: ogImage/cover (proxy terkompresi utk WhatsApp) → default situs.
  // RELATIVE path → di-resolve metadataBase (domain runtime, bukan domain lama
  // dari env build-time yang menjawab redirect 308).
  const ogImage = ogImageFor(post.ogImage ?? post.coverImage);
  const canonical = post.canonical ?? `/blog/${post.slug}`;

  return {
    title: post.metaTitle ? { absolute: post.metaTitle } : title,
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
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: title,
        },
      ],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date(post.createdAt).toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: undefined,
    },
    twitter: {
      // Kartu besar selalu tersedia — ogImage kini selalu terisi (default/proxy)
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) notFound();

  // Increment viewCount (fire and forget)
  db.post
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // Paralelkan SEMUA query dalam 1 batch — termasuk kandidat backfill
  // related dan settings (sebelumnya 2 query tambahan berurutan setelahnya).
  const postDate = post.publishedAt ?? post.createdAt;
  const [rawComments, relatedRaw, latestOthers, prev, next, settings] =
    await Promise.all([
      // Komentar approved beserta balasan approved-nya (1 level)
      db.comment.findMany({
        where: { postId: post.id, approved: true, parentId: null },
        include: {
          replies: {
            where: { approved: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      // Related posts — kategori sama, kecuali artikel ini, ambil 3
      post.categoryId != null
        ? db.post.findMany({
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
        : Promise.resolve([]),
      // Kandidat backfill: artikel terbaru lain (diambil paralel — menggantikan
      // query lanjutan kondisional yang tadinya berurutan)
      db.post.findMany({
        where: {
          published: true,
          NOT: { id: post.id },
        },
        include: {
          author: { select: { name: true, image: true } },
          category: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      // Prev / next post by publishedAt (or createdAt fallback)
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
      // Settings (owner photo) — ikut batch, punya TTL cache sendiri
      getSettings(),
    ]);

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

  // Related final: kategori sama dulu, kekurangan diisi artikel terbaru lain
  // (digabung lokal — tanpa query tambahan).
  const seenIds = new Set(relatedRaw.map((r) => r.id));
  const relatedList = [
    ...relatedRaw,
    ...latestOthers.filter((r) => !seenIds.has(r.id)),
  ].slice(0, 3);

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
  // Foto penulis: User.image → fallback owner_photo dari settings
  // (situs personal satu penulis; owner_photo dikelola di admin).
  const ownerPhoto = settings.owner_photo?.trim() || null;
  const authorImage = post.author?.image?.trim() || ownerPhoto;
  const authorBio = post.author?.bio ?? null;

  // JSON-LD BlogPosting — structured data untuk rich result Google
  // (author, tanggal terbit/modifikasi, gambar, canonical).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: truncate(post.title, 110),
    description: truncate(
      (post.metaDescription || post.excerpt || stripHtml(post.content))
        .replace(/\s+/g, " ")
        .trim(),
      300,
    ),
    // Absolut via canonicalUrl (JSON-LD tidak di-resolve metadataBase).
    // Pakai proxy terkompresi juga supaya konsisten dengan og:image.
    image: [absoluteOgImage(ogImageFor(coverImage), canonicalUrl)],
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: authorName,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.metaKeywords || undefined,
    inLanguage: "id-ID",
    wordCount: stripHtml(post.content)
      .split(/\s+/)
      .filter(Boolean).length,
  };

  // Link dokumen asli (Google Drive / PDF) — tombol "Lihat Dokumen".
  // Validasi scheme http/https (defense-in-depth vs javascript:/data: XSS).
  const documentUrl =
    isSafeHttpUrl(post.documentUrl?.trim() || null)
      ? (post.documentUrl as string).trim()
      : null;
  const isDocPdf =
    !!documentUrl &&
    documentUrl.toLowerCase().split("#")[0].split("?")[0].endsWith(".pdf");

  return (
    <article className="relative">
      <ReadingProgress targetSelector="article" />
      {/* Structured data: BlogPosting (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }}
      />
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
        <div className="section-pad relative z-10 py-8 sm:py-10 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {post.category && (
              <SectionReveal>
                <Link
                  href={`/blog?cat=${post.category.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Layers className="size-3.5" />
                  {post.category.name}
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
                {(post.publishedAt || post.createdAt) && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(post.publishedAt ?? post.createdAt)}
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
                <OptimizedImage
                  src={coverImage}
                  alt={post.title}
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="size-full object-cover"
                  priority
                />
              </div>
            </div>
          </SectionReveal>
        </div>
      )}

      {/* ===== Article body + sticky sidebar ===== */}
      <div className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Main column */}
            <div className="min-w-0">
              <SectionReveal>
                <div
                  className="prose-content mx-auto max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: wrapResponsiveTables(sanitizeHtml(post.content)) }}
                />
                {/* PDF Viewer — show if content contains PDF links */}
                <PdfLinkExtractor content={post.content} title={post.title} />
              </SectionReveal>

              {/* ===== Kartu dokumen asli — tombol "Lihat Dokumen" ===== */}
              {documentUrl && (
                <SectionReveal delay={0.05}>
                  <div className="mx-auto mt-10 max-w-3xl">
                    <div className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold sm:text-base">
                            Dokumen asli tersedia
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            Lihat dokumen lengkap dari artikel ini (Google Drive / PDF).
                          </p>
                        </div>
                      </div>
                      {isDocPdf ? (
                        <PdfViewer
                          url={documentUrl}
                          title={`${post.title} — Dokumen`}
                          trigger={
                            <Button className="shrink-0 rounded-full bg-primary text-white shadow-sm hover:opacity-90">
                              <ExternalLink className="size-4" />
                              Lihat Dokumen
                            </Button>
                          }
                        />
                      ) : (
                        <Button
                          asChild
                          className="shrink-0 rounded-full bg-primary text-white shadow-sm hover:opacity-90"
                        >
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Lihat dokumen asli artikel ini"
                          >
                            <ExternalLink className="size-4" />
                            Lihat Dokumen
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </SectionReveal>
              )}

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
                          <PenLine className="size-3.5 text-primary" />
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

                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-5">
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
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-8 text-center">
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <img
                  src="/images/mascots/mascot-plan.webp"
                  alt="Maskot menyusun strategi konten — mari konsultasi konten strategis"
                  width={64}
                  height={64}
                  loading="lazy"
                  className="mx-auto mb-4 size-16 object-contain drop-shadow-lg"
                />
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
      className="inline-flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-2 ring-background"
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
  const gradient = "bg-primary";
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
                "flex size-full items-center justify-center bg-primary/10",
                gradient,
              )}
            >
              <Newspaper className="size-10 text-white/80" />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-black/60 opacity-70"
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
