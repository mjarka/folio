import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourcePoint, displacementScale, displacementPixel, displacementTexture } from './crtMath.js';

test('centre and flat projection do not move', () => {
  assert.deepEqual(sourcePoint(600, 400, 1200, 800, 0.075), { x: 600, y: 400 });
  for (const [x, y] of [[0, 0], [400, 200], [1200, 800]]) {
    const p = sourcePoint(x, y, 1200, 800, 0);
    assert.ok(Math.abs(p.x - x) < 1e-10 && Math.abs(p.y - y) < 1e-10);
  }
});

test('compact texture retains the projection and click alignment within half a CSS pixel', () => {
  for (const [width, height, curvature] of [[390, 700, 0.04], [1440, 900, 0.055], [2560, 1440, 0.055]]) {
    const { size, scale, data } = displacementTexture(width, height, curvature);
    function channel(x, y, c) {
      const u = Math.max(0, Math.min(size - 1, x / width * (size - 1)));
      const v = Math.max(0, Math.min(size - 1, y / height * (size - 1)));
      const x0 = Math.floor(u), y0 = Math.floor(v);
      const x1 = Math.min(size - 1, x0 + 1), y1 = Math.min(size - 1, y0 + 1);
      const get = (a, b) => data[(b * size + a) * 4 + c];
      const top = get(x0, y0) * (1 - u + x0) + get(x1, y0) * (u - x0);
      const bottom = get(x0, y1) * (1 - u + x0) + get(x1, y1) * (u - x0);
      return top * (1 - v + y0) + bottom * (v - y0);
    }
    for (let row = 0; row <= 100; row++) for (let column = 0; column <= 100; column++) {
      const x = column / 100 * width, y = row / 100 * height;
      const source = sourcePoint(x, y, width, height, curvature);
      assert.ok(Math.abs(x + scale * (channel(x, y, 0) / 255 - 0.5) - source.x) < 0.5);
      assert.ok(Math.abs(y + scale * (channel(x, y, 1) / 255 - 0.5) - source.y) < 0.5);
    }
  }
});

test('opposite corners have symmetric curvature and straight lines actually bend', () => {
  const a = sourcePoint(0, 0, 1200, 800, 0.075);
  const b = sourcePoint(1200, 800, 1200, 800, 0.075);
  assert.ok(a.x < 0 && a.y < 0);
  assert.ok(Math.abs(a.x + b.x - 1200) < 1e-10);
  assert.ok(Math.abs(a.y + b.y - 800) < 1e-10);
  assert.notEqual(sourcePoint(0, 100, 1200, 800, 0.075).y, sourcePoint(600, 100, 1200, 800, 0.075).y);
});

test('encoded filter and pointer mapping agree within 0.5 map quantization step', () => {
  for (const [width, height, curvature] of [[390, 700, 0.055], [1440, 900, 0.075], [2560, 1440, 0.075]]) {
    const scale = displacementScale(width, height, curvature);
    for (let iy = 0; iy <= 20; iy++) for (let ix = 0; ix <= 20; ix++) {
      const x = ix / 20 * width, y = iy / 20 * height;
      const [r, g] = displacementPixel(x, y, width, height, curvature, scale);
      assert.ok(r >= 0 && r <= 255 && g >= 0 && g <= 255);
      const target = sourcePoint(x, y, width, height, curvature);
      assert.ok(Math.abs(x + scale * (r / 255 - 0.5) - target.x) <= scale / 510 + 1e-8);
      assert.ok(Math.abs(y + scale * (g / 255 - 0.5) - target.y) <= scale / 510 + 1e-8);
    }
  }
});
