"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Image as ImageIcon, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, RemoveFormatting, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MediaPicker } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Tulis konten di sini...", minHeight = 300 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imagePlacement, setImagePlacement] = useState<"left" | "center" | "right" | "full">("center");
  const [imageSize, setImageSize] = useState<"sm" | "md" | "lg">("md");
  const [imageCaption, setImageCaption] = useState("");
  // DOM node gambar terpilih disimpan di REF (bukan state — node DOM adalah
  // nilai ref-like menurut React Compiler), sedangkan status "ada gambar
  // terpilih" untuk render memakai boolean state terpisah.
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const [imgSelected, setImgSelected] = useState(false);
  // Penempatan/ukuran gambar terpilih — disimpan di STATE (bukan dibaca dari DOM
  // saat render) agar lolos react-hooks/refs dan tetap sinkron saat toolbar dipakai.
  const [figPlacement, setFigPlacement] = useState<"left" | "center" | "right" | "full">("center");
  const [figSize, setFigSize] = useState<"sm" | "md" | "lg">("md");
  const [isFocused, setIsFocused] = useState(false);

  // Initialize + sinkronisasi perubahan value dari luar.
  // ITERATION (bug fix): dulu deps `[]` — konten hanya di-set saat mount.
  // Dialog edit mengisi konten ASINKRON (fetch detail setelah dialog terbuka),
  // jadi editor tetap kosong meski form.content sudah terisi (blog & market).
  // Fix: pantau perubahan `value`; tulis ke DOM hanya saat value berubah dari
  // luar. Saat user mengetik, onChange mengirim el.innerHTML → round-trip
  // identik → guard `el.innerHTML !== value` mencegah penimpaan DOM
  // (tidak ada cursor jump).
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastSyncedRef.current) {
      lastSyncedRef.current = value;
      if (el.innerHTML !== value) {
        el.innerHTML = value || "";
      }
    }
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Normalisasi URL: biarkan path relatif ("/uploads/...") apa adanya
  const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u) || u.startsWith("/") ? u : `https://${u}`);

  // Escape karakter berbahaya untuk konteks atribut HTML / teks
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ===== Manajemen seleksi: dialog (Radix) mencuri fokus & menghapus caret editor.
  // Simpan Range sebelum dialog dibuka, pulihkan sebelum insert agar insertHTML/createLink bekerja. =====
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Pulihkan caret; jika tidak ada tersimpan, posisikan di akhir konten
  const focusEditorWithCaret = () => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current && ed.contains(savedRangeRef.current.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return;
    }
    const rng = document.createRange();
    rng.selectNodeContents(ed);
    rng.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(rng);
  };

  const addLink = () => {
    if (linkUrl) {
      const url = normalizeUrl(linkUrl);
      focusEditorWithCaret();
      exec("createLink", url);
      setLinkDialog(false);
      setLinkUrl("");
      toast.success("Link ditambahkan");
    }
  };

  const addImage = () => {
    if (!imageUrl) return;
    const url = escapeHtml(normalizeUrl(imageUrl));
    const alt = escapeHtml(imageAlt);
    const caption = escapeHtml(imageCaption);
    // Kelas penempatan & ukuran di-render oleh CSS .prose-content (aman untuk sanitizer)
    const classes = imagePlacement === "full"
      ? "img-full"
      : `img-${imagePlacement} img-${imageSize}`;
    const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";
    focusEditorWithCaret();
    document.execCommand(
      "insertHTML",
      false,
      `<figure class="${classes}"><img src="${url}" alt="${alt}" />${figcaption}</figure><p></p>`
    );
    handleInput();
    setImageDialog(false);
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
    setImagePlacement("center");
    setImageSize("md");
    toast.success("Gambar ditambahkan");
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "code here";
    const html = `<pre><code>${text}</code></pre><p></p>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  // ===== Penempatan gambar: klik gambar di editor untuk mengubah posisi/ukurannya =====
  const clearSelectedImg = () => {
    if (selectedImgRef.current) selectedImgRef.current.classList.remove("img-editing");
    selectedImgRef.current = null;
    setImgSelected(false);
    setFigPlacement("center");
    setFigSize("md");
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      if (selectedImgRef.current && selectedImgRef.current !== target) {
        selectedImgRef.current.classList.remove("img-editing");
      }
      target.classList.add("img-editing");
      selectedImgRef.current = target as HTMLImageElement;
      setImgSelected(true);
      // Sinkronkan state penempatan/ukuran dari class figure — baca DOM di
      // event handler diperbolehkan (beda dengan membacanya saat render).
      const fig = target.closest("figure");
      setFigPlacement(
        (["left", "center", "right", "full"] as const).find((p) => fig?.classList.contains(`img-${p}`)) || "center",
      );
      setFigSize(
        (["sm", "md", "lg"] as const).find((s) => fig?.classList.contains(`img-${s}`)) || "md",
      );
    } else if (selectedImgRef.current) {
      clearSelectedImg();
    }
  };

  const wrapInFigure = (img: HTMLImageElement): HTMLElement => {
    const existing = img.closest("figure");
    if (existing) return existing as HTMLElement;
    const fig = document.createElement("figure");
    img.parentNode?.insertBefore(fig, img);
    fig.appendChild(img);
    return fig;
  };

  const applyImagePlacement = (placement: "left" | "center" | "right" | "full") => {
    const img = selectedImgRef.current;
    if (!img || !editorRef.current) return;
    const fig = wrapInFigure(img);
    fig.className = placement === "full" ? "img-full" : `img-${placement} img-${figSize}`;
    setFigPlacement(placement);
    handleInput();
  };

  const applyImageSize = (size: "sm" | "md" | "lg") => {
    const img = selectedImgRef.current;
    if (!img || !editorRef.current) return;
    const fig = wrapInFigure(img);
    fig.className = figPlacement === "full" ? "img-full" : `img-${figPlacement} img-${size}`;
    setFigSize(size);
    handleInput();
  };

  const deleteSelectedImage = () => {
    const img = selectedImgRef.current;
    if (!img) return;
    const fig = img.closest("figure");
    if (fig) fig.remove();
    else img.remove();
    selectedImgRef.current = null;
    setImgSelected(false);
    setFigPlacement("center");
    setFigSize("md");
    handleInput();
    toast.success("Gambar dihapus");
  };

  const toolButton = (Icon: any, command: string, title: string, value?: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 rounded-lg hover:bg-accent"
      onMouseDown={(e) => { e.preventDefault(); exec(command, value); }}
      title={title}
      key={title}
    >
      <Icon className="size-3.5" />
    </Button>
  );

  const imgOpt = (label: string, active: boolean, onClick: () => void, disabled = false) => (
    <Button
      key={label}
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      className="h-7 rounded-lg px-2.5 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );

  return (
    <div className="rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap p-2 border-b bg-muted/30 gap-1">
        {toolButton(Bold, "bold", "Bold (Ctrl+B)")}
        {toolButton(Italic, "italic", "Italic (Ctrl+I)")}
        {toolButton(Underline, "underline", "Underline (Ctrl+U)")}
        {toolButton(Strikethrough, "strikeThrough", "Strikethrough")}
        <div className="w-px h-5 bg-border mx-1" />
        {toolButton(Heading1, "formatBlock", "Heading 1", "<h1>")}
        {toolButton(Heading2, "formatBlock", "Heading 2", "<h2>")}
        {toolButton(Heading3, "formatBlock", "Heading 3", "<h3>")}
        <div className="w-px h-5 bg-border mx-1" />
        {toolButton(List, "insertUnorderedList", "Bullet List")}
        {toolButton(ListOrdered, "insertOrderedList", "Numbered List")}
        {toolButton(Quote, "formatBlock", "Quote", "<blockquote>")}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg hover:bg-accent"
          onMouseDown={(e) => { e.preventDefault(); insertCodeBlock(); }}
          title="Code Block"
        >
          <Code className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        {toolButton(AlignLeft, "justifyLeft", "Rata Kiri")}
        {toolButton(AlignCenter, "justifyCenter", "Rata Tengah")}
        {toolButton(AlignRight, "justifyRight", "Rata Kanan")}
        {toolButton(AlignJustify, "justifyFull", "Rata Kiri-Kanan (Justify)")}
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent" onMouseDown={(e) => { e.preventDefault(); saveSelection(); setLinkDialog(true); }} title="Insert Link">
          <Link2 className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent" onMouseDown={(e) => { e.preventDefault(); saveSelection(); setImageDialog(true); }} title="Insert Image">
          <ImageIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        {toolButton(Undo, "undo", "Undo")}
        {toolButton(Redo, "redo", "Redo")}
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent text-red-500" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); exec("formatBlock", "<p>"); }} title="Clear Formatting">
          <RemoveFormatting className="size-3.5" />
        </Button>
      </div>

      {/* Toolbar gambar terpilih (muncul saat gambar diklik di editor) */}
      {imgSelected && (
        <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5 border-b bg-primary/5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Penempatan gambar:</span>
          <Button type="button" variant={figPlacement === "left" ? "default" : "outline"} size="sm" className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImagePlacement("left")}>Kiri</Button>
          <Button type="button" variant={figPlacement === "center" ? "default" : "outline"} size="sm" className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImagePlacement("center")}>Tengah</Button>
          <Button type="button" variant={figPlacement === "right" ? "default" : "outline"} size="sm" className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImagePlacement("right")}>Kanan</Button>
          <Button type="button" variant={figPlacement === "full" ? "default" : "outline"} size="sm" className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImagePlacement("full")}>Penuh</Button>
          <div className="w-px h-5 bg-border mx-1" />
          <span className="text-xs font-medium text-muted-foreground mr-1">Ukuran:</span>
          <Button type="button" variant={figSize === "sm" ? "default" : "outline"} size="sm" disabled={figPlacement === "full"} className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImageSize("sm")}>Kecil</Button>
          <Button type="button" variant={figSize === "md" ? "default" : "outline"} size="sm" disabled={figPlacement === "full"} className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImageSize("md")}>Sedang</Button>
          <Button type="button" variant={figSize === "lg" ? "default" : "outline"} size="sm" disabled={figPlacement === "full"} className="h-7 rounded-lg px-2.5 text-xs" onClick={() => applyImageSize("lg")}>Besar</Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" className="h-7 rounded-lg px-2.5 text-xs text-red-500 hover:text-red-600" onClick={deleteSelectedImage}>
            <Trash2 className="size-3.5 mr-1" /> Hapus
          </Button>
        </div>
      )}

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={handleEditorClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        className={cn(
          "prose-content outline-none px-4 py-3 overflow-y-auto",
          !isFocused && !value && "text-muted-foreground"
        )}
        style={{ minHeight, maxHeight: 600 }}
      />

      {/* Link Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Link</DialogTitle></DialogHeader>
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && addLink()} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={addLink} className="rounded-xl">Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Pilih dari Media Library</label>
              <MediaPicker
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                label=""
                accept="image"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ATAU</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Image URL</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Alt Text</label>
              <Input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Deskripsi gambar" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Penempatan Gambar</label>
              <div className="grid grid-cols-4 gap-2">
                {imgOpt("Kiri", imagePlacement === "left", () => setImagePlacement("left"))}
                {imgOpt("Tengah", imagePlacement === "center", () => setImagePlacement("center"))}
                {imgOpt("Kanan", imagePlacement === "right", () => setImagePlacement("right"))}
                {imgOpt("Penuh", imagePlacement === "full", () => setImagePlacement("full"))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Kiri/Kanan: teks mengalir di sisi gambar. Penuh: selebar konten.</p>
            </div>
            {imagePlacement !== "full" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Ukuran Gambar</label>
                <div className="grid grid-cols-3 gap-2">
                  {imgOpt("Kecil", imageSize === "sm", () => setImageSize("sm"))}
                  {imgOpt("Sedang", imageSize === "md", () => setImageSize("md"))}
                  {imgOpt("Besar", imageSize === "lg", () => setImageSize("lg"))}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Caption (opsional)</label>
              <Input value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Keterangan gambar" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={addImage} className="rounded-xl" disabled={!imageUrl}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.8rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        [contenteditable] h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        [contenteditable] h3 { font-size: 1.25rem; font-weight: 600; margin: 0.8rem 0 0.4rem; }
        [contenteditable] p { margin: 0.5rem 0; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        [contenteditable] blockquote { border-left: 3px solid var(--primary); padding-left: 1rem; margin: 0.8rem 0; font-style: italic; color: var(--muted-foreground); }
        [contenteditable] pre { background: var(--muted); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; margin: 0.8rem 0; }
        [contenteditable] code { background: var(--muted); padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: var(--font-mono); font-size: 0.875em; }
        [contenteditable] pre code { background: transparent; padding: 0; }
        [contenteditable] a { color: var(--primary); text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
        [contenteditable] figure img { margin: 0; }
        [contenteditable] figcaption { font-size: 0.85rem; color: var(--muted-foreground); text-align: center; margin-top: 0.5rem; }
      `}</style>
    </div>
  );
}
