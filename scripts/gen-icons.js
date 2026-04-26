// Generates all required PNG icons from assets/icon.svg
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'icon.svg');
const OUT_DIR = path.join(__dirname, '..', 'assets');

const targets = [
  // Main app icon (Expo)
  { file: 'icon.png', size: 1024 },
  // Adaptive icon foreground (Android, with safe zone padding ~33%)
  { file: 'adaptive-icon.png', size: 1024 },
  // Splash screen icon (small, centered)
  { file: 'splash-icon.png', size: 1024 },
  // Web favicon
  { file: 'favicon.png', size: 48 },
  // Android monochrome (themed icons)
  { file: 'android-icon-foreground.png', size: 432 },
];

(async () => {
  const svg = fs.readFileSync(SRC);
  for (const t of targets) {
    const out = path.join(OUT_DIR, t.file);
    await sharp(svg).resize(t.size, t.size).png().toFile(out);
    console.log(`✓ ${t.file} (${t.size}×${t.size})`);
  }

  // Solid background colour for Android adaptive (separate file)
  await sharp({
    create: {
      width: 1024, height: 1024, channels: 4,
      background: { r: 13, g: 124, b: 95, alpha: 1 },
    },
  }).png().toFile(path.join(OUT_DIR, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (solid #0D7C5F)');

  // Splash full-bleed (1284x2778 for iPhone, but keep it generic 2048x2048 with center icon)
  await sharp({
    create: {
      width: 2048, height: 2048, channels: 4,
      background: { r: 246, g: 248, b: 250, alpha: 1 },
    },
  })
    .composite([{
      input: await sharp(svg).resize(700, 700).png().toBuffer(),
      gravity: 'center',
    }])
    .png()
    .toFile(path.join(OUT_DIR, 'splash.png'));
  console.log('✓ splash.png (2048×2048 with centered icon)');

  console.log('\nAll icons regenerated.');
})();
