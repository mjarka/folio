import React from 'react';
import topLeft from './assets/optimized/screen_01.webp';
import top from './assets/optimized/screen_02.webp';
import topRight from './assets/optimized/screen_03.webp';
import left from './assets/optimized/screen_04.webp';
import center from './assets/optimized/screen_05.webp';
import right from './assets/optimized/screen_06.webp';
import bottomLeft from './assets/optimized/screen_07.webp';
import bottom from './assets/optimized/screen_08.webp';
import bottomRight from './assets/optimized/screen_09.webp';

const pieces = [
  ['top-left', topLeft], ['top', top], ['top-right', topRight],
  ['left', left], ['center', center], ['right', right],
  ['bottom-left', bottomLeft], ['bottom', bottom], ['bottom-right', bottomRight],
];

export default function ScreenReflections() {
  return <div className="monitor-reflections" aria-hidden="true">
    {pieces.map(([position, src]) => <img key={position} className={`frame-piece frame-${position}`} src={src} alt="" draggable="false" />)}
  </div>;
}
