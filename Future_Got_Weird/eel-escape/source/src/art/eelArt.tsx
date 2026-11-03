// The eel: a juvenile Japanese eel (Anguilla japonica) drawn along its kinematic samples (eel.ts: 121 points,
// snout → tail tip, already projected to the layer's units) as ONE connected, round, slate-blue animal.
//
// How it is built (Weird Crew finish, cheap enough for 744 frames):
// - Geometry is computed on the FULL sample array every time (tangents, normals, curvature, side radii), so any
//   section [from, to] is cut from the same curves and consecutive sections meet exactly. A rounded snout cap is
//   grafted in front of sample KH (the longitudes converge at the snout tip like meridians at a pole).
// - The body is a stack of nested strips between offset curves at fixed cross-section positions s ∈ [-1, 1]
//   (Catmull-Rom curves, split exactly at fractional cut points): pigment strips (dark slate back on the `dorsal`
//   side, steel flank, pale belly), then light strips from ONE key light at the upper left (core shadow with a
//   reflected-light rim, broad light, a wet specular streak), a faint lateral line, and the ink silhouette.
//   About 20 paths per chunk, no gradients, no filters.
// - Inner sides of tight bends are softly clamped to the local curvature radius (no offset folds); where the body
//   crosses over itself it is split into chunks drawn in body order (the tail-ward part on top by default), each
//   with its own ink sides, so the crossing shows which part is on top. Cut ends carry no ink and no cap; a chunk
//   or section drawn later overlaps the earlier one by ~1.6 px so no anti-aliasing seam can show.
// - The continuous ribbon fin (dorsal from u ≈ 0.40, anal from u ≈ 0.47) sits behind the body and wraps around the
//   pointed tail tip as a narrow fringe (never a fan).
import React from 'react';
import {P} from '../core/geo';
import {uid} from '../core/ids';
import {lit, mix, shade} from '../core/color';
import {EEL_FEAT} from '../anatomy';
import {C, INK, INK_PX, NS} from './palette';

export type EelProps = {
  /** body samples snout (index 0) → tail tip (last), in the layer's units (P3 points are fine: z is ignored) */
  pts: P[];
  /** body radius at each sample (eel.ts RADII), same units */
  radii: number[];
  /** first sample of the section to draw (fractional allowed); 0 = from the snout (the head is drawn only then) */
  from?: number;
  /** last sample of the section (inclusive, fractional allowed); default the tail tip (the tail point and the fin
   *  fringe around it are drawn only then). Consecutive sections share their boundary: A.to === B.from. */
  to?: number;
  /** screen pixels per unit of this layer (1080 / cam.w · layer scale) */
  px: number;
  /** time (s): the ribbon fin's ripple and the pectoral fin's fanning */
  t: number;
  /** which side the dark back is on: 1 (default) = the left of the snout→tail direction (a left-facing eel shows
   *  its back up; the opening's rising tail shows it on its upper/outer side), -1 = the other side. Any value in
   *  between rolls the body about its long axis (0 = the back faces the viewer), so a flip can be animated. */
  dorsal?: number;
  opacity?: number;
  /** clip: a path `d` in the layer's units (e.g. gillGapPath(s)), or a ready `url(#id)` reference */
  clip?: string;
  /** where the body crosses over itself: which end's part lies on top (default 'tail') */
  over?: 'tail' | 'head';
};

// ---------------------------------------------------------------- constants
const HP = Math.PI / 2;
const DEG = Math.PI / 180;
/** the key light: screen direction toward it (upper left) and its elevation toward the viewer */
const LL = Math.hypot(0.62, 0.78);
const LX = -0.62 / LL, LY = -0.78 / LL;
const ELEV = 38 * DEG;
const CE = Math.cos(ELEV), SE = Math.sin(ELEV);
/** the snout cap replaces samples 0..KH with CAP_N stations on a half-ellipse */
const KH = 3;
const CAP_N = 9;
/** ribbon fin heights (units) */
const FIN_D = EEL_FEAT.finH * 0.62;
const FIN_A = EEL_FEAT.finH * 0.56;
const TIP_EXT = 0.3;

const WHITE = '#FFFFFF';
/** the shadow tint: a deep cool slate, so the shadowed pale belly stays blue-grey instead of going muddy */
const SHADOW = mix(INK, C.eelBack, 0.45);
const FIN_FILL = mix(C.eelBack, C.eelFin, 0.35);
const LATERAL = lit(C.eelFlank, 0.3);
const EYE_RING = mix(C.eelBelly, C.eelFin, 0.35);

