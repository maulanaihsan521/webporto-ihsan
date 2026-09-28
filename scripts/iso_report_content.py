# -*- coding: utf-8 -*-
"""Konten Laporan Audit ISO/IEC 25010 - 27001 - 23026 (Bahasa Indonesia).

Struktur blok:
  ("h1", "Bab N - Judul")          -> heading bab (level 0, TOC + bookmark)
  ("h2", "N.M Judul")              -> sub-bab (level 1)
  ("body", "paragraf")             -> paragraf body (justified)
  ("bullets", [..])                -> daftar butir
  ("callouts", [(stat, label), ..])-> baris kartu statistik
  ("table", dict)                  -> tabel (headers, rows, ratios, title)
"""

# ============ BAB 1 ============
CH1 = [
    ("h1", "Bab 1 - Ringkasan Eksekutif"),
    ("body",
     "Laporan ini menyajikan hasil audit keamanan dan evaluasi kepatuhan terhadap tiga standar "
     "internasional atas website portofolio pribadi portofoliomaulanaihsan.my.id milik Maulana Ihsan "
     "Rohim. Audit dilakukan secara menyeluruh dan mencakup kode aplikasi, dependensi pihak ketiga, "
     "repositori GitHub, riwayat commit, serta infrastruktur produksi yang terdiri dari Vercel sebagai "
     "platform deployment dan Supabase sebagai layanan basis data serta penyimpanan objek. Tujuan utama "
     "audit adalah memastikan bahwa website tidak memiliki celah keamanan yang dapat dieksploitasi "
     "penyerang, sekaligus memetakan tingkat kesesuaian terhadap standar ISO/IEC 25010, ISO/IEC 27001, "
     "dan ISO/IEC/IEEE 23026 secara transparan dan dapat diverifikasi."),
    ("callouts", [
        ("7 menjadi 0", "Kerentanan dependensi setelah remediasi"),
        ("63 / 63", "Route lolos build produksi"),
        ("4 fitur", "Hardening keamanan GitHub diaktifkan"),
        ("0 kebocoran", "Secret pada seluruh riwayat git"),
    ]),
    ("body",
     "Hasil audit menemukan tujuh kerentanan pada dependensi pihak ketiga, termasuk satu temuan kritis "
     "berupa kerentanan Remote Code Execution (RCE) tanpa autentikasi pada framework Next.js versi "
     "16.3.1. Seluruh kerentanan tersebut telah diperbaiki melalui dua commit remediasi (40b2679 dan "
     "bd76d0b) yang menaikkan versi Next.js ke 16.3.6, memperbarui @mdxeditor/editor ke 4.3.0, "
     "memberikan override deepmerge-ts 8.0.2, serta menaikkan baseline-browser-mapping dan browserslist "
     "ke versi yang telah diperbaiki. Hasil akhir pemindaian dependensi menyatakan nol kerentanan pada "
     "seluruh dependensi produksi maupun dependensi pengembangan, dan seluruh perbaikan telah "
     "terkonfirmasi aktif pada situs produksi melalui verifikasi langsung terhadap versi framework yang "
     "berjalan."),
    ("body",
     "Secara keseluruhan, website berada pada tingkat kepatuhan yang baik terhadap ketiga standar acuan. "
     "Pada ISO/IEC 25010, seluruh sub-karakteristik keamanan yang diuji dinyatakan lulus dengan bukti "
     "verifikasi nyata, dengan satu catatan minor pada aspek kontras warna mode terang yang merupakan "
     "keputusan estetika pemilik. Pada ISO/IEC 27001, kontrol teknis Annex A yang relevan telah "
     "terimplementasi dan terverifikasi, termasuk manajemen kerentanan berjalan otomatis melalui "
     "Dependabot. Pada ISO/IEC/IEEE 23026, praktik rekayasa web yang diterapkan mencerminkan kematangan "
     "teknis yang memadai, mulai dari header keamanan lengkap hingga pengelolaan sesi yang tervalidasi "
     "ulang terhadap basis data."),
]

