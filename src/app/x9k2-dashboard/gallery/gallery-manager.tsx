"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Pencil, Trash2, Star, Loader2, Image as ImageIcon, Film, ExternalLink, Upload, GripVertical, Save, X,
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

interface GalleryRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  url: string;
  type: string;
  thumbnail: string | null;
  album: string | null;
  featured: boolean;
  order: number;
  category: { id: string; name: string } | null;
  createdAt: string;
}

// Sortable Gallery Card Component
function SortableGalleryCard({ item }: { item: GalleryRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };
  const src = item.thumbnail || (item.type === "IMAGE" ? item.url : "");
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass relative rounded-xl border-2 border-border p-2 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="size-4 text-muted-foreground shrink-0" />
        <div className="size-12 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center shrink-0">
          {src ? (
            <img src={src} alt={item.title} className="size-12 object-cover" />
          ) : (
            <Film className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-1">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.type === "VIDEO" ? "Video" : "Image"}
            {item.album ? ` · ${item.album}` : ""}
          </p>
        </div>
        {item.featured && <Star className="size-3.5 fill-amber-500 text-amber-500 shrink-0" />}
      </div>
    </div>
  );
}

interface GalleryManagerProps {
  data: GalleryRow[];
  categories: CategoryLite[];
}

interface FormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  type: string;
  thumbnail: string;
  album: string;
  featured: boolean;
  categoryId: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  url: "",
  type: "IMAGE",
  thumbnail: "",
  album: "",
  featured: false,
  categoryId: "",
};

