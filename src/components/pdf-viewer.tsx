"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Download, Printer, ZoomIn, ZoomOut, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfViewerProps {
  url: string;
  title: string;
  trigger?: React.ReactNode;
}

export function PdfViewer({ url, title, trigger }: PdfViewerProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setZoom(100);
    }
  }, [open]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = title.endsWith(".pdf") ? title : `${title}.pdf`;
    a.click();
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setOpen(true)}
        >
          <FileText className="size-4" />
          Lihat PDF
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-medium truncate flex-1">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={handlePrint}
              >
                <Printer className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                onClick={handleDownload}
              >
                <Download className="size-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 relative" style={{ minHeight: "60vh" }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`${url}#toolbar=0&navpanes=0&view=FitH&zoom=${zoom}`}
              className="w-full h-full"
              style={{ minHeight: "60vh", transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              onLoad={() => setLoading(false)}
              title={title}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
