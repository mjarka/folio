import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const assets = fileURLToPath(new URL('../src/assets/', import.meta.url));
const output = path.join(assets, 'optimized');
await mkdir(output, { recursive: true });
const files = (await readdir(assets)).filter(name => /^(screen_|Untitled-2_).*\.png$/.test(name));
let before = 0, after = 0;
for (const file of files) {
  const input = path.join(assets, file);
  const metadata = await sharp(input).metadata();
  const tile = file.match(/_(\d+)\.png$/)[1];
  let width = Math.round(metadata.width / 2);
  let height = Math.round(metadata.height / 2);
  // The CSS grid stretches edges along one axis, so budget those axes independently.
  if (tile === '02' || tile === '08') width = Math.min(2400, metadata.width);
  if (tile === '04' || tile === '06') height = Math.min(1800, metadata.height);
  if (tile === '05') { width = 1600; height = 1400; }
  const destination = path.join(output, file.replace('.png', '.webp'));
  await sharp(input)
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3', withoutEnlargement: true })
    .webp({ quality: file.startsWith('screen_') ? 72 : 85, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(destination);
  const sourceBytes = (await stat(input)).size;
  const resultBytes = (await stat(destination)).size;
  before += sourceBytes;
  after += resultBytes;
  console.log(`${file}: ${metadata.width}x${metadata.height} -> ${width}x${height}, ${Math.round(sourceBytes / 1024)} -> ${Math.round(resultBytes / 1024)} KiB`);
}
console.log(`TOTAL: ${(before / 1048576).toFixed(2)} -> ${(after / 1048576).toFixed(2)} MiB (${(100 * (1 - after / before)).toFixed(1)}% smaller)`);
await sharp(path.join(assets, 'Logo.png'))
  .resize({ width: 384, withoutEnlargement: true })
  .webp({ lossless: true, effort: 6 })
  .toFile(path.join(output, 'Logo.webp'));
await sharp(path.join(assets, 'portrait.jpg'))
  .rotate()
  .webp({ quality: 90, smartSubsample: true, effort: 6 })
  .toFile(path.join(output, 'portrait.webp'));
for (const name of ['note', 'noteshadow']) {
  await sharp(path.join(assets, `${name}.png`))
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100, effort: 6 })
    .toFile(path.join(output, `${name}.webp`));
}
