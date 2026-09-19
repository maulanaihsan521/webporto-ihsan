/**
 * Seed Blog Post — Tambah 1 artikel non-featured agar CTA circle di /blog terlihat
 * (Sebelumnya hanya 1 post yang juga featured → di-skip dari grid oleh blog-explorer.tsx:154)
 *
 * Run: node scripts/seed-blog-post.js
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // 1. Cari user admin sebagai author
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
  });
  if (!admin) {
    console.error("ERROR: Tidak ada user ADMIN. Jalankan seed admin dulu.");
    process.exit(1);
  }
  console.log(`Author: ${admin.email} (${admin.id})`);

  // 2. Cari atau buat category BLOG
  let category = await db.category.findFirst({
    where: { type: "BLOG" },
    select: { id: true, name: true, slug: true },
  });
  if (!category) {
    category = await db.category.create({
      data: {
        name: "Insight",
        slug: "insight",
        type: "BLOG",
        description: "Insight seputar digital marketing & production",
      },
    });
    console.log(`Category baru dibuat: ${category.name} (${category.id})`);
  } else {
    console.log(`Category dipakai: ${category.name} (${category.id})`);
  }

  // 3. Cek apakah post sudah ada (slug unik)
  const slug = "5-tips-meningkatkan-engagement-instagram-reels-2026";
  const existing = await db.post.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    console.log(`Post dengan slug "${slug}" sudah ada. Skip.`);
    process.exit(0);
  }

  // 4. Buat post NON-FEATURED, published, dengan readingTime 5
  const post = await db.post.create({
    data: {
      title: "5 Tips Meningkatkan Engagement Instagram Reels di 2026",
      slug,
      excerpt:
        "Instagram Reels tetap menjadi format paling efektif untuk menjangkau audiens baru di 2026. Berikut 5 strategi praktis berbasis data yang terbukti meningkatkan engagement.",
      content: `## Mengapa Reels Masih Relevan di 2026

Instagram Reels tetap menjadi **format konten paling efektif** untuk menjangkau audiens baru di 2026. Berdasarkan data terbaru, akun yang konsisten memposting Reels 3-5 kali per minggu mengalami pertumbuhan pengikut 2.4x lebih cepat dibandingkan akun yang hanya memposting feed post biasa.

### Algoritma Reels 2026

Algoritma Instagram Reels 2026 kini lebih memperhatikan:
- **Watch time** (durasi tonton) — minimal 70% dari total durasi video
- **Re-share rate** — seberapa sering video di-share ke story atau DM
- **Save rate** — seberapa sering audiens menyimpan video
- **Comment depth** — bukan hanya jumlah komentar, tapi panjang dan kualitas komentar

## 5 Strategi Praktis

### 1. Hook dalam 3 Detik Pertama

Attention span audiens Instagram sangat pendek. **3 detik pertama** menentukan apakah video akan ditonton sampai akhir atau di-scroll lewat. Gunakan teknik visual menarik: zoom cepat, transisi cut, atau pertanyaan provokatif.

Contoh hook efektif:
- "Stop scroll dulu kalau kamu mau naik 10k follower bulan ini..."
- "Coba tebak, video ini dibuat pakai iPhone atau kamera $5000?"
- "Saya salah selama 2 tahun soal editing Reels..."

### 2. Gunakan Audio Trending (Tapi Tidak Terlalu Lama)

Audio trending dapat memberi **boost reach 30-50%**, tetapi setelah 7-10 hari, algoritma akan menurunkan reach audio tersebut. Save audio trending favorit di awal minggu, dan publish Reels menggunakan audio tersebut dalam 2-3 hari.

### 3. Struktur Video: 3 Bagian Penting

Struktur Reels yang efektif:
1. **Hook (0-3 detik)**: janji/value yang akan didapat
2. **Body (3-20 detik)**: konten utama, edit cepat (cut setiap 2-3 detik)
3. **CTA (20-30 detik)**: ajakan follow, save, atau share

### 4. Posting di Jam Emas

Berdasarkan data engagement 2026:
- **Senin-Jumat 11:30-13:00** (lunch break)
- **Senin-Jumat 19:00-21:00** (after work)
- **Sabtu-Minggu 10:00-12:00** (weekend morning)

Hindari post di jam 00:00-06:00 kecuali audiens mayoritas shift worker atau international.

### 5. Reply Setiap Komentar dalam 1 Jam Pertama

Komentar yang dibalas dalam **1 jam pertama** mendapat 3x lebih banyak interaksi lanjutan dibanding yang dibalas setelah 24 jam. Ini sinyal kuat ke algoritma bahwa konten memancing diskusi.

## Penutup

Reels bukan tentang viral semata — tapi tentang konsistensi dan kualitas. Terapkan 5 strategi ini selama 30 hari, lalu ukur. Anda akan melihat pertumbuhan organik yang stabil, bukan spike sesaat yang hilang besoknya.

> Butuh bantuan strategi konten untuk brand Anda? Hubungi saya via halaman kontak untuk konsultasi gratis 30 menit.`,
      published: true,
      featured: false, // NON-FEATURED — supaya muncul di grid blog
      publishedAt: new Date(),
      readingTime: 5,
      authorId: admin.id,
      categoryId: category.id,
      metaTitle: "5 Tips Meningkatkan Engagement Instagram Reels di 2026",
      metaDescription:
        "Instagram Reels tetap paling efektif menjangkau audiens baru di 2026. 5 strategi praktis berbasis data untuk naik engagement.",
      metaKeywords: "instagram reels, engagement, social media marketing, content strategy",
    },
  });

  console.log(`\n✅ Post created: ${post.title}`);
  console.log(`   Slug: ${post.slug}`);
  console.log(`   Featured: ${post.featured}`);
  console.log(`   Published: ${post.published}`);
  console.log(`   Reading time: ${post.readingTime} min`);

  // 5. Summary: hitung total posts
  const totalPosts = await db.post.count({ where: { published: true } });
  const featuredPosts = await db.post.count({ where: { published: true, featured: true } });
  const nonFeaturedPosts = await db.post.count({ where: { published: true, featured: false } });
  console.log(`\n📊 Total published posts: ${totalPosts}`);
  console.log(`   Featured: ${featuredPosts}`);
  console.log(`   Non-featured: ${nonFeaturedPosts}`);
}

main()
  .catch((e) => {
    console.error("FAIL:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
