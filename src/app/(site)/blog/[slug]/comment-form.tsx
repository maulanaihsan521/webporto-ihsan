"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus, X, Reply } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CommentFormProps = {
  postId: string;
  parentId?: string | null;
  /** Display name of the parent comment author (used in reply header). */
  parentName?: string | null;
  /** Called when submission succeeds. */
  onSubmitted?: () => void;
  /** Called when user cancels (for inline reply forms). */
  onCancel?: () => void;
  /** Compact variant for inline reply forms. */
  variant?: "default" | "inline";
};

type FieldErrors = {
  name?: string;
  email?: string;
  content?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CommentForm({
  postId,
  parentId = null,
  parentName = null,
  onSubmitted,
  onCancel,
  variant = "default",
}: CommentFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isInline = variant === "inline";

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Nama minimal 2 karakter.";
    if (name.trim().length > 80) next.name = "Nama terlalu panjang (maks 80).";
    if (!EMAIL_RE.test(email.trim())) next.email = "Email tidak valid.";
    if (content.trim().length < 3) next.content = "Komentar minimal 3 karakter.";
    if (content.trim().length > 5000) next.content = "Komentar terlalu panjang (maks 5000).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setName("");
    setEmail("");
    setContent("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          name: name.trim(),
          email: email.trim(),
          content: content.trim(),
          parentId: parentId ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : null) ?? "Gagal mengirim komentar. Silakan coba lagi.";
        toast.error(msg);
        return;
      }

      toast.success(
        parentId
          ? "Balasan Anda terkirim dan menunggu moderasi."
          : "Komentar Anda terkirim dan menunggu moderasi. Terima kasih!",
      );
      reset();
      onSubmitted?.();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4",
        isInline ? "rounded-2xl border border-border bg-card/40 p-4" : "",
      )}
      aria-label={parentId ? "Form balasan komentar" : "Form komentar baru"}
    >
      {/* Inline reply header */}
      {isInline && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Reply className="size-3.5" />
            Membalas <span className="text-foreground">{parentName ?? "Komentar"}</span>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Batal balas"
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={parentId ? `c-name-${parentId}` : "c-name"} className="text-xs font-medium">
            Nama <span className="text-rose-500">*</span>
          </Label>
          <Input
            id={parentId ? `c-name-${parentId}` : "c-name"}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="Nama Anda"
            disabled={submitting}
            autoComplete="name"
            maxLength={80}
            aria-invalid={!!errors.name}
            className={cn(
              "h-10",
              errors.name && "border-rose-500 focus-visible:ring-rose-500/30",
            )}
          />
          {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={parentId ? `c-email-${parentId}` : "c-email"} className="text-xs font-medium">
            Email <span className="text-rose-500">*</span>
          </Label>
          <Input
            id={parentId ? `c-email-${parentId}` : "c-email"}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="email@contoh.com"
            disabled={submitting}
            autoComplete="email"
            maxLength={254}
            aria-invalid={!!errors.email}
            className={cn(
              "h-10",
              errors.email && "border-rose-500 focus-visible:ring-rose-500/30",
            )}
          />
          {errors.email ? (
            <p className="text-[11px] text-rose-500">{errors.email}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Email tidak akan dipublikasikan.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={parentId ? `c-content-${parentId}` : "c-content"} className="text-xs font-medium">
          {parentId ? "Balasan" : "Komentar"} <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          id={parentId ? `c-content-${parentId}` : "c-content"}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors((p) => ({ ...p, content: undefined }));
          }}
          placeholder={parentId ? "Tulis balasan Anda..." : "Bagikan pendapat Anda tentang artikel ini..."}
          disabled={submitting}
          maxLength={5000}
          rows={isInline ? 3 : 4}
          aria-invalid={!!errors.content}
          className={cn(
            "resize-y min-h-[96px]",
            errors.content && "border-rose-500 focus-visible:ring-rose-500/30",
          )}
        />
        <div className="flex items-center justify-between text-[11px]">
          {errors.content ? (
            <p className="text-rose-500">{errors.content}</p>
          ) : (
            <span className="text-muted-foreground">
              Komentar akan dimoderasi sebelum ditampilkan.
            </span>
          )}
          <span className={cn("tabular-nums", content.length > 4800 ? "text-amber-500" : "text-muted-foreground")}>
            {content.length}/5000
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={submitting}
          className="gap-1.5 rounded-full"
          size={isInline ? "sm" : "default"}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="size-4" />
          )}
          {submitting
            ? "Mengirim..."
            : parentId
              ? "Kirim Balasan"
              : "Kirim Komentar"}
        </Button>
        {isInline && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
            size="sm"
            className="rounded-full"
          >
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
