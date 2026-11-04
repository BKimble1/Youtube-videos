// The eel: a juvenile Japanese eel (Anguilla japonica) drawn along its kinematic samples (eel.ts: 121 points,
// snout → tail tip, already projected to the layer's units) as ONE connected, round, slate-blue animal.
//
// How it is built (Weird Crew finish, cheap enough for 744 frames):
// - The body frame is computed on the FULL sample array every time (tangents, normals, smoothed curvature, side
//   radii), so any section [from, to] is cut from the very same curves and consecutive sections meet exactly. A
//   rounded snout cap is grafted in front of sample KH (its meridians converge at the snout tip like at a pole).
//   Stations are thinned where the body is straight (Catmull-Rom curves stay smooth), always the same way for one
//   pose, so the cut positions agree between sections.
// - The body is a stack of nested strips between offset curves at fixed cross positions s ∈ [-1, 1]: pigment
//   (dark slate back on the `dorsal` side, steel flank, pale belly; equal colour steps), then light from ONE key
//   light at the upper left (a soft core shadow with a reflected-light rim on the far side, a faint broad light, a
//   wet specular streak with a halo), a faint lateral line, and the navy ink silhouette. ~22 paths, no gradients,
//   no filters; path data is integer, relative and thinned (≈ 50–70 kB for the whole eel).
// - Tight bends: the inner side is softly limited to the local curvature radius (no offset folds). Where the body
//   crosses over itself it is split into chunks drawn in body order (the tail-ward part on top by default), each
//   with its own ink sides, so the crossing shows which part is on top.
// - Cut ends (sections and chunks) carry no ink and no cap. A cut is made by a mask over the whole stack (one
//   anti-aliased edge, not one per strip), and the part drawn later overlaps the earlier one by ~1.5 px, so a
//   join is invisible.
// - The continuous ribbon fin (dorsal from u ≈ 0.40, anal from u ≈ 0.47) sits behind the body, translucent, and
//   wraps around the pointed tail tip as a narrow fringe (never a fan).
import React from 'react';
import {P} from '../core/geo';
import {uid} from '../core/ids';
import {lit, mix} from '../core/color';
import {EEL_FEAT} from '../anatomy';
import {C, INK, INK_PX, NS} from './palette';

export type EelProps = {
  /** body samples snout (index 0) → tail tip (last), in the layer's units (P3 points are fine: z is ignored) */
  pts: P[];
  /** body radius at each sample (eel.ts RADII), same units */
  radii: number[];
  /** first sample of the section to draw (fractional allowed); 0 = from the snout (the head is drawn only then) */
  from?: number;
  /** last sample of the section (inclusive, fractional allowed); default the tail tip (the pointed tip and the fin
   *  fringe around it are drawn only then). Consecutive sections share their boundary: A.to === B.from, and the
   *  later-drawn one should have the larger `from` (it overlaps the earlier one by ~1.5 px at the join). */
  to?: number;
  /** screen pixels per unit of this layer (1080 / cam.w · layer scale) */
  px: number;
  /** time (s): the ribbon fin's ripple and the pectoral fin's fanning */
  t: number;
  /** which side the dark back is on: 1 (default) = the left of the snout→tail direction (a left-facing eel shows
   *  its back up; the opening's rising tail shows it on its upper/outer side), -1 = the other side. Values in
   *  between roll the body about its long axis (0 = the back faces the viewer), so a flip can be animated. An
   *  array (one value per sample) twists the body along its length; use the same value/array for every section. */
  dorsal?: number | number[];
  opacity?: number;
  /** clip: a path `d` in the layer's units (e.g. gillGapPath(s)), or a ready `url(#id)` reference */
  clip?: string;
  /** where the body crosses over itself: which end's part lies on top (default 'tail') */
  over?: 'tail' | 'head';
};

// ---------------------------------------------------------------- constants
const HP = Math.PI / 2;
const DEG = Math.PI / 180;
/** the key light: screen direction toward it (upper left, dc/shade LIGHT) and its elevation toward the viewer */
const LL = Math.hypot(0.62, 0.78);
const LX = -0.62 / LL, LY = -0.78 / LL;
const ELEV = 38 * DEG;
const CE = Math.cos(ELEV), SE = Math.sin(ELEV);
/** the snout cap replaces samples 0..KH with CAP_N stations on a rounded half-ellipse */
const KH = 3;
const CAP_N = 9;
/** ribbon fin heights (units) and how far the fringe reaches past the tail tip */
const FIN_D = EEL_FEAT.finH * 0.62;
const FIN_A = EEL_FEAT.finH * 0.56;
const TIP_EXT = 0.3;

const WHITE = '#FFFFFF';
/** shadow tint: a deep cool slate, so the shadowed pale belly stays blue-grey instead of going muddy */
const SHADOW = mix(INK, C.eelBack, 0.45);
const FIN_FILL = mix(C.eelFin, C.eelBack, 0.38);
const PEC_FILL = mix(C.eelFin, C.eelFlank, 0.3);
const LATERAL = lit(C.eelFlank, 0.3);
const EYE_RING = mix(C.eelBelly, C.eelFin, 0.35);

