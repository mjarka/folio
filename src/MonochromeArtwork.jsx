import React from 'react';

export default function MonochromeArtwork({ src, title, width, height }) {
  return <span className="monochrome-artwork" role="img" aria-label={title} style={{ '--artwork-mask': `url("${src}")`, aspectRatio: `${width} / ${height}` }} />;
}
