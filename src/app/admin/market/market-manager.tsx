"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Plus, Pencil, Trash2, Star, X, Eye, EyeOff, Briefcase, ListPlus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Article { id: string; title: string; slug: string; excerpt: string | null; content: string; type: string; instrument: string | null; coverImage: string | null; published: boolean; featured: boolean; viewCount: number; publishedAt: string | null; createdAt: string; }
interface Watch { id: string; symbol: string; name: string; type: string; notes: string | null; targetPrice: string | null; createdAt: string; }
interface Holding { id: string; symbol: string; name: string; type: string; quantity: number; buyPrice: number; currentPrice: number; notes: string | null; createdAt: string; }

export function MarketManager({ articles, watchlist, holdings }: { articles: Article[]; watchlist: Watch[]; holdings: Holding[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("articles");
  const [articleDialog, setArticleDialog] = useState(false);
  const [watchDialog, setWatchDialog] = useState(false);
  const [holdDialog, setHoldDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const ARTICLE_TYPES = [
    { value: "ANALYSIS", label: "Analisis" },
    { value: "TECHNICAL", label: "Teknikal" },
    { value: "FUNDAMENTAL", label: "Fundamental" },
    { value: "EDUCATION", label: "Edukasi" },
    { value: "RISK", label: "Risk Management" },
    { value: "JOURNAL", label: "Journal" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Financial Market"
        description="Kelola artikel market, watchlist, dan portfolio holdings"
        icon={TrendingUp}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="articles" className="rounded-lg">Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="watchlist" className="rounded-lg">Watchlist ({watchlist.length})</TabsTrigger>
          <TabsTrigger value="holdings" className="rounded-lg">Holdings ({holdings.length})</TabsTrigger>
        </TabsList>

        {/* ARTICLES */}
        <TabsContent value="articles" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setArticleDialog(true); }} className="rounded-xl">
              <Plus className="size-4" /> New Article
            </Button>
          </div>
          <div className="grid gap-3">
            {articles.map((a) => (
              <Card key={a.id} className="rounded-2xl p-4 glass flex items-center gap-4">
                <div className="size-12 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="size-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{a.title}</p>
                    <Badge variant="secondary" className="rounded-full">{ARTICLE_TYPES.find((t) => t.value === a.type)?.label || a.type}</Badge>
                    {a.instrument && <Badge className="rounded-full bg-primary/10 text-primary border-0">{a.instrument}</Badge>}
                    {!a.published && <Badge variant="outline" className="rounded-full">Draft</Badge>}
                    {a.featured && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.viewCount} views · {a.publishedAt ? formatDate(a.publishedAt) : formatDateTime(a.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={async () => {
                    await fetch("/api/admin/market-articles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, published: !a.published }) });
                    router.refresh();
                    toast.success(a.published ? "Unpublished" : "Published");
                  }}>
                    {a.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => { setEditing(a); setArticleDialog(true); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteConfirm onConfirm={async () => {
                    await fetch(`/api/admin/market-articles/${a.id}`, { method: "DELETE" });
                    router.refresh(); toast.success("Deleted");
                  }} trigger={<Button size="icon" variant="ghost" className="size-8 rounded-lg text-red-500"><Trash2 className="size-4" /></Button>} />
                </div>
              </Card>
            ))}
            {articles.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No articles yet.</p>}
          </div>
        </TabsContent>

        {/* WATCHLIST */}
        <TabsContent value="watchlist" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setWatchDialog(true); }} className="rounded-xl">
              <Plus className="size-4" /> Add Symbol
            </Button>
          </div>
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
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setHoldDialog(true); }} className="rounded-xl">
              <Plus className="size-4" /> Add Holding
            </Button>
          </div>
          <Card className="rounded-2xl overflow-hidden glass">
            <table className="w-full text-sm">
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

      {/* Article Dialog */}
      <ArticleDialog open={articleDialog} onOpenChange={setArticleDialog} editing={editing} types={ARTICLE_TYPES} />
      <WatchDialog open={watchDialog} onOpenChange={setWatchDialog} editing={editing} />
      <HoldDialog open={holdDialog} onOpenChange={setHoldDialog} editing={editing} />
    </div>
  );
}

function ArticleDialog({ open, onOpenChange, editing, types }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any; types: any[] }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (open) setForm(editing || { title: "", slug: "", excerpt: "", content: "", type: "ANALYSIS", instrument: "", published: false, featured: false, publishedAt: "" });
  }, [open, editing]);

  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/market-articles/${editing.id}` : "/api/admin/market-articles";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, publishedAt: form.publishedAt || null }),
    });
    if (res.ok) { toast.success(editing ? "Updated" : "Created"); onOpenChange(false); router.refresh(); }
    else toast.error("Failed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Market Article</DialogTitle><DialogDescription>Isi detail artikel market</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Slug</Label><Input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded-xl" /></div>
            <div><Label>Instrument</Label><Input value={form.instrument || ""} onChange={(e) => setForm({ ...form, instrument: e.target.value })} placeholder="e.g. BTC/USD, IHSG" className="rounded-xl" /></div>
          </div>
          <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Excerpt</Label><Textarea value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="rounded-xl" /></div>
          <div><Label>Konten Artikel</Label><RichTextEditor value={form.content || ""} onChange={(html) => setForm({ ...form, content: html })} placeholder="Tulis analisis pasar di sini..." minHeight={250} /></div>
          <div><Label>Publish Date</Label><Input type="date" value={form.publishedAt ? new Date(form.publishedAt).toISOString().slice(0, 10) : ""} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="rounded-xl" /></div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><Label>Published</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /><Label>Featured</Label></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button onClick={save} className="rounded-xl">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WatchDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (open) setForm(editing || { symbol: "", name: "", type: "STOCK", notes: "", targetPrice: "" }); }, [open, editing]);
  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/watchlist/${editing.id}` : "/api/admin/watchlist";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Saved"); onOpenChange(false); router.refresh(); }
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
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button onClick={save} className="rounded-xl">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HoldDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: any }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (open) setForm(editing || { symbol: "", name: "", type: "STOCK", quantity: 0, buyPrice: 0, currentPrice: 0, notes: "" }); }, [open, editing]);
  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/holdings/${editing.id}` : "/api/admin/holdings";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity), buyPrice: Number(form.buyPrice), currentPrice: Number(form.currentPrice) }) });
    if (res.ok) { toast.success("Saved"); onOpenChange(false); router.refresh(); }
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
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button><Button onClick={save} className="rounded-xl">Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
