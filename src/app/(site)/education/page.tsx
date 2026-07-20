import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  Calendar,
  Award,
  CheckCircle2,
  Building2,
  BookOpen,
  Trophy,
} from "lucide-react";
import { db } from "@/lib/db";
import type { Education } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pendidikan — Maulana Ihsan Rohim",
  description:
    "Riwayat pendidikan formal & prestasi akademik Maulana Ihsan Rohim — lulusan Sistem Informasi dengan predikat Cumlaude.",
};

function parseGpa(grade: string | null): number | null {
  if (!grade) return null;
  const n = parseFloat(grade.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default async function EducationPage() {
  const educations = await db.education.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  const institutionsCount = new Set(educations.map((e) => e.institution)).size;
  const gpas = educations
    .map((e) => parseGpa(e.grade))
    .filter((g): g is number => g !== null && g > 0 && g <= 4.0);
  const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <SectionReveal>
              <Badge
                variant="outline"
                className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider"
              >
                <GraduationCap className="mr-1.5 size-3.5" />
                Latar Belakang Akademik
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Riwayat <span className="text-gradient">Pendidikan</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Pendidikan formal menjadi fondasi berpikir analitis dan keterampilan
                teknis. Berikut perjalanan akademik beserta prestasi yang saya raih.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Hubungi Saya
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/experience">
                    <Sparkles className="size-4" />
                    Lihat Pengalaman
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="section-pad py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="glass p-6 text-center">
                <Building2 className="mx-auto mb-2 size-5 text-primary" />
                <div className="text-3xl font-bold sm:text-4xl">
                  <Counter to={institutionsCount} />
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Institusi
                </p>
              </Card>
              <Card className="glass p-6 text-center">
                <Trophy className="mx-auto mb-2 size-5 text-amber-500" />
                <div className="text-3xl font-bold sm:text-4xl">
                  {avgGpa > 0 ? (
                    <Counter
                      to={Math.round(avgGpa * 100) / 100}
                      duration={2}
                    />
                  ) : (
                    "—"
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Rata-rata IPK / 4.00
                </p>
              </Card>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Timeline ===== */}
      <section className="section-pad pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <BookOpen className="mr-1.5 size-3.5 text-chart-3" />
                Perjalanan Akademik
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jejak <span className="text-gradient">Akademik</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Dari pendidikan menengah hingga perguruan tinggi — fondasi ilmu yang
                membentuk cara berpikir kritis dan analitis.
              </p>
            </div>
          </SectionReveal>

          {educations.length === 0 ? (
            <Card className="glass p-12 text-center">
              <GraduationCap className="mx-auto mb-3 size-8 text-muted-foreground/60" />
              <p className="text-base font-medium">Belum ada riwayat pendidikan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Data pendidikan akan segera ditambahkan.
              </p>
            </Card>
          ) : (
            <div className="relative">
              {/* vertical line — left-aligned */}
              <div
                className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-chart-3 via-chart-3/40 to-transparent"
                aria-hidden
              />

              <ol className="space-y-6">
                {educations.map((edu, i) => {
                  const achievements = (edu.achievements ?? "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean);
                  const gpa = parseGpa(edu.grade);

                  return (
                    <SectionReveal key={edu.id} delay={i * 0.05}>
                      <li className="relative pl-16">
                        {/* dot */}
                        <span className="absolute top-1.5 left-0 flex size-10 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-chart-3 to-chart-5 text-white shadow-lg">
                          <GraduationCap className="size-5" />
                        </span>

                        <Card className="glass lift p-5 sm:p-6">
                          {/* Date + grade */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider"
                            >
                              <Calendar className="mr-1 size-3" />
                              {formatDateShort(edu.startDate)} —{" "}
                              {edu.current
                                ? "Sekarang"
                                : edu.endDate
                                  ? formatDateShort(edu.endDate)
                                  : "—"}
                            </Badge>
                            {edu.current && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Sedang Berjalan
                              </Badge>
                            )}
                            {edu.grade && (
                              <Badge className="bg-primary/15 text-primary">
                                <Award className="mr-1 size-3" />
                                {gpa !== null && gpa > 0 && gpa <= 4.0
                                  ? `IPK ${edu.grade}`
                                  : `Nilai ${edu.grade}`}
                              </Badge>
                            )}
                          </div>

                          {/* Institution */}
                          <h3 className="mt-3 text-lg font-bold leading-tight">
                            {edu.institution}
                          </h3>

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
                              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-chart-3" />
                              <span>{edu.organization}</span>
                            </div>
                          )}
                        </Card>
                      </li>
                    </SectionReveal>
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
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
