import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight,
  Mail,
  Phone,
  MapPin,
  Target,
  Compass,
  Heart,
  Briefcase,
  GraduationCap,
  Languages as LanguagesIcon,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Quote,
  Camera,
  Video,
  TrendingUp,
  BookOpen,
  Plane,
  Gamepad2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL, SITE_CONFIG } from "@/lib/site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { cn, formatDateShort, getInitials, safeJsonLd } from "@/lib/utils";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

export const metadata: Metadata = {
  title: { absolute: "Maulana Ihsan Rohim | About — Digital Marketing & Finance" },
  description:
    "Kenali lebih dekat Maulana Ihsan Rohim — freelancer Digital Marketing, Photo & Video Production, dan Financial Market Analyst. Lihat perjalanan karier, pendidikan, visi, dan misi saya.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: { absolute: "Maulana Ihsan Rohim | About — Digital Marketing & Finance" },
    description:
      "Kenali lebih dekat Maulana Ihsan Rohim — freelancer Digital Marketing, Photo & Video Production, dan Financial Market Analyst.",
    type: "profile",
    url: "/about",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | About",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | About — Digital Marketing & Finance",
    description:
      "Kenali lebih dekat Maulana Ihsan Rohim — perjalanan karier, pendidikan, visi, dan misi saya.",
  },
};

const hobbyIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Photography: Camera,
  Videography: Video,
  Trading: TrendingUp,
  Reading: BookOpen,
  Traveling: Plane,
  Gaming: Gamepad2,
};

// Selaras dengan halaman /experience — label & gaya badge tipe pekerjaan
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

// Build URL halaman dari headers safely (server component).
// Fallback ke SITE_URL (production domain) supaya tidak pernah bocor localhost.
function buildAboutUrl(currentHeaders: Headers): string {
  const host = currentHeaders.get("x-forwarded-host") || currentHeaders.get("host");
  if (host) {
    const proto = currentHeaders.get("x-forwarded-proto") || "https";
    return `${proto}://${host}/about`;
  }
  return `${SITE_URL}/about`;
}

// Filter URL sosial media yang valid (punya path/profile, bukan placeholder kosong)
function filterValidSocials(socials: Record<string, string>): string[] {
  return Object.values(socials).filter((url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      const path = u.pathname.replace(/\/+$/, "");
      return path.length > 1 && !path.endsWith("@");
    } catch {
      return false;
    }
  });
}

