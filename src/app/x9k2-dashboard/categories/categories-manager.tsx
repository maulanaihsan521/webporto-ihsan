"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Plus, Pencil, Trash2, FileText, Briefcase, Award, Image as ImageIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { formatDate, cn } from "@/lib/utils";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  color: string | null;
  counts: { posts: number; portfolios: number; certificates: number; galleries: number };
  createdAt: string;
}

const TYPE_STYLES: Record<string, { label: string; icon: any; color: string }> = {
  BLOG: { label: "Blog", icon: FileText, color: "bg-amber-500/15 text-amber-600" },
  PORTFOLIO: { label: "Portfolio", icon: Briefcase, color: "bg-teal-500/15 text-teal-600" },
  CERTIFICATE: { label: "Certificate", icon: Award, color: "bg-violet-500/15 text-violet-600" },
  GALLERY: { label: "Gallery", icon: ImageIcon, color: "bg-rose-500/15 text-rose-600" },
};

export function CategoriesManager({ data }: { data: CategoryRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState({ name: "", type: "BLOG", description: "", color: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = data;
    if (typeFilter !== "all") result = result.filter((c) => c.type === typeFilter);
    if (search) result = result.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [data, search, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "BLOG", description: "", color: "" });
    setDialog(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, description: cat.description || "", color: cat.color || "" });
    setDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editing ? "Kategori diperbarui" : "Kategori dibuat");
      setDialog(false);
      router.refresh();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal");
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kategori dihapus");
      router.refresh();
    } else {
      toast.error("Gagal menghapus (kategori mungkin masih dipakai)");
    }
  };

  const totalItems = data.reduce((a, c) => a + c.counts.posts + c.counts.portfolios + c.counts.certificates + c.counts.galleries, 0);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description={`${data.length} kategori terdaftar`}
        icon={FolderTree}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Kategori
          </Button>
        }
      />

      <div className="grid-cols-1 grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-3">
            <FolderTree className="size-5" />
          </div>
          <div className="text-3xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Kategori</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
            <FolderTree className="size-5" />
          </div>
          <div className="text-3xl font-bold">{Object.keys(TYPE_STYLES).length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Tipe Kategori</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 mb-3">
            <FileText className="size-5" />
          </div>
          <div className="text-3xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Item</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kategori..."
          className="rounded-xl max-w-xs"
        />
        <div className="flex gap-1">
          <Button variant={typeFilter === "all" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setTypeFilter("all")}>Semua</Button>
          {Object.entries(TYPE_STYLES).map(([key, val]) => (
            <Button key={key} variant={typeFilter === key ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setTypeFilter(key)}>
              {val.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cat) => {
          const style = TYPE_STYLES[cat.type] || TYPE_STYLES.BLOG;
          const Icon = style.icon;
          const total = cat.counts.posts + cat.counts.portfolios + cat.counts.certificates + cat.counts.galleries;
          return (
            <Card key={cat.id} className="rounded-2xl p-4 glass group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("size-8 rounded-lg flex items-center justify-center", style.color)}>
                    <Icon className="size-4" />
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px]">{style.label}</Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="size-7 rounded-lg" onClick={() => openEdit(cat)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteConfirm
                    onConfirm={() => remove(cat.id)}
                    title="Hapus kategori?"
                    description={`Kategori "${cat.name}" akan dihapus.${total > 0 ? " Ada " + total + " item terkait." : ""}`}
                    trigger={<Button size="icon" variant="ghost" className="size-7 rounded-lg text-red-500"><Trash2 className="size-3.5" /></Button>}
                  />
                </div>
              </div>
              <p className="font-semibold truncate">{cat.name}</p>
              <p className="text-xs text-muted-foreground mb-2">/{cat.slug}</p>
              {cat.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{cat.description}</p>}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {cat.counts.posts > 0 && <Badge className="bg-amber-500/10 text-amber-600 border-0">{cat.counts.posts} post</Badge>}
                {cat.counts.portfolios > 0 && <Badge className="bg-teal-500/10 text-teal-600 border-0">{cat.counts.portfolios} port</Badge>}
                {cat.counts.certificates > 0 && <Badge className="bg-violet-500/10 text-violet-600 border-0">{cat.counts.certificates} cert</Badge>}
                {cat.counts.galleries > 0 && <Badge className="bg-rose-500/10 text-rose-600 border-0">{cat.counts.galleries} gal</Badge>}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full rounded-2xl p-12 glass text-center">
            <FolderTree className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
          </Card>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>{editing ? "Ubah kategori" : "Buat kategori baru"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="contoh: Digital Marketing" className="rounded-xl" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_STYLES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi (opsional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Warna (opsional)</Label>
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="amber, rose, teal..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} className="rounded-xl">Batal</Button>
            <Button onClick={save} className="rounded-xl">{editing ? "Simpan" : "Buat"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
