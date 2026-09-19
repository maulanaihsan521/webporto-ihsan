import Link from "next/link";
import { ArrowRight, Award, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/server-site-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";
import { safeJsonLd } from "@/lib/utils";
import { CertFilter,
  type CertificateItem,
  type CertificateCategoryItem } from "./cert-filter";

export const metadata = {
  title: { absolute: "Maulana Ihsan Rohim | Certificates & Credentials" },
  description:
    "Koleksi sertifikasi profesional dari Google, Meta, Adobe, HubSpot, Bloomberg, dan lainnya. Semua kredensial terverifikasi.",
  alternates: { canonical: "/certificates" },
  openGraph: {
    title: "Maulana Ihsan Rohim | Certificates & Credentials",
    description:
      "Koleksi sertifikasi profesional dari Google, Meta, Adobe, HubSpot, Bloomberg, dan lainnya. Semua kredensial terverifikasi.",
    type: "website",
    url: "/certificates",
    siteName: "Maulana Ihsan Rohim",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Maulana Ihsan Rohim | Certificates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maulana Ihsan Rohim | Certificates & Credentials",
    description:
      "Koleksi sertifikasi profesional dari Google, Meta, Adobe, HubSpot, Bloomberg, dan lainnya.",
  },
};

export default async function CertificatesPage() {
  const [certificates, categories] = await Promise.all([
    db.certificate.findMany({
      include: { category: true },
      orderBy: { issueDate: "desc" },
      // PERF (Task 12): batasi jumlah baris utk list publik
      take: 200,
    }),
    // SESUAIKAN FILTER (2026-09-20): pill kategori = kategori yang benar-benar
    // dipakai certificate. Saat ini belum ada certificate berkategori →
    // pills row otomatis tersembunyi (guard categories.length > 0 di
    // cert-filter) — tidak ada 6 pill hantu yang klik-nya kosong.
    db.category.findMany({ where: { certificates: { some: {} } } }),
  ]);

  const typedCertificates: CertificateItem[] = certificates.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    issuer: c.issuer,
    issueDate: c.issueDate,
    expiryDate: c.expiryDate,
    credentialId: c.credentialId,
    credentialUrl: c.credentialUrl,
    fileUrl: c.fileUrl,
    imageUrl: c.imageUrl,
    featured: c.featured,
    category: c.category
      ? {
          id: c.category.id,
          name: c.category.name,
          slug: c.category.slug,
          color: c.category.color,
        }
      : null,
  }));

  const typedCategories: CertificateCategoryItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color,
  }));

  // JSON-LD CollectionPage + ItemList — structured data untuk daftar
  // sertifikat (selaras dengan detail yang sudah punya
  // EducationalOccupationalCredential).
  // (Task 14) URL JSON-LD selalu domain produksi; dev lokal tetap host dev.
  const certsUrl = `${await getBaseUrl()}/certificates`;
  const certsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sertifikat & Kredensial Maulana Ihsan Rohim",
    url: certsUrl,
    inLanguage: "id-ID",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: certificates.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${certsUrl}/${c.slug}`,
        name: c.title,
      })),
    },
  };

  return (
    <div className="relative">
      {/* Structured data: CollectionPage + ItemList (rich result Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(certsJsonLd) }}
      />

      {/* ===== Certificates grid ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Sertifikat</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari berdasarkan judul, penerbit, atau ID kredensial. Filter
                berdasarkan kategori untuk mempersempit hasil.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedCertificates.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Award className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-base font-medium">Belum ada sertifikat</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sertifikat akan segera ditambahkan ke koleksi.
                </p>
              </Card>
            ) : (
              <CertFilter
                certificates={typedCertificates}
                categories={typedCategories}
              />
            )}
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
                <Award className="mx-auto mb-4 size-8 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingin <span className="text-gradient">berkolaborasi</span> dengan
                  profesional bersertifikat?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Dengan kredensial dari Google, Meta, Adobe, dan Bloomberg, saya siap
                  membantu proyek digital marketing, produksi konten, hingga analisis
                  pasar finansial Anda.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="glass">
                    <Link href="/experience">
                      Lihat Pengalaman
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
