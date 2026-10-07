import { cn } from "@/lib/utils";
import type { ParentLogo } from "@/lib/company-logos";

/**
 * Pasangan logo "co-brand" bertumpuk (stacked) — logo organisasi induk
 * (mis. SMB Telkom) sebagai lingkaran belakang + logo unit kerja
 * (mis. Marketing Crew) sebagai lingkaran depan yang menindihnya,
 * seperti tumpukan avatar/reaksi: lingkaran seragam saling tumpang
 * tindih ±15% diameter, sejajar pada pusat horizontal.
 *
 * Kenapa bertumpuk (bukan kapsul satu wadah)?
 * - Sesuai referensi visual yang diminta: lingkaran bulat terpisah
 *   yang overlap, bukan dua logo dalam satu kapsul memanjang
 * - Tiap lingkaran punya ring sendiri (border-background) → lingkaran
 *   depan tetap terpisah jelas dari lingkaran belakang
 * - Induk di belakang, unit di depan → unit (entri karier aktual)
 *   paling menonjol, induk tetap terbaca sebagai payungnya
 *
 * Varian:
 * - "timeline" → ring tebal + shadow (untuk dot timeline karier)
 * - "inline"   → border tipis (untuk baris nama perusahaan dalam kartu)
 */
export interface CompanyLogoPairProps {
  /** Logo unit kerja (mis. Marketing Crew) — lingkaran DEPAN */
  logo: string;
  /** Nama unit — untuk alt/aria */
  company: string;
  /** Logo + nama organisasi induk (mis. SMB Telkom) — lingkaran BELAKANG */
  parent: ParentLogo;
  /** Ukuran konten tiap logo dalam piksel (default 40); lingkaran luar
   *  = size + 2×lebar ring sesuai varian */
  size?: number;
  /** Varian tampilan (default "timeline") */
  variant?: "timeline" | "inline";
  className?: string;
}

export function CompanyLogoPair({
  logo,
  company,
  parent,
  size = 40,
  variant = "timeline",
  className,
}: CompanyLogoPairProps) {
  const ring = variant === "timeline";
  // Lebar ring & padding tiap lingkaran; lingkaran luar = size + 2×ring
  const ringWidth = ring ? 4 : 1;
  const outer = size + ringWidth * 2;
  const pad = Math.max(2, Math.round(size * 0.1));
  // Overlap ±15% diameter luar (referensi ~14%), min 2px agar tetap
  // terlihat menumpuk pada ukuran kecil (varian inline)
  const overlap = Math.max(2, Math.round(outer * 0.15));

  return (
    <span
      className={cn("inline-flex items-center", className)}
      aria-label={`Logo ${company} — bagian dari ${parent.name}`}
    >
      {/* Lingkaran belakang (kiri): logo organisasi induk */}
      <img
        src={parent.logo}
        alt={`Logo ${parent.name}`}
        width={outer}
        height={outer}
        loading="lazy"
        style={{ width: outer, height: outer, padding: pad }}
        className={cn(
          "shrink-0 rounded-full bg-white object-contain",
          ring
            ? "border-4 border-background shadow-lg"
            : "border border-foreground/10",
        )}
      />
      {/* Lingkaran depan (kanan): logo unit kerja — menindih induk,
          ring-nya memisahkan kedua lingkaran */}
      <img
        src={logo}
        alt={`Logo ${company}`}
        width={outer}
        height={outer}
        loading="lazy"
        style={{
          width: outer,
          height: outer,
          padding: pad,
          marginLeft: -overlap,
        }}
        className={cn(
          "relative z-10 shrink-0 rounded-full bg-white object-contain",
          ring
            ? "border-4 border-background shadow-lg"
            : "border border-foreground/10",
        )}
      />
    </span>
  );
}
