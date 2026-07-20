"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Image as ImageIcon, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, RemoveFormatting,
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
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // only on mount

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

  const addLink = () => {
    if (linkUrl) {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      exec("createLink", url);
      setLinkDialog(false);
      setLinkUrl("");
      toast.success("Link ditambahkan");
    }
  };

  const addImage = () => {
    if (imageUrl) {
      const url = imageUrl.startsWith("http") ? imageUrl : `https://${imageUrl}`;
      exec("insertImage", url);
      setImageDialog(false);
      setImageUrl("");
      setImageAlt("");
      toast.success("Gambar ditambahkan");
    }
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "code here";
    const html = `<pre><code>${text}</code></pre><p></p>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
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
        {toolButton(AlignLeft, "justifyLeft", "Align Left")}
        {toolButton(AlignCenter, "justifyCenter", "Align Center")}
        {toolButton(AlignRight, "justifyRight", "Align Right")}
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent" onMouseDown={(e) => { e.preventDefault(); setLinkDialog(true); }} title="Insert Link">
          <Link2 className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent" onMouseDown={(e) => { e.preventDefault(); setImageDialog(true); }} title="Insert Image">
          <ImageIcon className="size-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        {toolButton(Undo, "undo", "Undo")}
        {toolButton(Redo, "redo", "Redo")}
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-accent text-red-500" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); exec("formatBlock", "<p>"); }} title="Clear Formatting">
          <RemoveFormatting className="size-3.5" />
        </Button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
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
      `}</style>
    </div>
  );
}
