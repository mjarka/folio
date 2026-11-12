import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../src/assets/portrait.jpg', import.meta.url));
const output = fileURLToPath(new URL('../public/', import.meta.url));
await mkdir(output, { recursive: true });
const metadata = await sharp(source).metadata();
const side = Math.min(metadata.width, metadata.height);
const top = Math.min(Math.round(side * 0.047), metadata.height - side);
const icons = new Map();
for (const size of [16, 32, 48, 180, 192, 512]) {
  const png = await sharp(source).extract({ left: 0, top, width: side, height: side })
    .resize(size, size, { kernel: 'nearest' }).png({ compressionLevel: 9 }).toBuffer();
  icons.set(size, png);
  const name = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`;
  await writeFile(path.join(output, name), png);
}
const sizes = [16, 32, 48];
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(icons.get(size).length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += icons.get(size).length;
});
await writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...sizes.map(size => icons.get(size))]));
console.log('Favicons: PNG 16/32/48/180/192/512 + multi-size ICO.');