// pigment: angle ψ (degrees) from the dorsal midline → colour (dark back, steel flank, pale belly)
const smoothRange = (d: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (d - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const pigment = (psiDeg: number) =>
  psiDeg < 100 ? mix(C.eelBack, C.eelFlank, smoothRange(psiDeg, 42, 98)) : mix(C.eelFlank, C.eelBelly, smoothRange(psiDeg, 124, 166));
const rgbOf = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
/** nested pigment strips (each covers ψ < bound around the dorsal midline, painted over the previous), the bounds
 *  chosen so every step changes the colour by the same amount */
const PIG: {bound: number; col: string}[] = (() => {
  const K = 12;
  const ds: number[] = [0];
  let prev = rgbOf(pigment(180));
  for (let d = 179.5; d >= 0; d -= 0.5) {
    const c = rgbOf(pigment(d));
    ds.push(ds[ds.length - 1] + Math.hypot(c[0] - prev[0], c[1] - prev[1], c[2] - prev[2]));
    prev = c;
  }
  const total = ds[ds.length - 1];
  const psiAt = (v: number) => 180 - 0.5 * Math.max(0, ds.findIndex((q) => q >= v));
  const out: {bound: number; col: string}[] = [];
  for (let k = 1; k <= K; k++) out.push({bound: psiAt((total * (k - 0.5)) / K) * DEG, col: pigment(psiAt((total * k) / K))});
  return out;
})();
const PIG_BASE = pigment(180);

// light levels (normalised diffuse thresholds), each a strip, stacked
const SHADOWS: {th: number; op: number; rim: number}[] = [0.6, 0.42, 0.24, 0.06, -0.12, -0.3].map((th, i) => ({
  th,
  op: 0.088,
  rim: i < 3 ? 0 : (6 + 5 * (i - 3)) * DEG,
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
const L1 = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- the body frame (computed on the full array)
type Geo = {
  nS: number;
  /** stations (the snout cap, then the kept samples) */
  M: number;
  c: P[];
  n: P[];
  tg: P[];
  r: number[];
  rp: number[];
  rm: number[];
  u: number[];
  /** external sample index of each station (increasing) */
  idx: number[];
  kap: number[];
  /** light term: the +N normal · the light direction */
  al: number[];
  /** sample arc length (units), per SAMPLE */
  arcS: number[];
};

const build = (pts0: P[], radii: number[]): Geo => {
  const nS = pts0.length;
  // a light binomial smoothing of the centreline: rounds kinks in the route (where one sample turns sharply) but
  // moves a tight coil (radius 2.5 u, samples 0.45 u apart) by only ≈ 0.04 u; the end points stay where they are
  const pts: P[] = pts0.map((p, i) => {
    if (i < 1 || i > nS - 2) return {x: p.x, y: p.y};
    if (i < 2 || i > nS - 3) {
      const a = pts0[i - 1], b = pts0[i + 1];
      return {x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4};
    }
    const a = pts0[i - 2], b = pts0[i - 1], c = pts0[i + 1], d = pts0[i + 2];
    return {x: (a.x + 4 * b.x + 6 * p.x + 4 * c.x + d.x) / 16, y: (a.y + 4 * b.y + 6 * p.y + 4 * c.y + d.y) / 16};
  });
  // tangents (central differences, guarded against repeated points)
  const T: P[] = new Array(nS);
  for (let i = 0; i < nS; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(nS - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    T[i] = l > 1e-9 ? {x: dx / l, y: dy / l} : i > 0 ? T[i - 1] : {x: 0, y: 0};
  }
  const ok = T.findIndex((q) => q.x !== 0 || q.y !== 0);
  for (let i = 0; i < Math.max(0, ok); i++) T[i] = T[ok];
  if (ok < 0) for (let i = 0; i < nS; i++) T[i] = {x: 1, y: 0};
  const N: P[] = T.map((q) => ({x: -q.y, y: q.x}));
  const arcS: number[] = [0];
  for (let i = 1; i < nS; i++) arcS.push(arcS[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  // discrete curvature (signed: > 0 bends toward +N), smoothed
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
    if (r > 0 && Math.abs(k) > 1e-6) rin = Math.pow(Math.pow(r, -4) + Math.pow(0.84 / Math.abs(k), -4), -0.25);
    rS.push(r);
    rpS.push(k > 0 ? rin : r);
    rmS.push(k < 0 ? rin : r);
  }
  // stations: the snout cap (tip → just before sample KH), then the kept samples KH..end
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
  // thinning: every second sample, but every sample where the body turns or the radius changes fast
  let lastKept = -1;
  for (let i = kh; i < nS; i++) {
    let keep = i === kh || i === nS - 1 || i >= nS - 4 || i - lastKept >= 2;
    if (!keep && i + 1 < nS) {
      const ta = T[lastKept], tb = T[i + 1];
      const turn = Math.abs(wrap(Math.atan2(tb.y, tb.x) - Math.atan2(ta.y, ta.x)));
      const dr = Math.abs(rS[i + 1] - rS[lastKept]);
      if (turn > 15 * DEG || dr > 0.22) keep = true;
    }
    if (!keep) continue;
    lastKept = i;
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

/** external (sample) index → station coordinate (fractional) */
const stationOf = (g: Geo, f: number) => {
  if (f <= 0) return 0;
  if (f >= g.idx[g.M - 1]) return g.M - 1;
  let lo = 0, hi = g.M - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (g.idx[m] <= f) lo = m;
    else hi = m;
  }
  return lo + (f - g.idx[lo]) / (g.idx[hi] - g.idx[lo] || 1);
};

/** point at cross position s (−1 … 1, the −N edge … the +N edge) of station j, pushed out by `extra` units */
const edgeAt = (g: Geo, j: number, s: number, extra = 0): P => {
  const rr = (s >= 0 ? g.rp[j] : g.rm[j]) * s + (s >= 0 ? extra : -extra);
  return {x: g.c[j].x + g.n[j].x * rr, y: g.c[j].y + g.n[j].y * rr};
};
const edgeArr = (g: Geo, s: number | number[]) => {
  const out: P[] = new Array(g.M);
  for (let j = 0; j < g.M; j++) out[j] = edgeAt(g, j, typeof s === 'number' ? s : s[j]);
  return out;
};

// ---------------------------------------------------------------- path writer: integer, relative coordinates
type B4 = [number, number, number, number, number, number, number, number];
class PW {
  private o: string[] = [];
  private cx = 0;
  private cy = 0;
  private sx = 0;
  private sy = 0;
  constructor(private q: number) {}
  private R = (v: number) => Math.round(v * this.q);
  private nums(cmd: string, vs: number[]) {
    let s = cmd;
    for (let i = 0; i < vs.length; i++) s += (i > 0 && vs[i] >= 0 ? ' ' : '') + vs[i];
    this.o.push(s);
  }
  M(x: number, y: number) {
    const X = this.R(x), Y = this.R(y);
    this.nums('M', [X, Y]);
    this.cx = this.sx = X;
    this.cy = this.sy = Y;
  }
  L(x: number, y: number) {
    const X = this.R(x), Y = this.R(y);
    if (X !== this.cx || Y !== this.cy) this.nums('l', [X - this.cx, Y - this.cy]);
    this.cx = X;
    this.cy = Y;
  }
  C(b: B4) {
    const v = [this.R(b[2]), this.R(b[3]), this.R(b[4]), this.R(b[5]), this.R(b[6]), this.R(b[7])];
    this.nums('c', [v[0] - this.cx, v[1] - this.cy, v[2] - this.cx, v[3] - this.cy, v[4] - this.cx, v[5] - this.cy]);
    this.cx = v[4];
    this.cy = v[5];
  }
  Z() {
    this.o.push('z');
    this.cx = this.sx;
    this.cy = this.sy;
  }
  get empty() {
    return this.o.length === 0;
  }
  toString() {
    return this.o.join('');
  }
}

// ---------------------------------------------------------------- Catmull-Rom curves cut exactly at fractional stations
const segB = (ps: P[], i: number): B4 => {
  const n = ps.length;
  const p0 = ps[i > 0 ? i - 1 : 0], p1 = ps[i], p2 = ps[i + 1], p3 = ps[i + 2 < n ? i + 2 : n - 1];
  const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y), d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y), d23 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const k1 = d12 / (3 * Math.max(1e-9, d01 + d12));
  const k2 = d12 / (3 * Math.max(1e-9, d12 + d23));
  return [p1.x, p1.y, p1.x + (p2.x - p0.x) * k1, p1.y + (p2.y - p0.y) * k1, p2.x - (p3.x - p1.x) * k2, p2.y - (p3.y - p1.y) * k2, p2.x, p2.y];
};
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
/** append the curve through ps over station range [A, B] (forward, or backward when rev) */
const curve = (w: PW, ps: P[], A: number, B: number, rev: boolean, move: boolean) => {
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
  if (move) w.M(segs[0][0], segs[0][1]);
  else w.L(segs[0][0], segs[0][1]);
  for (const s of segs) w.C(s);
};
const strip = (w: PW, lo: P[], hi: P[], A: number, B: number) => {
  curve(w, lo, A, B, false, true);
  curve(w, hi, A, B, true, false);
  w.Z();
};
/** a closed smooth loop through the points */
const loop = (w: PW, ps: P[]) => {
  const ext = [ps[ps.length - 1], ...ps, ps[0], ps[1]];
  curve(w, ext, 1, ext.length - 2, false, true);
  w.Z();
};

// ---------------------------------------------------------------- chunking where the body crosses over itself
const chunkCuts = (pts: P[], radii: number[], arc: number[], a: number, b: number) => {
  const cuts: number[] = [];
  let s0 = a;
  for (let e = Math.ceil(a); e <= Math.floor(b); e++) {
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

// ---------------------------------------------------------------- the per-pose drawing context
type Ctx = {
  g: Geo;
  q: number;
  px: number;
  t: number;
  /** projected angle of the dorsal midline, per station, and at the head */
  phDs: number[];
  phD: number;
  /** fin outer edges (O), bases inside the body (B), mid-lines for the rays (R), the fringe round the tail tip */
  fins: {Od: P[]; Oa: P[]; Bd: P[]; Ba: P[]; Rd: P[]; Ra: P[]; jd0: number; ja0: number; tip: P[]; tipR: P[]};
  edges: {m: P[]; p: P[]};
  pig: {lo: P[]; hi: P[]; col: string}[];
  shadows: {sides: {lo: P[]; hi: P[]; live: boolean[]}[]; op: number}[];
  lights: {lo: P[]; hi: P[]; op: number}[];
  spec: {lo: P[]; hi: P[]; hlo: P[]; hhi: P[]};
  lateral: {pts: P[]; j0: number; j1: number}[];
};

const makeCtx = (g: Geo, px: number, t: number, dorsal: number | number[]): Ctx => {
  // one integer step ≈ 0.2 px
  const q = Math.max(20, Math.round(px * 5));
  const M = g.M;
  const dOf = (i: number) => {
    const v = typeof dorsal === 'number' ? dorsal : dorsal[Math.max(0, Math.min(dorsal.length - 1, i))] ?? 1;
    return Math.max(-1, Math.min(1, Number.isFinite(v) ? v : 1));
  };
  const phDs = g.idx.map((f) => {
    const i = Math.floor(f), fr = f - i;
    return -HP * (dOf(i) + (dOf(i + 1) - dOf(i)) * fr);
  });
  const phD = phDs[Math.min(M - 1, CAP_N)];
  const pig = PIG.map((p) => ({lo: edgeArr(g, phDs.map((ph) => sOf(ph - p.bound))), hi: edgeArr(g, phDs.map((ph) => sOf(ph + p.bound))), col: p.col}));
  // light: per station, the cross-section angle of the light; the lit interval for each threshold
  const ph0 = g.al.map((a) => Math.atan2(a * CE, SE));
  const shadows = SHADOWS.map((L) => {
    const w = Math.acos(L.th);
    const outer = Math.cos(L.rim);
    const loA: number[] = [], loB: number[] = [], hiA: number[] = [], hiB: number[] = [], liveLo: boolean[] = [], liveHi: boolean[] = [];
    for (let j = 0; j < M; j++) {
      const a = sOf(ph0[j] - w), b = sOf(ph0[j] + w);
      loA.push(-outer);
      loB.push(Math.max(-outer, a));
      hiA.push(Math.min(outer, b));
      hiB.push(outer);
      liveLo.push(a > -outer + 1e-3);
      liveHi.push(b < outer - 1e-3);
    }
    return {
      sides: [
        {lo: edgeArr(g, loA), hi: edgeArr(g, loB), live: liveLo},
        {lo: edgeArr(g, hiA), hi: edgeArr(g, hiB), live: liveHi},
      ],
      op: L.op,
    };
  });
  const lights = LIGHTS.map((L) => {
    const w = Math.acos(L.th);
    return {lo: edgeArr(g, ph0.map((p) => sOf(p - w))), hi: edgeArr(g, ph0.map((p) => sOf(p + w))), op: L.op};
  });
  // the wet specular streak: half way between the view and the light, its width breathing along the body
  const sLo: number[] = [], sHi: number[] = [], hLo: number[] = [], hHi: number[] = [];
  for (let j = 0; j < M; j++) {
    const u = g.u[j];
    const nz = vnoise(u * 9 + 0.3, 1) * 0.65 + vnoise(u * 23, 2) * 0.35;
    const wet = 0.2 + 1.15 * smooth((nz - 0.12) / 0.7);
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
  const l0 = stationOf(g, 0.105 * (g.nS - 1)), l1 = stationOf(g, 0.8 * (g.nS - 1));
  for (const side of [1, -1]) {
    const phs = phDs.map((ph) => ph + side * 94 * DEG);
    const pl = edgeArr(g, phs.map(sOf));
    // the runs of stations where this flank faces the viewer
    let run = -1;
    for (let j = Math.floor(l0); j <= Math.ceil(l1) + 1; j++) {
      const vis = j <= Math.ceil(l1) && j < M && Math.abs(phs[j]) <= 80 * DEG;
      if (vis && run < 0) run = j;
      if (!vis && run >= 0) {
        lateral.push({pts: pl, j0: Math.max(l0, run), j1: Math.min(l1, j - 1)});
        run = -1;
      }
    }
  }
  // fins: dorsal on the dorsal midline's projected side, anal on the opposite side
  const Od: P[] = [], Oa: P[] = [], Bd: P[] = [], Ba: P[] = [], Rd: P[] = [], Ra: P[] = [];
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
    const sd = Math.sin(phDs[j]), sa = -sd;
    const put = (s: number, h: number, O: P[], Bs: P[], Rs: P[]) => {
      const sg = s >= 0 ? 1 : -1;
      const rSide = sg > 0 ? g.rp[j] : g.rm[j];
      let ext = (rSide + h) * Math.abs(s);
      if (k * sg > 1e-6) ext = Math.min(ext, Math.max(rSide * Math.abs(s), 0.86 / Math.abs(k)));
      O.push({x: g.c[j].x + g.n[j].x * sg * ext, y: g.c[j].y + g.n[j].y * sg * ext});
      const bb = rSide * Math.abs(s) * 0.45;
      Bs.push({x: g.c[j].x + g.n[j].x * sg * bb, y: g.c[j].y + g.n[j].y * sg * bb});
      const mm = rSide * Math.abs(s);
      Rs.push({x: g.c[j].x + g.n[j].x * sg * mm, y: g.c[j].y + g.n[j].y * sg * mm});
    };
    put(sd, hd, Od, Bd, Rd);
    put(sa, ha, Oa, Ba, Ra);
  }
  // the fringe around the pointed tail tip
  const jl = M - 1, cN = g.c[jl], T = g.tg[jl], nn = g.n[jl];
  const sd = Math.sin(phDs[jl]), sa = -sd;
  const sgD = sd >= 0 ? 1 : -1, sgA = -sgD;
  const tp = (fw: number, side: number, h: number): P => ({x: cN.x + T.x * fw + nn.x * side * h, y: cN.y + T.y * fw + nn.y * side * h});
  const tip = [tp(TIP_EXT * 0.62, sgD, hdN * Math.abs(sd) * 0.66), tp(TIP_EXT, 0, 0), tp(TIP_EXT * 0.62, sgA, haN * Math.abs(sa) * 0.66)];
  const tipR = [tp(TIP_EXT * 0.05, sgD, 0.05 * Math.abs(sd)), tp(TIP_EXT * 0.12, 0, 0), tp(TIP_EXT * 0.05, sgA, 0.05 * Math.abs(sa))];
  return {
    g, q, px, t, phDs, phD,
    fins: {Od, Oa, Bd, Ba, Rd, Ra, jd0: stationOf(g, EEL_FEAT.dorsalFinU * (g.nS - 1)), ja0: stationOf(g, EEL_FEAT.analFinU * (g.nS - 1)), tip, tipR},
    edges: {m: edgeArr(g, -1), p: edgeArr(g, 1)},
    pig, shadows, lights, spec, lateral,
  };
};

// ---------------------------------------------------------------- one chunk of body
/** a chunk: the body is drawn over [A, B] (extended past cut ends), the fin over [fA, fB]; mask zones black out
 *  what lies beyond the cuts */
type Chunk = {A: number; B: number; fA: number; fB: number; head: boolean; tail: boolean; zones: [number, number][]; feats: Feat[]};

const Body: React.FC<{x: Ctx; ch: Chunk}> = ({x, ch}) => {
  const {g, q} = x;
  const {A, B, head, tail} = ch;
  const M = g.M;
  const els: React.ReactNode[] = [];
  const P_ = () => new PW(q);
  // ---- ribbon fin (behind the body)
  {
    const A = ch.fA, B = ch.fB;
    const fi = x.fins;
    const ff = P_(), fk = P_();
    if (tail) {
      const ext = [...fi.Od, ...fi.tip, ...[...fi.Oa].reverse()];
      const E = 2 * M + 2;
      curve(ff, ext, A, E - A, false, true);
      curve(ff, fi.Ba, A, M - 1, false, false);
      curve(ff, fi.Bd, A, M - 1, true, false);
      ff.Z();
      curve(fk, ext, Math.max(A, fi.jd0), E - Math.max(A, fi.ja0), false, true);
    } else {
      if (B > fi.jd0) {
        strip(ff, fi.Od, fi.Bd, Math.max(A, fi.jd0 - 1), B);
        curve(fk, fi.Od, Math.max(A, fi.jd0), B, false, true);
      }
      if (B > fi.ja0) {
        strip(ff, fi.Oa, fi.Ba, Math.max(A, fi.ja0 - 1), B);
        curve(fk, fi.Oa, Math.max(A, fi.ja0), B, false, true);
      }
    }
    if (!ff.empty) {
      const fd = ff.toString();
      els.push(<path key="ff" d={fd} fill={FIN_FILL} fillOpacity={0.7} />);
      // fine rays: a dashed stroke along the fin's base line, wide enough to reach its edge, clipped to the fin
      if (x.px >= 12) {
        const rw = P_();
        if (tail) {
          const ext = [...fi.Rd, ...fi.tipR, ...[...fi.Ra].reverse()];
          curve(rw, ext, Math.max(A, fi.jd0), 2 * M + 2 - Math.max(A, fi.ja0), false, true);
        } else {
          if (B > fi.jd0) curve(rw, fi.Rd, Math.max(A, fi.jd0), B, false, true);
          if (B > fi.ja0) curve(rw, fi.Ra, Math.max(A, fi.ja0), B, false, true);
        }
        if (!rw.empty) {
          const id = uid('eelfin');
          els.push(
            <clipPath key="fc" id={id}>
              <path d={fd} />
            </clipPath>,
          );
          els.push(
            <path key="fr" d={rw.toString()} clipPath={`url(#${id})`} fill="none" stroke={C.eelBack} strokeOpacity={0.3} strokeWidth={q * FIN_D * 2.3} strokeDasharray={`${q * 0.028} ${q * 0.1}`} strokeLinejoin="round" />,
          );
        }
      }
    }
    if (!fk.empty) els.push(<path key="fk" d={fk.toString()} fill="none" stroke={INK} strokeWidth={1.3} strokeOpacity={0.5} vectorEffect={NS} strokeLinejoin="round" strokeLinecap="round" />);
  }
  // ---- body: base pigment, nested pigment strips
  const em = x.edges.m, ep = x.edges.p;
  {
    const w = P_();
    strip(w, em, ep, A, B);
    els.push(<path key="b0" d={w.toString()} fill={PIG_BASE} />);
  }
  // each opaque pigment step is feathered by a half-opacity stroke of its own colour (a step becomes two half steps)
  const feather = Math.min(2.6, Math.max(1, x.px * 0.05));
  x.pig.forEach((p, i) => {
    const w = P_();
    strip(w, p.lo, p.hi, A, B);
    els.push(<path key={'p' + i} d={w.toString()} fill={p.col} stroke={p.col} strokeOpacity={0.5} strokeWidth={feather} vectorEffect={NS} strokeLinejoin="round" />);
  });
  // ---- light: core shadow levels (both sides in one path; a side left out where it is empty), broad light, gloss
  const live = (L: boolean[]) => {
    for (let j = Math.max(0, Math.floor(A)); j <= Math.min(M - 1, Math.ceil(B)); j++) if (L[j]) return true;
    return false;
  };
  x.shadows.forEach((s, i) => {
    const w = P_();
    for (const sd of s.sides) if (live(sd.live)) strip(w, sd.lo, sd.hi, A, B);
    if (!w.empty) els.push(<path key={'s' + i} d={w.toString()} fill={SHADOW} fillOpacity={s.op} />);
  });
  x.lights.forEach((l, i) => {
    const w = P_();
    strip(w, l.lo, l.hi, A, B);
    els.push(<path key={'l' + i} d={w.toString()} fill={WHITE} fillOpacity={l.op} />);
  });
  {
    const w = P_(), w2 = P_();
    strip(w, x.spec.hlo, x.spec.hhi, A, B);
    strip(w2, x.spec.lo, x.spec.hi, A, B);
    els.push(<path key="sh" d={w.toString()} fill={WHITE} fillOpacity={0.1} />);
    els.push(<path key="sp" d={w2.toString()} fill={WHITE} fillOpacity={0.5} />);
  }
  // ---- lateral line
  x.lateral.forEach((L, i) => {
    const a = Math.max(A, L.j0), b = Math.min(B, L.j1);
    if (b - a < 0.3) return;
    const w = P_();
    curve(w, L.pts, a, b, false, true);
    els.push(<path key={'ll' + i} d={w.toString()} fill="none" stroke={LATERAL} strokeOpacity={0.32} strokeWidth={1.2} vectorEffect={NS} strokeLinecap="round" />);
  });
  // ---- ink silhouette: sides only (cut ends stay open), through the snout / tail tip when they are included
  {
    const w = P_();
    if (head) {
      curve(w, em, 0, B, true, true);
      curve(w, ep, 0, B, false, false);
      if (tail) w.Z();
    } else if (tail) {
      curve(w, em, A, B, false, true);
      curve(w, ep, A, B, true, false);
    } else {
      curve(w, em, A, B, false, true);
      curve(w, ep, A, B, false, true);
    }
    els.push(<path key="ink" d={w.toString()} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" strokeLinecap="butt" />);
  }
  return <>{els}</>;
};

// ---------------------------------------------------------------- the head: eye, mouth, gill slit, pectoral fin
type Feat = 'gill' | 'mouth' | 'pec' | 'eye';
/** where each head feature lies along the body (station coordinates): every chunk whose range overlaps a feature
 *  draws it, and the cut masks split it exactly where the chunks meet (the eye can sit right at a join) */
const featRanges = (g: Geo): [Feat, number, number][] => {
  const S = (u: number, dIdx: number) => stationOf(g, Math.max(0, u * (g.nS - 1) + dIdx));
  return [
    ['gill', S(EEL_FEAT.gillU, -0.9), S(EEL_FEAT.gillU, 0.9)],
    ['mouth', 0, S(0.036, 0.9)],
    ['pec', S(EEL_FEAT.pectoralU, -0.9), S(EEL_FEAT.pectoralU, 3.4)],
    ['eye', S(EEL_FEAT.eyeU, -1.3), S(EEL_FEAT.eyeU, 1.3)],
  ];
};

const Head: React.FC<{x: Ctx; only: Feat[]}> = ({x, only}) => {
  const {g, q, phD, t} = x;
  const want = (f: Feat) => only.includes(f);
  const els: React.ReactNode[] = [];
  const R = (v: number) => Math.round(v * q);
  const st = (u: number) => stationOf(g, u * (g.nS - 1));
  /** point on the body surface at station coordinate js (fractional) and cross angle phi */
  const at = (js: number, phi: number): P => {
    const j = Math.min(g.M - 2, Math.max(0, Math.floor(js))), f = js - j;
    const s = Math.sin(clampPhi(phi));
    const a = edgeAt(g, j, s), b = edgeAt(g, j + 1, s);
    return {x: L1(a.x, b.x, f), y: L1(a.y, b.y, f)};
  };
  const frame = (js: number) => {
    const j = Math.min(g.M - 1, Math.max(0, Math.round(js)));
    const j2 = Math.min(g.M - 1, Math.max(0, Math.ceil(js)));
    return {T: g.tg[j], N: g.n[j], r: g.r[j2]};
  };
  const open = (ps: P[]) => {
    const w = new PW(q);
    curve(w, ps, 0, ps.length - 1, false, true);
    return w.toString();
  };
  for (const side of [1, -1]) {
    const flank = (psi: number) => phD + side * psi;
    /** a feature at angle ψ from the dorsal midline shows only on the side that faces the viewer */
    const shows = (psiDeg: number) => Math.cos(flank(psiDeg * DEG)) > 0.12;
    // gill slit: a short crescent low on the flank, just ahead of the pectoral fin
    if (want('gill') && shows(118)) {
      const jg = st(EEL_FEAT.gillU);
      const fr = frame(jg);
      const ps = [0, 0.5, 1].map((k) => {
        const p = at(jg, flank((102 + 32 * k) * DEG));
        const bow = -0.16 * fr.r * Math.sin(Math.PI * k);
        return {x: p.x + fr.T.x * bow, y: p.y + fr.T.y * bow};
      });
      els.push(<path key={'g' + side} d={open(ps)} fill="none" stroke={INK} strokeOpacity={0.75} strokeWidth={1.5} vectorEffect={NS} strokeLinecap="round" />);
    }
    // mouth: the cleft from the snout tip back to the corner below the eye, the corner turning down a little
    if (want('mouth') && shows(110)) {
      const jt = st(0.036);
      const ps: P[] = [];
      const K = 6;
      for (let k = 0; k <= K; k++) ps.push(at((jt * k) / K, flank((100 + 12 * smooth(k / K)) * DEG)));
      const fr = frame(jt);
      const dn = at(jt, flank(122 * DEG));
      ps.push({x: dn.x + fr.T.x * 0.1 * fr.r, y: dn.y + fr.T.y * 0.1 * fr.r});
      els.push(<path key={'m' + side} d={open(ps)} fill="none" stroke={INK} strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" strokeLinejoin="round" />);
    }
    // pectoral fin: a tiny rounded paddle on the flank, fanning gently
    if (want('pec') && shows(96)) {
      const jp = st(EEL_FEAT.pectoralU);
      const fr = frame(jp);
      const base = at(jp, flank(96 * DEG));
      const r = fr.r;
      const towardBack = Math.sin(phD) <= 0 ? -1 : 1;
      const bx = fr.N.x * towardBack, by = fr.N.y * towardBack;
      const ang = (-20 + 9 * Math.sin(2 * Math.PI * 1.6 * t + side)) * DEG;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ax = fr.T.x * ca - bx * sa, ay = fr.T.y * ca - by * sa;
      const qx = fr.T.x * sa + bx * ca, qy = fr.T.y * sa + by * ca;
      const L = 0.82 * r, Wd = 0.3 * r;
      const shape: [number, number][] = [[-0.04, -0.62], [0.32, -0.92], [0.72, -0.86], [1.0, -0.3], [0.98, 0.25], [0.66, 0.74], [0.28, 0.76], [-0.04, 0.5]];
      const ps = shape.map(([a, b]) => ({x: base.x + ax * a * L - qx * b * Wd, y: base.y + ay * a * L - qy * b * Wd}));
      const w = new PW(q);
      loop(w, ps);
      els.push(<path key={'pf' + side} d={w.toString()} fill={PEC_FILL} fillOpacity={0.72} stroke={INK} strokeOpacity={0.75} strokeWidth={1.3} vectorEffect={NS} strokeLinejoin="round" />);
      const rays = new PW(q);
      for (const b of [-0.45, 0, 0.42]) {
        rays.M(base.x + ax * 0.12 * L - qx * b * Wd * 0.35, base.y + ay * 0.12 * L - qy * b * Wd * 0.35);
        rays.L(base.x + ax * 0.82 * L - qx * b * Wd * 1.05, base.y + ay * 0.82 * L - qy * b * Wd * 1.05);
      }
      els.push(<path key={'pr' + side} d={rays.toString()} stroke={C.eelBack} strokeOpacity={0.35} strokeWidth={1} vectorEffect={NS} fill="none" strokeLinecap="round" />);
    }
    // eye: small, dark, with a thin silvery ring and a highlight toward the light
    if (want('eye') && shows(60)) {
      const je = st(EEL_FEAT.eyeU);
      const fr = frame(je);
      const phE = flank(60 * DEG);
      const ce = at(je, phE);
      const fo = Math.max(0.25, Math.cos(clampPhi(phE)));
      const er = 0.25 * Math.max(fr.r, 0.9);
      const angDeg = Math.round((Math.atan2(fr.T.y, fr.T.x) * 1800) / Math.PI) / 10;
      const cx = R(ce.x), cy = R(ce.y);
      const tr = `rotate(${angDeg} ${cx} ${cy})`;
      els.push(<ellipse key={'er' + side} cx={cx} cy={cy} rx={R(er)} ry={R(er * fo)} transform={tr} fill={EYE_RING} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />);
      els.push(<ellipse key={'ep' + side} cx={cx} cy={cy} rx={R(er * 0.72)} ry={R(er * 0.72 * fo)} transform={tr} fill={C.eelEye} />);
      els.push(<circle key={'eh' + side} cx={R(ce.x + LX * er * 0.36)} cy={R(ce.y + LY * er * 0.36)} r={R(er * 0.26)} fill={WHITE} fillOpacity={0.95} />);
      els.push(<circle key={'ei' + side} cx={R(ce.x - LX * er * 0.3)} cy={R(ce.y - LY * er * 0.3)} r={R(er * 0.1)} fill={WHITE} fillOpacity={0.6} />);
    }
  }
  return <>{els}</>;
};

// ---------------------------------------------------------------- the component
export const Eel: React.FC<EelProps> = ({pts, radii, from = 0, to, px, t, dorsal = 1, opacity, clip, over = 'tail'}) => {
  const nS = pts.length;
  if (nS < 4 || radii.length < nS) return null;
  const last = nS - 1;
  const a = Math.max(0, Math.min(last, from));
  const b = Math.max(0, Math.min(last, to ?? last));
  if (b - a < 1e-4) return null;
  const pxx = Math.max(0.5, px);
  const g = build(pts, radii);
  const x = makeCtx(g, pxx, t, dorsal);
  const M = g.M;
  // chunks (in sample indices) where the body crosses over itself
  const bounds = [a, ...chunkCuts(pts, radii, g.arcS, a, b), b];
  const tailOn = over === 'tail';
  /** ~1.5 px, in station units at station coordinate j */
  const epsAt = (j: number) => {
    const i = Math.max(0, Math.min(M - 2, Math.floor(j)));
    const sl = Math.hypot(g.c[i + 1].x - g.c[i].x, g.c[i + 1].y - g.c[i].y);
    return Math.min(0.5, 1.5 / pxx / Math.max(1e-3, sl));
  };
  const EXT = 1; // how far the body runs on past a cut, under the mask (stations)
  const FR = featRanges(g);
  const chunks: Chunk[] = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    const first = k === 0, lastC = k === bounds.length - 2;
    const head = first && a < 1e-6;
    const tail = lastC && b >= last - 1e-6;
    const eA = head ? 0 : stationOf(g, bounds[k]);
    const eB = tail ? M - 1 : stationOf(g, bounds[k + 1]);
    // the fin (one translucent path, so its cut is a single edge already) is always drawn over the exact range
    let A = eA, B = eB;
    const fA = eA, fB = eB;
    const zones: [number, number][] = [];
    // head features overlapping this chunk (drawn whole, then cut by the same masks as the body)
    const near = FR.filter(([, f0, f1]) => f1 > eA && f0 < eB);
    const feats = near.map(([f]) => f);
    const fMin = Math.min(eA, ...near.map(([, f0]) => f0)), fMax = Math.max(eB, ...near.map(([, , f1]) => f1));
    if (!head) {
      // drawn after its neighbour at the start (a later section, or the next chunk when the tail lies on top)?
      const overlapper = first ? true : tailOn;
      const cut = overlapper ? Math.max(0, eA - epsAt(eA)) : eA;
      A = Math.max(0, cut - EXT);
      zones.push([Math.max(0, Math.min(A, fMin) - 0.4), cut]);
    }
    if (!tail) {
      const overlapper = lastC ? false : !tailOn;
      const cut = overlapper ? Math.min(M - 1, eB + epsAt(eB)) : eB;
      B = Math.min(M - 1, cut + EXT);
      zones.push([cut, Math.min(M - 1, Math.max(B, fMax) + 0.4)]);
    }
    chunks.push({A, B, fA, fB, head, tail, zones, feats});
  }
  const order = tailOn ? chunks : [...chunks].reverse();
  const defs: React.ReactNode[] = [];
  let clipRef: string | undefined;
  if (clip) {
    if (clip.startsWith('url(')) clipRef = clip;
    else {
      const id = uid('eelclip');
      clipRef = `url(#${id})`;
      defs.push(
        <clipPath key="clip" id={id}>
          <path d={clip} />
        </clipPath>,
      );
    }
  }
  // the masks that make the cuts (white everywhere around the chunk, black beyond its cut ends)
  const pad = 6 / pxx;
  const maskOf = (ch: Chunk, i: number) => {
    if (!ch.zones.length) return undefined;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const zs = ch.zones.flat();
    const j0 = Math.max(0, Math.floor(Math.min(ch.A, ch.fA, ...zs))), j1 = Math.min(M - 1, Math.ceil(Math.max(ch.B, ch.fB, ...zs)));
    for (let j = j0; j <= j1; j++) {
      const rr = g.r[j] + FIN_D + 1;
      x0 = Math.min(x0, g.c[j].x - rr);
      y0 = Math.min(y0, g.c[j].y - rr);
      x1 = Math.max(x1, g.c[j].x + rr);
      y1 = Math.max(y1, g.c[j].y + rr);
    }
    const w = new PW(x.q);
    for (const [za, zb] of ch.zones) {
      if (zb - za < 1e-4) continue;
      const lo: P[] = [], hi: P[] = [];
      for (let j = 0; j < M; j++) {
        // the zone reaches past the silhouette and its ink; on the inside of a bend it stays within the curvature
        const k = g.kap[j];
        const em = k < -1e-6 ? Math.min(pad, Math.max(0, 0.9 / -k - g.rm[j])) : pad;
        const ep = k > 1e-6 ? Math.min(pad, Math.max(0, 0.9 / k - g.rp[j])) : pad;
        lo.push(edgeAt(g, j, -1, em));
        hi.push(edgeAt(g, j, 1, ep));
      }
      strip(w, lo, hi, za, zb);
    }
    const id = uid('eelcut');
    const Q = x.q;
    defs.push(
      <mask key={'m' + i} id={id} maskUnits="userSpaceOnUse" x={Math.floor(x0 * Q)} y={Math.floor(y0 * Q)} width={Math.ceil((x1 - x0) * Q)} height={Math.ceil((y1 - y0) * Q)}>
        <rect x={Math.floor(x0 * Q)} y={Math.floor(y0 * Q)} width={Math.ceil((x1 - x0) * Q)} height={Math.ceil((y1 - y0) * Q)} fill="#FFFFFF" />
        <path d={w.toString()} fill="#000000" />
      </mask>,
    );
    return `url(#${id})`;
  };
  const parts = order.map((ch, i) => (
    <g key={i} mask={maskOf(ch, i)}>
      <Body x={x} ch={ch} />
      {ch.feats.length > 0 && <Head x={x} only={ch.feats} />}
    </g>
  ));
  // (clip and mask units are userSpaceOnUse: the clip is read in the layer's units, the masks in the scaled space
  // of the chunk groups that reference them, wherever the <defs> sits)
  return (
    <g opacity={opacity} clipPath={clipRef}>
      {defs.length > 0 && <defs>{defs}</defs>}
      <g transform={`scale(${1 / x.q})`}>{parts}</g>
    </g>
  );
};

/** the eel's silhouette over a section (body, optionally with the ribbon fin), one closed path in the layer's
 *  units, for masks and clips (holes along the eel in the translucent skin, a glow, a contact shadow); `grow`
 *  widens it by that many units */
export const eelSilhouette = (pts: P[], radii: number[], from = 0, to?: number, withFins = false, t = 0, dorsal: number | number[] = 1, grow = 0): string => {
  const nS = pts.length;
  if (nS < 4) return '';
  const last = nS - 1;
  const a = Math.max(0, Math.min(last, from)), b = Math.max(0, Math.min(last, to ?? last));
  if (b - a < 1e-4) return '';
  const g = build(pts, radii);
  const w = new PW(1000);
  const A = a < 1e-6 ? 0 : stationOf(g, a), B = b >= last - 1e-6 ? g.M - 1 : stationOf(g, b);
  const em: P[] = [], ep: P[] = [];
  for (let j = 0; j < g.M; j++) {
    em.push(edgeAt(g, j, -1, grow));
    ep.push(edgeAt(g, j, 1, grow));
  }
  strip(w, em, ep, A, B);
  if (withFins) {
    const fi = makeCtx(g, 100, t, dorsal).fins;
    if (B > fi.jd0) strip(w, fi.Od, fi.Bd, Math.max(A, fi.jd0 - 1), B);
    if (B > fi.ja0) strip(w, fi.Oa, fi.Ba, Math.max(A, fi.ja0 - 1), B);
    if (b >= last - 1e-6) {
      w.M(fi.tip[0].x, fi.tip[0].y);
      w.L(fi.tip[1].x, fi.tip[1].y);
      w.L(fi.tip[2].x, fi.tip[2].y);
      w.L(g.c[g.M - 1].x, g.c[g.M - 1].y);
      w.Z();
    }
  }
  // absolute integers in thousandths → back to units
  return w
    .toString()
    .replace(/-?\d+/g, (m) => String(Number(m) / 1000));
};
