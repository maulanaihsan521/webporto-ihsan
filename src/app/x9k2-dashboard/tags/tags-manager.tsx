"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
}

export function TagsManager({ data }: { data: TagRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<TagRow | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const filtered = data.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialog(true);
  };

  const openEdit = (tag: TagRow) => {
    setEditing(tag);
    setName(tag.name);
    setDialog(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nama tag wajib diisi");
      return;
    }
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/tags/${editing.id}` : "/api/admin/tags";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      toast.success(editing ? "Tag diperbarui" : "Tag dibuat");
      setDialog(false);
      router.refresh();
    } else {
      const d = await res.json();
      toast.error(d.error || "Gagal");
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Tag dihapus");
      router.refresh();
    } else {
      toast.error("Gagal menghapus (tag mungkin masih dipakai post)");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Tags"
        description={`${data.length} tag terdaftar`}
        icon={Tag}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Tag
          </Button>
        }
      />

      <div className="grid-cols-1 grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-3">
            <Tag className="size-5" />
          </div>
          <div className="text-3xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Tags</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
            <FileText className="size-5" />
          </div>
          <div className="text-3xl font-bold">{data.reduce((a, t) => a + t.postCount, 0)}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Penggunaan</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 mb-3">
            <Tag className="size-5" />
          </div>
          <div className="text-3xl font-bold">{data.filter((t) => t.postCount > 0).length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Tag Aktif</p>
        </Card>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari tag..."
        className="rounded-xl max-w-xs mb-4"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((tag) => (
          <Card key={tag.id} className="rounded-2xl p-4 glass group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="rounded-full">#{tag.slug}</Badge>
                  {tag.postCount > 0 && (
                    <Badge className="rounded-full bg-primary/10 text-primary border-0 text-[10px]">
                      {tag.postCount} post
                    </Badge>
                  )}
                </div>
                <p className="font-semibold truncate">{tag.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tag.createdAt)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="size-7 rounded-lg" onClick={() => openEdit(tag)}>
                  <Pencil className="size-3.5" />
                </Button>
                <DeleteConfirm
                  onConfirm={() => remove(tag.id)}
                  title="Hapus tag?"
                  description={`Tag "${tag.name}" akan dihapus.${tag.postCount > 0 ? " Tag ini dipakai di " + tag.postCount + " post." : ""}`}
                  trigger={<Button size="icon" variant="ghost" className="size-7 rounded-lg text-red-500"><Trash2 className="size-3.5" /></Button>}
                />
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full rounded-2xl p-12 glass text-center">
            <Tag className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Belum ada tag.</p>
          </Card>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tag" : "Tambah Tag"}</DialogTitle>
            <DialogDescription>{editing ? "Ubah nama tag" : "Buat tag baru untuk blog posts"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nama Tag</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Digital Marketing"
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && save()}
              autoFocus
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                Slug: <code className="px-1.5 py-0.5 rounded bg-muted">{name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-")}</code>
              </p>
            )}
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
