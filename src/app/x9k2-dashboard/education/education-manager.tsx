"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, GraduationCap, Calendar, CheckCircle2, Award,
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
import { MediaPicker } from "@/components/admin/media-picker";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { cn, formatDateShort } from "@/lib/utils";
import { toast } from "sonner";

interface EducationRow {
  id: string;
  institution: string;
  logo: string | null;
  degree: string;
  field: string | null;
  grade: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  achievements: string | null;
  organization: string | null;
  order: number;
}

interface FormState {
  id?: string;
  institution: string;
  logo: string;
  degree: string;
  field: string;
  grade: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string;
  organization: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  institution: "",
  logo: "",
  degree: "",
  field: "",
  grade: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  achievements: "",
  organization: "",
  order: "0",
};

export function EducationManager({ data }: { data: EducationRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, order: String(data.length) });
    setOpen(true);
  };

  const openEdit = (row: EducationRow) => {
    setForm({
      id: row.id,
      institution: row.institution,
      logo: row.logo || "",
      degree: row.degree,
      field: row.field || "",
      grade: row.grade || "",
      startDate: row.startDate.slice(0, 10),
      endDate: row.endDate ? row.endDate.slice(0, 10) : "",
      current: row.current,
      description: row.description || "",
      achievements: row.achievements || "",
      organization: row.organization || "",
      order: String(row.order ?? 0),
    });
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleToggleCurrent = (val: boolean) => {
    setForm((f) => ({
      ...f,
      current: val,
      endDate: val ? "" : f.endDate,
    }));
  };

  const handleSubmit = async () => {
    if (!form.institution.trim()) {
      toast.error("Institusi wajib diisi");
      return;
    }
    if (!form.degree.trim()) {
      toast.error("Gelar wajib diisi");
      return;
    }
    if (!form.startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, order: Number(form.order || 0) };
      const url = form.id ? `/api/admin/educations/${form.id}` : "/api/admin/educations";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Pendidikan diperbarui" : "Pendidikan dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: EducationRow) => {
    try {
      const res = await fetch(`/api/admin/educations/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Pendidikan dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const columns: Column<EducationRow>[] = useMemo(
    () => [
      {
        key: "institution",
        header: "Institusi",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            {row.logo ? (
              <img
                src={row.logo}
                alt={row.institution}
                className="size-9 rounded-lg object-cover border"
              />
            ) : (
              <div className="size-9 rounded-lg bg-muted/40 flex items-center justify-center">
                <GraduationCap className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{row.institution}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{row.degree}{row.field ? ` · ${row.field}` : ""}</span>
            </div>
          </div>
        ),
      },
      {
        key: "degree",
        header: "Gelar",
        render: (row) => (
          <span className="text-sm">{row.degree}</span>
        ),
      },
      {
        key: "field",
        header: "Bidang",
        render: (row) => row.field ? <span className="text-sm text-muted-foreground">{row.field}</span> : <span className="text-xs text-muted-foreground">—</span>,
      },
      {
        key: "grade",
        header: "IPK/Nilai",
        render: (row) =>
          row.grade ? (
            <Badge variant="secondary" className="rounded-full">
              <Award className="size-3 mr-1 text-amber-600" /> {row.grade}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "startDate",
        header: "Periode",
        sortable: true,
        render: (row) => (
          <span className="flex items-center gap-1 text-sm">
            <Calendar className="size-3.5 text-muted-foreground" />
            {formatDateShort(row.startDate)} — {row.current ? "Sekarang" : row.endDate ? formatDateShort(row.endDate) : "—"}
          </span>
        ),
      },
      {
        key: "current",
        header: "Status",
        render: (row) =>
          row.current ? (
            <Badge className="rounded-full border-0 bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="size-3 mr-1" /> Aktif
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Selesai</span>
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

  const actions = (row: EducationRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.degree}" di ${row.institution}?`}
        description="Riwayat pendidikan ini akan dihapus permanen."
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
        title="Pendidikan"
        description={`${data.length} riwayat pendidikan terdaftar`}
        icon={GraduationCap}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Pendidikan
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["institution", "degree", "field", "organization"]}
        searchPlaceholder="Cari pendidikan..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Pendidikan" : "Tambah Pendidikan"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi pendidikan. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edu-institution">Institusi *</Label>
              <Input
                id="edu-institution"
                value={form.institution}
                onChange={(e) => updateField("institution", e.target.value)}
                placeholder="Universitas / Sekolah"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-degree">Gelar *</Label>
              <Input
                id="edu-degree"
                value={form.degree}
                onChange={(e) => updateField("degree", e.target.value)}
                placeholder="S1 / SMA / Sertifikasi"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-field">Bidang Studi</Label>
              <Input
                id="edu-field"
                value={form.field}
                onChange={(e) => updateField("field", e.target.value)}
                placeholder="Teknik Informatika"
                className="rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Logo Institusi"
                value={form.logo}
                onChange={(url) => updateField("logo", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-grade">IPK / Nilai</Label>
              <Input
                id="edu-grade"
                value={form.grade}
                onChange={(e) => updateField("grade", e.target.value)}
                placeholder="3.85 / 4.00"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-organization">Organisasi</Label>
              <Input
                id="edu-organization"
                value={form.organization}
                onChange={(e) => updateField("organization", e.target.value)}
                placeholder="BEM, Club Robotika, dll"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-start">Tanggal Mulai *</Label>
              <Input
                id="edu-start"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edu-end">Tanggal Selesai</Label>
              <Input
                id="edu-end"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                disabled={form.current}
                className="rounded-lg disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="edu-current"
                checked={form.current}
                onCheckedChange={handleToggleCurrent}
              />
              <Label htmlFor="edu-current">Saya masih menempuh pendidikan ini</Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edu-achievements">Prestasi (pisahkan baris baru atau koma)</Label>
              <Textarea
                id="edu-achievements"
                value={form.achievements}
                onChange={(e) => updateField("achievements", e.target.value)}
                placeholder="Juara 1 Hackathon, Cum Laude, Best Thesis..."
                className="rounded-lg min-h-[80px]"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edu-desc">Deskripsi</Label>
              <Textarea
                id="edu-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ringkasan program studi dan fokus akademik..."
                className="rounded-lg min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-order">Urutan Tampil</Label>
              <Input
                id="edu-order"
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
              {form.id ? "Simpan Perubahan" : "Buat Pendidikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
