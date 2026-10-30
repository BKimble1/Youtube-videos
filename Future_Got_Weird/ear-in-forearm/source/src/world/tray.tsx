// The surgical surface: an instrument tray on a sterile drape, on a stand beside her, below the raised arm. It is part
// of the room (it never appears or disappears); the hook and the final framings simply stop above it.
import React from 'react';
import {STEEL, INK} from './pal';

export const TRAY = {x: 792, y: 1420, w: 330, h: 150};
const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const});
const DRAPE = '#3F8F8C', DRAPE_L = '#5BAAA5', DRAPE_D = '#2A6866';

export const Tray: React.FC<{ow: number}> = ({ow}) => {
  const {x, y, w, h} = TRAY;
  const x0 = x - w / 2, y0 = y - h / 2;
  // the top is seen from a little above: a slightly narrower far edge
  const top = `M ${x0 + 18} ${y0} L ${x0 + w - 18} ${y0} L ${x0 + w} ${y0 + h} L ${x0} ${y0 + h} Z`;
  return (
    <g>
      <defs>
        <linearGradient id="drapeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={DRAPE_D} />
          <stop offset="0.35" stopColor={DRAPE} />
          <stop offset="1" stopColor={DRAPE_L} />
        </linearGradient>
        <pattern id="drapeWeave" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <path d="M 0 2.5 L 5 2.5" stroke="#FFF" strokeWidth="0.5" opacity="0.07" />
        </pattern>
        <linearGradient id="steelG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={STEEL.light} />
          <stop offset="0.5" stopColor={STEEL.base} />
          <stop offset="1" stopColor={STEEL.shade} />
        </linearGradient>
      </defs>
      {/* stand */}
      <path d={`M ${x - 10} ${y0 + h + 12} L ${x - 6} ${y0 + h + 260} L ${x + 6} ${y0 + h + 260} L ${x + 10} ${y0 + h + 12} Z`} fill={STEEL.shade} {...ln(ow)} />
      {/* drape over the top, hanging over the front edge */}
      <path d={top} fill="url(#drapeG)" {...ln(ow)} />
      <path d={top} fill="url(#drapeWeave)" />
      <path d={`M ${x0} ${y0 + h} L ${x0 + w} ${y0 + h} L ${x0 + w - 4} ${y0 + h + 34} C ${x0 + w * 0.7} ${y0 + h + 42} ${x0 + w * 0.3} ${y0 + h + 30} ${x0 + 4} ${y0 + h + 38} Z`} fill={DRAPE_D} {...ln(ow)} />
      {/* folds */}
      <path d={`M ${x0 + 60} ${y0 + 10} C ${x0 + 70} ${y0 + 60} ${x0 + 54} ${y0 + 100} ${x0 + 62} ${y0 + h}`} stroke={DRAPE_D} strokeWidth="4" opacity="0.35" fill="none" />
      <path d={`M ${x0 + w - 70} ${y0 + 6} C ${x0 + w - 60} ${y0 + 50} ${x0 + w - 78} ${y0 + 110} ${x0 + w - 66} ${y0 + h}`} stroke={DRAPE_D} strokeWidth="4" opacity="0.3" fill="none" />
    </g>
  );
};
