"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Download, Loader2, AlertTriangle, Lock, Database,
  HardDrive, FileJson, Users, FileText,
  Clock, Activity, Settings as SettingsIcon, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Counts {
  users: number;
  categories: number;
  tags: number;
  posts: number;
  comments: number;
  portfolios: number;
  portfolioImages: number;
  galleries: number;
  certificates: number;
  experiences: number;
  educations: number;
  skills: number;
  services: number;
  testimonials: number;
  faqs: number;
  messages: number;
  newsletters: number;
  marketArticles: number;
  watchlists: number;
  portfolioHoldings: number;
  media: number;
  settings: number;
  activityLogs: number;
  visitors: number;
  visitorCounts: number;
}

const STORAGE_GROUPS: {
  label: string;
  icon: any;
  color: string;
  items: { label: string; value: keyof Counts }[];
}[] = [
  {
    label: "Konten",
    icon: FileText,
    color: "text-amber-500 bg-amber-500/10",
    items: [
      { label: "Portfolio", value: "portfolios" },
      { label: "Portfolio Images", value: "portfolioImages" },
      { label: "Blog Posts", value: "posts" },
      { label: "Comments", value: "comments" },
      { label: "Gallery", value: "galleries" },
      { label: "Certificates", value: "certificates" },
      { label: "Market Articles", value: "marketArticles" },
    ],
  },
  {
    label: "Profil",
    icon: Users,
    color: "text-teal-500 bg-teal-500/10",
    items: [
      { label: "Experience", value: "experiences" },
      { label: "Education", value: "educations" },
      { label: "Skills", value: "skills" },
      { label: "Services", value: "services" },
      { label: "Testimonials", value: "testimonials" },
      { label: "FAQ", value: "faqs" },
    ],
  },
  {
    label: "Sistem",
    icon: SettingsIcon,
    color: "text-violet-500 bg-violet-500/10",
    items: [
      { label: "Users", value: "users" },
      { label: "Media", value: "media" },
      { label: "Categories", value: "categories" },
      { label: "Tags", value: "tags" },
      { label: "Settings", value: "settings" },
      { label: "Messages", value: "messages" },
      { label: "Newsletters", value: "newsletters" },
    ],
  },
  {
    label: "Keuangan",
    icon: BarChart3,
    color: "text-rose-500 bg-rose-500/10",
    items: [
      { label: "Watchlists", value: "watchlists" },
      { label: "Portfolio Holdings", value: "portfolioHoldings" },
    ],
  },
  {
    label: "Analytics",
    icon: Activity,
    color: "text-cyan-500 bg-cyan-500/10",
    items: [
      { label: "Activity Logs", value: "activityLogs" },
      { label: "Visitors", value: "visitors" },
      { label: "Visitor Counts", value: "visitorCounts" },
    ],
  },
];

export function BackupManager({
  counts,
  currentRole,
}: {
  counts: Counts;
  currentRole: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const isAdmin = currentRole === "ADMIN";

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal mengekspor data");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh");
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengekspor data");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Backup & Data"
        description="Ekspor seluruh data CMS dan kelola penyimpanan"
        icon={ShieldCheck}
        action={
          <Button onClick={handleDownload} disabled={downloading || !isAdmin} className="rounded-xl">
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export Data (JSON)
          </Button>
        }
      />

      {!isAdmin && (
        <Card className="glass rounded-2xl p-4 mb-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Lock className="size-4" />
            <span>Hanya Admin yang dapat mengekspor data.</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Database className="size-6" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none">{formatNumber(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Records</p>
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className="size-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
            <FileJson className="size-6" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none">25</p>
            <p className="text-xs text-muted-foreground mt-1">Tabel Database</p>
          </div>
        </Card>
        <Card className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className="size-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <HardDrive className="size-6" />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none">{formatNumber(counts.media)}</p>
            <p className="text-xs text-muted-foreground mt-1">File Media</p>
          </div>
        </Card>
      </div>

      {/* Storage group cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {STORAGE_GROUPS.map((group, idx) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="glass rounded-2xl p-5 h-full">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <div className={cn("size-8 rounded-lg flex items-center justify-center", group.color)}>
                  <group.icon className="size-4" />
                </div>
                <h3 className="font-semibold">{group.label}</h3>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.value} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <Badge variant="outline" className="rounded-full tabular-nums">
                      {formatNumber(counts[item.value])}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Export info */}
      <Card className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Download className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Cara Export Data</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Klik tombol <b>Export Data (JSON)</b> di kanan atas untuk mengunduh seluruh data CMS dalam format JSON.
              File berisi semua tabel database beserta relasinya.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                <FileJson className="size-3 mr-1" /> JSON Format
              </Badge>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                <Clock className="size-3 mr-1" /> Tanggal: {new Date().toISOString().slice(0, 10)}
              </Badge>
              <Badge variant="outline" className="border-violet-500/30 text-violet-600">
                <Database className="size-3 mr-1" /> 25 Tabel
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="rounded-2xl p-5 border-2 border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-rose-700">Danger Zone</h3>
            <p className="text-sm text-rose-600/80 mb-3">
              Operasi berikut bersifat destruktif dan tidak dapat dibatalkan. Selalu buat backup sebelum melanjutkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                disabled
                className="rounded-xl border-rose-500/30 text-rose-600 opacity-60 cursor-not-allowed"
              >
                <AlertTriangle className="size-4" /> Reset Database
              </Button>
              <p className="text-xs text-rose-600/70 self-center">
                Reset database dinonaktifkan untuk keamanan. Gunakan <code className="px-1 py-0.5 rounded bg-rose-500/10">bun run db:reset</code> via terminal.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
