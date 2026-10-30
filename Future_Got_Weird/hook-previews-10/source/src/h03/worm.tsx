// HOOK 03: the horsehair worm (Nematomorpha, e.g. Chordodes): a smooth, unsegmented, dark brown thread about 1 mm
// thick and 300 mm long (about four mantis lengths), no legs, no eyes, a rounded slightly paler head end.
// Material coordinate s runs from the head (0) to the tail (WORM_L). e(t) is the length already outside.
// Outside, the worm follows a track that its head lays down in the water (u = distance from the exit), with a
// travelling sinuous ripple and a searching head. Inside, the rest lies coiled in the abdomen and slides out along
// its own coil path, so the coil shortens from its far end as the worm leaves.
import React from 'react';
import {Basis, proj, smoothOpen, V3} from '../shared/three';
import {clamp, keyCR, sm} from '../shared/lib';
import {Item, inkW} from './core/draw3';
import {Frame, toW} from './core/frame';
import {lit, mix, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {EV} from './timeline';

export const WORM_L = 300;
export const WORM_R = 0.5;
export const WCOL = {body: '#3F2C20', tip: '#B8A27C', inner: '#4B3426'};
const f2 = (n: number) => n.toFixed(2);
const g = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));

/** length outside the host (mm) */
export const emerged = (t: number) =>
  t <= EV.emerge
    ? 0
    : Math.max(0, keyCR(t, [[EV.emerge, 0], [EV.water, 12], [2.5, 30], [EV.crawls, 56], [3.55, 100], [EV.body, 142], [4.5, 170], [5.2, 205], [6.0, 232], [6.6, 248]]));

/** the track's heading (deg) against distance from the exit: out behind the host, down, a long sweep under it, then a
 *  hook back with the head end searching (an S that keeps the whole length readable in one frame) */
const HEAD_K: [number, number][] = [[0, 172], [20, 196], [45, 252], [72, 300], [100, 338], [128, 362], [150, 345], [170, 300], [190, 235], [210, 185], [232, 160], [255, 185], [280, 215], [300, 200]];
const TH_REF = (172 * Math.PI) / 180;
const heading = (u: number, t: number) => ((keyCR(u, HEAD_K) + 4 * Math.sin(0.8 * t + u / 45) * Math.min(1, u / 80)) * Math.PI) / 180;

/** world points of the outside worm, head first (s = 0, 1, 2 ... e) */
export const outsidePts = (t: number, e: number, E: V3, D0: V3): {p: V3; s: number; u: number}[] => {
  if (e <= 0.05) return [];
  const du = 0.5;
  const n = Math.ceil(e / du) + 2;
  const th0 = Math.atan2(D0[2], D0[0]);
  const TX: number[] = [E[0]], TZ: number[] = [E[2]], TH: number[] = [th0];
  for (let i = 1; i <= n; i++) {
    const u = i * du;
    const th = heading(u, t) + (th0 - TH_REF) * Math.exp(-u / 25);
    TH.push(th);
    TX.push(TX[i - 1] + Math.cos(th) * du);
    TZ.push(TZ[i - 1] + Math.sin(th) * du);
  }
  const at = (u: number) => {
    const x = clamp(u / du, 0, n - 1e-6), i = Math.floor(x), f = x - i;
    return {x: TX[i] + (TX[i + 1] - TX[i]) * f, z: TZ[i] + (TZ[i + 1] - TZ[i]) * f, th: TH[i] + (TH[i + 1] - TH[i]) * f};
  };
  const out: {p: V3; s: number; u: number}[] = [];
  const N = Math.max(2, Math.ceil(e));
  for (let k = 0; k <= N; k++) {
    const s = (k / N) * e;
    const u = e - s;
    const q = at(u);
    const ramp = clamp(u / 14);
    const hs = s < 28 ? (1 - s / 28) ** 2 : 0;
    const off = 1.1 * ramp * Math.sin(0.26 * s - 5.2 * t) + 2.4 * hs * ramp * Math.sin(4.5 * t - 0.2 * s);
    const y = E[1] + D0[1] * Math.min(u, 8) + 8 * Math.sin(u / 45 - 0.6) * sm(u / 40) + 2.0 * hs * ramp * Math.cos(3.7 * t - 0.2 * s);
    out.push({p: [q.x - Math.sin(q.th) * off, y, q.z + Math.cos(q.th) * off], s, u});
  }
  return out;
};

