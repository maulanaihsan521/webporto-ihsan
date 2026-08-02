"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare,
  Reply,
  RefreshCw,
  Inbox,
  Loader2,
  ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, getInitials, timeAgo } from "@/lib/utils";
import { CommentForm } from "./comment-form";

// ===== Types =====
export type CommentReplyItem = {
  id: string;
  name: string;
  content: string;
  parentId: string | null;
  postId: string;
  createdAt: string;
};

export type CommentItem = {
  id: string;
  name: string;
  content: string;
  parentId: string | null;
  postId: string;
  createdAt: string;
  replies: CommentReplyItem[];
};

type CommentsSectionProps = {
  postId: string;
  initialComments: CommentItem[];
};

// Deterministic gradient based on name hash — for avatar variety.
const avatarGradients = [
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-fuchsia-500 to-pink-500",
  "from-rose-500 to-pink-500",
  "from-teal-500 to-cyan-500",
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return avatarGradients[hash % avatarGradients.length];
}

function CommentAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-white ring-2 ring-background",
        gradientFor(name),
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {getInitials(name) || "?"}
    </span>
  );
}

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [refreshing, setRefreshing] = useState(false);

  const totalCount = useMemo(() => {
    return comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);
  }, [comments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({ comments: [] }));
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments as CommentItem[]);
      }
    } catch {
      // silent — UI keeps the previous state
    } finally {
      setRefreshing(false);
    }
  };

  // When a top-level comment form is submitted, we just refresh from the API
  // to surface any newly-approved comments. The new submission itself is
  // pending moderation and won't show up until approved — that's expected.
  const handleSubmitted = () => {
    void handleRefresh();
  };

  return (
    <section
      id="comments"
      aria-labelledby="comments-heading"
      className="scroll-mt-24"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="comments-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <MessageSquare className="size-6 text-primary" />
            Komentar
            </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bagikan pendapat, pertanyaan, atau pengalaman Anda terkait artikel ini.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5 rounded-full"
        >
          {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Moderation notice */}
      <Card className="glass mb-8 flex items-start gap-3 p-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck className="size-4" />
        </div>
        <div className="text-sm">
          <p className="font-medium">Komentar dimoderasi</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Semua komentar akan ditinjau sebelum ditampilkan untuk menjaga
            diskusi yang sehat dan konstruktif. Email Anda tidak akan
            dipublikasikan.
          </p>
        </div>
      </Card>

      {/* New comment form */}
      <Card className="glass-strong mb-10 p-5 sm:p-6">
        <h3 className="mb-4 text-base font-semibold">Tinggalkan Komentar</h3>
        <CommentForm postId={postId} onSubmitted={handleSubmitted} />
      </Card>

      {/* Comments list */}
      <div className="space-y-6">
        <AnimatePresence initial={false} mode="popLayout">
          {comments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyComments />
            </motion.div>
          ) : (
            comments.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <CommentCard
                  comment={c}
                  postId={postId}
                  onReplySubmitted={handleRefresh}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CommentCard({
  comment,
  postId,
  onReplySubmitted,
}: {
  comment: CommentItem;
  postId: string;
  onReplySubmitted: () => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <Card className="glass p-5 sm:p-6">
      <div className="flex gap-3 sm:gap-4">
        <CommentAvatar name={comment.name} size={40} />
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.name}</span>
            <span className="text-xs text-muted-foreground" title={new Date(comment.createdAt).toLocaleString("id-ID")}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Body */}
          <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReplyOpen((v) => !v)}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-expanded={replyOpen}
              aria-controls={`reply-form-${comment.id}`}
            >
              <Reply className="size-3" />
              Balas
            </Button>
          </div>

          {/* Inline reply form */}
          {replyOpen && (
            <div id={`reply-form-${comment.id}`} className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                parentName={comment.name}
                variant="inline"
                onSubmitted={() => {
                  setReplyOpen(false);
                  onReplySubmitted();
                }}
                onCancel={() => setReplyOpen(false)}
              />
            </div>
          )}

          {/* Nested replies (1 level) */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-5 space-y-4 border-l-2 border-border pl-4 sm:pl-5">
              {comment.replies.map((r) => (
                <div key={r.id} className="flex gap-3 sm:gap-4">
                  <CommentAvatar name={r.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                      <span
                        className="text-xs text-muted-foreground"
                        title={new Date(r.createdAt).toLocaleString("id-ID")}
                      >
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                      {r.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyComments() {
  return (
    <Card className="glass p-10 text-center sm:p-14">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-7 text-muted-foreground/60" />
      </div>
      <p className="text-lg font-semibold">Belum ada komentar</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Jadilah yang pertama memulai diskusi. Bagikan pendapat atau
        pertanyaan Anda tentang artikel ini.
      </p>
    </Card>
  );
}
