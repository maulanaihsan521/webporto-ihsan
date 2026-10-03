"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Star, Eye, Loader2, Briefcase, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { MediaPicker } from "@/components/admin/media-picker";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import {
  PortfolioGalleryEditor,
  type GalleryImage,
} from "@/components/admin/portfolio-gallery-editor";
import { cn, slugify, formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryLite {
  id: string;
  name: string;
  slug: string;
}
interface PortfolioImageCount {
  _count: { images: number };
}
interface PortfolioRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  status: string;
  featured: boolean;
  projectDate: string | null;
  viewCount: number;
  client: string | null;
  category: { id: string; name: string } | null;
  images?: { url: string }[];
}

interface PortfolioManagerProps {
  data: PortfolioRow[];
  categories: CategoryLite[];
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  thumbnail: string;
  banner: string;
  videoUrl: string;
  role: string;
  client: string;
  status: string;
  projectDate: string;
  technologies: string;
  githubUrl: string;
  demoUrl: string;
  figmaUrl: string;
  youtubeUrl: string;
  downloadUrl: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  categoryId: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  thumbnail: "",
  banner: "",
  videoUrl: "",
  role: "",
  client: "",
  status: "PUBLISHED",
  projectDate: "",
  technologies: "",
  githubUrl: "",
  demoUrl: "",
  figmaUrl: "",
  youtubeUrl: "",
  downloadUrl: "",
  featured: false,
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  categoryId: "",
};

