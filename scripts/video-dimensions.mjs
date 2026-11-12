import { readFile } from 'node:fs/promises';

// ISO BMFF track headers store display dimensions in 16.16 fixed-point form.
export async function videoDimensions(filename) {
  const data = await readFile(filename);
  function find(start, end) {
    for (let offset = start; offset + 8 <= end;) {
      let size = data.readUInt32BE(offset);
      const type = data.toString('ascii', offset + 4, offset + 8);
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) break;
        size = Number(data.readBigUInt64BE(offset + 8));
        header = 16;
      }
      if (size === 0) size = end - offset;
      if (size < header || offset + size > end) break;
      const boxEnd = offset + size;
      if (type === 'tkhd' && size >= header + 44) {
        const width = Math.round(data.readUInt32BE(boxEnd - 8) / 65536);
        const height = Math.round(data.readUInt32BE(boxEnd - 4) / 65536);
        if (width && height) {
          const a = data.readInt32BE(boxEnd - 44);
          const d = data.readInt32BE(boxEnd - 28);
          return a === 0 && d === 0 ? { width: height, height: width } : { width, height };
        }
      }
      if (type === 'moov' || type === 'trak') {
        const dimensions = find(offset + header, boxEnd);
        if (dimensions) return dimensions;
      }
      offset = boxEnd;
    }
  }
  return find(0, data.length);
}
