// Inverse barrel projection: for each visible pixel, find its source in the DOM.
// The same function drives both the filter texture and pointer hit testing.
export function sourcePoint(x, y, width, height, curvature) {
  const u = (2 * x) / width - 1;
  const v = (2 * y) / height - 1;
  return {
    x: width * (1 + u * (1 + curvature * v * v)) / 2,
    y: height * (1 + v * (1 + curvature * u * u)) / 2,
  };
}

export function displacementScale(width, height, curvature) {
  return Math.max(1, Math.max(width, height) * curvature * 1.02);
}

export function displacementTexture(width, height, curvature) {
  const size = 256;
  const scale = displacementScale(width, height, curvature);
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    const v = 2 * y / (size - 1) - 1;
    for (let x = 0; x < size; x++) {
      const u = 2 * x / (size - 1) - 1;
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(255 * (0.5 + width * u * curvature * v * v / (2 * scale)));
      data[offset + 1] = Math.round(255 * (0.5 + height * v * curvature * u * u / (2 * scale)));
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }
  return { size, scale, data };
}

export function displacementPixel(x, y, width, height, curvature, scale) {
  const source = sourcePoint(x, y, width, height, curvature);
  return [
    Math.round(255 * (0.5 + (source.x - x) / scale)),
    Math.round(255 * (0.5 + (source.y - y) / scale)),
    128,
    255,
  ];
}
