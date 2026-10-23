// V3 prop: the guard's handcuffs. Two steel rings joined by a short chain, drawn in 3D from the hand that holds one
// ring (the other hangs and swings under gravity), with the hanging ring's jaw rotating open about its hinge for the
// click. On the belt the pouch on his left hip holds them (drawn by Person3); nothing sticks out.
import React from 'react';
import {INK} from '../lib/ink';
import {a3, Basis, c3, d3, fmt, m3, n3, proj, V3, v3} from '../v2/p3';

export type CuffsState = {where: 'hand' | 'belt'; open: number; swing: number};

const STEEL = '#C9CED8', STEEL_DK = '#7D8594';

export const Cuffs: React.FC<{id: string; b: Basis; st: CuffsState; wrist: V3; dir: V3; palm: V3; ink: number}> = ({b, st, wrist, dir, palm, ink}) => {
  if (st.where !== 'hand') return null;
  const r = 0.034, bar = 0.0075;
  // ring A sits in the fist, its plane across the fingers
  const ca = a3(wrist, m3(dir, 0.075));
  const ua = n3(dir), va = n3(c3(palm, ua));
  // ring B hangs below on a 4 cm chain, swinging about the hanging direction
  const down = v3(0, -1, 0);
  const side = n3(c3(down, va.y > 0.9 ? v3(1, 0, 0) : va));
  const hang = n3(a3(down, m3(side, Math.sin(st.swing) * 0.6)));
  const linkA = a3(ca, m3(down, r));
  const cb = a3(linkA, m3(hang, 0.04 + r));
  const ub = hang, vb = n3(c3(ub, v3(0.3, 0, 1)));
  const circ = (c: V3, u: V3, w: V3, a0: number, a1: number, n = 18) => Array.from({length: n + 1}, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return a3(c, a3(m3(u, Math.cos(a) * r), m3(w, Math.sin(a) * r)));
  });
  const P = (pts: V3[]) => pts.map((p) => proj(b, p));
  const line = (pts: {x: number; y: number}[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join('');
  const k = proj(b, ca).k;
  const w = Math.max(1.2, bar * k);
  // ring B: the fixed half (with the hinge at angle pi) and the swinging jaw rotating open about the hinge
  const hinge = a3(cb, m3(ub, -r));
  const jaw = circ(cb, ub, vb, -Math.PI * 0.95, Math.PI * 0.95, 22).map((p, i, arr) => {
    const f = i / (arr.length - 1);
    if (f < 0.5) return p;
    // rotate the jaw half about the hinge, in the ring's plane
    const ang = st.open * 2.3 * Math.min(1, (f - 0.5) * 4);
    const rel = v3(p.x - hinge.x, p.y - hinge.y, p.z - hinge.z);
    const x = d3(rel, ub), y = d3(rel, vb);
    const xr = x * Math.cos(ang) - y * Math.sin(ang), yr = x * Math.sin(ang) + y * Math.cos(ang);
    return a3(hinge, a3(m3(ub, xr), m3(vb, yr)));
  });
  const ringA = circ(ca, ua, va, 0, Math.PI * 2, 22);
  const chain = [linkA, a3(linkA, m3(hang, 0.02)), a3(linkA, m3(hang, 0.04))];
  const stroke = (pts: V3[], key: string) => (
    <g key={key}>
      <path d={line(P(pts))} fill="none" stroke={INK} strokeWidth={w + ink * 1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(P(pts))} fill="none" stroke={STEEL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(P(pts))} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(0.6, w * 0.3)} strokeLinecap="round" opacity={0.55} />
    </g>
  );
  return (
    <g>
      {stroke(chain, 'ch')}
      {stroke(jaw, 'jb')}
      {stroke(ringA, 'ra')}
      <circle cx={fmt(proj(b, hinge).x)} cy={fmt(proj(b, hinge).y)} r={fmt(w * 0.9)} fill={STEEL_DK} stroke={INK} strokeWidth={ink * 0.6} />
    </g>
  );
};
