// Understory plants: a leaf is a curved, cupped blade with a raised midrib on its underside; a stem is a tapered
// tube. Leaves can dip (the bite and the ant's weight) and carry a local dent where jaws clamp the midrib.
import React from 'react';
import {add3, Basis, cross3, dot3, lerp3, mul3, norm3, P2, proj, projPoly, smoothClosed, smoothOpen, spline3, sub3, V3} from '../core/three';
import {tubeItem} from '../core/tube';
import {capsuleItem, inkW, Item} from '../core/draw3';
import {lit, mix, rgba, shade} from '../core/color';
import {INK} from '../core/ink';
import {rotA} from '../core/frame';

export type Leaf = {
  id: string;
  base: V3;
  dir: V3; // along the midrib at the base
  up: V3; // the top surface normal at the base
  L: number;
  Wd: number;
  droop: number; // deg of downward curl along the length
  cup: number; // mm the edges fall below the midrib
  dip?: number; // extra droop (deg), e.g. the ant's weight
  dent?: {u: number; d: number}; // a local pinch of the blade at u (mm)
  hue?: number; // 0 fresh .. 1 yellowed
  far?: number; // 0 near .. 1 atmospheric
};

export const LEAF_TOP = '#4E9445';
export const LEAF_UNDER = '#93BE7C';
export const STEM_COL = '#5C8C3E';

const N = 22;
/** sampled midrib: points, the along-axis and the top normal at each sample */
export const leafSpine = (lf: Leaf) => {
  const side = norm3(cross3(lf.up, lf.dir));
  const pts: V3[] = [lf.base];
  const ups: V3[] = [];
  const dirs: V3[] = [];
  let d = norm3(lf.dir);
  let up = norm3(lf.up);
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    // curl downward progressively (rotate about the side axis)
    const curl = ((lf.droop + (lf.dip ?? 0)) / N) * (0.4 + 1.6 * u);
    if (k > 0) {
      d = rotA(d, side, -curl);
      up = rotA(up, side, -curl);
      pts.push(add3(pts[k - 1], mul3(d, lf.L / N)));
    }
    dirs.push(d);
    ups.push(up);
  }
  return {pts, ups, dirs, side};
};
export const halfWidth = (lf: Leaf, u: number) => (lf.Wd / 2) * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, u), 0.72)), 0.85) * (1 - 0.12 * u);
/** a point on the blade: u along (0..1), v across (-1..1) */
export const leafPt = (lf: Leaf, sp: ReturnType<typeof leafSpine>, u: number, v: number): V3 => {
  const f = Math.min(N - 1e-6, Math.max(0, u * N));
  const k = Math.floor(f), t = f - k;
  const c = lerp3(sp.pts[k], sp.pts[k + 1], t);
  const up = norm3(lerp3(sp.ups[k], sp.ups[k + 1], t));
  const w = halfWidth(lf, u);
  let p = add3(c, add3(mul3(sp.side, v * w), mul3(up, -lf.cup * v * v)));
  if (lf.dent) {
    const g = Math.exp(-(((u - lf.dent.u) * lf.L) ** 2) / 2.5) * Math.exp(-((v * w) ** 2) / 1.2);
    p = add3(p, mul3(up, -lf.dent.d * g));
  }
  return p;
};
/** the midrib's centre on the underside at u, and its radius */
export const MIDRIB_DROP = 0.24;
export const midrib = (lf: Leaf, sp: ReturnType<typeof leafSpine>, u: number) => {
  const f = Math.min(N - 1e-6, Math.max(0, u * N));
  const k = Math.floor(f), t = f - k;
  const c = lerp3(sp.pts[k], sp.pts[k + 1], t);
  const up = norm3(lerp3(sp.ups[k], sp.ups[k + 1], t));
  const dir = norm3(lerp3(sp.dirs[k], sp.dirs[k + 1], t));
  const r = 0.34 * (1 - u) + 0.1;
  let cc = add3(c, mul3(up, -MIDRIB_DROP));
  if (lf.dent) cc = add3(cc, mul3(up, -lf.dent.d * Math.exp(-(((u - lf.dent.u) * lf.L) ** 2) / 2.5)));
  return {c: cc, r, up, dir};
};

