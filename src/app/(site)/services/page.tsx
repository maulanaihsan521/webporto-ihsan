import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Check,
  Search,
  ClipboardList,
  Rocket,
  TrendingUp,
  Megaphone,
  Share2,
  Camera,
  Video,
  Film,
  Code2,
  PenTool,
  Image as ImageIcon,
  Palette,
  BarChart3,
  ShieldCheck,
  Facebook,
  Mail,
  Star,
  Zap,
  Clock,
  Award,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal, Counter } from "@/components/motion-primitives";

export const metadata = {
  title: "Layanan — Maulana Ihsan Rohim",
  description:
    "Layanan profesional: Digital Marketing, Social Media Management, Photography, Videography, Video Editing, Website Development, UI/UX Design, dan Financial Market Research.",
};

// Lookup table for icon names stored in DB
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Megaphone,
  Share2,
  Camera,
  Video,
  Film,
  Code2,
  PenTool,
  TrendingUp,
  Search,
  Image: ImageIcon,
  Palette,
  BarChart3,
  ShieldCheck,
  Facebook,
  Mail,
  Sparkles,
};

// Color classes lookup for service card accent
const colorMap: Record<
  string,
  { bg: string; text: string; ring: string; gradient: string }
> = {
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
    gradient: "from-rose-500 to-pink-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500 to-purple-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/20",
    gradient: "from-cyan-500 to-teal-500",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/20",
    gradient: "from-orange-500 to-amber-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500 to-teal-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    ring: "ring-fuchsia-500/20",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/20",
    gradient: "from-green-500 to-emerald-500",
  },
};

const fallbackColor = colorMap.amber;

const processSteps = [
  {
    icon: Search,
    title: "Discover",
    subtitle: "Temukan",
    description:
      "Memahami kebutuhan, target audience, dan tujuan bisnis Anda melalui riset mendalam.",
  },
  {
    icon: ClipboardList,
    title: "Plan",
    subtitle: "Rencanakan",
    description:
      "Menyusun strategi, timeline, dan deliverables yang jelas dan terukur untuk setiap tahapan.",
  },
  {
    icon: Rocket,
    title: "Execute",
    subtitle: "Eksekusi",
    description:
      "Mengimplementasikan strategi dengan kreativitas, teknologi terkini, dan standar kualitas tinggi.",
  },
  {
    icon: TrendingUp,
    title: "Deliver",
    subtitle: "Kirim",
    description:
      "Menyampaikan hasil tepat waktu, menganalisis performa, dan memberikan laporan transparan.",
  },
];

