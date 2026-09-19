"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Star, Eye, Loader2, FileText, ExternalLink,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { cn, slugify, formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryLite { id: string; name: string; slug: string; }
interface TagLite { id: string; name: string; slug: string; }

interface PostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  documentUrl: string | null;
  published: boolean;
  featured: boolean;
  viewCount: number;
  publishedAt: string | null;
  category: { id: string; name: string } | null;
  author: { id: string; name: string | null } | null;
  tags: { id: string; name: string }[];
}

interface BlogManagerProps {
  data: PostRow[];
  categories: CategoryLite[];
  tags: TagLite[];
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonical: string;
  ogImage: string;
  documentUrl: string;
  publishedAt: string;
  categoryId: string;
  tagIds: string[];
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
  featured: false,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonical: "",
  ogImage: "",
  documentUrl: "",
  publishedAt: "",
  categoryId: "",
  tagIds: [],
};

export function BlogManager({ data, categories, tags }: BlogManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (row: PostRow) => {
    setForm({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt || "",
      content: "",
      coverImage: row.coverImage || "",
      published: row.published,
      featured: row.featured,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      canonical: "",
      ogImage: "",
      documentUrl: "",
      publishedAt: row.publishedAt ? row.publishedAt.slice(0, 10) : "",
      categoryId: row.category?.id || "",
      tagIds: row.tags.map((t) => t.id),
    });
    setSlugTouched(true);
    setOpen(true);
    fetch(`/api/admin/blog/${row.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.id) {
          setForm((f) => ({
            ...f,
            excerpt: d.excerpt || "",
            content: d.content || "",
            coverImage: d.coverImage || "",
            metaTitle: d.metaTitle || "",
            metaDescription: d.metaDescription || "",
            metaKeywords: d.metaKeywords || "",
            canonical: d.canonical || "",
            ogImage: d.ogImage || "",
            documentUrl: d.documentUrl || "",
            publishedAt: d.publishedAt ? d.publishedAt.slice(0, 10) : "",
            categoryId: d.categoryId || "",
            tagIds: Array.isArray(d.tags) ? d.tags.map((t: any) => t.id) : [],
          }));
        }
      })
      .catch(() => {});
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleTitleChange = (val: string) => {
    updateField("title", val);
    if (!slugTouched) updateField("slug", slugify(val));
  };

  const toggleTag = (id: string) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((t) => t !== id) : [...f.tagIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      const url = form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Post diperbarui" : "Post dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: PostRow) => {
    try {
      const res = await fetch(`/api/admin/blog/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Post dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const togglePublish = async (row: PostRow) => {
    try {
      const res = await fetch(`/api/admin/blog/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !row.published }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      toast.success(!row.published ? "Post dipublikasikan" : "Post di-unpublish");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal");
    }
  };

  const columns: Column<PostRow>[] = useMemo(
    () => [
      {
        key: "coverImage",
        header: "Cover",
        className: "w-20",
        render: (row) =>
          row.coverImage ? (
            <img src={row.coverImage} alt={row.title} className="size-12 rounded-lg object-cover border" />
          ) : (
            <div className="size-12 rounded-lg bg-muted/40 flex items-center justify-center">
              <FileText className="size-4 text-muted-foreground" />
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
            <span className="text-xs text-muted-foreground line-clamp-1">/blog/{row.slug}</span>
            {row.documentUrl && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary w-fit">
                <FileText className="size-2.5" />
                Dokumen terlampir
              </span>
            )}
            {row.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {row.tags.slice(0, 3).map((t) => (
                  <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
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
        key: "published",
        header: "Status",
        sortable: true,
        render: (row) => (
          <Badge
            className={cn(
              "rounded-full border-0",
              row.published ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
            )}
          >
            {row.published ? "PUBLISHED" : "DRAFT"}
          </Badge>
        ),
      },
      {
        key: "featured",
        header: "Featured",
        render: (row) =>
          row.featured ? <Star className="size-4 fill-amber-500 text-amber-500" /> : <span className="text-xs text-muted-foreground">—</span>,
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
      {
        key: "publishedAt",
        header: "Tgl Terbit",
        sortable: true,
        render: (row) =>
          row.publishedAt ? (
            <span className="text-sm">{formatDate(row.publishedAt, { year: "numeric", month: "short", day: "numeric" })}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  const actions = (row: PostRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => togglePublish(row)}
        title={row.published ? "Unpublish" : "Publish"}
      >
        <Eye className="size-3.5" />
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8" title="View">
        <a href={`/blog/${row.slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.title}"?`}
        description="Post dan semua komentarnya akan dihapus permanen."
        onConfirm={() => handleDelete(row)}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:text-red-700" title="Hapus">
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
    </>
  );

  const selectedTagsLabel = form.tagIds.length === 0
    ? "Pilih tag"
    : `${form.tagIds.length} tag dipilih`;

  return (
    <div>
      <AdminPageHeader
        title="Blog Posts"
        description={`${data.length} artikel terdaftar`}
        icon={FileText}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Post
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["title", "slug", "excerpt"]}
        searchPlaceholder="Cari post..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Post" : "Tambah Post"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi artikel. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bp-title">Judul *</Label>
              <Input
                id="bp-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Judul artikel"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bp-slug">Slug</Label>
              <Input
                id="bp-slug"
                value={form.slug}
                onChange={(e) => { updateField("slug", slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="otomatis-dari-judul"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bp-category">Kategori</Label>
              <Select value={form.categoryId || "none"} onValueChange={(v) => updateField("categoryId", v === "none" ? "" : v)}>
                <SelectTrigger id="bp-category" className="rounded-lg">
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

            <div className="space-y-2 sm:col-span-2">
              <Label>Tags</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" type="button" className="w-full justify-between rounded-lg font-normal">
                    {selectedTagsLabel}
                    <Check className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full sm:w-[480px] p-2" align="start">
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Belum ada tag.</p>
                    ) : (
                      tags.map((t) => (
                        <label
                          key={t.id}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent cursor-pointer text-sm",
                            form.tagIds.includes(t.id) && "bg-accent"
                          )}
                        >
                          <Checkbox
                            checked={form.tagIds.includes(t.id)}
                            onCheckedChange={() => toggleTag(t.id)}
                          />
                          <span>#{t.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bp-excerpt">Excerpt</Label>
              <Textarea
                id="bp-excerpt"
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="Ringkasan singkat artikel"
                className="rounded-lg min-h-[70px]"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bp-content">Konten Artikel *</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => updateField("content", html)}
                placeholder="Tulis konten artikel di sini..."
                minHeight={300}
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan toolbar untuk formatting. Reading time dihitung otomatis dari konten.
              </p>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Cover Image"
                value={form.coverImage}
                onChange={(url) => updateField("coverImage", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bp-documentUrl" className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Link Dokumen
              </Label>
              <Input
                id="bp-documentUrl"
                type="url"
                value={form.documentUrl}
                onChange={(e) => updateField("documentUrl", e.target.value)}
                placeholder="https://drive.google.com/file/d/... atau link PDF dokumen asli"
                className="rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">
                Jika diisi, tombol <span className="font-medium text-foreground">“Lihat Dokumen”</span> akan muncul di
                halaman artikel blog. Contoh: link Google Drive, Dropbox, atau URL PDF.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="bp-published"
                checked={form.published}
                onCheckedChange={(v) => updateField("published", v)}
              />
              <Label htmlFor="bp-published">Publish</Label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="bp-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="bp-featured">Featured</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bp-publishedAt">Tanggal Terbit</Label>
              <Input
                id="bp-publishedAt"
                type="date"
                value={form.publishedAt}
                onChange={(e) => updateField("publishedAt", e.target.value)}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bp-metaTitle">Meta Title</Label>
              <Input
                id="bp-metaTitle"
                value={form.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-metaDesc">Meta Description</Label>
              <Input
                id="bp-metaDesc"
                value={form.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-metaKeywords">Meta Keywords</Label>
              <Input
                id="bp-metaKeywords"
                value={form.metaKeywords}
                onChange={(e) => updateField("metaKeywords", e.target.value)}
                placeholder="next.js, tutorial, web"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-canonical">Canonical URL</Label>
              <Input
                id="bp-canonical"
                value={form.canonical}
                onChange={(e) => updateField("canonical", e.target.value)}
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

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!form.title.trim()}>
              <Eye className="size-4" /> Preview
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4" /> Preview Artikel
            </DialogTitle>
            <DialogDescription>Pratinjau tampilan artikel sebelum dipublikasikan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {form.coverImage && (
               
              <img src={form.coverImage} alt={form.title} className="w-full aspect-[16/9] object-cover rounded-2xl" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {form.categoryId && (
                <Badge variant="secondary" className="rounded-full">
                  {categories.find((c) => c.id === form.categoryId)?.name || "Uncategorized"}
                </Badge>
              )}
              {form.featured && <Badge className="rounded-full bg-amber-500/15 text-amber-600 border-0"><Star className="size-3 mr-1" /> Featured</Badge>}
              {form.published ? <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 border-0">Published</Badge> : <Badge variant="outline" className="rounded-full">Draft</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">{form.title || "Untitled"}</h1>
            {form.excerpt && <p className="text-lg text-muted-foreground leading-relaxed">{form.excerpt}</p>}
            <div className="flex items-center gap-3 text-sm text-muted-foreground pb-4 border-b">
              <span className="font-medium text-foreground">Maulana Ihsan Rohim</span>
              <span>·</span>
              {/* WIB: pakai formatDate (Asia/Jakarta) supaya konsisten dengan render publik & admin lainnya */}
              <span>{form.publishedAt ? formatDate(form.publishedAt) : "Draft"}</span>
              <span>·</span>
              <span>{Math.max(1, Math.ceil(form.content.replace(/<[^>]*>/g, "").split(/\s+/).length / 200))} min read</span>
            </div>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: form.content || "<p class='text-muted-foreground'>Belum ada konten.</p>" }} />
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {form.tagIds.map((tid) => {
                const tag = tags.find((t) => t.id === tid);
                return tag ? <Badge key={tid} variant="outline" className="rounded-full">#{tag.name}</Badge> : null;
              })}
            </div>
            {form.metaTitle && (
              <div className="mt-4 p-4 rounded-xl bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground mb-1">SEO Meta</p>
                <p className="text-sm font-medium text-primary truncate">{form.metaTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{form.metaDescription}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="rounded-xl">Tutup</Button>
            <Button onClick={() => { setPreviewOpen(false); handleSubmit(); }} disabled={loading} className="rounded-xl">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Simpan & Publikasikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
