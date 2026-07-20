export default function GalleryLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-16 w-1/2 rounded-2xl bg-muted/40 shimmer" />
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-muted/40 shimmer"
              style={{ height: 200 + (i % 4) * 80 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
