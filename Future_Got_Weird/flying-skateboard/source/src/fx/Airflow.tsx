// Downward airflow under the ten ducts: faint, thin streaks that leave each duct exit and run down along the board's
// own -y axis, spreading a little as they go (subtle atmospheric streaks, not thrust beams). They scroll with time, so
// the air visibly moves; their length and opacity follow the thrust.
import React from 'react';
import {BD, ductWorld} from '../art/Board';
import {hash} from '../dc/math';
import {f2} from '../eng/draw';
import {a3, d3, Frame, Lens, m3, s3} from '../eng/v3';

export const Airflow: React.FC<{L: Lens; B: Frame; t: number; thrust: number; reach?: number; alpha?: number}> = ({L, B, t, thrust, reach = 1.6, alpha = 1}) => {
  if (thrust < 0.05) return null;
  const segs: string[] = [];
  const segs2: string[] = [];
  const down = m3(B.y, -1);
  for (let i = 0; i < BD.ducts.length; i++) {
    for (let k = 0; k < 4; k++) {
      const h = hash(i * 13 + k, 51);
      const ang = h * Math.PI * 2;
      const rr = BD.ductR * (0.25 + 0.6 * hash(i * 7 + k, 52));
      const off = a3(m3(B.x, Math.cos(ang) * rr), m3(B.z, Math.sin(ang) * rr));
      const start = a3(ductWorld(B, i, -BD.thick), off);
      const len = reach * thrust;
      const ph = (t * (2.2 + thrust * 2) + h) % 1;
      const a0 = ph * len, a1 = Math.min(len, a0 + 0.35 * len);
      const spread = (d: number) => a3(a3(start, m3(down, d)), m3(off, d * 0.35));
      const p0 = spread(a0), p1 = spread(a1);
      if (d3(s3(p0, L.pos), L.f) < 0.3 || d3(s3(p1, L.pos), L.f) < 0.3) continue;
      const q0 = L.p(p0), q1 = L.p(p1);
      (k % 2 ? segs2 : segs).push(`M${f2(q0.x)},${f2(q0.y)}L${f2(q1.x)},${f2(q1.y)}`);
    }
  }
  const k = L.p(B.o).k;
  const w = Math.max(0.8, Math.min(3, 0.012 * k));
  return (
    <g opacity={alpha * Math.min(1, thrust * 1.2)}>
      <path d={segs.join('')} stroke="#FFFFFF" strokeOpacity={0.42} strokeWidth={f2(w)} strokeLinecap="round" fill="none" />
      <path d={segs2.join('')} stroke="#DDEFF6" strokeOpacity={0.3} strokeWidth={f2(w * 0.7)} strokeLinecap="round" fill="none" />
    </g>
  );
};
