import Link from "next/link";
import { Home,
  User,
  Briefcase,
  Wrench,
  Mail,
  Image as ImageIcon,
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Newspaper,
  TrendingUp,
  Quote,
  HelpCircle,
  Search as SearchIcon,
  Map as MapIcon,
  ShieldCheck,
  Scale,
  Lock,
  ArrowRight,
  Code2,
  type LucideIcon } from "lucide-react";
import { SectionReveal } from "@/components/motion-primitives";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Peta Situs — Maulana Ihsan Rohim",
  description:
    "Peta situs Maulana Ihsan Rohim — temukan semua halaman utama, layanan, dan konten dalam satu tampilan terstruktur.",
};

type LinkItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  external?: boolean;
};

type LinkGroup = {
  title: string;
  icon: LucideIcon;
  accent: string;
  links: LinkItem[];
};

const GROUPS: LinkGroup[] = [
  {
    title: "Halaman Utama",
    icon: Home,
    accent: "from-amber-500 to-orange-500",
    links: [
      { label: "Beranda", href: "/", icon: Home, description: "Halaman utama situs" },
      { label: "Tentang Saya", href: "/about", icon: User, description: "Profil & biografi" },
      { label: "Layanan", href: "/services", icon: Wrench, description: "Daftar layanan profesional" },
      { label: "Portofolio", href: "/portfolio", icon: Briefcase, description: "Proyek & karya terpilih" },
      { label: "Keahlian", href: "/skills", icon: Code2, description: "Tech stack & skill set" },
      { label: "Kontak", href: "/contact", icon: Mail, description: "Hubungi saya" },
    ],
  },
  {
    title: "Karya",
    icon: BriefcaseBusiness,
    accent: "from-teal-500 to-emerald-500",
    links: [
      { label: "Galeri", href: "/gallery", icon: ImageIcon, description: "Karya foto & video" },
      { label: "Sertifikat", href: "/certificates", icon: Award, description: "Sertifikasi profesional" },
      { label: "Pengalaman", href: "/experience", icon: BriefcaseBusiness, description: "Riwayat karier" },
      { label: "Pendidikan", href: "/education", icon: GraduationCap, description: "Riwayat pendidikan" },
    ],
  },
  {
    title: "Konten",
    icon: Newspaper,
    accent: "from-violet-500 to-fuchsia-500",
    links: [
      { label: "Blog", href: "/blog", icon: Newspaper, description: "Artikel & tulisan" },
      { label: "Pasar Finansial", href: "/financial-market", icon: TrendingUp, description: "Analisis & insight trading" },
      { label: "Testimoni", href: "/testimonials", icon: Quote, description: "Apa kata klien" },
      { label: "FAQ", href: "/faq", icon: HelpCircle, description: "Pertanyaan umum" },
    ],
  },
  {
    title: "Utilitas",
    icon: SearchIcon,
    accent: "from-rose-500 to-pink-500",
    links: [
      { label: "Pencarian", href: "/search", icon: SearchIcon, description: "Cari konten situs" },
      { label: "Peta Situs", href: "/sitemap", icon: MapIcon, description: "Anda berada di sini" },
      { label: "Kebijakan Privasi", href: "/privacy-policy", icon: ShieldCheck, description: "Kebijakan privasi data" },
      { label: "Syarat & Ketentuan", href: "/terms", icon: Scale, description: "Ketentuan layanan" },
    ],
  },
  {
    title: "Admin",
    icon: Lock,
    accent: "from-cyan-500 to-teal-500",
    links: [
      { label: "Admin Dashboard", href: "/admin", icon: Lock, description: "Panel admin (login diperlukan)", external: true },
    ],
  },
];

export default function SitemapPage() {
  const totalLinks = GROUPS.reduce((acc, g) => acc + g.links.length, 0);

  return (
    <div className="relative">

      {/* ===== Link groups ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map((group, gi) => (
              <SectionReveal key={group.title} delay={gi * 0.05}>
                <div className="glass-strong h-full rounded-2xl p-5 sm:p-6">
                  {/* Group header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md",
                        group.accent,
                      )}
                      aria-hidden
                    >
                      <group.icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{group.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {group.links.length} halaman
                      </p>
                    </div>
                  </div>

                  {/* Link list */}
                  <ul className="space-y-1.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60"
                        >
                          <link.icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium group-hover:text-primary">
                              {link.label}
                            </p>
                            {link.description && (
                              <p className="truncate text-[11px] text-muted-foreground/80">
                                {link.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionReveal>
            ))}
          </div>

          {/* XML sitemap callout */}
          <SectionReveal delay={0.2}>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl glass p-6 sm:flex-row sm:p-8">
              <div className="flex items-center gap-4">
                <div
                  className="flex size-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md"
                  aria-hidden
                >
                  <MapIcon className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold">Sitemap XML untuk Mesin Pencari</h3>
                  <p className="text-sm text-muted-foreground">
                    Format XML sitemap tersedia untuk diindeks oleh mesin pencari
                    seperti Google dan Bing.
                  </p>
                </div>
              </div>
              <Link
                href="/sitemap.xml"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
              >
                Lihat sitemap.xml
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
