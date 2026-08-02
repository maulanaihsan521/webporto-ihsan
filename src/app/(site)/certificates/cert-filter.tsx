"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search,
  X,
  Award,
  BadgeCheck,
  Calendar,
  Building2,
  Star,
  Eye,
  ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/motion-primitives";
import { cn, formatDate, truncate } from "@/lib/utils";

export type CertificateCategoryItem = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type CertificateItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  issuer: string;
  issueDate: Date | string;
  expiryDate: Date | string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  fileUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  category: CertificateCategoryItem | null;
};

// accent gradients per category for placeholders
const issuerGradients = [
  "from-amber-500 to-orange-500",
  "from-teal-500 to-emerald-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
];

function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return issuerGradients[h % issuerGradients.length];
}

export function CertFilter({
  certificates,
  categories,
}: {
  certificates: CertificateItem[];
  categories: CertificateCategoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // unique issuers count
  const issuersCount = useMemo(() => {
    const set = new Set<string>();
    for (const c of certificates) set.add(c.issuer);
    return set.size;
  }, [certificates]);

  // filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return certificates.filter((c) => {
      const matchCat = activeCategory === "all" || c.category?.id === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        (c.credentialId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [certificates, query, activeCategory]);

  const hasActiveFilters = query !== "" || activeCategory !== "all";

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
  };

  return (
    <div>
      {/* ===== Stats ===== */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="glass p-3 text-center sm:p-4">
          <Award className="mx-auto mb-2 size-5 text-primary" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={certificates.length} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Total Sertifikat
          </p>
        </Card>
        <Card className="glass p-3 text-center sm:p-4">
          <Building2 className="mx-auto mb-2 size-5 text-chart-2" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={issuersCount} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Penerbit
          </p>
        </Card>
        <Card className="glass col-span-2 p-4 text-center sm:col-span-1 sm:p-6">
          <ShieldCheck className="mx-auto mb-2 size-5 text-emerald-500" />
          <div className="text-2xl font-bold sm:text-4xl">
            <Counter to={certificates.filter((c) => c.credentialUrl).length} />
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            Terverifikasi
          </p>
        </Card>
      </div>

      {/* ===== Toolbar: search ===== */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari sertifikat, penerbit, atau ID kredensial..."
            aria-label="Cari sertifikat"
            className="h-12 w-full rounded-full border border-border bg-card/60 pl-11 pr-11 text-sm shadow-sm outline-none backdrop-blur transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 self-start text-xs text-primary hover:underline lg:self-auto"
          >
            <X className="size-3" />
            Reset filter
          </button>
        )}
      </div>

      {/* ===== Category Pills ===== */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <CategoryPill
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          >
            Semua
          </CategoryPill>
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </CategoryPill>
          ))}
        </div>
      )}

      {/* ===== Count ===== */}
      <div className="mb-6 text-xs text-muted-foreground">
        Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
        <strong className="text-foreground">{certificates.length}</strong> sertifikat
      </div>

      {/* ===== Grid ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${query}-${activeCategory}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {filtered.length === 0 ? (
            <Card className="glass p-12 text-center sm:p-16">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              </div>
              <p className="text-lg font-semibold">Sertifikat tidak ditemukan</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Coba kata kunci lain atau ubah filter kategori untuk melihat lebih banyak.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <X className="size-4" />
                Reset Filter
              </button>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, idx) => (
                <CertificateCard key={c.id} certificate={c} delay={idx * 0.05} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm",
        active
          ? "text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="activeCertCat"
          className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}

function CertificateCard({
  certificate,
  delay,
}: {
  certificate: CertificateItem;
  delay: number;
}) {
  const c = certificate;
  const gradient = gradientFor(c.issuer);
  const isExpired =
    c.expiryDate && new Date(c.expiryDate).getTime() < Date.now();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/certificates/${c.slug}`} className="group block h-full">
        <Card className="glass relative h-full overflow-hidden p-0 lift">
          {/* Preview area */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {c.imageUrl ? (
              <img
                src={c.imageUrl}
                alt={c.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div
                className={cn(
                  "flex size-full items-center justify-center bg-primary/10",
                  gradient,
                )}
              >
                <Award className="size-14 text-white/80" />
              </div>
            )}

            {/* Featured ribbon */}
            {c.featured && (
              <div className="absolute right-0 top-0 flex items-center gap-1 bg-amber-500/95 px-3 py-1 text-[10px] font-semibold text-white shadow-md">
                <Star className="size-3 fill-current" />
                Unggulan
              </div>
            )}

            {/* Verified badge */}
            {c.credentialUrl && (
              <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur">
                </div>
            )}

            {/* Hover View button */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100">
              <Eye className="size-3.5" />
              Lihat
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 p-5">
            <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
              {c.title}
            </h3>

            <div className="flex items-center gap-2 text-xs">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-white",
                  gradient,
                )}
              >
                {c.issuer.charAt(0).toUpperCase()}
              </div>
              <span className="truncate font-medium text-foreground/80">{c.issuer}</span>
            </div>

            {c.description && (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {truncate(c.description, 110)}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(c.issueDate, { year: "numeric", month: "short" })}
              </span>
              {isExpired ? (
                <span className="inline-flex items-center gap-1 text-rose-500">
                  <X className="size-3" />
                  Berakhir
                </span>
              ) : c.expiryDate ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  Tanpa Kadaluarsa
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