# ============ BAB 2 ============
CH2 = [
    ("h1", "Bab 2 - Ruang Lingkup, Objek Audit, dan Metodologi"),
    ("h2", "2.1 Objek dan Ruang Lingkup Audit"),
    ("body",
     "Objek utama audit adalah aplikasi website portofolio yang dibangun menggunakan Next.js 16.3.6 "
     "dengan arsitektur App Router dan bahasa TypeScript secara penuh. Lapisan data menggunakan Prisma "
     "ORM 6.19 yang terhubung ke PostgreSQL terkelola Supabase melalui connection pooler, sementara "
     "media gambar tersimpan pada bucket Supabase Storage. Antarmuka memakai Tailwind CSS 4 dan "
     "komponen shadcn/ui, autentikasi admin menggunakan JSON Web Token yang dipersenjatai dengan "
     "pemeriksaan ulang ke basis data, serta halaman pengelolaan berada pada slug yang tidak mudah "
     "ditebak. Aplikasi berjalan di Vercel dengan domain kustom portofoliomaulanaihsan.my.id dan kode "
     "sumbernya dikelola pada repositori publik GitHub maulanaihsan521/webporto-ihsan."),
    ("body",
     "Ruang lingkup audit meliputi lima area pemeriksaan yang saling melengkapi. Pertama, kode sumber "
     "aplikasi pada direktori src ditinjau dengan fokus pada modul autentikasi, middleware keamanan, "
     "sanitasi input, dan konfigurasi header. Kedua, seluruh riwayat commit git dipindai untuk "
     "memastikan tidak ada kredensial yang pernah terekam. Ketiga, lockfile dependensi diaudit "
     "terhadap basis data kerentanan CVE dan GHSA. Keempat, konfigurasi keamanan repositori GitHub "
     "diperiksa melalui API resmi. Kelima, situs produksi diuji secara langsung menggunakan pengujian "
     "black-box untuk memverifikasi bahwa seluruh mekanisme proteksi bekerja seperti yang dirancang."),
    ("h2", "2.2 Standar Acuan"),
    ("body",
     "ISO/IEC 25010 merupakan standar model kualitas produk perangkat lunak dalam keluarga SQuaRE "
     "(Systems and software Quality Requirements and Evaluation). Standar ini mendefinisikan delapan "
     "karakteristik kualitas, dan audit ini menitikberatkan pada karakteristik keamanan beserta "
     "sub-karakteristiknya, yaitu kerahasiaan, integritas, keaslian, dan akuntabilitas, serta "
     "karakteristik keandalan dan kemudahan pemeliharaan yang erat kaitannya dengan kualitas operasional "
     "website. Setiap klaim kepatuhan dalam laporan ini disertai bukti verifikasi konkret agar dapat "
     "ditelusuri ulang."),
    ("body",
     "ISO/IEC 27001 adalah standar internasional untuk sistem manajemen keamanan informasi (ISMS). "
     "Perlu ditegaskan bahwa audit ini merupakan evaluasi kesesuaian teknis terhadap kontrol Annex A "
     "yang relevan bagi sebuah aplikasi web yang dikelola satu orang, bukan proses sertifikasi formal "
     "yang membutuhkan audit pihak ketiga dan sistem dokumentasi manajemen lengkap. Kontrol yang "
     "dievaluasi dipilih berdasarkan relevansinya terhadap risiko nyata aplikasi, mencakup kontrol akses, "
     "manajemen kerentanan teknis, kriptografi, dan pemantauan kejadian keamanan."),
    ("body",
     "ISO/IEC/IEEE 23026 adalah standar rekayasa web yang membahas pengelolaan serta rekayasa sistem "
     "dan aplikasi web sepanjang siklus hidupnya, termasuk aspek keamanan situs, pengelolaan sesi, "
     "penanganan input, dan praktik pengembangan yang aman. Evaluasi pada laporan ini memetakan "
     "implementasi konkret website terhadap prinsip-prinsip rekayasa web yang baik tersebut, dengan "
     "fokus pada konfigurasi header keamanan, arsitektur middleware, dan strategi pengujian yang telah "
     "dilakukan terhadap situs produksi."),
    ("h2", "2.3 Metodologi Audit"),
    ("body",
     "Audit dilakukan menggunakan kombinasi tujuh metode yang saling memvalidasi. Analisis statis "
     "memastikan tipe data dan aturan kode bersih; audit dependensi memeriksa kerentanan pihak ketiga; "
     "pengujian black-box menguji perilaku situs produksi secara langsung; tinjauan kode memverifikasi "
     "implementasi kontrol keamanan; pemindaian riwayat git memastikan tidak ada kebocoran kredensial "
     "historis; peninjauan API GitHub memeriksa konfigurasi keamanan repositori; dan verifikasi build "
     "produksi memastikan seluruh halaman dapat dibangun tanpa galat. Ringkasan metode beserta alat dan "
     "hasilnya disajikan pada tabel berikut."),
    ("table", {
        "title": "Tabel 2.1 - Metode audit, alat, dan hasil ringkas",
        "headers": ["Metode", "Alat", "Hasil Ringkas"],
        "ratios": [0.28, 0.30, 0.42],
        "rows": [
            ["Analisis statis", "tsc --noEmit, eslint", "0 kesalahan tipe, 0 peringatan lint"],
            ["Audit dependensi", "npm audit, GitHub Dependabot", "7 kerentanan ditemukan, remediasi hingga 0"],
            ["Pengujian black-box", "curl, probe HTTP langsung", "Header lengkap, WAF dan CSRF aktif"],
            ["Tinjauan kode", "Pemeriksaan manual modul kritis", "Kontrol auth, WAF, CSRF sesuai rancangan"],
            ["Pemindaian riwayat git", "git grep seluruh blob", "Tidak ada secret yang terekam"],
            ["Peninjauan GitHub API", "REST API v3", "4 fitur keamanan diaktifkan"],
            ["Verifikasi build", "next build (produksi)", "63 dari 63 route berhasil dibangun"],
        ],
    }),
    ("body",
     "Sebagai keterbatasan metodologi, audit ini merupakan evaluasi pada satu titik waktu sehingga "
     "temuan mencerminkan kondisi per 28 September 2026. Mekanisme pembatasan laju permintaan yang "
     "sekarang tersimpan dalam memori proses memiliki sifat reset saat fungsi serverless mengalami "
     "cold start, sehingga efektivitasnya pada skenario lalu lintas tinggi dibahas sebagai rekomendasi "
     "peningkatan pada Bab 7. Meskipun demikian, kombinasi tujuh metode di atas memberikan tingkat "
     "keyakinan yang memadai terhadap kondisi keamanan website saat ini."),
]

