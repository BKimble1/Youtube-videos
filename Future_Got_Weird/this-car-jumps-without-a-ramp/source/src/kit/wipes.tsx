// Transitions made of things in the scene: a close tyre wall whipping past the lens. It fills the frame completely for a
// few frames, so the picture behind it can change without any exposed edge, panel or partial old background.
import React from 'react';
import {C} from '../theme';
import {lerp} from './util';

const ROWS = 4;
const R = 138; // tyre radius (px at 1080p): four rows fill the height

/** p: 0 = wall off to the right, 1 = wall gone to the left. `len` = wall length in px (full cover while longer than the frame). */
export const TyreWall: React.FC<{p: number; len?: number; seed?: number}> = ({p, len = 3600, seed = 3}) => {
  if (p <= 0 || p >= 1) return null;
  const x = lerp(1920 + 40, -len - 40, p);
  const cols = Math.ceil(len / (R * 1.9)) + 1;
  const tyres: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const stagger = (r % 2) * R;
    const start = r === 0 ? 0 : r === 1 ? 1 : r === 2 ? 0 : 2; // ragged ends, like a real stack
    const end = r === 0 ? 0 : r === 1 ? 2 : r === 2 ? 1 : 0;
    for (let c = start; c < cols - end; c++) {
      const cx = stagger + c * R * 1.9 + R;
      const cy = r * (1080 / ROWS) + 1080 / ROWS / 2;
      const k = (c * 5 + r * 3 + seed) % 7;
      const col = k === 0 || k === 4 ? C.coral : k === 2 ? C.cream : '#2B363D';
      tyres.push(
        <g key={`${r}-${c}`}>
          <ellipse cx={cx} cy={cy} rx={R * 0.98} ry={1080 / ROWS / 2 - 1} fill={col} stroke={C.ink} strokeWidth={6} />
          <ellipse cx={cx} cy={cy} rx={R * 0.46} ry={R * 0.46} fill="#10171B" stroke={C.ink} strokeWidth={5} />
          <path d={`M ${cx - R * 0.82} ${cy - 24} C ${cx - R * 0.6} ${cy - R * 0.9} ${cx + R * 0.1} ${cy - R * 0.95} ${cx + R * 0.5} ${cy - R * 0.8}`} fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" opacity={col === '#2B363D' ? 0.18 : 0.35} />
        </g>,
      );
    }
  }
  return (
    <g transform={`translate(${x.toFixed(1)} 0)`}>
      <rect x={R} y={0} width={len - R} height={1080} fill="#10171B" />
      {tyres}
    </g>
  );
};
