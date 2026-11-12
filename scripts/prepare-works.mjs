import { readdir, mkdir, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { videoDimensions } from './video-dimensions.mjs';
import { optimizeVideo } from './optimize-video.mjs';

const root = fileURLToPath(new URL('../src/assets/prace/', import.meta.url));
const output = fileURLToPath(new URL('../src/assets/prace-optimized/', import.meta.url));
const manifest = fileURLToPath(new URL('../src/work-catalog.json', import.meta.url));
const compare = (a, b) => a.localeCompare(b, 'pl', { numeric: true, sensitivity: 'base' });
const title = name => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
const folders = (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort(compare);
const categories = [];
const force = process.argv.includes('--force');
let total = 0;
for (const folder of folders) {
  const files = (await readdir(path.join(root, folder))).filter(file => /\.(png|jpe?g|webp|avif|mp4|webm)$/i.test(file)).sort(compare);
  if (!files.length) continue;
  const main = files.find(file => /^main\.[^.]+$/i.test(file)) || files[0];
  if (!/^main\.[^.]+$/i.test(main)) console.warn(`Kategoria ${folder}: brak main, tymczasowa okładka: ${main}`);
  await mkdir(path.join(output, folder), { recursive: true });
  const slides = [];
  const generatedFiles = new Set();
  let cover;
  for (const file of [main, ...files.filter(file => file !== main)]) {
    const input = path.join(root, folder, file);
    // Stable URL-safe names also handle source filenames containing # or ?.
    const isVideo = /\.(mp4|webm)$/i.test(file);
    const extension = isVideo ? '.mp4' : '.webp';
    const generatedName = `${createHash('sha256').update(file + (isVideo ? ':h264-crf26-1280-v1' : '')).digest('hex').slice(0, 16)}${extension}`;
    const key = `${folder}/${generatedName}`;
    generatedFiles.add(generatedName);
    const destination = path.join(output, key);
    const sourceTime = (await stat(input)).mtimeMs;
    let outputTime = 0;
    try { outputTime = (await stat(destination)).mtimeMs; } catch {}
    if (isVideo) {
      await optimizeVideo(input, destination, force);
      const dimensions = await videoDimensions(destination);
      const { width, height } = dimensions || { width: 1280, height: 720 };
      slides.push({ key, title: title(file), filename: file, width, height, type: 'video' });
      if (file === main) cover = { key, width, height, type: 'video' };
      continue;
    }
    if (force || sourceTime > outputTime) {
      await sharp(input).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toFile(destination);
    }
    const { width, height } = await sharp(destination).metadata();
    slides.push({ key, title: file === main ? folder : title(file), filename: file, width, height, type: 'image' });
    if (file === main) {
      const coverKey = `${folder}/cover.webp`;
      generatedFiles.add('cover.webp');
      const coverPath = path.join(output, coverKey);
      let coverTime = 0;
      try { coverTime = (await stat(coverPath)).mtimeMs; } catch {}
      if (force || sourceTime > coverTime) await sharp(input).rotate().resize({ width: 900, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, effort: 5 }).toFile(coverPath);
      const dimensions = await sharp(coverPath).metadata();
      cover = { key: coverKey, width: dimensions.width, height: dimensions.height, type: 'image' };
    }
  }
  total += slides.length;
  for (const oldFile of await readdir(path.join(output, folder))) {
    if (/\.(webp|mp4|webm)$/.test(oldFile) && !generatedFiles.has(oldFile)) await unlink(path.join(output, folder, oldFile));
  }
  if (folder.toLowerCase() === 'animacja') {
    for (const slide of slides) {
      categories.push({
        id: `${folder}-${path.basename(slide.key, path.extname(slide.key))}`,
        title: title(slide.filename),
        category: folder,
        monochrome: false,
        cover: { key: slide.key, width: slide.width, height: slide.height, type: slide.type },
        slides: [slide],
      });
    }
  } else {
    categories.push({ id: folder, title: folder, monochrome: folder.toLowerCase() === 'logotypes', cover, slides });
  }
}
const json = JSON.stringify(categories, null, 2) + '\n';
let previous;
try { previous = await readFile(manifest, 'utf8'); } catch {}
if (previous !== json) await writeFile(manifest, json);
console.log(`Galeria: ${categories.length} kafelków, ${total} materiałów. Oryginały zachowane.`);