// pigment: angle ψ from the dorsal midline → colour (dark back, steel flank, pale belly)
const smoothRange = (d: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (d - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const pigment = (psiDeg: number) =>
  psiDeg < 100 ? mix(C.eelBack, C.eelFlank, smoothRange(psiDeg, 42, 98)) : mix(C.eelFlank, C.eelBelly, smoothRange(psiDeg, 124, 166));
const rgbOf = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
/** nested pigment strips (each covers ψ < bound around the dorsal midline, painted over the previous), with bounds
 *  chosen so every step changes the colour by the same amount (no visible banding where the ramp is steep) */
const PIG: {bound: number; col: string}[] = (() => {
  const K = 15;
  const ds: number[] = [0];
  let prev = rgbOf(pigment(180));
  for (let d = 179.5; d >= 0; d -= 0.5) {
    const c = rgbOf(pigment(d));
    ds.push(ds[ds.length - 1] + Math.hypot(c[0] - prev[0], c[1] - prev[1], c[2] - prev[2]));
    prev = c;
  }
  const total = ds[ds.length - 1];
  const psiAt = (k: number) => 180 - 0.5 * ds.findIndex((v) => v >= k);
  const out: {bound: number; col: string}[] = [];
  for (let k = 1; k <= K; k++) {
    const b = psiAt((total * (k - 0.5)) / K);
    const mid = psiAt((total * Math.min(K, k)) / K);
    out.push({bound: b * DEG, col: pigment(mid)});
  }
  return out;
})();
const PIG_BASE = pigment(180);

// light levels (normalised diffuse thresholds), each a strip, stacked: a soft core shadow with a reflected-light rim
// on the side away from the light, a faint broad light, and the wet specular streak (halo + core)
const SHADOWS: {th: number; op: number; rim: number}[] = [0.62, 0.48, 0.34, 0.2, 0.06, -0.08, -0.22].map((th, i) => ({
  th,
  op: 0.078,
  rim: i < 4 ? 0 : (6 + 5 * (i - 4)) * DEG,
}));
const LIGHTS: {th: number; op: number}[] = [
  {th: 0.8, op: 0.035},
  {th: 0.92, op: 0.045},
];

// ---------------------------------------------------------------- small math
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clampPhi = (p: number) => (p < -HP ? -HP : p > HP ? HP : p);
const sOf = (phi: number) => Math.sin(clampPhi(phi));
const wrap = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x), f = x - i;
  const a = hashN(i + seed * 57.3), b = hashN(i + 1 + seed * 57.3);
  return a + (b - a) * f * f * (3 - 2 * f);
};

// ---------------------------------------------------------------- the body frame (computed on the full array)
type Geo = {
  nS: number;
  M: number;
  c: P[];
  n: P[];
  tg: P[];
  r: number[];
  rp: number[];
  rm: number[];
  u: number[];
  idx: number[];
  kap: number[];
  al: number[];
  /** sample arc length (units), per sample */
  arcS: number[];
};

const build = (pts: P[], radii: number[]): Geo => {
  const nS = pts.length;
  // tangents (central differences, guarded against repeated points)
  const T: P[] = new Array(nS);
  for (let i = 0; i < nS; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(nS - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    T[i] = l > 1e-9 ? {x: dx / l, y: dy / l} : i > 0 ? T[i - 1] : {x: 0, y: 0};
  }
  let firstOk = T.findIndex((q) => q.x !== 0 || q.y !== 0);
  if (firstOk < 0) firstOk = 0;
  for (let i = 0; i < firstOk; i++) T[i] = T[firstOk].x || T[firstOk].y ? T[firstOk] : {x: 1, y: 0};
  const N: P[] = T.map((q) => ({x: -q.y, y: q.x}));
  // arc length
  const arcS: number[] = [0];
  for (let i = 1; i < nS; i++) arcS.push(arcS[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  // discrete curvature at each sample (signed: > 0 bends toward +N), smoothed
  const k0: number[] = new Array(nS).fill(0);
  for (let i = 1; i < nS - 1; i++) {
    const ax = pts[i].x - pts[i - 1].x, ay = pts[i].y - pts[i - 1].y;
    const bx = pts[i + 1].x - pts[i].x, by = pts[i + 1].y - pts[i].y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 1e-9 || lb < 1e-9) continue;
    k0[i] = wrap(Math.atan2(by, bx) - Math.atan2(ay, ax)) / (0.5 * (la + lb));
  }
  const kap: number[] = new Array(nS).fill(0);
  const W = [1, 2, 3, 2, 1];
  for (let i = 0; i < nS; i++) {
    let s = 0, w = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j < 1 || j > nS - 2) continue;
      s += k0[j] * W[k + 2];
      w += W[k + 2];
    }
    kap[i] = w ? s / w : 0;
  }
  // side radii: the inner side of a bend is softly limited to a fraction of the curvature radius (no folds)
  const rS: number[] = [], rpS: number[] = [], rmS: number[] = [];
  for (let i = 0; i < nS; i++) {
    const r = Math.max(0, radii[i] ?? 0);
    const k = kap[i];
    let rin = r;
    if (r > 0 && Math.abs(k) > 1e-6) {
      const lim = 0.84 / Math.abs(k);
      rin = Math.pow(Math.pow(r, -4) + Math.pow(lim, -4), -0.25);
    }
    rS.push(r);
    rpS.push(k > 0 ? rin : r);
    rmS.push(k < 0 ? rin : r);
  }
  // stations: the snout cap (tip → just before sample KH), then samples KH..end
  const c: P[] = [], n: P[] = [], tg: P[] = [], r: number[] = [], rp: number[] = [], rm: number[] = [];
  const u: number[] = [], idx: number[] = [], kp: number[] = [];
  const kh = Math.min(KH, nS - 1);
  const aC = Math.max(0.2, arcS[kh]);
  const rK = rS[kh];
  for (let m = 0; m < CAP_N; m++) {
    const g = HP * (1 - m / CAP_N);
    const x = aC * Math.pow(Math.sin(g), 0.9);
    const rr = rK * Math.pow(Math.cos(g), 0.85);
    c.push({x: pts[kh].x - T[kh].x * x, y: pts[kh].y - T[kh].y * x});
    n.push(N[kh]);
    tg.push(T[kh]);
    r.push(rr);
    rp.push(rr);
    rm.push(rr);
    const id = kh * (1 - Math.sin(g));
    idx.push(id);
    u.push(id / (nS - 1));
    kp.push(0);
  }
  for (let i = kh; i < nS; i++) {
    c.push(pts[i]);
    n.push(N[i]);
    tg.push(T[i]);
    r.push(rS[i]);
    rp.push(rpS[i]);
    rm.push(rmS[i]);
    idx.push(i);
    u.push(i / (nS - 1));
    kp.push(kap[i]);
  }
  const al = n.map((q) => q.x * LX + q.y * LY);
  return {nS, M: c.length, c, n, tg, r, rp, rm, u, idx, kap: kp, al, arcS};
};

