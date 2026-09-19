"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Star, Loader2, Award, ExternalLink, FileText,
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
import { cn, slugify, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryLite { id: string; name: string; slug: string; }

interface CertificateRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  fileUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
  category: { id: string; name: string } | null;
}

interface CertificateManagerProps {
  data: CertificateRow[];
  categories: CategoryLite[];
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
  fileUrl: string;
  imageUrl: string;
  featured: boolean;
  categoryId: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  credentialUrl: "",
  fileUrl: "",
  imageUrl: "",
  featured: false,
  categoryId: "",
};

export function CertificateManager({ data, categories }: CertificateManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (row: CertificateRow) => {
    setForm({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description || "",
      issuer: row.issuer,
      issueDate: row.issueDate ? row.issueDate.slice(0, 10) : "",
      expiryDate: row.expiryDate ? row.expiryDate.slice(0, 10) : "",
      credentialId: row.credentialId || "",
      credentialUrl: row.credentialUrl || "",
      fileUrl: row.fileUrl || "",
      imageUrl: row.imageUrl || "",
      featured: row.featured,
      categoryId: row.category?.id || "",
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleTitleChange = (val: string) => {
    updateField("title", val);
    if (!slugTouched) updateField("slug", slugify(val));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    if (!form.issuer.trim()) {
      toast.error("Penerbit wajib diisi");
      return;
    }
    if (!form.issueDate) {
      toast.error("Tanggal terbit wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const url = form.id ? `/api/admin/certificates/${form.id}` : "/api/admin/certificates";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Sertifikat diperbarui" : "Sertifikat dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: CertificateRow) => {
    try {
      const res = await fetch(`/api/admin/certificates/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Sertifikat dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const toggleFeatured = async (row: CertificateRow) => {
    try {
      const res = await fetch(`/api/admin/certificates/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !row.featured }),
      });
      if (!res.ok) throw new Error("Gagal");
      toast.success(!row.featured ? "Ditandai featured" : "Featured dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal");
    }
  };

  const columns: Column<CertificateRow>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Judul",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{row.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">/certificates/{row.slug}</span>
          </div>
        ),
      },
      {
        key: "issuer",
        header: "Penerbit",
        sortable: true,
        render: (row) => <span className="text-sm">{row.issuer}</span>,
      },
      {
        key: "issueDate",
        header: "Tgl Terbit",
        sortable: true,
        render: (row) => <span className="text-sm">{formatDate(row.issueDate, { year: "numeric", month: "short", day: "numeric" })}</span>,
      },
      {
        key: "expiryDate",
        header: "Berlaku Hingga",
        render: (row) =>
          row.expiryDate ? (
            <span className="text-sm">{formatDate(row.expiryDate, { year: "numeric", month: "short", day: "numeric" })}</span>
          ) : (
            <Badge variant="outline" className="rounded-full text-emerald-600 border-emerald-500/30">Seumur Hidup</Badge>
          ),
      },
      {
        key: "category",
        header: "Kategori",
        render: (row) =>
          row.category ? <Badge variant="secondary" className="rounded-full">{row.category.name}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        key: "featured",
        header: "Featured",
        render: (row) =>
          row.featured ? <Star className="size-4 fill-amber-500 text-amber-500" /> : <span className="text-xs text-muted-foreground">—</span>,
      },
    ],
    []
  );

  const actions = (row: CertificateRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleFeatured(row)} title="Toggle Featured">
        <Star className={cn("size-3.5", row.featured && "fill-amber-500 text-amber-500")} />
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8" title="View">
        <a href={`/certificates/${row.slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.title}"?`}
        description="Sertifikat akan dihapus permanen."
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
        title="Certificates"
        description={`${data.length} sertifikat terdaftar`}
        icon={Award}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Sertifikat
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["title", "issuer", "slug"]}
        searchPlaceholder="Cari sertifikat..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Sertifikat" : "Tambah Sertifikat"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi sertifikat. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-title">Judul *</Label>
              <Input
                id="c-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nama sertifikat"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-slug">Slug</Label>
              <Input
                id="c-slug"
                value={form.slug}
                onChange={(e) => { updateField("slug", slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="otomatis-dari-judul"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-issuer">Penerbit *</Label>
              <Input
                id="c-issuer"
                value={form.issuer}
                onChange={(e) => updateField("issuer", e.target.value)}
                placeholder="Nama institusi/organisasi"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-issueDate">Tanggal Terbit *</Label>
              <Input
                id="c-issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => updateField("issueDate", e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-expiryDate">Berlaku Hingga (opsional)</Label>
              <Input
                id="c-expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField("expiryDate", e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-category">Kategori</Label>
              <Select value={form.categoryId || "none"} onValueChange={(v) => updateField("categoryId", v === "none" ? "" : v)}>
                <SelectTrigger id="c-category" className="rounded-lg">
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
              <Label htmlFor="c-credentialId">Credential ID</Label>
              <Input
                id="c-credentialId"
                value={form.credentialId}
                onChange={(e) => updateField("credentialId", e.target.value)}
                placeholder="ID kredensial"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-credentialUrl">Credential URL</Label>
              <Input
                id="c-credentialUrl"
                value={form.credentialUrl}
                onChange={(e) => updateField("credentialUrl", e.target.value)}
                placeholder="https://..."
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-desc">Deskripsi</Label>
              <Textarea
                id="c-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Deskripsi singkat sertifikat"
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Sertifikat Image (PNG/JPG)"
                value={form.imageUrl}
                onChange={(url) => updateField("imageUrl", url)}
                accept="image"
              />
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="File Sertifikat (PDF)"
                value={form.fileUrl}
                onChange={(url) => updateField("fileUrl", url)}
                accept="all"
              />
              {form.fileUrl && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <FileText className="size-3" /> File: {form.fileUrl.split("/").pop()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="c-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="c-featured">Featured</Label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat Sertifikat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
