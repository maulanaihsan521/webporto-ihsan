"use client";

import {
  Database, Plus, Pencil, Trash2, Reply, LogIn, LogOut,
  Upload, Download, Settings, type LucideIcon,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials, timeAgo, formatDateTime } from "@/lib/utils";

export interface ActivityRow {
  id: string;
  action: string;
  entity: string;
  detail: string | null;
  user: { name: string | null } | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string } | null> = {
  CREATE: { label: "Buat", icon: Plus, color: "bg-emerald-500/15 text-emerald-600" },
  UPDATE: { label: "Ubah", icon: Pencil, color: "bg-amber-500/15 text-amber-600" },
  DELETE: { label: "Hapus", icon: Trash2, color: "bg-rose-500/15 text-rose-600" },
  LOGIN: { label: "Masuk", icon: LogIn, color: "bg-teal-500/15 text-teal-600" },
  LOGOUT: { label: "Keluar", icon: LogOut, color: "bg-muted text-muted-foreground" },
  REPLY: { label: "Balas", icon: Reply, color: "bg-violet-500/15 text-violet-600" },
  UPLOAD: { label: "Upload", icon: Upload, color: "bg-cyan-500/15 text-cyan-600" },
  DOWNLOAD: { label: "Unduh", icon: Download, color: "bg-teal-500/15 text-teal-600" },
};

export function ActivityLogManager({ data }: { data: ActivityRow[] }) {
  const columns: Column<ActivityRow>[] = [
    {
      key: "action",
      header: "Aksi",
      render: (row) => {
        const cfg = ACTION_CONFIG[row.action];
        const Icon = cfg?.icon || Settings;
        return (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border-0 font-medium",
              cfg?.color || "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="size-3 mr-1" />
            {cfg?.label || row.action}
          </Badge>
        );
      },
    },
    {
      key: "entity",
      header: "Entitas",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-medium">{row.entity}</span>
      ),
    },
    {
      key: "detail",
      header: "Detail",
      render: (row) =>
        row.detail ? (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[420px]">
            {row.detail}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "user",
      header: "Oleh",
      render: (row) =>
        row.user?.name ? (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback className="bg-primary/15 text-primary text-[10px]">
                {getInitials(row.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{row.user.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sistem</span>
        ),
    },
    {
      key: "createdAt",
      header: "Waktu",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">{timeAgo(row.createdAt)}</span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(row.createdAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Activity Log"
        description={`${data.length} aktivitas terbaru`}
        icon={Database}
      />
      <DataTable
        data={data}
        columns={columns}
        searchKeys={["action", "entity", "detail"]}
        searchPlaceholder="Cari aktivitas..."
        pageSize={15}
      />
    </div>
  );
}