# ============ BAB 3 ============
CH3 = [
    ("h1", "Bab 3 - ISO/IEC 25010: Kualitas Produk Perangkat Lunak"),
    ("body",
     "Standar ISO/IEC 25010 mendefinisikan model kualitas produk yang terdiri atas delapan karakteristik "
     "beserta sub-karakteristiknya. Audit ini mengevaluasi karakteristik keamanan sebagai fokus utama, "
     "ditambah keandalan dan kemudahan pemeliharaan sebagai indikator kualitas operasional yang berdampak "
     "langsung pada pengalaman pengguna dan keberlanjutan pengembangan. Setiap sub-karakteristik diuji "
     "melalui bukti teknis yang dapat direproduksi, bukan sekadar pernyataan kesesuaian, sehingga setiap "
     "klaim pada laporan ini dapat diverifikasi ulang oleh pihak mana pun yang berkepentingan."),
    ("h2", "3.1 Kerahasiaan (Confidentiality)"),
    ("body",
     "Aspek kerahasiaan diverifikasi melalui pemindaian menyeluruh terhadap seluruh riwayat commit git "
     "dengan pencocokan pola terhadap nilai kredensial nyata yang digunakan sistem, meliputi token akses "
     "GitHub, secret JWT, service role key Supabase, dan kata sandi basis data. Hasilnya, tidak ada satu "
     "pun nilai kredensial nyata yang pernah terekam pada seluruh blob di semua commit, sementara berkas "
     "lingkungan .env terkonfirmasi berada dalam daftar ignore dan template .env.example hanya memuat "
     "placeholder. Service role key Supabase hanya direferensikan pada kode sisi server dan tidak pernah "
     "diekspos melalui variabel awalan NEXT_PUBLIC. Sesi admin disimpan dalam cookie berbendera httpOnly "
     "sehingga tidak dapat dibaca skrip sisi klien, dengan bendera secure aktif di produksi dan SameSite "
     "lax sebagai keseimbangan antara keamanan dan kompatibilitas."),
    ("h2", "3.2 Integritas (Integrity)"),
    ("body",
     "Integritas kode dan data dijaga melalui berlapis pertahanan. Cabang utama repositori kini "
     "dilindungi pengaturan proteksi yang memblokir force push dan penghapusan cabang, sehingga riwayat "
     "kode tidak dapat ditimpa secara sepihak. Seluruh permintaan yang mengubah state ke jalur API "
     "divalidasi asal-usulnya melalui pemeriksaan Origin dan Referer di middleware, dengan daftar "
     "izinkan eksplisit tanpa wildcard berbahaya. Web Application Firewall sederhana memindai URL dan "
     "body permintaan terhadap pola injeksi SQL, XSS, path traversal, dan injeksi perintah, termasuk "
     "varian payload yang di-encode. Token sesi dipersenjatai dengan algoritma HS256 yang dipatok secara "
     "eksplisit untuk menolak token dengan algoritma lain, dan setiap permintaan terautentikasi "
     "memeriksa ulang status pengguna ke basis data sehingga akun yang dihapus atau diturunkan "
     "perannya langsung kehilangan akses tanpa menunggu token kedaluwarsa."),
    ("h2", "3.3 Keaslian dan Akuntabilitas (Authenticity dan Accountability)"),
    ("body",
     "Mekanisme autentikasi menggunakan hash bcrypt untuk verifikasi kata sandi dengan perbandingan "
     "dummy ketika email tidak terdaftar, sehingga waktu respons tetap seragam dan tidak membocorkan "
     "keberadaan akun melalui analisis waktu. Percobaan masuk dibatasi lima kali per lima belas menit "
     "per alamat IP dan sepuluh kali per jam per email, dilengkapi header Retry-After yang menstandar "
     "respons pembatasan. Setiap peristiwa keamanan yang berarti dicatat dalam log aktivitas basis "
     "data, mencakup masuk berhasil, masuk gagal beserta alasannya, pemblokiran WAF, pembatasan laju, "
     "dan penolakan CSRF. Catatan ini menyediakan jejak audit yang dapat ditelusuri untuk keperluan "
     "pertanggungjawaban dan investigasi insiden."),
    ("h2", "3.4 Keandalan dan Kemudahan Pemeliharaan"),
    ("body",
     "Keandalan diverifikasi melalui build produksi yang membangun seluruh 63 route tanpa galat "
     "termasuk halaman publik, halaman detail, dan panel admin, serta pemeriksaan konsol peramban yang "
     "menunjukkan nol galat pada seluruh halaman yang diuji. Desain fail-closed pada pemeriksaan sesi "
     "memastikan gangguan basis data justru menutup akses alih-alih membukanya. Kemudahan pemeliharaan "
     "ditopang oleh TypeScript ketat dengan nol kesalahan tipe dan ESLint dengan nol peringatan, "
     "disiplin pesan commit konvensional, serta dokumentasi inline pada modul keamanan yang menjelaskan "
     "alasan di balik setiap keputusan teknis. Ringkasan status seluruh sub-karakteristik disajikan pada "
     "tabel berikut."),
    ("table", {
        "title": "Tabel 3.1 - Status sub-karakteristik ISO/IEC 25010 yang diuji",
        "headers": ["Karakteristik", "Bukti Verifikasi", "Status"],
        "ratios": [0.24, 0.58, 0.18],
        "rows": [
            ["Kerahasiaan", "Scan seluruh riwayat git bersih; .env ter-ignore; cookie httpOnly", "Lulus"],
            ["Integritas", "Branch protection aktif; CSRF global terverifikasi 403; WAF 403", "Lulus"],
            ["Keaslian", "bcrypt + anti-enumerasi; rate limit login dua lapis", "Lulus"],
            ["Akuntabilitas", "Audit log seluruh peristiwa auth, WAF, CSRF, rate limit", "Lulus"],
            ["Keandalan", "Build 63/63 route; 0 galat konsol pada halaman uji", "Lulus"],
            ["Kemudahan pemeliharaan", "tsc 0 kesalahan; eslint 0 peringatan; commit konvensional", "Lulus"],
        ],
    }),
    ("body",
     "Sebagai catatan transparansi, satu temuan minor teridentifikasi pada sub-karakteristik "
     "aksesibilitas, yaitu kontras warna aksen emas pada nama pemilik di mode terang berada di bawah "
     "ambang WCAG AA untuk teks besar. Pemilik website secara sadar memilih mempertahankan warna asli "
     "tersebut demi konsistensi identitas visual, dan pilihan ini tidak menimbulkan risiko keamanan "
     "maupun kehilangan fungsi apa pun. Temuan ini dicatat sebagai keputusan desain yang disengaja, "
     "dengan opsi peningkatan yang tersedia pada Bab 7 apabila di kemudian hari dianggap perlu."),
]

