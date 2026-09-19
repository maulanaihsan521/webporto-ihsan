export default function PageLoading() {
  return (
    <div className="section-pad py-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-2/3 max-w-sm rounded bg-muted/40 shimmer" />
          <div className="h-4 w-1/2 max-w-md rounded bg-muted/40 shimmer" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl border bg-muted/30 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