/** external (sample) index → station coordinate */
const stationOf = (g: Geo, f: number) => {
  const kh = Math.min(KH, g.nS - 1);
  if (f >= kh) return CAP_N + (f - kh);
  if (f <= 0) return 0;
  for (let m = 0; m < CAP_N; m++) {
    const a = g.idx[m], b = g.idx[m + 1];
    if (f <= b) return m + (b > a ? (f - a) / (b - a) : 0);
  }
  return CAP_N;
};

/** point at cross position s (−1 … 1, the −N edge … the +N edge) of station j */
const edgeAt = (g: Geo, j: number, s: number, extra = 0): P => {
  const rr = (s >= 0 ? g.rp[j] : g.rm[j]) * s + (s >= 0 ? extra : -extra);
  return {x: g.c[j].x + g.n[j].x * rr, y: g.c[j].y + g.n[j].y * rr};
};
const edgeArr = (g: Geo, s: number | number[]) => {
  const out: P[] = new Array(g.M);
  for (let j = 0; j < g.M; j++) out[j] = edgeAt(g, j, typeof s === 'number' ? s : s[j]);
  return out;
};

// ---------------------------------------------------------------- Catmull-Rom curves cut exactly at fractional stations
type B4 = [number, number, number, number, number, number, number, number];
const segB = (ps: P[], i: number): B4 => {
  const n = ps.length;
  const p0 = ps[i > 0 ? i - 1 : 0], p1 = ps[i], p2 = ps[i + 1], p3 = ps[i + 2 < n ? i + 2 : n - 1];
  const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y), d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y), d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const k1 = d12 / (3 * Math.max(1e-9, d01 + d12));
  const k2 = d12 / (3 * Math.max(1e-9, d12 + d23));
  return [p1.x, p1.y, p1.x + (p2.x - p0.x) * k1, p1.y + (p2.y - p0.y) * k1, p2.x - (p3.x - p1.x) * k2, p2.y - (p3.y - p1.y) * k2, p2.x, p2.y];
};
const L1 = (a: number, b: number, t: number) => a + (b - a) * t;
const leftB = (b: B4, t: number): B4 => {
  const x01 = L1(b[0], b[2], t), y01 = L1(b[1], b[3], t), x12 = L1(b[2], b[4], t), y12 = L1(b[3], b[5], t), x23 = L1(b[4], b[6], t), y23 = L1(b[5], b[7], t);
  const x012 = L1(x01, x12, t), y012 = L1(y01, y12, t), x123 = L1(x12, x23, t), y123 = L1(y12, y23, t);
  return [b[0], b[1], x01, y01, x012, y012, L1(x012, x123, t), L1(y012, y123, t)];
};
const rightB = (b: B4, t: number): B4 => {
  const x01 = L1(b[0], b[2], t), y01 = L1(b[1], b[3], t), x12 = L1(b[2], b[4], t), y12 = L1(b[3], b[5], t), x23 = L1(b[4], b[6], t), y23 = L1(b[5], b[7], t);
  const x012 = L1(x01, x12, t), y012 = L1(y01, y12, t), x123 = L1(x12, x23, t), y123 = L1(y12, y23, t);
  return [L1(x012, x123, t), L1(y012, y123, t), x123, y123, x23, y23, b[6], b[7]];
};
const subB = (b: B4, t0: number, t1: number): B4 => {
  let q = b;
  if (t1 < 1) q = leftB(q, t1);
  if (t0 > 0) q = rightB(q, t0 / t1);
  return q;
};

