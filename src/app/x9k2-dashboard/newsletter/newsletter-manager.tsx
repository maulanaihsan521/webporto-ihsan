"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, MailX, Trash2, Download, Mail, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { formatDate, formatNumber } from "@/lib/utils";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export function NewsletterManager({ data }: { data: Subscriber[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = data.filter((s) => {
    if (filter === "active" && !s.active) return false;
    if (filter === "inactive" && s.active) return false;
    if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = data.filter((s) => s.active).length;
  const inactiveCount = data.length - activeCount;

  const toggleActive = async (id: string, active: boolean) => {
    await fetch("/api/admin/newsletter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    router.refresh();
    toast.success(active ? "Subscriber diaktifkan" : "Subscriber dinonaktifkan");
  };

  const deleteSub = async (id: string) => {
    await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
    router.refresh();
    toast.success("Subscriber dihapus");
  };

  const exportEmails = () => {
    const emails = data.filter((s) => s.active).map((s) => s.email).join("\n");
    const blob = new Blob([emails], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // WIB: nama file pakai tanggal Jakarta (en-CA → format YYYY-MM-DD)
    a.download = `newsletter-subscribers-${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Email diekspor");
  };

  const clearInactive = async () => {
    await fetch("/api/admin/newsletter", { method: "DELETE" });
    router.refresh();
    toast.success("Subscriber tidak aktif dihapus");
  };

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description="Kelola subscriber newsletter"
        icon={Mail}
        action={
          <Button onClick={exportEmails} variant="outline" className="rounded-xl">
            <Download className="size-4" /> Export Emails
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
            <MailCheck className="size-5" />
          </div>
          <div className="text-3xl font-bold">{formatNumber(activeCount)}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Active Subscribers</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 mb-3">
            <MailX className="size-5" />
          </div>
          <div className="text-3xl font-bold">{formatNumber(inactiveCount)}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Unsubscribed</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-3">
            <Users className="size-5" />
          </div>
          <div className="text-3xl font-bold">{formatNumber(data.length)}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari email..."
          className="rounded-xl max-w-xs"
        />
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="rounded-xl capitalize"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Semua" : f === "active" ? "Aktif" : "Tidak Aktif"}
            </Button>
          ))}
        </div>
        {inactiveCount > 0 && (
          <DeleteConfirm
            onConfirm={clearInactive}
            title="Hapus semua subscriber tidak aktif?"
            description={`${inactiveCount} subscriber tidak aktif akan dihapus permanen.`}
            trigger={
              <Button variant="outline" size="sm" className="rounded-xl text-red-500 ml-auto">
                <Trash2 className="size-3.5" /> Clear Inactive
              </Button>
            }
          />
        )}
      </div>

      <Card className="rounded-2xl overflow-hidden glass">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bergabung</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={`rounded-full border-0 ${s.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {s.active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Switch checked={s.active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                      <DeleteConfirm
                        onConfirm={() => deleteSub(s.id)}
                        title="Hapus subscriber?"
                        description={`Email ${s.email} akan dihapus permanen.`}
                        trigger={<Button size="icon" variant="ghost" className="size-8 rounded-lg text-red-500"><Trash2 className="size-4" /></Button>}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Belum ada subscriber newsletter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
