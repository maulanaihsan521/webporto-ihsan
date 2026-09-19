import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight,
  GraduationCap,
  Award,
  CheckCircle2,
  Building2,
  Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";
import { siteOriginFromHeaders } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

import { safeJsonLd } from "@/lib/utils";
export const metadata: Metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Education & Academics" },
  description:
    "Riwayat pendidikan formal & prestasi akademik Maulana Ihsan Rohim — lulusan Sistem Informasi dengan predikat Cumlaude.",
  alternates: { canonical: "/education" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Education & Academics",
    description:
      "Riwayat pendidikan formal & prestasi akademik Maulana Ihsan Rohim — lulusan Sistem Informasi dengan predikat Cumlaude.",
    type: "website",
    url: "/education",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Education & Academics",
    description:
      "Riwayat pendidikan formal & prestasi akademik Maulana Ihsan Rohim — lulusan Sistem Informasi dengan predikat Cumlaude.",
  },
};

// URL halaman — SELALU domain produksi (Task 14); host request hanya dipakai
// saat dev lokal. Anti host-spoofing: host apa pun tak masuk URL publik.
function buildEducationUrl(currentHeaders: Headers): string {
  return `${siteOriginFromHeaders(currentHeaders)}/education`;
}

function parseGpa(grade: string | null): number | null {
  if (!grade) return null;
  const n = parseFloat(grade.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default async function EducationPage() {
  const [educations, settings] = await Promise.all([
    db.education.findMany({
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    }),
    getSettings(),
  ]);
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";

  const institutionsCount = new Set(educations.map((e) => e.institution)).size;
  const gpas = educations
    .map((e) => parseGpa(e.grade))
    .filter((g): g is number => g !== null && g > 0 && g <= 4.0);
  const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

  // JSON-LD ProfilePage + Person alumniOf — structured data untuk rich
  // result Google (selaras dengan worksFor di /experience).
  const reqHeaders = await headers();
  const educationUrl = buildEducationUrl(reqHeaders);
  const educationJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: "Jejak Akademik — Pendidikan Maulana Ihsan Rohim",
    url: educationUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Person",
      name: ownerName,
      url: SITE_URL,
      alumniOf: educations.map((e) => ({
        "@type": "EducationalOrganization",
        name: e.institution,
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: ProfilePage + Person alumniOf (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(educationJsonLd) }}
      />

      {/* ===== Header + Stats ===== */}
      <section className="section-pad py-8 sm:py-12 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jejak <span className="text-gradient">Akademik</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Dari pendidikan menengah hingga perguruan tinggi — fondasi ilmu yang
                membentuk cara berpikir kritis dan analitis.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {/* Stats — Horizontal Bar (selaras dengan Portofolio, Sertifikat & Pengalaman) */}
            <div className="flex flex-wrap items-stretch justify-center divide-x divide-border rounded-xl sm:rounded-2xl glass overflow-hidden">
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Building2 className="size-3.5 sm:size-5 text-primary shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    <Counter to={institutionsCount} />
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Institusi
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-[100px] sm:min-w-[140px] flex items-center justify-center gap-2 sm:gap-3 px-2 py-3 sm:px-4 sm:py-5">
                <Trophy className="size-3.5 sm:size-5 text-amber-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold sm:text-xl">
                    {avgGpa > 0 ? (
                      <Counter
                        to={Math.round(avgGpa * 100) / 100}
                        duration={2}
                      />
                    ) : (
                      "—"
                    )}
                  </div>
                  <p className="text-[8px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Rata-rata IPK / 4.00
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Timeline ===== */}
      <section className="section-pad pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl">

          {educations.length === 0 ? (
            <Card className="glass p-12 text-center">
              <GraduationCap className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-base font-medium">Belum ada riwayat pendidikan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Data pendidikan akan segera ditambahkan.
              </p>
            </Card>
          ) : (
            <div className="relative">
              {/* vertical line — left-aligned */}
              <div
                className="absolute left-5 top-2 bottom-2 w-px bg-primary/30"
                aria-hidden
              />

              <ol className="space-y-6">
                {educations.map((edu, i) => {
                  const achievements = (edu.achievements ?? "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean);

                  return (
                    <li key={edu.id} className="relative pl-16">
                      {/* dot — di luar SectionReveal (transform pada wrapper
                          reveal menciptakan containing block yang menggeser
                          absolute positioning) */}
                      <span className="absolute top-1.5 left-0 flex size-10 items-center justify-center rounded-full border-4 border-background bg-chart-3 text-white shadow-lg">
                        <GraduationCap className="size-5" />
                      </span>

                      <SectionReveal delay={i * 0.05} className="h-full">
                        <Card className="glass lift h-full p-5 sm:p-6">
                          {/* Status */}
                          {edu.current && (
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span
                                  className="size-1.5 animate-pulse rounded-full bg-emerald-500"
                                  aria-hidden
                                />
                                Sedang Berjalan
                              </span>
                            </div>
                          )}

                          {/* Institution */}
                          <h2 className="text-lg font-bold leading-tight">
                            {edu.institution}
                          </h2>
                          {/* Degree + field */}
                          <p className="mt-1 text-sm font-medium text-foreground/80">
                            {edu.degree}
                            {edu.field ? ` — ${edu.field}` : ""}
                          </p>

                          {/* Description */}
                          {edu.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {edu.description}
                            </p>
                          )}

                          {/* Achievements list */}
                          {achievements.length > 0 && (
                            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                <Trophy className="size-3.5" />
                                Prestasi
                              </p>
                              <ul className="space-y-1.5">
                                {achievements.map((a, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80"
                                  >
                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                                    <span>{a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Organization */}
                          {edu.organization && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                              <span>{edu.organization}</span>
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
                <GraduationCap className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin belajar <span className="text-gradient">bersama?</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Saya senang berbagi ilmu melalui mentoring, workshop, atau kolaborasi
                  proyek edukatif. Mari bertukar pengalaman dan tumbuh bersama.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/certificates">
                      <Award className="size-4" />
                      Lihat Sertifikat
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
