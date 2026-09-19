/**
 * Seed Market Articles — Tambah 5 artikel contoh untuk halaman financial-market
 *
 * Categories:
 * - ANALYSIS (untuk tab "Analisis")
 * - TECHNICAL (untuk tab "Analisis")
 * - EDUCATION (untuk tab "Edukasi")
 * - RISK (untuk tab "Edukasi")
 *
 * Run: node scripts/seed-market-articles.js
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const articles = [
  {
    title: "Analisis Teknikal BTC/USDT: Tren Bullish Jangka Pendek",
    slug: "analisis-teknikal-btc-usdt-tren-bullish",
    type: "TECHNICAL",
    instrument: "BINANCE:BTCUSDT",
    excerpt:
      "Bitcoin menunjukkan pola higher high dan higher low di timeframe harian. Indikator RSI berada di zona netral 58, masih ada ruang untuk kenaikan. Resistance utama di $68.500, support di $62.000.",
    content: `## Outlook Teknikal BTC/USDT

Bitcoin (BTC) saat ini berada di fase koreksi setelah rally signifikan minggu lalu. Pada timeframe **Daily (D1)**, price action menunjukkan formasi **higher high** dan **higher low** yang mengindikasikan tren bullish masih intact.

### Level Penting

- **Resistance 1:** $65,000 (resistance psikologis)
- **Resistance 2:** $68,500 (swing high sebelumnya)
- **Support 1:** $62,000 (EMA 50)
- **Support 2:** $58,800 (swing low)

### Indikator

- **RSI (14):** 58 — netral-bullish, masih ada ruang naik sebelum overbought
- **MACD:** Histogram positif, signal line di atas zero
- **Volume:** Menurun 12% dari rata-rata 7 hari (konsolidasi)
- **Bollinger Bands:** Squeeze mulai terbuka, volatilitas akan naik

### Skenario

1. **Bullish:** Break $65,000 dengan volume tinggi → target $68,500
2. **Neutral:** Range trading $62,000-$65,000
3. **Bearish:** Break $62,000 → target $58,800

### Rekomendasi Risk Management

- Risk per trade maksimal 2% dari total modal
- Selalu pasang stop loss
- Gunakan trailing stop setelah profit +3R
- Diversifikasi: jangan semua modal di satu posisi

*Disclaimer: Ini bukan saran investasi. Trading kripto berisiko tinggi.*`,
    featured: true,
    metaTitle: "Analisis Teknikal BTC/USPT — Tren Bullish | Maulana Ihsan",
    metaDescription:
      "Analisis teknikal Bitcoin harian dengan indikator RSI, MACD, dan level support-resistance. Pelajari scenario trading BTC.",
  },
  {
    title: "Outlook IHSG 2026: Sektoral yang Menarik untuk Dipantau",
    slug: "outlook-ihsg-2026-sektoral-menarik",
    type: "ANALYSIS",
    instrument: "INDEX:COMPOSITE",
    excerpt:
      "Indeks Harga Saham Gabungan (IHSG) diproyeksikan bergerak dengan tren positif sepanjang 2026. Sektoral perbankan, energi terbarukan, dan teknologi menjadi sorotan utama.",
    content: `## Outlook IHSG 2026

Bursa Efek Indonesia (BEI) menunjukkan momentum positif di tahun 2026 dengan IHSG mencatat rekor baru. Beberapa faktor pendorong:

### Faktor Fundamental

- **Pertumbuhan Ekonomi:** GDP 2026 diproyeksikan 5.1-5.3%
- **Inflasi terkendali:** 3.2% YoY, di dalam target Bank Indonesia
- **Suku bunga:** BI Rate stabil di 6.00%, mendukung valuasi saham
- **Foreign inflow:** Net buy asing Rp4.2 triliun YTD

### Sektor Menarik

1. **Perbankan (FINA)**
   - NPL turun ke 2.8%
   - LDR stabil di 78%
   - NIM rata-rata 4.8%
   - Rekomendasi: BBCA, BBRI, BMRI

2. **Energi Terbarukan (RENEW)**
   - Target gov 23% EBT mix 2026
   - Projekt capacity 21 GW
   - Rekomendasi: POWR, MTLA

3. **Teknologi (TECH)**
   - Digitalisasi UMKM
   - Adopsi cloud computing
   - Rekomendasi: EMTK, MLPT

### Risiko yang Perlu Dipantau

- Geopolitik global (Middle East, US-China)
- Fluktuasi nilai tukar Rupiah
- Kebijakan moneter Fed (rate cut timing)
- Pemilu regional 2026

### Strategi Investasi

- **Long-term hold:** Saham blue-chip dengan dividen konsisten
- **Growth:** Sektor tech & renewable
- **Value:** Cyclical stocks saat koreksi

*Disclaimer: Bukan rekomendasi beli/jual. Lakukan riset mandiri.*`,
    featured: false,
    metaTitle: "Outlook IHSG 2026 — Sektoral Menarik | Maulana Ihsan",
    metaDescription:
      "Proyeksi IHSG 2026 dengan sektor perbankan, energi terbarukan, dan teknologi. Analisis fundamental dan strategi investasi.",
  },
  {
    title: "Panduan Lengkap: Cara Membaca Candlestick untuk Pemula",
    slug: "panduan-lengkap-candlestick-untuk-pemula",
    type: "EDUCATION",
    instrument: null,
    excerpt:
      "Candlestick adalah bentuk visualisasi pergerakan harga yang paling populer. Pelajari 10 pola candlestick paling dasar yang wajib diketahui setiap trader pemula.",
    content: `## Apa Itu Candlestick?

Candlestick adalah metode visualisasi pergerakan harga yang berasal dari Jepang abad ke-18. Setiap candle menampilkan 4 data: **Open, High, Low, Close (OHLC)** dalam periode tertentu.

### Anatomi Candlestick

- **Body (badan):** Selisih antara open dan close
- **Shadow/Wick (sumbu):** Garis di atas dan bawah body
- **Bullish candle:** Close > Open (biasanya hijau/putih)
- **Bearish candle:** Close < Open (biasanya merah/hitam)

### 10 Pola Candlestick Dasar

#### Pola Reversal Bullish

1. **Hammer**
   - Body kecil di atas, shadow bawah panjang (2x body)
   - Muncul di akhir downtrend
   - Sinyal: Bullish reversal

2. **Bullish Engulfing**
   - Candle bullish besar "menelan" candle bearish sebelumnya
   - Body-nya lebih besar dari body candle sebelumnya
   - Sinyal: Bullish reversal kuat

3. **Morning Star** (3 candle)
   - Candle 1: Bearish besar
   - Candle 2: Small body (indecision)
   - Candle 3: Bullish besar
   - Sinyal: Bullish reversal

#### Pola Reversal Bearish

4. **Shooting Star**
   - Kebalikan hammer, body kecil di bawah
   - Shadow atas panjang
   - Sinyal: Bearish reversal

5. **Bearish Engulfing**
   - Candle bearish besar menelan candle bullish
   - Sinyal: Bearish reversal kuat

6. **Evening Star** (3 candle)
   - Kebalikan morning star
   - Sinyal: Bearish reversal

#### Pola Continuation

7. **Doji**
   - Open dan close hampir sama
   - Body sangat kecil
   - Sinyal: Indecision (bisa continuation atau reversal)

8. **Spinning Top**
   - Body kecil, shadow atas dan bawah panjang
   - Sinyal: Indecision

9. **Marubozu**
   - Body penuh, tanpa shadow
   - Bullish Marubozu: dominasi buyer
   - Bearish Marubozu: dominasi seller

10. **Harami**
    - Candle kecil di dalam body candle sebelumnya
    - Sinyal: Momentum melemah

### Tips Membaca Candlestick

1. **Selalu lihat konteks:** Pola candlestick harus dibaca dalam konteks trend
2. **Konfirmasi:** Tunggu candle berikutnya untuk konfirmasi
3. **Volume:** Pola dengan volume tinggi lebih reliable
4. **Timeframe:** Pola di timeframe tinggi (Daily) lebih kuat dari timeframe rendah (5min)
5. **Kombinasikan:** Gunakan dengan indikator lain (RSI, MACD, Support/Resistance)

### Kesalahan Umum Pemula

- Trading hanya berdasarkan 1 candle
- Tidak memperhatikan level support/resistance
- Tunggu konfirmasi
- Tidak pasang stop loss

*Pelajari dengan paper trading sebelum pakai uang asli.*`,
    featured: true,
    metaTitle: "Panduan Lengkap Candlestick untuk Pemula | Maulana Ihsan",
    metaDescription:
      "Belajar membaca candlestick dari nol. 10 pola dasar, anatomi, tips, dan kesalahan umum pemula dalam trading.",
  },
  {
    title: "Risk Management: Aturan Emas yang Wajib Diterapkan Trader",
    slug: "risk-management-aturan-emas-trader",
    type: "RISK",
    instrument: null,
    excerpt:
      "90% trader gagal bukan karena analisis salah, tapi karena risk management buruk. Pelajari 7 aturan emas yang membedakan trader profesional dari penjudi.",
    content: `## Mengapa Risk Management Lebih Penting dari Strategi?

Banyak trader pemula fokus pada **strategi entry** (kapan beli/jual), tapi mengabaikan **risk management**. Padahal, trader profesional menghabiskan 80% waktu mereka untuk mengelola risiko, bukan menebak arah market.

### Statistik Menggetarkan

- **90%** trader retail kehilangan uang dalam 3 tahun pertama
- **70%** day trader quit dalam 6 bulan
- Penyebab utama: **Tidak ada risk management**

### 7 Aturan Emas Risk Management

#### 1. Risk Per Trade Maksimal 2%

Aturan paling fundamental: **jangan pernah risiko lebih dari 2% dari total modal dalam satu trade**.

- Modal $10,000 → Maksimal loss per trade = $200
- Jika loss 5x beruntun, total loss = $1,000 (10% modal)
- Modal masih $9,000, masih bisa recover

#### 2. Selalu Pasang Stop Loss

Stop loss adalah **asuransi** trading. Tanpa stop loss, satu trade salah bisa menghapus seluruh modal.

- **Hard stop:** Pasang di platform broker
- **Mental stop:** Catat di notes (TIDAK DIREKOMENDASIKAN)
- **Trailing stop:** Geser stop loss mengikuti profit

#### 3. Risk-Reward Ratio Minimum 1:2

Setiap trade harus punya potensi profit minimal 2x dari potensi loss.

- Risk $100 → Target profit minimal $200
- Win rate 40% masih profit:
  - 10 trades: 4 win × $200 = $800
  - 10 trades: 6 loss × $100 = -$600
  - Net profit: +$200

#### 4. Diversifikasi — Jangan Satu Keranjang

- Maksimal 5% modal per posisi
- Maksimal 20% modal per sektor
- Spread across: Saham, Kripto, Forex, Komoditas

#### 5. Tidak Rata-Rata di Bawah (Averaging Down)

Kesalahan paling mahal: **menambah posisi saat sudah floating loss** dengan harapan harga balik.

- Ini namanya **martingale**, bukan trading
- Satu trend kuat bisa menghabiskan modal
- Lebih baik cut loss dan re-evaluate

#### 6. Trading Journal — Catat Setiap Trade

Tanpa journal, Anda tidak bisa improve. Catat:
- Tanggal & waktu entry
- Alasan entry (setup apa)
- Entry price, stop loss, target
- Hasil (win/loss)
- Emosi saat trading
- Pelajaran

#### 7. Kelola Emosi, Bukan Hanya Strategi

Trading adalah **80% psikologi, 20% strategi**.

- **Greed:** Jangan over-leverage saat profit
- **Fear:** Jangan cut profit terlalu cepat
- **Revenge trading:** Jangan buka posisi setelah loss besar
- **FOMO:** Jangan kejar harga yang sudah jauh

### Kalkulator Risk Management

Contoh praktis:
- Modal: $5,000
- Risk per trade: 2% = $100
- Entry BTC: $60,000
- Stop loss: $58,000 (2% below)
- Position size: $100 / ($60,000 - $58,000) = 0.05 BTC
- Target profit (1:2): $62,000 → Profit $200

### Kesimpulan

Trading yang profitable bukan tentang **berapa banyak menang**, tapi **berapa kecil loss saat kalah**. Risk management adalah seni bertahan hidup di market. Trader yang bertahan 10 tahun pasti punya risk management disiplin.

*Trading adalah marathon, bukan sprint.*`,
    featured: false,
    metaTitle: "Risk Management Trading: 7 Aturan Emas | Maulana Ihsan",
    metaDescription:
      "Pelajari 7 aturan risk management trading yang membedakan trader profesional dari penjudi. Risk per trade, stop loss, RR ratio, diversifikasi.",
  },
  {
    title: "Trading Journal: Refleksi Q3 2026 dan Pelajaran Penting",
    slug: "trading-journal-refleksi-q3-2026",
    type: "JOURNAL",
    instrument: null,
    excerpt:
      "Catatan trading Q3 2026: Win rate 58%, profit +12.4%, tapi 3 kesalahan fatal yang harus diperbaiki di Q4. Refleksi jujur dan transparent untuk improvement.",
    content: `## Trading Journal Q3 2026

Posting ini adalah refleksi jujur dan transparent dari perjalanan trading saya di Q3 2026 (Juli-September). Tujuannya bukan untuk pamer profit, tapi untuk **sharing pelajaran** yang bisa berguna untuk trader lain.

### Summary Statistik Q3 2026

| Metrik | Nilai |
|--------|-------|
| Total Trades | 47 |
| Win Rate | 58% (27 win, 20 loss) |
| Net Profit | +12.4% |
| Profit Factor | 1.82 |
| Average Win | +2.1R |
| Average Loss | -1.1R |
| Max Drawdown | -6.2% |
| Best Trade | +5.4R (BTC long) |
| Worst Trade | -2.8R (IHSG short, revenge) |

### Apa yang Berhasil

#### 1. Disiplin Risk Management
- Selalu risk 2% per trade
- Stop loss selalu dipasang sebelum entry
- Tidak ada trade tanpa plan

#### 2. Trading Plan yang Konsisten
- Trading hanya di sesi London + New York (overlap)
- Hanya 3 setup: Breakout, Pullback, Reversal
- Max 3 trade per hari

#### 3. Trading Journal Rutin
- Catat setiap trade dalam 5 menit setelah close
- Review mingguan setiap Sabtu
- Adjust plan berdasarkan data

### 3 Kesalahan Fatal

#### Kesalahan #1: Revenge Trading (Aug 15)
- Loss 3x beruntun di pagi hari
- Buka posisi besar di IHSG short tanpa setup jelas
- Result: -2.8R loss, kena stop margin
- **Pelajaran:** Stop trading setelah 3 loss beruntun

#### Kesalahan #2: Move Stop Loss (Sep 3)
- BTC long profit +3R
- Greed, geser stop loss ke breakeven lalu ke entry-2
- Harga kena stop, padahal bisa profit +5R
- **Pelajaran:** Jangan move stop loss kecuali trailing stop system

#### Kesalahan #3: Overtrading (Sep 20-22)
- 8 trades dalam 3 hari (normal: 3-4)
- Quality turun, emosi naik
- Result: 5 loss dari 8 trades
- **Pelajaran:** Quality > Quantity

### Setup yang Paling Profitable

1. **BTC Breakout Daily** — 8 trades, 6 win, +9.2R total
2. **IHSG Pullback EMA50** — 5 trades, 4 win, +6.1R total
3. **Gold Reversal H4** — 4 trades, 3 win, +4.8R total

### Plan Q4 2026

#### Yang Dipertahankan:
- Risk 2% per trade
- 3 setup utama
- Trading journal harian
- Review mingguan

#### Yang Diperbaiki:
- **Stop trading setelah 3 loss beruntun** (rule baru)
- **Max 3 trade per hari** (lebih strict)
- **Tidak move stop loss** selain trailing stop system
- **Weekend analysis** lebih mendalam untuk setup minggu depan

#### Target Q4:
- Win rate 60%+ (dari 58%)
- Profit factor 2.0+ (dari 1.82)
- Max drawdown <5% (dari 6.2%)
- Profit target +10% (lebih realistis dari +12.4%)

### Refleksi Akhir

Trading Q3 2026 mengajarkan saya bahwa **profit bukan tentang strategi, tapi tentang disiplin**. Strategi saya average, tapi risk management dan psikologi yang disiplin menghasilkan profit konsisten.

Saya masih jauh dari perfect, tapi setiap kuartal adalah opportunity untuk improve. Trader profesional bukan yang tidak pernah salah, tapi yang **belajar dari setiap kesalahan**.

*Terima kasih sudah baca. Semoga bermanfaat untuk perjalanan trading Anda.*`,
    featured: false,
    metaTitle: "Trading Journal Q3 2026 — Refleksi Jujur | Maulana Ihsan",
    metaDescription:
      "Refleksi trading Q3 2026: win rate 58%, profit +12.4%, 3 kesalahan fatal, dan plan Q4. Sharing pelajaran untuk trader lain.",
  },
];

async function seedMarketArticles() {
  console.log("🌱 Seeding market articles...\n");

  let created = 0;
  let skipped = 0;

  for (const article of articles) {
    const existing = await db.marketArticle.findUnique({
      where: { slug: article.slug },
    });

    if (existing) {
      console.log(`  ⏭️  Skipped (already exists): ${article.slug}`);
      skipped++;
      continue;
    }

    const created_article = await db.marketArticle.create({
      data: {
        ...article,
        published: true,
        publishedAt: new Date(),
      },
    });

    console.log(`  ✅ Created: ${created_article.slug} [${article.type}]`);
    created++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} articles`);
  console.log(`   Skipped: ${skipped} articles (already existed)`);
  console.log(
    `   Total published: ${await db.marketArticle.count({
      where: { published: true },
    })} articles`
  );

  await db.$disconnect();
}

seedMarketArticles().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
