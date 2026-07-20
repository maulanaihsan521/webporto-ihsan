"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, Settings, Megaphone, Share2, Camera, Video,
  Film, Code2, PenTool, TrendingUp, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { cn, slugify } from "@/lib/utils";
import { toast } from "sonner";

const ICON_SUGGESTIONS = [
  "Megaphone", "Share2", "Camera", "Video", "Film", "Code2", "PenTool", "TrendingUp",
];

const COLOR_SUGGESTIONS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
] as const;

// Static class map so Tailwind JIT picks them up
const COLOR_BADGE: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-600",
  rose: "bg-rose-500/15 text-rose-600",
  violet: "bg-violet-500/15 text-violet-600",
  cyan: "bg-cyan-500/15 text-cyan-600",
  orange: "bg-orange-500/15 text-orange-600",
  emerald: "bg-emerald-500/15 text-emerald-600",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-600",
  green: "bg-green-500/15 text-green-600",
};

// Map of lucide icon name → component (only for the suggested set; unknown → Settings)
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Megaphone, Share2, Camera, Video, Film, Code2, PenTool, TrendingUp, Settings,
};

interface ServiceRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  features: string | null;
  order: number;
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  features: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  icon: "",
  color: "",
  features: "",
  order: "0",
};

const countFeatures = (features: string | null): number => {
  if (!features || !features.trim()) return 0;
  return features
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
};

export function ServicesManager({ data }: { data: ServiceRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, order: String(data.length) });
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (row: ServiceRow) => {
    setForm({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description || "",
      icon: row.icon || "",
      color: row.color || "",
      features: row.features || "",
      order: String(row.order ?? 0),
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleTitleChange = (val: string) => {
    updateField("title", val);
    if (!slugTouched) {
      updateField("slug", slugify(val));
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Judul layanan wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        order: Number(form.order || 0),
      };
      const url = form.id ? `/api/admin/services/${form.id}` : "/api/admin/services";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Layanan diperbarui" : "Layanan dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: ServiceRow) => {
    try {
      const res = await fetch(`/api/admin/services/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Layanan dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const columns: Column<ServiceRow>[] = useMemo(
    () => [
      {
        key: "icon",
        header: "Icon",
        className: "w-16",
        render: (row) => {
          const Icon = (row.icon && ICON_COMPONENTS[row.icon]) || Settings;
          const color = row.color && COLOR_BADGE[row.color];
          return (
            <div className={cn("size-9 rounded-lg flex items-center justify-center", color || "bg-muted/40")}>
              <Icon className="size-4" />
            </div>
          );
        },
      },
      {
        key: "title",
        header: "Judul",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{row.title}</span>
            {row.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>
            )}
          </div>
        ),
      },
      {
        key: "color",
        header: "Warna",
        render: (row) =>
          row.color ? (
            <Badge className={cn("rounded-full border-0 capitalize", COLOR_BADGE[row.color] || "bg-muted text-muted-foreground")}>
              {row.color}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "features",
        header: "Fitur",
        render: (row) => {
          const count = countFeatures(row.features);
          return (
            <span className="flex items-center gap-1 text-sm">
              <ListChecks className="size-3.5 text-muted-foreground" />
              {count} fitur
            </span>
          );
        },
      },
      {
        key: "order",
        header: "Urutan",
        sortable: true,
        render: (row) => <span className="text-sm tabular-nums">{row.order}</span>,
      },
    ],
    []
  );

  const actions = (row: ServiceRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus layanan "${row.title}"?`}
        description="Layanan ini akan dihapus permanen."
        onConfirm={() => handleDelete(row)}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:text-red-700" title="Hapus">
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
    </>
  );

  return (
    <div>
      <AdminPageHeader
        title="Services"
        description={`${data.length} layanan terdaftar`}
        icon={Settings}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Layanan
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["title", "description", "features"]}
        searchPlaceholder="Cari layanan..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi layanan. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sv-title">Judul *</Label>
              <Input
                id="sv-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Digital Marketing, Web Development..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sv-slug">Slug</Label>
              <Input
                id="sv-slug"
                value={form.slug}
                onChange={(e) => {
                  updateField("slug", slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="otomatis-dari-judul"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sv-desc">Deskripsi</Label>
              <Textarea
                id="sv-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ringkasan singkat tentang layanan..."
                className="rounded-lg min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sv-icon">Icon (lucide name)</Label>
              <Input
                id="sv-icon"
                value={form.icon}
                onChange={(e) => updateField("icon", e.target.value)}
                placeholder="Megaphone, Camera, Code2..."
                list="sv-icon-list"
                className="rounded-lg"
              />
              <datalist id="sv-icon-list">
                {ICON_SUGGESTIONS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1">
                {ICON_SUGGESTIONS.map((i) => {
                  const Icon = ICON_COMPONENTS[i] || Settings;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => updateField("icon", i)}
                      className={cn(
                        "size-7 rounded-md flex items-center justify-center border transition-colors",
                        form.icon === i
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
                      )}
                      title={i}
                      aria-label={i}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sv-color">Warna</Label>
              <Input
                id="sv-color"
                value={form.color}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="amber, violet, cyan..."
                list="sv-color-list"
                className="rounded-lg"
              />
              <datalist id="sv-color-list">
                {COLOR_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COLOR_SUGGESTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField("color", c)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] border transition-colors",
                      form.color === c
                        ? "border-primary text-primary font-medium"
                        : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sv-features">Fitur (pisahkan koma)</Label>
              <Textarea
                id="sv-features"
                value={form.features}
                onChange={(e) => updateField("features", e.target.value)}
                placeholder="SEO Optimization, Content Strategy, Social Media Management..."
                className="rounded-lg min-h-[80px]"
              />
              <p className="text-[11px] text-muted-foreground">
                Pisahkan setiap fitur dengan koma. Akan ditampilkan sebagai daftar di halaman publik.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sv-order">Urutan Tampil</Label>
              <Input
                id="sv-order"
                type="number"
                value={form.order}
                onChange={(e) => updateField("order", e.target.value)}
                className="rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">Urutan lebih kecil tampil lebih awal.</p>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat Layanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
