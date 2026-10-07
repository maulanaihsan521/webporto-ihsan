import Link from "next/link";
import { headers } from "next/headers";
import { HelpCircle,
  ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site-config";
import { siteOriginFromHeaders } from "@/lib/server-site-config";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { stripHtml, safeJsonLd } from "@/lib/utils";
import { FaqExplorer, type FaqItem } from "./faq-explorer";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | FAQ — Frequently Asked Questions" },
  description:
    "Pertanyaan yang sering diajukan tentang layanan Maulana Ihsan Rohim — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Maulana Ihsan Rohim | FAQ — Frequently Asked Questions",
    description:
      "Pertanyaan yang sering diajukan tentang layanan Maulana Ihsan Rohim — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
    type: "website",
    url: "/faq",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | FAQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | FAQ — Frequently Asked Questions",
    description:
      "Pertanyaan yang sering diajukan tentang layanan Maulana Ihsan Rohim — Digital Marketing, Photography, Videography, Web Development, dan Financial Market Analysis.",
  },
};

// URL halaman — SELALU domain produksi (Task 14); host request hanya dipakai
// saat dev lokal. Anti host-spoofing: host apa pun tak masuk URL publik.
function buildFaqUrl(currentHeaders: Headers): string {
  return `${siteOriginFromHeaders(currentHeaders)}/faq`;
}

export default async function FaqPage() {
  const faqs = await db.faq.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  // Group for popular categories count
  const categories = Array.from(
    new Set(faqs.map((f) => f.category || "Lainnya")),
  );

  const items: FaqItem[] = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
  }));

  // JSON-LD FAQPage — peluang rich result (accordion) di hasil pencarian
  // Google. Jawaban dibersihkan dari tag HTML agar plain text.
  const reqHeaders = await headers();
  const faqUrl = buildFaqUrl(reqHeaders);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: faqUrl,
    inLanguage: "id-ID",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(f.answer),
      },
    })),
  };

  return (
    <div className="relative">
      {/* Structured data: FAQPage (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />

      {/* ===== FAQ Explorer ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Cari Jawaban Anda
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Gunakan kolom pencarian atau pilih kategori untuk menemukan jawaban
                yang Anda butuhkan.
              </p>
            </div>
          </SectionReveal>

          {items.length === 0 ? (
            <SectionReveal>
              <div className="glass mx-auto max-w-2xl rounded-2xl p-10 text-center text-sm text-muted-foreground">
                <HelpCircle className="mx-auto mb-3 size-8 text-muted-foreground" />
                Belum ada FAQ yang dipublikasikan.
              </div>
            </SectionReveal>
          ) : (
            <SectionReveal delay={0.1}>
              <FaqExplorer items={items} />
            </SectionReveal>
          )}
        </div>
      </section>

      {/* ===== Bottom CTA ===== */}
      <section className="section-pad pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-8 text-center sm:p-12">
              <div className="mesh-bg opacity-60" aria-hidden />
              <div className="relative z-10">
                <img
                  src="/images/mascots/mascot-beginner.webp"
                  alt="Maskot mencari jawaban — siap memulai proyek Anda"
                  width={64}
                  height={64}
                  loading="lazy"
                  className="mx-auto mb-4 size-16 object-contain drop-shadow-lg"
                />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap memulai <span className="text-gradient">proyek</span> Anda?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Jangan ragu untuk menghubungi saya. Konsultasi awal selalu gratis dan
                  tanpa komitmen.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Konsultasi Gratis
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/services">
                      Lihat Layanan
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