# ============ BAB 4 ============
CH4 = [
    ("h1", "Bab 4 - ISO/IEC 27001: Manajemen Keamanan Informasi"),
    ("body",
     "ISO/IEC 27001 menetapkan persyaratan untuk membangun, menerapkan, dan meningkatkan sistem "
     "manajemen keamanan informasi secara berkelanjutan. Konteks penerapan pada audit ini adalah sebuah "
     "website portofolio yang dikembangkan dan dioperasikan oleh satu orang pemilik, sehingga evaluasi "
     "difokuskan pada kesesuaian teknis kontrol Annex A yang paling relevan terhadap profil risiko "
     "aplikasi tersebut. Pendekatan ini lazim digunakan sebagai langkah awal menuju tata kelola "
     "keamanan yang lebih formal, dan hasilnya tetap memberikan gambaran yang jujur mengenai posisi "
     "keamanan website terhadap praktik yang diharapkan standar."),
    ("h2", "4.1 Pemetaan Kontrol Annex A"),
    ("body",
     "Delapan kontrol Annex A dipilih berdasarkan relevansi langsung terhadap arsitektur dan risiko "
     "aplikasi. Setiap kontrol dipetakan terhadap implementasi konkret pada website beserta status "
     "verifikasinya, sehingga kesesuaian tidak dinyatakan secara abstrak melainkan dapat ditelusuri "
     "ke mekanisme teknis yang benar-benar berjalan. Hasil pemetaan disajikan pada tabel berikut."),
    ("table", {
        "title": "Tabel 4.1 - Pemetaan kontrol Annex A ISO/IEC 27001",
        "headers": ["Kontrol", "Implementasi pada Website", "Status"],
        "ratios": [0.24, 0.58, 0.18],
        "rows": [
            ["A.5.15 Kontrol akses",
             "Halaman admin dipagari guard peran ADMIN; pengguna non-admin diarahkan ke halaman masuk", "Terpenuhi"],
            ["A.5.17 Informasi autentikasi",
             "JWT HS256 kedaluwarsa 2 jam dengan pemeriksaan ulang basis data; cookie berbendera lengkap", "Terpenuhi"],
            ["A.5.24 Pengelolaan kredensial",
             "Kredensial hanya di environment; rekomendasi rotasi berkala di Bab 7", "Terpenuhi*"],
            ["A.8.8 Manajemen kerentanan",
             "7 CVE dipatch dalam satu siklus; Dependabot aktif dengan perbaikan otomatis", "Terpenuhi"],
            ["A.8.9 Konfigurasi aman",
             "Hardening header, CORS allowlist, admin slug ter-obscure, X-Powered-By dimatikan", "Terpenuhi"],
            ["A.8.16 Pemantauan",
             "Audit log seluruh peristiwa keamanan tersimpan di basis data", "Terpenuhi"],
            ["A.8.24 Kriptografi",
             "bcrypt untuk kata sandi; HTTPS dipaksa; HSTS preload dua tahun", "Terpenuhi"],
            ["A.8.25 Siklus hidup aman",
             "Tinjauan keamanan pada setiap iterasi perubahan sebelum push", "Terpenuhi"],
        ],
    }),
    ("body",
     "Satu kontrol ditandai Terpenuhi dengan catatan, yaitu pengelolaan kredensial. Kredensial saat ini "
     "sudah terkelola dengan benar karena hanya berada di environment variable yang tidak masuk "
     "repositori, namun praktik terbaik menyarankan rotasi berkala terutama karena sebagian kredensial "
     "pernah melalui kanal komunikasi pribadi selama proses pengembangan. Rekomendasi rotasi kata sandi "
     "basis data Supabase dan pembuatan token akses GitHub berbutir halus dengan masa berlaku tercantum "
     "sebagai prioritas tinggi pada Bab 7."),
    ("h2", "4.2 Hardening Repositori GitHub"),
    ("body",
     "Empat fitur keamanan tingkat repositori diaktifkan sebagai bagian dari remediasi audit. Proteksi "
     "cabang memblokir force push dan penghapusan cabang utama sehingga riwayat kode tidak dapat "
     "ditimpa. Dependabot vulnerability alerts beserta automated security fixes memindai lockfile secara "
     "berkala dan menawarkan permintaan tarik perbaikan otomatis ketika kerentanan baru ditemukan pada "
     "dependensi. Secret scanning dengan push protection aktif menolak push yang mengandung pola "
     "kredensial yang dikenali sebelum sempat terekam publik. Sebagai pelengkap, seluruh commit "
     "atributnya kini menggunakan alamat surel noreply GitHub sehingga identitas kontributor tetap "
     "terverifikasi tanpa membocorkan alamat surel pribadi."),
    ("h2", "4.3 Manajemen Kerentanan Berkelanjutan"),
    ("body",
     "Proses manajemen kerentanan kini berjalan dua lapis. Lapis pertama adalah audit manual yang "
     "dilakukan pada setiap iterasi perubahan signifikan, meliputi pemindaian dependensi, tinjauan kode "
     "keamanan, dan verifikasi build sebelum perubahan didorong. Lapis kedua adalah pemantauan otomatis "
     "Dependabot yang bekerja tanpa bergantung pada jadwal manual dan telah terbukti berfungsi ketika "
     "penambalan browserslist pada commit bd76d0b langsung terdeteksi dan ditutup oleh sistem dalam "
     "hitungan menit. Kombinasi keduanya memastikan jeda antara ditemukannya kerentanan dan "
     "diterapkannya perbaikan tetap pendek, yang merupakan indikator utama kematangan kontrol A.8.8."),
]

