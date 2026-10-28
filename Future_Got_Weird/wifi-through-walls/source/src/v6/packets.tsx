// V4 radio drawing shared by the lab and the café: a packet is a short train of oscillation travelling along a ray
// (never a beam or a ring). Outgoing packets are pale cyan; echoes (energy scattered back by a body) are warm yellow,
// with their oscillation shaped by how that body part moves.
import React from 'react';
import {add3, B, depth, norm3, proj, scaleAt, sub3, v3, V3} from '../world/cam';
import {clamp, f1} from '../lib';

export type Pk = {c: V3; dir: V3; amp: number; freq: number; col: string; a: number};
export const OUT = '#BFF4FF', ECHO = '#FFE27A';
/** position after travelling r metres along A->Bp (no walls) */
export const along = (A: V3, Bp: V3, r: number) => {
  const L = Math.hypot(Bp.x - A.x, Bp.y - A.y, Bp.z - A.z) || 1e-6;
  const u = Math.min(1, r / L);
  return {p: v3(A.x + (Bp.x - A.x) * u, A.y + (Bp.y - A.y) * u, A.z + (Bp.z - A.z) * u), done: r >= L, total: L, dir: norm3(sub3(Bp, A))};
};
export const PacketDraw: React.FC<{b: B; t: number; list: Pk[]; show?: number; len?: number}> = ({b, t, list, show = 1, len = 0.15}) => (
  <g style={{mixBlendMode: 'screen'}}>
    {list.map((q, i) => {
      if (depth(b, q.c) < 0.15) return null;
      const A = proj(b, add3(q.c, v3(-q.dir.x * len, -q.dir.y * len, -q.dir.z * len))), Bp = proj(b, q.c);
      const dx = Bp.x - A.x, dy = Bp.y - A.y;
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const k = scaleAt(b, q.c);
      const pts: string[] = [];
      for (let j = 0; j <= 30; j++) {
        const s = j / 30;
        const o = Math.sin(s * (q.freq / 16) * Math.PI * 2 - t * 20) * q.amp * k * Math.sin(Math.PI * s);
        pts.push(`${f1(A.x + dx * s + nx * o)},${f1(A.y + dy * s + ny * o)}`);
      }
      const w = Math.max(1.3, k * 0.0045);
      return (
        <g key={i} opacity={clamp(q.a * show)}>
          <polyline points={pts.join(' ')} fill="none" stroke={q.col} strokeWidth={f1(w * 4)} opacity={0.18} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pts.join(' ')} fill="none" stroke={q.col} strokeWidth={f1(w)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);
/** data exchanged on a link (router <-> a device): small dots running along a gentle arc, both ways */
export const LinkDots: React.FC<{b: B; t: number; A: V3; Bp: V3; show?: number; seed?: number}> = ({b, t, A, Bp, show = 1, seed = 0}) => {
  const mid = v3((A.x + Bp.x) / 2, Math.max(A.y, Bp.y) + 0.25, (A.z + Bp.z) / 2);
  const at = (u: number) => {
    const a = (1 - u) * (1 - u), c = 2 * u * (1 - u), d = u * u;
    return v3(A.x * a + mid.x * c + Bp.x * d, A.y * a + mid.y * c + Bp.y * d, A.z * a + mid.z * c + Bp.z * d);
  };
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const dir = i % 2;
    const u = ((t * 0.9 + i / 6 + seed * 0.13) % 1 + 1) % 1;
    const p = at(dir ? 1 - u : u);
    if (depth(b, p) < 0.15) continue;
    const P = proj(b, p), k = scaleAt(b, p);
    out.push(<circle key={i} cx={f1(P.x)} cy={f1(P.y)} r={f1(Math.max(1.5, k * 0.012))} fill={dir ? '#7CFFB2' : OUT} opacity={show * Math.sin(Math.PI * u)} />);
  }
  return <g style={{mixBlendMode: 'screen'}}>{out}</g>;
};
