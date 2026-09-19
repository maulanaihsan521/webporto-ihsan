export default function PortfolioLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-16 w-2/3 rounded-2xl bg-muted/40 shimmer" />
        <div className="flex gap-3">
          <div className="h-10 w-64 rounded-xl bg-muted/40 shimmer" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-20 rounded-xl bg-muted/40 shimmer" />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border">
              <div className="aspect-[16/10] bg-muted/40 shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 rounded bg-muted/40 shimmer" />
                <div className="h-4 w-full rounded bg-muted/40 shimmer" />
                <div className="h-4 w-1/2 rounded bg-muted/40 shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
