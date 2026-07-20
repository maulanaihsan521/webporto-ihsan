"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Briefcase,
  Newspaper,
  Mail,
  Search as SearchIcon,
  ArrowRight,
  Compass,
  ArrowLeft,
  X,
} from "lucide-react";

const QUICK_LINKS = [
  { label: "Beranda", href: "/", icon: Home, accent: "from-amber-500 to-orange-500" },
  { label: "Portofolio", href: "/portfolio", icon: Briefcase, accent: "from-teal-500 to-emerald-500" },
  { label: "Blog", href: "/blog", icon: Newspaper, accent: "from-violet-500 to-fuchsia-500" },
  { label: "Kontak", href: "/contact", icon: Mail, accent: "from-rose-500 to-pink-500" },
];

export default function NotFound() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      router.push("/search");
      return;
    }
    const params = new URLSearchParams({ q: term });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-chart-2 blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
          className="absolute top-1/3 right-1/4 size-[400px] rounded-full bg-chart-3 blur-[120px]"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top bar with brand + back-to-home */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
            <Compass className="size-5" />
          </span>
          <span className="hidden sm:inline">Maulana Ihsan Rohim</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke beranda
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl text-center">
          {/* 404 big gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="text-gradient leading-none font-bold tracking-tight"
              style={{ fontSize: "clamp(6rem, 22vw, 14rem)" }}
            >
              404
            </h1>
          </motion.div>

          {/* Floating decorative compass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mx-auto -mt-4 mb-6 flex size-14 items-center justify-center rounded-2xl glass-strong shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <Compass className="size-7 text-primary" />
            </motion.div>
          </motion.div>

          {/* Title + subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Halaman tidak ditemukan
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
              Coba gunakan pencarian atau kembali ke beranda.
            </p>
          </motion.div>

          {/* Search box */}
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            role="search"
            aria-label="Pencarian situs"
            className="mx-auto mt-7 w-full max-w-md"
          >
            <div className="glass-strong flex items-center gap-2 rounded-full p-2 pl-5 shadow-lg ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary/40">
              <SearchIcon className="pointer-events-none size-4 shrink-0 text-primary" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari konten..."
                aria-label="Cari di seluruh situs"
                className="h-10 flex-1 border-0 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Hapus pencarian"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
                aria-label="Cari"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.form>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group glass lift flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors hover:bg-accent/40"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${link.accent} text-white shadow-md`}
                  aria-hidden
                >
                  <link.icon className="size-5" />
                </div>
                <span className="text-xs font-medium group-hover:text-primary sm:text-sm">
                  {link.label}
                </span>
              </Link>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Maulana Ihsan Rohim. Semua hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
