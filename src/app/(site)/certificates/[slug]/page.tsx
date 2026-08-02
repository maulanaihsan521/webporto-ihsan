import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
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
  FileText,
  Layers } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { ShareButtons } from "@/components/share-buttons";
import { formatDate, stripHtml, cn } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

// Build canonical URL from headers safely (server component)
function buildUrl(headers: Headers, slug: string): string {
  const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
  const proto = headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}/certificates/${slug}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const certificate = await db.certificate.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!certificate) {
    return {
      title: "Sertifikat Tidak Ditemukan — Maulana Ihsan Rohim",
    };
  }

  const title = `${certificate.title} — Sertifikat`;
  const description =
    certificate.description ??
    `Sertifikat ${certificate.title} dari ${certificate.issuer}, diterbitkan ${formatDate(
      certificate.issueDate,
    )}.`;

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
      images: certificate.imageUrl ? [{ url: certificate.imageUrl }] : undefined,
      publishedTime: new Date(certificate.issueDate).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: certificate.imageUrl ? [certificate.imageUrl] : undefined,
    },
  };
}

export default async function CertificateDetailPage({ params }: Params) {
  const { slug } = await params;
  const certificate = await db.certificate.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!certificate) notFound();

  // Related certificates — same category, exclude current, take 3
  const related =
    certificate.categoryId != null
      ? await db.certificate.findMany({
          where: {
            categoryId: certificate.categoryId,
            id: { not: certificate.id },
          },
          include: { category: true },
          orderBy: { issueDate: "desc" },
          take: 3,
        })
      : [];

  // Fallback: if not enough related by category, fill with latest from others
  let relatedList = related;
  if (relatedList.length < 3) {
    const extra = await db.certificate.findMany({
      where: {
        id: {
          notIn: [certificate.id, ...relatedList.map((r) => r.id)],
        },
      },
      include: { category: true },
      orderBy: { issueDate: "desc" },
      take: 3 - relatedList.length,
    });
    relatedList = [...relatedList, ...extra];
  }

  const reqHeaders = await headers();
  const shareUrl = buildUrl(reqHeaders, certificate.slug);

  const isExpired =
    certificate.expiryDate &&
    new Date(certificate.expiryDate).getTime() < Date.now();

  const preview = certificate.imageUrl || certificate.fileUrl || null;
  const isPdf = certificate.fileUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <article className="relative">
      {/* ===== Breadcrumb ===== */}
      <div className="section-pad pt-6">
        <nav aria-label="breadcrumb" className="mx-auto max-w-6xl">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">
                Beranda
              </Link>
            </li>
            <li className="text-muted-foreground/60">/</li>
            <li>
              <Link
                href="/certificates"
                className="transition-colors hover:text-foreground"
              >
                Sertifikat
              </Link>
            </li>
            <li className="text-muted-foreground/60">/</li>
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


</div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                    {certificate.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4 text-primary" />
                      <span className="font-medium text-foreground/90">
                        {certificate.issuer}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-4 text-primary" />
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
                        <Award className="size-16 text-foreground/40" />
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
                    dangerouslySetInnerHTML={{
                      __html: `<p>${stripHtml(certificate.description)}</p>`,
                    }}
                  />
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
                  <Share2 className="size-4 text-primary" />
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
                <Award className="size-4 text-primary" />
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
                      <span className="text-rose-500">Expired</span>
                    ) : (
                      <span className="text-emerald-500">Active</span>
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
                            <Award className="size-12 text-foreground/40" />
                          </div>
                        )}
                        {r.category && (
                          <div className="absolute bottom-3 left-3">
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
                          <span className="text-muted-foreground/60">·</span>
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
