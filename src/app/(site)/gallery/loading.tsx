export default function GalleryLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-16 w-1/2 rounded-2xl bg-muted/40 shimmer" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-muted/40 shimmer aspect-[3/4] sm:aspect-[4/5]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