# ============ BAB 5 ============
CH5 = [
    ("h1", "Bab 5 - ISO/IEC/IEEE 23026: Rekayasa Web"),
    ("body",
     "Standar ISO/IEC/IEEE 23026 membahas rekayasa sistem dan aplikasi web secara menyeluruh, dan bagian "
     "yang paling dapat diukur pada audit ini adalah praktik keamanan situs serta kualitas teknik "
     "pengembangannya. Evaluasi difokuskan pada tiga area utama: konfigurasi header keamanan respons "
     "yang menjadi garis pertahanan pertama di tingkat protokol, rekayasa pengelolaan sesi dan "
     "penanganan input di tingkat aplikasi, serta hasil pengujian langsung terhadap situs produksi "
     "untuk memastikan bahwa seluruh rancangan tersebut benar-benar berfungsi."),
    ("h2", "5.1 Header Keamanan Situs"),
    ("body",
     "Sembilan header keamanan terpasang pada seluruh respons halaman dan telah diverifikasi aktif pada "
     "situs produksi melalui inspeksi langsung. Content-Security-Policy membatasi sumber skrip, gaya, "
     "gambar, koneksi, dan frame ke daftar izinkan yang ketat tanpa unsafe-eval di produksi, sementara "
     "frame-ancestors none mencegah halaman di-embed situs lain. Header transportasi dan bingkai "
     "melengkapi pertahanan tersebut sebagaimana dirinci pada tabel berikut."),
    ("table", {
        "title": "Tabel 5.1 - Header keamanan terverifikasi pada produksi",
        "headers": ["Header", "Nilai Ringkas", "Fungsi"],
        "ratios": [0.28, 0.34, 0.38],
        "rows": [
            ["Content-Security-Policy", "default-src self; frame-ancestors none", "Mitigasi XSS dan clickjacking"],
            ["Strict-Transport-Security", "max-age 2 tahun; includeSubDomains; preload", "Paksa HTTPS jangka panjang"],
            ["X-Frame-Options", "DENY", "Cegah framing lintas situs"],
            ["X-Content-Type-Options", "nosniff", "Cegah MIME sniffing"],
            ["Referrer-Policy", "strict-origin-when-cross-origin", "Batasi kebocoran referrer"],
            ["Permissions-Policy", "kamera, mikrofon, geolokasi dinonaktifkan", "Batas API peramban sensitif"],
            ["Cross-Origin-Opener-Policy", "same-origin", "Isolasi konteks jendela"],
            ["Cross-Origin-Resource-Policy", "same-origin", "Batasi pembacaan lintas asal"],
            ["X-Powered-By", "tidak ada (dinonaktifkan)", "Sembunyikan jejak framework"],
        ],
    }),
    ("h2", "5.2 Rekayasa Sesi dan Penanganan Input"),
    ("body",
     "Pengelolaan sesi admin dirancang dengan prinsip validasi berkelanjutan. Cookie sesi berusia maksimal "
     "dua jam, tidak dapat dibaca skrip, hanya dikirim melalui koneksi aman di produksi, dan setiap "
     "permintaan memvalidasi ulang status akun ke basis data sehingga pencabutan akses berlaku seketika. "
     "Penanganan input menerapkan sanitasi berlapis: input bebas dibersihkan dari tag HTML, protokol "
     "javascript, dan event handler; konten artikel yang dirender sebagai HTML melewati sanitizer "
     "allowlist; dan data terstruktur JSON-LD di-escape terhadap karakter pembuka serta penutup tag "
     "beserta pemisah baris Unicode. Area admin juga sengaja dipindahkan ke slug yang tidak mudah "
     "ditebak, jalur legacy /admin dijawab 404, dan seluruh halaman admin diberi header noindex agar "
     "tidak terindeks mesin pencari."),
    ("h2", "5.3 Hasil Pengujian Situs Produksi"),
    ("body",
     "Pengujian black-box dilakukan langsung terhadap domain produksi untuk memverifikasi bahwa "
     "pertahanan yang dirancang benar-benar aktif di lapangan. Empat skenario serangan umum diuji dan "
     "seluruhnya ditolak sesuai harapan, sebagaimana dirangkum pada tabel berikut."),
    ("table", {
        "title": "Tabel 5.2 - Hasil uji black-box pada portofoliomaulanaihsan.my.id",
        "headers": ["Skenario Uji", "Respons Diharapkan", "Hasil"],
        "ratios": [0.44, 0.30, 0.26],
        "rows": [
            ["Akses jalur /admin legacy", "404 Not Found", "Sesuai"],
            ["Payload SQL injection pada query", "403 diblokir WAF", "Sesuai"],
            ["POST API tanpa header Origin", "403 validasi CSRF", "Sesuai"],
            ["Enumerasi framework via X-Powered-By", "Header absen", "Sesuai"],
        ],
    }),
    ("body",
     "Selain keempat skenario tersebut, pemeriksaan lintas halaman memastikan seluruh halaman publik "
     "utama merespons dengan kode 200, memuat data dari basis data produksi dengan benar, dan tidak "
     "mencatat galat pada konsol peramban. Versi framework yang berjalan di produksi turut diverifikasi "
     "melalui penanda versi pada berkas statis untuk memastikan penambalan keamanan yang didorong "
     "benar-benar telah ter-deploy. Kombinasi pengujian ini memberikan keyakinan bahwa praktik rekayasa "
     "web yang dirancang pada tingkat kode juga terwujud pada tingkat operasional."),
]

