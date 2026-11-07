// BIRD: the preserved exterior of the bird drone (a generic medium-sized brown bird, no species claimed), drawn
// through any camera (three.ts Basis) from the rig's one geometry (rig.ts BODY / BEAK / EYE / TAIL / FEATHERS).
//
// How it is built (Weird Crew vector finish):
// - Body: the BODY ellipsoids (+ a small local tail-base volume) are merged into ONE smooth body. A screen-space grid
//   over the body casts a camera ray per vertex (analytic ray/ellipsoid hits): a smooth-union distance gives the
//   single silhouette (inked once, INK_PX), the first hit gives the surface point and a blended normal. Every painted
//   region (cream underparts, brown upperparts with a mid band, the darker head, the pale cheek, two shadow bands
//   and a light band with the key light fixed at the screen's upper left) is a {field >= 0} set extracted with
//   marching squares, so band edges follow the form and markings stay fixed to the body.
// - Feather texture: clean scalloped feather rows on a fixed surface lattice (back, nape, breast), kept where the
//   surface faces the camera and is not occluded.
// - Wings: rigid preserved wings clamped to the spars, every feather of rig FEATHERS projected point by point through
//   wingPt (exact under a close lens). Dorsal (top normal facing the camera) brown with bars and pale tips; ventral
//   pale. A thick leading-edge arm keeps the wing solid edge-on; a feathered shoulder (scapular) patch joins the wing
//   to the body. The near wing is hidden where its plane lies behind the body surface (a depth mask from the same
//   grid), so it emerges from the shoulder along the true intersection: no seam, no floating root.
// - Tail fan of 12 feathers, a short dark beak (two mandibles, nostril, culmen gloss), a fixed glossy glass eye.
// - Cutaway: WINDOW (body-local x, y on the near surface) cut through the shell: far shell's clean inner surface,
//   then the `mech` node, then the near shell with a bevelled cream cut-face rim (feather layer + form) and ink.
//   `cutReveal` limits the open area (the film's wing-shaped wipe); `phantom` ghosts the near wing over the hole.
// - Exploded view: `shellLift` raises the whole shell (body, neck, head, beak, eye, tail); the wings stay on the
//   spars (the shoulder patch fades, a clamp collar and the shell's spar slots show).
// The exterior is PASSIVE: nothing here blinks, breathes or turns; all motion comes from ps (the mechanism).
import React from 'react';
import {
  add3, Basis, capsule2, cross3, dot3, facing, Frame, hull, len3, mul3, norm3, planeMatrix, proj, smoothClosed, smoothOpen, sub3, unproj, V2, V3, xf, xfv,
} from '../three';
import {BEAK, BODY, EYE, Feather, FEATHERS, Pose, TAIL, WING_OUTLINE, WingFrame, wingPt} from '../rig';
import {C, INK, INK_PX, LINE_PX, NS} from './palette';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, W as SCREEN_W, H as SCREEN_H} from '../lib';

// ================================================================ API
export type BirdLook = {
  /** 0..1: how far the flank cutaway is open (0 = closed, exterior intact) */
  cut?: number;
  /** optional screen-space path limiting the open area (the film's wing-shaped wipe); null = whole window */
  cutReveal?: (B: Basis) => string | null;
  /** 0..1: ghost the NEAR wing where it overlaps the open window (1 = about 35% opacity there) */
  phantom?: number;
  /** cm: exploded view, the whole shell (body, neck, head, beak, eye, tail) rises by this (wings stay on the spars) */
  shellLift?: number;
  /** 0..1 (default 1) */
  shellAlpha?: number;
  /** default true */
  wings?: boolean;
  /** 0..1 atmospheric fade toward the background (distance), default 0 */
  tone?: number;
};

// ================================================================ small helpers
const D2R = Math.PI / 180;
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const sp = (p: V2) => `${f1(p.x)},${f1(p.y)}`;
const polyD = (ps: V2[], close = true) => (ps.length ? 'M' + ps.map(sp).join('L') + (close ? 'Z' : '') : '');
const toLocalV = (F: Frame, v: V3): V3 => [dot3(v, F.ex), dot3(v, F.ey), dot3(v, F.ez)];
const lerpTab = (tab: [number, number][], x: number) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (x <= tab[i][0]) {
      const [x0, y0] = tab[i - 1], [x1, y1] = tab[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return tab[tab.length - 1][1];
};
type Tint = (c: string) => string;
const HAZE = '#C6DFEA';
const tintOf = (tone: number): Tint => {
  const k = clamp(tone);
  if (k <= 0.001) return (c) => c;
  return (c) => mix(c, HAZE, k * 0.62);
};
/** key light, fixed in screen space at the upper left, a little in front (world direction toward the light) */
const lightDir = (B: Basis): V3 => {
  const r = (B.roll || 0) * D2R;
  // screen direction (-0.55, -0.72) (y down) -> camera plane, undoing the roll
  const sx = -0.55, sy = -0.72;
  const cx = sx * Math.cos(-r) - sy * Math.sin(-r), cy = sx * Math.sin(-r) + sy * Math.cos(-r);
  return norm3(add3(add3(mul3(B.r, cx), mul3(B.u, -cy)), mul3(B.fw, -0.42)));
};
/** Catmull-Rom resample of a closed 2D polygon */
const crClosed = (ctrl: [number, number][], per: number): [number, number][] => {
  const n = ctrl.length, out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
};

// ================================================================ the body volumes
type E3 = {c: V3; r: V3; cs: number; sn: number; rm: number};
const mkE = (e: {c: V3; r: V3; tilt?: number}): E3 => {
  const t = (e.tilt ?? 0) * D2R;
  return {c: e.c, r: e.r, cs: Math.cos(t), sn: Math.sin(t), rm: (e.r[0] + e.r[1] + e.r[2]) / 3};
};
/** a small local volume that tapers the rear into the tail (it carries the uppertail and undertail coverts) */
const TAILBASE = {c: [-15.0, 1.55, 0] as V3, r: [4.2, 2.35, 3.3] as V3, tilt: 9};
const ELLS: E3[] = [BODY.chest, BODY.rear, BODY.neck, BODY.head, TAILBASE].map(mkE);
const HEAD_I = 3;
const toN = (e: E3, v: V3): V3 => [(v[0] * e.cs + v[1] * e.sn) / e.r[0], (-v[0] * e.sn + v[1] * e.cs) / e.r[1], v[2] / e.r[2]];
const fromN = (e: E3, q: V3): V3 => {
  const a = q[0] * e.r[0], b = q[1] * e.r[1];
  return [e.c[0] + a * e.cs - b * e.sn, e.c[1] + a * e.sn + b * e.cs, e.c[2] + q[2] * e.r[2]];
};
const gradE = (e: E3, p: V3): V3 => {
  const q = toN(e, sub3(p, e.c));
  const g0 = q[0] / e.r[0], g1 = q[1] / e.r[1], g2 = q[2] / e.r[2];
  return norm3([g0 * e.cs - g1 * e.sn, g0 * e.sn + g1 * e.cs, g2]);
};
const qOf = (e: E3, p: V3) => {
  const q = toN(e, sub3(p, e.c));
  return q[0] * q[0] + q[1] * q[1] + q[2] * q[2];
};
/** smooth normal of the merged body at a surface point (body-local) */
const blendNormal = (p: V3): V3 => {
  let n: V3 = [0, 0, 0];
  for (const e of ELLS) {
    const d = Math.max(0, (Math.sqrt(qOf(e, p)) - 1) * e.rm);
    const w = Math.exp(-d / 0.85);
    if (w < 1e-3) continue;
    n = add3(n, mul3(gradE(e, p), w));
  }
  return norm3(n);
};
/** first hit of a ray (body-local origin o, direction d) with the union; t in units of |d| */
const firstHit = (o: V3, d: V3): number => {
  let best = Infinity;
  for (const e of ELLS) {
    const e0 = toN(e, sub3(o, e.c)), g = toN(e, d);
    const a = dot3(g, g), b = dot3(e0, g), c0 = dot3(e0, e0);
    const disc = b * b - a * (c0 - 1);
    if (disc < 0) continue;
    const t = (-b - Math.sqrt(disc)) / a;
    if (t > 1e-4 && t < best) best = t;
  }
  return best;
};
/** the near (+z) outer surface at body-local (x, y) */
const surfNear = (x: number, y: number): {p: V3; n: V3} => {
  const o: V3 = [x, y, 40];
  const t = firstHit(o, [0, 0, -1]);
  if (!isFinite(t)) return {p: [x, y, 0.5], n: [0, 0, 1]};
  const p: V3 = [x, y, 40 - t];
  return {p, n: blendNormal(p)};
};
/** the outer surface along a ray from the body axis at x, angle psi (0 = up, pi/2 = near side, pi = down) */
const AXIS_Y: [number, number][] = [[-22, 2.4], [-15, 1.5], [-8, 0.8], [0, 0.2], [6, 0.8], [9, 2.6], [11.5, 5.2], [13.5, 7.0], [22, 7.4]];
const surfAround = (x: number, psi: number): {p: V3; n: V3} | null => {
  const o: V3 = [x, lerpTab(AXIS_Y, x), 0], d: V3 = [0, Math.cos(psi), Math.sin(psi)];
  let best = -1;
  for (const e of ELLS) {
    const e0 = toN(e, sub3(o, e.c)), g = toN(e, d);
    const a = dot3(g, g), b = dot3(e0, g), c0 = dot3(e0, e0);
    const disc = b * b - a * (c0 - 1);
    if (disc < 0) continue;
    const t = (-b + Math.sqrt(disc)) / a;
    if (t > best) best = t;
  }
  if (best <= 0) return null;
  const p = add3(o, mul3(d, best));
  return {p, n: blendNormal(p)};
};
/** the contour generator (limb) of one ellipsoid seen from body-local eye o: n points (exact under perspective) */
const limb3 = (e: E3, o: V3, n: number): V3[] => {
  const E = toN(e, sub3(o, e.c));
  const L2 = dot3(E, E);
  if (L2 <= 1.0001) return [];
  const En = mul3(E, 1 / Math.sqrt(L2));
  let a = cross3(En, [0, 0, 1]);
  if (len3(a) < 1e-3) a = cross3(En, [0, 1, 0]);
  a = norm3(a);
  const b = cross3(En, a);
  const c = mul3(E, 1 / L2), rho = Math.sqrt(1 - 1 / L2);
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push(fromN(e, add3(c, add3(mul3(a, rho * Math.cos(t)), mul3(b, rho * Math.sin(t))))));
  }
  return out;
};

