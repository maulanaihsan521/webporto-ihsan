import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Calendar,
  User,
  Eye,
  Star,
  Clock,
  CheckCircle2,
  Github,
  ExternalLink,
  Figma,
  Youtube,
  Download,
  Share2,
  Layers,
  Sparkles,
  Building2,
  Wrench,
  PlayCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import { ShareButtons } from "@/components/share-buttons";
import { PdfViewer } from "@/components/pdf-viewer";
import { RelatedProjectsCarousel } from "@/components/related-projects-carousel";
import { GalleryLightbox } from "./gallery-lightbox";
import { formatDate, formatDateShort, stripHtml, truncate, cn } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

// Build canonical URL from headers safely (server component)
function buildUrl(headers: Headers, slug: string): string {
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}/portfolio/${slug}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await db.portfolio.findUnique({
    where: { slug },
    include: { category: true, images: { orderBy: { order: "asc" } } },
  });

  if (!portfolio || portfolio.status !== "PUBLISHED") {
    return {
      title: "Portfolio Tidak Ditemukan — Maulana Ihsan Rohim",
    };
  }

  const title = portfolio.metaTitle || `${portfolio.title} — Portfolio`;
  const description =
    portfolio.metaDescription ||
    portfolio.excerpt ||
    truncate(stripHtml(portfolio.description), 160);
  const ogImage = portfolio.ogImage || portfolio.banner || portfolio.thumbnail || undefined;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/portfolio/${portfolio.slug}`,
      images: ogImage ? [{ url: ogImage, alt: portfolio.title }] : undefined,
      publishedTime: portfolio.createdAt.toISOString(),
      authors: ["Maulana Ihsan Rohim"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `/portfolio/${portfolio.slug}` },
  };
}

export default async function PortfolioDetailPage({ params }: Params) {
  const { slug } = await params;
  const settings = await getSettings();

  const portfolio = await db.portfolio.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!portfolio || portfolio.status !== "PUBLISHED") {
    notFound();
  }

  // increment view count (fire and forget)
  db.portfolio
    .update({ where: { id: portfolio.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // related portfolios in same category (exclude current)
  const related = portfolio.categoryId
    ? await db.portfolio.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: portfolio.categoryId,
          NOT: { id: portfolio.id },
        },
        take: 3,
        orderBy: { projectDate: "desc" },
        include: { category: true, images: true },
      })
    : [];

  // prev / next navigation by createdAt
  const [prev, next] = await Promise.all([
    db.portfolio.findFirst({
      where: { status: "PUBLISHED", createdAt: { lt: portfolio.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    db.portfolio.findFirst({
      where: { status: "PUBLISHED", createdAt: { gt: portfolio.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  const reqHeaders = await headers();
  const shareUrl = buildUrl(reqHeaders, portfolio.slug);

  const technologies = (portfolio.technologies ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const banner = portfolio.banner || portfolio.thumbnail || portfolio.images[0]?.url || null;
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";

  const projectLinks = [
    { key: "demo", label: "Live Demo", icon: ExternalLink, url: portfolio.demoUrl, accent: "from-primary to-chart-2" },
    { key: "github", label: "Source Code", icon: Github, url: portfolio.githubUrl, accent: "from-foreground to-foreground/70" },
    { key: "figma", label: "Figma", icon: Figma, url: portfolio.figmaUrl, accent: "from-fuchsia-500 to-pink-500" },
    { key: "youtube", label: "YouTube", icon: Youtube, url: portfolio.youtubeUrl, accent: "from-rose-500 to-red-500" },
    { key: "download", label: "Download", icon: Download, url: portfolio.downloadUrl, accent: "from-emerald-500 to-teal-500" },
  ].filter((l) => !!l.url);

  return (
    <article className="relative">
      {/* ===== Breadcrumb ===== */}
      <div className="section-pad pt-6">
        <nav aria-label="breadcrumb" className="mx-auto max-w-7xl">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Beranda
              </Link>
            </li>
            <li className="text-muted-foreground/60">/</li>
            <li>
              <Link href="/portfolio" className="transition-colors hover:text-foreground">
                Portfolio
              </Link>
            </li>
            <li className="text-muted-foreground/60">/</li>
            <li className="max-w-[60vw] truncate font-medium text-foreground" aria-current="page">
              {portfolio.title}
            </li>
          </ol>
        </nav>
      </div>

      {/* ===== Banner ===== */}
      <section className="section-pad pt-6">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
                {banner ? (
                  <img
                    src={banner}
                    alt={portfolio.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 via-chart-2/30 to-chart-3/30">
                    <Briefcase className="size-16 text-foreground/40" />
                  </div>
                )}
                {/* gradient overlay for legibility */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20"
                  aria-hidden
                />
                {/* Mesh accents */}
                <div className="mesh-bg opacity-50" aria-hidden />

                {/* Title overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                  <div className="max-w-3xl">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {portfolio.category && (
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur">
                          <Layers className="size-3" />
                          {portfolio.category.name}
                        </Badge>
                      )}
                      {portfolio.featured && (
                        <Badge className="bg-amber-500/95 text-white backdrop-blur">
                          <Star className="size-3 fill-current" />
                          Unggulan
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                      {portfolio.title}
                    </h1>
                    {portfolio.excerpt && (
                      <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
                        {stripHtml(portfolio.excerpt)}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80 sm:text-sm">
                      {portfolio.client && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-4" />
                          {portfolio.client}
                        </span>
                      )}
                      {portfolio.role && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="size-4" />
                          {portfolio.role}
                        </span>
                      )}
                      {portfolio.projectDate && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          {formatDate(portfolio.projectDate)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="size-4" />
                        {portfolio.viewCount.toLocaleString("id-ID")} views
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Body ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_320px]">
          {/* ===== Main Content ===== */}
          <div className="min-w-0 space-y-10">
            {/* Project links */}
            {projectLinks.length > 0 && (
              <SectionReveal>
                <div className="flex flex-wrap gap-2">
                  {projectLinks.map((l) => {
                    const isPdf = typeof l.url === "string" && l.url.toLowerCase().endsWith(".pdf");
                    if (isPdf) {
                      return (
                        <PdfViewer
                          key={l.key}
                          url={l.url as string}
                          title={`${portfolio.title} - ${l.label}`}
                          trigger={
                            <button className={cn(
                              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity bg-gradient-to-r",
                              l.accent
                            )}>
                              <l.icon className="size-4" />
                              {l.label}
                            </button>
                          }
                        />
                      );
                    }
                    return (
                      <Button
                        key={l.key}
                        asChild
                        size="sm"
                        className={cn(
                          "rounded-full bg-gradient-to-r text-white shadow-sm hover:opacity-90",
                          l.accent,
                        )}
                      >
                        <a href={l.url as string} target="_blank" rel="noopener noreferrer">
                          <l.icon className="size-4" />
                          {l.label}
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </SectionReveal>
            )}

            {/* Description */}
            <SectionReveal>
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-chart-2" />
                  Deskripsi Proyek
                </h2>
                <div
                  className="prose-content max-w-none text-[15px] text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: portfolio.description }}
                />
              </div>
            </SectionReveal>

            {/* Technologies */}
            {technologies.length > 0 && (
              <SectionReveal>
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                    <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-chart-2" />
                    Teknologi &amp; Tools
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="gap-1.5 rounded-full bg-card/60 px-3 py-1 text-sm backdrop-blur"
                      >
                        <Sparkles className="size-3.5 text-primary" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </SectionReveal>
            )}

            {/* Gallery */}
            {portfolio.images.length > 0 && (
              <SectionReveal>
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                    <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-chart-2" />
                    Galeri Proyek
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {portfolio.images.length} gambar
                    </Badge>
                  </h2>
                  <GalleryLightbox
                    images={portfolio.images.map((img) => ({
                      id: img.id,
                      url: img.url,
                      caption: img.caption,
                      order: img.order,
                    }))}
                  />
                </div>
              </SectionReveal>
            )}

            {/* Video */}
            {portfolio.videoUrl && (
              <SectionReveal>
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                    <span className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-chart-2" />
                    Video Proyek
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-border bg-black">
                    <div className="relative aspect-video w-full">
                      <a
                        href={portfolio.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group absolute inset-0 flex items-center justify-center"
                      >
                        {portfolio.thumbnail && (
                          <img
                            src={portfolio.thumbnail}
                            alt="Video thumbnail"
                            className="size-full object-cover opacity-70 transition-opacity group-hover:opacity-50"
                          />
                        )}
                        <span className="relative z-10 flex size-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-110">
                          <PlayCircle className="size-10" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            )}

            {/* Share */}
            <SectionReveal>
              <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Share2 className="size-4 text-primary" />
                    Bagikan Proyek Ini
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sebarkan karya ini ke jaringan Anda.
                  </p>
                </div>
                <ShareButtons url={shareUrl} title={portfolio.title} description={portfolio.excerpt ?? undefined} />
              </div>
            </SectionReveal>
          </div>

          {/* ===== Sidebar ===== */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <SectionReveal delay={0.1}>
              <Card className="glass-strong p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-bold">
                  <Briefcase className="size-4 text-primary" />
                  Detail Proyek
                </h3>

                <dl className="space-y-4 text-sm">
                  <SidebarRow icon={Building2} label="Klien" value={portfolio.client ?? "Personal Project"} />
                  <SidebarRow icon={User} label="Peran" value={portfolio.role ?? "-"} />
                  <SidebarRow
                    icon={CheckCircle2}
                    label="Status"
                    value={
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Published
                      </Badge>
                    }
                  />
                  {portfolio.projectDate && (
                    <SidebarRow icon={Calendar} label="Tanggal Proyek" value={formatDate(portfolio.projectDate)} />
                  )}
                  {portfolio.startDate && (
                    <SidebarRow icon={Clock} label="Mulai" value={formatDateShort(portfolio.startDate)} />
                  )}
                  {portfolio.endDate && (
                    <SidebarRow icon={Clock} label="Selesai" value={formatDateShort(portfolio.endDate)} />
                  )}
                  <SidebarRow icon={Eye} label="Total Views" value={`${portfolio.viewCount.toLocaleString("id-ID")} kali`} />
                  {portfolio.category && (
                    <SidebarRow
                      icon={Layers}
                      label="Kategori"
                      value={
                        <Link
                          href={`/portfolio`}
                          className="text-primary hover:underline"
                        >
                          {portfolio.category.name}
                        </Link>
                      }
                    />
                  )}
                </dl>

                {/* Technologies in sidebar */}
                {technologies.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Wrench className="size-3.5" />
                      Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {technologies.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Tertarik bekerja sama dengan saya?
                  </p>
                  <Button asChild className="w-full rounded-full">
                    <Link href="/contact">
                      <Sparkles className="size-4" />
                      Hubungi Saya
                    </Link>
                  </Button>
                </div>
              </Card>
            </SectionReveal>

            {/* Author card */}
            <SectionReveal delay={0.15}>
              <Card className="glass mt-4 p-6">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Oleh
                </p>
                <p className="text-base font-bold">{ownerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {settings.owner_profession}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/about">
                      <User className="size-3.5" />
                      Profil
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/portfolio">
                      <Briefcase className="size-3.5" />
                      Portfolio
                    </Link>
                  </Button>
                </div>
              </Card>
            </SectionReveal>
          </aside>
        </div>
      </section>

      {/* ===== Prev / Next ===== */}
      {(prev || next) && (
        <section className="section-pad pb-8">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="grid gap-4 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/portfolio/${prev.slug}`}
                    className="group glass flex items-center gap-3 rounded-2xl p-4 lift"
                  >
                    <ArrowLeft className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Proyek Sebelumnya
                      </p>
                      <p className="truncate text-sm font-semibold">{prev.title}</p>
                    </div>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/portfolio/${next.slug}`}
                    className="group glass flex items-center justify-end gap-3 rounded-2xl p-4 text-right lift"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Proyek Berikutnya
                      </p>
                      <p className="truncate text-sm font-semibold">{next.title}</p>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ===== Related Projects Carousel ===== */}
      {related.length > 0 && (
        <section className="section-pad py-12 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-8 text-center">
                <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                  <Sparkles className="mr-1.5 size-3.5 text-primary" />
                  Proyek Terkait
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Karya <span className="text-gradient">Serupa</span>
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                  Proyek lain dalam kategori {portfolio.category?.name}.
                </p>
              </div>
            </SectionReveal>

            <RelatedProjectsCarousel projects={related.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              excerpt: p.excerpt,
              description: p.description,
              thumbnail: p.thumbnail,
              banner: p.banner,
              featured: p.featured,
              category: p.category,
              images: p.images,
            }))} />
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
                <Briefcase className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin proyek <span className="text-gradient">seperti ini?</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya siap membantu mewujudkan proyek impian Anda. Mari diskusikan
                  kebutuhan dan ide Anda lebih lanjut.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Mulai Proyek
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/portfolio">
                      <Briefcase className="size-4" />
                      Portfolio Lainnya
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

function SidebarRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
