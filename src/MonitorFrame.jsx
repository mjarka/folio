import React from 'react';
import topLeft from './assets/optimized/Untitled-2_01.webp';
import top from './assets/optimized/Untitled-2_02.webp';
import topRight from './assets/optimized/Untitled-2_03.webp';
import left from './assets/optimized/Untitled-2_04.webp';
import right from './assets/optimized/Untitled-2_06.webp';
import bottomLeft from './assets/optimized/Untitled-2_07.webp';
import bottom from './assets/optimized/Untitled-2_08.webp';
import bottomRight from './assets/optimized/Untitled-2_09.webp';

const pieces = [
  ['top-left', topLeft], ['top', top], ['top-right', topRight],
  ['left', left], ['right', right],
  ['bottom-left', bottomLeft], ['bottom', bottom], ['bottom-right', bottomRight],
];

export default function MonitorFrame() {
  return <div className="monitor-frame" aria-hidden="true">
    {pieces.map(([position, src]) => <img key={position} className={`frame-piece frame-${position}`} src={src} alt="" draggable="false" />)}
  </div>;
}
