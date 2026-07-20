"use client";

import { Globe, Monitor, Smartphone, Tablet, ExternalLink, Clock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, formatDateTime } from "@/lib/utils";

export interface VisitorRow {
  id: string;
  path: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  createdAt: string;
}

const DEVICE_ICONS: Record<string, any> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
};

const DEVICE_STYLES: Record<string, string> = {
  DESKTOP: "bg-amber-500/15 text-amber-600",
  MOBILE: "bg-teal-500/15 text-teal-600",
  TABLET: "bg-violet-500/15 text-violet-600",
};

const BROWSER_STYLES: Record<string, string> = {
  CHROME: "text-amber-600",
  FIREFOX: "text-orange-600",
  SAFARI: "text-blue-500",
  EDGE: "text-teal-600",
};

export function VisitorsManager({ data }: { data: VisitorRow[] }) {
  const columns: Column<VisitorRow>[] = [
    {
      key: "path",
      header: "Path",
      sortable: true,
      render: (row) => (
        <a
          href={row.path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary group"
        >
          <Globe className="size-3.5 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{row.path}</span>
          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ),
    },
    {
      key: "referrer",
      header: "Referrer",
      render: (row) =>
        row.referrer ? (
          <a
            href={row.referrer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground truncate block max-w-[200px]"
            title={row.referrer}
          >
            {row.referrer}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Direct / —</span>
        ),
    },
    {
      key: "device",
      header: "Device",
      render: (row) => {
        const Icon = DEVICE_ICONS[row.device || ""] || Monitor;
        return (
          <Badge
            variant="outline"
            className={cn("rounded-full border-0", DEVICE_STYLES[row.device || ""] || "bg-muted text-muted-foreground")}
          >
            <Icon className="size-3 mr-1" /> {row.device || "—"}
          </Badge>
        );
      },
    },
    {
      key: "browser",
      header: "Browser",
      render: (row) => (
        <span className={cn("text-sm font-medium", BROWSER_STYLES[row.browser || ""] || "text-muted-foreground")}>
          {row.browser || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Waktu",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            {timeAgo(row.createdAt)}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatDateTime(row.createdAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Pengunjung"
        description={`${data.length} kunjungan terakhir`}
        icon={Globe}
      />
      <DataTable
        data={data}
        columns={columns}
        searchKeys={["path", "referrer", "device", "browser"]}
        searchPlaceholder="Cari pengunjung..."
        pageSize={15}
      />
    </div>
  );
}
