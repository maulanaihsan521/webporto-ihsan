import type { ComponentType } from "react";
import {
  Megaphone,
  Share2,
  Camera,
  Video,
  Film,
  Code2,
  PenTool,
  TrendingUp,
  Search,
  Image as ImageIcon,
  Palette,
  BarChart3,
  ShieldCheck,
  Facebook,
  Mail,
  Briefcase,
} from "lucide-react";

/**
 * Shared style maps untuk kartu layanan — dipakai halaman /services
 * dan section services di homepage agar tampilan konsisten (DRY).
 * Nama icon & warna disimpan di DB (field Service.icon / Service.color).
 */

// Lookup table untuk nama icon lucide yang tersimpan di DB
export const SERVICE_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Megaphone,
  Share2,
  Camera,
  Video,
  Film,
  Code2,
  PenTool,
  TrendingUp,
  Search,
  Image: ImageIcon,
  Palette,
  BarChart3,
  ShieldCheck,
  Facebook,
  Mail,
};

export interface ServiceColor {
  bg: string;
  text: string;
  ring: string;
  gradient: string;
}

// Color classes lookup untuk aksen kartu layanan
export const SERVICE_COLOR_MAP: Record<string, ServiceColor> = {
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-500/20",
    gradient: "from-rose-500 to-pink-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500 to-purple-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/20",
    gradient: "from-cyan-500 to-teal-500",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/20",
    gradient: "from-orange-500 to-amber-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500 to-teal-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    ring: "ring-fuchsia-500/20",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/20",
    gradient: "from-green-500 to-emerald-500",
  },
};

export const SERVICE_FALLBACK_COLOR: ServiceColor = SERVICE_COLOR_MAP.amber;

export function getServiceIcon(name?: string | null): ComponentType<{ className?: string }> {
  return (name && SERVICE_ICON_MAP[name]) || Briefcase;
}

export function getServiceColor(name?: string | null): ServiceColor {
  return (name && SERVICE_COLOR_MAP[name]) || SERVICE_FALLBACK_COLOR;
}

/**
 * Hitung span kolom kartu CTA penutup supaya grid 3 kolom selalu terisi
 * penuh berapa pun jumlah layanannya (Tailwind butuh class statis untuk JIT).
 * Contoh: 7 layanan → sisa 2 slot → CTA span 2 → 9 slot penuh.
 */
export const CTA_SPAN_CLASSES: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

export function getCtaSpanClass(itemCount: number): string {
  const span = 3 - (itemCount % 3) || 3;
  return CTA_SPAN_CLASSES[span] ?? CTA_SPAN_CLASSES[3];
}
