"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { PdfViewer } from "@/components/pdf-viewer";

/**
 * Extracts PDF links from HTML content and renders PDF viewer buttons.
 * Detects <a href="*.pdf"> links and <embed src="*.pdf"> in the content.
 */
export function PdfLinkExtractor({ content, title }: { content: string; title: string }) {
  const pdfUrls = useMemo(() => {
    const urls: { url: string; label: string }[] = [];
    
    // Find <a href="*.pdf"> links
    const linkRegex = /<a[^>]+href=["']([^"']*\.pdf[^"']*)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      const label = match[2]?.replace(/<[^>]*>/g, "").trim() || "PDF Document";
      if (!urls.find((u) => u.url === url)) {
        urls.push({ url, label });
      }
    }
    
    // Find <embed src="*.pdf"> or <iframe src="*.pdf">
    const embedRegex = /<(?:embed|iframe)[^>]+src=["']([^"']*\.pdf[^"']*)["']/gi;
    while ((match = embedRegex.exec(content)) !== null) {
      const url = match[1];
      if (!urls.find((u) => u.url === url)) {
        urls.push({ url, label: "PDF Document" });
      }
    }
    
    // Also find plain URLs ending in .pdf
    const plainUrlRegex = /https?:\/\/[^\s"'<>]+\.pdf([?#][^\s"'<>]*)?/gi;
    while ((match = plainUrlRegex.exec(content)) !== null) {
      const url = match[0];
      if (!urls.find((u) => u.url === url)) {
        urls.push({ url, label: "PDF Document" });
      }
    }
    
    return urls;
  }, [content]);

  if (pdfUrls.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl mt-6 p-4 rounded-2xl border border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="size-5 text-primary" />
        <h3 className="text-sm font-semibold">
          {pdfUrls.length > 1 ? "Dokumen PDF tersedia" : "Dokumen PDF"}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {pdfUrls.map((pdf, i) => (
          <PdfViewer
            key={i}
            url={pdf.url}
            title={`${title} - ${pdf.label}`}
            trigger={
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-sm font-medium">
                <FileText className="size-4 text-primary" />
                {pdf.label}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
