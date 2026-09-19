"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        toast.success("Berhasil berlangganan!");
        setEmail("");
      } else {
        toast.error(data.error || "Gagal berlangganan");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="size-4" />
        Terima kasih! Cek email Anda untuk konfirmasi.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@anda.com"
        required
        className="rounded-xl h-12 flex-1"
      />
      <Button type="submit" disabled={loading} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/30">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <><Mail className="size-4" /> Langganan</>}
      </Button>
    </form>
  );
}
