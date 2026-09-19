"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, Code2, Star, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const CATEGORY_SUGGESTIONS = [
  "Digital Marketing", "Social Media", "Photography", "Videography",
  "Design", "Video Editing", "Development", "Database", "Tools",
  "Financial Market", "Data Analysis",
];

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner", className: "bg-amber-500/15 text-amber-600" },
  { value: "INTERMEDIATE", label: "Intermediate", className: "bg-cyan-500/15 text-cyan-600" },
  { value: "ADVANCED", label: "Advanced", className: "bg-violet-500/15 text-violet-600" },
  { value: "EXPERT", label: "Expert", className: "bg-emerald-500/15 text-emerald-600" },
] as const;

const ICON_SUGGESTIONS = [
  "Code2", "PenTool", "Camera", "Video", "Film", "Megaphone", "Share2",
  "TrendingUp", "Database", "BarChart3", "Palette", "Image", "Layout",
  "Smartphone", "Globe", "Server", "GitBranch", "Cpu",
];

const COLOR_SUGGESTIONS = [
  "amber", "rose", "violet", "cyan", "orange", "emerald", "fuchsia", "green",
] as const;

// Static class lookup so Tailwind JIT can detect them (dynamic bg-${x}-500 doesn't work)
const COLOR_DOT_CLASS: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  fuchsia: "bg-fuchsia-500",
  green: "bg-green-500",
};

interface SkillRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  percentage: number;
  level: string;
  icon: string | null;
  description: string | null;
  color: string | null;
  featured: boolean;
  order: number;
}

interface FormState {
  id?: string;
  name: string;
  slug: string;
  category: string;
  percentage: number;
  level: string;
  icon: string;
  description: string;
  color: string;
  featured: boolean;
  order: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  category: "",
  percentage: 50,
  level: "INTERMEDIATE",
  icon: "",
  description: "",
  color: "",
  featured: false,
  order: "0",
};

export function SkillsManager({ data }: { data: SkillRow[] }) {
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

  const openEdit = (row: SkillRow) => {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      percentage: row.percentage,
      level: row.level,
      icon: row.icon || "",
      description: row.description || "",
      color: row.color || "",
      featured: row.featured,
      order: String(row.order ?? 0),
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleNameChange = (val: string) => {
    updateField("name", val);
    if (!slugTouched) {
      updateField("slug", slugify(val));
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Nama skill wajib diisi");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Kategori wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order || 0),
        slug: form.slug || slugify(form.name),
      };
      const url = form.id ? `/api/admin/skills/${form.id}` : "/api/admin/skills";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Skill diperbarui" : "Skill dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: SkillRow) => {
    try {
      const res = await fetch(`/api/admin/skills/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Skill dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  // Inline percentage edit (nice-to-have)
  const handleInlinePercentage = async (row: SkillRow, value: number) => {
    try {
      const res = await fetch(`/api/admin/skills/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: value }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui persentase");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal");
    }
  };

  const columns: Column<SkillRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Skill",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            {row.featured ? (
              <Star className="size-4 fill-amber-500 text-amber-500 shrink-0" />
            ) : null}
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{row.name}</span>
              {row.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "category",
        header: "Kategori",
        render: (row) => (
          <Badge variant="secondary" className="rounded-full">{row.category}</Badge>
        ),
      },
      {
        key: "level",
        header: "Level",
        render: (row) => {
          const opt = LEVEL_OPTIONS.find((l) => l.value === row.level);
          return (
            <Badge className={cn("rounded-full border-0", opt?.className || "bg-muted text-muted-foreground")}>
              {opt?.label || row.level}
            </Badge>
          );
        },
      },
      {
        key: "percentage",
        header: "Persentase",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2 min-w-[160px]">
            <Progress value={row.percentage} className="flex-1 h-2" />
            <span className="text-xs tabular-nums font-medium w-9 text-right">{row.percentage}%</span>
            <Slider
              value={[row.percentage]}
              min={0}
              max={100}
              step={5}
              onValueCommit={(v) => handleInlinePercentage(row, v[0])}
              className="w-24"
              aria-label={`Persentase ${row.name}`}
            />
          </div>
        ),
      },
      {
        key: "color",
        header: "Warna",
        render: (row) =>
          row.color ? (
            <div className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-full", COLOR_DOT_CLASS[row.color] || "bg-muted")} />
              <span className="text-xs text-muted-foreground">{row.color}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
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

  const actions = (row: SkillRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus skill "${row.name}"?`}
        description="Skill ini akan dihapus permanen."
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
        title="Skills"
        description={`${data.length} skill terdaftar`}
        icon={Code2}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Skill
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["name", "category", "description"]}
        searchPlaceholder="Cari skill..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Skill" : "Tambah Skill"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi skill. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sk-name">Nama Skill *</Label>
              <Input
                id="sk-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="React, Adobe Premiere, SEO..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sk-slug">Slug</Label>
              <Input
                id="sk-slug"
                value={form.slug}
                onChange={(e) => {
                  updateField("slug", slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="otomatis-dari-nama"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sk-category">Kategori *</Label>
              <Input
                id="sk-category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Pilih atau ketik kategori"
                list="sk-category-list"
                className="rounded-lg"
              />
              <datalist id="sk-category-list">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1">
                {CATEGORY_SUGGESTIONS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField("category", c)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sk-level">Level</Label>
              <Select value={form.level} onValueChange={(v) => updateField("level", v)}>
                <SelectTrigger id="sk-level" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sk-percentage">Persentase: <span className="font-semibold text-primary">{form.percentage}%</span></Label>
              </div>
              <Slider
                id="sk-percentage"
                value={[form.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updateField("percentage", v[0])}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sk-icon">Icon (lucide name)</Label>
              <Input
                id="sk-icon"
                value={form.icon}
                onChange={(e) => updateField("icon", e.target.value)}
                placeholder="Code2, Camera, Palette..."
                list="sk-icon-list"
                className="rounded-lg"
              />
              <datalist id="sk-icon-list">
                {ICON_SUGGESTIONS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1">
                {ICON_SUGGESTIONS.slice(0, 6).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateField("icon", i)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sk-color">Warna (Tailwind)</Label>
              <Input
                id="sk-color"
                value={form.color}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="amber, violet, emerald..."
                list="sk-color-list"
                className="rounded-lg"
              />
              <datalist id="sk-color-list">
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
                      "size-5 rounded-full border-2 shadow-sm transition-transform hover:scale-110",
                      COLOR_DOT_CLASS[c],
                      form.color === c ? "ring-2 ring-primary ring-offset-2" : "border-white"
                    )}
                    title={c}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sk-desc">Deskripsi</Label>
              <Textarea
                id="sk-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ringkasan singkat tentang skill ini..."
                className="rounded-lg min-h-[70px]"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="sk-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="sk-featured" className="flex items-center gap-1">
                <Sparkles className="size-3.5 text-amber-500" /> Featured (tampilkan di beranda)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sk-order">Urutan Tampil</Label>
              <Input
                id="sk-order"
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
              {form.id ? "Simpan Perubahan" : "Buat Skill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
