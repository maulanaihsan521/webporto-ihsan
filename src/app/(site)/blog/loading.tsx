export default function BlogLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-16 w-3/4 rounded-2xl bg-muted/40 shimmer" />
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border">
              <div className="aspect-[16/9] bg-muted/40 shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-muted/40 shimmer" />
                <div className="h-6 w-full rounded bg-muted/40 shimmer" />
                <div className="h-4 w-full rounded bg-muted/40 shimmer" />
                <div className="h-4 w-2/3 rounded bg-muted/40 shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