// ---------------------------------------------------------------- pigment (body-local surface point p, normal n)
/** the side boundary between the brown upperparts and the cream underparts (y at x) */
const YB: [number, number][] = [[-24, 2.6], [-16, 1.3], [-10, -0.1], [-4, -0.9], [2, -0.9], [6.5, 0.2], [9.5, 2.3], [12.5, 4.5], [15, 5.5], [18, 6.2], [22, 6.5]];
const fBrown = (p: V3, n: V3) => p[1] - lerpTab(YB, p[0]) + 0.9 * n[1];
const fHead = (p: V3, n: V3) => Math.min(fBrown(p, n), p[0] - 10.7 + 0.62 * (p[1] - 5.6));
const CHEEK = {c: [15.15, 6.95], a: 2.45, b: 1.3, rot: 16 * D2R};
const fCheek = (p: V3, n: V3) => {
  const dx = p[0] - CHEEK.c[0], dy = p[1] - CHEEK.c[1];
  const u = dx * Math.cos(CHEEK.rot) + dy * Math.sin(CHEEK.rot), v = -dx * Math.sin(CHEEK.rot) + dy * Math.cos(CHEEK.rot);
  return Math.min(1 - (u / CHEEK.a) ** 2 - (v / CHEEK.b) ** 2, (Math.abs(n[2]) - 0.3) * 3);
};

