"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, User, Share2, BarChart3, Palette, Loader2,
  Save, Download, Upload, Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaPicker } from "@/components/admin/media-picker";
import { toast } from "sonner";

type Settings = Record<string, string>;

type GroupKey = "GENERAL" | "PROFILE" | "SOCIAL" | "STATS" | "THEME" | "PRICING";

const GROUP_FIELDS: Record<GroupKey, { key: string; label: string; type: "text" | "textarea" | "number" | "switch" | "color" | "media" | "select"; placeholder?: string; options?: { value: string; label: string }[] }[]> = {
  GENERAL: [
    { key: "site_name", label: "Nama Situs", type: "text", placeholder: "Maulana Ihsan Rohim" },
    { key: "site_tagline", label: "Tagline", type: "text", placeholder: "Portfolio & Content Management" },
    { key: "site_description", label: "Deskripsi Situs", type: "textarea", placeholder: "Deskripsi singkat tentang situs" },
    { key: "map_embed", label: "Embed Google Maps", type: "textarea", placeholder: "Tempel URL embed atau kode iframe dari Google Maps" },
    { key: "cookie_consent", label: "Aktifkan Cookie Consent", type: "switch" },
    { key: "whatsapp_float", label: "Tampilkan Tombol WhatsApp Float", type: "switch" },
    { key: "newsletter_section", label: "Tampilkan Section Newsletter di Homepage", type: "switch" },
    { key: "budget_estimator", label: "Tampilkan Estimasi Harga di Halaman Contact", type: "switch" },
    { key: "market_section", label: "Tampilkan Fitur Market (Halaman, Nav & Tools — artikel market tetap tampil di Blog)", type: "switch" },
    { key: "market_portfolio", label: "Tampilkan Portofolio Investasi di Halaman Market", type: "switch" },
  ],
  PROFILE: [
    { key: "owner_name", label: "Nama Lengkap", type: "text", placeholder: "Maulana Ihsan Rohim" },
    { key: "owner_profession", label: "Profesi", type: "textarea", placeholder: "Digital Marketer & Content Creator" },
    { key: "owner_email", label: "Email", type: "text", placeholder: "email@anda.com" },
    { key: "owner_phone", label: "Telepon", type: "text", placeholder: "+62 8xx-xxxx-xxxx" },
    { key: "owner_location", label: "Lokasi", type: "text", placeholder: "Jakarta, Indonesia" },
    { key: "owner_photo", label: "Foto Profil", type: "media" },
    { key: "owner_cv", label: "URL CV / Resume", type: "text", placeholder: "/uploads/cv.pdf" },
    { key: "owner_vision", label: "Visi", type: "textarea" },
    { key: "owner_mission", label: "Misi", type: "textarea" },
    { key: "owner_values", label: "Nilai-nilai (pisahkan koma)", type: "text" },
    { key: "owner_hobbies", label: "Hobi (pisahkan koma)", type: "text" },
    { key: "owner_languages", label: "Bahasa (pisahkan koma)", type: "text" },
  ],
  SOCIAL: [
    { key: "social_github", label: "GitHub", type: "text" },
    { key: "social_linkedin", label: "LinkedIn", type: "text" },
    { key: "social_instagram", label: "Instagram", type: "text" },
    { key: "social_facebook", label: "Facebook", type: "text" },
    { key: "social_tiktok", label: "TikTok", type: "text" },
    { key: "social_youtube", label: "YouTube", type: "text" },
    { key: "social_whatsapp", label: "WhatsApp", type: "text" },
  ],
  STATS: [
    { key: "stat_projects", label: "Jumlah Project", type: "number" },
    { key: "stat_clients", label: "Jumlah Klien", type: "number" },
    { key: "stat_certificates", label: "Jumlah Sertifikat", type: "number" },
    { key: "stat_articles", label: "Jumlah Artikel", type: "number" },
    { key: "stat_experience", label: "Tahun Pengalaman", type: "number" },
  ],
  PRICING: [
    { key: "price_digital-marketing", label: "Harga Digital Marketing (per kampanye)", type: "number", placeholder: "5000000" },
    { key: "price_social-media", label: "Harga Social Media Management (per bulan)", type: "number", placeholder: "3000000" },
    { key: "price_photography", label: "Harga Photography (per sesi)", type: "number", placeholder: "1500000" },
    { key: "price_videography", label: "Harga Videography (per proyek)", type: "number", placeholder: "5000000" },
    { key: "price_video-editing", label: "Harga Video Editing (per video)", type: "number", placeholder: "2000000" },
    { key: "price_web-development", label: "Harga Website Development (per proyek)", type: "number", placeholder: "8000000" },
  ],
  THEME: [
    { key: "theme_accent", label: "Warna Aksen", type: "color" },
    {
      key: "theme_animation_speed",
      label: "Kecepatan Animasi",
      type: "select",
      options: [
        { value: "slow", label: "Lambat" },
        { value: "normal", label: "Normal" },
        { value: "fast", label: "Cepat" },
      ],
    },
  ],
};

