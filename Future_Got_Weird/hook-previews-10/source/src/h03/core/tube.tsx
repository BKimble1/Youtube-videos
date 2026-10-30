// Tapered tube copied from Future_Got_Weird/zombie-ant/source/src/core/tube.tsx (imports pointed at the shared modules).
import React from 'react';
import {Basis, proj, smoothClosed, smoothOpen, V3} from '../../shared/three';
import {inkW, Item} from './draw3';
import {lit, shade} from '../../shared/color';
import {INK} from '../../shared/ink';

const f2 = (n: number) => n.toFixed(2);
let tid = 0;
let tns = '';
export const resetTubeIds = (ns = '') => {
  tid = 0;
  tns = ns;
};
/** outline points of a tube with per-point radii (mm), rounded ends */
export const tubeOutline = (B: Basis, pts: V3[], rads: number[]) => {
  const P = pts.map((p) => proj(B, p));
  const L: {x: number; y: number}[] = [], R: {x: number; y: number}[] = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const r = Math.max(0.6, rads[k] * P[k].s);
    L.push({x: P[k].x - ty * r, y: P[k].y + tx * r});
    R.push({x: P[k].x + ty * r, y: P[k].y - tx * r});
  }
  const cap = (k: number, dir: number) => {
    const q = P[k], o = P[k - dir];
    let tx = q.x - o.x, ty = q.y - o.y;
    const tl = Math.hypot(tx, ty) || 1;
    const r = Math.max(0.6, rads[k] * q.s);
    return {x: q.x + (tx / tl) * r * 0.9, y: q.y + (ty / tl) * r * 0.9};
  };
  const n = P.length;
  return {P, L, R, outline: [cap(0, -1), ...L, cap(n - 1, 1), ...[...R].reverse()]};
};
export const tubeItem = (B: Basis, pts: V3[], rads: number[], color: string, o: {z?: number; key?: string; ink?: number; inkOpacity?: number; spec?: number} = {}): Item => {
  const P0 = pts.map((p) => proj(B, p));
  if (P0.some((q) => q.z < 2)) return {z: -1, el: null};
  const {P, L, outline} = tubeOutline(B, pts, rads);
  const id = `${tns}tb${tid++}`;
  const s = P[Math.floor(P.length / 2)].s;
  const w = o.ink ?? inkW(s * Math.max(...rads) * 2.5, 0.85);
  const mid = Math.floor(P.length / 2);
  const ax = P[Math.min(P.length - 1, mid + 1)], bx = P[Math.max(0, mid - 1)];
  let nx = -(ax.y - bx.y), ny = ax.x - bx.x;
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl; ny /= nl;
  if (nx * -0.6 + ny * -0.8 < 0) { nx = -nx; ny = -ny; }
  const r = rads[mid] * P[mid].s;
  return {
    z: o.z ?? P.reduce((a, q) => a + q.z, 0) / P.length,
    el: (
      <g key={o.key ?? id}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(P[mid].x + nx * r)} y1={f2(P[mid].y + ny * r)} x2={f2(P[mid].x - nx * r)} y2={f2(P[mid].y - ny * r)}>
            <stop offset="0" stopColor={lit(color, 0.2)} />
            <stop offset="0.45" stopColor={color} />
            <stop offset="1" stopColor={shade(color, 0.35)} />
          </linearGradient>
        </defs>
        <path d={smoothClosed(outline)} fill={`url(#${id})`} stroke={INK} strokeOpacity={o.inkOpacity ?? 1} strokeWidth={f2(w)} strokeLinejoin="round" />
        {(o.spec ?? 0.5) > 0 && (
          <path d={smoothOpen(L.map((q, k) => ({x: q.x * 0.55 + P[k].x * 0.45, y: q.y * 0.55 + P[k].y * 0.45})))} fill="none" stroke="#FFFFFF" strokeWidth={f2(Math.max(0.6, r * 0.28))} strokeLinecap="round" opacity={0.3 * (o.spec ?? 0.5) * 2} />
        )}
      </g>
    ),
  };
};