// ================================================================ marching squares (screen grid -> region loops)
const march = (f: Float32Array, nx: number, ny: number, x0: number, y0: number, cs: number): V2[][] => {
  const v = (i: number, j: number) => (i <= 0 || j <= 0 || i >= nx - 1 || j >= ny - 1 ? -1 : f[j * nx + i]);
  const NH = nx * ny;
  const next = new Map<number, number>();
  const pts = new Map<number, V2>();
  const edgePt = (id: number): V2 => {
    const hit = pts.get(id);
    if (hit) return hit;
    let p: V2;
    if (id < NH) {
      const j = Math.floor(id / nx), i = id - j * nx;
      const a = v(i, j), b = v(i + 1, j);
      p = {x: x0 + (i + a / (a - b)) * cs, y: y0 + j * cs};
    } else {
      const k = id - NH, j = Math.floor(k / nx), i = k - j * nx;
      const a = v(i, j), b = v(i, j + 1);
      p = {x: x0 + i * cs, y: y0 + (j + a / (a - b)) * cs};
    }
    pts.set(id, p);
    return p;
  };
  const ins = [false, false, false, false];
  const E = [0, 0, 0, 0];
  const crId: number[] = [], crEnter: boolean[] = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a0 = v(i, j), a1 = v(i + 1, j), a2 = v(i + 1, j + 1), a3 = v(i, j + 1);
      ins[0] = a0 >= 0; ins[1] = a1 >= 0; ins[2] = a2 >= 0; ins[3] = a3 >= 0;
      if (ins[0] === ins[1] && ins[1] === ins[2] && ins[2] === ins[3]) continue;
      E[0] = j * nx + i; E[1] = NH + j * nx + i + 1; E[2] = (j + 1) * nx + i; E[3] = NH + j * nx + i;
      crId.length = 0; crEnter.length = 0;
      for (let k = 0; k < 4; k++) {
        if (ins[k] !== ins[(k + 1) % 4]) { crId.push(E[k]); crEnter.push(!ins[k]); }
      }
      if (crId.length === 2) {
        if (crEnter[0]) next.set(crId[0], crId[1]); else next.set(crId[1], crId[0]);
      } else if (crId.length === 4) {
        const centreIn = (a0 + a1 + a2 + a3) / 4 >= 0;
        for (let k = 0; k < 4; k++) {
          if (crEnter[k]) continue;
          const en = centreIn ? (k + 1) % 4 : (k + 3) % 4;
          next.set(crId[en], crId[k]);
        }
      }
    }
  }
  const loops: V2[][] = [];
  const seen = new Set<number>();
  next.forEach((_, start) => {
    if (seen.has(start)) return;
    const loop: V2[] = [];
    let cur: number | undefined = start;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur);
      loop.push(edgePt(cur));
      cur = next.get(cur);
    }
    if (loop.length >= 4) loops.push(loop);
  });
  return loops;
};
const loopArea = (L: V2[]) => {
  let a = 0;
  for (let i = 0; i < L.length; i++) {
    const p = L[i], q = L[(i + 1) % L.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
};
/** loops -> one evenodd path (one Laplacian pass, tiny loops dropped) */
const loopsD = (loops: V2[][], minArea: number) => {
  let d = '';
  for (const L of loops) {
    if (Math.abs(loopArea(L)) < minArea) continue;
    const n = L.length;
    const S = L.map((p, i) => {
      const a = L[(i - 1 + n) % n], b = L[(i + 1) % n];
      return {x: 0.25 * a.x + 0.5 * p.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * p.y + 0.25 * b.y};
    });
    d += polyD(S);
  }
  return d;
};

// ================================================================ the body grid
type Ctx = {B: Basis; F: Frame; o: V3; e0: V3[]; c0: number[]; L: V3};
const mkCtx = (B: Basis, F: Frame): Ctx => {
  const o = toLocalV(F, sub3(B.eye, F.o));
  const e0 = ELLS.map((e) => toN(e, sub3(o, e.c)));
  return {B, F, o, e0, c0: e0.map((q) => dot3(q, q)), L: lightDir(B)};
};
const K_SM = 0.95;
type RayRes = {s: number; t: number; p: V3; hit: boolean};
/** one camera ray (body-local direction d, depth-normalised): smooth-union silhouette distance s (cm, < 0 inside),
 *  the first visible surface point (or the nearest limb point when the ray misses), its depth t */
const rayEval = (cx: Ctx, d: V3): RayRes => {
  let best = Infinity, bk = -1, mD = Infinity, mk = 0, mT = 0;
  let mQ: V3 = [0, 0, 1];
  const ds: number[] = [];
  for (let k = 0; k < ELLS.length; k++) {
    const e = ELLS[k], e0 = cx.e0[k], c0 = cx.c0[k];
    const g = toN(e, d);
    const a = dot3(g, g), b = dot3(e0, g);
    const tmin = -b / a;
    const qmin = Math.max(0, c0 - (b * b) / a);
    const pn: V3 = [e0[0] + tmin * g[0], e0[1] + tmin * g[1], e0[2] + tmin * g[2]];
    const sq = Math.sqrt(qmin);
    const Lr = Math.hypot(pn[0] * e.r[0], pn[1] * e.r[1], pn[2] * e.r[2]);
    const dk = sq > 1e-4 ? Lr * (1 - 1 / sq) : -e.rm;
    ds.push(dk);
    if (dk < mD) { mD = dk; mk = k; mT = tmin; mQ = sq > 1e-4 ? [pn[0] / sq, pn[1] / sq, pn[2] / sq] : [0, 0, 1]; }
    const disc = b * b - a * (c0 - 1);
    if (disc >= 0) {
      const th = (-b - Math.sqrt(disc)) / a;
      if (th > 0 && th < best) { best = th; bk = k; }
    }
  }
  let acc = 0;
  for (const dk of ds) acc += Math.exp(-(dk - mD) / K_SM);
  const s = mD - K_SM * Math.log(acc);
  if (bk >= 0) return {s, t: best, p: add3(cx.o, mul3(d, best)), hit: true};
  return {s, t: mT, p: fromN(ELLS[mk], mQ), hit: false};
};
const camRayL = (cx: Ctx, X: number, Y: number): {dw: V3; dl: V3} => {
  const dw = sub3(unproj(cx.B, X, Y, 1), cx.B.eye);
  return {dw, dl: toLocalV(cx.F, dw)};
};

type BodyBuild = {
  outline: string;
  mid: string; brown: string; head: string; cheek: string; sh1: string; sh2: string; li: string;
  hide: string;
  cs: number;
};
/** screen bbox of the merged body */
const bodyBox = (cx: Ctx) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of ELLS) {
    for (const p of limb3(e, cx.o, 20)) {
      const q = proj(cx.B, xf(cx.F, p));
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
  }
  return {x0, y0, x1, y1};
};
const buildBody = (cx: Ctx, wingPlane: {o: V3; n: V3} | null): BodyBuild | null => {
  const bb = bodyBox(cx);
  if (!isFinite(bb.x0)) return null;
  const area0 = Math.max(1, (bb.x1 - bb.x0) * (bb.y1 - bb.y0));
  const cs = clamp(Math.sqrt(area0 / 6500), 3.6, 24);
  const m = 4 * cs;
  const X0 = Math.max(-80, bb.x0 - m), X1 = Math.min(SCREEN_W + 80, bb.x1 + m);
  const Y0 = Math.max(-80, bb.y0 - m), Y1 = Math.min(SCREEN_H + 80, bb.y1 + m);
  if (X1 <= X0 || Y1 <= Y0) return null;
  const nx = Math.max(3, Math.ceil((X1 - X0) / cs) + 1), ny = Math.max(3, Math.ceil((Y1 - Y0) / cs) + 1);
  const N = nx * ny;
  const S = new Float32Array(N), FB = new Float32Array(N), FM = new Float32Array(N), FH = new Float32Array(N), FC = new Float32Array(N);
  const S1 = new Float32Array(N), S2 = new Float32Array(N), LI = new Float32Array(N), HD = new Float32Array(N);
  const F = cx.F;
  const Lw = cx.L;
  let wO: V3 = [0, 0, 0], wN: V3 = [0, 1, 0];
  if (wingPlane) { wO = wingPlane.o; wN = wingPlane.n; }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const X = X0 + i * cs, Y = Y0 + j * cs;
      const {dw, dl} = camRayL(cx, X, Y);
      const r = rayEval(cx, dl);
      const n = blendNormal(r.p);
      const nw = xfv(F, n);
      const NL = dot3(nw, Lw);
      S[k] = -r.s;
      const fb = fBrown(r.p, n);
      FB[k] = fb;
      FM[k] = fb + 0.75;
      FH[k] = fHead(r.p, n);
      FC[k] = fCheek(r.p, n);
      S1[k] = 0.06 - NL;
      S2[k] = -0.4 - NL;
      LI[k] = NL - 0.6;
      if (wingPlane) {
        const den = dot3(dw, wN);
        let tw = 1e9;
        if (Math.abs(den) > 1e-6) {
          const tt = dot3(sub3(wO, cx.B.eye), wN) / den;
          if (tt > 0) tw = tt;
        }
        HD[k] = Math.min(tw - r.t, -r.s);
      }
    }
  }
  const ma = cs * cs * 1.2;
  const go = (f: Float32Array) => loopsD(march(f, nx, ny, X0, Y0, cs), ma);
  return {
    outline: go(S),
    mid: go(FM), brown: go(FB), head: go(FH), cheek: go(FC), sh1: go(S1), sh2: go(S2), li: go(LI),
    hide: wingPlane ? go(HD) : '',
    cs,
  };
};

// ---------------------------------------------------------------- feather scallops on the body (a fixed lattice)
type Scal = {p: V3; n: V3; dir: V3; w: number; h: number; kind: 0 | 1 | 2};
const SCALLOPS: Scal[] = (() => {
  const out: Scal[] = [];
  const add = (x: number, psi: number, kind: 0 | 1 | 2, w: number, h: number, dir: V3) => {
    const s = surfAround(x, psi);
    if (s) out.push({p: s.p, n: s.n, dir: norm3(dir), w, h, kind});
  };
  // back, scapulars and rump: staggered rows of feather tips pointing back
  let row = 0;
  for (let x = -16.5; x <= 8.6; x += 1.55, row++) {
    for (let k = 0; k < 8; k++) {
      const psi = -0.75 + k * 0.29 + (row % 2) * 0.145;
      add(x, psi, 0, 0.82, 0.5, [-1, -0.12, 0]);
      add(x, -psi, 0, 0.82, 0.5, [-1, -0.12, 0]);
    }
  }
  // nape and hind neck: finer rows
  row = 0;
  for (let x = 9.2; x <= 12.4; x += 1.05, row++) {
    for (let k = 0; k < 6; k++) {
      const psi = -0.2 + k * 0.32 + (row % 2) * 0.16;
      add(x, psi, 2, 0.56, 0.34, [-1, -0.25, 0]);
      add(x, -psi, 2, 0.56, 0.34, [-1, -0.25, 0]);
    }
  }
  // breast and flanks: softer, larger arcs pointing down and back
  row = 0;
  for (let x = -7; x <= 12.2; x += 1.6, row++) {
    for (let k = 0; k < 5; k++) {
      const psi = 1.62 + k * 0.32 + (row % 2) * 0.16;
      add(x, psi, 1, 0.74, 0.44, [-0.65, -0.76, 0]);
      add(x, -psi, 1, 0.74, 0.44, [-0.65, -0.76, 0]);
    }
  }
  return out;
})();
const scallopPaths = (cx: Ctx) => {
  const ds: string[] = ['', '', ''];
  const camL = cx.o;
  for (const sc of SCALLOPS) {
    const V = sub3(camL, sc.p);
    const dist = len3(V);
    const vn = mul3(V, 1 / dist);
    const nv = dot3(sc.n, vn);
    if (nv < 0.28) continue;
    const fb = fBrown(sc.p, sc.n);
    if (sc.kind === 0 && fb < 0.25) continue;
    if (sc.kind === 1 && fb > -0.35) continue;
    if (sc.kind === 2 && fb < 0.2) continue;
    if (sc.kind === 2 && fHead(sc.p, sc.n) > -0.4) continue;
    // occlusion (another part of the body in front)
    const back = firstHit(camL, mul3(V, -1 / dist));
    if (back < dist - 0.3) continue;
    const t0 = sub3(sc.dir, mul3(sc.n, dot3(sc.dir, sc.n)));
    const tb = norm3(t0), ts = norm3(cross3(sc.n, tb));
    const P = (a: number, b: number) => {
      const q = proj(cx.B, xf(cx.F, add3(sc.p, add3(mul3(ts, a), mul3(tb, b)))));
      return q;
    };
    const A = P(sc.w, -0.25 * sc.h), Bp = P(-sc.w, -0.25 * sc.h);
    const c1 = P(sc.w * 0.95, sc.h * 1.05), c2 = P(-sc.w * 0.95, sc.h * 1.05);
    ds[sc.kind] += `M${sp(A)}C${sp(c1)} ${sp(c2)} ${sp(Bp)}`;
  }
  return ds;
};

