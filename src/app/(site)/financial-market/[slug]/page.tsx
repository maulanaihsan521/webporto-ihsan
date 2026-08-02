import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArrowLeft, Calendar, Eye, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/share-buttons";
import { PdfLinkExtractor } from "@/components/pdf-link-extractor";
import { SectionReveal } from "@/components/motion-primitives";
import { formatDate, stripHtml, truncate } from "@/lib/utils";
import type { Metadata } from "next";

const TYPE_LABELS: Record<string, string> = {
  ANALYSIS: "Analisis", TECHNICAL: "Teknikal", FUNDAMENTAL: "Fundamental",
  EDUCATION: "Edukasi", RISK: "Risk Management", JOURNAL: "Journal",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.marketArticle.findUnique({ where: { slug } });
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.excerpt || truncate(stripHtml(article.content), 160),
    openGraph: { title: article.title, description: article.excerpt || "", type: "article" },
  };
}

export default async function MarketArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.marketArticle.findUnique({ where: { slug } });

  if (!article || !article.published) notFound();

  db.marketArticle.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const related = await db.marketArticle.findMany({
    where: { published: true, id: { not: article.id }, type: article.type },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <article className="section-pad py-10">
        <div className="mx-auto max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-6 rounded-xl">
            <Link href="/financial-market"><ArrowLeft className="size-4" /> Kembali ke Market</Link>
          </Button>

          <SectionReveal>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {article.instrument && <span className="text-sm font-medium text-muted-foreground">{article.instrument}</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">{article.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{article.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
              <span className="flex items-center gap-1.5"><Calendar className="size-4" /> {article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Eye className="size-4" /> {article.viewCount + 1} views</span>
            </div>
          </SectionReveal>

          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.coverImage} alt={article.title} className="w-full aspect-[16/9] object-cover rounded-2xl mb-8" />
          )}

          <SectionReveal>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: article.content }} />
            <PdfLinkExtractor content={article.content} title={article.title} />
          </SectionReveal>

          <div className="mt-10 pt-6 border-t">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm font-medium">Bagikan artikel:</p>
              <ShareButtons url={`/financial-market/${article.slug}`} title={article.title} />
            </div>
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">⚠️ Disclaimer</p>
            <p className="text-muted-foreground">Konten di halaman ini bersifat informasi dan edukasi, BUKAN saran investasi. Selalu lakukan riset mandiri dan konsultasi dengan penasihat finansial sebelum mengambil keputusan investasi.</p>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section-pad py-12 border-t">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Artikel Terkait</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.id} href={`/financial-market/${r.slug}`}>
                  <Card className="lift group rounded-2xl p-5 glass h-full">
                    <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{r.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.excerpt}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 group-hover:gap-2 transition-all">Baca <ArrowRight className="size-3.5" /></span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
