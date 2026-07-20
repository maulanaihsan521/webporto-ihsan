export default function FinancialMarketLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-20 w-3/4 rounded-2xl bg-muted/40 shimmer" />
        <div className="h-12 w-full rounded-xl bg-muted/40 shimmer" />
        <div className="h-12 w-full rounded-xl bg-muted/40 shimmer" />
        <div className="h-96 w-full rounded-2xl bg-muted/30 shimmer" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/30 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
