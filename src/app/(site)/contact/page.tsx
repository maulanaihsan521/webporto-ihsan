import Link from "next/link";
import { Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  HelpCircle,
  ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";
import { getBaseUrl } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { ContactForm } from "./contact-form";
import { BudgetEstimator } from "./budget-estimator";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

import { safeJsonLd } from "@/lib/utils";
export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Contact — Hire Me" },
  description:
    "Hubungi Maulana Ihsan Rohim untuk konsultasi gratis seputar Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: { absolute: "Maulana Ihsan Rohim | Contact — Hire Me" },
    description:
      "Hubungi Maulana Ihsan Rohim untuk konsultasi gratis seputar Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
    type: "website",
    url: "/contact",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Contact",
    description:
      "Hubungi Maulana Ihsan Rohim untuk proyek Digital Marketing, Photo & Video Production, atau Financial Market Analysis.",
  },
};

export default async function ContactPage() {
  const [settings, faqs] = await Promise.all([
    getSettings(),
    db.faq.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 3,
    }),
  ]);

  const email = settings.owner_email || "";
  const phone = settings.owner_phone || "";
  const location = settings.owner_location || "Jakarta, Indonesia";
  const whatsapp = settings.social_whatsapp || "";
  const github = settings.social_github || "";
  const linkedin = settings.social_linkedin || "";
  const instagram = settings.social_instagram || "";
  const facebook = settings.social_facebook || "";
  const youtube = settings.social_youtube || "";
  const mapEmbed = settings.map_embed || "";

  // (Task 14) URL halaman selalu domain produksi; dev lokal tetap host dev.
  const contactUrl = `${await getBaseUrl()}/contact`;
  // Extract the src URL from the iframe HTML, or use the value as-is if it's already a URL
  const mapSrc = (() => {
    const raw = mapEmbed.trim();
    if (!raw) return "";
    // If it contains an iframe tag, extract the src attribute
    const srcMatch = raw.match(/src=["']([^"']+)["']/i);
    if (srcMatch) return srcMatch[1];
    // Otherwise, assume it's already a URL
    return raw;
  })();

  // Build display + wa.me url from whatsapp
  const whatsappDisplay = phone
    ? phone.replace(/^(\+?62|0)/, "+62 ")
    : whatsapp.replace(/^https?:\/\/wa\.me\//, "+");

  const socials = [
    { name: "GitHub", url: github, icon: Github, color: "hover:text-foreground" },
    { name: "LinkedIn", url: linkedin, icon: Linkedin, color: "hover:text-teal-500" },
    { name: "Instagram", url: instagram, icon: Instagram, color: "hover:text-rose-500" },
    { name: "Facebook", url: facebook, icon: Facebook, color: "hover:text-violet-500" },
    { name: "YouTube", url: youtube, icon: Youtube, color: "hover:text-rose-600" },
  ].filter((s) => s.url);

  // JSON-LD ContactPage — structured data untuk rich result Google
  // (selaras dengan Service di services, ProfilePage di experience).
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";
  const socialUrls = socials.map((s) => s.url);
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Hubungi Maulana Ihsan Rohim",
    url: contactUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "Person",
      name: ownerName,
      url: SITE_URL,
      ...(email ? { email } : {}),
      ...(phone ? { telephone: phone } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressCountry: "ID",
      },
      ...(socialUrls.length > 0 ? { sameAs: socialUrls } : {}),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: ContactPage + Person (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(contactJsonLd) }}
      />

      {/* ===== Header ===== */}
      <section className="section-pad pb-0 pt-8 sm:pt-12 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Hubungi <span className="text-gradient">Saya</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Punya proyek atau pertanyaan? Isi formulir di bawah atau gunakan
                kanal kontak — saya akan membalas dalam 1×24 jam.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ===== Contact Section ===== */}
      <section id="contact-form" className="section-pad py-8 sm:py-10 lg:py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: Contact form (3 cols) */}
            <SectionReveal className="lg:col-span-3">
              <ContactForm />
            </SectionReveal>

            {/* Right: Contact info cards (2 cols) */}
            <SectionReveal delay={0.1} className="lg:col-span-2">
              <div className="space-y-4">
                {/* Email */}
                {email && (
                  <Card className="glass group relative overflow-hidden p-5 lift">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 transition-transform group-hover:scale-110">
                        <Mail className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Email
                        </p>
                        <a
                          href={`mailto:${email}`}
                          className="block truncate text-sm font-semibold transition-colors hover:text-primary sm:text-base"
                        >
                          {email}
                        </a>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Klik untuk mengirim email
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Phone / WhatsApp */}
                {(phone || whatsapp) && (
                  <Card className="glass group relative overflow-hidden p-5 lift">
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20 transition-transform group-hover:scale-110">
                        <Phone className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Telepon / WhatsApp
                        </p>
                        {phone && (
                          <a
                            href={`tel:${phone.replace(/\s+/g, "")}`}
                            className="block truncate text-sm font-semibold transition-colors hover:text-primary sm:text-base"
                          >
                            {whatsappDisplay}
                          </a>
                        )}
                        {whatsapp && (
                          <a
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400"
                          >
                            Chat via WhatsApp
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Location */}
                <Card className="glass group relative overflow-hidden p-5 lift">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20 transition-transform group-hover:scale-110">
                      <MapPin className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Lokasi
                      </p>
                      <p className="text-sm font-semibold sm:text-base">{location}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Layanan remote & onsite
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Response time */}
                <Card className="glass relative overflow-hidden p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                      <Clock className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Waktu Respons
                      </p>
                      <p className="text-sm font-semibold sm:text-base">1×24 Jam</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Senin – Sabtu, 09.00 – 21.00 WIB
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Social media */}
                {socials.length > 0 && (
                  <Card className="glass relative overflow-hidden p-5">
                    <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Ikuti Saya
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {socials.map((s) => (
                        <a
                          key={s.name}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.name}
                          className={`flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background/50 text-muted-foreground transition-all hover:scale-110 hover:border-primary/40 ${s.color}`}
                        >
                          <s.icon className="size-5" />
                        </a>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Budget Estimator ===== */}
      {(settings.budget_estimator === undefined || settings.budget_estimator === "true") && (
      <section className="section-pad pb-12 sm:pb-16">
        <div className="mx-auto max-w-4xl">
          <SectionReveal>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Hitung Budget Proyek Anda
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm">
                Gunakan kalkulator interaktif untuk estimasi harga layanan berdasarkan kebutuhan, kompleksitas, dan timeline.
              </p>
            </div>
            <BudgetEstimator prices={settings} />
          </SectionReveal>
        </div>
      </section>
      )}

      {/* ===== Google Maps Embed ===== */}
      {mapSrc && (
        <section className="section-pad pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl">
            <SectionReveal>
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Temukan Saya di Peta
                </h2>
              </div>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <Card className="glass overflow-hidden p-2">
                <iframe
                  src={mapSrc}
                  title="Lokasi Maulana Ihsan Rohim di Google Maps"
                  className="h-96 w-full rounded-2xl border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </Card>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* ===== FAQ Teaser ===== */}
      {faqs.length > 0 && (
        <section className="section-pad py-8 sm:py-10">
          <div className="mx-auto max-w-5xl">
            <SectionReveal>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Sering Ditanyakan
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Beberapa pertanyaan umum seputar layanan dan proses kerja saya.
                </p>
              </div>
            </SectionReveal>

            <div className="grid gap-4 sm:grid-cols-3">
              {faqs.map((f, i) => (
                <SectionReveal key={f.id} delay={(i % 3) * 0.05}>
                  <Card className="glass group relative h-full overflow-hidden p-3 sm:p-4 lift">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HelpCircle className="size-4" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-snug">
                      {f.question}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-4">
                      {f.answer}
                    </p>
                  </Card>
                </SectionReveal>
              ))}
            </div>

            <SectionReveal delay={0.15}>
              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="glass gap-1.5 rounded-full">
                  <Link href="/faq">
                    <MessageSquare className="size-4" />
                    Lihat Semua FAQ
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
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
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Tidak yakin mulai dari <span className="text-gradient">mana</span>?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Jelajahi portofolio saya untuk inspirasi, atau langsung mulai
                  percakapan untuk diskusi proyek Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/portfolio">
                      Lihat Portofolio
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/services">
                      Jelajahi Layanan
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