export default async function AboutPage() {
  const [settings, experiences, educations] = await Promise.all([
    getSettings(),
    // Urutan sama dengan halaman /experience & /education — konsistensi antar halaman
    db.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    db.education.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
  ]);

  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";
  const profession =
    settings.owner_profession || "Freelancer Digital Marketing & Financial Market Analyst";
  const professionParts = profession
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
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

  // ===== JSON-LD ProfilePage + Person — entity SEO (selalu dengan About page) =====
  const reqHeaders = await headers();
  const aboutUrl = buildAboutUrl(reqHeaders);
  const socials = filterValidSocials({
    github: settings.social_github || "",
    linkedin: settings.social_linkedin || "",
    instagram: settings.social_instagram || "",
    tiktok: settings.social_tiktok || "",
    whatsapp: settings.social_whatsapp || "",
  });

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `Tentang ${ownerName}`,
    url: aboutUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Person",
      name: ownerName,
      alternateName: [...SITE_CONFIG.alternateName],
      url: SITE_URL,
      description: description,
      jobTitle: professionParts.join(", "),
      ...(settings.owner_email ? { email: settings.owner_email } : {}),
      ...(settings.owner_phone ? { telephone: settings.owner_phone } : {}),
      ...(ownerPhoto ? { image: ownerPhoto } : {}),
      ...(settings.owner_location
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: settings.owner_location,
              addressCountry: "ID",
            },
          }
        : {}),
      ...(socials.length > 0 ? { sameAs: socials } : {}),
      ...(educations.length > 0
        ? {
            alumniOf: educations.map((e) => ({
              "@type": "EducationalOrganization",
              name: e.institution,
            })),
          }
        : {}),
      ...(languages.length > 0
        ? { knowsLanguage: languages.map((l) => l.split("(")[0].trim()) }
        : {}),
      ...(values.length > 0 ? { knowsAbout: values } : {}),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: ProfilePage + Person (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />

      {/* ===== Profile + Bio ===== */}
      <section className="section-pad py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Profile Card */}
            <SectionReveal>
              <Card className="glass-strong relative overflow-hidden p-4 text-center lift">
                <div className="mesh-bg" aria-hidden />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <div className="flex size-32 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-lg overflow-hidden sm:size-36 sm:text-4xl">
                      {ownerPhoto ? (
                        <img src={ownerPhoto} alt={ownerName} className="size-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-card">
                      <span className="size-2.5 animate-pulse rounded-full bg-emerald-300" />
                    </span>
                  </div>
                  <p className="mt-5 text-xl font-semibold">{ownerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tersedia untuk Proyek</p>
                  {professionParts.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {professionParts.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-foreground/80"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </SectionReveal>

            {/* Bio */}
            <SectionReveal delay={0.1}>
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Halo, saya <span className="text-gradient">{ownerName.split(" ")[0]}</span>
                  </h1>
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
      <section className="section-pad py-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Visi &amp; Misi</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Fondasi yang membimbing setiap langkah dan keputusan profesional saya.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionReveal delay={0.05}>
              <Card className="glass relative h-full overflow-hidden p-4 sm:p-5 lift">
                <div className="mesh-bg opacity-50" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                    <Target className="size-7" />
                  </div>
                  <h3 className="text-xl font-bold sm:text-2xl">Visi</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{vision}</p>
                </div>
              </Card>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <Card className="glass relative h-full overflow-hidden p-4 sm:p-5 lift">
                <div className="mesh-bg opacity-50" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-chart-2 text-white shadow-lg">
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
      <section className="section-pad py-8 sm:py-10">
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
                    <h3 className="text-base font-bold sm:text-xl">Nilai-Nilai</h3>
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
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Heart className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold sm:text-xl">Hobi</h3>
                      <p className="text-xs text-muted-foreground">Aktivitas yang menginspirasi saya.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {hobbies.map((h) => {
                      const Icon = hobbyIcons[h] ?? Briefcase;
                      return (
                        <span
                          key={h}
                          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10"
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
                      <h3 className="text-base font-bold sm:text-xl">Bahasa</h3>
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
                            <span className="text-xs text-muted-foreground">{level}</span>
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
      {experiences.length > 0 && (
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Karier</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Perjalanan profesional yang membentuk keahlian saya hari ini.
                </p>
                <Link
                  href="/experience"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
                >
                  Lihat halaman pengalaman lengkap
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </SectionReveal>

            <div className="relative">
              {/* vertical line - centered on desktop, left on mobile */}
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-primary/30 sm:left-1/2 sm:-translate-x-1/2"
                aria-hidden
              />

              <ol className="space-y-8">
                {experiences.map((exp, i) => {
                  const isLeft = i % 2 === 0;
                  const dateRange = `${formatDateShort(exp.startDate)} — ${
                    exp.current
                      ? "Sekarang"
                      : exp.endDate
                        ? formatDateShort(exp.endDate)
                        : "Sekarang"
                  }`;
                  const techs = (exp.technologies ?? "")
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);

                  return (
                    <li
                      key={exp.id}
                      className={cn(
                        "relative pl-12 sm:w-1/2 sm:pl-0",
                        isLeft ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right",
                      )}
                    >
                      {/* dot — di luar SectionReveal agar positioning absolute
                          tetap relatif ke <li> (transform pada wrapper reveal
                          menciptakan containing block baru) */}
                      <span
                        className={cn(
                          "absolute top-1 flex size-8 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md",
                          isLeft
                            ? "left-0 sm:-left-4"
                            : "left-0 sm:left-auto sm:-right-4",
                        )}
                      >
                        <Building2 className="size-3.5" />
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
                                typeStyles[exp.type] ?? "bg-primary/15 text-primary",
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

                          <h3 className="mt-3 text-lg font-bold leading-tight">{exp.position}</h3>
                          <div
                            className={cn(
                              "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
                              !isLeft && "sm:justify-end",
                            )}
                          >
                            <span className="font-medium text-foreground/80">{exp.company}</span>
                            {exp.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                {exp.location}
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{exp.description}</p>
                          )}
                          {techs.length > 0 && (
                            <div className={cn("mt-4 flex flex-wrap gap-1.5", !isLeft && "sm:justify-end")}>
                              {techs.map((tech) => (
                                <span key={tech} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{tech}</span>
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
          </div>
        </section>
      )}

      {/* ===== Education Timeline ===== */}
      {educations.length > 0 && (
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <SectionReveal>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Riwayat Pendidikan</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                  Latar belakang akademis dan pencapaian saya.
                </p>
                <Link
                  href="/education"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
                >
                  Lihat halaman pendidikan lengkap
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </SectionReveal>

            <div className="relative">
              <div
                className="absolute left-4 top-2 bottom-2 w-px bg-primary/30"
                aria-hidden
              />

              <ol className="space-y-6">
                {educations.map((edu, i) => {
                  const dateRange = `${formatDateShort(edu.startDate)} — ${
                    edu.current
                      ? "Sekarang"
                      : edu.endDate
                        ? formatDateShort(edu.endDate)
                        : "Sekarang"
                  }`;

                  return (
                    <li key={edu.id} className="relative pl-12">
                      {/* dot — di luar SectionReveal (lihat catatan pada timeline Karier) */}
                      <span className="absolute top-1.5 left-0 flex size-8 items-center justify-center rounded-full border-4 border-background bg-chart-3 text-white shadow-md">
                        <GraduationCap className="size-4" />
                      </span>

                      <SectionReveal delay={i * 0.05}>
                        <Card className="glass lift p-5 sm:p-6">
                          {/* Date + status */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Calendar className="size-3.5" />
                              {dateRange}
                            </span>
                            {edu.current && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span
                                  className="size-1.5 animate-pulse rounded-full bg-emerald-500"
                                  aria-hidden
                                />
                                Sedang Berjalan
                              </span>
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
          </div>
        </section>
      )}

      {/* ===== Connect / Final CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <Card className="glass-strong relative overflow-hidden p-6 sm:p-10">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <div className="mb-8 text-center">
                  <Quote className="mx-auto mb-4 size-8 text-primary/60" />
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Siap menghasilkan <span className="text-gradient">dampak nyata</span> bersama?
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                    Mari berkolaborasi mewujudkan visi digital dan pertumbuhan bisnis Anda —
                    hubungi saya melalui kanal di bawah.
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
                    <Link href="/portfolio">
                      <Briefcase className="size-4" />
                      Portofolio
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/services">
                      Lihat Layanan
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
