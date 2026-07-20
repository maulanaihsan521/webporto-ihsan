import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Target,
  Compass,
  Heart,
  Sparkles,
  Briefcase,
  GraduationCap,
  Languages as LanguagesIcon,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Quote,
  Download,
  Star,
  Camera,
  Video,
  TrendingUp,
  BookOpen,
  Plane,
  Gamepad2,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import { formatDate, getInitials } from "@/lib/utils";

export const metadata = {
  title: "Tentang Saya — Maulana Ihsan Rohim",
  description:
    "Kenali lebih dekat Maulana Ihsan Rohim — freelancer Digital Marketing, Photo & Video Production, dan Financial Market Analyst. Lihat perjalanan karier, pendidikan, visi, dan misi saya.",
};

const hobbyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Photography: Camera,
  Videography: Video,
  Trading: TrendingUp,
  Reading: BookOpen,
  Traveling: Plane,
  Gaming: Gamepad2,
};

export default async function AboutPage() {
  const [settings, experiences, educations] = await Promise.all([
    getSettings(),
    db.experience.findMany({ orderBy: { order: "asc" } }),
    db.education.findMany({ orderBy: { order: "asc" } }),
  ]);

  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";
  const profession =
    settings.owner_profession || "Freelancer Digital Marketing & Financial Market Analyst";
  const tagline = settings.site_tagline || "";
  const description = settings.site_description || "";
  const vision = settings.owner_vision || "";
  const mission = settings.owner_mission || "";
  const values = settings.owner_values
    ? settings.owner_values.split(",").map((v) => v.trim()).filter(Boolean)
    : [];
  const hobbies = settings.owner_hobbies
    ? settings.owner_hobbies.split(",").map((v) => v.trim()).filter(Boolean)
    : [];
  const languages = settings.owner_languages
    ? settings.owner_languages.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  const initials = getInitials(ownerName);
  const ownerPhoto = settings.owner_photo || "";
  const experiencesDesc = [...experiences].reverse();
  const educationsDesc = [...educations].reverse();

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <SectionReveal>
              <Badge variant="outline" className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider">
                <Sparkles className="mr-1.5 size-3.5" />
                Tentang Saya
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-gradient">{ownerName}</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-3xl text-base text-muted-foreground sm:text-lg">
                {profession}
              </p>
            </SectionReveal>
            {tagline && (
              <SectionReveal delay={0.15}>
                <p className="mx-auto mt-4 max-w-2xl text-sm italic text-foreground/70 sm:text-base">
                  &ldquo;{tagline}&rdquo;
                </p>
              </SectionReveal>
            )}
            <SectionReveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Hubungi Saya
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/portfolio">
                    <Briefcase className="size-4" />
                    Lihat Portfolio
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Profile + Bio ===== */}
      <section className="section-pad py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Profile Card */}
            <SectionReveal>
              <Card className="glass-strong relative overflow-hidden p-8 text-center lift">
                <div className="mesh-bg" aria-hidden />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <div className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-chart-2 text-3xl font-bold text-primary-foreground shadow-lg overflow-hidden sm:size-36 sm:text-4xl">
                      {ownerPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ownerPhoto} alt={ownerName} className="size-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-card">
                      <span className="size-2.5 animate-pulse rounded-full bg-emerald-300" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{ownerName}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Tersedia untuk Proyek</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">Freelancer</Badge>
                    <Badge variant="secondary" className="text-[10px]">Remote</Badge>
                    <Badge variant="secondary" className="text-[10px]">Full-time</Badge>
                  </div>
                </div>
              </Card>
            </SectionReveal>

            {/* Bio */}
            <SectionReveal delay={0.1}>
              <div className="space-y-5">
                <div>
                  <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                    <Star className="mr-1.5 size-3.5 text-primary" />
                    Profil Singkat
                  </Badge>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Halo, saya <span className="text-gradient">{ownerName.split(" ")[0]}</span>
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">{description}</p>

                {/* Quick info */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="glass flex items-center gap-3 rounded-xl p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lokasi</p>
                      <p className="truncate text-sm font-medium">
                        {settings.owner_location || "Jakarta, Indonesia"}
                      </p>
                    </div>
                  </div>
                  <div className="glass flex items-center gap-3 rounded-xl p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                      <p className="truncate text-sm font-medium">{settings.owner_email || "—"}</p>
                    </div>
                  </div>
                  <div className="glass flex items-center gap-3 rounded-xl p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Telepon</p>
                      <p className="truncate text-sm font-medium">{settings.owner_phone || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Vision & Mission ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Compass className="mr-1.5 size-3.5 text-primary" />
                Arah &amp; Tujuan
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Visi &amp; Misi</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Fondasi yang membimbing setiap langkah dan keputusan profesional saya.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionReveal delay={0.05}>
              <Card className="glass relative h-full overflow-hidden p-6 sm:p-8 lift">
                <div className="mesh-bg opacity-50" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-lg">
                    <Target className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold sm:text-2xl">Visi</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{vision}</p>
                </div>
              </Card>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <Card className="glass relative h-full overflow-hidden p-6 sm:p-8 lift">
                <div className="mesh-bg opacity-50" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 text-white shadow-lg">
                    <Compass className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold sm:text-2xl">Misi</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{mission}</p>
                </div>
              </Card>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Values / Hobbies / Languages ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Values */}
          {values.length > 0 && (
            <SectionReveal>
              <Card className="glass p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Heart className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold sm:text-xl">Nilai-Nilai</h3>
                    <p className="text-xs text-muted-foreground">Prinsip yang saya pegang dalam setiap proyek.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {values.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {v}
                    </span>
                  ))}
                </div>
              </Card>
            </SectionReveal>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Hobbies */}
            {hobbies.length > 0 && (
              <SectionReveal delay={0.05}>
                <Card className="glass h-full p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-chart-3/15 text-chart-3">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold sm:text-xl">Hobi</h3>
                      <p className="text-xs text-muted-foreground">Aktivitas yang menginspirasi saya.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {hobbies.map((h) => {
                      const Icon = hobbyIcons[h] ?? Sparkles;
                      return (
                        <span
                          key={h}
                          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/70"
                        >
                          <Icon className="size-4 text-primary" />
                          {h}
                        </span>
                      );
                    })}
                  </div>
                </Card>
              </SectionReveal>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <SectionReveal delay={0.1}>
                <Card className="glass h-full p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
                      <LanguagesIcon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold sm:text-xl">Bahasa</h3>
                      <p className="text-xs text-muted-foreground">Bahasa yang saya kuasai.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {languages.map((lang) => {
                      const [name, level] = lang.split("(").map((s) => s.replace(")", "").trim());
                      return (
                        <div
                          key={lang}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-3"
                        >
                          <span className="text-sm font-medium">{name}</span>
                          {level && (
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                              {level}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </SectionReveal>
            )}
          </div>
        </div>
      </section>

      {/* ===== Career Timeline ===== */}
      {experiencesDesc.length > 0 && (
        <section className="section-pad py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                  <Briefcase className="mr-1.5 size-3.5 text-primary" />
                  Perjalanan Profesional
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Karier</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Pengalaman kerja saya dalam urutan kronologis terbalik.
                </p>
              </div>
            </SectionReveal>

            <div className="relative">
              {/* vertical line */}
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent sm:left-1/2"
                aria-hidden
              />

              <ol className="space-y-8">
                {experiencesDesc.map((exp, i) => (
                  <SectionReveal key={exp.id} delay={i * 0.05}>
                    <li
                      className={`relative pl-12 sm:w-1/2 sm:pl-0 ${
                        i % 2 === 0 ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right"
                      }`}
                    >
                      {/* dot */}
                      <span
                        className={`absolute top-1 flex size-8 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md sm:top-1 ${
                          i % 2 === 0 ? "left-0 sm:-left-4" : "left-0 sm:left-auto sm:-right-4"
                        }`}
                      >
                        <Building2 className="size-3.5" />
                      </span>

                      <Card className="glass lift p-5 sm:p-6">
                        <div
                          className={`flex flex-wrap items-center gap-2 ${
                            i % 2 !== 0 ? "sm:justify-end" : ""
                          }`}
                        >
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            <Calendar className="mr-1 size-3" />
                            {formatDate(exp.startDate, { month: "short", year: "numeric" })} —{" "}
                            {exp.current
                              ? "Sekarang"
                              : exp.endDate
                                ? formatDate(exp.endDate, { month: "short", year: "numeric" })
                                : "—"}
                          </Badge>
                          {exp.current && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                              Aktif
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-3 text-lg font-bold leading-tight">{exp.position}</h3>
                        <div
                          className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ${
                            i % 2 !== 0 ? "sm:justify-end" : ""
                          }`}
                        >
                          <span className="font-medium text-foreground/80">{exp.company}</span>
                          {exp.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" />
                              {exp.location}
                            </span>
                          )}
                          {exp.type && (
                            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide">
                              · {exp.type.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{exp.description}</p>
                        )}
                        {exp.technologies && (
                          <div className={`mt-4 flex flex-wrap gap-1.5 ${i % 2 !== 0 ? "sm:justify-end" : ""}`}>
                            {exp.technologies
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .map((tech) => (
                                <Badge key={tech} variant="outline" className="text-[10px]">
                                  {tech}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </Card>
                    </li>
                  </SectionReveal>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ===== Education Timeline ===== */}
      {educationsDesc.length > 0 && (
        <section className="section-pad py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                  <GraduationCap className="mr-1.5 size-3.5 text-primary" />
                  Pendidikan
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Riwayat Pendidikan</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Latar belakang akademis dan pencapaian saya.
                </p>
              </div>
            </SectionReveal>

            <div className="relative">
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-chart-3 via-chart-3/40 to-transparent"
                aria-hidden
              />

              <ol className="space-y-6">
                {educationsDesc.map((edu, i) => (
                  <SectionReveal key={edu.id} delay={i * 0.05}>
                    <li className="relative pl-12">
                      <span className="absolute top-1.5 left-0 flex size-8 items-center justify-center rounded-full border-4 border-background bg-chart-3 text-white shadow-md">
                        <GraduationCap className="size-4" />
                      </span>

                      <Card className="glass lift p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            <Calendar className="mr-1 size-3" />
                            {formatDate(edu.startDate, { month: "short", year: "numeric" })} —{" "}
                            {edu.current
                              ? "Sekarang"
                              : edu.endDate
                                ? formatDate(edu.endDate, { month: "short", year: "numeric" })
                                : "—"}
                          </Badge>
                          {edu.grade && (
                            <Badge className="bg-primary/15 text-primary">
                              <Award className="mr-1 size-3" />
                              {edu.grade}
                            </Badge>
                          )}
                        </div>
                        <h3 className="mt-3 text-lg font-bold leading-tight">{edu.institution}</h3>
                        <p className="mt-1 text-sm font-medium text-foreground/80">
                          {edu.degree}
                          {edu.field ? ` — ${edu.field}` : ""}
                        </p>
                        {edu.description && (
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{edu.description}</p>
                        )}
                        {edu.achievements && (
                          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                              <Award className="size-3.5" /> Prestasi
                            </p>
                            <p className="text-xs leading-relaxed text-foreground/80">{edu.achievements}</p>
                          </div>
                        )}
                        {edu.organization && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-chart-3" />
                            <span>{edu.organization}</span>
                          </div>
                        )}
                      </Card>
                    </li>
                  </SectionReveal>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ===== Personal Info Card ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <Card className="glass-strong relative overflow-hidden p-6 sm:p-10">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <div className="mb-8 text-center">
                  <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                    <Mail className="mr-1.5 size-3.5 text-primary" />
                    Informasi Pribadi
                  </Badge>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Mari Terhubung</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                    Tertarik bekerja sama atau sekadar berdiskusi? Hubungi saya melalui kontak di bawah.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <a
                    href={`mailto:${settings.owner_email}`}
                    className="group glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center lift"
                  >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Mail className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                      <p className="mt-1 text-sm font-medium break-all">{settings.owner_email || "—"}</p>
                    </div>
                  </a>
                  <a
                    href={`tel:${settings.owner_phone}`}
                    className="group glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center lift"
                  >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-400">
                      <Phone className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Telepon</p>
                      <p className="mt-1 text-sm font-medium">{settings.owner_phone || "—"}</p>
                    </div>
                  </a>
                  <div className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-3/10 text-chart-3">
                      <MapPin className="size-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lokasi</p>
                      <p className="mt-1 text-sm font-medium">{settings.owner_location || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Kirim Pesan
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/services">
                      <Sparkles className="size-4" />
                      Lihat Layanan
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-50" aria-hidden />
              <div className="relative z-10">
                <Quote className="mx-auto mb-4 size-8 text-primary/60" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap menghasilkan <span className="text-gradient">dampak nyata</span> bersama?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Mari berkolaborasi mewudjudkan visi digital dan pertumbuhan bisnis Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Mulai Diskusi
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/portfolio">
                      <Download className="size-4" />
                      Portofolio
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
