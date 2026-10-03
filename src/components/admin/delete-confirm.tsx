"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface DeleteConfirmProps {
  trigger: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function DeleteConfirm({
  trigger,
  onConfirm,
  title = "Hapus item ini?",
  description = "Tindakan ini tidak dapat dibatalkan. Item akan dihapus permanen.",
  confirmText = "Hapus",
  cancelText = "Batal",
  destructive = true,
}: DeleteConfirmProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // onConfirm gagal — dialog dibiarkan terbuka agar user bisa mencoba lagi.
      // Notifikasi error sudah ditampilkan pemanggil (toast); tanpa catch di sini
      // rejection akan menjadi "Uncaught (in promise)" di console browser.
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              destructive && "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600"
            )}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
