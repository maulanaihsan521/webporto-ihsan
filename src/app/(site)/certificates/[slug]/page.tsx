import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import type { Metadata } from "next";
import { ArrowRight,
  ArrowLeft,
  Award,
  BadgeCheck,
  Calendar,
  Building2,
  Download,
  ExternalLink,
  Share2,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  FileText } from "lucide-react";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-config";
import { ogImageFor, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/lib/og-image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { ShareButtons } from "@/components/share-buttons";
import { formatDate, stripHtml, cn, truncate, safeJsonLd } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

// Satu fetch di-cache per request — dipakai bersama generateMetadata DAN
// halaman (sebelumnya sertifikat yang sama di-query 2x → roundtrip ganda).
const getCertificate = cache(async (slug: string) =>
  db.certificate.findUnique({
    where: { slug },
    include: { category: true },
  }),
);

// Build canonical/share URL from headers safely (server component).
// Fallback ke SITE_URL (production domain) supaya tidak pernah bocor localhost.
function buildUrl(headers: Headers, slug: string): string {
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}/certificates/${slug}`;
  }
  // Fallback: SITE_URL dari env (akan resolve ke https://portofoliomaulanaihsan.my.id)
  return `${SITE_URL}/certificates/${slug}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const certificate = await getCertificate(slug);

  if (!certificate) {
    return {
      title: { absolute: "Sertifikat Tidak Ditemukan — Maulana Ihsan Rohim" },
      // noindex: URL sertifikat terhapus pernah terindeks — bantu Google drop.
      robots: { index: false, follow: false },
    };
  }

  const title = `${certificate.title} — Sertifikat`;
  const description =
    certificate.description ??
    `Sertifikat ${certificate.title} dari ${certificate.issuer}, diterbitkan ${formatDate(
      certificate.issueDate,
    )}.`;
  // og:image: foto sertifikat (proxy terkompresi utk WhatsApp) → default situs
  const ogImage = ogImageFor(certificate.imageUrl);

  return {
    title,
    description,
    alternates: {
      canonical: `/certificates/${certificate.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/certificates/${certificate.slug}`,
      siteName: "Maulana Ihsan Rohim",
      images: [
        {
          url: ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: certificate.title,
        },
      ],
      publishedTime: new Date(certificate.issueDate).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CertificateDetailPage({ params }: Params) {
  const { slug } = await params;
  const certificate = await getCertificate(slug);

  if (!certificate) notFound();

  // Semua query paralel dalam 1 batch: related kategori sama + kandidat
  // backfill terbaru + headers (sebelumnya berurutan → roundtrip ganda).
  const [related, latestOthers, reqHeaders] = await Promise.all([
    certificate.categoryId != null
      ? db.certificate.findMany({
          where: {
            categoryId: certificate.categoryId,
            id: { not: certificate.id },
          },
          include: { category: true },
          orderBy: { issueDate: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    db.certificate.findMany({
      where: { id: { not: certificate.id } },
      include: { category: true },
      orderBy: { issueDate: "desc" },
      take: 3,
    }),
    headers(),
  ]);

  // Related final: kategori sama dulu, kekurangan diisi terbaru lain
  // (digabung lokal — tanpa query tambahan).
  const seenIds = new Set(related.map((r) => r.id));
  const relatedList = [
    ...related,
    ...latestOthers.filter((r) => !seenIds.has(r.id)),
  ].slice(0, 3);

  const shareUrl = buildUrl(reqHeaders, certificate.slug);

  const isExpired =
    certificate.expiryDate &&
    new Date(certificate.expiryDate).getTime() < Date.now();

  const preview = certificate.imageUrl || certificate.fileUrl || null;
  const isPdf = certificate.fileUrl?.toLowerCase().endsWith(".pdf") ?? false;

  // JSON-LD EducationalOccupationalCredential — structured data untuk rich
  // result Google (selaras dengan CreativeWork di portfolio, Service di
  // services). Menggunakan credentialUrl sebagai url kredensial bila ada.
  const certificateJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: certificate.title,
    description: certificate.description
      ? truncate(stripHtml(certificate.description), 300)
      : `Sertifikat ${certificate.title} dari ${certificate.issuer}.`,
    url: certificate.credentialUrl || shareUrl,
    image: certificate.imageUrl ? [certificate.imageUrl] : undefined,
    credentialCategory: certificate.category?.name || undefined,
    recognizedBy: {
      "@type": "Organization",
      name: certificate.issuer,
    },
    validFrom: new Date(certificate.issueDate).toISOString(),
    ...(certificate.expiryDate
      ? { validUntil: new Date(certificate.expiryDate).toISOString() }
      : {}),
    ...(certificate.credentialId
      ? {
          identifier: {
            "@type": "PropertyValue",
            name: "Credential ID",
            value: certificate.credentialId,
          },
        }
      : {}),
    inLanguage: "id-ID",
  };

  return (
    <article className="relative">
      {/* Structured data: EducationalOccupationalCredential (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(certificateJsonLd) }}
      />

      {/* ===== Breadcrumb ===== */}
      <div className="section-pad pt-6">
        <nav aria-label="breadcrumb" className="mx-auto max-w-6xl">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Beranda
              </Link>
            </li>
            <li className="text-muted-foreground">/</li>
            <li>
              <Link
                href="/certificates"
                className="transition-colors hover:text-foreground"
              >
                Sertifikat
              </Link>
            </li>
            <li className="text-muted-foreground">/</li>
            <li
              className="max-w-[60vw] truncate font-medium text-foreground"
              aria-current="page"
            >
              {certificate.title}
            </li>
          </ol>
        </nav>
      </div>

      {/* ===== Hero ===== */}
      <section className="section-pad pt-6">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-border animated-gradient">
              <div className="mesh-bg" aria-hidden />
              <div className="relative z-10 grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                {/* Text content */}
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {certificate.category && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
                        style={{
                          backgroundColor: certificate.category.color || "#6366f1",
                        }}
                      >
                        <Award className="size-3" />
                        {certificate.category.name}
                      </span>
                    )}
                    {certificate.featured && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                        <Star className="size-3 fill-current" />
                        Unggulan
                      </span>
                    )}
                    {certificate.credentialUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                        <BadgeCheck className="size-3" />
                        Terverifikasi
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                    {certificate.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-primary" />
                      <span className="font-medium text-foreground/90">
                        {certificate.issuer}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-primary" />
                      {formatDate(certificate.issueDate)}
                    </span>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1.5 text-rose-500">
                        <Clock className="size-4" />
                        Berakhir {formatDate(certificate.expiryDate as Date)}
                      </span>
                    ) : certificate.expiryDate ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        Berlaku hingga {formatDate(certificate.expiryDate)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        Tanpa Kadaluarsa
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {certificate.credentialUrl && (
                      <Button asChild size="sm" className="rounded-full">
                        <a
                          href={certificate.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ShieldCheck className="size-4" />
                          Verifikasi Kredensial
                        </a>
                      </Button>
                    )}
                    {certificate.fileUrl && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full glass"
                      >
                        <a
                          href={certificate.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="size-4" />
                          Unduh Sertifikat
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Preview thumbnail */}
                <div className="relative">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                    {preview ? (
                      isPdf ? (
                        <a
                          href={certificate.fileUrl as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex size-full flex-col items-center justify-center gap-3 bg-primary/10 p-6 text-center transition-colors"
                        >
                          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                            <FileText className="size-8" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">File PDF Sertifikat</p>
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                              Klik untuk membuka
                              <ExternalLink className="size-3" />
                            </p>
                          </div>
                        </a>
                      ) : (
                        <img
                          src={preview}
                          alt={certificate.title}
                          className="size-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary/10">
                        <Award className="size-16 text-foreground/60" />
                      </div>
                    )}
                  </div>
                  {/* Decorative blob */}
                  <div
                    className="absolute -bottom-4 -right-4 -z-10 size-24 rounded-full bg-primary/30 blur-2xl"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Body ===== */}
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div className="min-w-0 space-y-10">
            {/* Description */}
            {certificate.description && (
              <SectionReveal>
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold sm:text-2xl">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Tentang Sertifikat
                  </h2>
                  <div
                    className="prose-content max-w-none text-[15px] text-muted-foreground"
                  >
                    <p>{stripHtml(certificate.description)}</p>
                  </div>
                </div>
              </SectionReveal>
            )}

            {/* Credential ID block */}
            {certificate.credentialId && (
              <SectionReveal>
                <Card className="glass p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        ID Kredensial
                      </p>
                      <p className="mt-1 break-all font-mono text-sm font-medium">
                        {certificate.credentialId}
                      </p>
                      {certificate.credentialUrl && (
                        <a
                          href={certificate.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Verifikasi di situs penerbit
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </SectionReveal>
            )}

            {/* Share row */}
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="size-3.5 text-primary" />
                  Bagikan Sertifikat
                </div>
                <ShareButtons
                  url={shareUrl}
                  title={certificate.title}
                  description={`Sertifikat ${certificate.title} dari ${certificate.issuer}`}
                />
              </div>
            </SectionReveal>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="glass-strong p-5 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <Award className="size-3.5 text-primary" />
                Detail Sertifikat
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Penerbit
                  </dt>
                  <dd className="mt-0.5 font-medium">{certificate.issuer}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Tanggal Terbit
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(certificate.issueDate)}
                  </dd>
                </div>
                {certificate.expiryDate && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Berlaku Hingga
                    </dt>
                    <dd
                      className={cn(
                        "mt-0.5 font-medium",
                        isExpired ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {formatDate(certificate.expiryDate)}
                    </dd>
                  </div>
                )}
                {certificate.category && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Kategori
                    </dt>
                    <dd className="mt-0.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                        style={{
                          backgroundColor: certificate.category.color || "#6366f1",
                        }}
                      >
                        {certificate.category.name}
                      </span>
                    </dd>
                  </div>
                )}
                {certificate.credentialId && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      ID Kredensial
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">
                      {certificate.credentialId}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-0.5">
                    {isExpired ? (
                      <span className="text-rose-500">Berakhir</span>
                    ) : (
                      <span className="text-emerald-500">Aktif</span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Sidebar actions */}
              <div className="mt-5 space-y-2 border-t border-border/60 pt-5">
                {certificate.credentialUrl && (
                  <Button asChild className="w-full rounded-full" size="sm">
                    <a
                      href={certificate.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ShieldCheck className="size-4" />
                      Verifikasi Kredensial
                    </a>
                  </Button>
                )}
                {certificate.fileUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-full glass"
                    size="sm"
                  >
                    <a
                      href={certificate.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="size-4" />
                      Unduh Sertifikat
                    </a>
                  </Button>
                )}
              </div>
            </Card>

            <Card className="glass p-5 sm:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                Tindakan Cepat
              </h3>
              <div className="space-y-2 text-sm">
                <Link
                  href="/certificates"
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft className="size-4" />
                    Semua Sertifikat
                  </span>
                </Link>
                <Link
                  href="/experience"
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4" />
                    Pengalaman Kerja
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/skills"
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Award className="size-4" />
                    Keahlian
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {/* ===== Related Certificates ===== */}
      {relatedList.length > 0 && (
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <SectionReveal>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Jelajahi <span className="text-gradient">Kredensial Lainnya</span>
                  </h2>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full glass">
                  <Link href="/certificates">
                    Semua Sertifikat
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </SectionReveal>

            <SectionReveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedList.map((r) => (
                  <Link key={r.id} href={`/certificates/${r.slug}`} className="group block">
                    <Card className="glass h-full overflow-hidden p-0 lift">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {r.imageUrl ? (
                          <img
                            src={r.imageUrl}
                            alt={r.title}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-primary/10">
                            <Award className="size-12 text-foreground/60" />
                          </div>
                        )}
                        {r.category && (
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                            {r.category.name}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug transition-colors group-hover:text-primary">
                          {r.title}
                        </h3>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="size-3" />
                          {r.issuer}
                          <span className="text-muted-foreground">·</span>
                          <Calendar className="size-3" />
                          {formatDate(r.issueDate, { year: "numeric", month: "short" })}
                        </p>
                      </div>
                    </Card>
                  </Link>
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
                <Award className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Butuh keahlian <span className="text-gradient">terverifikasi?</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya siap membantu proyek digital marketing, produksi konten, atau
                  analisis pasar finansial Anda dengan kompetensi yang sudah
                  tersertifikasi.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/experience">
                      Lihat Pengalaman
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
