import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MonochromeArtwork from './MonochromeArtwork.jsx';

// Decode the chosen image before fading it in. Failed loads leave the cover intact.
function prepareMedia(slide) {
  if (slide.type !== 'video') {
    const image = new Image();
    image.src = slide.src;
    return { ready: image.decode(), cancel() {} };
  }
  const video = document.createElement('video');
  let timeout;
  const ready = new Promise((resolve, reject) => {
    video.muted = true;
    video.preload = 'auto';
    video.onloadeddata = resolve;
    video.onerror = reject;
    timeout = setTimeout(() => reject(new Error('Preview timeout')), 8000);
    video.src = `${slide.src}#t=0.1`;
  });
  return { ready, cancel() { clearTimeout(timeout); video.onloadeddata = null; video.onerror = null; video.removeAttribute('src'); video.load(); } };
}

export default function RotatingArtwork({ work, index, onOpen, rotating }) {
  const button = useRef(null);
  const [current, setCurrent] = useState(0);
  const [videoRatio, setVideoRatio] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [visible, setVisible] = useState(false);
  const [retry, setRetry] = useState(0);
  const hasRotated = useRef(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);

  useLayoutEffect(() => {
    const element = button.current;
    function updateRows() {
      const height = element.getBoundingClientRect().height;
      if (height > 0) element.style.setProperty('--work-rows', Math.ceil((height + 16) / 2));
    }
    updateRows();
    const observer = new ResizeObserver(updateRows);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(button.current);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    if (!rotating || !visible || focused || !pageVisible || work.slides.length < 2) return;
    let cancelled = false;
    let media;
    // Independent delays keep the whole grid from changing at once.
    const delay = hasRotated.current ? 3500 + Math.random() * 2500 : 1800 + index * 350 + Math.random() * 600;
    const timer = setTimeout(async () => {
      const next = (current + 1 + Math.floor(Math.random() * (work.slides.length - 1))) % work.slides.length;
      try {
        media = prepareMedia(work.slides[next]);
        await media.ready;
        if (!cancelled) { hasRotated.current = true; setPrevious(current); setCurrent(next); }
      } catch {
        // A failed request must not permanently stop this card's rotation.
        if (!cancelled) setRetry(value => value + 1);
      } finally { media?.cancel(); }
    }, delay);
    return () => { cancelled = true; clearTimeout(timer); media?.cancel(); };
  }, [current, rotating, visible, focused, pageVisible, work, index, retry]);

  useEffect(() => {
    if (previous === null) return;
    const timer = setTimeout(() => setPrevious(null), 700);
    return () => clearTimeout(timer);
  }, [previous, current]);

  function layer(slideIndex, outgoing = false) {
    const slide = work.slides[slideIndex];
    const src = slideIndex === 0 ? work.src : slide.src;
    return <span key={slideIndex} className={`cover-layer ${outgoing ? 'cover-outgoing' : previous !== null ? 'cover-incoming' : ''}`} aria-hidden={outgoing || undefined}>
      {work.monochrome ? <MonochromeArtwork src={src} title={outgoing ? '' : `${work.title} — ${slide.title}`} width={slide.width} height={slide.height} />
        : slide.type === 'video' ? <video src={`${src}#t=0.1`} muted playsInline preload="metadata" aria-label={outgoing ? undefined : slide.title} onLoadedMetadata={event => { const video = event.currentTarget; if (!outgoing && work.slides.length === 1 && video.videoWidth && video.videoHeight) setVideoRatio(`${video.videoWidth} / ${video.videoHeight}`); }} />
        : <img src={src} alt={outgoing ? '' : `${work.title} — ${slide.title}`} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />}
    </span>;
  }

  return <button className="work" ref={button} onClick={() => onOpen(index, current)}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} aria-label={`Otwórz kategorię: ${work.title}`}>
    <div className="work-meta"><span>{work.title.toUpperCase()}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
    <span className="work-cover" style={{ aspectRatio: videoRatio || `${work.width} / ${work.height}` }}>
      {previous !== null && layer(previous, true)}
      {layer(current)}
      {work.slides.length > 1 && <span className="cover-count" aria-hidden="true">▱ {String(current + 1).padStart(2, '0')} / {String(work.slides.length).padStart(2, '0')}</span>}
    </span>
    <div className="work-bottom"><span>{String(work.slides.length).padStart(2, '0')} {work.slides.every(slide => slide.type === 'video') ? 'VIDEOS' : 'IMAGES'}</span><span>VIEW ↗</span></div>
  </button>;
}
