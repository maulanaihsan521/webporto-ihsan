/**
 * Upload 3 sertifikat baru ke Supabase Storage (konversi WebP, pipeline sama
 * dengan src/lib/image-convert.ts: quality 82, max 2560px, EXIF auto-rotate)
 * lalu insert record Certificate ke database.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// --- load .env manual (pattern scripts repo) ---
const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
process.env.DATABASE_URL = env.DATABASE_URL;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = env.SUPABASE_STORAGE_BUCKET || "media";

async function uploadToSupabase(key, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "image/webp",
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`Upload gagal (${res.status}): ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

async function convertToWebp(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(2560, 2560, { withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

const SRC = path.join(__dirname, "..", "download", "cert-source");

const CERTS = [
  {
    file: "raw-1LCtlr28rhg6Xi1-v4gdmNX4Ryimc_ixc.bin",
    key: "uploads/1790567617536_sertifikat-ukk-pengolahan-audio-video.webp",
    data: {
      title: "Uji Kompetensi Keahlian (UKK) — Pengolahan Audio Video",
      slug: "uji-kompetensi-keahlian-pengolahan-audio-video",
      description:
        'Sertifikat Uji Kompetensi Keahlian (UKK) bidang Multimedia dengan judul penugasan "Pengolahan Audio Video", diterbitkan oleh PT Bonet Utama (BONET IT Solution Partner). Dalam ujian praktik ini saya merancang dan memproduksi karya audio-video secara utuh — mulai dari perencanaan konsep, produksi, hingga editing dan penyelesaian akhir — dan berhasil meraih predikat "Sangat Kompeten". Sertifikasi ini menjadi fondasi keahlian saya di bidang videografi dan editing yang terus saya asah sampai sekarang.',
      issuer: "PT Bonet Utama — BONET IT Solution Partner",
      issueDate: "2023-05-15T00:00:00.000Z",
      expiryDate: null,
      credentialId: "0345/A/CRT-BNT/UKK/V/2023",
      credentialUrl: "https://drive.google.com/file/d/1LCtlr28rhg6Xi1-v4gdmNX4Ryimc_ixc/view?usp=sharing",
      fileUrl: "https://drive.google.com/uc?export=download&id=1LCtlr28rhg6Xi1-v4gdmNX4Ryimc_ixc",
      featured: true,
      categorySlug: "cert-video-editing",
    },
  },
  {
    file: "raw-1KeppsS-e-FmDNhUlvo3BrLQNygwAF3Ri.bin",
    key: "uploads/1790567617537_sertifikat-pkl-malibu-62-studio.webp",
    data: {
      title: "Praktik Kerja Lapangan (PKL) — Teknik Komputer & Informatika",
      slug: "praktik-kerja-lapangan-teknik-komputer-informatika",
      description:
        "Sertifikat Praktik Kerja Lapangan Tahun Pelajaran 2022/2023 di IDUKA Malibu 62 Studio, studio fotografi dan videografi di Cirebon. Selama kurang lebih tiga bulan (4 Juli – 30 September 2022) saya terlibat langsung dalam produksi foto dan video klien: persiapan peralatan, sesi pemotretan dan perekaman, hingga editing dan penyerahan hasil akhir. Pengalaman industri ini menjadi fondasi praktik nyata saya di bidang produksi konten visual.",
      issuer: "Malibu 62 Studio",
      issueDate: "2022-09-30T00:00:00.000Z",
      expiryDate: null,
      credentialId: "202110109",
      credentialUrl: "https://drive.google.com/file/d/1KeppsS-e-FmDNhUlvo3BrLQNygwAF3Ri/view?usp=sharing",
      fileUrl: "https://drive.google.com/uc?export=download&id=1KeppsS-e-FmDNhUlvo3BrLQNygwAF3Ri",
      featured: false,
      categorySlug: "cert-photography",
    },
  },
  {
    file: "raw-1gZS_axWozcOXViRv9FHsiwMVZwUCaGpe.bin",
    key: "uploads/1790567617538_sertifikat-magang-bikin-kreatif-corp.webp",
    data: {
      title: "Program Magang — Digital Marketing",
      slug: "program-magang-digital-marketing",
      description:
        "Sertifikat kelulusan Program Praktik Kerja Lapangan (Magang) di divisi Digital Marketing PT. Bikin Kreatif Corp, sebuah creative digital agency, untuk periode 19 Januari – 20 Maret 2026. Selama magang saya mengerjakan kampanye konten media sosial, riset pasar, dan karya kreatif untuk klien, yang kemudian berlanjut menjadi pengalaman kerja sebagai Social Media Specialist & Content Creator di perusahaan yang sama. Sertifikat ini menjadi apresiasi atas dedikasi, disiplin, dan etos kerja selama program berlangsung.",
      issuer: "PT. Bikin Kreatif Corp",
      issueDate: "2026-03-20T00:00:00.000Z",
      expiryDate: null,
      credentialId: null,
      credentialUrl: "https://drive.google.com/file/d/1gZS_axWozcOXViRv9FHsiwMVZwUCaGpe/view?usp=sharing",
      fileUrl: "https://drive.google.com/uc?export=download&id=1gZS_axWozcOXViRv9FHsiwMVZwUCaGpe",
      featured: false,
      categorySlug: "cert-digital-marketing",
    },
  },
];

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const results = [];
    for (const cert of CERTS) {
      const inputPath = path.join(SRC, cert.file);
      const { categorySlug, ...data } = cert.data;
      console.log(`\n--- ${data.slug} ---`);

      // 1) convert webp
      const { buffer, width, height } = await convertToWebp(inputPath);
      console.log(`WebP: ${width}x${height}, ${(buffer.length / 1024).toFixed(0)} KB`);

      // 2) upload (key deterministik + x-upsert → idempotent, re-run aman)
      const publicUrl = await uploadToSupabase(cert.key, buffer);
      console.log(`Uploaded: ${publicUrl}`);

      // 3) resolve category
      const category = categorySlug
        ? await prisma.category.findUnique({ where: { slug: categorySlug } })
        : null;
      if (categorySlug && !category) throw new Error(`Kategori ${categorySlug} tidak ditemukan!`);

      // 4) upsert certificate (imageUrl = hasil upload)
      const record = await prisma.certificate.upsert({
        where: { slug: data.slug },
        update: { ...data, imageUrl: publicUrl, categoryId: category?.id ?? null },
        create: { ...data, imageUrl: publicUrl, categoryId: category?.id ?? null },
      });
      console.log(`DB OK: ${record.title} (id=${record.id}, category=${category?.name ?? "-"})`);
      results.push({ title: record.title, url: publicUrl, id: record.id });
    }

    console.log("\n=== RINGKASAN ===");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
