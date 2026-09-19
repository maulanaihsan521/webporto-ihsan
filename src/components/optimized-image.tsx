import Image from "next/image";
import { useMemo } from "react";

/**
 * PERF (Task 12): wrapper next/image untuk gambar dari DB (Supabase Storage)
 * dan path lokal — otomatis resize/WebP via image optimizer Next.js.
 * URL host LAIN (embed/link eksternal ala instagram) → fallback <img> polos
 * karena tidak dikonfigurasi di next.config.images.remotePatterns.
 *
 * Catatan pakai: komponen ini mode `fill` — parent WAJIB position:relative
 * dan punya dimensi (atau aspect-ratio).
 */
export function OptimizedImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  quality = 82,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}) {
  const optimizable = useMemo(() => {
    if (!src) return false;
    if (src.startsWith("/")) return true; // path lokal: /images, /uploads
    try {
      const h = new URL(src).hostname;
      return h.endsWith(".supabase.co") || h.endsWith(".supabase.in");
    } catch {
      return false;
    }
  }, [src]);

  if (!src) {
    return <div className={className} aria-hidden="true" />;
  }

  if (!optimizable) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}
