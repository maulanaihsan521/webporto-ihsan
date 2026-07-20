"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Star, Search, Send, Trash2, MailOpen, Reply, Inbox, Phone, User,
  Loader2, MailCheck, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { cn, getInitials, timeAgo, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  starred: boolean;
  replied: boolean;
  reply: string | null;
  createdAt: string;
}

type FilterKey = "ALL" | "UNREAD" | "STARRED" | "REPLIED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "UNREAD", label: "Belum Dibaca" },
  { key: "STARRED", label: "Berbintang" },
  { key: "REPLIED", label: "Dibalas" },
];

export function MessagesManager({ data }: { data: MessageRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(data[0]?.id ?? null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [list, setList] = useState<MessageRow[]>(data);

  const stats = useMemo(() => ({
    total: list.length,
    unread: list.filter((m) => !m.read).length,
    starred: list.filter((m) => m.starred).length,
    replied: list.filter((m) => m.replied).length,
  }), [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (filter === "UNREAD") result = result.filter((m) => !m.read);
    else if (filter === "STARRED") result = result.filter((m) => m.starred);
    else if (filter === "REPLIED") result = result.filter((m) => m.replied);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, filter, search]);

  const selected = useMemo(
    () => list.find((m) => m.id === selectedId) ?? null,
    [list, selectedId]
  );

  const patchMessage = (id: string, patch: Partial<MessageRow>) => {
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleSelect = async (msg: MessageRow) => {
    setSelectedId(msg.id);
    if (!msg.read) {
      patchMessage(msg.id, { read: true });
      try {
        await fetch("/api/contact", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: msg.id, action: "read" }),
        });
      } catch {}
    }
  };

  const handleStar = async (e: React.MouseEvent, msg: MessageRow) => {
    e.stopPropagation();
    patchMessage(msg.id, { starred: !msg.starred });
    try {
      await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, action: "star" }),
      });
      toast.success(msg.starred ? "Bintang dilepas" : "Ditandai berbintang");
    } catch {
      toast.error("Gagal mengubah status bintang");
    }
  };

  const handleToggleRead = async (msg: MessageRow) => {
    const next = !msg.read;
    patchMessage(msg.id, { read: next });
    try {
      await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id, action: next ? "read" : "unread" }),
      });
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleSendReply = async () => {
    if (!selected) return;
    if (!replyText.trim()) {
      toast.error("Isi balasan terlebih dahulu");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, action: "reply", reply: replyText }),
      });
      if (!res.ok) throw new Error("Gagal mengirim balasan");
      patchMessage(selected.id, { replied: true, reply: replyText });
      setReplyText("");
      toast.success("Balasan terkirim");
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengirim balasan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (msg: MessageRow) => {
    try {
      const res = await fetch(`/api/contact?id=${msg.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal menghapus");
      }
      setList((prev) => prev.filter((m) => m.id !== msg.id));
      if (selectedId === msg.id) setSelectedId(null);
      toast.success("Pesan dihapus");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus");
    }
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: Inbox, color: "text-amber-500 bg-amber-500/10" },
    { label: "Belum Dibaca", value: stats.unread, icon: Mail, color: "text-rose-500 bg-rose-500/10" },
    { label: "Berbintang", value: stats.starred, icon: Star, color: "text-amber-500 bg-amber-500/10" },
    { label: "Dibalas", value: stats.replied, icon: MailCheck, color: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Pesan Masuk"
        description="Kelola pesan dari pengunjung situs"
        icon={Mail}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((s) => (
          <Card key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className={cn("size-10 rounded-xl flex items-center justify-center", s.color)}>
              <s.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        {/* LEFT: list */}
        <Card className="glass rounded-2xl flex flex-col max-h-[calc(100vh-280px)]">
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pesan..."
                className="pl-9 rounded-lg"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <Inbox className="size-8 mx-auto mb-2 opacity-40" />
                  Tidak ada pesan
                </div>
              ) : (
                filtered.map((msg) => {
                  const active = selectedId === msg.id;
                  return (
                    <motion.button
                      key={msg.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleSelect(msg)}
                      className={cn(
                        "w-full text-left p-3 border-b last:border-0 transition-colors relative",
                        active ? "bg-primary/10" : "hover:bg-accent/50"
                      )}
                    >
                      {!msg.read && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-rose-500" />
                      )}
                      <div className="flex items-start gap-2.5 pl-2">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs">
                            {getInitials(msg.name || msg.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm truncate", !msg.read && "font-semibold")}>
                              {msg.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {timeAgo(msg.createdAt)}
                            </span>
                          </div>
                          <p className={cn("text-xs truncate text-muted-foreground", !msg.read && "text-foreground/80")}>
                            {msg.subject || msg.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                            {msg.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {msg.replied && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/40 text-emerald-600">
                                <Reply className="size-2.5 mr-0.5" /> Dibalas
                              </Badge>
                            )}
                            {!msg.read && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-rose-500/40 text-rose-600">
                                Baru
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleStar(e, msg)}
                          className="p-1 rounded hover:bg-accent"
                          aria-label="Tandai bintang"
                        >
                          <Star
                            className={cn(
                              "size-4",
                              msg.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                            )}
                          />
                        </button>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* RIGHT: detail */}
        <Card className="glass rounded-2xl flex flex-col max-h-[calc(100vh-280px)]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <Mail className="size-8 opacity-50" />
              </div>
              <p className="font-medium">Pilih pesan untuk melihat detail</p>
              <p className="text-xs mt-1">Klik salah satu pesan di daftar sebelah kiri</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {selected.subject || "(Tanpa subjek)"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDateTime(selected.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleRead(selected)}
                      title={selected.read ? "Tandai belum dibaca" : "Tandai dibaca"}
                    >
                      {selected.read ? <MailOpen className="size-4" /> : <Mail className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("size-8", selected.starred && "text-amber-400")}
                      onClick={(e) => handleStar(e as any, selected)}
                      title="Bintang"
                    >
                      <Star className={cn("size-4", selected.starred && "fill-amber-400")} />
                    </Button>
                    <DeleteConfirm
                      title="Hapus pesan ini?"
                      description="Pesan akan dihapus permanen dan tidak dapat dikembalikan."
                      onConfirm={() => handleDelete(selected)}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-8 text-red-600 hover:text-red-700" title="Hapus">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Nama</p>
                      <p className="text-sm truncate">{selected.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <a href={`mailto:${selected.email}`} className="text-sm truncate hover:text-primary hover:underline block">
                        {selected.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                    <Phone className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Telepon</p>
                      <p className="text-sm truncate">{selected.phone || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Pesan</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>

                {selected.reply && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1.5">
                      <Reply className="size-3.5" /> Balasan Anda
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.reply}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tulis balasan..."
                  className="rounded-lg min-h-[80px] mb-2"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleSendReply}
                    disabled={actionLoading || !replyText.trim()}
                  >
                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Kirim Balasan
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