const f2 = (n: number) => n.toFixed(2);
let lid = 0;
let lns = '';
export const resetLeafIds = (ns = '') => {
  lid = 0;
  lns = ns;
};
/** the blade (one item, pushed behind or in front of what hangs beneath it) and its underside midrib (segments) */
export const leafItems = (B: Basis, lf: Leaf, o: {fog?: number; key?: string} = {}): {blade: Item; under: boolean; rib: Item[]} => {
  const sp = leafSpine(lf);
  const M = 26;
  const edgeA: V3[] = [], edgeB: V3[] = [];
  for (let k = 0; k <= M; k++) {
    const u = k / M;
    edgeA.push(leafPt(lf, sp, u, 1));
    edgeB.push(leafPt(lf, sp, u, -1));
  }
  const ring3 = [...edgeA, ...edgeB.slice(1, -1).reverse()];
  const outline = ring3.map((p) => proj(B, p));
  // where the leaf reaches past the lens, clip it at the near plane (only the part behind the lens is cut)
  const NEAR = 2.5;
  const clipped = outline.some((q) => q.z < NEAR);
  const bladePath = clipped ? projPoly(B, ring3, NEAR) : smoothClosed(outline);
  if (!bladePath) return {blade: {z: -1, el: null}, under: false, rib: []};
  const front = (ps: V3[]) => ps.every((p) => proj(B, p).z > NEAR);
  const mid = leafPt(lf, sp, 0.45, 0);
  const C = proj(B, mid);
  const upMid = norm3(sp.ups[Math.round(N * 0.45)]);
  const under = dot3(upMid, sub3(B.eye, mid)) < 0;
  const fog = Math.max(o.fog ?? 0, lf.far ?? 0);
  const base0 = mix(under ? LEAF_UNDER : LEAF_TOP, '#B9A64A', (lf.hue ?? 0) * 0.5);
  const base = mix(base0, '#5E826A', fog * 0.75);
  const id = `${lns}lf${lid++}`;
  const s = C.s;
  const w = inkW(s, 0.85) * (1 - fog * 0.6);
  // veins: pairs of laterals curving toward the tip
  const veins: string[] = [];
  for (let k = 1; k <= 7; k++) {
    const u0 = 0.08 + k * 0.105;
    for (const sg of [1, -1]) {
      const p3 = [0, 0.35, 0.7, 0.92].map((v, j) => leafPt(lf, sp, Math.min(0.98, u0 + j * 0.055), sg * v));
      if (front(p3)) veins.push(smoothOpen(p3.map((p) => proj(B, p))));
    }
  }
  const rt3 = [0, 0.2, 0.4, 0.6, 0.8, 0.97].map((u) => leafPt(lf, sp, u, 0)).filter((p) => proj(B, p).z > NEAR);
  const ribTop = rt3.length > 1 ? smoothOpen(rt3.map((p) => proj(B, p))) : '';
  const lightDir = {x: -0.6, y: -0.8};
  const blade: Item = {
    z: C.z,
    el: (
      <g key={o.key ?? id}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(C.x + lightDir.x * s * lf.Wd * 0.6)} y1={f2(C.y + lightDir.y * s * lf.Wd * 0.6)} x2={f2(C.x - lightDir.x * s * lf.Wd * 0.6)} y2={f2(C.y - lightDir.y * s * lf.Wd * 0.6)}>
            <stop offset="0" stopColor={lit(base, under ? 0.18 : 0.3)} />
            <stop offset="0.5" stopColor={base} />
            <stop offset="1" stopColor={shade(base, under ? 0.3 : 0.42)} />
          </linearGradient>
        </defs>
        <path d={bladePath} fill={`url(#${id})`} stroke={INK} strokeOpacity={1 - fog * 0.7} strokeWidth={f2(w)} strokeLinejoin="round" />
        <g opacity={(under ? 0.55 : 0.45) * (1 - fog * 0.7)}>
          {veins.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={under ? lit(base, 0.4) : lit(base, 0.32)} strokeWidth={f2(Math.max(0.6, 0.12 * s))} strokeLinecap="round" />
          ))}
        </g>
        {!under && <path d={ribTop} fill="none" stroke={lit(base, 0.45)} strokeWidth={f2(Math.max(0.8, 0.22 * s))} strokeLinecap="round" opacity={0.75 * (1 - fog * 0.7)} />}
      </g>
    ),
  };
  // the raised midrib under the blade: one smooth tapering tube
  const rib: Item[] = [];
  if (under) {
    const us = Array.from({length: 25}, (_, k) => (k / 24) * 0.95);
    // the part of the midrib in front of the lens (a contiguous run)
    const ms = us.map((u) => midrib(lf, sp, u)).filter((m) => proj(B, m.c).z > NEAR + 0.5);
    if (ms.length > 1) rib.push(tubeItem(B, ms.map((m) => m.c), ms.map((m) => m.r), mix(mix(base, '#C4DE8E', 0.55), '#5E826A', fog * 0.5), {key: `${id}r`, spec: 0.35, ink: Math.max(0.8, w * 0.95), inkOpacity: 1 - fog * 0.6}));
  }
  return {blade, under, rib};
};

/** a stem along points (tapered): one smooth tube through a spline of the points */
export const stemItems = (B: Basis, pts: V3[], r0: number, r1: number, col = STEM_COL, key = 'st', fog = 0): Item[] => {
  const c = mix(col, '#5E826A', fog * 0.75);
  const sp = spline3(pts, 4);
  const rads = sp.map((_, k) => r0 + ((r1 - r0) * k) / (sp.length - 1));
  return [tubeItem(B, sp, rads, c, {key, spec: 0.5, inkOpacity: 1 - fog * 0.6})];
};
