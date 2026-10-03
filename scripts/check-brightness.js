// Analisis brightness semua screenshot galeri PlatterTea
const sharp = require("sharp");

const files = [
  "plattertea-hero.png",
  "plattertea-menu.png",
  "plattertea-promo.png",
  "plattertea-order.png",
  "plattertea-cart.png",
  "plattertea-mobile.png",
];

(async () => {
  for (const f of files) {
    try {
      const stats = await sharp(`/home/z/my-project/download/${f}`)
        .greyscale()
        .stats();
      const mean = stats.channels[0].mean;
      console.log(`${f.padEnd(24)} mean brightness: ${mean.toFixed(1)} / 255`);
    } catch (e) {
      console.log(`${f}: ERROR ${e.message}`);
    }
  }
})();
