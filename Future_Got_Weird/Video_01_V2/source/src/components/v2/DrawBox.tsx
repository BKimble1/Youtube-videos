import React from 'react';
import {C} from '../../theme';

/**
 * A hand-drawn highlight frame that draws itself on (t: 0 → 1 is the stroke travelling round), like a marker
 * circling the evidence. Positioned absolutely by the parent (left/top/width/height in px).
 */
export const DrawBox: React.FC<{t: number; x: number; y: number; w: number; h: number; tone?: 'teal' | 'coral' | 'ink' | 'saffron'; width?: number; fill?: boolean; round?: number; seed?: number}> = ({t, x, y, w, h, tone = 'teal', width = 6, fill = true, round = 14, seed = 0}) => {
  if (t <= 0) return null;
  const col = {teal: C.teal, coral: C.coral, ink: C.ink, saffron: C.saffronDeep}[tone];
  const bg = {teal: 'rgba(28,167,160,0.14)', coral: 'rgba(239,107,85,0.14)', ink: 'rgba(22,42,50,0.06)', saffron: 'rgba(255,199,68,0.22)'}[tone];
  const per = 2 * (w + h);
  // a slightly irregular loop that overshoots its start a little, like a real marker
  const j = (k: number) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1) * 4;
  const d = `M ${x + round + j(1)} ${y + j(2)} L ${x + w - round + j(3)} ${y + j(4)} Q ${x + w} ${y} ${x + w + j(5)} ${y + round} L ${x + w + j(6)} ${y + h - round} Q ${x + w} ${y + h} ${x + w - round} ${y + h + j(7)} L ${x + round} ${y + h + j(8)} Q ${x} ${y + h} ${x + j(9)} ${y + h - round} L ${x + j(10)} ${y + round} Q ${x} ${y} ${x + round + 14} ${y - 3}`;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} width={1} height={1}>
      {fill && <rect x={x} y={y} width={w} height={h} rx={round} fill={bg} opacity={Math.min(1, t * 1.6)} />}
      <path d={d} fill="none" stroke={col} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={per + 40} strokeDashoffset={(per + 40) * (1 - Math.min(1, t))} />
    </svg>
  );
};