export default async function ServicesPage() {
  const services = await db.service.findMany({ orderBy: { order: "asc" } });

  const totalFeatures = services.reduce(
    (acc, s) => acc + (s.features ? s.features.split(",").filter(Boolean).length : 0),
    0,
  );

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
                Layanan Profesional
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Solusi <span className="text-gradient">Kreatif</span> &amp; Strategis
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Layanan terpadu untuk membantu bisnis Anda tumbuh — dari digital marketing, produksi
                konten visual, hingga analisis pasar finansial.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Konsultasi Gratis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="glass">
                  <Link href="/portfolio">
                    <Star className="size-4" />
                    Lihat Portofolio
                  </Link>
                </Button>
              </div>
            </SectionReveal>

            {/* Quick Stats */}
            <SectionReveal delay={0.2}>
              <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3 sm:gap-6">
                {[
                  { icon: Sparkles, label: "Layanan", value: services.length, suffix: "+" },
                  { icon: Award, label: "Fitur", value: totalFeatures, suffix: "+" },
                  { icon: Clock, label: "Tahun Pengalaman", value: 5, suffix: "+" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-2xl p-4 text-center">
                    <s.icon className="mx-auto mb-2 size-5 text-primary" />
                    <div className="text-2xl font-bold sm:text-3xl">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Services Grid ===== */}
      <section className="section-pad py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-12 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <Zap className="mr-1.5 size-3.5 text-primary" />
                Yang Saya Tawarkan
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Layanan Unggulan</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Setiap layanan dirancang untuk memberikan dampak nyata dan terukur bagi bisnis Anda.
              </p>
            </div>
          </SectionReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => {
              const Icon = (service.icon && iconMap[service.icon]) || Sparkles;
              const color = (service.color && colorMap[service.color]) || fallbackColor;
              const features = service.features
                ? service.features.split(",").map((f) => f.trim()).filter(Boolean)
                : [];

              return (
                <SectionReveal key={service.id} delay={(i % 3) * 0.05}>
                  <Card className="glass group relative h-full overflow-hidden p-6 lift">
                    {/* decorative gradient blob */}
                    <div
                      className={`pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br ${color.gradient} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
                      aria-hidden
                    />
                    {/* gradient border on hover */}
                    <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} aria-hidden />
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="relative mb-5">
                        {/* glow ring behind icon */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500`} aria-hidden />
                        <div
                          className={`relative flex size-14 items-center justify-center rounded-2xl ${color.bg} ${color.text} ring-1 ${color.ring} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                        >
                          <Icon className="size-7 transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold leading-tight">{service.title}</h3>
                      {service.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {service.description}
                        </p>
                      )}

                      {features.length > 0 && (
                        <ul className="mt-5 space-y-2.5">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm">
                              <span
                                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${color.bg} ${color.text}`}
                              >
                                <Check className="size-3" />
                              </span>
                              <span className="text-foreground/80">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60">
                        <Link
                          href="/contact"
                          className={`inline-flex items-center gap-1.5 text-sm font-medium ${color.text} transition-all hover:gap-2.5`}
                        >
                          Pelajari lebih lanjut
                          <ArrowRight className="size-3.5" />
                        </Link>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {String(i + 1).padStart(2, "0")}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Process Section ===== */}
      <section className="section-pad py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-12 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <ClipboardList className="mr-1.5 size-3.5 text-primary" />
                Cara Kerja
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Proses 4 Langkah</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Pendekatan terstruktur yang memastikan setiap proyek berjalan transparan dan efisien.
              </p>
            </div>
          </SectionReveal>

          <div className="relative">
            {/* connecting line - desktop */}
            <div
              className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block"
              aria-hidden
            />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {processSteps.map((step, i) => (
                <SectionReveal key={step.title} delay={i * 0.08}>
                  <div className="relative flex flex-col items-center text-center">
                    {/* numbered circle */}
                    <div className="relative z-10 mb-5">
                      <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 text-white shadow-xl shadow-primary/20">
                        <step.icon className="size-9" />
                      </div>
                      <span className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-background text-sm font-bold text-primary ring-2 ring-primary/30">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="text-xs uppercase tracking-wider text-primary">{step.subtitle}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why Choose Me ===== */}
      <section className="section-pad py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionReveal>
            <Card className="glass-strong relative overflow-hidden p-6 sm:p-10">
              <div className="mesh-bg opacity-50" aria-hidden />
              <div className="relative z-10">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Kenapa Memilih Saya?
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                    Kombinasi unik antara kreativitas, teknologi, dan analisis data.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      icon: Award,
                      title: "Berpengalaman",
                      desc: "5+ tahun menangani berbagai klien dari beragam industri.",
                    },
                    {
                      icon: Zap,
                      title: "Cepat & Tepat",
                      desc: "Pengerjaan efisien dengan deadline yang selalu terpenuhi.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Hasil Terukur",
                      desc: "Setiap kampanye dilengkapi laporan dan analisis performa.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Profesional",
                      desc: "Komunikasi transparan dan kualitas yang konsisten.",
                    },
                  ].map((f, i) => (
                    <div
                      key={f.title}
                      className="glass rounded-2xl p-5 text-center lift"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <f.icon className="size-6" />
                      </div>
                      <h3 className="text-base font-semibold">{f.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <Sparkles className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Punya proyek di <span className="text-gradient">pikiran</span> Anda?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Konsultasi gratis untuk membahas kebutuhan dan tujuan bisnis Anda. Mari wujudkan
                  bersama.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/about">
                      <Star className="size-4" />
                      Tentang Saya
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
