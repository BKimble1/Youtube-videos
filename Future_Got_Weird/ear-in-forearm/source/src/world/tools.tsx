// Surgical instruments, each drawn with its working tip at the local origin, pointing along +x; `a` (degrees) aims
// the tool. Steel is drawn flat-shaded with one specular line, in the same ink style as the figure.
import React from 'react';
import {STEEL, INK} from './pal';

const ln = (w: number) => ({stroke: INK, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const});

/** No. 15 blade on a handle: a small curved cutting edge (tip at origin), handle running back along -x. */
export const Scalpel: React.FC<{x: number; y: number; a: number; s?: number; ow: number; o?: number}> = ({x, y, a, s = 1, ow, o = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} opacity={o}>
    <path d="M -34 -3.2 L -150 -4.5 L -150 4.5 L -34 3.6 Z" fill={STEEL.shade} {...ln(ow)} />
    <path d="M -150 -1.5 L -36 -1.2" stroke={STEEL.light} strokeWidth="1.2" />
    <path d="M 0 0 C -6 -3 -14 -6.5 -24 -6.8 L -36 -3.6 L -36 3.6 L -22 3.4 C -12 3 -5 1.8 0 0 Z" fill={STEEL.base} {...ln(ow)} />
    <path d="M -2 -0.6 C -8 -3 -15 -5 -23 -5.4" fill="none" stroke={STEEL.light} strokeWidth="1" />
  </g>
);

/** Fine forceps: two slim blades meeting at the tip; `open` spreads them (0 closed). */
export const Forceps: React.FC<{x: number; y: number; a: number; s?: number; ow: number; open?: number; o?: number}> = ({x, y, a, s = 1, ow, open = 0, o = 1}) => {
  const g = 1.2 + open * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} opacity={o}>
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={`M 0 ${k * 0.8} L -60 ${k * g} L -170 ${k * (g + 7)} L -170 ${k * (g + 1)} L -60 ${k * (g - 1.6) * 0.6} L -2 0 Z`} fill={k < 0 ? STEEL.base : STEEL.shade} {...ln(ow)} />
        </g>
      ))}
      <path d={`M -150 ${-(g + 4)} L -70 ${-(g + 0.6)}`} stroke={STEEL.light} strokeWidth="1.1" />
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={`M ${-120 - k * 9} ${-(g + 5)} L ${-120 - k * 9} ${-(g + 2)}`} stroke={STEEL.deep} strokeWidth="1" />
      ))}
    </g>
  );
};

/** Micro needle holder with a curved needle and trailing suture. */
export const NeedleHolder: React.FC<{x: number; y: number; a: number; s?: number; ow: number; o?: number}> = ({x, y, a, s = 1, ow, o = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} opacity={o}>
    <path d="M -4 0 C -2 -5 4 -7 8 -4" fill="none" stroke={STEEL.deep} strokeWidth="1.1" />
    <path d="M 8 -4 C 14 -1 18 6 26 9" fill="none" stroke="#2A3440" strokeWidth="0.6" />
    <path d="M -3 -1.4 L -60 -3 L -160 -6 L -160 6 L -60 3 L -3 1.4 Z" fill={STEEL.base} {...ln(ow)} />
    <path d="M -150 -3 L -62 -1.4" stroke={STEEL.light} strokeWidth="1" />
  </g>
);
