import React from 'react';
import {C, OUTLINE} from '../../theme';

/**
 * The fact-checker's magnifier, drawn in world space by its lens: centre (x, y), inner glass radius r, the handle
 * pointing along `angle` (degrees, 0 = +x, 90 = down). `flat` < 1 squashes the lens (lying on the desk, seen edge-on).
 * The magnified view is drawn by the scene under it (a clipped, scaled copy of what is behind the glass); this
 * component draws the glass tint, the rim, the handle and a highlight.
 */
export const MAG_RIM = 9;
export const MAG_NECK = 14;
export const MAG_HANDLE = 92;

/** where the hand grips the handle (world), for reach(); the handle is never squashed */
export const magGrip = (x: number, y: number, r: number, angle: number) => {
  const a = (angle * Math.PI) / 180;
  const d = r + MAG_RIM + MAG_NECK + MAG_HANDLE * 0.62;
  return {x: x + Math.cos(a) * d, y: y + Math.sin(a) * d};
};

export const S5Magnifier: React.FC<{x: number; y: number; r: number; angle: number; flat?: number; glint?: number}> = ({x, y, r, angle, flat = 1, glint = 0}) => {
  const R = r + MAG_RIM;
  const box = R + MAG_NECK + MAG_HANDLE + 30;
  const h0 = R - 2;
  const h1 = R + MAG_NECK;
  const h2 = h1 + MAG_HANDLE;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} viewBox={`0 0 1 1`}>
      {/* handle (not squashed: it stays a handle when the lens lies flat) */}
      <g transform={`rotate(${angle})`}>
        <line x1={h0} y1={0} x2={h1 + 4} y2={0} stroke={C.ink} strokeWidth={22} strokeLinecap="butt" />
        <line x1={h0} y1={0} x2={h1 + 4} y2={0} stroke={C.inkMuted} strokeWidth={14} strokeLinecap="butt" />
        <line x1={h1} y1={0} x2={h2} y2={0} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
        <line x1={h1} y1={0} x2={h2} y2={0} stroke={C.woodDeep} strokeWidth={22} strokeLinecap="round" />
        <line x1={h1 + 8} y1={-4} x2={h2 - 6} y2={-4} stroke={C.wood} strokeWidth={6} strokeLinecap="round" />
      </g>
      <g transform={`scale(1, ${flat})`}>
        {/* glass tint (the magnified view is under it) */}
        <circle cx={0} cy={0} r={r} fill="rgba(235,248,255,0.16)" />
        {/* rim */}
        <circle cx={0} cy={0} r={r + MAG_RIM / 2} fill="none" stroke={C.saffron} strokeWidth={MAG_RIM} />
        <circle cx={0} cy={0} r={r} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
        <circle cx={0} cy={0} r={R} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
        {/* highlight */}
        <path d={`M ${-r * 0.62} ${-r * 0.28} Q ${-r * 0.5} ${-r * 0.66} ${-r * 0.1} ${-r * 0.74}`} fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
        {glint > 0 && glint < 1 && (
          <g>
            <clipPath id="s5-mag-glass">
              <circle cx={0} cy={0} r={r} />
            </clipPath>
            <rect x={-r * 1.6 + glint * r * 3.2 - 12} y={-r * 1.4} width={24} height={r * 2.8} fill="rgba(255,250,225,0.85)" transform="rotate(24)" clipPath="url(#s5-mag-glass)" />
          </g>
        )}
      </g>
      {/* keep the svg's paint box generous */}
      <rect x={-box} y={-box} width={0} height={0} fill="none" />
    </svg>
  );
};
