import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat, copyFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

const run = promisify(execFile);
export async function inspectVideo(filename) {
  const { stdout } = await run(ffprobe.path, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate', '-of', 'json', filename], { windowsHide: true });
  return JSON.parse(stdout);
}

export async function optimizeVideo(input, destination, force = false) {
  const source = await stat(input);
  try { if (!force && (await stat(destination)).mtimeMs >= source.mtimeMs) return; } catch {}
  const metadata = await inspectVideo(input);
  const stream = metadata.streams.find(item => item.codec_type === 'video');
  if (!stream) throw new Error(`Brak ścieżki wideo: ${input}`);
  const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);
  const temporary = destination.replace(/\.mp4$/, '.encoding.mp4');
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input,
    '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '-1',
    '-vf', "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-threads', '2',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart'];
  if (numerator / denominator > 30) args.push('-r', '30');
  args.push(temporary);
  console.log(`Kompresja wideo: ${path.basename(input)}`);
  try {
    await run(ffmpeg, args, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
    const encoded = await stat(temporary);
    // Keep the original stream when an already efficient MP4 would only get larger.
    if (encoded.size >= source.size && path.extname(input).toLowerCase() === '.mp4') {
      await copyFile(input, destination);
      await unlink(temporary);
    } else await rename(temporary, destination);
    const result = await stat(destination);
    console.log(`${path.basename(input)}: ${(source.size / 1024).toFixed(0)} -> ${(result.size / 1024).toFixed(0)} KiB (${(100 * (1 - result.size / source.size)).toFixed(1)}% mniej)`);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}