type Fmt = (v: number) => string;
/** append the curve through ps over station range [A, B] (forward, or backward when rev) */
const curve = (ps: P[], A: number, B: number, rev: boolean, out: string[], move: boolean, F: Fmt) => {
  const n = ps.length;
  const segs: B4[] = [];
  const i0 = Math.max(0, Math.floor(A)), i1 = Math.min(n - 2, Math.ceil(B) - 1);
  for (let i = i0; i <= i1; i++) {
    const t0 = Math.max(0, A - i), t1 = Math.min(1, B - i);
    if (t1 - t0 <= 1e-7) continue;
    segs.push(subB(segB(ps, i), t0, t1));
  }
  if (!segs.length) return;
  if (rev) {
    segs.reverse();
    for (let k = 0; k < segs.length; k++) {
      const s = segs[k];
      segs[k] = [s[6], s[7], s[4], s[5], s[2], s[3], s[0], s[1]];
    }
  }
  out.push((move ? 'M' : 'L') + F(segs[0][0]) + ' ' + F(segs[0][1]));
  for (const s of segs) out.push('C' + F(s[2]) + ' ' + F(s[3]) + ' ' + F(s[4]) + ' ' + F(s[5]) + ' ' + F(s[6]) + ' ' + F(s[7]));
};
const stripPath = (lo: P[], hi: P[], A: number, B: number, F: Fmt, out: string[] = []) => {
  curve(lo, A, B, false, out, true, F);
  curve(hi, A, B, true, out, false, F);
  out.push('Z');
  return out;
};
const polyPath = (ps: P[], F: Fmt, close = true) => {
  const out: string[] = [];
  curve(ps, 0, ps.length - 1, false, out, true, F);
  if (close) out.push('Z');
  return out.join('');
};
/** a smooth closed curve through the points */
const loopPath = (ps: P[], F: Fmt) => polyPath([ps[ps.length - 1], ...ps, ps[0], ps[1]].slice(0), F, false).replace(/^M[^C]*/, (m) => m) ;

// ---------------------------------------------------------------- chunking where the body crosses over itself
const chunkCuts = (pts: P[], radii: number[], arc: number[], a: number, b: number) => {
  const cuts: number[] = [];
  let s0 = a;
  const e0 = Math.ceil(a), e1 = Math.floor(b);
  for (let e = e0; e <= e1; e++) {
    for (let k = Math.ceil(s0); k < e; k++) {
      const rk = radii[k] ?? 0, re = radii[e] ?? 0;
      if (arc[e] - arc[k] < Math.max(2.2, Math.PI * (rk + re))) break;
      const d = Math.hypot(pts[e].x - pts[k].x, pts[e].y - pts[k].y);
      if (d < rk + re + 0.3) {
        const cut = (k + e) / 2;
        cuts.push(cut);
        s0 = cut;
        break;
      }
    }
  }
  return cuts;
};

// ---------------------------------------------------------------- fins
const finHeight = (u: number, u0: number, H: number, t: number, seed: number) => {
  if (u <= u0) return 0;
  const rise = smooth((u - u0) / 0.06);
  const taper = 1 - 0.42 * smooth((u - 0.72) / 0.28);
  const ripple = 1 + 0.1 * Math.sin(2 * Math.PI * (u * 7.5 - 1.15 * t) + seed);
  return H * rise * taper * ripple;
};

// ---------------------------------------------------------------- one chunk of body
/** a chunk: station range [A, B] of the body; the fin uses [fA, fB] (the exact cuts: no overlap, it is translucent) */
type Chunk = {A: number; B: number; fA: number; fB: number; head: boolean; tail: boolean};

type Ctx = {
  g: Geo;
  F: Fmt;
  px: number;
  t: number;
  phD: number; // projected angle of the dorsal midline
  fins: {Od: P[]; Oa: P[]; Bd: P[]; Ba: P[]; jd0: number; ja0: number; tip: P[]};
  edges: {m: P[]; p: P[]};
  pig: {lo: P[]; hi: P[]; col: string}[];
  shadows: {lo: P[][]; hi: P[][]; op: number}[];
  lights: {lo: P[]; hi: P[]; op: number}[];
  spec: {lo: P[]; hi: P[]; hlo: P[]; hhi: P[]};
  lateral: {pts: P[]; j0: number; j1: number}[];
};

