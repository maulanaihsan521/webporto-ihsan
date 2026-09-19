// Generate themed service card images → public/images/services/{slug}.jpg
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/home/z/my-project/public/images/services';

const SERVICES = [
  {
    slug: 'digital-marketing',
    prompt: 'Professional digital marketing analytics dashboard on a laptop screen showing rising growth charts and campaign metrics, dark navy blue interface with golden amber accent charts, moody dark office background, cinematic lighting, shallow depth of field, premium professional photography, high quality, detailed',
  },
  {
    slug: 'social-media-management',
    prompt: 'Social media management concept, smartphone held in hand showing social engagement feed, floating like and heart notification icons glowing softly, dark moody background with soft rose pink neon accent lighting, professional photography, premium quality, detailed',
  },
  {
    slug: 'photography',
    prompt: 'Professional mirrorless camera with prime lens resting on dark textured surface, dramatic violet purple rim lighting from the side, moody atmospheric studio background, shallow depth of field, premium product photography, high quality, detailed',
  },
  {
    slug: 'videography',
    prompt: 'Professional cinema camera rig on tripod in dark film studio, teal blue and cyan accent lighting, cinematic film production atmosphere with soft haze, monitor screens glowing in background, moody professional, high quality, detailed',
  },
  {
    slug: 'video-editing',
    prompt: 'Video editing workstation with color grading timeline and scopes on ultrawide monitor, dark room illuminated only by warm orange monitor glow, professional post-production suite, keyboard with shortcut keys visible, cinematic moody atmosphere, high quality',
  },
  {
    slug: 'website-development',
    prompt: 'Web development code editor with emerald green syntax highlighting on dark IDE interface, modern minimal desk with mechanical keyboard, dark room with soft green glow from screen, moody professional developer workspace, high quality, detailed',
  },
  {
    slug: 'financial-market-research',
    prompt: 'Financial market analysis scene, candlestick stock charts glowing on dark trading screen with green and red indicators, dark moody trading desk atmosphere, chart overlay on second monitor, professional cinematic photography, high quality, detailed',
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();
  let ok = 0;

  for (const s of SERVICES) {
    const outPath = path.join(OUT_DIR, `${s.slug}.png`);
    if (fs.existsSync(outPath)) {
      console.log(`= exists: ${s.slug}`);
      ok++;
      continue;
    }
    try {
      const response = await zai.images.generations.create({
        prompt: s.prompt,
        size: '864x1152',
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error('empty response');
      fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
      console.log(`+ generated: ${s.slug}`);
      ok++;
    } catch (err) {
      console.error(`x failed: ${s.slug} — ${err.message}`);
    }
  }
  console.log(`Done: ${ok}/${SERVICES.length}`);
}

main();