// ================================================================ wings
const SS = [0, 0.06, 0.16, 0.3, 0.45, 0.6, 0.72, 0.8, 0.86, 0.91, 0.95, 0.98, 1];
const widthProfile = (s: number, sc: number) => {
  const rise = 0.58 + 0.42 * sm(s / 0.24);
  const cap = s > sc ? Math.sqrt(Math.max(0, 1 - ((s - sc) / (1 - sc)) ** 2)) : 1;
  return rise * cap;
};
type F2 = [number, number];
type FeatherGeo = {at: (s: number, side: number) => F2; outline: F2[]; L: number};
const featherGeo = (base: F2, tip: F2, w: number, sc: number, kl = 0.92, kr = 1.08): FeatherGeo => {
  const da = tip[0] - base[0], db = tip[1] - base[1];
  const L = Math.hypot(da, db);
  const u: F2 = [da / L, db / L], v: F2 = [-u[1], u[0]];
  const at = (s: number, side: number): F2 => {
    const hw = (w / 2) * widthProfile(s, sc) * (side > 0 ? kl : kr) * Math.abs(side);
    const sg = side >= 0 ? 1 : -1;
    return [base[0] + u[0] * L * s + v[0] * hw * sg, base[1] + u[1] * L * s + v[1] * hw * sg];
  };
  const outline: F2[] = [];
  for (const s of SS) outline.push(at(s, 1));
  for (let i = SS.length - 2; i >= 0; i--) outline.push(at(SS[i], -1));
  return {at, outline, L};
};
/** a chevron bar across a feather between s1 and s2 (pointing toward the tip at the shaft) */
const barPoly = (g: FeatherGeo, s1: number, s2: number, dip: number): F2[] => [
  g.at(s1, 1), g.at(s1 + dip, 0), g.at(s1, -1), g.at(s2, -1), g.at(s2 + dip, 0), g.at(s2, 1),
];
const tipPoly = (g: FeatherGeo, s0: number): F2[] => {
  const out: F2[] = [];
  for (const s of SS) if (s >= s0) out.push(g.at(s, 1));
  for (let i = SS.length - 2; i >= 0; i--) if (SS[i] >= s0) out.push(g.at(SS[i], -1));
  return [g.at(s0, 1), ...out, g.at(s0, -1)];
};
type FeatherSpec = {f: Feather; i: number; g: FeatherGeo};
const KIND_SC: Record<Feather['kind'], number> = {primary: 0.7, secondary: 0.8, covert: 0.74, lesser: 0.7};
const WING_FEATHERS: FeatherSpec[] = FEATHERS.map((f, i) => ({f, i, g: featherGeo(f.base, f.tip, f.w, KIND_SC[f.kind], f.kind === 'primary' ? 0.78 : 0.92, f.kind === 'primary' ? 1.12 : 1.08)}));
const KIND_INDEX = (() => {
  const counts: Record<string, number> = {};
  return FEATHERS.map((f) => {
    counts[f.kind] = (counts[f.kind] ?? 0) + 1;
    return counts[f.kind] - 1;
  });
})();
const KIND_N: Record<Feather['kind'], number> = {primary: 0, secondary: 0, covert: 0, lesser: 0};
FEATHERS.forEach((f) => { KIND_N[f.kind]++; });
/** the feathered shoulder (scapular / axillary) patch joining the wing root to the body, in wing coords */
const FAIR: F2[] = (() => {
  const out: F2[] = [[0.5, -1.5], [3.5, -2.1], [7.4, -2.35]];
  const n = 6, b0 = -2.35, b1 = 11.2;
  for (let k = 0; k < n; k++) {
    const ba = b0 + ((b1 - b0) * k) / n, bb = b0 + ((b1 - b0) * (k + 1)) / n;
    const aa = 7.3 - 0.1 * k;
    for (let q = 1; q <= 4; q++) {
      const u = q / 4;
      out.push([aa + 1.05 * Math.sin(u * Math.PI) - 0.1 * u, ba + (bb - ba) * u]);
    }
  }
  out.push([4.0, 11.35], [0.5, 10.9]);
  return out;
})();
/** inner scallop row of the shoulder patch (open arcs), in wing coords */
const FAIR_ROW: F2[][] = (() => {
  const rows: F2[][] = [];
  for (const [aa, k0, n] of [[4.7, -1.6, 6], [2.6, -1.2, 5]] as [number, number, number][]) {
    const b1 = 10.6;
    for (let k = 0; k < n; k++) {
      const ba = k0 + ((b1 - k0) * k) / n, bb = k0 + ((b1 - k0) * (k + 1)) / n;
      const arc: F2[] = [];
      for (let q = 0; q <= 4; q++) {
        const u = q / 4;
        arc.push([aa + 0.85 * Math.sin(u * Math.PI), ba + (bb - ba) * u]);
      }
      rows.push(arc);
    }
  }
  return rows;
})();
/** the leading-edge arm (keeps the wing solid when seen edge-on): (a, b, radius cm) */
const ARM: [number, number, number][] = [[5.0, -1.45, 0.95], [9, -1.75, 0.88], [13, -1.95, 0.78], [17, -1.85, 0.62], [20.4, -1.5, 0.48], [23.5, -0.9, 0.34]];

type WingStyle = {
  T: Tint;
  /** opacity of the shoulder patch (0 when the root is exposed in the exploded view) */
  fair: number;
  /** clamp collar at the root (exploded view), 0..1 */
  collar: number;
  detail: number;
};
const wingColours = (dorsal: boolean, T: Tint, lightK: number) => {
  const L = (c: string) => {
    const k = lightK;
    return T(k >= 0 ? mix(c, '#FFF6E4', k * 0.32) : mix(c, '#2A180C', -k * 0.42));
  };
  if (dorsal) {
    return {
      L,
      primary: (i: number) => mix(mix(C.flight, C.plumageBar, 0.32), C.plumageBar, (i / 8) * 0.25),
      secondary: (i: number) => mix(C.flight, C.plumage, 0.12 + 0.05 * (i % 2)),
      covert: (i: number) => mix(C.plumage, C.plumageDeep, 0.1 + 0.05 * (i % 2)),
      lesser: (i: number) => mix(C.plumageLit, C.plumage, 0.35 + 0.12 * (i % 2)),
      bar: C.plumageBar,
      tip: C.flightEdge,
      covertTip: mix(C.flightEdge, C.plumageLit, 0.25),
      shaft: mix(C.flightEdge, C.flight, 0.35),
      arm: mix(C.plumage, C.plumageLit, 0.35),
      fair: C.plumage,
      fairLine: C.plumageBar,
    };
  }
  return {
    L,
    primary: (i: number) => mix(mix(C.underwingDeep, C.underwing, 0.25), C.underwingDeep, (i / 8) * 0.35),
    secondary: (i: number) => mix(C.underwingDeep, C.underwing, 0.45 + 0.05 * (i % 2)),
    covert: (i: number) => mix(C.underwing, C.breastLit, 0.35 + 0.05 * (i % 2)),
    lesser: (i: number) => mix(C.breastLit, C.underwing, 0.25 + 0.1 * (i % 2)),
    bar: mix(C.underwingDeep, C.flight, 0.35),
    tip: mix(C.underwingDeep, C.flight, 0.22),
    covertTip: mix(C.underwing, C.underwingDeep, 0.35),
    shaft: mix(C.breastLit, '#FFFFFF', 0.4),
    arm: mix(C.underwing, C.breast, 0.4),
    fair: mix(C.breastLit, C.underwing, 0.4),
    fairLine: C.underwingDeep,
  };
};