const makeCtx = (g: Geo, px: number, t: number, dorsal: number): Ctx => {
  const F: Fmt = px > 55 ? (v) => String(Math.round(v * 1000) / 1000) : (v) => String(Math.round(v * 200) / 200);
  const d = Math.max(-1, Math.min(1, dorsal));
  const phD = -d * HP;
  const M = g.M;
  // pigment strips (constant cross positions)
  const pig = PIG.map((q) => ({lo: edgeArr(g, sOf(phD - q.bound)), hi: edgeArr(g, sOf(phD + q.bound)), col: q.col}));
  // light: per station, the cross-section angle of the light and the lit interval for each threshold
  const ph0 = g.al.map((a) => Math.atan2(a * CE, SE));
  const shadows = SHADOWS.map((L) => {
    const w = Math.acos(L.th);
    const sLoOut = -Math.cos(L.rim), sHiOut = Math.cos(L.rim);
    const aLo: number[] = [], bLo: number[] = [], aHi: number[] = [], bHi: number[] = [];
    for (let j = 0; j < M; j++) {
      const lo = sOf(ph0[j] - w), hi = sOf(ph0[j] + w);
      aLo.push(sLoOut);
      bLo.push(Math.max(sLoOut, lo));
      aHi.push(Math.min(sHiOut, hi));
      bHi.push(sHiOut);
    }
    return {lo: [edgeArr(g, aLo), edgeArr(g, aHi)], hi: [edgeArr(g, bLo), edgeArr(g, bHi)], op: L.op};
  });
  const lights = LIGHTS.map((L) => {
    const w = Math.acos(L.th);
    return {lo: edgeArr(g, ph0.map((p) => sOf(p - w))), hi: edgeArr(g, ph0.map((p) => sOf(p + w))), op: L.op};
  });
  // the wet specular streak: about half way between the view and the light, its width breathing along the body
  const sLo: number[] = [], sHi: number[] = [], hLo: number[] = [], hHi: number[] = [];
  for (let j = 0; j < M; j++) {
    const u = g.u[j];
    const wet = 0.55 + 0.65 * vnoise(u * 11 + 0.3, 1) * (0.55 + 0.45 * vnoise(u * 29, 2));
    const taper = (1 - 0.6 * smooth((u - 0.8) / 0.2)) * (0.5 + 0.5 * smooth(u / 0.025));
    const cph = ph0[j] * 0.5;
    const hw = 6 * DEG * wet * taper, hh = 15 * DEG * (0.6 + 0.4 * wet) * taper;
    sLo.push(sOf(cph - hw));
    sHi.push(sOf(cph + hw));
    hLo.push(sOf(cph - hh));
    hHi.push(sOf(cph + hh));
  }
  const spec = {lo: edgeArr(g, sLo), hi: edgeArr(g, sHi), hlo: edgeArr(g, hLo), hhi: edgeArr(g, hHi)};
  // lateral line(s) on the visible flank(s)
  const lateral: Ctx['lateral'] = [];
  for (const side of [1, -1]) {
    const ph = phD + side * 94 * DEG;
    if (Math.abs(ph) > 80 * DEG) continue;
    const j0 = stationOf(g, 0.105 * (g.nS - 1)), j1 = stationOf(g, 0.8 * (g.nS - 1));
    lateral.push({pts: edgeArr(g, Math.sin(ph)), j0, j1});
  }
  // fins: dorsal on the dorsal midline's projected side, anal on the opposite side
  const sd = Math.sin(phD), sa = -sd;
  const Od: P[] = [], Oa: P[] = [], Bd: P[] = [], Ba: P[] = [];
  let hdN = 0, haN = 0;
  for (let j = 0; j < M; j++) {
    const u = g.u[j];
    const hd = finHeight(u, EEL_FEAT.dorsalFinU, FIN_D, t, 0);
    const ha = finHeight(u, EEL_FEAT.analFinU, FIN_A, t, 1.7);
    if (j === M - 1) {
      hdN = hd;
      haN = ha;
    }
    const k = g.kap[j];
    const put = (s: number, h: number, O: P[], Bs: P[]) => {
      const sg = s >= 0 ? 1 : -1;
      const rSide = sg > 0 ? g.rp[j] : g.rm[j];
      let ext = (rSide + h) * Math.abs(s);
      if (k * sg > 1e-6) ext = Math.min(ext, Math.max(rSide * Math.abs(s), 0.86 / Math.abs(k)));
      O.push({x: g.c[j].x + g.n[j].x * sg * ext, y: g.c[j].y + g.n[j].y * sg * ext});
      const bb = rSide * Math.abs(s) * 0.45;
      Bs.push({x: g.c[j].x + g.n[j].x * sg * bb, y: g.c[j].y + g.n[j].y * sg * bb});
    };
    put(sd, hd, Od, Bd);
    put(sa, ha, Oa, Ba);
  }
  // the fringe around the pointed tail tip
  const j = M - 1, cN = g.c[j], T = g.tg[j], nn = g.n[j];
  const sgD = sd >= 0 ? 1 : -1, sgA = -sgD;
  const tp = (fw: number, side: number, h: number): P => ({x: cN.x + T.x * fw + nn.x * side * h, y: cN.y + T.y * fw + nn.y * side * h});
  const tip = [tp(TIP_EXT * 0.62, sgD, hdN * Math.abs(sd) * 0.66), tp(TIP_EXT, 0, 0), tp(TIP_EXT * 0.62, sgA, haN * Math.abs(sa) * 0.66)];
  const jd0 = stationOf(g, EEL_FEAT.dorsalFinU * (g.nS - 1));
  const ja0 = stationOf(g, EEL_FEAT.analFinU * (g.nS - 1));
  return {
    g, F, px, t, phD,
    fins: {Od, Oa, Bd, Ba, jd0, ja0, tip},
    edges: {m: edgeArr(g, -1), p: edgeArr(g, 1)},
    pig, shadows, lights, spec, lateral,
  };
};