const GROUP_ICONS: Record<GroupKey, any> = {
  GENERAL: SettingsIcon,
  PROFILE: User,
  SOCIAL: Share2,
  STATS: BarChart3,
  PRICING: Calculator,
  THEME: Palette,
};

export function SettingsManager({ settings }: { settings: Settings }) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<GroupKey>("GENERAL");
  const [form, setForm] = useState<Settings>(settings);
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const exportSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings-export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // WIB: nama file pakai tanggal Jakarta (en-CA → format YYYY-MM-DD)
      a.download = `settings-export-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Settings diekspor");
    } catch {
      toast.error("Gagal ekspor");
    }
  };

  const importSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        toast.error("Format file tidak valid");
        return;
      }
      const res = await fetch("/api/admin/settings-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`${result.count} settings diimpor`);
        router.refresh();
      } else {
        toast.error("Gagal impor");
      }
    } catch {
      toast.error("File tidak valid");
    }
    if (importRef.current) importRef.current.value = "";
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const fields = GROUP_FIELDS[active];
      const items = fields.map((f) => {
        const type =
          f.type === "color" ? "COLOR" :
          f.type === "media" ? "IMAGE" :
          f.type === "number" ? "NUMBER" :
          f.type === "switch" ? "BOOLEAN" : "TEXT";
        return {
          key: f.key,
          value: form[f.key] ?? (f.type === "switch" ? "false" : ""),
          group: active,
          type,
        };
      });

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menyimpan");
      }
      toast.success("Pengaturan disimpan");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f: { key: string; label: string; type: string; placeholder?: string; options?: { value: string; label: string }[] }) => {
    const val = form[f.key] ?? "";
    const id = `set-${f.key}`;

    if (f.type === "switch") {
      return (
        <div className="flex items-center justify-between gap-3 py-1.5">
          <Label htmlFor={id} className="cursor-pointer">{f.label}</Label>
          <Switch
            id={id}
            checked={val === "true"}
            onCheckedChange={(c) => update(f.key, c ? "true" : "false")}
          />
        </div>
      );
    }

    if (f.type === "color") {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{f.label}</Label>
          <div className="flex gap-2 items-center">
            <input
              id={id}
              type="color"
              value={val || "#f59e0b"}
              onChange={(e) => update(f.key, e.target.value)}
              className="size-10 rounded-lg border cursor-pointer"
            />
            <Input
              value={val}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder="#f59e0b"
              className="rounded-lg flex-1 font-mono text-sm"
            />
          </div>
        </div>
      );
    }

    if (f.type === "select") {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{f.label}</Label>
          <Select value={val || "normal"} onValueChange={(v) => update(f.key, v)}>
            <SelectTrigger id={id} className="rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {f.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (f.type === "media") {
      return (
        <div className="space-y-1.5">
          <Label>{f.label}</Label>
          <MediaPicker
            value={val}
            onChange={(url) => update(f.key, url)}
            accept="image"
            label=""
          />
        </div>
      );
    }

    if (f.type === "textarea") {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{f.label}</Label>
          <Textarea
            id={id}
            value={val}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="rounded-lg min-h-[80px]"
          />
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{f.label}</Label>
        <Input
          id={id}
          type={f.type === "number" ? "number" : "text"}
          value={val}
          onChange={(e) => update(f.key, e.target.value)}
          placeholder={f.placeholder}
          className="rounded-lg"
        />
      </div>
    );
  };

  return (
    <div>
      <AdminPageHeader
        title="Pengaturan"
        description="Kelola konfigurasi situs, profil, dan tampilan"
        icon={SettingsIcon}
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={exportSettings}>
              <Download className="size-4" /> Export
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => importRef.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importSettings}
            />
          </div>
        }
      />

      <Tabs value={active} onValueChange={(v) => setActive(v as GroupKey)}>
        <TabsList className="rounded-xl h-auto p-1 flex flex-wrap gap-1">
          {(Object.keys(GROUP_FIELDS) as GroupKey[]).map((g) => {
            const Icon = GROUP_ICONS[g];
            return (
              <TabsTrigger
                key={g}
                value={g}
                className="rounded-lg px-3 py-1.5 flex items-center gap-1.5"
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{g.charAt(0) + g.slice(1).toLowerCase()}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(GROUP_FIELDS) as GroupKey[]).map((g) => (
          <TabsContent key={g} value={g}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              <Card className="glass rounded-2xl p-5 lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {(() => {
                      const Icon = GROUP_ICONS[g];
                      return <Icon className="size-4" />;
                    })()}
                  </div>
                  <h3 className="font-semibold">Konfigurasi {g.charAt(0) + g.slice(1).toLowerCase()}</h3>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${g === "PROFILE" || g === "GENERAL" ? "" : ""}`}>
                  {GROUP_FIELDS[g].map((f) => (
                    <div key={f.key} className={f.type === "textarea" || f.type === "media" || (f.type === "switch" && g === "GENERAL") ? "sm:col-span-2" : ""}>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-3 border-t">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Simpan Perubahan
                  </Button>
                </div>
              </Card>

              {/* Helper side card */}
              <Card className="glass rounded-2xl p-5 h-fit space-y-3">
                <h4 className="text-sm font-semibold">Tips</h4>
                {g === "GENERAL" && (
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li><b>Nama Situs</b> digunakan untuk judul dan brand.</li>
                    <li><b>Tagline</b> muncul di header & meta tag.</li>
                    <li><b>Cookie Consent</b> menampilkan banner privasi.</li>
                    <li><b>WhatsApp Float</b> menampilkan tombol melayang.</li>
                  </ul>
                )}
                {g === "PROFILE" && (
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Bidang <b>Visi & Misi</b> tampil di halaman About.</li>
                    <li><b>Nilai/Hobi/Bahasa</b> pisahkan dengan koma.</li>
                    <li><b>Foto Profil</b> pilih dari Media Library.</li>
                  </ul>
                )}
                {g === "SOCIAL" && (
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Masukkan URL lengkap (https://...).</li>
                    <li>Kosongkan jika tidak punya akun.</li>
                    <li><b>WhatsApp</b>: nomor dengan kode negara (628...).</li>
                  </ul>
                )}
                {g === "STATS" && (
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Angka ini ditampilkan di halaman About.</li>
                    <li>Bisa berbeda dari data aktual database.</li>
                  </ul>
                )}
                {g === "THEME" && (
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li><b>Warna Aksen</b> mengubah warna utama situs.</li>
                    <li><b>Kecepatan Animasi</b> memengaruhi transisi Framer Motion.</li>
                  </ul>
                )}
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