const WingArt: React.FC<{B: Basis; F: Frame; W: WingFrame; st: WingStyle}> = ({B, F, W, st}) => {
  const P = (a: number, b: number): V2 => {
    const q = proj(B, xf(F, wingPt(W, a, b)));
    return {x: q.x, y: q.y};
  };
  const PP = (pts: F2[]) => pts.map(([a, b]) => P(a, b));
  const mid = xf(F, wingPt(W, 16, 5));
  const topW = xfv(F, W.top);
  const dorsal = facing(B, mid, topW) >= 0;
  const sideN = dorsal ? topW : mul3(topW, -1);
  const lightK = clamp(dot3(norm3(sideN), lightDir(B)) * 0.9 - 0.1, -0.6, 0.6);
  const K = wingColours(dorsal, st.T, lightK);
  const ink = st.T(INK);
  const pxcm = proj(B, mid).s;
  const det = st.detail * clamp((pxcm - 6) / 10);
  // draw order: back to front (dorsal: as listed; ventral: flight groups reversed, so the stack mirrors)
  const groups: Feather['kind'][] = ['primary', 'secondary', 'covert', 'lesser'];
  const order: FeatherSpec[] = [];
  for (const kd of groups) {
    const g = WING_FEATHERS.filter((s) => s.f.kind === kd);
    if (!dorsal) g.reverse();
    order.push(...g);
  }
  // ink underlay: the union silhouette (feathers, arm, shoulder patch)
  let inkD = '';
  for (const s of order) inkD += polyD(PP(s.g.outline));
  const armS = ARM.map(([a, b, r]) => {
    const q = proj(B, xf(F, wingPt(W, a, b)));
    return {p: {x: q.x, y: q.y}, r: r * q.s};
  });
  let armD = '';
  for (let i = 0; i < armS.length - 1; i++) armD += capsule2(armS[i].p, armS[i + 1].p, armS[i].r, armS[i + 1].r);
  const fairPts = PP(FAIR);
  const fairD = st.fair > 0.01 ? smoothClosed(fairPts) : '';
  const fill = (kd: Feather['kind'], ki: number) => K.L(kd === 'primary' ? K.primary(ki) : kd === 'secondary' ? K.secondary(ki) : kd === 'covert' ? K.covert(ki) : K.lesser(ki));
  return (
    <g>
      <path d={inkD + armD} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" vectorEffect={NS} />
      {fairD && <path d={fairD} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" vectorEffect={NS} opacity={st.fair} />}
      <path d={armD} fill={K.L(K.arm)} />
      {order.map((s) => {
        const kd = s.f.kind, ki = KIND_INDEX[s.i];
        const out = polyD(PP(s.g.outline));
        const flight = kd === 'primary' || kd === 'secondary';
        let barD = '';
        let tipD = '';
        let shaftD = '';
        if (flight) {
          if (det > 0.15) {
            const bars = kd === 'primary' ? [[0.5, 0.56], [0.66, 0.71]] : [[0.46, 0.53], [0.63, 0.69]];
            for (const [a, b] of bars) barD += polyD(PP(barPoly(s.g, a, b, 0.025)));
          }
          tipD = polyD(PP(tipPoly(s.g, kd === 'primary' ? 0.9 : 0.88)));
          if (det > 0.35) shaftD = polyD(PP([s.g.at(0.05, 0), s.g.at(0.86, 0)]), false);
        } else if (kd === 'covert') {
          barD = polyD(PP([s.g.at(0.3, 0.45), s.g.at(0.62, 0.42), s.g.at(0.86, 0), s.g.at(0.62, -0.42), s.g.at(0.3, -0.45)]));
          tipD = polyD(PP(tipPoly(s.g, 0.88)));
        } else {
          tipD = polyD(PP(tipPoly(s.g, 0.84)));
        }
        const barOp = flight ? (dorsal ? 0.42 : 0.3) * clamp(det * 1.5) : dorsal ? 0.7 : 0.25;
        return (
          <g key={s.i}>
            <path d={out} fill={fill(kd, ki)} stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.62} strokeLinejoin="round" vectorEffect={NS} />
            {barD && <path d={barD} fill={K.L(K.bar)} opacity={barOp} />}
            {tipD && <path d={tipD} fill={K.L(kd === 'covert' ? K.covertTip : K.tip)} opacity={kd === 'lesser' ? 0.5 : 0.92} />}
            {shaftD && <path d={shaftD} fill="none" stroke={K.L(K.shaft)} strokeWidth={LINE_PX * 0.75} strokeOpacity={0.55 * det} strokeLinecap="round" vectorEffect={NS} />}
          </g>
        );
      })}
      {fairD && (
        <g opacity={st.fair}>
          <path d={fairD} fill={K.L(K.fair)} stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.55} strokeLinejoin="round" vectorEffect={NS} />
          <path d={FAIR_ROW.map((arc) => smoothOpen(PP(arc))).join('')} fill="none" stroke={K.L(K.fairLine)} strokeWidth={LINE_PX} strokeOpacity={dorsal ? 0.5 : 0.35} strokeLinecap="round" vectorEffect={NS} />
        </g>
      )}
      {st.collar > 0.01 && (() => {
        const a = proj(B, xf(F, wingPt(W, 4.6, 0))), b = proj(B, xf(F, wingPt(W, 6.6, 0)));
        return (
          <path d={capsule2(a, b, 0.5 * a.s, 0.5 * b.s)} fill={st.T(C.dark)} stroke={ink} strokeWidth={LINE_PX} vectorEffect={NS} opacity={st.collar} />
        );
      })()}
    </g>
  );
};

/** the wing silhouette as an open outline (no root edge), for the phantom convention */
const wingOutlineOpen = (B: Basis, F: Frame, W: WingFrame) => smoothOpen(WING_OUTLINE.map(([a, b]) => {
  const q = proj(B, xf(F, wingPt(W, a, b)));
  return {x: q.x, y: q.y};
}));

