import Link from "next/link";
import { ArrowRight, Sparkles, Award, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionReveal } from "@/components/motion-primitives";
import {
  CertFilter,
  type CertificateItem,
  type CertificateCategoryItem,
} from "./cert-filter";

export const metadata = {
  title: "Sertifikat — Maulana Ihsan Rohim",
  description:
    "Koleksi sertifikasi profesional dari Google, Meta, Adobe, HubSpot, Bloomberg, dan lainnya. Semua kredensial terverifikasi.",
};

export default async function CertificatesPage() {
  const [certificates, categories] = await Promise.all([
    db.certificate.findMany({
      include: { category: true },
      orderBy: { issueDate: "desc" },
    }),
    db.category.findMany({ where: { type: "CERTIFICATE" } }),
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
                <Award className="mr-1.5 size-3.5" />
                Sertifikasi Profesional
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Sertifikat &amp; <span className="text-gradient">Kredensial</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Bukti komitmen pada pengembangan profesional. Setiap sertifikat
                terverifikasi melalui penerbit resmi dan dapat diverifikasi secara
                online.
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
                  <Link href="/skills">
                    <Sparkles className="size-4" />
                    Lihat Keahlian
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Certificates grid ===== */}
      <section className="section-pad py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionReveal>
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-3 text-xs uppercase tracking-wider">
                <ShieldCheck className="mr-1.5 size-3.5 text-emerald-500" />
                Kredensial Terverifikasi
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Jelajahi <span className="text-gradient">Sertifikat</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
                Cari berdasarkan judul, penerbit, atau ID kredensial. Filter
                berdasarkan kategori untuk mempersempit hasil.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            {typedCertificates.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Award className="mx-auto mb-3 size-8 text-muted-foreground/60" />
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10 p-8 text-center sm:p-12">
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
                      <Sparkles className="size-4" />
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
