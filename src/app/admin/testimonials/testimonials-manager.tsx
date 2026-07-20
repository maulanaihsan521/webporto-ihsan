"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, Star, Quote, User,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TestimonialRow {
  id: string;
  name: string;
  position: string | null;
  company: string | null;
  avatar: string | null;
  rating: number;
  content: string;
  featured: boolean;
  order: number;
}

interface FormState {
  id?: string;
  name: string;
  position: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
  featured: boolean;
  order: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  position: "",
  company: "",
  avatar: "",
  rating: 5,
  content: "",
  featured: false,
  order: "0",
};

function StarsDisplay({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(size, i < rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40")}
        />
      ))}
    </div>
  );
}

export function TestimonialsManager({ data }: { data: TestimonialRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, order: String(data.length) });
    setOpen(true);
  };

  const openEdit = (row: TestimonialRow) => {
    setForm({
      id: row.id,
      name: row.name,
      position: row.position || "",
      company: row.company || "",
      avatar: row.avatar || "",
      rating: row.rating,
      content: row.content,
      featured: row.featured,
      order: String(row.order ?? 0),
    });
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Isi testimoni wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, order: Number(form.order || 0) };
      const url = form.id ? `/api/admin/testimonials/${form.id}` : "/api/admin/testimonials";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Testimoni diperbarui" : "Testimoni dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: TestimonialRow) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Testimoni dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const columns: Column<TestimonialRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Klien",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.name}
                className="size-9 rounded-full object-cover border"
              />
            ) : (
              <div className="size-9 rounded-full bg-muted/40 flex items-center justify-center">
                <User className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1 flex items-center gap-1">
                {row.name}
                {row.featured ? <Star className="size-3 fill-amber-500 text-amber-500" /> : null}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.position ? row.position : null}
                {row.position && row.company ? " @ " : null}
                {row.company ? row.company : null}
                {!row.position && !row.company ? "—" : null}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <StarsDisplay rating={row.rating} />
            <span className="text-xs tabular-nums text-muted-foreground">{row.rating}/5</span>
          </div>
        ),
      },
      {
        key: "content",
        header: "Testimoni",
        render: (row) => (
          <div className="flex items-start gap-1.5 max-w-md">
            <Quote className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground line-clamp-2">{row.content}</span>
          </div>
        ),
      },
      {
        key: "featured",
        header: "Status",
        render: (row) =>
          row.featured ? (
            <Badge className="rounded-full border-0 bg-amber-500/15 text-amber-600">
              <Star className="size-3 mr-1 fill-amber-500" /> Featured
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Standar</span>
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

  const actions = (row: TestimonialRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus testimoni dari "${row.name}"?`}
        description="Testimoni ini akan dihapus permanen."
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
        title="Testimoni"
        description={`${data.length} testimoni terdaftar`}
        icon={Quote}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Testimoni
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["name", "position", "company", "content"]}
        searchPlaceholder="Cari testimoni..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Testimoni" : "Tambah Testimoni"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi testimoni. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ts-name">Nama *</Label>
              <Input
                id="ts-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Nama klien"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ts-position">Posisi / Jabatan</Label>
              <Input
                id="ts-position"
                value={form.position}
                onChange={(e) => updateField("position", e.target.value)}
                placeholder="CEO, Marketing Manager..."
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ts-company">Perusahaan</Label>
              <Input
                id="ts-company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Nama perusahaan klien"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ts-rating">Rating</Label>
              <Select value={String(form.rating)} onValueChange={(v) => updateField("rating", Number(v))}>
                <SelectTrigger id="ts-rating" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      <span className="flex items-center gap-1.5">
                        <StarsDisplay rating={r} size="size-3" />
                        {r} / 5
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Avatar Klien"
                value={form.avatar}
                onChange={(url) => updateField("avatar", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ts-content">Isi Testimoni *</Label>
              <Textarea
                id="ts-content"
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Tulis testimoni dari klien..."
                className="rounded-lg min-h-[120px]"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="ts-featured"
                checked={form.featured}
                onCheckedChange={(v) => updateField("featured", v)}
              />
              <Label htmlFor="ts-featured" className="flex items-center gap-1">
                <Star className="size-3.5 text-amber-500" /> Featured (tampil di beranda)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ts-order">Urutan Tampil</Label>
              <Input
                id="ts-order"
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
              {form.id ? "Simpan Perubahan" : "Buat Testimoni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