/** the coil path inside the abdomen (body coordinates), v = distance in from the exit */
export const coilPt = (v: number, sMat: number, t: number): V3 => {
  if (v < 6) return [-48.2 + v, 0, -0.2 + 0.05 * v];
  const w = v - 6;
  const x = -42.2 + 12.5 * (1 - Math.cos((Math.PI * w) / 150));
  // a loose, irregular double coil (outer layer forward, inner layer back), not a tidy spring
  const r = (3.0 - 1.3 * sm((w - 130) / 40)) * (1 + 0.14 * Math.sin(w / 7.3) + 0.06 * Math.sin(w / 3.1));
  const ramp = sm(w / 6);
  const ph = w / 2.35 + 0.6 * Math.sin(w / 11);
  const wig = 0.28 * Math.sin(0.5 * sMat - 3.1 * t);
  return [x + 0.9 * Math.sin(w / 9) + 0.3 * Math.sin(w / 4.1), r * ramp * Math.cos(ph) * 1.1, 0.3 + (r * ramp * Math.sin(ph) * 0.85 + wig) * 0.95];
};

type WP = {x: number; y: number; s: number; z: number};

/** Catmull-Rom subdivision of a screen polyline (k points per span), so every chunk is cut from ONE smooth curve */
const densify = (P: WP[], k: number): WP[] => {
  const out: WP[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const u = j / k, u2 = u * u, u3 = u2 * u;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push({x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y), s: p1.s + (p2.s - p1.s) * u, z: p1.z + (p2.z - p1.z) * u});
    }
  }
  out.push(P[P.length - 1]);
  return out;
};
const poly = (pts: {x: number; y: number}[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f2(p.x)},${f2(p.y)}`).join(' ');
const DK = 3; // dense points per sample

/** one stroked chunk: ink on its own range, the body extended a sample either side so joints never show a seam */
const chunkEl = (P: WP[], a: number, b: number, key: string, col: string, tipCol: string | null, inkOp = 1, sAll?: number) => {
  const seg = (i0: number, i1: number) => P.slice(Math.max(0, i0), Math.min(P.length, i1 + 1));
  const core = seg(a, b), ext = seg(a - DK, b + DK);
  if (core.length < 2) return null;
  const sMean = sAll ?? core.reduce((q, p) => q + p.s, 0) / core.length;
  const w = Math.max(1.2, 2 * WORM_R * sMean);
  const iw = inkW(sMean, 0.75);
  // the light side offset for the highlight (normals from the whole curve, so overlapping chunks agree exactly)
  const i0 = Math.max(0, a - DK), i1 = Math.min(P.length - 1, b + DK);
  const offs = (k: number) => {
    const out: {x: number; y: number}[] = [];
    for (let i = i0; i <= i1; i++) {
      const q0 = P[Math.max(0, i - 1)], q1 = P[Math.min(P.length - 1, i + 1)];
      let nx = -(q1.y - q0.y), ny = q1.x - q0.x;
      const l = Math.hypot(nx, ny) || 1;
      nx /= l; ny /= l;
      if (nx * -0.62 + ny * -0.78 < 0) { nx = -nx; ny = -ny; }
      out.push({x: P[i].x + nx * k * w, y: P[i].y + ny * k * w});
    }
    return out;
  };
  const d = poly(core), de = poly(ext);
  return (
    <g key={key}>
      <path d={d} fill="none" stroke={INK} strokeOpacity={inkOp} strokeWidth={f2(w + 2 * iw)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={de} fill="none" stroke={col} strokeWidth={f2(w)} strokeLinecap="butt" strokeLinejoin="round" />
      {(a === 0 || b === P.length - 1) && <circle cx={f2(P[a === 0 ? 0 : P.length - 1].x)} cy={f2(P[a === 0 ? 0 : P.length - 1].y)} r={f2(w / 2)} fill={col} />}
      {w > 2.5 && <path d={poly(offs(-0.2))} fill="none" stroke={mix(col, shade(col, 0.45), 0.8)} strokeWidth={f2(w * 0.38)} strokeLinecap="butt" strokeLinejoin="round" />}
      {w > 2 && <path d={poly(offs(0.2))} fill="none" stroke={mix(col, lit(col, 0.42), 0.75)} strokeWidth={f2(Math.max(0.6, w * 0.22))} strokeLinecap="butt" strokeLinejoin="round" />}
      {tipCol && core.length > 1 && (
        <g>
          <path d={poly(core.slice(0, Math.min(core.length, 4 * DK)))} fill="none" stroke={mix(col, tipCol, 0.45)} strokeWidth={f2(w * 0.9)} strokeLinecap="round" />
          <path d={poly(core.slice(0, Math.min(core.length, 2 * DK)))} fill="none" stroke={mix(col, tipCol, 0.8)} strokeWidth={f2(w * 0.86)} strokeLinecap="round" />
          <path d={poly(core.slice(0, Math.min(core.length, DK)))} fill="none" stroke={tipCol} strokeWidth={f2(w * 0.8)} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/** the outside worm as depth-sorted items (chunks of ~5 mm) */
export const wormItems = (B: Basis, pts: {p: V3; s: number; u: number}[], tint: number): Item[] => {
  if (pts.length < 2) return [];
  const P: WP[] = densify(pts.map((q) => proj(B, q.p)), DK);
  const col = mix(WCOL.body, '#2F5F60', 0.12 * tint);
  const items: Item[] = [];
  const CH = 5 * DK;
  const sAll = P.reduce((q, p) => q + p.s, 0) / P.length;
  for (let a = 0; a < P.length - 1; a += CH) {
    const b = Math.min(P.length - 1, a + CH);
    const zs = P.slice(a, b + 1).reduce((q, p) => q + p.z, 0) / (b - a + 1);
    const uMin = Math.min(...pts.slice(Math.floor(a / DK), Math.ceil(b / DK) + 1).map((q) => q.u));
    const el = chunkEl(P, a, b, `w${a}`, col, a === 0 ? WCOL.tip : null, 1, sAll);
    if (el) items.push({z: zs + (uMin < 5 ? -6 : 0), el});
  }
  return items;
};

/** the coiled worm still inside, drawn in the abdomen window (body frame F), sorted far to near */
export const coilEl = (B: Basis, F: Frame, t: number, e: number) => {
  const inside = WORM_L - e;
  if (inside < 1) return null;
  const N = Math.ceil(inside / 1.2);
  const P0: WP[] = [];
  for (let k = 0; k <= N; k++) {
    const v = (k / N) * inside;
    P0.push(proj(B, toW(F, coilPt(v, e + v, t))));
  }
  const P = densify(P0, DK);
  const chunks: {z: number; el: React.ReactNode}[] = [];
  const CH = 5 * DK;
  const sC = P.reduce((q, p) => q + p.s, 0) / P.length;
  for (let a = 0; a < P.length - 1; a += CH) {
    const b = Math.min(P.length - 1, a + CH);
    const zs = P.slice(a, b + 1).reduce((q, p) => q + p.z, 0) / (b - a + 1);
    // the far side of the coil is seen through more tissue
    const el = chunkEl(P, a, b, `c${a}`, WCOL.inner, null, 0.7, sC);
    chunks.push({z: zs, el});
  }
  const zMin = Math.min(...chunks.map((c) => c.z)), zMax = Math.max(...chunks.map((c) => c.z));
  return (
    <g>
      {chunks.sort((p, q) => q.z - p.z).map((c, i) => (
        <g key={i} opacity={0.55 + 0.45 * (1 - (c.z - zMin) / (zMax - zMin || 1))}>{c.el}</g>
      ))}
    </g>
  );
};
