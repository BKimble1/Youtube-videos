// V3 bridge material: the silk solution seen through the imagined shooter's cartridge window and, matched, inside
// the lab's silk syringe. A few readable forms only: a pale-gold liquid with soft flow streaks and six long, wavy silk
// protein strands drifting toward the outlet (field +x); neighbouring strands draw into loose pairs as they go (they
// are cohesive), which is all the illustration claims. No formula, no particles cloud.
import React from 'react';
import {fmt, V} from './dc/math';
import {INK} from './dc/ink';

export const FLUID_BG = '#F2D98E';
const STRAND = '#D9A43C';
const STREAK = '#FBEFC4';

type Map = (x: number, y: number) => V;
const STR = [
  {y: -820, ph: 0.0, len: 900, x0: -400},
  {y: -560, ph: 1.7, len: 780, x0: 300},
  {y: -300, ph: 3.1, len: 940, x0: -150},
  {y: -20, ph: 0.9, len: 820, x0: 450},
  {y: 250, ph: 2.4, len: 900, x0: -500},
  {y: 520, ph: 4.0, len: 760, x0: 150},
  {y: 790, ph: 5.2, len: 880, x0: -250},
];
/** strands and streaks of the solution in field units (one unit = one screen px at scale 1), flowing toward +x at
 *  `speed` units/s; `pair` 0..1 draws neighbouring strands together */
/** port: field x of the outlet port (the strands converge toward y = 0 there and leave through it) */
export const FluidField: React.FC<{map: Map; scale: number; t: number; speed?: number; pair?: number; xView: [number, number]; port?: number}> = ({map, scale, t, speed = 260, pair = 0.4, xView, port}) => {
  const span = 2600;
  const out: React.ReactNode[] = [];
  const w = 46 * scale;
  const conv = (x: number) => (port === undefined ? 1 : 1 - 0.88 * Math.min(1, Math.max(0, (x - (port - 1100)) / 1100)) ** 1.5);
  STR.forEach((s, i) => {
    // wrap each strand along the flow so the view is always populated
    let x0 = s.x0 + speed * t;
    const base = Math.floor((xView[0] - x0 - s.len) / span) + 1;
    for (let k = base; x0 + k * span < xView[1] + s.len; k++) {
      const xs = x0 + k * span;
      const pull = (i % 2 === 0 ? 1 : -1) * 90 * pair * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
      const pts: V[] = [];
      for (let j = 0; j <= 28; j++) {
        const u = j / 28;
        const x = xs + u * s.len;
        if (port !== undefined && x > port) break;
        const y = (s.y + pull + 40 * Math.sin(u * 5.5 + s.ph + t * 1.6) + 10 * Math.sin(u * 11 + s.ph * 2 - t * 2.1)) * conv(x);
        pts.push(map(x, y));
      }
      if (pts.length < 2) continue;
      const d = `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
      out.push(
        <g key={`${i}_${k}`}>
          <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 7 * scale)} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          <path d={d} fill="none" stroke={STRAND} strokeWidth={fmt(w)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#F6D88A" strokeWidth={fmt(w * 0.28)} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} transform={`translate(${fmt(-w * 0.18)} ${fmt(-w * 0.18)})`} />
        </g>,
      );
    }
  });
  // soft flow streaks between the strands
  const streaks: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const y = -1000 + i * 150 + 40 * Math.sin(i * 2.3);
    const L = 260 + 120 * Math.sin(i * 1.9);
    let x = ((-900 + i * 337 + speed * 1.6 * t) % 2400 + 2400) % 2400 - 1200;
    for (let k = -1; k <= 1; k++) {
      const xs = x + k * 2400;
      if (xs + L < xView[0] || xs > xView[1]) continue;
      const a = map(xs, y * conv(xs));
      const b = map(Math.min(xs + L, port ?? 1e9), y * conv(xs + L));
      streaks.push(<path key={`${i}_${k}`} d={`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`} stroke={STREAK} strokeWidth={fmt(10 * scale)} strokeLinecap="round" opacity={0.7} />);
    }
    void x;
  }
  return (
    <g>
      {streaks}
      {out}
    </g>
  );
};
