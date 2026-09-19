// Skeleton halaman detail sertifikat — feedback visual INSTAN saat kartu
// sertifikat diklik (masalah sama dengan blog/[slug]: klik tanpa feedback).
export default function CertificateDetailLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Breadcrumb + judul */}
        <div className="h-4 w-44 rounded bg-muted/40 shimmer" />
        <div className="space-y-4">
          <div className="h-10 w-10/12 rounded-xl bg-muted/40 shimmer" />
          <div className="flex gap-4 pt-2">
            <div className="h-5 w-28 rounded-full bg-muted/40 shimmer" />
            <div className="h-5 w-24 rounded-full bg-muted/40 shimmer" />
          </div>
        </div>

        {/* Preview sertifikat */}
        <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted/40 shimmer" />

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/40 shimmer" />
          ))}
        </div>

        {/* Deskripsi */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-muted/40 shimmer"
              style={{ width: `${70 + ((i * 15) % 28)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