const FinsAndBody: React.FC<{x: Ctx; ch: Chunk}> = ({x, ch}) => {
  const {g, F} = x;
  const {A, B, head, tail} = ch;
  const M = g.M;
  const els: React.ReactNode[] = [];
  // ---- ribbon fin (behind the body), over the exact cut range
  {
  const A = ch.fA, B = ch.fB;
  const fi = x.fins;
  const finFill: string[] = [];
  const finInk: string[] = [];
  if (tail) {
    const ext = [...fi.Od, ...fi.tip, ...[...fi.Oa].reverse()];
    const E = 2 * M + 2;
    curve(ext, A, E - A, false, finFill, true, F);
    curve(fi.Ba, A, M - 1, false, finFill, false, F);
    curve(fi.Bd, A, M - 1, true, finFill, false, F);
    finFill.push('Z');
    const a0 = Math.max(A, fi.jd0), a1 = Math.max(A, fi.ja0);
    curve(ext, a0, E - a1, false, finInk, true, F);
  } else {
    if (B > fi.jd0) {
      stripPath(fi.Od, fi.Bd, Math.max(A, fi.jd0 - 1), B, F, finFill);
      curve(fi.Od, Math.max(A, fi.jd0), B, false, finInk, true, F);
    }
    if (B > fi.ja0) {
      stripPath(fi.Oa, fi.Ba, Math.max(A, fi.ja0 - 1), B, F, finFill);
      curve(fi.Oa, Math.max(A, fi.ja0), B, false, finInk, true, F);
    }
  }
  if (finFill.length) {
    els.push(<path key="ff" d={finFill.join('')} fill={FIN_FILL} fillOpacity={0.58} />);
  }
  if (finInk.length) els.push(<path key="fi" d={finInk.join('')} fill="none" stroke={INK} strokeWidth={1.3} strokeOpacity={0.5} vectorEffect={NS} strokeLinejoin="round" strokeLinecap="round" />);
  }
  // ---- body: base pigment, nested pigment strips
  const em = x.edges.m, ep = x.edges.p;
  els.push(<path key="b0" d={stripPath(em, ep, A, B, F).join('')} fill={PIG_BASE} />);
  x.pig.forEach((p, i) => {
    els.push(<path key={'p' + i} d={stripPath(p.lo, p.hi, A, B, F).join('')} fill={p.col} />);
  });
  // ---- light: core shadows (both sides, one path per level), broad light, specular streak
  x.shadows.forEach((s, i) => {
    const o: string[] = [];
    stripPath(s.lo[0], s.hi[0], A, B, F, o);
    stripPath(s.lo[1], s.hi[1], A, B, F, o);
    els.push(<path key={'s' + i} d={o.join('')} fill={SHADOW} fillOpacity={s.op} />);
  });
  x.lights.forEach((l, i) => {
    els.push(<path key={'l' + i} d={stripPath(l.lo, l.hi, A, B, F).join('')} fill={WHITE} fillOpacity={l.op} />);
  });
  els.push(<path key="sh" d={stripPath(x.spec.hlo, x.spec.hhi, A, B, F).join('')} fill={WHITE} fillOpacity={0.1} />);
  els.push(<path key="sp" d={stripPath(x.spec.lo, x.spec.hi, A, B, F).join('')} fill={WHITE} fillOpacity={0.5} />);
  // ---- lateral line
  for (let i = 0; i < x.lateral.length; i++) {
    const L = x.lateral[i];
    const a = Math.max(A, L.j0), b = Math.min(B, L.j1);
    if (b - a < 0.5) continue;
    const o: string[] = [];
    curve(L.pts, a, b, false, o, true, F);
    els.push(<path key={'ll' + i} d={o.join('')} fill="none" stroke={LATERAL} strokeOpacity={0.32} strokeWidth={1.2} vectorEffect={NS} strokeLinecap="round" />);
  }
  // ---- ink silhouette: sides only (cut ends stay open), through the snout / tail tip when they are included
  const ink: string[] = [];
  if (head) {
    curve(em, 0, B, true, ink, true, F);
    curve(ep, 0, B, false, ink, false, F);
    if (tail) ink.push('Z');
  } else if (tail) {
    curve(em, A, B, false, ink, true, F);
    curve(ep, A, B, true, ink, false, F);
  } else {
    curve(em, A, B, false, ink, true, F);
    curve(ep, A, B, false, ink, true, F);
  }
  els.push(<path key="ink" d={ink.join('')} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" strokeLinecap="butt" />);
  // composited as ONE layer (opacity just below 1), so a cut end is a single anti-aliased edge over identical colour
  // instead of a stack of partially covered strips (which would leave a faint line across the body at a join)
  return <g opacity={0.999}>{els}</g>;
};

// ---------------------------------------------------------------- the head: eye, mouth, gill slit, pectoral fin
const Head: React.FC<{x: Ctx}> = ({x}) => {
  const {g, F, phD, t} = x;
  const els: React.ReactNode[] = [];
  const st = (u: number) => stationOf(g, u * (g.nS - 1));
  /** point on the body surface at station coordinate js (fractional), cross angle phi, lifted by `lift` units */
  const at = (js: number, phi: number, lift = 0): P => {
    const j = Math.min(g.M - 2, Math.max(0, Math.floor(js))), f = js - j;
    const s = Math.sin(clampPhi(phi));
    const a = edgeAt(g, j, s, lift), b = edgeAt(g, j + 1, s, lift);
    return {x: L1(a.x, b.x, f), y: L1(a.y, b.y, f)};
  };
  const frame = (js: number) => {
    const j = Math.min(g.M - 1, Math.max(0, Math.round(js)));
    return {T: g.tg[j], N: g.n[j], r: g.r[Math.min(g.M - 1, Math.max(0, Math.ceil(js)))]};
  };
  for (const side of [1, -1]) {
    const flank = (psi: number) => phD + side * psi;
    // visible only on the flank that faces the viewer
    const vis = Math.cos(flank(90 * DEG));
    if (vis < 0.08) continue;
    // gill slit: a short crescent low on the flank, just ahead of the pectoral fin
    {
      const jg = st(EEL_FEAT.gillU);
      const fr = frame(jg);
      const ps = [0, 0.5, 1].map((k) => {
        const q = at(jg, flank((100 + 34 * k) * DEG));
        const bow = -0.16 * fr.r * Math.sin(Math.PI * k);
        return {x: q.x + fr.T.x * bow, y: q.y + fr.T.y * bow};
      });
      els.push(<path key={'g' + side} d={polyPath(ps, F, false)} fill="none" stroke={INK} strokeOpacity={0.8} strokeWidth={1.5} vectorEffect={NS} strokeLinecap="round" />);
    }
    // mouth: from the snout tip back along the lower lip to the corner below the eye
    {
      const jt = st(0.037);
      const ps: P[] = [];
      const K = 7;
      for (let k = 0; k <= K; k++) {
        const js = (jt * k) / K;
        const psi = (99 + 10 * smooth(k / K)) * DEG;
        ps.push(at(js, flank(psi)));
      }
      // the corner turns up a little
      const last = ps[ps.length - 1];
      const fr = frame(jt);
      const up = Math.sin(phD) >= 0 ? 1 : -1;
      void up;
      const dn = at(jt, flank(104 * DEG));
      ps.push({x: dn.x + fr.T.x * 0.12 * fr.r, y: dn.y + fr.T.y * 0.12 * fr.r});
      void last;
      els.push(<path key={'m' + side} d={polyPath(ps, F, false)} fill="none" stroke={INK} strokeWidth={1.7} vectorEffect={NS} strokeLinecap="round" strokeLinejoin="round" />);
    }
    // pectoral fin: a tiny rounded paddle on the flank, fanning gently
    {
      const jp = st(EEL_FEAT.pectoralU);
      const fr = frame(jp);
      const base = at(jp, flank(96 * DEG));
      const r = fr.r;
      // local axes: along the body (toward the tail) and toward the back
      const towardBack = Math.sin(phD) <= 0 ? -1 : 1;
      const bx = fr.N.x * towardBack, by = fr.N.y * towardBack;
      const ang = (-22 + 9 * Math.sin(2 * Math.PI * 1.6 * t + side)) * DEG;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ax = fr.T.x * ca - bx * sa, ay = fr.T.y * ca - by * sa;
      const qx = fr.T.x * sa + bx * ca, qy = fr.T.y * sa + by * ca;
      const L = 0.95 * r, Wd = 0.34 * r;
      const shape: [number, number][] = [[-0.04, -0.62], [0.32, -0.92], [0.72, -0.86], [1.0, -0.3], [0.98, 0.25], [0.66, 0.74], [0.28, 0.76], [-0.04, 0.5]];
      const ps = shape.map(([a, b]) => ({x: base.x + ax * a * L - qx * b * Wd, y: base.y + ay * a * L - qy * b * Wd}));
      const loop = [ps[ps.length - 1], ...ps, ps[0], ps[1]];
      const o: string[] = [];
      curve(loop, 1, loop.length - 2, false, o, true, F);
      o.push('Z');
      const d = o.join('');
      els.push(<path key={'pf' + side} d={d} fill={lit(C.eelFin, 0.12)} fillOpacity={0.94} stroke={INK} strokeWidth={1.4} vectorEffect={NS} strokeLinejoin="round" />);
      // a few rays
      const rays: string[] = [];
      for (const b of [-0.45, 0, 0.42]) {
        const e = {x: base.x + ax * 0.82 * L - qx * b * Wd * 1.05, y: base.y + ay * 0.82 * L - qy * b * Wd * 1.05};
        const s0 = {x: base.x + ax * 0.12 * L - qx * b * Wd * 0.35, y: base.y + ay * 0.12 * L - qy * b * Wd * 0.35};
        rays.push('M' + F(s0.x) + ' ' + F(s0.y) + 'L' + F(e.x) + ' ' + F(e.y));
      }
      els.push(<path key={'pr' + side} d={rays.join('')} stroke={C.eelBack} strokeOpacity={0.35} strokeWidth={1} vectorEffect={NS} fill="none" strokeLinecap="round" />);
    }
    // eye: small, dark, with a thin silvery ring and a highlight toward the light
    {
      const je = st(EEL_FEAT.eyeU);
      const fr = frame(je);
      const phE = flank(60 * DEG);
      const ce = at(je, phE);
      const fo = Math.max(0.25, Math.cos(clampPhi(phE)));
      const R = 0.25 * Math.max(fr.r, 0.9);
      const angDeg = (Math.atan2(fr.T.y, fr.T.x) * 180) / Math.PI;
      const tr = `rotate(${F(angDeg)} ${F(ce.x)} ${F(ce.y)})`;
      els.push(<ellipse key={'er' + side} cx={F(ce.x)} cy={F(ce.y)} rx={F(R)} ry={F(R * fo)} transform={tr} fill={EYE_RING} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />);
      els.push(<ellipse key={'ep' + side} cx={F(ce.x)} cy={F(ce.y)} rx={F(R * 0.72)} ry={F(R * 0.72 * fo)} transform={tr} fill={C.eelEye} />);
      const hl = {x: ce.x + LX * R * 0.36, y: ce.y + LY * R * 0.36};
      els.push(<circle key={'eh' + side} cx={F(hl.x)} cy={F(hl.y)} r={F(R * 0.26)} fill={WHITE} fillOpacity={0.95} />);
      const hl2 = {x: ce.x - LX * R * 0.3, y: ce.y - LY * R * 0.3};
      els.push(<circle key={'eh2' + side} cx={F(hl2.x)} cy={F(hl2.y)} r={F(R * 0.1)} fill={WHITE} fillOpacity={0.6} />);
    }
  }
  return <g>{els}</g>;
};

// ---------------------------------------------------------------- the component
export const Eel: React.FC<EelProps> = ({pts, radii, from = 0, to, px, t, dorsal = 1, opacity, clip, over = 'tail'}) => {
  const nS = pts.length;
  if (nS < 4) return null;
  const last = nS - 1;
  const a = Math.max(0, Math.min(last, from));
  const b = Math.max(0, Math.min(last, to ?? last));
  if (b - a < 1e-4) return null;
  const g = build(pts, radii);
  const x = makeCtx(g, Math.max(0.5, px), t, dorsal);
  // chunks (in sample indices), then the overlaps that hide anti-aliasing seams
  const cuts = chunkCuts(pts, radii, g.arcS, a, b);
  const bounds = [a, ...cuts, b];
  const epsAt = (f: number) => {
    const i = Math.max(0, Math.min(last - 1, Math.floor(f)));
    const sl = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    return Math.min(0.6, 1.6 / Math.max(0.5, px) / Math.max(1e-3, sl));
  };
  const tailOn = over === 'tail';
  const chunks: Chunk[] = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    const fa = bounds[k], fb = bounds[k + 1];
    let ca = fa, cb = fb;
    const first = k === 0, lastC = k === bounds.length - 2;
    // drawn after the neighbour at its start → overlap it slightly
    if ((first && a > 0) || (!first && tailOn)) ca = Math.max(0, ca - epsAt(ca));
    if (!lastC && !tailOn) cb = Math.min(last, cb + epsAt(cb));
    const head = first && a < 1e-6;
    const tail = lastC && b >= last - 1e-6;
    chunks.push({A: head ? 0 : stationOf(g, ca), B: tail ? g.M - 1 : stationOf(g, cb), fA: head ? 0 : stationOf(g, fa), fB: tail ? g.M - 1 : stationOf(g, fb), head, tail});
  }
  const order = tailOn ? chunks : [...chunks].reverse();
  let clipId: string | null = null;
  let clipEl: React.ReactNode = null;
  if (clip) {
    if (clip.startsWith('url(')) clipId = clip;
    else {
      const id = uid('eelclip');
      clipId = `url(#${id})`;
      clipEl = (
        <defs>
          <clipPath id={id}>
            <path d={clip} />
          </clipPath>
        </defs>
      );
    }
  }
  return (
    <g opacity={opacity}>
      {clipEl}
      <g clipPath={clipId ?? undefined}>
        {order.map((ch, i) => (
          <g key={i}>
            <FinsAndBody x={x} ch={ch} />
            {ch.head && <Head x={x} />}
          </g>
        ))}
      </g>
    </g>
  );
};