// ================================================================ tail, beak, eye
const TAIL_FEATHERS = (() => {
  const lift = TAIL.lift * D2R;
  const yAt = (x: number) => TAIL.root[1] + (TAIL.root[0] - x) * Math.tan(lift);
  const nT = norm3([Math.sin(lift), Math.cos(lift), 0]);
  const out: {k: number; base: V3; tip: V3; wv: V3; z: number}[] = [];
  for (let k = 0; k < TAIL.n; k++) {
    const zt = -TAIL.spread + (2 * TAIL.spread * k) / (TAIL.n - 1);
    const xt = TAIL.tipX + 1.3 * (zt / TAIL.spread) ** 2;
    const xb = -14.4;
    const base: V3 = [xb, yAt(xb), zt * 0.2];
    const tip: V3 = [xt, yAt(xt), zt];
    const ax = norm3(sub3(tip, base));
    const wv = norm3(cross3(nT, ax));
    out.push({k, base, tip, wv, z: zt});
  }
  return {feathers: out, nT};
})();
const tailPt = (f: {base: V3; tip: V3; wv: V3}, s: number, side: number) => {
  const hw = (TAIL.width / 2) * (0.55 + 0.45 * sm(s / 0.3)) * (s > 0.84 ? Math.sqrt(Math.max(0, 1 - ((s - 0.84) / 0.16) ** 2)) : 1);
  return add3(add3(f.base, mul3(sub3(f.tip, f.base), s)), mul3(f.wv, hw * side));
};
const TailArt: React.FC<{B: Basis; F: Frame; T: Tint; L: V3}> = ({B, F, T, L}) => {
  const P = (p: V3): V2 => {
    const q = proj(B, xf(F, p));
    return {x: q.x, y: q.y};
  };
  const nW = xfv(F, TAIL_FEATHERS.nT);
  const centre = xf(F, [-21, 3, 0]);
  const dorsal = facing(B, centre, nW) >= 0;
  const lightK = clamp(dot3(dorsal ? nW : mul3(nW, -1), L) * 0.9 - 0.1, -0.6, 0.6);
  const Lc = (c: string) => T(lightK >= 0 ? mix(c, '#FFF6E4', lightK * 0.3) : mix(c, '#2A180C', -lightK * 0.4));
  const fs = [...TAIL_FEATHERS.feathers].sort((a, b) => (dorsal ? Math.abs(b.z) - Math.abs(a.z) : Math.abs(a.z) - Math.abs(b.z)));
  const outline = (f: (typeof fs)[number]) => {
    const pts: V2[] = [];
    for (const s of SS) pts.push(P(tailPt(f, s, 1)));
    for (let i = SS.length - 2; i >= 0; i--) pts.push(P(tailPt(f, SS[i], -1)));
    return pts;
  };
  const band = (f: (typeof fs)[number], s0: number, s1: number) => {
    const pts: V2[] = [];
    const ss = SS.filter((s) => s > s0 && s < s1);
    pts.push(P(tailPt(f, s0, 1)));
    for (const s of ss) pts.push(P(tailPt(f, s, 1)));
    pts.push(P(tailPt(f, s1, 1)));
    if (s1 < 1) pts.push(P(tailPt(f, s1 + 0.02, 0)), P(tailPt(f, s1, -1)));
    for (let i = ss.length - 1; i >= 0; i--) pts.push(P(tailPt(f, ss[i], -1)));
    pts.push(P(tailPt(f, s0, -1)), P(tailPt(f, s0 + 0.02, 0)));
    return pts;
  };
  const ink = T(INK);
  const base = dorsal ? C.tail : mix(C.underwingDeep, C.underwing, 0.3);
  const bar = dorsal ? C.plumageBar : mix(C.underwingDeep, C.flight, 0.3);
  const tip = dorsal ? C.flightEdge : mix(C.underwing, '#FFFFFF', 0.2);
  return (
    <g>
      <path d={fs.map((f) => polyD(outline(f))).join('')} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" vectorEffect={NS} />
      {fs.map((f) => {
        const cen = Math.abs(f.z) < 1;
        return (
          <g key={f.k}>
            <path d={polyD(outline(f))} fill={Lc(cen ? mix(base, C.plumage, 0.25) : mix(base, C.plumageDeep, (Math.abs(f.z) / TAIL.spread) * 0.2))} stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.6} strokeLinejoin="round" vectorEffect={NS} />
            <path d={polyD(band(f, 0.76, 0.84))} fill={Lc(bar)} opacity={dorsal ? 0.62 : 0.35} />
            <path d={polyD(band(f, 0.9, 1))} fill={Lc(tip)} opacity={0.88} />
            <path d={polyD([P(tailPt(f, 0.06, 0)), P(tailPt(f, 0.86, 0))], false)} fill="none" stroke={Lc(mix(C.flightEdge, C.tail, 0.35))} strokeWidth={LINE_PX * 0.7} strokeOpacity={0.45} vectorEffect={NS} />
          </g>
        );
      })}
    </g>
  );
};

const BeakArt: React.FC<{B: Basis; F: Frame; T: Tint}> = ({B, F, T}) => {
  const ax = sub3(BEAK.tip, BEAK.base);
  const cAt = (s: number): V3 => add3(add3(BEAK.base, mul3(ax, s)), [0, -0.28 * s * s, 0]);
  const hu = (s: number) => BEAK.hh * Math.pow(Math.max(0, 1 - s), 0.72);
  const hl = (s: number) => BEAK.hh * 0.78 * Math.pow(Math.max(0, 1 - s), 1.05);
  const wd = (s: number) => BEAK.hw * Math.pow(Math.max(0, 1 - s), 0.85);
  const P = (p: V3): V2 => {
    const q = proj(B, xf(F, p));
    return {x: q.x, y: q.y};
  };
  const up: V2[] = [], lo: V2[] = [];
  const tipP = P(add3(BEAK.tip, [0.05, -0.28, 0]));
  for (const s of [0, 0.15, 0.32, 0.5, 0.68, 0.84, 0.94]) {
    const c = cAt(s);
    for (let k = 0; k <= 8; k++) {
      const ph = -Math.PI / 2 + (k / 8) * Math.PI;
      up.push(P(add3(c, [0, hu(s) * Math.cos(ph), wd(s) * Math.sin(ph)])));
      lo.push(P(add3(c, [0, -hl(s) * Math.cos(ph), wd(s) * Math.sin(ph)])));
    }
  }
  up.push(tipP); lo.push(tipP);
  const all = hull([...up, ...lo]);
  const hu2 = hull(up), hl2 = hull(lo);
  const upperOnTop = facing(B, xf(F, cAt(0.4)), xfv(F, [0, 1, 0])) >= 0;
  const comm: V2[] = [0.02, 0.2, 0.4, 0.6, 0.8, 0.94].map((s) => P(add3(cAt(s), [0, 0, wd(s) * 0.98])));
  comm.push(tipP);
  const ridge = [0.08, 0.3, 0.55, 0.72].map((s) => P(add3(cAt(s), [0, hu(s) * 0.9, wd(s) * 0.32])));
  const nos = P(add3(cAt(0.2), [0, hu(0.2) * 0.42, wd(0.2) * 0.72]));
  const sc = proj(B, xf(F, cAt(0.2))).s;
  const nearSide = facing(B, xf(F, cAt(0.3)), xfv(F, [0, 0, 1])) > -0.15;
  const ink = T(INK);
  return (
    <g>
      <path d={polyD(all)} fill={T(mix(C.beak, C.beakLit, 0.3))} stroke={ink} strokeWidth={INK_PX} strokeLinejoin="round" vectorEffect={NS} />
      <path d={polyD(upperOnTop ? hu2 : hl2)} fill={T(upperOnTop ? C.beak : mix(C.beak, C.beakLit, 0.3))} />
      {nearSide && <path d={smoothOpen(comm)} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeLinecap="round" vectorEffect={NS} />}
      <path d={smoothOpen(ridge)} fill="none" stroke={T(C.beakLit)} strokeWidth={Math.max(1.2, 0.22 * sc)} strokeLinecap="round" opacity={0.75} />
      {nearSide && <ellipse cx={nos.x} cy={nos.y} rx={Math.max(1, 0.26 * sc)} ry={Math.max(0.6, 0.11 * sc)} fill={T('#1E1813')} opacity={0.85} />}
    </g>
  );
};

const EyeArt: React.FC<{B: Basis; F: Frame; T: Tint; c: V3; n: V3}> = ({B, F, T, c, n}) => {
  const cw = xf(F, c), nw = xfv(F, n);
  const fv = facing(B, cw, nw);
  if (fv < 0.06) return null;
  const gid = uid('beye');
  const U = norm3(cross3(nw, xfv(F, [0, 1, 0])));
  const V = cross3(nw, U);
  const m = planeMatrix(B, cw, U, V);
  const p = proj(B, cw);
  const r = EYE.r;
  const k = (0.55 + 0.45 * fv) * r * p.s;
  const ink = T(INK);
  return (
    <g>
      <defs>
        <radialGradient id={gid} cx="0.42" cy="0.4" r="0.62">
          <stop offset="0" stopColor={T('#3A2A1E')} />
          <stop offset="0.55" stopColor={T(C.eyeGlass)} />
          <stop offset="1" stopColor={T('#0C0806')} />
        </radialGradient>
      </defs>
      <g transform={m}>
        <circle r={r * 1.24} fill={T(C.eyeRing)} stroke={ink} strokeWidth={LINE_PX} vectorEffect={NS} />
        <circle r={r} fill={`url(#${gid})`} stroke={T('#0B0705')} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
      </g>
      <ellipse cx={p.x - 0.3 * k} cy={p.y - 0.33 * k} rx={0.27 * k} ry={0.22 * k} fill="#FFFFFF" opacity={0.92} />
      <circle cx={p.x + 0.33 * k} cy={p.y + 0.3 * k} r={0.09 * k} fill="#FFFFFF" opacity={0.7} />
    </g>
  );
};