export function PortfolioManager({ data, categories }: PortfolioManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setGallery([]);
    setOpen(true);
  };

  // FIX race-condition: fetch detail DULU, baru buka dialog.
  // Sebelumnya dialog dibuka dengan data dari row tabel (sebagian field kosong),
  // lalu fetch detail override form belakangan → kalau user sudah mulai ngetik
  // di Excerpt (atau field lain) sebelum fetch resolve, edit-an user hilang.
  // Sekarang: tombol Edit menampilkan spinner selama fetch, dialog baru
  // dibuka setelah semua field terisi benar dari API.
  const openEdit = async (row: PortfolioRow) => {
    setEditingId(row.id);
    try {
      const res = await fetch(`/api/admin/portfolio/${row.id}`);
      if (!res.ok) throw new Error("Gagal memuat detail");
      const d = await res.json();
      if (!d || !d.id) throw new Error("Data tidak ditemukan");

      setForm({
        id: d.id,
        title: d.title ?? "",
        slug: d.slug ?? "",
        excerpt: d.excerpt || "",
        description: d.description || "",
        thumbnail: d.thumbnail || "",
        banner: d.banner || "",
        videoUrl: d.videoUrl || "",
        role: d.role || "",
        client: d.client || "",
        status: d.status ?? "PUBLISHED",
        projectDate: d.projectDate ? d.projectDate.slice(0, 10) : "",
        technologies: d.technologies || "",
        githubUrl: d.githubUrl || "",
        demoUrl: d.demoUrl || "",
        figmaUrl: d.figmaUrl || "",
        youtubeUrl: d.youtubeUrl || "",
        downloadUrl: d.downloadUrl || "",
        featured: d.featured ?? false,
        metaTitle: d.metaTitle || "",
        metaDescription: d.metaDescription || "",
        ogImage: d.ogImage || "",
        categoryId: d.categoryId || "",
      });
      setGallery(
        Array.isArray(d.images)
          ? d.images.map((im: any) => ({
              id: im.id,
              url: im.url,
              caption: im.caption ?? null,
              order: im.order ?? 0,
            }))
          : []
      );
      setSlugTouched(true);
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat detail portfolio");
    } finally {
      setEditingId(null);
    }
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
      toast.error("Judul wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      const url = form.id
        ? `/api/admin/portfolio/${form.id}`
        : "/api/admin/portfolio";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Portfolio diperbarui" : "Portfolio dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: PortfolioRow) => {
    try {
      const res = await fetch(`/api/admin/portfolio/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Portfolio dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const togglePublish = async (row: PortfolioRow) => {
    const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/portfolio/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      toast.success(next === "PUBLISHED" ? "Portfolio dipublikasikan" : "Portfolio diset ke draft");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal");
    }
  };

  const columns: Column<PortfolioRow>[] = useMemo(
    () => [
      {
        key: "thumbnail",
        header: "Thumbnail",
        className: "w-20",
        render: (row) =>
          row.thumbnail ? (
            <img
              src={row.thumbnail}
              alt={row.title}
              className="size-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="size-12 rounded-lg bg-muted/40 flex items-center justify-center">
              <Briefcase className="size-4 text-muted-foreground" />
            </div>
          ),
      },
      {
        key: "title",
        header: "Judul",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{row.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">/portfolio/{row.slug}</span>
          </div>
        ),
      },
      {
        key: "category",
        header: "Kategori",
        render: (row) =>
          row.category ? (
            <Badge variant="secondary" className="rounded-full">{row.category.name}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <Badge
            className={cn(
              "rounded-full border-0",
              row.status === "PUBLISHED"
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            {row.status}
          </Badge>
        ),
      },
      {
        key: "featured",
        header: "Featured",
        render: (row) =>
          row.featured ? (
            <Star className="size-4 fill-amber-500 text-amber-500" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "projectDate",
        header: "Tgl Proyek",
        sortable: true,
        render: (row) =>
          row.projectDate ? (
            <span className="text-sm">{formatDate(row.projectDate, { year: "numeric", month: "short", day: "numeric" })}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "viewCount",
        header: "Views",
        sortable: true,
        render: (row) => (
          <span className="flex items-center gap-1 text-sm">
            <Eye className="size-3.5 text-muted-foreground" />
            {formatNumber(row.viewCount)}
          </span>
        ),
      },
    ],
    []
  );

  const actions = (row: PortfolioRow) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => openEdit(row)}
        disabled={editingId === row.id}
        title="Edit"
      >
        {editingId === row.id ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Pencil className="size-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => togglePublish(row)}
        title={row.status === "PUBLISHED" ? "Set Draft" : "Publish"}
      >
        <Eye className="size-3.5" />
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8" title="View">
        <a href={`/portfolio/${row.slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.title}"?`}
        description="Portfolio dan semua gambarnya akan dihapus permanen."
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
        title="Portfolio"
        description={`${data.length} proyek terdaftar`}
        icon={Briefcase}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Portfolio
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["title", "client", "slug"]}
        searchPlaceholder="Cari portfolio..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Portfolio" : "Tambah Portfolio"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi proyek. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-title">Judul *</Label>
              <Input
                id="pf-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nama proyek"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-slug">Slug</Label>
              <Input
                id="pf-slug"
                value={form.slug}
                onChange={(e) => {
                  updateField("slug", slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="otomatis-dari-judul"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger id="pf-status" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-excerpt">Excerpt</Label>
              <Textarea
                id="pf-excerpt"
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="Ringkasan singkat proyek"
                className="rounded-lg min-h-[70px]"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-desc">Deskripsi (HTML)</Label>
              <Textarea
                id="pf-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="<p>Deskripsi proyek dalam HTML</p>"
                className="rounded-lg min-h-[140px] font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Editor HTML sederhana. Anda dapat menempelkan konten HTML dari editor eksternal.
              </p>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Thumbnail"
                value={form.thumbnail}
                onChange={(url) => updateField("thumbnail", url)}
                accept="image"
              />
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Banner (opsional)"
                value={form.banner}
                onChange={(url) => updateField("banner", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-category">Kategori</Label>
              <Select
                value={form.categoryId || "none"}
                onValueChange={(v) => updateField("categoryId", v === "none" ? "" : v)}
              >
                <SelectTrigger id="pf-category" className="rounded-lg">
                  <SelectValue placeholder="Tanpa kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-projectDate">Tanggal Proyek</Label>
              <Input
                id="pf-projectDate"
                type="date"
                value={form.projectDate}
                onChange={(e) => updateField("projectDate", e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-client">Klien</Label>
              <Input
                id="pf-client"
                value={form.client}
                onChange={(e) => updateField("client", e.target.value)}
                placeholder="Nama klien"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-role">Peran</Label>
              <Input
                id="pf-role"
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                placeholder="Lead Developer"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-tech">Teknologi (pisahkan koma)</Label>
              <Input
                id="pf-tech"
                value={form.technologies}
                onChange={(e) => updateField("technologies", e.target.value)}
                placeholder="Next.js, TypeScript, Tailwind"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-github">GitHub URL</Label>
              <Input
                id="pf-github"
                value={form.githubUrl}
                onChange={(e) => updateField("githubUrl", e.target.value)}
                placeholder="https://github.com/..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-demo">Demo URL</Label>
              <Input
                id="pf-demo"
                value={form.demoUrl}
                onChange={(e) => updateField("demoUrl", e.target.value)}
                placeholder="https://..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-figma">Figma URL</Label>
              <Input
                id="pf-figma"
                value={form.figmaUrl}
                onChange={(e) => updateField("figmaUrl", e.target.value)}
                placeholder="https://figma.com/..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-youtube">YouTube URL</Label>
              <Input
                id="pf-youtube"
                value={form.youtubeUrl}
                onChange={(e) => updateField("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-video">Video URL</Label>
              <Input
                id="pf-video"
                value={form.videoUrl}
                onChange={(e) => updateField("videoUrl", e.target.value)}
                placeholder="/uploads/video.mp4 atau URL eksternal"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-download">Download URL</Label>
              <Input
                id="pf-download"
                value={form.downloadUrl}
                onChange={(e) => updateField("downloadUrl", e.target.value)}
                placeholder="/uploads/file.zip"
                className="rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="pf-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="pf-featured">Featured (tampilkan di beranda)</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-metaTitle">Meta Title (SEO)</Label>
              <Input
                id="pf-metaTitle"
                value={form.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-metaDesc">Meta Description (SEO)</Label>
              <Input
                id="pf-metaDesc"
                value={form.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <MediaPicker
                label="OG Image (opsional)"
                value={form.ogImage}
                onChange={(url) => updateField("ogImage", url)}
                accept="image"
              />
            </div>
          </div>

          {form.id ? (
            <div className="mt-4 border-t pt-4">
              <PortfolioGalleryEditor
                key={form.id}
                portfolioId={form.id}
                initialImages={gallery}
              />
            </div>
          ) : null}

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat Portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
