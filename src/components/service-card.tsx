import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { getServiceIcon, getServiceColor } from "@/lib/service-style";

import { OptimizedImage } from "@/components/optimized-image";
/**
 * Kartu layanan besar — desain horizontal ala referensi user:
 * kiri (icon squircle + judul + deskripsi + checklist + CTA) & kanan (foto tema).
 * Dipakai di halaman /services. Seluruh kartu clickable → /contact?layanan=…
 */

// Gambar tema default per slug (AI-generated, portrait 3:4, disimpan di public).
// Dipakai sebagai fallback bila Service.image (diatur dari dashboard admin) kosong.
const SERVICE_IMAGES: Record<string, string> = {
  "digital-marketing": "/images/services/digital-marketing.jpg",
  "social-media-management": "/images/services/social-media-management.jpg",
  photography: "/images/services/photography.jpg",
  videography: "/images/services/videography.jpg",
  "video-editing": "/images/services/video-editing.jpg",
  "website-development": "/images/services/website-development.jpg",
  "financial-market-research": "/images/services/financial-market-research.jpg",
};



export interface ServiceCardProps {
  slug: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  features?: string | null;
  /** Foto tema — URL dari dashboard admin; kosong = foto default per slug */
  image?: string | null;
  /** Link tujuan kartu (default: /contact?layanan=) */
  href?: string;
  /** Priority load untuk kartu pertama (LCP) — preconnect + fetchPriority tinggi */
  priority?: boolean;
}

export function ServiceCard({
  slug,
  title,
  description,
  icon,
  color,
  features,
  image,
  href,
  priority = false,
}: ServiceCardProps) {
  const Icon = getServiceIcon(icon);
  const theme = getServiceColor(color);
  // Prioritas: foto dari dashboard admin → fallback default per slug → panel gradasi tema
  const img = image?.trim() || SERVICE_IMAGES[slug];
  const featureList = features
    ? features.split(",").map((f) => f.trim()).filter(Boolean).slice(0, 4)
    : [];
  const target = href ?? `/contact?layanan=${encodeURIComponent(title)}`;

  return (
    <Link
      href={target}
      className="service-card group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Kolom kiri: konten teks */}
      <div className="service-card-body relative z-10 flex h-full flex-col">
        <div
          className={`service-card-icon flex size-11 shrink-0 items-center justify-center rounded-xl ${theme.bg} ${theme.text} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="size-5" />
        </div>

        <h3 className="service-card-title mt-4 text-base font-bold leading-snug">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {featureList.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {featureList.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs">
                <span
                  className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${theme.bg} ${theme.text}`}
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className="truncate text-foreground/75">{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA link — span (bukan Link) supaya tidak nested di dalam Link kartu */}
        <span
          className={`mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold ${theme.text} transition-all duration-300 group-hover:gap-2.5`}
        >
          Pelajari lebih lanjut
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* Kolom kanan: foto tema */}
      <div className="service-card-media relative overflow-hidden" aria-hidden>
        {img ? (
          <OptimizedImage
            src={img}
            alt=""
            sizes="(max-width: 639px) 100vw, 40vw"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority={priority}
          />
        ) : (
          /* Fallback: panel gradasi tema + ikon besar */
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient} opacity-90`}
          >
            <Icon className="size-10 text-white/90" />
          </div>
        )}
        {/* Overlay tipis agar foto menyatu dgn kartu + teks badge tetap terbaca */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>
    </Link>
  );
}

/**
 * Kartu CTA penutup "Butuh solusi lain?" — gaya referensi:
 * tombol pill gold solid + panel dekoratif script "Let's Work Together".
 */
export function ServiceCtaCard() {
  return (
    <Link
      href="/contact"
      className="service-card service-card--cta group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="service-card-body relative z-10 flex h-full flex-col">
        <div className="service-card-icon flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle className="size-5" />
        </div>

        <h3 className="service-card-title mt-4 text-base font-bold leading-snug">
          Butuh solusi lain?
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Tidak menemukan layanan yang sesuai? Terbuka untuk proyek digital dan
          permintaan khusus lainnya — konsultasi gratis, tanpa komitmen.
        </p>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-4">
          <span className="service-cta-pill inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/35 group-hover:brightness-110">
            Hubungi Saya
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>

      {/* Panel dekoratif: script emas + siluet meja kerja */}
      <div className="service-card-media relative overflow-hidden" aria-hidden>
        <OptimizedImage
          src="/images/services/cta-script.jpg"
          alt=""
          sizes="(max-width: 639px) 100vw, 46vw"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    </Link>
  );
}