// ================================================================ the cutaway window (body-local x, y on the near flank)
const WINDOW_CTRL: [number, number][] = [
  [8.5, 0.2], [8.1, 2.9], [6.4, 4.8], [3.6, 5.4], [0.6, 4.95], [-1.9, 3.35], [-3.5, 0.6], [-2.65, -2.05], [-0.8, -4.35], [1.8, -5.9], [4.6, -6.2], [6.8, -5.0], [8.1, -2.7],
];
/** the cutaway window on the near flank, body-local (x, y), at the near surface (a smooth closed outline) */
export const WINDOW: [number, number][] = crClosed(WINDOW_CTRL, 4);
const WIN_C: [number, number] = (() => {
  let x = 0, y = 0;
  for (const p of WINDOW) { x += p[0]; y += p[1]; }
  return [x / WINDOW.length, y / WINDOW.length];
})();
const RIM = {bev: 0.42, th: 0.55};
type HoleGeo = {outer: string; inner: string; mid: string; bbox: {x0: number; y0: number; x1: number; y1: number}; s: number};
const holeGeo = (B: Basis, F: Frame, e: number): HoleGeo => {
  const c3 = surfNear(WIN_C[0], WIN_C[1]).p;
  const outer: V2[] = [], inner: V2[] = [], mid: V2[] = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [wx, wy] of WINDOW) {
    const x = WIN_C[0] + (wx - WIN_C[0]) * e, y = WIN_C[1] + (wy - WIN_C[1]) * e;
    const {p, n} = surfNear(x, y);
    let T = sub3(c3, p);
    T = sub3(T, mul3(n, dot3(T, n)));
    const Tn = len3(T) > 1e-6 ? norm3(T) : ([0, 0, 0] as V3);
    const k = Math.min(1, e * 1.6);
    const pi = add3(p, add3(mul3(Tn, RIM.bev * k), mul3(n, -RIM.th)));
    const pm = add3(p, add3(mul3(Tn, RIM.bev * 0.24 * k), mul3(n, -RIM.th * 0.22)));
    const q = proj(B, xf(F, p));
    outer.push({x: q.x, y: q.y});
    const qi = proj(B, xf(F, pi));
    inner.push({x: qi.x, y: qi.y});
    const qm = proj(B, xf(F, pm));
    mid.push({x: qm.x, y: qm.y});
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
  }
  return {outer: smoothClosed(outer), inner: smoothClosed(inner), mid: smoothClosed(mid), bbox: {x0, y0, x1, y1}, s: proj(B, xf(F, c3)).s};
};

// ================================================================ the near wing alone (wipes)
/** the near wing alone (for the film's wing wipes): projected point by point, no shoulder patch */
export const NearWing: React.FC<{B: Basis; F: Frame; ps: Pose}> = ({B, F, ps}) => (
  <WingArt B={B} F={F} W={ps.wing.near} st={{T: (c) => c, fair: 0, collar: 0, detail: 1}} />
);

/** a coarse screen-space silhouette (convex hull of body, tail, beak and both wings) for masks and keep-outs */
export const birdHull = (B: Basis, F: Frame, ps: Pose): V2[] => {
  const pts: V2[] = [];
  const o = toLocalV(F, sub3(B.eye, F.o));
  for (const e of ELLS) for (const p of limb3(e, o, 16)) pts.push(proj(B, xf(F, p)));
  for (const f of TAIL_FEATHERS.feathers) pts.push(proj(B, xf(F, f.tip)));
  pts.push(proj(B, xf(F, BEAK.tip)));
  for (const W of [ps.wing.near, ps.wing.far]) for (const [a, b] of WING_OUTLINE) pts.push(proj(B, xf(F, wingPt(W, a, b))));
  return hull(pts.map((p) => ({x: p.x, y: p.y})));
};