# ============ BAB 6 ============
CH6 = [
    ("h1", "Bab 6 - Temuan Utama dan Tindakan Remediasi"),
    ("body",
     "Bab ini merangkum seluruh temuan audit beserta tindakan perbaikan yang telah diterapkan dan "
     "status verifikasinya. Tujuh kerentanan dependensi yang ditemukan pada awal audit seluruhnya telah "
     "diperbaiki dan diverifikasi hingga bersih, empat fitur hardening repositori telah aktif, dan "
     "seluruh perbaikan telah terkonfirmasi berjalan pada situs produksi. Setiap temuan disertai "
     "identifikasi advisory resmi agar dapat ditelusuri ke sumber otoritatifnya."),
    ("h2", "6.1 Kerentanan Dependensi yang Diperbaiki"),
    ("table", {
        "title": "Tabel 6.1 - Kerentanan dependensi dan status remediasi",
        "headers": ["Paket", "Advisory GHSA", "Tingkat", "Remediasi", "Status"],
        "ratios": [0.22, 0.26, 0.14, 0.24, 0.14],
        "rows": [
            ["next", "GHSA-p293-qw3h-jr36", "Kritis", "16.3.1 menjadi 16.3.6", "Selesai"],
            ["next", "GHSA-2xp9-vwfh-vxw4", "Kritis", "16.3.1 menjadi 16.3.6", "Selesai"],
            ["js-yaml (via mdxeditor)", "GHSA-2883-xcg3-v3hh", "Tinggi", "mdxeditor 4.3.0", "Selesai"],
            ["deepmerge-ts (via prisma)", "GHSA-ggr8-5vv4-36mx", "Tinggi", "override 8.0.2", "Selesai"],
            ["baseline-browser-mapping", "GHSA-w5vr-8v7q-w6rv", "Sedang", "2.10.44 menjadi 2.11.26", "Selesai"],
            ["browserslist", "GHSA-c83g-rgw3-j3cx", "Tinggi", "4.28.6 menjadi 4.29.1", "Selesai"],
            ["browserslist", "GHSA-73wf-gq98-2v4g", "Tinggi", "4.28.6 menjadi 4.29.1", "Selesai"],
        ],
    }),
    ("body",
     "Dua advisory kritis pada Next.js berkategori Remote Code Execution tanpa autentikasi dan menjadi "
     "temuan dengan dampak terbesar dalam audit ini, karena berpotensi memberikan kendali penuh server "
     "kepada penyerang bila dibiarkan. Penambalan dilakukan dengan menaikkan versi framework ke 16.3.6 "
     "yang memuat perbaikan resmi dari vendor, kemudian dipastikan tidak menimbulkan regresi melalui "
     "typecheck, lint, build penuh, dan pengujian halaman. Sisa kerentanan berantai pada paket editor "
     "dan tooling build diselesaikan pada iterasi lanjutan hingga pemindaian dependensi penuh, "
     "termasuk dependensi pengembangan, melaporkan nol kerentanan."),
    ("h2", "6.2 Remediasi Konfigurasi Repositori"),
    ("table", {
        "title": "Tabel 6.2 - Hardening repositori GitHub",
        "headers": ["Tindakan", "Dampak Keamanan", "Status"],
        "ratios": [0.30, 0.52, 0.18],
        "rows": [
            ["Proteksi cabang utama", "Force push dan penghapusan cabang diblokir", "Aktif"],
            ["Dependabot alerts", "Deteksi kerentanan dependensi otomatis", "Aktif"],
            ["Automated security fixes", "Usulan patch otomatis untuk CVE baru", "Aktif"],
            ["Secret scanning + push protection", "Push berisi kredensial ditolak sebelum terekam", "Aktif"],
        ],
    }),
    ("h2", "6.3 Verifikasi Pasca-Deploy"),
    ("body",
     "Seluruh perbaikan diverifikasi berjalan di produksi melalui empat penanda yang saling menegaskan. "
     "Pertama, penanda versi framework pada berkas statis situs live mengonfirmasi Next.js 16.3.6 telah "
     "aktif dan tidak ada lagi jejak 16.3.1. Kedua, tujuh alert Dependabot pada repositori seluruhnya "
     "berstatus tertutup setelah pemindaian ulang otomatis terhadap lockfile baru. Ketiga, pengujian "
     "regresi pada enam halaman utama seluruhnya merespons 200 dengan perilaku keamanan tetap utuh, "
     "yaitu jalur legacy tetap 404, payload injeksi tetap ditolak 403, dan permintaan tanpa Origin tetap "
     "ditolak CSRF. Keempat, pemeriksaan gaya visual memastikan penambalan tidak mengubah tampilan "
     "website yang telah disetujui pemilik."),
    ("h2", "6.4 Temuan Minor Tersisa"),
    ("body",
     "Empat temuan minor teridentifikasi dan diklasifikasikan sebagai rekomendasi peningkatan alih-alih "
     "kegagalan audit. Pertama, penyimpanan rate limit masih berbasis memori proses sehingga berpotensi "
     "reset saat cold start serverless. Kedua, kebijakan CSP masih mengizinkan gambar dari sumber https "
     "mana pun demi fleksibilitas konten, padahal dapat diperketat ke domain tertentu. Ketiga, token "
     "akses GitHub yang digunakan masih bertipe classic dengan cakupan luas, yang terbaik digantikan "
     "token berbutir halus berbatas waktu. Keempat, sejumlah kredensial pernah melalui kanal komunikasi "
     "pribadi selama pengembangan sehingga rotasi berkala merupakan tindakan pencegahan yang "
     "diwajibkan praktik terbaik. Keempat poin ini dibahas dengan rencana aksi pada Bab 7."),
]

