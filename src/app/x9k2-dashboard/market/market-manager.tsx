"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Plus, Pencil, Trash2, Loader2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * 2026-09-19: artikel market dipindahkan ke BLOG (tabel Post, kategori
 * "Financial Market" — scripts/migrate-market-articles-to-blog.mjs).
 * CRUD artikel (tambah/edit/publish/hapus) kini lewat menu Blog;
 * halaman ini khusus mengelola Watchlist & Holdings untuk tool
 * halaman /financial-market. Tab Articles + ArticleDialog dihapus.
 */

interface Watch { id: string; symbol: string; name: string; type: string; notes: string | null; targetPrice: string | null; createdAt: string; }
interface Holding { id: string; symbol: string; name: string; type: string; quantity: number; buyPrice: number; currentPrice: number; notes: string | null; createdAt: string; }

export function MarketManager({ watchlist, holdings }: { watchlist: Watch[]; holdings: Holding[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("watchlist");
  const [watchDialog, setWatchDialog] = useState(false);
  const [holdDialog, setHoldDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // Tombol aksi header mengikuti tab aktif (watchlist / holdings)
  const headerAction = tab === "watchlist" ? (
    <Button onClick={() => { setEditing(null); setWatchDialog(true); }} className="rounded-xl">
      <Plus className="size-4" /> Tambah Symbol
    </Button>
  ) : (
    <Button onClick={() => { setEditing(null); setHoldDialog(true); }} className="rounded-xl">
      <Plus className="size-4" /> Tambah Holding
    </Button>
  );

  return (
    <div>
      <AdminPageHeader
        title="Financial Market"
        description={`${watchlist.length} simbol watchlist & ${holdings.length} holdings — artikel market dikelola di menu Blog`}
        icon={TrendingUp}
        action={headerAction}
      />

      {/* 2026-09-19: artikel market dipindahkan ke Blog (kategori Financial
          Market) — CRUD artikel lewat menu Blog, bukan di sini. */}
      <Card className="mb-4 rounded-2xl border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Artikel market sekarang dikelola di menu Blog</p>
              <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                Semua artikel market telah dipindahkan ke blog dengan kategori
                &ldquo;Financial Market&rdquo; — buat, edit, dan publish lewat menu
                Blog. Artikel tetap tampil di blog walaupun fitur market
                di-off dari Settings.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/x9k2-dashboard/blog">Kelola Artikel Blog</Link>
          </Button>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="watchlist" className="rounded-lg">Watchlist ({watchlist.length})</TabsTrigger>
          <TabsTrigger value="holdings" className="rounded-lg">Holdings ({holdings.length})</TabsTrigger>
        </TabsList>

        {/* WATCHLIST */}
        <TabsContent value="watchlist" className="space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {watchlist.map((w) => (
              <Card key={w.id} className="rounded-2xl p-4 glass">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{w.symbol}</p>
                    <p className="text-xs text-muted-foreground">{w.name}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">{w.type}</Badge>
                </div>
                {w.targetPrice && <p className="text-xs mt-2">Target: <span className="font-semibold text-primary">{w.targetPrice}</span></p>}
                {w.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.notes}</p>}
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="ghost" className="rounded-lg h-7" onClick={() => { setEditing(w); setWatchDialog(true); }}><Pencil className="size-3.5" /></Button>
                  <DeleteConfirm onConfirm={async () => { await fetch(`/api/admin/watchlist/${w.id}`, { method: "DELETE" }); router.refresh(); toast.success("Removed"); }} trigger={<Button size="sm" variant="ghost" className="rounded-lg h-7 text-red-500"><Trash2 className="size-3.5" /></Button>} />
                </div>
              </Card>
            ))}
            {watchlist.length === 0 && <p className="text-center text-sm text-muted-foreground py-12 col-span-full">No watchlist items.</p>}
          </div>
        </TabsContent>

        {/* HOLDINGS */}
        <TabsContent value="holdings" className="space-y-3">
          {/* ITERATION: overflow-x-auto — dulu overflow-hidden memotong kolom P&L/Actions di mobile */}
          <Card className="rounded-2xl overflow-x-auto glass">
            <table className="w-full text-sm min-w-[580px]">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Buy</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Current</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const pnl = (h.currentPrice - h.buyPrice) * h.quantity;
                  const pnlPct = h.buyPrice > 0 ? ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100 : 0;
                  return (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="px-4 py-3"><p className="font-semibold">{h.symbol}</p><p className="text-xs text-muted-foreground">{h.name}</p></td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="rounded-full">{h.type}</Badge></td>
                      <td className="px-4 py-3 text-right">{h.quantity}</td>
                      <td className="px-4 py-3 text-right">{h.buyPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{h.currentPrice.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {pnl >= 0 ? "+" : ""}{pnl.toLocaleString()} ({pnlPct.toFixed(1)}%)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="size-7 rounded-lg" onClick={() => { setEditing(h); setHoldDialog(true); }}><Pencil className="size-3.5" /></Button>
                          <DeleteConfirm onConfirm={async () => { await fetch(`/api/admin/holdings/${h.id}`, { method: "DELETE" }); router.refresh(); toast.success("Removed"); }} trigger={<Button size="icon" variant="ghost" className="size-7 rounded-lg text-red-500"><Trash2 className="size-3.5" /></Button>} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {holdings.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No holdings yet.</p>}
          </Card>
        </TabsContent>
      </Tabs>

      <WatchDialog open={watchDialog} onOpenChange={setWatchDialog} editing={editing} />
      <HoldDialog open={holdDialog} onOpenChange={setHoldDialog} editing={editing} />
    </div>
  );
}

function WatchDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm(editing || { symbol: "", name: "", type: "STOCK", notes: "", targetPrice: "" }); }, [open, editing]);
  const save = async () => {
    if (saving) return;
    if (!form.symbol?.trim() || !form.name?.trim()) { toast.error("Symbol dan Name wajib diisi"); return; }
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/watchlist/${editing.id}` : "/api/admin/watchlist";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success("Saved"); onOpenChange(false); router.refresh(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Failed"); }
    } catch { toast.error("Koneksi gagal — coba lagi"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Watchlist Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Symbol</Label><Input value={form.symbol || ""} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. BBCA.JK" className="rounded-xl" /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STOCK">Stock</SelectItem><SelectItem value="CRYPTO">Crypto</SelectItem><SelectItem value="FOREX">Forex</SelectItem><SelectItem value="INDEX">Index</SelectItem><SelectItem value="COMMODITY">Commodity</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Target Price</Label><Input value={form.targetPrice || ""} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} className="rounded-xl" /></div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-xl" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={saving}>Cancel</Button><Button onClick={save} className="rounded-xl" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HoldDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm(editing || { symbol: "", name: "", type: "STOCK", quantity: 0, buyPrice: 0, currentPrice: 0, notes: "" }); }, [open, editing]);
  const save = async () => {
    if (saving) return;
    if (!form.symbol?.trim() || !form.name?.trim()) { toast.error("Symbol dan Name wajib diisi"); return; }
    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/admin/holdings/${editing.id}` : "/api/admin/holdings";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity), buyPrice: Number(form.buyPrice), currentPrice: Number(form.currentPrice) }) });
      if (res.ok) { toast.success("Saved"); onOpenChange(false); router.refresh(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Failed"); }
    } catch { toast.error("Koneksi gagal — coba lagi"); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Holding</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Symbol</Label><Input value={form.symbol || ""} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STOCK">Stock</SelectItem><SelectItem value="CRYPTO">Crypto</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quantity</Label><Input type="number" step="any" value={form.quantity || 0} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Buy Price</Label><Input type="number" step="any" value={form.buyPrice || 0} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Current Price</Label><Input type="number" step="any" value={form.currentPrice || 0} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} className="rounded-xl" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="rounded-xl" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={saving}>Cancel</Button><Button onClick={save} className="rounded-xl" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
