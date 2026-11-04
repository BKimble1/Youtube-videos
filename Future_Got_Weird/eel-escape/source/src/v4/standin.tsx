// A quick stand-in predator (lofted ellipses, flat olive with an ink outline) for blocking cameras and eel motion
// before the real 3D model (art/pred3d.tsx) is ready. Not used in the film.
import React from 'react';
import {DORSAL, VENTRAL} from '../anatomy';
import {Basis, proj, V3} from './three';
import {INK} from '../art/palette';

const prof = (P: {x: number; y: number}[], x: number) => {
  if (x <= P[0].x) return P[0].y;
  for (let i = 1; i < P.length; i++) if (x <= P[i].x) { const f = (x - P[i - 1].x) / (P[i].x - P[i - 1].x); return P[i - 1].y + f * (P[i].y - P[i - 1].y); }
  return P[P.length - 1].y;
};
export const halfW = (x: number) => {
  const k: [number, number][] = [[-51, 1.5], [-46, 5.0], [-36, 7.3], [-28, 7.5], [-15, 6.8], [0, 5.5], [20, 3.4], [33, 1.8], [50, 0.5]];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) { const f = (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[i - 1][1] + f * (k[i][1] - k[i - 1][1]); }
  return 0.5;
};
export const StandInFish: React.FC<{B: Basis}> = ({B}) => {
  const rings: string[] = [];
  for (let x = -50.5; x <= 33; x += 0.75) {
    const top = prof(DORSAL, x), bot = prof(VENTRAL, x), yc = (top + bot) / 2, h = (bot - top) / 2, w = halfW(x);
    const pts = Array.from({length: 24}, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const p = proj(B, [x, yc + h * Math.sin(a), w * Math.cos(a)] as V3);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    rings.push(`M${pts.join('L')}Z`);
  }
  // caudal fin: a flat fan
  const fan = [[33, -5.9], [44, -9.5], [50, -6], [51, 0], [50, 6], [44, 9.5], [33, 5.9]].map(([x, y]) => proj(B, [x, y, 0])).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  const eye = proj(B, [-40.6, -7.0, 6.2]);
  const exit = proj(B, [-23.55, -6.35, 6.4]);
  const d = rings.join('');
  return (
    <g>
      <path d={`M${fan.join('L')}Z`} fill="#B58A45" stroke={INK} strokeWidth={3} />
      <path d={d} fill="none" stroke={INK} strokeWidth={6} />
      <path d={d} fill="#7C6A44" />
      <circle cx={eye.x} cy={eye.y} r={2.4 * eye.s} fill="#D9A23A" stroke={INK} strokeWidth={2} />
      <circle cx={exit.x} cy={exit.y} r={5} fill="#B8323A" />
    </g>
  );
};
