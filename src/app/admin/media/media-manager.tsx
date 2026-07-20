"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Upload, Search, ImageIcon, Film, FileText, Music, Archive,
  Trash2, Copy, Check, X, Loader2, HardDrive, Grid2x2, CheckSquare,
  Square, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { cn, formatBytes, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE";

interface MediaRow {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string | null;
  size: number;
  folder: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

const TYPE_FILTERS: { key: string; label: string; icon: any }[] = [
  { key: "ALL", label: "Semua", icon: Grid2x2 },
  { key: "IMAGE", label: "Gambar", icon: ImageIcon },
  { key: "VIDEO", label: "Video", icon: Film },
  { key: "DOCUMENT", label: "Dokumen", icon: FileText },
  { key: "AUDIO", label: "Audio", icon: Music },
  { key: "ARCHIVE", label: "Arsip", icon: Archive },
];

const TYPE_ICON: Record<string, any> = {
  IMAGE: ImageIcon,
  VIDEO: Film,
  AUDIO: Music,
  DOCUMENT: FileText,
  ARCHIVE: Archive,
};

const TYPE_COLOR: Record<string, string> = {
  IMAGE: "bg-amber-500/15 text-amber-600",
  VIDEO: "bg-violet-500/15 text-violet-600",
  AUDIO: "bg-teal-500/15 text-teal-600",
  DOCUMENT: "bg-emerald-500/15 text-emerald-600",
  ARCHIVE: "bg-rose-500/15 text-rose-600",
};

export function MediaManager({ data }: { data: MediaRow[] }) {
  const router = useRouter();
  const [list, setList] = useState<MediaRow[]>(data);

  // Sync list when server data changes (e.g., after router.refresh())
  useEffect(() => {
    if (data && data.length > 0) {
      setList(data);
    }
  }, [data]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [folderFilter, setFolderFilter] = useState<string>("/");
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editFolder, setEditFolder] = useState("/");
  const [saving, setSaving] = useState(false);

  // Fetch fresh media list from API (used after upload/delete to update immediately)
  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/media", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setList(data);
        }
      }
    } catch {}
  };
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => {
    const set = new Set<string>();
    list.forEach((m) => set.add(m.folder || "/"));
    return Array.from(set).sort();
  }, [list]);

  const totalSize = useMemo(() => list.reduce((a, b) => a + b.size, 0), [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (folderFilter !== "ALL") result = result.filter((m) => (m.folder || "/") === folderFilter);
    if (typeFilter !== "ALL") result = result.filter((m) => m.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [list, folderFilter, typeFilter, search]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      const arr = Array.from(files);
      arr.forEach((f) => fd.append("files", f));
      fd.append("folder", folderFilter === "ALL" ? "/" : folderFilter);

      // Use XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data?.files) {
                // Normalize uploaded files: convert createdAt to ISO string if needed
                const normalized = data.files.map((f: any) => ({
                  ...f,
                  createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt || new Date().toISOString()),
                }));
                setList((prev) => [...normalized, ...prev]);
              }
              resolve();
            } catch (e) {
              reject(e);
            }
          } else {
            try {
              const j = JSON.parse(xhr.responseText);
              reject(new Error(j.error || "Upload gagal"));
            } catch {
              reject(new Error("Upload gagal"));
            }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", "/api/media");
        xhr.send(fd);
      });

      toast.success(`${arr.length} file berhasil diupload`);
      // Refresh from server to ensure fresh data with correct format
      // Small delay to ensure server has fully processed the upload
      await new Promise((r) => setTimeout(r, 300));
      await fetchMedia();
    } catch (e: any) {
      toast.error(e?.message || "Upload gagal");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const openDetail = (m: MediaRow) => {
    setSelected(m);
    setEditName(m.name);
    setEditAlt(m.alt || "");
    setEditFolder(m.folder || "/");
  };

  const handleSaveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          name: editName,
          alt: editAlt,
          folder: editFolder,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menyimpan");
      }
      const updated = await res.json();
      setList((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? { ...m, name: updated.name, alt: updated.alt, folder: updated.folder }
            : m
        )
      );
      setSelected((p) => (p ? { ...p, name: updated.name, alt: updated.alt, folder: updated.folder } : p));
      toast.success("Detail media disimpan");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MediaRow) => {
    try {
      const res = await fetch(`/api/media?id=${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      setList((prev) => prev.filter((x) => x.id !== m.id));
      setSelected(null);
      toast.success("Media dihapus");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelected.length === 0) return;
    let ok = 0;
    for (const id of bulkSelected) {
      try {
        const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
        if (res.ok) ok++;
      } catch {}
    }
    setList((prev) => prev.filter((m) => !bulkSelected.includes(m.id)));
    setBulkSelected([]);
    setBulkMode(false);
    toast.success(`${ok} media dihapus`);
    router.refresh();
  };

  const handleCopyUrl = async (url: string) => {
    try {
      const absolute = window.location.origin + url;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      toast.success("URL disalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin URL");
    }
  };

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const sizePercent = Math.min(100, (totalSize / (500 * 1024 * 1024)) * 100);

  return (
    <div>
      <AdminPageHeader
        title="Media Library"
        description={`${list.length} file · ${formatBytes(totalSize)} total`}
        icon={FolderOpen}
        action={
          <div className="flex gap-2">
            {bulkMode && bulkSelected.length > 0 && (
              <DeleteConfirm
                title={`Hapus ${bulkSelected.length} media?`}
                description="File yang dipilih akan dihapus permanen."
                onConfirm={handleBulkDelete}
                trigger={
                  <Button variant="outline" className="rounded-xl text-red-600 hover:text-red-700 border-red-500/30">
                    <Trash2 className="size-4" /> Hapus {bulkSelected.length}
                  </Button>
                }
              />
            )}
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setBulkMode((v) => !v);
                setBulkSelected([]);
              }}
            >
              {bulkMode ? <X className="size-4" /> : <CheckSquare className="size-4" />}
              {bulkMode ? "Batal" : "Pilih Massal"}
            </Button>
            <Button onClick={() => fileRef.current?.click()} className="rounded-xl" disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload
            </Button>
          </div>
        }
      />

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar: folders + storage */}
        <div className="space-y-3">
          <Card className="glass rounded-2xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Folder
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => setFolderFilter("ALL")}
                className={cn(
                  "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                  folderFilter === "ALL" ? "bg-primary/10 text-primary" : "hover:bg-accent"
                )}
              >
                <FolderOpen className="size-3.5" /> Semua Folder
              </button>
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => setFolderFilter(f)}
                  className={cn(
                    "w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                    folderFilter === f ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <FolderOpen className="size-3.5" /> {f}
                </button>
              ))}
            </div>
          </Card>

          <Card className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Penyimpanan</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${sizePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(totalSize)} dari 500 MB
            </p>
          </Card>
        </div>

        {/* Main: filters + grid */}
        <div className="space-y-4">
          {/* Upload dropzone */}
          <Card
            className={cn(
              "glass rounded-2xl border-2 border-dashed transition-colors p-5 text-center",
              dragOver ? "border-primary bg-primary/5" : "border-border"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="size-7 mx-auto animate-spin text-primary" />
                <p className="text-sm font-medium">Mengupload... {uploadProgress}%</p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden max-w-xs mx-auto">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Upload className="size-7" />
                <p className="text-sm font-medium">Tarik file ke sini atau klik untuk upload</p>
                <p className="text-xs">Maks 20MB per file</p>
              </button>
            )}
          </Card>

          {/* Filters + search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama file..."
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                    typeFilter === t.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <Card className="glass rounded-2xl py-16 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-8 mx-auto mb-2 opacity-40" />
              Tidak ada media
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((m) => {
                  const Icon = TYPE_ICON[m.type] || FileText;
                  const isBulkSelected = bulkSelected.includes(m.id);
                  return (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md",
                        isBulkSelected ? "ring-2 ring-primary border-primary" : "border-border"
                      )}
                      onClick={() => (bulkMode ? toggleBulk(m.id) : openDetail(m))}
                    >
                      <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                        {m.type === "IMAGE" ? (
                          <img
                            src={m.url}
                            alt={m.alt || m.name}
                            className="h-full w-full object-contain transition-transform group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector(".img-fallback")) {
                                const fallback = document.createElement("div");
                                fallback.className = "img-fallback flex flex-col items-center gap-1.5 p-3 bg-rose-500/10 text-rose-500";
                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[10px] font-medium">File not found</span>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : m.type === "VIDEO" ? (
                          <div className={cn("flex flex-col items-center gap-1.5 p-3", TYPE_COLOR[m.type])}>
                            <Icon className="size-7" />
                            <span className="text-[10px] uppercase font-medium">{m.type}</span>
                          </div>
                        ) : (
                          <div className={cn("flex flex-col items-center gap-1.5 p-3", TYPE_COLOR[m.type])}>
                            <Icon className="size-7" />
                            <span className="text-[10px] uppercase font-medium">{m.type}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-medium" title={m.name}>{m.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{formatBytes(m.size)}</span>
                          {m.width && m.height && (
                            <span className="text-[10px] text-muted-foreground">{m.width}×{m.height}</span>
                          )}
                        </div>
                      </div>
                      {bulkMode && (
                        <div className="absolute top-2 right-2">
                          {isBulkSelected ? (
                            <CheckSquare className="size-5 text-primary fill-primary/20" />
                          ) : (
                            <Square className="size-5 text-muted-foreground/70" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className={cn("text-[10px] border-0", TYPE_COLOR[m.type])}>
                          {m.type}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderOpen className="size-4" /> Detail Media
                </DialogTitle>
                <DialogDescription>
                  Dibuat {timeAgo(selected.createdAt)} · {selected.mimeType || "—"}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center min-h-[200px]">
                {selected.type === "IMAGE" ? (
                  <img src={selected.url} alt={selected.alt || selected.name} className="w-full max-h-[400px] object-contain" />
                ) : selected.type === "VIDEO" ? (
                  <video src={selected.url} controls className="w-full max-h-[400px]" />
                ) : (
                  <div className={cn("flex flex-col items-center gap-2 py-12", TYPE_COLOR[selected.type])}>
                    {(() => {
                      const Icon = TYPE_ICON[selected.type] || FileText;
                      return <Icon className="size-16" />;
                    })()}
                    <span className="text-xs uppercase font-medium">{selected.type}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ukuran File</p>
                  <p className="font-medium">{formatBytes(selected.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dimensi</p>
                  <p className="font-medium">
                    {selected.width && selected.height ? `${selected.width} × ${selected.height}` : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="md-name">Nama File</Label>
                  <Input
                    id="md-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="md-alt">Alt Text</Label>
                  <Input
                    id="md-alt"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Deskripsi untuk aksesibilitas"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="md-folder">Folder</Label>
                  <Input
                    id="md-folder"
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    placeholder="/"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>URL</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={selected.url}
                      className="rounded-lg flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUrl(selected.url)}
                      title="Salin URL"
                    >
                      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <DeleteConfirm
                  title="Hapus media ini?"
                  description="File akan dihapus permanen dari server."
                  onConfirm={() => handleDelete(selected)}
                  trigger={
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="size-4" /> Hapus
                    </Button>
                  }
                />
                <Button onClick={handleSaveDetail} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                  Simpan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
