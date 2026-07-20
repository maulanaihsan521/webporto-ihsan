export default function HomeLoading() {
  return (
    <div className="relative">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute inset-0 animated-gradient" />
        <div className="section-pad relative z-10">
          <div className="mx-auto max-w-7xl grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center min-h-[80vh]">
            <div className="space-y-7">
              <div className="h-7 w-56 rounded-full bg-muted/50 shimmer" />
              <div className="h-14 w-3/4 rounded-2xl bg-muted/50 shimmer" />
              <div className="h-10 w-2/3 rounded-xl bg-muted/50 shimmer" />
              <div className="h-20 w-full rounded-xl bg-muted/50 shimmer" />
              <div className="flex gap-3">
                <div className="h-12 w-36 rounded-xl bg-muted/50 shimmer" />
                <div className="h-12 w-28 rounded-xl bg-muted/50 shimmer" />
                <div className="h-12 w-32 rounded-xl bg-muted/50 shimmer" />
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="size-10 rounded-xl bg-muted/50 shimmer" />
                ))}
              </div>
            </div>
            <div className="relative max-w-sm mx-auto">
              <div className="aspect-[4/5] rounded-[2rem] bg-muted/50 shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted/30 shimmer" />
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio skeleton */}
      <section className="section-pad py-16">
        <div className="mx-auto max-w-7xl">
          <div className="h-10 w-64 rounded-xl bg-muted/50 shimmer mb-10" />
          <div className="grid sm:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted/30 shimmer" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
