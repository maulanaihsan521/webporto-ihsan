"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, Briefcase, Building2, MapPin, Calendar, CheckCircle2,
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
import { cn, formatDateShort } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FREELANCE", label: "Freelance" },
] as const;

const TYPE_STYLES: Record<string, string> = {
  FULL_TIME: "bg-emerald-500/15 text-emerald-600",
  PART_TIME: "bg-amber-500/15 text-amber-600",
  CONTRACT: "bg-violet-500/15 text-violet-600",
  INTERNSHIP: "bg-cyan-500/15 text-cyan-600",
  FREELANCE: "bg-rose-500/15 text-rose-600",
};

interface ExperienceRow {
  id: string;
  company: string;
  logo: string | null;
  position: string;
  location: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  technologies: string | null;
  order: number;
}

interface FormState {
  id?: string;
  company: string;
  logo: string;
  position: string;
  location: string;
  type: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  technologies: string;
  order: string;
}

const EMPTY_FORM: FormState = {
  company: "",
  logo: "",
  position: "",
  location: "",
  type: "FULL_TIME",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
  technologies: "",
  order: "0",
};

export function ExperienceManager({ data }: { data: ExperienceRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, order: String(data.length) });
    setOpen(true);
  };

  const openEdit = (row: ExperienceRow) => {
    setForm({
      id: row.id,
      company: row.company,
      logo: row.logo || "",
      position: row.position,
      location: row.location || "",
      type: row.type,
      startDate: row.startDate.slice(0, 10),
      endDate: row.endDate ? row.endDate.slice(0, 10) : "",
      current: row.current,
      description: row.description || "",
      technologies: row.technologies || "",
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
    if (!form.company.trim()) {
      toast.error("Perusahaan wajib diisi");
      return;
    }
    if (!form.position.trim()) {
      toast.error("Posisi wajib diisi");
      return;
    }
    if (!form.startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order || 0),
      };
      const url = form.id ? `/api/admin/experiences/${form.id}` : "/api/admin/experiences";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(form.id ? "Pengalaman diperbarui" : "Pengalaman dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: ExperienceRow) => {
    try {
      const res = await fetch(`/api/admin/experiences/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      toast.success("Pengalaman dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const columns: Column<ExperienceRow>[] = useMemo(
    () => [
      {
        key: "company",
        header: "Perusahaan",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            {row.logo ? (
              <img
                src={row.logo}
                alt={row.company}
                className="size-9 rounded-lg object-cover border"
              />
            ) : (
              <div className="size-9 rounded-lg bg-muted/40 flex items-center justify-center">
                <Building2 className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{row.company}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{row.position}</span>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Tipe",
        render: (row) => (
          <Badge className={cn("rounded-full border-0", TYPE_STYLES[row.type] || "bg-muted text-muted-foreground")}>
            {TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type}
          </Badge>
        ),
      },
      {
        key: "location",
        header: "Lokasi",
        render: (row) =>
          row.location ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {row.location}
            </span>
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

  const actions = (row: ExperienceRow) => (
    <>
      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row)} title="Edit">
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus "${row.position}" di ${row.company}?`}
        description="Pengalaman kerja ini akan dihapus permanen."
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
        title="Pengalaman"
        description={`${data.length} pengalaman kerja terdaftar`}
        icon={Briefcase}
        action={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="size-4" /> Tambah Pengalaman
          </Button>
        }
      />

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["company", "position", "location", "technologies"]}
        searchPlaceholder="Cari pengalaman..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Pengalaman" : "Tambah Pengalaman"}</DialogTitle>
            <DialogDescription>
              Lengkapi informasi pengalaman kerja. Field bertanda * wajib diisi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-company">Perusahaan *</Label>
              <Input
                id="exp-company"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Nama perusahaan"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-position">Posisi *</Label>
              <Input
                id="exp-position"
                value={form.position}
                onChange={(e) => updateField("position", e.target.value)}
                placeholder="Frontend Developer"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-location">Lokasi</Label>
              <Input
                id="exp-location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Jakarta, Indonesia"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-type">Tipe Pekerjaan</Label>
              <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                <SelectTrigger id="exp-type" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Logo Perusahaan"
                value={form.logo}
                onChange={(url) => updateField("logo", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-start">Tanggal Mulai *</Label>
              <Input
                id="exp-start"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-end">Tanggal Selesai</Label>
              <Input
                id="exp-end"
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                disabled={form.current}
                className="rounded-lg disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2 pt-1">
              <Switch
                id="exp-current"
                checked={form.current}
                onCheckedChange={handleToggleCurrent}
              />
              <Label htmlFor="exp-current">Saya masih bekerja di sini (aktif)</Label>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="exp-tech">Teknologi (pisahkan koma)</Label>
              <Input
                id="exp-tech"
                value={form.technologies}
                onChange={(e) => updateField("technologies", e.target.value)}
                placeholder="React, Node.js, PostgreSQL"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="exp-desc">Deskripsi</Label>
              <Textarea
                id="exp-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Ringkasan tanggung jawab dan pencapaian..."
                className="rounded-lg min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-order">Urutan Tampil</Label>
              <Input
                id="exp-order"
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
              {form.id ? "Simpan Perubahan" : "Buat Pengalaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
