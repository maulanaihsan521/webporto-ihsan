export default function AboutLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="h-24 w-3/4 rounded-2xl bg-muted/40 shimmer" />
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10">
          <div className="aspect-[4/5] rounded-3xl bg-muted/40 shimmer" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 rounded bg-muted/40 shimmer" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/30 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
