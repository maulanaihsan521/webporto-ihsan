// Skeleton halaman detail artikel blog — memberi feedback visual INSTAN
// saat kartu artikel diklik, sebelum data dari server selesai dimuat.
// Tanpa file ini, klik artikel tidak menampilkan apa pun (terasa "mati")
// sampai seluruh query DB selesai → pengguna mengeklik berkali-kali.
export default function BlogDetailLoading() {
  return (
    <div className="section-pad py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Breadcrumb placeholder */}
        <div className="h-4 w-48 rounded bg-muted/40 shimmer" />

        {/* Judul + meta */}
        <div className="space-y-4">
          <div className="h-10 w-11/12 rounded-xl bg-muted/40 shimmer" />
          <div className="h-10 w-2/3 rounded-xl bg-muted/40 shimmer" />
          <div className="flex gap-4 pt-2">
            <div className="h-4 w-28 rounded bg-muted/40 shimmer" />
            <div className="h-4 w-20 rounded bg-muted/40 shimmer" />
            <div className="h-4 w-24 rounded bg-muted/40 shimmer" />
          </div>
        </div>

        {/* Cover image */}
        <div className="aspect-[16/8] w-full overflow-hidden rounded-3xl bg-muted/40 shimmer" />

        {/* Paragraf konten */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-muted/40 shimmer"
              style={{ width: `${72 + ((i * 13) % 26)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
