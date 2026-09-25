import { readdirSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PROJECTS = path.join(ROOT, 'public/images/projects');
const IMAGES = path.join(ROOT, 'public/images');

function kb(n) { return (n / 1024).toFixed(1) + 'KB'; }

async function rewrite(file, pipeline) {
  const before = statSync(file).size;
  const buf = await pipeline.toBuffer();
  if (buf.length < before) {
    writeFileSync(file, buf);
    console.log('  ', path.basename(file), kb(before), '→', kb(buf.length));
    return before - buf.length;
  }
  return 0;
}

let saved = 0;

console.log('Compressing project screenshots…');
const shots = readdirSync(PROJECTS).filter((f) => /\.webp$/i.test(f));
const THUMBS = path.join(PROJECTS, 'thumbs');
mkdirSync(THUMBS, { recursive: true });
for (const f of shots) {
  const file = path.join(PROJECTS, f);
  saved += await rewrite(
    file,
    sharp(file).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 68, effort: 6 }),
  );
  await sharp(file)
    .resize({ width: 640, height: 420, fit: 'cover', position: 'top' })
    .webp({ quality: 62, effort: 6 })
    .toFile(path.join(THUMBS, f));
  console.log('  thumb', f);
}

console.log('Optimizing brand assets…');
await sharp(path.join(IMAGES, 'logo-icon.png'))
  .resize(88, 88)
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(IMAGES, 'logo-icon.webp'));

await sharp(path.join(IMAGES, 'signature-modern.png'))
  .resize({ width: 520, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 })
  .toFile(path.join(IMAGES, 'signature-modern.webp'));

await sharp(path.join(IMAGES, 'signature-modern-dark.png'))
  .resize({ width: 520, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 })
  .toFile(path.join(IMAGES, 'signature-modern-dark.webp'));

saved += await rewrite(
  path.join(IMAGES, 'photo.webp'),
  sharp(path.join(IMAGES, 'photo.webp')).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }),
);

await sharp(path.join(IMAGES, 'photo.webp'))
  .resize({ width: 400, withoutEnlargement: true })
  .webp({ quality: 72, effort: 6 })
  .toFile(path.join(IMAGES, 'photo-400.webp'));

console.log('Saved', kb(saved), 'from project shots. Brand webps written.');
