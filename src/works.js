import catalog from './work-catalog.json';

const images = import.meta.glob('./assets/prace-optimized/*/*.{webp,mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function imageUrl(key) {
  const url = images[`./assets/prace-optimized/${key}`];
  if (!url) throw new Error(`Nie znaleziono grafiki: ${key}`);
  return url;
}

const priority = { plakaty: 0, keyvisual: 1, logotypes: 2 };
const orderedCatalog = [...catalog].sort((a, b) =>
  (priority[a.id.toLowerCase()] ?? 3) - (priority[b.id.toLowerCase()] ?? 3)
);

export default orderedCatalog.map(category => ({
  ...category,
  src: imageUrl(category.cover.key),
  width: category.cover.width,
  height: category.cover.height,
  slides: category.slides.map(slide => ({ ...slide, src: imageUrl(slide.key) })),
}));
