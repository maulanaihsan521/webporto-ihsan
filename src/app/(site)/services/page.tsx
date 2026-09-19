import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight,
  Search,
  ClipboardList,
  Rocket,
  TrendingUp,
  ShieldCheck,
  Star,
  Zap,
  Award,
  Briefcase } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";
import { ServiceCard, ServiceCtaCard } from "@/components/service-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

import { safeJsonLd } from "@/lib/utils";
export const metadata = {
  title: {
    absolute: "Maulana Ihsan Rohim | Digital Marketing & Creative Services",
  },
  description:
    "Layanan profesional: Digital Marketing, Social Media Management, Photography, Videography, Video Editing, Website Development, dan Financial Market Research.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Digital Marketing & Creative Services",
    description:
      "Layanan profesional: Digital Marketing, Social Media Management, Photography, Videography, Video Editing, Website Development, dan Financial Market Research.",
    type: "website",
    url: "/services",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Professional Services",
    description:
      "Layanan profesional Digital Marketing, Photo & Video Production, Web Development, hingga Financial Market Analysis.",
  },
};

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

// Build URL halaman dari headers safely (server component).
// Fallback ke SITE_URL (production domain) supaya tidak pernah bocor localhost.
function buildServicesUrl(currentHeaders: Headers): string {
  const host = currentHeaders.get("x-forwarded-host") || currentHeaders.get("host");
  if (host) {
    const proto = currentHeaders.get("x-forwarded-proto") || "https";
    return `${proto}://${host}/services`;
  }
  return `${SITE_URL}/services`;
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    db.service.findMany({ orderBy: { order: "asc" } }),
    getSettings(),
  ]);
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";

  // JSON-LD ItemList + Service — structured data untuk rich result Google.
  // Halaman komersial utama: membantu Google memahami daftar layanan &
  // penyedianya (selaras dengan CreativeWork di portfolio, Article di market).
  const reqHeaders = await headers();
  const servicesUrl = buildServicesUrl(reqHeaders);
  const servicesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Layanan Profesional",
    itemListElement: services.map((service, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.description || undefined,
        url: servicesUrl,
        serviceType: service.title,
        provider: {
          "@type": "Person",
          name: ownerName,
          url: SITE_URL,
        },
        areaServed: "Indonesia",
        inLanguage: "id-ID",
      },
    })),
  };

  return (
    <div className="relative">

      {/* Structured data: ItemList + Service (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(servicesJsonLd) }}
      />

      {/* ===== Services Grid ===== */}
      <section className="section-pad py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                — Layanan —
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Layanan <span className="text-gradient">Profesional</span>
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                Setiap layanan dirancang untuk memberikan dampak nyata dan terukur bagi bisnis Anda.
              </p>
            </div>
          </SectionReveal>

          {services.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-base font-medium">Belum ada layanan yang dipublikasikan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Silakan hubungi saya langsung untuk membahas kebutuhan Anda.
              </p>
              <Button asChild className="mt-4 rounded-xl">
                <Link href="/contact">
                  Hubungi Saya
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid items-stretch gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <SectionReveal key={service.id} delay={(i % 3) * 0.06} className="h-full">
                  <ServiceCard
                    slug={service.slug}
                    title={service.title}
                    description={service.description}
                    icon={service.icon}
                    color={service.color}
                    features={service.features}
                    image={service.image}
                  />
                </SectionReveal>
              ))}

              {/* Kartu CTA penutup — script "Let's Work Together" + pill gold */}
              <SectionReveal delay={0.12} className="h-full">
                <ServiceCtaCard />
              </SectionReveal>
            </div>
          )}
        </div>
      </section>

      {/* ===== Process Section ===== */}
      <section className="section-pad py-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Proses 4 Langkah</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Pendekatan terstruktur yang memastikan setiap proyek berjalan transparan dan efisien.
              </p>
            </div>
          </SectionReveal>

          <div className="relative">
            {/* connecting line - desktop */}
            <div
              className="absolute left-0 right-0 top-12 hidden h-px bg-primary/30 lg:block"
              aria-hidden
            />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {processSteps.map((step, i) => (
                <SectionReveal key={step.title} delay={i * 0.08}>
                  <div className="relative flex flex-col items-center text-center">
                    {/* numbered circle */}
                    <div className="relative z-10 mb-5">
                      <div className="flex size-24 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/20">
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
      <section className="section-pad py-8 sm:py-10">
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
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
