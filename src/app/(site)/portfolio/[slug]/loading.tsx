// Skeleton halaman detail portfolio — feedback visual INSTAN saat kartu
// proyek diklik (masalah sama dengan blog/[slug]: klik tanpa feedback).
export default function PortfolioDetailLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Breadcrumb + judul */}
        <div className="h-4 w-40 rounded bg-muted/40 shimmer" />
        <div className="space-y-4">
          <div className="h-10 w-11/12 rounded-xl bg-muted/40 shimmer" />
          <div className="h-10 w-3/5 rounded-xl bg-muted/40 shimmer" />
          <div className="flex gap-3 pt-2">
            <div className="h-6 w-24 rounded-full bg-muted/40 shimmer" />
            <div className="h-6 w-20 rounded-full bg-muted/40 shimmer" />
            <div className="h-6 w-28 rounded-full bg-muted/40 shimmer" />
          </div>
        </div>

        {/* Banner proyek */}
        <div className="aspect-[16/9] w-full overflow-hidden rounded-3xl bg-muted/40 shimmer" />

        {/* Info grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/40 shimmer" />
          ))}
        </div>

        {/* Deskripsi */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-muted/40 shimmer"
              style={{ width: `${68 + ((i * 14) % 30)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
