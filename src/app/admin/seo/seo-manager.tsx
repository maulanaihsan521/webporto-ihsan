"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Save, Loader2, Globe, FileText, ExternalLink, Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaPicker } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site-config";
import { toast } from "sonner";

type Settings = Record<string, string>;

export function SeoManager({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState<Settings>({
    seo_meta_title: settings.seo_meta_title || "",
    seo_meta_description: settings.seo_meta_description || "",
    seo_meta_keywords: settings.seo_meta_keywords || "",
    seo_og_image: settings.seo_og_image || "",
    seo_og_title: settings.seo_og_title || "",
    seo_og_description: settings.seo_og_description || "",
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const titleCount = form.seo_meta_title.length;
  const descCount = form.seo_meta_description.length;

  const titleColor =
    titleCount === 0 ? "text-muted-foreground" :
    titleCount <= 60 ? "text-emerald-600" :
    titleCount <= 70 ? "text-amber-600" : "text-rose-600";

  const descColor =
    descCount === 0 ? "text-muted-foreground" :
    descCount <= 160 ? "text-emerald-600" :
    descCount <= 180 ? "text-amber-600" : "text-rose-600";

  const handleSave = async () => {
    setLoading(true);
    try {
      const items = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: "SEO",
        type: "TEXT",
      }));
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menyimpan");
      }
      toast.success("Pengaturan SEO disimpan");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const serpTitle = form.seo_meta_title || "Maulana Ihsan Rohim · Portfolio & CMS";
  const serpDesc = form.seo_meta_description || "Portfolio, blog, dan layanan digital marketing dari Maulana Ihsan Rohim.";
  const serpUrl = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div>
      <AdminPageHeader
        title="SEO Settings"
        description="Optimasi mesin pencari untuk situs Anda"
        icon={Search}
        action={
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: form */}
        <div className="space-y-4">
          <Card className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="size-4" />
              </div>
              <h3 className="font-semibold">Meta Tags</h3>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-title">Meta Title</Label>
                <span className={cn("text-xs font-medium", titleColor)}>{titleCount} / 60</span>
              </div>
              <Input
                id="seo-title"
                value={form.seo_meta_title}
                onChange={(e) => update("seo_meta_title", e.target.value)}
                placeholder="Maulana Ihsan Rohim · Portfolio & CMS"
                maxLength={100}
                className="rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">Optimal: 50-60 karakter.</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-desc">Meta Description</Label>
                <span className={cn("text-xs font-medium", descColor)}>{descCount} / 160</span>
              </div>
              <Textarea
                id="seo-desc"
                value={form.seo_meta_description}
                onChange={(e) => update("seo_meta_description", e.target.value)}
                placeholder="Deskripsi singkat untuk mesin pencari..."
                maxLength={250}
                className="rounded-lg min-h-[90px]"
              />
              <p className="text-[11px] text-muted-foreground">Optimal: 150-160 karakter.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo-keywords">Meta Keywords</Label>
              <Input
                id="seo-keywords"
                value={form.seo_meta_keywords}
                onChange={(e) => update("seo_meta_keywords", e.target.value)}
                placeholder="portfolio, digital marketing, content creator"
                className="rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">Pisahkan dengan koma.</p>
            </div>
          </Card>

          <Card className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                <ImageIcon className="size-4" />
              </div>
              <h3 className="font-semibold">Open Graph</h3>
            </div>

            <MediaPicker
              label="OG Image (1200×630)"
              value={form.seo_og_image}
              onChange={(url) => update("seo_og_image", url)}
              accept="image"
            />

            <div className="space-y-1.5">
              <Label htmlFor="og-title">OG Title</Label>
              <Input
                id="og-title"
                value={form.seo_og_title}
                onChange={(e) => update("seo_og_title", e.target.value)}
                placeholder="Judul untuk preview sosial media"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="og-desc">OG Description</Label>
              <Textarea
                id="og-desc"
                value={form.seo_og_description}
                onChange={(e) => update("seo_og_description", e.target.value)}
                placeholder="Deskripsi untuk preview sosial media"
                className="rounded-lg min-h-[70px]"
              />
            </div>
          </Card>
        </div>

        {/* RIGHT: previews + info */}
        <div className="space-y-4">
          <Card className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="size-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                <Globe className="size-4" />
              </div>
              <h3 className="font-semibold">Google SERP Preview</h3>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-white border"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="size-7 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold">
                  MI
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 truncate">Maulana Ihsan Rohim</p>
                  <p className="text-[11px] text-emerald-700 truncate">{serpUrl} ›</p>
                </div>
              </div>
              <h4 className="text-lg text-blue-700 hover:underline cursor-pointer truncate mt-1">
                {serpTitle}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{serpDesc}</p>
            </motion.div>
            <p className="text-[11px] text-muted-foreground">
              Begini tampilan situs Anda di hasil pencarian Google.
            </p>
          </Card>

          <Card className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                <ImageIcon className="size-4" />
              </div>
              <h3 className="font-semibold">Open Graph Preview</h3>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border overflow-hidden bg-white"
            >
              {form.seo_og_image ? (
                <div className="aspect-[1.91/1] bg-muted">
                  <img src={form.seo_og_image} alt="OG preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[1.91/1] bg-amber-100 flex items-center justify-center text-amber-500">
                  <ImageIcon className="size-10 opacity-50" />
                </div>
              )}
              <div className="p-3">
                <p className="text-[10px] text-gray-500 uppercase">{serpUrl}</p>
                <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">
                  {form.seo_og_title || serpTitle}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                  {form.seo_og_description || serpDesc}
                </p>
              </div>
            </motion.div>
            <p className="text-[11px] text-muted-foreground">
              Preview saat situs dibagikan di Facebook, LinkedIn, WhatsApp.
            </p>
          </Card>

          <Card className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Sparkles className="size-4" />
              </div>
              <h3 className="font-semibold">Index Files</h3>
            </div>
            <div className="space-y-2">
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">robots.txt</p>
                    <p className="text-[11px] text-muted-foreground">Aturan crawling mesin pencari</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </a>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">sitemap.xml</p>
                    <p className="text-[11px] text-muted-foreground">Peta situs untuk SEO</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </a>
              <a
                href="/sitemap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Peta Situs (HTML)</p>
                    <p className="text-[11px] text-muted-foreground">Daftar semua halaman</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </a>
            </div>
            <div className="pt-2 mt-1 border-t">
              <Badge variant="outline" className="text-[10px]">
                Pengaturan ini diterapkan di metadata root layout
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
