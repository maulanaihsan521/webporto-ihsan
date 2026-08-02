import Link from "next/link";
import { FileText,
  Briefcase,
  Scale,
  Lightbulb,
  Plug,
  ShieldAlert,
  RefreshCw,
  Gavel,
  Mail,
  ArrowRight,
  ChevronRight,
  type LucideIcon } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Syarat & Ketentuan — Maulana Ihsan Rohim",
  description:
    "Syarat dan Ketentuan penggunaan layanan Maulana Ihsan Rohim — aturan, hak, kewajiban, dan batasan tanggung jawab.",
};

type TocItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const TOC: TocItem[] = [
  { id: "pendahuluan", label: "Pendahuluan", icon: FileText },
  { id: "penggunaan", label: "Penggunaan Layanan", icon: Briefcase },
  { id: "hak-kewajiban", label: "Hak dan Kewajiban", icon: Scale },
  { id: "ki", label: "Kekayaan Intelektual", icon: Lightbulb },
  { id: "pihak-ketiga", label: "Layanan Pihak Ketiga", icon: Plug },
  { id: "tanggung-jawab", label: "Pembatasan Tanggung Jawab", icon: ShieldAlert },
  { id: "perubahan", label: "Perubahan Layanan", icon: RefreshCw },
  { id: "hukum", label: "Hukum yang Berlaku", icon: Gavel },
  { id: "kontak", label: "Kontak", icon: Mail },
];

