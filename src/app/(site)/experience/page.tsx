import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Wrench,
  Clock,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import type { Experience } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal, Counter } from "@/components/motion-primitives";
import { cn, formatDateShort, getInitials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pengalaman — Maulana Ihsan Rohim",
  description:
    "Perjalanan karier profesional Maulana Ihsan Rohim — dari intern analisis pasar hingga specialist digital marketing & content producer.",
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

export default async function ExperiencePage() {
  const experiences = await db.experience.findMany({
    orderBy: [{ order: "asc" }, { startDate: "desc" }],
  });

  const totalYears = calcYears(experiences);
  const companiesCount = new Set(experiences.map((e) => e.company)).size;
  const currentCount = experiences.filter((e) => e.current).length;

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
                <Briefcase className="mr-1.5 size-3.5" />
                Perjalanan Profesional
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Pengalaman <span className="text-gradient">Kerja</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Setiap peran mengajarkan hal baru. Berikut kronologi perjalanan
                karier saya — dari intern hingga specialist dengan beragam
                pengalaman lintas industri.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Bekerja Sama
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/certificates">
                    <Sparkles className="size-4" />
                    Lihat Sertifikat
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="glass p-6 text-center">
                <Clock className="mx-auto mb-2 size-5 text-primary" />
                <div className="text-3xl font-bold sm:text-4xl">
                  <Counter to={totalYears} suffix="+" />
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Tahun Pengalaman
                </p>
              </Card>
              <Card className="glass p-6 text-center">
                <Building2 className="mx-auto mb-2 size-5 text-chart-2" />
                <div className="text-3xl font-bold sm:text-4xl">
                  <Counter to={companiesCount} />
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Perusahaan
                </p>
              </Card>
              <Card className="glass p-6 text-center">
                <TrendingUp className="mx-auto mb-2 size-5 text-emerald-500" />
                <div className="text-3xl font-bold sm:text-4xl">
                  <Counter to={currentCount} />
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  Pekerjaan Aktif
                </p>
              </Card>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Timeline ===== */}
      <section className="section-pad pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Calendar className="mr-1.5 size-3.5 text-primary" />
                Kronologi Karier
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jejak <span className="text-gradient">Profesional</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Dari bawah ke atas — setiap langkah membentuk keahlian hari ini.
              </p>
            </div>
          </SectionReveal>

          {experiences.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground/60" />
              <p className="text-base font-medium">Belum ada pengalaman tercatat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Riwayat karier akan segera ditambahkan.
              </p>
            </Card>
          ) : (
            <div className="relative">
              {/* vertical line - centered on desktop, left on mobile */}
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent sm:left-1/2 sm:-translate-x-1/2"
                aria-hidden
              />

              <ol className="space-y-8">
                {experiences.map((exp, i) => {
                  const techs = (exp.technologies ?? "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const isLeft = i % 2 === 0;

                  return (
                    <SectionReveal key={exp.id} delay={i * 0.05}>
                      <li
                        className={cn(
                          "relative pl-12 sm:w-1/2 sm:pl-0",
                          isLeft ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right",
                        )}
                      >
                        {/* dot with initials */}
                        <span
                          className={cn(
                            "absolute top-1 flex size-10 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-chart-2 text-xs font-bold text-primary-foreground shadow-lg sm:top-2",
                            isLeft
                              ? "left-0 sm:-left-5"
                              : "left-0 sm:left-auto sm:-right-5",
                          )}
                        >
                          {getInitials(exp.company)}
                        </span>

                        <Card className="glass lift p-5 sm:p-6">
                          {/* Date + status */}
                          <div
                            className={cn(
                              "flex flex-wrap items-center gap-2",
                              !isLeft && "sm:justify-end",
                            )}
                          >
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase tracking-wider"
                            >
                              <Calendar className="mr-1 size-3" />
                              {formatDateShort(exp.startDate)} —{" "}
                              {exp.current
                                ? "Sekarang"
                                : exp.endDate
                                  ? formatDateShort(exp.endDate)
                                  : "—"}
                            </Badge>
                            {exp.type && typeLabels[exp.type] && (
                              <Badge
                                className={cn(
                                  "text-[10px] uppercase tracking-wider",
                                  typeStyles[exp.type] ?? "bg-muted text-muted-foreground",
                                )}
                              >
                                {typeLabels[exp.type]}
                              </Badge>
                            )}
                            {exp.current && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Aktif
                              </Badge>
                            )}
                          </div>

                          {/* Position */}
                          <h3 className="mt-3 text-lg font-bold leading-tight">
                            {exp.position}
                          </h3>

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
                                <Badge
                                  key={t}
                                  variant="outline"
                                  className="text-[10px] font-medium"
                                >
                                  {t}
                                </Badge>
                              ))}
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
