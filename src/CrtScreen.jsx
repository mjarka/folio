import React, { useEffect, useId, useRef, useState } from 'react';
import { displacementTexture, sourcePoint } from './crtMath.js';

export default function CrtScreen({ enabled, children }) {
  const viewport = useRef(null);
  const forwarded = useRef(new WeakSet());
  const hovered = useRef(null);
  const bounds = useRef(null);
  const hoverFrame = useRef(0);
  const pointer = useRef(null);
  const [map, setMap] = useState(null);
  const filterId = `crt-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  useEffect(() => {
    if (!enabled) return;
    let timer;
    let disposed = false;
    let generation = 0;
    let lastGeometry = '';
    const element = viewport.current;
    const rebuild = () => {
      bounds.current = element.getBoundingClientRect();
      const { width, height } = bounds.current;
      if (!width || !height) return;
      const geometry = `${width}:${height}`;
      if (geometry === lastGeometry) return;
      lastGeometry = geometry;
      const revision = ++generation;
      const curvature = width < 540 ? 0.04 : 0.055;
      const texture = displacementTexture(width, height, curvature);
      const { scale } = texture;
      const canvas = document.createElement('canvas');
      // This texture encodes a smooth vector field, NOT the page image.
      // SVG interpolates it over the viewport; SourceGraphic stays at native DPR.
      // A large map makes the displacement filter dramatically more expensive.
      canvas.width = texture.size;
      canvas.height = texture.size;
      const context = canvas.getContext('2d');
      if (!context) return;
      const pixels = new ImageData(texture.data, texture.size, texture.size);
      context.putImageData(pixels, 0, 0);
      canvas.toBlob(blob => {
        if (!blob || disposed || generation !== revision) return;
        const url = URL.createObjectURL(blob);
        setMap({ url, width, height, curvature, scale, textureSize: texture.size });
      }, 'image/png');
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(rebuild, 100); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    rebuild();
    return () => {
      disposed = true;
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(hoverFrame.current);
      hoverFrame.current = 0;
    };
  }, [enabled]);

  useEffect(() => () => { if (map?.url) URL.revokeObjectURL(map.url); }, [map]);

  function mappedTarget(event, cachedBounds) {
    if (!enabled || !map) return null;
    const box = cachedBounds || viewport.current.getBoundingClientRect();
    const point = sourcePoint(event.clientX - box.left, event.clientY - box.top, box.width, box.height, map.curvature);
    if (point.x < 0 || point.y < 0 || point.x >= box.width || point.y >= box.height) return { target: null };
    const x = box.left + point.x;
    const y = box.top + point.y;
    const target = document.elementFromPoint(x, y);
    return { target: viewport.current.contains(target) ? target : null, x, y };
  }

  function correctClick(event) {
    // Keyboard activation already addresses the right DOM element.
    if (!event.detail || forwarded.current.has(event.nativeEvent)) return;
    const hit = mappedTarget(event);
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    if (!hit.target) return;
    hit.target.closest('button, a, input, [tabindex]')?.focus({ preventScroll: true });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window, detail: event.detail, clientX: hit.x, clientY: hit.y, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey });
    forwarded.current.add(click);
    hit.target.dispatchEvent(click);
  }

  function updateHover(event) {
    if (event.pointerType === 'touch') return;
    pointer.current = { clientX: event.clientX, clientY: event.clientY };
    if (hoverFrame.current) return;
    hoverFrame.current = requestAnimationFrame(() => {
      hoverFrame.current = 0;
      const hit = mappedTarget(pointer.current, bounds.current);
      const next = hit?.target?.closest('.work') || null;
      if (hovered.current !== next) {
        hovered.current?.classList.remove('crt-hover');
        next?.classList.add('crt-hover');
        hovered.current = next;
      }
      const cursor = enabled && map && hit?.target?.closest('button, a') ? 'pointer' : '';
      if (viewport.current.style.cursor !== cursor) viewport.current.style.cursor = cursor;
    });
  }

  function clearHover() {
    cancelAnimationFrame(hoverFrame.current);
    hoverFrame.current = 0;
    hovered.current?.classList.remove('crt-hover');
    hovered.current = null;
    viewport.current.style.cursor = '';
  }

  return (
    <div className={`crt-viewport ${enabled && map ? 'crt-enabled' : ''}`} ref={viewport} onClickCapture={correctClick} onPointerMove={updateHover} onPointerLeave={clearHover}>
      <svg className="crt-definitions" aria-hidden="true" width="0" height="0">
        <defs>{map && <filter id={filterId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width={map.width} height={map.height} colorInterpolationFilters="sRGB">
          {/* Half-texel padding aligns endpoint samples with viewport edges. */}
          <feImage href={map.url} x={-map.width / (2 * (map.textureSize - 1))} y={-map.height / (2 * (map.textureSize - 1))} width={map.width * map.textureSize / (map.textureSize - 1)} height={map.height * map.textureSize / (map.textureSize - 1)} preserveAspectRatio="none" result="barrelMap" />
          <feDisplacementMap in="SourceGraphic" in2="barrelMap" scale={map.scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>}</defs>
      </svg>
      <div className="crt-render" style={enabled && map ? { filter: `url(#${filterId})` } : undefined}>{children}</div>
      <div className="crt-glass" aria-hidden="true" />
    </div>
  );
}