export default async function TermsPage() {
  const settings = await getSettings();
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";
  const ownerEmail = settings.owner_email || "hello@portofolioihsan.space-z.ai";
  const lastUpdated = new Date("2025-01-15");

  return (
    <div className="relative">

      {/* ===== Content + TOC ===== */}
      <section className="section-pad py-8 sm:py-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Sticky TOC sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 space-y-4">
                <div className="glass-strong rounded-2xl p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Daftar Isi
                    </h2>
                  </div>
                  <nav aria-label="Daftar isi syarat dan ketentuan">
                    <ul className="space-y-1">
                      {TOC.map((item, i) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="group flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <span className="mt-0.5 text-[10px] font-mono text-muted-foreground/60">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="flex-1 group-hover:text-foreground">
                              {item.label}
                            </span>
                            <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>

                <div className="glass rounded-2xl p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pertanyaan?
                    </h3>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Hubungi saya terkait ketentuan layanan.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/contact">
                      Hubungi Saya
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="lg:col-span-9">
              <SectionReveal>
                <article className="glass-strong rounded-2xl p-6 sm:p-8 lg:p-12">
                  <div className="prose-content mx-auto max-w-3xl">
                    {/* Pendahuluan */}
                    <section id="pendahuluan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">1. Pendahuluan</h2>
                      </div>
                      <p>
                        Selamat datang di situs web {ownerName}. Syarat dan
                        Ketentuan ini (&ldquo;Ketentuan&rdquo;) mengatur penggunaan
                        situs web dan layanan yang disediakan oleh {ownerName}
                        (&ldquo;Layanan&rdquo;). Dengan mengakses, menjelajahi,
                        atau menggunakan Layanan ini, Anda (&ldquo;Pengguna&rdquo;)
                        dianggap telah membaca, memahami, dan menyetujui untuk
                        terikat oleh Ketentuan ini.
                      </p>
                      <p>
                        Jika Anda tidak menyetujui salah satu bagian dari
                        Ketentuan ini, Anda tidak diperkenankan mengakses atau
                        menggunakan Layanan. {ownerName} berhak mengubah, memodifikasi,
                        atau memperbarui Ketentuan ini sewaktu-waktu. Perubahan
                        akan berlaku sejak dipublikasikan di halaman ini.
                      </p>
                      <p>
                        Layanan yang dimaksud mencakup, namun tidak terbatas
                        pada, konsultasi Digital Marketing, Photography,
                        Videography, Video Editing, Web Development, dan Financial
                        Market Analysis yang ditawarkan oleh {ownerName}.
                      </p>
                    </section>

                    {/* Penggunaan Layanan */}
                    <section id="penggunaan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">2. Penggunaan Layanan</h2>
                      </div>
                      <p>
                        Dengan menggunakan Layanan, Pengguna setuju untuk
                        mematuhi ketentuan berikut:
                      </p>
                      <ul>
                        <li>
                          Memberikan informasi yang akurat, lengkap, dan
                          terkini saat mengisi formulir atau berkomunikasi.
                        </li>
                        <li>
                          Tidak menggunakan Layanan untuk tujuan ilegal, melanggar
                          hukum, atau tidak sah di bawah yurisdiksi mana pun.
                        </li>
                        <li>
                          Tidak mencoba mengakses area terbatas, sistem internal,
                          atau jaringan situs tanpa otorisasi.
                        </li>
                        <li>
                          Tidak mengganggu, merusak, atau membebani server dan
                          infrastruktur situs dengan aktivitas otomatis (bot,
                          crawler, scraper) tanpa izin tertulis.
                        </li>
                        <li>
                          Tidak menggunakan konten atau materi dari situs untuk
                          kepentingan komersial tanpa izin tertulis dari{" "}
                          {ownerName}.
                        </li>
                        <li>
                          Menghormati hak kekayaan intelektual pihak lain saat
                          berinteraksi dengan Layanan.
                        </li>
                      </ul>
                      <p>
                        Untuk layanan berbayar seperti konsultasi atau proyek
                        tertentu, ketentuan tambahan dapat berlaku sesuai
                        kesepakatan tertulis dalam proposal atau kontrak kerja.
                      </p>
                    </section>

                    {/* Hak dan Kewajiban */}
                    <section id="hak-kewajiban" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Scale className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">3. Hak dan Kewajiban</h2>
                      </div>
                      <h3>3.1 Hak {ownerName}</h3>
                      <ul>
                        <li>
                          Menolak, menangguhkan, atau menghentikan Layanan jika
                          terdapat pelanggaran Ketentuan oleh Pengguna.
                        </li>
                        <li>
                          Memodifikasi, menghentikan, atau meluncurkan ulang
                          bagian mana pun dari Layanan tanpa pemberitahuan sebelumnya.
                        </li>
                        <li>
                          Meminta data tambahan dari Pengguna untuk verifikasi
                          identitas atau keperluan layanan.
                        </li>
                        <li>
                          Mengenakan biaya layanan sesuai kesepakatan, dan menagih
                          keterlambatan pembayaran sesuai kebijakan yang berlaku.
                        </li>
                      </ul>
                      <h3>3.2 Kewajiban {ownerName}</h3>
                      <ul>
                        <li>
                          Memberikan Layanan denganstandar profesional yang wajar
                          sesuai keahlian dan pengalaman.
                        </li>
                        <li>
                          Menjaga kerahasiaan informasi Pengguna yang diterima
                          selama pemberian Layanan.
                        </li>
                        <li>
                          Merespons komunikasi Pengguna dalam waktu yang wajar
                          (maksimal 1×24 jam pada hari kerja).
                        </li>
                        <li>
                          Memberikan hasil kerja sesuai dengan spesifikasi yang
                          disepakati dalam kontrak atau proposal.
                        </li>
                      </ul>
                      <h3>3.3 Hak Pengguna</h3>
                      <ul>
                        <li>
                          Menerima Layanan sesuai dengan yang dijanjikan dalam
                          kesepakatan.
                        </li>
                        <li>
                          Memberikan umpan balik atau keluhan terkait Layanan
                          yang diterima.
                        </li>
                        <li>
                          Meminta revisi pekerjaan sesuai dengan jumlah dan
                          lingkup yang disepakati dalam kontrak.
                        </li>
                      </ul>
                      <h3>3.4 Kewajiban Pengguna</h3>
                      <ul>
                        <li>
                          Membayar biaya Layanan sesuai kesepakatan dan tenggat
                          waktu yang ditentukan.
                        </li>
                        <li>
                          Memberikan brief, materi, atau informasi yang
                          diperlukan untuk penyelesaian proyek tepat waktu.
                        </li>
                        <li>
                          Menyediakan feedback dan persetujuan tahapan kerja
                          sesuai jadwal yang disepakati.
                        </li>
                      </ul>
                    </section>

                    {/* Kekayaan Intelektual */}
                    <section id="ki" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Lightbulb className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">4. Kekayaan Intelektual</h2>
                      </div>
                      <p>
                        Seluruh konten di situs ini — termasuk namun tidak
                        terbatas pada teks, gambar, foto, video, grafik, logo,
                        desain, kode, dan materi lainnya — adalah milik{" "}
                        {ownerName} atau pemberi lisensi, dan dilindungi oleh
                        undang-undang hak cipta serta peraturan terkait lainnya.
                      </p>
                      <h3>4.1 Penggunaan Konten</h3>
                      <p>
                        Pengguna diperbolehkan:
                      </p>
                      <ul>
                        <li>
                          Melihat, mengunduh, dan mencetak konten untuk
                          keperluan pribadi dan non-komersial.
                        </li>
                        <li>
                          Membagikan tautan ke artikel atau halaman melalui media
                          sosial atau platform lain dengan atribusi yang sesuai.
                        </li>
                      </ul>
                      <p>
                        Pengguna dilarang:
                      </p>
                      <ul>
                        <li>
                          Menggunakan, menyalin, memodifikasi, atau mendistribusikan
                          konten untuk tujuan komersial tanpa izin tertulis.
                        </li>
                        <li>
                          Menghapus atau mengubah pemberitahuan hak cipta,
                          merek dagang, atau atribusi lainnya.
                        </li>
                        <li>
                          Menggunakan teknik reverse engineering, decompile, atau
                          mengekstrak kode sumber dari situs.
                        </li>
                      </ul>
                      <h3>4.2 Hasil Kerja Klien</h3>
                      <p>
                        Untuk proyek yang telah diselesaikan dan lunas dibayar,
                        hak penggunaan atas hasil kerja akan dialihkan kepada
                        klien sesuai dengan yang disepakati dalam kontrak.{" "}
                        {ownerName} tetap berhak menampilkan hasil kerja tersebut
                        dalam portofolio sebagai referensi, kecuali ada
                        perjanjian NDA (Non-Disclosure Agreement) yang menyatakan
                        sebaliknya.
                      </p>
                    </section>

                    {/* Layanan Pihak Ketiga */}
                    <section id="pihak-ketiga" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Plug className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">5. Layanan Pihak Ketiga</h2>
                      </div>
                      <p>
                        Situs ini dapat berisi tautan, integrasi, atau referensi
                        ke layanan pihak ketiga (misalnya Google Analytics,
                        YouTube, TradingView, Instagram, GitHub). Kami tidak
                        bertanggung jawab atas:
                      </p>
                      <ul>
                        <li>
                          Ketersediaan, akurasi, atau kualitas layanan pihak ketiga.
                        </li>
                        <li>
                          Konten, kebijakan privasi, atau praktik pihak ketiga.
                        </li>
                        <li>
                          Kerugian atau kerusakan yang timbul dari penggunaan
                          layanan pihak ketiga tersebut.
                        </li>
                      </ul>
                      <p>
                        Pengguna disarankan untuk membaca syarat dan kebijakan
                        privasi dari setiap layanan pihak ketiga sebelum
                        menggunakannya.
                      </p>
                    </section>

                    {/* Pembatasan Tanggung Jawab */}
                    <section id="tanggung-jawab" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <ShieldAlert className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">6. Pembatasan Tanggung Jawab</h2>
                      </div>
                      <p>
                        Layanan disediakan &ldquo;sebagaimana adanya&rdquo; dan
                        &ldquo;sebagaimana tersedia&rdquo; tanpa jaminan apa pun,
                        baik tersurat maupun tersirat. {ownerName} tidak
                        bertanggung jawab atas:
                      </p>
                      <ul>
                        <li>
                          Kerugian tidak langsung, insidental, atau konsekuensial
                          yang timbul dari penggunaan Layanan.
                        </li>
                        <li>
                          Kehilangan data, keuntungan, atau peluang bisnis akibat
                          gangguan Layanan.
                        </li>
                        <li>
                          Hasil dari keputusan investasi atau trading yang dibuat
                          berdasarkan konten Financial Market di situs ini.
                        </li>
                        <li>
                          Kerusakan akibat virus, malware, atau aktivitas berbahaya
                          lain yang menginfeksi perangkat Pengguna melalui akses ke
                          situs.
                        </li>
                      </ul>
                      <p>
                        Khusus untuk konten Financial Market, perlu ditegaskan
                        bahwa seluruh analisis, artikel, dan informasi yang
                        disediakan adalah untuk tujuan edukasi dan informasi
                        semata — bukan saran investasi atau rekomendasi trading.
                        Keputusan investasi sepenuhnya merupakan tanggung jawab
                        Pengguna. Trading di pasar finansial memiliki risiko
                        kerugian, dan kinerja masa lalu tidak menjamin hasil di
                        masa depan.
                      </p>
                      <p>
                        Tanggung jawab maksimal {ownerName} atas klaim terkait
                        Layanan dibatasi sebesar jumlah yang telah dibayarkan
                        Pengguna untuk Layanan tersebut dalam 3 bulan terakhir.
                      </p>
                    </section>

                    {/* Perubahan Layanan */}
                    <section id="perubahan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <RefreshCw className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">7. Perubahan Layanan</h2>
                      </div>
                      <p>
                        {ownerName} berhak untuk sewaktu-waktu:
                      </p>
                      <ul>
                        <li>
                          Memodifikasi, menambah, atau menghentikan fitur tertentu
                          pada Layanan.
                        </li>
                        <li>
                          Melakukan pemeliharaan, pembaruan, atau peningkatan
                          sistem yang dapat menyebabkan downtime sementara.
                        </li>
                        <li>
                          Mengubah harga, paket, atau struktur biaya Layanan
                          dengan pemberitahuan sebelumnya kepada Pengguna aktif.
                        </li>
                        <li>
                          Memperbarui Ketentuan ini — perubahan berlaku sejak
                          dipublikasikan di halaman ini.
                        </li>
                      </ul>
                      <p>
                        Pengguna dianjurkan meninjau halaman ini secara berkala
                        untuk memantau perubahan. Penggunaan situs secara
                        berkelanjutan setelah perubahan dipublikasikan dianggap
                        sebagai persetujuan terhadap Ketentuan yang diperbarui.
                      </p>
                    </section>

                    {/* Hukum yang Berlaku */}
                    <section id="hukum" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Gavel className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">8. Hukum yang Berlaku</h2>
                      </div>
                      <p>
                        Ketentuan ini diatur dan ditafsirkan berdasarkan hukum
                        Republik Indonesia. Setiap sengketa yang timbul dari atau
                        berkaitan dengan Ketentuan ini atau penggunaan Layanan
                        akan diupayakan terlebih dahulu diselesaikan secara
                        musyawarah dengan semangat itikad baik.
                      </p>
                      <p>
                        Apabila tidak tercapai kesepakatan, sengketa akan
                        diselesaikan melalui mekanisme Pengadilan Negeri yang
                        berwenang sesuai domisili {ownerName}, kecuali ditentukan
                        lain oleh peraturan perundang-undangan yang berlaku.
                      </p>
                      <p>
                        Apabila salah satu ketentuan dalam dokumen ini dinyatakan
                        tidak sah atau tidak dapat dilaksanakan oleh pengadilan
                        yang berwenang, ketentuan lainnya tetap berlaku sebagaimana
                        mestinya.
                      </p>
                    </section>

                    {/* Kontak */}
                    <section id="kontak" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Mail className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">9. Kontak</h2>
                      </div>
                      <p>
                        Jika Anda memiliki pertanyaan, klarifikasi, atau
                        permintaan terkait Syarat dan Ketentuan ini, silakan
                        hubungi kami:
                      </p>
                      <div className="my-6 rounded-xl border border-border bg-muted/40 p-5">
                        <p className="!mb-1 font-semibold">{ownerName}</p>
                        <p className="!mb-1 text-sm text-muted-foreground">
                          Email:{" "}
                          <a href={`mailto:${ownerEmail}`} className="font-medium">
                            {ownerEmail}
                          </a>
                        </p>
                        <p className="!mb-0 text-sm text-muted-foreground">
                          Atau gunakan{" "}
                          <Link href="/contact" className="font-medium">
                            formulir kontak
                          </Link>{" "}
                          yang tersedia di situs ini.
                        </p>
                      </div>
                      <p>
                        Kami akan menanggapi pertanyaan Anda dalam waktu 1×24 jam
                        pada hari kerja.
                      </p>
                    </section>

                    <hr className="my-8 border-border" />
                    <p className="text-sm text-muted-foreground">
                      Dokumen ini terakhir diperbarui pada{" "}
                      <time dateTime={lastUpdated.toISOString()}>
                        {formatDate(lastUpdated)}
                      </time>{" "}
                      oleh {ownerName}.
                    </p>
                  </div>
                </article>
              </SectionReveal>

              {/* Bottom navigation */}
              <SectionReveal delay={0.1}>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl glass p-5">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Lihat juga</p>
                      <p className="text-xs text-muted-foreground">
                        Kebijakan privasi data pengguna
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="glass">
                    <Link href="/privacy-policy">
                      Kebijakan Privasi
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
