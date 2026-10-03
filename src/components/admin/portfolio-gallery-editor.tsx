"use client";

import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Images as ImagesIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/admin/media-picker";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

interface PortfolioGalleryEditorProps {
  portfolioId: string;
  initialImages: GalleryImage[];
}

const API = (portfolioId: string) => `/api/admin/portfolio/${portfolioId}/images`;

/**
 * Editor galeri gambar portfolio (PortfolioImage):
 * - Tambah gambar dari Media Library / upload (via MediaPicker)
 * - Edit caption inline (tersimpan otomatis saat keluar dari kolom)
 * - Ubah urutan (naik/turun) — tersimpan langsung
 * - Hapus gambar (dengan konfirmasi; urutan dirapikan otomatis)
 * Setiap operasi sinkron dengan state lokal dari respons API.
 */
export function PortfolioGalleryEditor({
  portfolioId,
  initialImages,
}: PortfolioGalleryEditorProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // ── Tambah gambar (dari MediaPicker) ─────────────────────────────
  const addImage = async (url: string) => {
    if (!url) return;
    try {
      const res = await fetch(API(portfolioId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah gambar");
      setImages((prev) => [...prev, json]);
      toast.success("Gambar ditambahkan ke galeri");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menambah gambar");
    }
  };

  // ── Simpan caption (on blur, hanya jika berubah) ──────────────────
  const saveCaption = async (img: GalleryImage, caption: string) => {
    if (caption === (img.caption ?? "")) return;
    setBusyId(img.id);
    try {
      const res = await fetch(API(portfolioId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [{ id: img.id, caption }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan caption");
      if (Array.isArray(json)) setImages(json);
      toast.success("Caption gambar diperbarui");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan caption");
    } finally {
      setBusyId(null);
    }
  };

  // ── Pindahkan urutan (naik / turun satu posisi) ──────────────────
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length || reordering) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setReordering(true);
    try {
      const res = await fetch(API(portfolioId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: next.map((im, i) => ({ id: im.id, order: i })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah urutan");
      if (Array.isArray(json)) setImages(json);
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengubah urutan");
      // Kembalikan urutan lama bila gagal — refresh dari server
      try {
        const res2 = await fetch(`/api/admin/portfolio/${portfolioId}`);
        const d = await res2.json();
        if (res2.ok && Array.isArray(d.images)) setImages(d.images);
      } catch {
        /* abaikan */
      }
    } finally {
      setReordering(false);
    }
  };

  // ── Hapus gambar ─────────────────────────────────────────────────
  const removeImage = async (img: GalleryImage) => {
    try {
      const res = await fetch(`${API(portfolioId)}?imageId=${encodeURIComponent(img.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus gambar");
      setImages((prev) => prev.filter((im) => im.id !== img.id).map((im, i) => ({ ...im, order: i })));
      toast.success("Gambar dihapus dari galeri");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus gambar");
      throw e; // agar DeleteConfirm tetap menampilkan dialog saat gagal
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <ImagesIcon className="size-4 text-primary" />
          Galeri Gambar ({images.length})
        </Label>
        {reordering && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada gambar galeri untuk portfolio ini.
          Tambahkan gambar pertama dari Media Library di bawah.
        </p>
      ) : (
        <ol className="space-y-2">
          {images.map((img, i) => (
            <li
              key={img.id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-lg border p-2 transition-opacity",
                (busyId === img.id || reordering) && "opacity-60"
              )}
            >
              <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {i + 1}
              </span>
              <img
                src={img.url}
                alt={img.caption || `Gambar galeri ${i + 1}`}
                className="size-16 shrink-0 rounded-md border object-cover"
                loading="lazy"
              />
              <Input
                defaultValue={img.caption ?? ""}
                placeholder="Caption gambar (opsional — juga menjadi alt text)"
                onBlur={(e) => saveCaption(img, e.target.value)}
                disabled={busyId === img.id || reordering}
                className="min-w-40 flex-1 rounded-lg"
              />
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reordering}
                  aria-label={`Pindahkan gambar ${i + 1} ke atas`}
                  title="Naikkan urutan"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1 || reordering}
                  aria-label={`Pindahkan gambar ${i + 1} ke bawah`}
                  title="Turunkan urutan"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </div>
              <DeleteConfirm
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Hapus gambar ${i + 1}`}
                    title="Hapus gambar"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                }
                onConfirm={() => removeImage(img)}
                title="Hapus gambar galeri?"
                description="Gambar akan dihapus dari galeri portfolio ini. Urutan gambar lain dirapikan otomatis."
                confirmText="Hapus Gambar"
              />
            </li>
          ))}
        </ol>
      )}

      <MediaPicker
        label="Tambah Gambar Galeri"
        value=""
        onChange={(url) => {
          if (url) addImage(url);
        }}
        accept="image"
      />

      <p className="text-xs text-muted-foreground">
        Caption tersimpan otomatis ketika Anda meninggalkan kolomnya. Gambar pertama
        ditampilkan sebagai tile besar di halaman publik; caption juga dipakai sebagai
        alt text untuk SEO dan aksesibilitas.
      </p>
    </div>
  );
}
