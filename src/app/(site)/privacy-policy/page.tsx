import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Lock,
  Eye,
  Cookie,
  Share2,
  UserCheck,
  RefreshCw,
  Mail,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion-primitives";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Kebijakan Privasi — Maulana Ihsan Rohim",
  description:
    "Kebijakan Privasi Maulana Ihsan Rohim — bagaimana data Anda dikumpulkan, digunakan, dan dilindungi saat mengunjungi situs ini.",
};

type TocItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const TOC: TocItem[] = [
  { id: "pendahuluan", label: "Pendahuluan", icon: FileText },
  { id: "informasi", label: "Informasi yang Kami Kumpulkan", icon: Eye },
  { id: "penggunaan", label: "Bagaimana Kami Menggunakan Informasi", icon: UserCheck },
  { id: "cookies", label: "Cookies & Teknologi Pelacakan", icon: Cookie },
  { id: "berbagi", label: "Berbagi Informasi dengan Pihak Ketiga", icon: Share2 },
  { id: "keamanan", label: "Keamanan Data", icon: Lock },
  { id: "hak-anda", label: "Hak Anda", icon: ShieldCheck },
  { id: "perubahan", label: "Perubahan Kebijakan", icon: RefreshCw },
  { id: "kontak", label: "Kontak", icon: Mail },
];

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const ownerName = settings.owner_name || "Maulana Ihsan Rohim";
  const ownerEmail = settings.owner_email || "hello@portofolioihsan.space-z.ai";
  const lastUpdated = new Date("2025-01-15");

  return (
    <div className="relative">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden animated-gradient border-b border-border">
        <div className="mesh-bg" aria-hidden />
        <div className="section-pad relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <SectionReveal>
              <Badge
                variant="outline"
                className="mb-5 glass px-4 py-1.5 text-xs uppercase tracking-wider"
              >
                <ShieldCheck className="mr-1.5 size-3.5" />
                Legal
              </Badge>
            </SectionReveal>
            <SectionReveal delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Kebijakan <span className="text-gradient">Privasi</span>
              </h1>
            </SectionReveal>
            <SectionReveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Komitmen {ownerName} dalam melindungi privasi dan keamanan data
                pribadi Anda. Dokumen ini menjelaskan bagaimana data dikumpulkan,
                digunakan, dan dilindungi.
              </p>
            </SectionReveal>
            <SectionReveal delay={0.15}>
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs text-muted-foreground">
                <RefreshCw className="size-3.5 text-primary" />
                Terakhir diperbarui:{" "}
                <time dateTime={lastUpdated.toISOString()} className="font-medium text-foreground">
                  {formatDate(lastUpdated)}
                </time>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ===== Content + TOC ===== */}
      <section className="section-pad py-12 sm:py-16 lg:py-20">
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
                  <nav aria-label="Daftar isi kebijakan privasi">
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
                    Hubungi saya terkait privasi data Anda.
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
                        Selamat datang di situs web {ownerName} (&ldquo;situs&rdquo;
                        atau &ldquo;layanan&rdquo;). Privasi Anda sangat penting
                        bagi kami. Kebijakan Privasi ini menjelaskan bagaimana kami
                        mengumpulkan, menggunakan, melindungi, dan membagikan
                        informasi pribadi Anda saat Anda mengunjungi situs ini
                        atau menggunakan layanan yang kami sediakan.
                      </p>
                      <p>
                        Dengan mengakses dan menggunakan situs ini, Anda setuju
                        dengan praktik yang dijelaskan dalam Kebijakan Privasi
                        ini. Jika Anda tidak setuju dengan kebijakan ini, mohon
                        untuk tidak menggunakan situs ini. Kebijakan ini berlaku
                        untuk seluruh pengunjung, pengguna, dan pihak lain yang
                        mengakses layanan kami.
                      </p>
                      <p>
                        {ownerName} beroperasi sebagai profesional independen di
                        bidang Digital Marketing, Photography, Videography, dan
                        Financial Market Analysis. Sebagai pengelola data pribadi,
                        kami berkomitmen untuk mematuhi Undang-Undang Nomor 27
                        Tahun 2022 tentang Pelindungan Data Pribadi serta
                        peraturan terkait lainnya yang berlaku di Indonesia.
                      </p>
                    </section>

                    {/* Informasi yang Kami Kumpulkan */}
                    <section id="informasi" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Eye className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">2. Informasi yang Kami Kumpulkan</h2>
                      </div>
                      <p>
                        Kami mengumpulkan berbagai jenis informasi untuk
                        memberikan dan meningkatkan layanan kami. Jenis data yang
                        dikumpulkan meliputi:
                      </p>
                      <h3>2.1 Informasi yang Anda Berikan Secara Sukarela</h3>
                      <p>
                        Saat Anda mengisi formulir kontak, berlangganan newsletter,
                        atau mengirimkan komentar pada artikel blog, kami dapat
                        mengumpulkan:
                      </p>
                      <ul>
                        <li>
                          <strong>Nama lengkap</strong> — untuk identifikasi dan
                          personalisasi komunikasi.
                        </li>
                        <li>
                          <strong>Alamat email</strong> — untuk merespons pertanyaan,
                          mengirim informasi, dan komunikasi terkait layanan.
                        </li>
                        <li>
                          <strong>Nomor telepon</strong> — opsional, untuk
                          komunikasi yang lebih cepat jika diperlukan.
                        </li>
                        <li>
                          <strong>Subjek dan pesan</strong> — isi komunikasi yang
                          Anda kirimkan melalui formulir kontak.
                        </li>
                      </ul>
                      <h3>2.2 Informasi yang Dikumpulkan Secara Otomatis</h3>
                      <p>
                        Saat Anda menjelajahi situs, kami dapat secara otomatis
                        mengumpulkan data teknis dan analitik berikut:
                      </p>
                      <ul>
                        <li>Alamat IP (dengan pemotongan untuk anonimitas)</li>
                        <li>Jenis dan versi browser, sistem operasi, dan perangkat</li>
                        <li>Halaman yang dikunjungi, durasi sesi, dan tindakan di situs</li>
                        <li>Referer (situs yang mengarahkan Anda ke sini)</li>
                        <li>Waktu dan tanggal kunjungan</li>
                      </ul>
                      <p>
                        Data analitik ini bersifat anonim dan dikumpulkan dalam
                        bentuk agregat. Kami tidak mengaitkan data ini dengan
                        identitas pribadi Anda kecuali diwajibkan oleh hukum.
                      </p>
                      <h3>2.3 Cookies dan Teknologi Serupa</h3>
                      <p>
                        Kami menggunakan cookies dan teknologi pelacakan serupa
                        untuk meningkatkan pengalaman pengguna. Detail lebih lanjut
                        dapat ditemukan di bagian <a href="#cookies">Cookies &amp; Teknologi Pelacakan</a>.
                      </p>
                    </section>

                    {/* Bagaimana Kami Menggunakan Informasi */}
                    <section id="penggunaan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <UserCheck className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">3. Bagaimana Kami Menggunakan Informasi</h2>
                      </div>
                      <p>
                        Informasi yang kami kumpulkan digunakan untuk tujuan
                        yang sah dan terbatas, antara lain:
                      </p>
                      <ul>
                        <li>
                          <strong>Meréspons pertanyaan dan permintaan Anda</strong> —
                          membalas pesan yang dikirim melalui formulir kontak atau
                          email.
                        </li>
                        <li>
                          <strong>Memberikan dan meningkatkan layanan</strong> —
                          memahami kebutuhan Anda untuk mengoptimalkan konten,
                          fitur, dan pengalaman pengguna.
                        </li>
                        <li>
                          <strong>Mengirim newsletter</strong> — jika Anda secara
                          aktif berlangganan dan memberikan consent, kami akan
                          mengirimkan konten edukatif, pembaruan, dan informasi
                          terkait layanan.
                        </li>
                        <li>
                          <strong>Analisis dan penelitian</strong> — memahami
                          tren kunjungan, perilaku pengguna, dan efektivitas
                          konten untuk pengembangan situs.
                        </li>
                        <li>
                          <strong>Keamanan dan pencegahan penyalahgunaan</strong> —
                          melindungi situs, pengguna, dan data dari aktivitas
                          berbahaya.
                        </li>
                        <li>
                          <strong>Kepatuhan hukum</strong> — memenuhi kewajiban
                          legal dan merespons permintaan resmi dari otoritas yang
                          berwenang.
                        </li>
                      </ul>
                      <p>
                        Kami tidak akan menggunakan informasi pribadi Anda untuk
                        tujuan lain tanpa terlebih dahulu meminta persetujuan
                        Anda.
                      </p>
                    </section>

                    {/* Cookies dan Teknologi Pelacakan */}
                    <section id="cookies" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Cookie className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">4. Cookies dan Teknologi Pelacakan</h2>
                      </div>
                      <p>
                        Cookies adalah file teks kecil yang disimpan di perangkat
                        Anda saat mengunjungi situs web. Kami menggunakan cookies
                        untuk berbagai tujuan:
                      </p>
                      <h3>4.1 Jenis Cookies yang Kami Gunakan</h3>
                      <ul>
                        <li>
                          <strong>Cookies esensial</strong> — diperlukan untuk
                          fungsi dasar situs, seperti menyimpan preferensi tema
                          (terang/gelap) dan sesi.
                        </li>
                        <li>
                          <strong>Cookies analitik</strong> — membantu kami
                          memahami bagaimana pengunjung berinteraksi dengan situs
                          (anonim dan agregat).
                        </li>
                        <li>
                          <strong>Cookies preferensi</strong> — mengingat pilihan
                          Anda seperti bahasa atau preferensi tampilan.
                        </li>
                        <li>
                          <strong>Cookies pihak ketiga</strong> — digunakan oleh
                          layanan seperti Google Analytics atau widget media
                          sosial, yang mungkin memiliki kebijakan privasi
                          tersendiri.
                        </li>
                      </ul>
                      <h3>4.2 Mengelola Cookies</h3>
                      <p>
                        Anda dapat mengelola atau menonaktifkan cookies kapan saja
                        melalui pengaturan browser Anda. Namun, perlu diperhatikan
                        bahwa menonaktifkan cookies tertentu dapat memengaruhi
                        fungsi dan pengalaman penggunaan situs. Saat pertama kali
                        mengunjungi situs, kami menampilkan pemberitahuan consent
                        cookies yang memungkinkan Anda menerima atau menolak
                        cookies non-esensial.
                      </p>
                    </section>

                    {/* Berbagi Informasi dengan Pihak Ketiga */}
                    <section id="berbagi" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Share2 className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">5. Berbagi Informasi dengan Pihak Ketiga</h2>
                      </div>
                      <p>
                        Kami tidak menjual, memperdagangkan, atau menyewakan data
                        pribadi Anda kepada pihak ketiga. Kami hanya membagikan
                        informasi Anda dalam kondisi terbatas berikut:
                      </p>
                      <ul>
                        <li>
                          <strong>Penyedia layanan tepercaya</strong> — pihak
                          ketiga yang membantu operasi situs (misalnya layanan
                          email, hosting, analitik), yang terikat oleh kewajiban
                          kerahasiaan.
                        </li>
                        <li>
                          <strong>Kepatuhan hukum</strong> — jika diwajibkan oleh
                          hukum, putusan pengadilan, atau permintaan resmi dari
                          otoritas yang berwenang.
                        </li>
                        <li>
                          <strong>Persetujuan Anda</strong> — ketika Anda secara
                          eksplisit memberikan izin untuk berbagi informasi
                          tertentu.
                        </li>
                        <li>
                          <strong>Transisi bisnis</strong> — dalam hal merger,
                          akuisisi, atau penjualan aset, informasi dapat
                          ditransfer sebagai bagian dari transaksi tersebut.
                        </li>
                      </ul>
                      <p>
                        Setiap pihak ketiga yang menerima data Anda diwajibkan
                        untuk memprosesnya sesuai dengan hukum yang berlaku dan
                        kebijakan privasi mereka sendiri.
                      </p>
                    </section>

                    {/* Keamanan Data */}
                    <section id="keamanan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Lock className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">6. Keamanan Data</h2>
                      </div>
                      <p>
                        Kami menerapkan langkah-langkah keamanan teknis dan
                        organisasi yang wajar untuk melindungi data pribadi Anda
                        dari akses tidak sah, pengungkapan, perubahan, atau
                        penghancuran. Langkah-langkah ini meliputi:
                      </p>
                      <ul>
                        <li>Enkripsi data saat transmisi melalui HTTPS/TLS</li>
                        <li>Penyimpanan password dengan algoritma hashing yang aman</li>
                        <li>Pembatasan akses internal berbasis peran (RBAC)</li>
                        <li>Pemantauan aktivitas dan pencatatan log keamanan</li>
                        <li>Pencadangan data berkala dan rencana pemulihan bencana</li>
                        <li>Audit keamanan dan pembaruan sistem secara berkala</li>
                      </ul>
                      <p>
                        Meskipun demikian, tidak ada metode transmisi melalui
                        internet atau penyimpanan elektronik yang 100% aman. Kami
                        tidak dapat menjamin keamanan absolut, namun kami
                        berkomitmen untuk terus meningkatkan praktik keamanan
                        kami.
                      </p>
                      <p>
                        Dalam hal terjadi pelanggaran data yang signifikan, kami
                        akan memberitahukan Anda dan otoritas yang berwenang sesuai
                        dengan kewajiban hukum yang berlaku.
                      </p>
                    </section>

                    {/* Hak Anda */}
                    <section id="hak-anda" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <ShieldCheck className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">7. Hak Anda</h2>
                      </div>
                      <p>
                        Sesuai dengan peraturan pelindungan data pribadi yang
                        berlaku, Anda memiliki sejumlah hak terkait data pribadi
                        Anda. Hak-hak tersebut antara lain:
                      </p>
                      <ul>
                        <li>
                          <strong>Hak akses</strong> — meminta salinan data
                          pribadi yang kami simpan tentang Anda.
                        </li>
                        <li>
                          <strong>Hak koreksi</strong> — meminta perbaikan data
                          yang tidak akurat atau tidak lengkap.
                        </li>
                        <li>
                          <strong>Hak penghapusan</strong> — meminta penghapusan
                          data pribadi Anda (&ldquo;right to be forgotten&rdquo;),
                          kecuali jika kami diwajibkan menyimpannya oleh hukum.
                        </li>
                        <li>
                          <strong>Hak pembatasan pemrosesan</strong> — meminta
                          kami membatasi pemrosesan data dalam kondisi tertentu.
                        </li>
                        <li>
                          <strong>Hak portabilitas data</strong> — menerima
                          salinan data Anda dalam format yang terstruktur dan
                          dapat dibaca mesin.
                        </li>
                        <li>
                          <strong>Hak menarik persetujuan</strong> — menarik
                          consent yang sebelumnya Anda berikan kapan saja (misalnya
                          untuk newsletter atau cookies non-esensial).
                        </li>
                        <li>
                          <strong>Hak keberatan</strong> — menolak pemrosesan
                          data Anda untuk tujuan pemasaran atau tertentu.
                        </li>
                      </ul>
                      <p>
                        Untuk menggunakan hak-hak ini, silakan hubungi kami
                        melalui informasi kontak di bagian akhir kebijakan ini.
                        Kami akan merespons permintaan Anda dalam waktu maksimal
                        30 hari kerja.
                      </p>
                    </section>

                    {/* Perubahan Kebijakan */}
                    <section id="perubahan" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <RefreshCw className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">8. Perubahan Kebijakan</h2>
                      </div>
                      <p>
                        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke
                        waktu untuk mencerminkan perubahan praktik bisnis, hukum,
                        atau operasional. Setiap perubahan akan dipublikasikan di
                        halaman ini dengan tanggal &ldquo;Terakhir diperbarui&rdquo;
                        yang diperbarui sesuai.
                      </p>
                      <p>
                        Kami menganjurkan Anda untuk meninjau kebijakan ini secara
                        berkala. Untuk perubahan material yang memengaruhi hak
                        Anda, kami akan memberikan pemberitahuan yang lebih
                        menonjol — misalnya melalui banner di situs atau email
                        notifikasi (jika Anda telah berlangganan).
                      </p>
                      <p>
                        Penggunaan situs secara berkelanjutan setelah perubahan
                        dipublikasikan dianggap sebagai persetujuan Anda terhadap
                        kebijakan yang diperbarui.
                      </p>
                    </section>

                    {/* Kontak */}
                    <section id="kontak" className="scroll-mt-24">
                      <div className="mb-4 flex items-center gap-2">
                        <Mail className="size-5 text-primary" />
                        <h2 className="!mt-0 !mb-0">9. Kontak</h2>
                      </div>
                      <p>
                        Jika Anda memiliki pertanyaan, kekhawatiran, atau
                        permintaan terkait Kebijakan Privasi ini atau pemrosesan
                        data pribadi Anda, jangan ragu untuk menghubungi kami:
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
                        Kami berkomitmen untuk menanggapi pertanyaan Anda dalam
                        waktu 1×24 jam pada hari kerja.
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
                        Syarat &amp; Ketentuan layanan
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="glass">
                    <Link href="/terms">
                      Syarat &amp; Ketentuan
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
