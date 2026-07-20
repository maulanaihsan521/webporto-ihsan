"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, ImageIcon, X, Loader2, FileText, Film, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType?: string | null;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

interface MediaPickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  accept?: "image" | "video" | "all";
  className?: string;
}

const ACCEPT_MAP: Record<NonNullable<MediaPickerProps["accept"]>, string> = {
  image: "IMAGE",
  video: "VIDEO",
  all: "",
};

export function MediaPicker({
  value,
  onChange,
  label = "Pilih Media",
  accept = "image",
  className,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string | null>(value ?? null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ACCEPT_MAP[accept]) params.set("type", ACCEPT_MAP[accept]);
      if (search) params.set("q", search);
      const res = await fetch(`/api/media?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load media");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat media");
    } finally {
      setLoading(false);
    }
  }, [accept, search]);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, fetchMedia]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      fd.append("folder", "/");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Upload gagal");
      }
      const data = await res.json();
      toast.success(`${files.length} file berhasil diupload`);
      // Refresh media list immediately to show newly uploaded files
      await fetchMedia();
      const first = data?.files?.[0];
      if (first?.url) {
        setSelected(first.url);
      }
    } catch (e: any) {
      toast.error(e?.message || "Upload gagal");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    if (selected) {
      onChange(selected);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSelected(null);
    onChange("");
  };

  const renderPreview = () => {
    if (!value) {
      return (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
          <ImageIcon className="size-7" />
        </div>
      );
    }
    if (value.match(/\.(mp4|webm|ogg|mov)$/i) || accept === "video") {
      return (
        <video
          src={value}
          className="aspect-video w-full rounded-lg object-cover"
          controls
        />
      );
    }
    if (value.match(/\.(pdf|doc|docx)$/i)) {
      return (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted/30 gap-2 text-muted-foreground">
          <FileText className="size-7" />
          <span className="text-xs">{value.split("/").pop()}</span>
        </div>
      );
    }
    return (
      <img
        src={value}
        alt={value.split("/").pop() || "media"}
        className="aspect-video w-full rounded-lg object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex items-start gap-3">
        <div className="w-32 shrink-0">{renderPreview()}</div>
        <div className="flex flex-col gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="rounded-lg">
                <ImageIcon className="size-4" /> Pilih dari Library
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
                <DialogDescription>Pilih media yang sudah diupload atau upload file baru.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari media..."
                    className="rounded-lg"
                  />
                </form>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={accept === "image" ? "image/*" : accept === "video" ? "video/*" : undefined}
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Upload
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[55vh] -mx-1 px-1">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    <ImageIcon className="size-8 mx-auto mb-2 opacity-40" />
                    Belum ada media. Upload file baru.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {items.map((m) => {
                      const active = selected === m.url;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setSelected(m.url)}
                          className={cn(
                            "group relative overflow-hidden rounded-lg border-2 transition-all text-left",
                            active ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/40"
                          )}
                        >
                          <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                            {m.type === "IMAGE" ? (
                              <img
                                src={m.url}
                                alt={m.name}
                                className="h-full w-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const p = e.currentTarget.parentElement;
                                  if (p && !p.querySelector(".err")) {
                                    const d = document.createElement("div");
                                    d.className = "err flex flex-col items-center gap-1 text-rose-500";
                                    d.innerHTML = '<span style="font-size:10px">Error</span>';
                                    p.appendChild(d);
                                  }
                                }}
                              />
                            ) : m.type === "VIDEO" ? (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <Film className="size-6" />
                                <span className="text-[10px]">VIDEO</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <FileText className="size-6" />
                                <span className="text-[10px]">{m.type}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="truncate text-[11px] font-medium">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(m.size)}</p>
                          </div>
                          {active && (
                            <span className="absolute right-1.5 top-1.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                              <Check className="size-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!selected}>
                  <X className="size-4" /> Hapus Pilihan
                </Button>
                <Button type="button" size="sm" onClick={handleConfirm} disabled={!selected}>
                  <Check className="size-4" /> Pilih Media
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
              <X className="size-3.5" /> Hapus
            </Button>
          )}
          {value && (
            <p className="text-xs text-muted-foreground break-all max-w-[200px]">
              {value.split("/").pop()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
