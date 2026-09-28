/* SiteAmbience — latar dekoratif LIGHT & DARK (referensi user):
   gelombang SVG STATIS + blob organik + dot grid.
   - Dipasang sekali di layout site; fixed di belakang konten (z -10)
   - Warna dikendalikan CSS variables --amb-* di globals.css:
     light = soft gold/biru di atas Warm Ivory; dark = indigo/slate
   - TANPA animasi (permintaan user: gelombang tidak bergerak agar ringan)
   - aria-hidden & pointer-events: none (murni dekoratif)
   - Tanpa garis aksen emas (dihapus atas permintaan user). */
export function SiteAmbience() {
  return (
    <div aria-hidden="true" className="amb-layer">
      {/* Dot grid — kanan atas (ala referensi hero) */}
      <div className="amb-dot-grid" />

      {/* Blob A — kiri bawah (light: periwinkle lembut / dark: indigo) */}
      <div className="amb-blob amb-blob-a" />
      {/* Blob B — kanan atas, sangat halus (champagne gold) */}
      <div className="amb-blob amb-blob-b" />

      {/* Gelombang atas — lembut */}
      <svg
        className="amb-wave amb-wave-top"
        viewBox="0 0 2880 150"
        preserveAspectRatio="none"
      >
        <path d="M0,90 C240,140 480,140 720,90 C960,40 1200,40 1440,90 C1680,140 1920,140 2160,90 C2400,40 2640,40 2880,90 L2880,0 L0,0 Z" />
      </svg>

      {/* Gelombang bawah lapis 1 */}
      <svg
        className="amb-wave amb-wave-b1"
        viewBox="0 0 2880 220"
        preserveAspectRatio="none"
      >
        <path d="M0,120 C240,55 480,55 720,120 C960,185 1200,185 1440,120 C1680,55 1920,55 2160,120 C2400,185 2640,185 2880,120 L2880,220 L0,220 Z" />
      </svg>

      {/* Gelombang bawah lapis 2 */}
      <svg
        className="amb-wave amb-wave-b2"
        viewBox="0 0 2880 190"
        preserveAspectRatio="none"
      >
        <path d="M0,105 C240,65 480,65 720,105 C960,145 1200,145 1440,105 C1680,65 1920,65 2160,105 C2400,145 2640,145 2880,105 L2880,190 L0,190 Z" />
      </svg>
    </div>
  );
}
