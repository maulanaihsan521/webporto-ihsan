// Verifikasi visual screenshot light & dark home via VLM
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const files = [
  { label: 'LIGHT MODE (harus: nama hero Champagne Gold #D4A64A)', path: '/home/z/my-project/download/light-home-gold-restored.png' },
  { label: 'DARK MODE (harus: nama hero gold cerah #DCAF5E, bg slate gelap)', path: '/home/z/my-project/download/dark-home-gold-restored.png' },
];

const zai = await ZAI.create();

for (const f of files) {
  const b64 = fs.readFileSync(f.path).toString('base64');
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `Analisa screenshot homepage portfolio (desktop 1440px). Konteks: ${f.label}\n\nJawab ringkas dalam Bahasa Indonesia untuk tiap poin:\n1. Apa warna teks nama "Maulana Ihsan Rohim" di hero? (gold terang / gold gelap bronze / putih / lainnya)\n2. Apakah teks nama & seluruh teks terbaca jelas (kontras cukup)?\n3. Apakah ada elemen tumpang tindih, teks terpotong, atau layout rusak?\n4. Apakah dekorasi halus (wave/blob/dot-grid) tampil wajar tanpa mengganggu konten?\n5. Ada bug visual lain?`,
          },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  console.log(`\n===== ${f.label} =====`);
  console.log(completion.choices[0]?.message?.content ?? '(tidak ada jawaban)');
}