# ============ BAB 7 ============
CH7 = [
    ("h1", "Bab 7 - Rekomendasi dan Rencana Tindak Lanjut"),
    ("body",
     "Rekomendasi disusun berdasarkan prioritas risiko dan upaya implementasinya agar pemilik website "
     "dapat menindaklanjuti secara bertahap tanpa mengganggu operasional. Dua rekomendasi berprioritas "
     "tinggi berkaitan dengan pengelolaan kredensial yang menjadi kunci seluruh sistem, sementara "
     "rekomendasi lain menyasar penguatan bertahap yang menaikkan tingkat kematangan keamanan dari "
     "sudut pandang ketiga standar acuan. Estimasi upaya yang tercantum bersifat indikatif untuk "
     "pengerjaan mandiri oleh pemilik."),
    ("table", {
        "title": "Tabel 7.1 - Rekomendasi tindak lanjut berdasarkan prioritas",
        "headers": ["Prioritas", "Tindakan", "Standar Terkait", "Estimasi Upaya"],
        "ratios": [0.14, 0.44, 0.24, 0.18],
        "rows": [
            ["Tinggi", "Rotasi kata sandi basis data Supabase dan penggantian token GitHub dengan fine-grained berbatas waktu", "27001 A.5.24", "1-2 jam"],
            ["Tinggi", "Pertahankan disiplin Dependabot: tinjau alert mingguan dan terapkan patch segera", "27001 A.8.8", "15 mnt/minggu"],
            ["Sedang", "Migrasi rate limit ke penyimpanan persisten seperti Upstash Redis", "25010, 27001", "3-5 jam"],
            ["Sedang", "Perketat CSP img-src ke domain Supabase dan TradingView saja", "23026", "1-2 jam"],
            ["Rendah", "Naikkan kontras aksen emas mode terang untuk WCAG AA apabila estetika mengizinkan", "25010", "1 jam"],
            ["Rendah", "Ulangi audit komprehensif setiap enam bulan atau setelah perubahan besar", "Semua", "3-4 jam"],
        ],
    }),
    ("body",
     "Keseluruhan hasil audit menunjukkan bahwa portofoliomaulanaihsan.my.id telah menerapkan praktik "
     "keamanan yang substansial bagi sebuah aplikasi web dengan skala dan konteksnya. Seluruh kerentanan "
     "yang ditemukan telah ditutup hingga bersih, kontrol teknis yang dipetakan terhadap ketiga standar "
     "berstatus terpenuhi, dan setiap klaim dalam laporan ini didukung bukti yang dapat diverifikasi "
     "ulang. Dengan menjalankan rekomendasi tindak lanjut sesuai prioritas serta mempertahankan disiplin "
     "pemantauan otomatis yang kini telah aktif, website berada pada posisi yang baik untuk terus "
     "beroperasi secara aman dan dapat diandalkan."),
]

BLOCKS = CH1 + CH2 + CH3 + CH4 + CH5 + CH6 + CH7
