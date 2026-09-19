"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare, Check, X, Trash2, Mail, ExternalLink, Clock, CheckCircle2, MessageCircle,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DeleteConfirm } from "@/components/admin/delete-confirm";
import { toast } from "sonner";
import { cn, getInitials, timeAgo, formatDateTime } from "@/lib/utils";

interface CommentRow {
  id: string;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  parentId: string | null;
  post: { title: string; slug: string } | null;
  createdAt: string;
}

export function CommentsManager({ data }: { data: CommentRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filtered = useMemo(() => {
    let result = data;
    if (filter === "pending") result = result.filter((c) => !c.approved);
    else if (filter === "approved") result = result.filter((c) => c.approved);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, search, filter]);

  const pendingCount = data.filter((c) => !c.approved).length;
  const approvedCount = data.filter((c) => c.approved).length;

  const approve = async (id: string) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    router.refresh();
    toast.success("Komentar disetujui");
  };

  const unapprove = async (id: string) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unapprove" }),
    });
    router.refresh();
    toast.success("Komentar dibatalkan");
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    router.refresh();
    toast.success("Komentar dihapus");
  };

  return (
    <div>
      <AdminPageHeader
        title="Komentar"
        description="Moderasi komentar blog"
        icon={MessageSquare}
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-3">
            <MessageCircle className="size-5" />
          </div>
          <div className="text-3xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Total Komentar</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 mb-3">
            <Clock className="size-5" />
          </div>
          <div className="text-3xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Menunggu Moderasi</p>
        </Card>
        <Card className="rounded-2xl p-5 glass">
          <div className="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="text-3xl font-bold">{approvedCount}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Disetujui</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari komentar..."
          className="rounded-xl max-w-xs"
        />
        <div className="flex gap-1">
          {([
            { v: "all" as const, label: "Semua", count: data.length },
            { v: "pending" as const, label: "Menunggu", count: pendingCount },
            { v: "approved" as const, label: "Disetujui", count: approvedCount },
          ]).map((f) => (
            <Button
              key={f.v}
              variant={filter === f.v ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setFilter(f.v)}
            >
              {f.label} ({f.count})
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.id} className={cn("rounded-2xl p-4 glass", !c.approved && "ring-1 ring-amber-500/30")}>
            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-xs">
                  {getInitials(c.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{c.name}</span>
                  <a href={`mailto:${c.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Mail className="size-3" /> {c.email}
                  </a>
                  {c.parentId && (
                    <Badge variant="outline" className="rounded-full text-[10px] py-0 h-5">
                      <MessageSquare className="size-2.5 mr-0.5" /> Balasan
                    </Badge>
                  )}
                  <Badge className={cn("rounded-full border-0 text-[10px] py-0 h-5", c.approved ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>
                    {c.approved ? "Disetujui" : "Menunggu"}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap">{c.content}</p>
                {c.post && (
                  <Link
                    href={`/blog/${c.post.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="size-3" />
                    {c.post.title}
                  </Link>
                )}
                <div className="flex gap-1 mt-3">
                  {!c.approved ? (
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => approve(c.id)}>
                      <Check className="size-3.5" /> Setujui
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => unapprove(c.id)}>
                      <X className="size-3.5" /> Batalkan
                    </Button>
                  )}
                  <DeleteConfirm
                    onConfirm={() => remove(c.id)}
                    title="Hapus komentar?"
                    description="Komentar akan dihapus permanen."
                    trigger={
                      <Button size="sm" variant="ghost" className="rounded-lg h-8 text-xs text-red-500">
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="rounded-2xl p-12 glass text-center">
            <MessageSquare className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Tidak ada komentar.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
