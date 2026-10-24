// Small props held by the cast.
import React from 'react';
import {fmt} from '../lib/math';

/** A phone held in the hand: wrist point and hand angle (deg) from the rig; the screen lights the palm a little. */
export const Phone: React.FC<{at: {x: number; y: number}; ang: number; s: number; glow?: number}> = ({at, ang, s, glow = 1}) => {
  const L = 150 * s;
  const W = 76 * s;
  const off = 70 * s;
  return (
    <g transform={`translate(${fmt(at.x)} ${fmt(at.y)}) rotate(${fmt(ang)}) translate(${fmt(off)} 0) rotate(${fmt(-ang * 0.3)})`}>
      <rect x={fmt(-L / 2)} y={fmt(-W / 2)} width={fmt(L)} height={fmt(W)} rx={fmt(12 * s)} fill="#1A222B" stroke="#0B1015" strokeWidth={fmt(3 * s)} />
      <rect x={fmt(-L / 2 + 7 * s)} y={fmt(-W / 2 + 7 * s)} width={fmt(L - 14 * s)} height={fmt(W - 14 * s)} rx={fmt(7 * s)} fill="#6FD3F5" opacity={0.85 * glow} />
      <rect x={fmt(-L / 2 + 14 * s)} y={fmt(-W / 2 + 14 * s)} width={fmt(L * 0.4)} height={fmt(8 * s)} rx={fmt(3 * s)} fill="#FFFFFF" opacity={0.7 * glow} />
      <rect x={fmt(-L / 2 + 14 * s)} y={fmt(-W / 2 + 28 * s)} width={fmt(L * 0.6)} height={fmt(8 * s)} rx={fmt(3 * s)} fill="#FFFFFF" opacity={0.45 * glow} />
    </g>
  );
};