/** the eel's silhouette (body, optionally the ribbon fin) over a section, as one closed path in the layer's units
 *  (for masks and clips: e.g. holes along the eel in the translucent skin, a glow, a contact shadow) */
export const eelSilhouette = (pts: P[], radii: number[], from = 0, to?: number, withFins = false, t = 0, dorsal = 1, grow = 0): string => {
  const nS = pts.length;
  if (nS < 4) return '';
  const last = nS - 1;
  const a = Math.max(0, Math.min(last, from)), b = Math.max(0, Math.min(last, to ?? last));
  if (b - a < 1e-4) return '';
  const g = build(pts, radii);
  const F: Fmt = (v) => String(Math.round(v * 1000) / 1000);
  const A = a < 1e-6 ? 0 : stationOf(g, a), B = b >= last - 1e-6 ? g.M - 1 : stationOf(g, b);
  const em: P[] = [], ep: P[] = [];
  for (let j = 0; j < g.M; j++) {
    em.push(edgeAt(g, j, -1, grow));
    ep.push(edgeAt(g, j, 1, grow));
  }
  const out = stripPath(em, ep, A, B, F);
  if (withFins) {
    const x = makeCtx(g, 100, t, dorsal);
    const fi = x.fins;
    if (B > fi.jd0) stripPath(fi.Od, fi.Bd, Math.max(A, fi.jd0 - 1), B, F, out);
    if (B > fi.ja0) stripPath(fi.Oa, fi.Ba, Math.max(A, fi.ja0 - 1), B, F, out);
    if (b >= last - 1e-6) out.push('M' + fi.tip.map((q) => F(q.x) + ' ' + F(q.y)).join('L') + 'L' + F(g.c[g.M - 1].x) + ' ' + F(g.c[g.M - 1].y) + 'Z');
  }
  return out.join('');
};

void loopPath;
void shade;
