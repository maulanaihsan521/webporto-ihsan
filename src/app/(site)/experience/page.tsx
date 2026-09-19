import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Wrench,
  Clock,
  TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";
import type { Experience } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { cn, formatDateShort, getInitials, safeJsonLd } from "@/lib/utils";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

export const metadata: Metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Experience — Career Journey" },
  description:
    "Perjalanan karier profesional Maulana Ihsan Rohim — dari intern analisis pasar hingga specialist digital marketing & content producer.",
  alternates: { canonical: "/experience" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Experience — Career Journey",
    description:
      "Perjalanan karier profesional Maulana Ihsan Rohim — dari intern analisis pasar hingga specialist digital marketing & content producer.",
    type: "website",
    url: "/experience",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Experience — Career Journey",
    description:
      "Perjalanan karier profesional Maulana Ihsan Rohim — dari intern analisis pasar hingga specialist digital marketing & content producer.",
  },
};

// Map experience type to friendly label
const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

const typeStyles: Record<string, string> = {
  FULL_TIME: "bg-primary/15 text-primary",
  PART_TIME: "bg-chart-3/15 text-chart-3",
  CONTRACT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  INTERNSHIP: "bg-chart-2/15 text-chart-2",
  FREELANCE: "bg-chart-4/15 text-chart-4",
};

function calcYears(items: Experience[]): number {
  let totalMonths = 0;
  for (const e of items) {
    const start = new Date(e.startDate).getTime();
    const end = e.current
      ? Date.now()
      : e.endDate
        ? new Date(e.endDate).getTime()
        : Date.now();
    totalMonths += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30.4375));
  }
  return Math.max(0, Math.round(totalMonths / 12));
}

// Build URL halaman dari headers safely (server component).
// Fallback ke SITE_URL (production domain) supaya tidak pernah bocor localhost.
function buildExperienceUrl(currentHeaders: Headers): string {
  const host = currentHeaders.get("x-forwarded-host") || currentHeaders.get("host");
  if (host) {
    const proto = currentHeaders.get("x-forwarded-proto") || "https";
    return `${proto}://${host}/experience`;
  }
  return `${SITE_URL}/experience`;
}