// ================================================================ the bird
export const Bird: React.FC<{B: Basis; F: Frame; ps: Pose; look?: BirdLook; mech?: React.ReactNode}> = ({B, F, ps, look = {}, mech}) => {
  const cut = clamp(look.cut ?? 0), phantom = clamp(look.phantom ?? 0), lift = Math.max(0, look.shellLift ?? 0);
  const shellAlpha = clamp(look.shellAlpha ?? 1), wings = look.wings ?? true;
  const T = tintOf(look.tone ?? 0);
  const ink = T(INK);
  const Fs: Frame = lift > 0 ? {...F, o: add3(F.o, mul3(F.ey, lift))} : F;
  const cx = mkCtx(B, Fs);
  const Wn = ps.wing.near;
  const wingPlane = wings ? {o: xf(F, Wn.o), n: xfv(F, Wn.top)} : null;
  const body = buildBody(cx, wingPlane);
  const lifted = lift > 0.02;
  const eCut = sm(cut);
  const hole = eCut > 0.004 ? holeGeo(B, Fs, eCut) : null;
  const reveal = hole && look.cutReveal ? look.cutReveal(B) : null;
  const ids = {clip: uid('bbody'), win: uid('bwin'), rev: uid('brev'), mBody: uid('bmb'), mWing: uid('bmw'), mHide: uid('bmh'), gIn: uid('bgin'), gRim: uid('bgrim')};
  const BIG = {x: -4000, y: -4000, width: 9000, height: 10000};
  const st: WingStyle = {T, fair: clamp(1 - lift / 1.6), collar: clamp(lift / 2.0), detail: 1};
  const scal = body ? scallopPaths(cx) : ['', '', ''];
  const holeFill = reveal ?? (hole ? hole.outer : '');
  // the hole region (window, limited by the reveal) as a clipped group
  const inHole = (child: React.ReactNode) => (
    <g clipPath={`url(#${ids.win})`}>{reveal ? <g clipPath={`url(#${ids.rev})`}>{child}</g> : child}</g>
  );
  const hb = hole?.bbox;

  // ---- body (near shell)
  const bodyArt = body && (
    <g>
      <defs>
        <clipPath id={ids.clip}><path d={body.outline} clipRule="evenodd" fillRule="evenodd" /></clipPath>
      </defs>
      <path d={body.outline} fill={T(C.breast)} fillRule="evenodd" />
      <g clipPath={`url(#${ids.clip})`}>
        <path d={body.mid} fill={T(mix(C.breast, C.plumage, 0.5))} fillRule="evenodd" />
        <path d={body.brown} fill={T(C.plumage)} fillRule="evenodd" />
        <path d={body.head} fill={T(mix(C.head, C.plumageDeep, 0.28))} fillRule="evenodd" />
        <path d={body.cheek} fill={T(C.cheek)} fillRule="evenodd" />
        <path d={scal[0]} fill="none" stroke={T(C.plumageBar)} strokeWidth={LINE_PX} strokeOpacity={0.55} strokeLinecap="round" vectorEffect={NS} />
        <path d={scal[2]} fill="none" stroke={T(C.plumageBar)} strokeWidth={LINE_PX * 0.85} strokeOpacity={0.5} strokeLinecap="round" vectorEffect={NS} />
        <path d={scal[1]} fill="none" stroke={T(C.breastDeep)} strokeWidth={LINE_PX} strokeOpacity={0.6} strokeLinecap="round" vectorEffect={NS} />
        <path d={body.sh1} fill={T('#5A3317')} opacity={0.24} fillRule="evenodd" />
        <path d={body.sh2} fill={T('#3B200E')} opacity={0.2} fillRule="evenodd" />
        <path d={body.li} fill={T('#FFF3D8')} opacity={0.26} fillRule="evenodd" />
        <HeadLine cx={cx} ink={ink} />
      </g>
      <path d={body.outline} fill="none" stroke={ink} strokeWidth={INK_PX} strokeLinejoin="round" vectorEffect={NS} />
      {lifted && <ShoulderSlot B={B} F={Fs} a={clamp(lift / 2)} T={T} />}
    </g>
  );

  return (
    <g>
      <defs>
        {hole && (
          <>
            <clipPath id={ids.win}><path d={hole.outer} /></clipPath>
            {reveal && <clipPath id={ids.rev}><path d={reveal} /></clipPath>}
            <mask id={ids.mBody} maskUnits="userSpaceOnUse" {...BIG}>
              <rect {...BIG} fill="#FFFFFF" />
              <g clipPath={`url(#${ids.win})`}><path d={holeFill} fill="#000000" /></g>
            </mask>
            <linearGradient id={ids.gIn} gradientUnits="userSpaceOnUse" x1={hb!.x0} y1={hb!.y0} x2={hb!.x1} y2={hb!.y1}>
              <stop offset="0" stopColor={T(C.shellInnerDeep)} />
              <stop offset="0.55" stopColor={T(C.shellInner)} />
              <stop offset="1" stopColor={T(mix(C.shellInner, '#FFFFFF', 0.35))} />
            </linearGradient>
            <linearGradient id={ids.gRim} gradientUnits="userSpaceOnUse" x1={hb!.x0} y1={hb!.y0} x2={hb!.x1} y2={hb!.y1}>
              <stop offset="0" stopColor={T(mix(C.shellCut, C.shellInnerDeep, 0.75))} />
              <stop offset="0.5" stopColor={T(mix(C.shellCut, C.shellInnerDeep, 0.25))} />
              <stop offset="1" stopColor={T(C.shellCut)} />
            </linearGradient>
          </>
        )}
        {wings && body && (
          <mask id={ids.mWing} maskUnits="userSpaceOnUse" {...BIG}>
            <rect {...BIG} fill="#FFFFFF" />
            {hole && phantom > 0 && <g clipPath={`url(#${ids.win})`}><path d={holeFill} fill={grey(1 - 0.65 * phantom)} /></g>}
            <path d={body.hide} fill="#000000" fillRule="evenodd" />
          </mask>
        )}
        {wings && body && hole && phantom > 0 && (
          <mask id={ids.mHide} maskUnits="userSpaceOnUse" {...BIG}>
            <rect {...BIG} fill="#FFFFFF" />
            <path d={body.hide} fill="#000000" fillRule="evenodd" />
          </mask>
        )}
      </defs>
      {/* far wing */}
      {wings && <WingArt B={B} F={F} W={ps.wing.far} st={{...st, detail: 0.6}} />}
      {/* the machinery, exposed when the shell is lifted */}
      {lifted && mech}
      <g opacity={shellAlpha}>
        <TailArt B={B} F={Fs} T={T} L={cx.L} />
        {/* the far shell's inner surface and the drive, seen through the window */}
        {hole && inHole(
          <g>
            <path d={hole.outer} fill={T(mix(C.shellInnerDeep, INK, 0.22))} />
            <path d={hole.outer} fill={`url(#${ids.gIn})`} transform={`translate(${f1(0.55 * RIM.th * hole.s)},${f1(0.75 * RIM.th * hole.s)})`} />
            {!lifted && mech}
          </g>,
        )}
        {hole ? <g mask={`url(#${ids.mBody})`}>{bodyArt}</g> : bodyArt}
        {/* the cut face: a bevelled rim (feather layer, then the cream form) */}
        {hole && inHole(
          <g>
            <path d={hole.outer + hole.inner} fill={`url(#${ids.gRim})`} fillRule="evenodd" />
            <path d={hole.outer + hole.mid} fill={T(mix(C.plumageDeep, C.breastDeep, 0.35))} fillRule="evenodd" />
            <path d={hole.inner} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.5} vectorEffect={NS} />
            {reveal && <path d={reveal} fill="none" stroke={T(C.shellCut)} strokeWidth={2 * RIM.bev * hole.s} />}
          </g>,
        )}
        {hole && (
          <g>
            {reveal ? (
              <>
                <g clipPath={`url(#${ids.rev})`}><path d={hole.outer} fill="none" stroke={ink} strokeWidth={LINE_PX * 1.5} vectorEffect={NS} /></g>
                <g clipPath={`url(#${ids.win})`}><path d={reveal} fill="none" stroke={ink} strokeWidth={LINE_PX * 1.5} vectorEffect={NS} /></g>
              </>
            ) : (
              <path d={hole.outer} fill="none" stroke={ink} strokeWidth={LINE_PX * 1.5} vectorEffect={NS} />
            )}
          </g>
        )}
        <BeakArt B={B} F={Fs} T={T} />
        <EyeArt B={B} F={Fs} T={T} c={EYE.near} n={EYE.nNear} />
        <EyeArt B={B} F={Fs} T={T} c={EYE.far} n={EYE.nFar} />
      </g>
      {/* near wing (hidden where its plane lies behind the body surface; ghosted over the open window) */}
      {wings && (
        <g mask={body ? `url(#${ids.mWing})` : undefined}>
          <WingArt B={B} F={F} W={Wn} st={st} />
        </g>
      )}
      {wings && body && hole && phantom > 0 && inHole(
        <g mask={`url(#${ids.mHide})`} opacity={0.9 * phantom}>
          <path d={wingOutlineOpen(B, F, Wn)} fill="none" stroke={ink} strokeWidth={INK_PX * 0.85} strokeDasharray="14 5 3 5" strokeLinejoin="round" vectorEffect={NS} />
        </g>,
      )}
    </g>
  );
};
const grey = (v: number) => {
  const h = Math.round(clamp(v) * 255).toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
};

/** the visible part of the head's own contour inside the body (chin / throat line): a light interior form line */
const HeadLine: React.FC<{cx: Ctx; ink: string}> = ({cx, ink}) => {
  const e = ELLS[HEAD_I];
  const pts = limb3(e, cx.o, 64);
  const segs: V2[][] = [];
  let cur: V2[] = [];
  for (const p of pts) {
    let ok = true;
    for (let k = 0; k < ELLS.length && ok; k++) if (k !== HEAD_I && qOf(ELLS[k], p) < 1.02) ok = false;
    if (ok) {
      const V = sub3(p, cx.o);
      const dist = len3(V);
      const th = firstHit(cx.o, mul3(V, 1 / dist));
      if (th < dist - 0.2) ok = false;
    }
    let q: V2 | null = null;
    if (ok) {
      const pw = proj(cx.B, xf(cx.F, p));
      q = {x: pw.x, y: pw.y};
      // skip where it is the outer silhouette already (the smooth-union outline is inked there)
      const {dl} = camRayL(cx, pw.x, pw.y);
      if (rayEval(cx, dl).s > -0.45) ok = false;
    }
    if (ok && q) cur.push(q);
    else if (cur.length) { segs.push(cur); cur = []; }
  }
  if (cur.length) segs.push(cur);
  const d = segs.filter((s) => s.length >= 3).map((s) => smoothOpen(s)).join('');
  if (!d) return null;
  return <path d={d} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.45} strokeLinecap="round" vectorEffect={NS} />;
};

/** the shell's spar slot at the near shoulder (seen only when the shell is lifted off the frame) */
const ShoulderSlot: React.FC<{B: Basis; F: Frame; a: number; T: Tint}> = ({B, F, a, T}) => {
  const p0 = proj(B, xf(F, surfNear(2.5, 2.7).p)), p1 = proj(B, xf(F, surfNear(2.5, 5.7).p));
  return <path d={capsule2(p0, p1, 0.32 * p0.s, 0.32 * p1.s)} fill={T('#2B1E15')} stroke={T(INK)} strokeWidth={LINE_PX} vectorEffect={NS} opacity={a} />;
};

void hash;
