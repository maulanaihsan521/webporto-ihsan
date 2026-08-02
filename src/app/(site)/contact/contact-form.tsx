"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama terlalu panjang (maks 80 karakter)."),
  email: z
    .string()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  phone: z
    .string()
    .max(32, "Nomor telepon terlalu panjang.")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .max(120, "Subjek terlalu panjang (maks 120 karakter).")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Pesan minimal 10 karakter.")
    .max(5000, "Pesan terlalu panjang (maks 5000 karakter)."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || null,
          subject: values.subject?.trim() || null,
          message: values.message.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        const msg =
          data.error ?? "Gagal mengirim pesan. Silakan coba lagi beberapa saat.";
        toast.error(msg);
        return;
      }

      toast.success("Pesan berhasil terkirim! Saya akan segera membalas.");
      setSubmitted(true);
      reset();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  };

  // Success state — full form swap
  if (submitted) {
    return (
      <Card className="glass-strong relative overflow-hidden p-4 text-center sm:p-10">
        <div className="mesh-bg opacity-40" aria-hidden />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="size-9" />
          </div>
          <h3 className="text-2xl font-bold">Pesan Terkirim!</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Terima kasih telah menghubungi saya. Pesan Anda telah saya terima dan akan
            saya balas dalam 1x24 jam melalui email.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 gap-1.5 rounded-full"
            onClick={() => setSubmitted(false)}
          >
            <RotateCcw className="size-3.5" />
            Kirim Pesan Lain
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-strong relative overflow-hidden p-6 sm:p-8">
      <div className="relative z-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold sm:text-2xl">Kirim Pesan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Isi formulir di bawah ini dan saya akan menghubungi Anda kembali.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
          aria-label="Formulir kontak"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="c-name" className="text-xs font-medium">
                Nama <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="c-name"
                type="text"
                placeholder="Nama lengkap Anda"
                autoComplete="name"
                disabled={isSubmitting}
                maxLength={80}
                aria-invalid={!!errors.name}
                className={cn(
                  "h-11",
                  errors.name && "border-rose-500 focus-visible:ring-rose-500/30",
                )}
                {...register("name")}
              />
              {errors.name && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="size-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="c-email" className="text-xs font-medium">
                Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="c-email"
                type="email"
                placeholder="email@contoh.com"
                autoComplete="email"
                disabled={isSubmitting}
                maxLength={254}
                aria-invalid={!!errors.email}
                className={cn(
                  "h-11",
                  errors.email && "border-rose-500 focus-visible:ring-rose-500/30",
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="size-3" />
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="c-phone" className="text-xs font-medium">
                Telepon <span className="text-muted-foreground/70">(opsional)</span>
              </Label>
              <Input
                id="c-phone"
                type="tel"
                placeholder="+62 812 3456 7890"
                autoComplete="tel"
                disabled={isSubmitting}
                maxLength={32}
                aria-invalid={!!errors.phone}
                className={cn(
                  "h-11",
                  errors.phone && "border-rose-500 focus-visible:ring-rose-500/30",
                )}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="size-3" />
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="c-subject" className="text-xs font-medium">
                Subjek <span className="text-muted-foreground/70">(opsional)</span>
              </Label>
              <Input
                id="c-subject"
                type="text"
                placeholder="Topik pertanyaan Anda"
                disabled={isSubmitting}
                maxLength={120}
                aria-invalid={!!errors.subject}
                className={cn(
                  "h-11",
                  errors.subject && "border-rose-500 focus-visible:ring-rose-500/30",
                )}
                {...register("subject")}
              />
              {errors.subject && (
                <p className="flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="size-3" />
                  {errors.subject.message}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="c-message" className="text-xs font-medium">
              Pesan <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="c-message"
              placeholder="Tulis pesan Anda di sini (minimal 10 karakter)..."
              disabled={isSubmitting}
              maxLength={5000}
              rows={6}
              aria-invalid={!!errors.message}
              className={cn(
                "min-h-[140px] resize-y",
                errors.message && "border-rose-500 focus-visible:ring-rose-500/30",
              )}
              {...register("message")}
            />
            <div className="flex items-center justify-between text-[11px]">
              {errors.message ? (
                <p className="flex items-center gap-1 text-rose-500">
                  <AlertCircle className="size-3" />
                  {errors.message.message}
                </p>
              ) : (
                <span className="text-muted-foreground">
                  Saya akan membalas dalam 1x24 jam.
                </span>
              )}
              <span className="text-muted-foreground">
                Min. 10 karakter
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-1.5 rounded-full"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Dengan mengirim, Anda menyetujui{" "}
              <span className="font-medium">kebijakan privasi</span> kami.
            </p>
          </div>
        </form>
      </div>
    </Card>
  );
}