export default async function ExperiencePage() {
  const [experiences, settings] = await Promise.all([
    db.experience.findMany({
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    }),
    getSettings(),
  ]);
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";

  const totalYears = calcYears(experiences);
  const companiesCount = new Set(experiences.map((e) => e.company)).size;
  const currentCount = experiences.filter((e) => e.current).length;

  // JSON-LD ProfilePage + Person worksFor — structured data untuk rich
  // result Google (selaras dengan Service di services, CreativeWork di
  // portfolio, EducationalOccupationalCredential di certificates).
  const reqHeaders = await headers();
  const experienceUrl = buildExperienceUrl(reqHeaders);
  const experienceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Jejak Profesional — Pengalaman Maulana Ihsan Rohim",
    url: experienceUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Person",
      name: ownerName,
      url: SITE_URL,
      worksFor: experiences.map((e) => ({
        "@type": "Organization",
        name: e.company,
        ...(e.location ? { address: e.location } : {}),
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: ProfilePage + Person worksFor (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(experienceJsonLd) }}
      />

      {/* ===== Header + Stats ===== */}
      <section className="section-pad py-8 sm:py-12 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jejak <span className="text-gradient">Profesional</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Dari bawah ke atas — setiap langkah membentuk keahlian hari ini.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {/* Stats — Horizontal Bar (selaras dengan Portofolio & Sertifikat) */}
            <div className="flex flex-wrap items-stretch justify-center divide-x divide-border rounded-xl sm:rounded-2xl glass overflow-hidden">
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Clock className="size-3.5 sm:size-5 text-primary shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={totalYears} suffix="+" />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Tahun Pengalaman
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Building2 className="size-3.5 sm:size-5 text-chart-2 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={companiesCount} />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Perusahaan
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <TrendingUp className="size-3.5 sm:size-5 text-emerald-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={currentCount} />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Pekerjaan Aktif
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Timeline ===== */}
      <section className="section-pad pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          {experiences.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-base font-medium">Belum ada pengalaman tercatat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Riwayat karier akan segera ditambahkan.
              </p>
            </Card>
          ) : (
            <div className="relative">
              {/* vertical line - centered on desktop, left on mobile */}
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-primary/30 sm:left-1/2 sm:-translate-x-1/2"
                aria-hidden
              />

              <ol className="space-y-8">
                {experiences.map((exp, i) => {
                  const techs = (exp.technologies ?? "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const isLeft = i % 2 === 0;
                  const dateRange = `${formatDateShort(exp.startDate)} — ${
                    exp.current
                      ? "Sekarang"
                      : exp.endDate
                        ? formatDateShort(exp.endDate)
                        : "Sekarang"
                  }`;

                  return (
                    <li
                      key={exp.id}
                      className={cn(
                        "relative pl-12 sm:w-1/2 sm:pl-0",
                        isLeft ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right",
                      )}
                    >
                      {/* dot with initials — di luar SectionReveal agar
                          positioning absolute tetap relatif ke <li> (transform
                          pada wrapper reveal menciptakan containing block baru) */}
                      <span
                        className={cn(
                          "absolute top-1 flex size-10 items-center justify-center rounded-full border-4 border-background bg-primary text-xs font-bold text-primary-foreground shadow-lg sm:top-2",
                          isLeft
                            ? "left-0 sm:-left-5"
                            : "left-0 sm:left-auto sm:-right-5",
                        )}
                      >
                        {getInitials(exp.company)}
                      </span>

                      <SectionReveal delay={i * 0.05} className="h-full">
                        <Card className="glass lift h-full p-5 sm:p-6">
                          {/* Date + type + status */}
                          <div
                            className={cn(
                              "flex flex-wrap items-center gap-2",
                              !isLeft && "sm:justify-end",
                            )}
                          >
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Calendar className="size-3.5" />
                              {dateRange}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                                typeStyles[exp.type] ??
                                  "bg-primary/15 text-primary",
                              )}
                            >
                              {typeLabels[exp.type] ?? exp.type}
                            </span>
                            {exp.current && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span
                                  className="size-1.5 animate-pulse rounded-full bg-emerald-500"
                                  aria-hidden
                                />
                                Sedang Berjalan
                              </span>
                            )}
                          </div>

                          {/* Position */}
                          <h2 className="mt-3 text-lg font-bold leading-tight">
                            {exp.position}
                          </h2>

                          {/* Company + location */}
                          <div
                            className={cn(
                              "mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
                              !isLeft && "sm:justify-end",
                            )}
                          >
                            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                              <Building2 className="size-3.5" />
                              {exp.company}
                            </span>
                            {exp.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                {exp.location}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {exp.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {exp.description}
                            </p>
                          )}

                          {/* Technologies */}
                          {techs.length > 0 && (
                            <div
                              className={cn(
                                "mt-4 flex flex-wrap gap-1.5",
                                !isLeft && "sm:justify-end",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                                  !isLeft && "sm:w-full sm:justify-end",
                                )}
                              >
                                <Wrench className="size-3" />
                                Teknologi
                              </span>
                              {techs.map((t) => (
                                <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{t}</span>
                              ))}
                            </div>
                          )}
                        </Card>
                      </SectionReveal>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Briefcase className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap mengembangkan <span className="text-gradient">karier Anda</span>{" "}
                  berikutnya?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya terbuka untuk peluang freelance, kolaborasi, maupun peran
                  full-time. Mari diskusikan bagaimana keahlian saya dapat memberi
                  nilai bagi tim Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/education">
                      <CheckCircle2 className="size-4" />
                      Lihat Pendidikan
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
