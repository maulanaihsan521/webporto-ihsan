"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Loader2, Users as UsersIcon, Shield, Mail, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn, formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
] as const;

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  EDITOR: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  VIEWER: "bg-teal-500/15 text-teal-600 border-teal-500/30",
};

interface FormState {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  bio: string;
  image: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER",
  bio: "",
  image: "",
};

export function UsersManager({
  data,
  currentUserId,
  currentUserRole,
}: {
  data: UserRow[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isEdit, setIsEdit] = useState(false);

  const isAdmin = currentUserRole === "ADMIN";

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setIsEdit(false);
    setOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setForm({
      id: row.id,
      name: row.name || "",
      email: row.email,
      password: "",
      role: row.role,
      bio: row.bio || "",
      image: row.image || "",
    });
    setIsEdit(true);
    setOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      toast.error("Password wajib diisi untuk user baru");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        bio: form.bio,
        image: form.image,
      };
      if (form.password.trim()) payload.password = form.password;

      const url = isEdit ? `/api/admin/users/${form.id}` : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan");
      toast.success(isEdit ? "User diperbarui" : "User dibuat");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: UserRow) => {
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Gagal menghapus");
      toast.success("User dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const columns: Column<UserRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "User",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              {row.image ? <AvatarImage src={row.image} alt={row.name || row.email} /> : null}
              <AvatarFallback className="bg-primary/15 text-primary text-xs">
                {getInitials(row.name || row.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">
                {row.name || "(Tanpa nama)"}
                {row.id === currentUserId && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">(Anda)</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (row) => (
          <Badge variant="outline" className={cn("rounded-full", ROLE_STYLES[row.role] || "bg-muted text-muted-foreground")}>
            {ROLE_OPTIONS.find((r) => r.value === row.role)?.label || row.role}
          </Badge>
        ),
      },
      {
        key: "bio",
        header: "Bio",
        render: (row) =>
          row.bio ? (
            <span className="text-sm text-muted-foreground line-clamp-1 max-w-[280px]">{row.bio}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "createdAt",
        header: "Bergabung",
        sortable: true,
        render: (row) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>
        ),
      },
    ],
    [currentUserId]
  );

  const actions = (row: UserRow) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => openEdit(row)}
        disabled={!isAdmin}
        title="Edit"
      >
        <Pencil className="size-3.5" />
      </Button>
      <DeleteConfirm
        title={`Hapus user "${row.email}"?`}
        description="User akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => handleDelete(row)}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-600 hover:text-red-700"
            disabled={!isAdmin || row.id === currentUserId}
            title={row.id === currentUserId ? "Tidak dapat menghapus diri sendiri" : "Hapus"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
    </>
  );

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description={`${data.length} pengguna terdaftar`}
        icon={UsersIcon}
        action={
          isAdmin ? (
            <Button onClick={openCreate} className="rounded-xl">
              <Plus className="size-4" /> Tambah User
            </Button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <Card className="glass rounded-2xl p-4 mb-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Shield className="size-4" />
            <span>Anda bukan Admin. Hanya Admin yang dapat mengelola user.</span>
          </div>
        </Card>
      )}

      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        searchKeys={["name", "email", "role"]}
        searchPlaceholder="Cari user..."
        pageSize={10}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit User" : "Tambah User Baru"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Perbarui informasi user. Kosongkan password jika tidak ingin mengubahnya."
                : "Lengkapi data user baru. Field bertanda * wajib diisi."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="u-name">Nama</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Nama lengkap"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="u-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="user@example.com"
                  className="pl-9 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-role">Role</Label>
              <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                <SelectTrigger id="u-role" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Admin: akses penuh · Editor: kelola konten · Viewer: hanya lihat
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pass">
                Password {isEdit ? "(kosongkan jika tidak diubah)" : "*"}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="u-pass"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder={isEdit ? "••••••••" : "Min 6 karakter"}
                  className="pl-9 rounded-lg"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <MediaPicker
                label="Avatar"
                value={form.image}
                onChange={(url) => updateField("image", url)}
                accept="image"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="u-bio">Bio</Label>
              <Textarea
                id="u-bio"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Bio singkat user..."
                className="rounded-lg min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Simpan Perubahan" : "Buat User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
