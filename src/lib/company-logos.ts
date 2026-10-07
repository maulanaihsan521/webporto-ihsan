/**
 * Logo organisasi induk (parent) — ditampilkan BERDAMPINGAN dengan logo unit
 * kerja pada timeline karier, karena unit tersebut adalah bagian dari
 * organisasi induk yang lebih besar.
 *
 * Contoh: Marketing Crew adalah unit pemasaran di lingkungan
 * SMB Telkom University Purwokerto — kedua logo tampil berpasangan.
 *
 * Key = substring nama perusahaan (case-insensitive) pada tabel Experience.
 */
export interface ParentLogo {
  logo: string;
  name: string;
}

const PARENT_LOGOS: Array<{ match: string; parent: ParentLogo }> = [
  {
    match: "marketing crew",
    parent: {
      logo: "/images/companies/smb-telkom.webp",
      name: "SMB Telkom University Purwokerto",
    },
  },
];

/** Cari logo induk untuk sebuah nama perusahaan; null jika tidak ada. */
export function getParentLogo(company: string): ParentLogo | null {
  const c = company.toLowerCase();
  for (const p of PARENT_LOGOS) {
    if (c.includes(p.match)) return p.parent;
  }
  return null;
}
