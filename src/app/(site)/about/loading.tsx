export default function AboutLoading() {
  return (
    <div className="section-pad py-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Profile card + Bio — mirror grid [280px_1fr] */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="glass-strong rounded-xl p-4 text-center">
            <div className="mx-auto size-32 rounded-full bg-muted/40 shimmer sm:size-36" />
            <div className="mx-auto mt-5 h-6 w-3/4 rounded bg-muted/40 shimmer" />
            <div className="mx-auto mt-2 h-3.5 w-1/2 rounded bg-muted/40 shimmer" />
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 w-20 rounded-full bg-muted/40 shimmer" />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="h-8 w-2/3 rounded bg-muted/40 shimmer" />
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-muted/40 shimmer"
                  style={{ width: `${95 - i * 6}%` }}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[66px] rounded-xl bg-muted/30 shimmer" />
              ))}
            </div>
          </div>
        </div>
        {/* Visi & Misi */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/30 shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
