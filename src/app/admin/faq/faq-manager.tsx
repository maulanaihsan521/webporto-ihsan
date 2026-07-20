"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, HelpCircle, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { cn, truncate } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_SUGGESTIONS = [
  "Umum", "Layanan", "Harga", "Portfolio", "Kontak", "Pembayaran", "Teknis",
];

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  published: boolean;
}

interface FormState {
  id?: string;
  question: string;
  answer: string;
  category: string;
  order: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  question: "",
  answer: "",
  category: "",
  order: "0",
  published: true,
};

export function FaqManager({ data }: { data: FaqRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, order: String(data.length) });
    setOpen(true);
  };

  const openEdit = (row: FaqRow) => {
    setForm({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category || "",
      order: String(row.order ?? 0),
      published: row.published,
    });
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!form.question.trim()) {
      toast.error("Pertanyaan wajib diisi");
      return;
    }
    if (!form.answer.trim()) {
      toast.error("Jawaban wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, order: Number(form.order || 0) };
      const url = form.id ? `/api/admin/faqs/${form.id}` : "/api/admin/faqs";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "FAQ diperbarui" : "FAQ dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: FaqRow) => {
    try {
      const res = await fetch(`/api/admin/faqs/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("FAQ dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const togglePublished = async (row: FaqRow) => {
    try {
      const res = await fetch(`/api/admin/faqs/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !row.published }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      toast.success(!row.published ? "FAQ dipublikasikan" : "FAQ disembunyikan");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal");
    }
  };

  const columns: Column<FaqRow>[] = useMemo(
    () => [
      {
        key: "question",
        header: "Pertanyaan",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col max-w-md">
            <span className="font-medium line-clamp-2">{row.question}</span>
            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {truncate(row.answer, 80)}
            </span>
          </div>
        ),
      },
      {
        key: "category",
        header: "Kategori",
        render: (row) =>
          row.category ? (
            <Badge variant="secondary" className="rounded-full">{row.category}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "published",
        header: "Status",
        render: (row) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={row.published}
              onCheckedChange={() => togglePublished(row)}
              aria-label="Toggle publish"
            />
            <span
              className={cn(
                "text-xs flex items-center gap-1",
                row.published ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {row.published ? (
                <><Eye className="size-3" /> Publish</>
              ) : (
                <><EyeOff className="size-3" /> Draft</>
              )}
            </span>
          </div>
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

  const actions = (row: FaqRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title="Hapus FAQ ini?"
        description={`Pertanyaan "${truncate(row.question, 60)}" akan dihapus permanen.`}
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
        title="FAQ"
        description={`${data.length} pertanyaan terdaftar`}
        icon={HelpCircle}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah FAQ
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["question", "answer", "category"]}
        searchPlaceholder="Cari FAQ..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
            <DialogDescription>
              Lengkapi pertanyaan dan jawaban. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="faq-question">Pertanyaan *</Label>
              <Input
                id="faq-question"
                value={form.question}
                onChange={(e) => updateField("question", e.target.value)}
                placeholder="Apa keunggulan layanan Anda?"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="faq-answer">Jawaban *</Label>
              <Textarea
                id="faq-answer"
                value={form.answer}
                onChange={(e) => updateField("answer", e.target.value)}
                placeholder="Tulis jawaban lengkap..."
                className="rounded-lg min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-category">Kategori</Label>
              <Input
                id="faq-category"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Umum, Layanan, Harga..."
                list="faq-category-list"
                className="rounded-lg"
              />
              <datalist id="faq-category-list">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1">
                {CATEGORY_SUGGESTIONS.map((c) => (
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
              <Label htmlFor="faq-order">Urutan Tampil</Label>
              <Input
                id="faq-order"
                type="number"
                value={form.order}
                onChange={(e) => updateField("order", e.target.value)}
                className="rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">Urutan lebih kecil tampil lebih awal.</p>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="faq-published"
                checked={form.published}
                onCheckedChange={(v) => updateField("published", v)}
              />
              <Label htmlFor="faq-published">Publikasikan (tampilkan di halaman publik)</Label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Simpan Perubahan" : "Buat FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