export function GalleryManager({ data, categories }: GalleryManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderItems, setReorderItems] = useState<GalleryRow[]>([]);
  const [reorderSaving, setReorderSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openReorder = () => {
    setReorderItems([...data]);
    setReorderOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setReorderItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveReorder = async () => {
    setReorderSaving(true);
    try {
      const items = reorderItems.map((item, index) => ({ id: item.id, order: index }));
      const res = await fetch("/api/admin/gallery/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan urutan");
      toast.success(`Urutan ${items.length} item disimpan`);
      setReorderOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan urutan");
    } finally {
      setReorderSaving(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkUploading(true);
    setBulkProgress({ done: 0, total: files.length });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Step 1: Upload the file to media library
        const fd = new FormData();
        fd.append("files", file);
        fd.append("folder", "/");
        const uploadRes = await fetch("/api/media", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          failCount++;
          setBulkProgress({ done: i + 1, total: files.length });
          continue;
        }
        const uploadData = await uploadRes.json();
        const uploaded = uploadData?.files?.[0];
        if (!uploaded?.url) {
          failCount++;
          setBulkProgress({ done: i + 1, total: files.length });
          continue;
        }

        // Step 2: Create gallery item
        const isVideo = file.type.startsWith("video/");
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
        const createRes = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug,
            description: "",
            url: uploaded.url,
            type: isVideo ? "VIDEO" : "IMAGE",
            thumbnail: isVideo ? "" : uploaded.url,
            album: "Bulk Upload",
            featured: false,
          }),
        });
        if (createRes.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      setBulkProgress({ done: i + 1, total: files.length });
    }

    setBulkUploading(false);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
    if (successCount > 0) {
      toast.success(`${successCount} item berhasil diupload${failCount > 0 ? `, ${failCount} gagal` : ""}`);
      router.refresh();
    } else {
      toast.error("Semua upload gagal");
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (row: GalleryRow) => {
    setForm({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description || "",
      url: row.url,
      type: row.type,
      thumbnail: row.thumbnail || "",
      album: row.album || "",
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
    if (!form.url.trim() && form.type === "IMAGE") {
      toast.error("URL gambar wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const url = form.id ? `/api/admin/gallery/${form.id}` : "/api/admin/gallery";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Item diperbarui" : "Item dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: GalleryRow) => {
    try {
      const res = await fetch(`/api/admin/gallery/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Item dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const toggleFeatured = async (row: GalleryRow) => {
    try {
      const res = await fetch(`/api/admin/gallery/${row.id}`, {
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

  const columns: Column<GalleryRow>[] = useMemo(
    () => [
      {
        key: "thumbnail",
        header: "Preview",
        className: "w-20",
        render: (row) => {
          const src = row.thumbnail || (row.type === "IMAGE" ? row.url : "");
          if (src) {
            return <img src={src} alt={row.title} className="size-12 rounded-lg object-cover border" />;
          }
          return (
            <div className="size-12 rounded-lg bg-muted/40 flex items-center justify-center">
              {row.type === "VIDEO" ? <Film className="size-4 text-muted-foreground" /> : <ImageIcon className="size-4 text-muted-foreground" />}
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
            <span className="text-xs text-muted-foreground line-clamp-1">{row.album || "—"}</span>
          </div>
        ),
      },
      {
        key: "type",
        header: "Tipe",
        sortable: true,
        render: (row) => (
          <Badge
            className={cn(
              "rounded-full border-0",
              row.type === "VIDEO" ? "bg-violet-500/15 text-violet-600" : "bg-teal-500/15 text-teal-600"
            )}
          >
            {row.type === "VIDEO" ? <Film className="size-3 mr-1" /> : <ImageIcon className="size-3 mr-1" />}
            {row.type}
          </Badge>
        ),
      },
      {
        key: "album",
        header: "Album",
        render: (row) =>
          row.album ? <Badge variant="outline" className="rounded-full">{row.album}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
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
      {
        key: "createdAt",
        header: "Dibuat",
        sortable: true,
        render: (row) => <span className="text-sm">{formatDate(row.createdAt, { year: "numeric", month: "short", day: "numeric" })}</span>,
      },
    ],
    []
  );

  const actions = (row: GalleryRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => toggleFeatured(row)} title="Toggle Featured">
        <Star className={cn("size-3.5", row.featured && "fill-amber-500 text-amber-500")} />
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8" title="View">
        <a href="/gallery" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.title}"?`}
        description="Item galeri akan dihapus permanen."
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
        title="Gallery"
        description={`${data.length} item galeri terdaftar`}
        icon={ImageIcon}
        action={
          <div className="flex gap-2">
            <input
              ref={bulkFileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleBulkUpload}
            />
            <Button variant="outline" className="rounded-xl" onClick={() => bulkFileRef.current?.click()} disabled={bulkUploading}>
              {bulkUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {bulkUploading ? `Uploading... (${bulkProgress.done}/${bulkProgress.total})` : "Upload Banyak"}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={openReorder} disabled={data.length < 2}>
              <GripVertical className="size-4" /> Atur Urutan
            </Button>
            <Button onClick={openCreate} className="rounded-xl">
              <Plus className="size-4" /> Tambah Item
            </Button>
          </div>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["title", "album", "slug"]}
        searchPlaceholder="Cari galeri..."
        pageSize={12}
      />

      {/* Reorder Dialog */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atur Urutan Gallery</DialogTitle>
            <DialogDescription>
              Drag item untuk mengatur urutan tampilan di halaman publik. Klik "Simpan Urutan" untuk menyimpan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={reorderItems.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div className="grid-cols-1 grid gap-2 sm:grid-cols-2">
                  {reorderItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <SortableGalleryCard item={item} />
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setReorderOpen(false)} disabled={reorderSaving}>
              <X className="size-4" /> Batal
            </Button>
            <Button onClick={handleSaveReorder} disabled={reorderSaving}>
              {reorderSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Simpan Urutan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Gallery Item" : "Tambah Gallery Item"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi item galeri. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="g-title">Judul *</Label>
              <Input
                id="g-title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Judul item galeri"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-slug">Slug</Label>
              <Input
                id="g-slug"
                value={form.slug}
                onChange={(e) => { updateField("slug", slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="otomatis-dari-judul"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-type">Tipe</Label>
              <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                <SelectTrigger id="g-type" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-album">Album</Label>
              <Input
                id="g-album"
                value={form.album}
                onChange={(e) => updateField("album", e.target.value)}
                placeholder="Nama album"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-category">Kategori</Label>
              <Select value={form.categoryId || "none"} onValueChange={(v) => updateField("categoryId", v === "none" ? "" : v)}>
                <SelectTrigger id="g-category" className="rounded-lg">
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
              <Label htmlFor="g-desc">Deskripsi</Label>
              <Textarea
                id="g-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Deskripsi singkat"
                className="rounded-lg min-h-[80px]"
              />
            </div>

            {form.type === "IMAGE" ? (
              <div className="sm:col-span-2">
                <MediaPicker
                  label="URL Gambar *"
                  value={form.url}
                  onChange={(url) => updateField("url", url)}
                  accept="image"
                />
              </div>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="g-url">URL Video *</Label>
                <Input
                  id="g-url"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="/uploads/video.mp4 atau URL YouTube/embed"
                  className="rounded-lg"
                />
                <p className="text-[11px] text-muted-foreground">
                  Untuk YouTube, gunakan URL embed (https://www.youtube.com/embed/VIDEO_ID).
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <MediaPicker
                label="Thumbnail (opsional)"
                value={form.thumbnail}
                onChange={(url) => updateField("thumbnail", url)}
                accept="image"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="g-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="g-featured">Featured</Label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
