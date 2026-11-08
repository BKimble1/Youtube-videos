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
// - Feather texture: scalloped feather rows on a fixed surface lattice (back, nape, breast; each row's angles are
//   symmetric by construction, every feather appears once), kept where the surface faces the camera and is not
//   occluded: open tip arcs at mid distance, closed soft tip crescents close up.
// - Wings: rigid preserved wings clamped to the spars, every feather of rig FEATHERS projected point by point through
//   wingPt (exact under a close lens), plus a few inner feathers (tertials / inner coverts) that carry the wing into
//   the shell. Dorsal (top normal facing the camera) brown: flight feathers with bars and pale tips, greater coverts
//   with a dark shaft streak and a thin pale fringe, each covert row casting a soft shadow; ventral pale and quiet.
//   Coverts are lined only along their exposed tips; the lesser coverts sit on a smooth leading-edge strip that ends
//   in a rounded wrist. Seen edge-on, the wing keeps an airfoil-like blade profile with covert-tip scallops. The near
//   wing is hidden where its plane lies behind the body surface (a depth mask from the same grid), and a lens of body
//   plumage (the feathered shoulder, from the true wing / shell intersection out to a ragged scalloped edge) covers the
//   junction. The lens is painted with the body's own layers (the same band, texture and shading paths through <use>),
//   so it continues the body exactly where they meet; it narrows by geometry (never by opacity) as the shell lifts.
// - Tail fan of 12 feathers, a short dark beak (two mandibles, nostril, culmen gloss), a fixed glossy glass eye.
// - Cutaway: WINDOW (body-local x, y on the near surface) cut through the shell: far shell's clean inner surface,
//   then the `mech` node, then the near shell with a bevelled cream cut-face rim (feather layer + form) and ink.
//   `cutReveal` limits the open area (the film's wing-shaped wipe); `phantom` ghosts the near wing over the hole.
// - Exploded view: `shellLift` raises the whole shell (body, neck, head, beak, eye, tail); the wings stay on the
//   spars (the shoulder lens narrows to the junction, the inner feathers draw in to the root, a clamp collar grows in,
//   and the shell's spar slot appears as a dark slit along the spar's whole sweep).
// The exterior is PASSIVE: nothing here blinks, breathes or turns; all motion comes from ps (the mechanism).
import React from 'react';
import {
  add3, Basis, capsule2, cross3, dot3, facing, Frame, hull, len3, mul3, norm3, planeMatrix, proj, smoothClosed, smoothOpen, SP, sub3, unproj, V2, V3, xf, xfv,
} from '../three';
import {BEAK, BODY, EYE, Feather, FEATHERS, HINGE, Pose, TAIL, WING_OUTLINE, WingFrame, wingPt} from '../rig';
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
const TAILBASE = {c: [-15.6, 1.75, 0] as V3, r: [5.0, 2.2, 3.1] as V3, tilt: 11};
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
/** monotone cubic Hermite (Fritsch-Carlson) through a table's nodes: smooth band edges, no corners, no overshoot */
const hermiteTab = (tab: [number, number][]) => {
  const n = tab.length;
  const dx = tab.slice(1).map((p, i) => p[0] - tab[i][0]);
  const dl = tab.slice(1).map((p, i) => (p[1] - tab[i][1]) / dx[i]);
  const m = tab.map((_, i) => (i === 0 ? dl[0] : i === n - 1 ? dl[n - 2] : dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (dl[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / dl[i], b = m[i + 1] / dl[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * dl[i]; m[i + 1] = t * b * dl[i]; }
  }
  return (x: number) => {
    if (x <= tab[0][0]) return tab[0][1];
    if (x >= tab[n - 1][0]) return tab[n - 1][1];
    let i = 0;
    while (x > tab[i + 1][0]) i++;
    const t = (x - tab[i][0]) / dx[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * tab[i][1] + (t3 - 2 * t2 + t) * dx[i] * m[i] + (-2 * t3 + 3 * t2) * tab[i + 1][1] + (t3 - t2) * dx[i] * m[i + 1];
  };
};
const ybAt = hermiteTab(YB);
const fBrown = (p: V3, n: V3) => p[1] - ybAt(p[0]) + 0.9 * n[1];
/** the darker head: a soft ellipsoidal cap around the head volume (about 1.2x its radii, so the boundary curves round
 *  the nape and the throat instead of cutting a straight hood edge across the neck) */
const HEAD_CAP = mkE({c: [BODY.head.c[0] - 0.5, BODY.head.c[1] - 0.25, 0], r: [BODY.head.r[0] * 1.24, BODY.head.r[1] * 1.22, BODY.head.r[2] * 1.4], tilt: (BODY.head.tilt ?? 0) + 12});
const fHead = (p: V3, n: V3) => Math.min(fBrown(p, n), (1 - Math.sqrt(qOf(HEAD_CAP, p))) * 6);
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
/** closed Catmull-Rom curve through the points (compact numbers) */
const curveD = (ps: V2[]) => {
  const n = ps.length;
  if (n < 3) return '';
  let d = `M${sp(ps[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n], p1 = ps[i], p2 = ps[(i + 1) % n], p3 = ps[(i + 2) % n];
    d += `C${sp({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${sp({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${sp(p2)}`;
  }
  return d + 'Z';
};
/** loops -> one evenodd path (one Laplacian pass, tiny loops dropped). Coarse grids (close framings) keep every vertex
 *  and emit curves, so band edges stay round at any zoom; fine grids emit decimated polylines. */
const loopsD = (loops: V2[][], minArea: number, cs: number) => {
  let d = '';
  for (const L of loops) {
    if (Math.abs(loopArea(L)) < minArea) continue;
    const n = L.length;
    const S = L.map((p, i) => {
      const a = L[(i - 1 + n) % n], b = L[(i + 1) % n];
      return {x: 0.25 * a.x + 0.5 * p.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * p.y + 0.25 * b.y};
    });
    if (cs > 6.5) d += curveD(S);
    else d += polyD(n > 24 ? S.filter((_, i) => i % 2 === 0) : S);
  }
  return d;
};

/** in-place separable [1 2 1] / 4 blur of a grid field, `passes` times */
const blurGrid = (f: Float32Array, nx: number, ny: number, passes: number) => {
  const t = new Float32Array(f.length);
  for (let it = 0; it < passes; it++) {
    for (let j = 0; j < ny; j++) {
      const r = j * nx;
      for (let i = 0; i < nx; i++) t[r + i] = 0.25 * f[r + Math.max(0, i - 1)] + 0.5 * f[r + i] + 0.25 * f[r + Math.min(nx - 1, i + 1)];
    }
    for (let j = 0; j < ny; j++) {
      const r = j * nx, ru = Math.max(0, j - 1) * nx, rd = Math.min(ny - 1, j + 1) * nx;
      for (let i = 0; i < nx; i++) f[r + i] = 0.25 * t[ru + i] + 0.5 * t[r + i] + 0.25 * t[rd + i];
    }
  }
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
  box: {x0: number; y0: number; x1: number; y1: number};
  /** the sampled grid's extent (the body's paint layers are defined over all of it) */
  grid: {x0: number; y0: number; x1: number; y1: number};
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
/** extra: a screen box the paint layers must also cover (the near wing's shoulder patch, which rises past the back) */
const buildBody = (cx: Ctx, wingPlane: {o: V3; n: V3} | null, extra: {x0: number; y0: number; x1: number; y1: number} | null): BodyBuild | null => {
  const bb = bodyBox(cx);
  if (!isFinite(bb.x0)) return null;
  const area0 = Math.max(1, (bb.x1 - bb.x0) * (bb.y1 - bb.y0));
  // the grid follows the body's size, but a body larger than the screen is sampled no coarser than 9.5 px
  const clipped = bb.x0 < -80 || bb.y0 < -80 || bb.x1 > SCREEN_W + 80 || bb.y1 > SCREEN_H + 80;
  const cs = Math.min(clamp(Math.sqrt(area0 / 6500), 3.6, 24), clipped ? 9.5 : 24);
  const m = 4 * cs;
  const ex = extra ?? bb;
  const X0 = Math.max(-80, Math.min(bb.x0, ex.x0) - m), X1 = Math.min(SCREEN_W + 80, Math.max(bb.x1, ex.x1) + m);
  const Y0 = Math.max(-80, Math.min(bb.y0, ex.y0) - m), Y1 = Math.min(SCREEN_H + 80, Math.max(bb.y1, ex.y1) + m);
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
      // inside the smooth-union fillets (the ray misses the raw volumes) the nearest limb point's normal is edge-on; the
      // fillet surface really turns toward the camera the deeper inside the silhouette it lies, so tilt it for lighting
      const nl = !r.hit && r.s < 0 ? norm3(add3(n, mul3(norm3(sub3(cx.o, r.p)), clamp(-r.s / K_SM) * 1.6))) : n;
      const NL = dot3(xfv(F, nl), Lw);
      S[k] = -r.s;
      const fb = fBrown(r.p, n);
      FB[k] = fb;
      FM[k] = fb + 0.75;
      FH[k] = fHead(r.p, n);
      FC[k] = fCheek(r.p, n);
      S1[k] = -0.1 - NL;
      S2[k] = -0.5 - NL;
      LI[k] = NL - 0.86;
      if (wingPlane) {
        const den = dot3(dw, wN);
        let tw = 1e9;
        if (Math.abs(den) > 1e-6) {
          const tt = dot3(sub3(wO, cx.B.eye), wN) / den;
          if (tt > 0) tw = tt;
        }
        // a little overlap onto the body (the wing's root feathers lie over the shoulder: no seam along the outline)
        HD[k] = Math.min(tw - r.t - 0.3, -r.s - 0.55);
      }
    }
  }
  const ma = cs * cs * 1.2;
  // the light/shadow bands are low-passed (the lighting contour wiggles in the neck/back saddle and would leave pockets)
  blurGrid(LI, nx, ny, 2); blurGrid(S1, nx, ny, 1); blurGrid(S2, nx, ny, 1);
  const go = (f: Float32Array, minA = ma) => loopsD(march(f, nx, ny, X0, Y0, cs), minA, cs);
  return {
    outline: go(S),
    // the head region drops small loops (no stray chips at the nape)
    mid: go(FM), brown: go(FB), head: go(FH, 6 * cs * cs), cheek: go(FC), sh1: go(S1, 4 * cs * cs), sh2: go(S2, 4 * cs * cs), li: go(LI, 4 * cs * cs),
    hide: wingPlane ? go(HD) : '',
    cs,
    box: {x0: Math.max(X0, bb.x0), y0: Math.max(Y0, bb.y0), x1: Math.min(X1, bb.x1), y1: Math.min(Y1, bb.y1)},
    // the outermost cells are forced outside by march(): keep the paint's base rect within the region it is valid
    grid: {x0: X0 + cs, y0: Y0 + cs, x1: X0 + (nx - 2) * cs, y1: Y0 + (ny - 2) * cs},
  };
};

// ---------------------------------------------------------------- feather scallops on the body (a fixed lattice)
type Scal = {p: V3; n: V3; dir: V3; w: number; h: number; kind: 0 | 1 | 2};
const SCALLOPS: Scal[] = (() => {
  const out: Scal[] = [];
  /** one staggered row at x: feathers at psi = c + (k + stagger) * step, a set symmetric about c by construction (every
   *  angle appears once: no mirrored near-duplicates), then a dedupe pass that drops any feather lying within 0.6 x the
   *  row spacing of one already kept in the same row */
  const row = (x: number, r: number, c: number, step: number, half: number, kind: 0 | 1 | 2, w: number, h: number, dir: V3) => {
    const st = r % 2 ? 0.5 : 0;
    const kept: V3[] = [];
    for (let k = -half; k <= half - (st ? 1 : 0); k++) {
      const s = surfAround(x, c + (k + st) * step);
      if (!s) continue;
      const pr = surfAround(x, c + (k + st + 1) * step);
      const gap = pr ? len3(sub3(pr.p, s.p)) : 1;
      if (kept.some((q) => len3(sub3(q, s.p)) < 0.6 * gap)) continue;
      kept.push(s.p);
      out.push({p: s.p, n: s.n, dir: norm3(dir), w, h, kind});
    }
  };
  // back, scapulars and rump: staggered rows of feather tips pointing back (psi symmetric about the spine)
  let r = 0;
  for (let x = -16.5; x <= 8.6; x += 1.55, r++) row(x, r, 0, 0.29, 5, 0, 0.82, 0.5, [-1, -0.12, 0]);
  // nape and hind neck: finer rows
  r = 0;
  for (let x = 9.2; x <= 12.4; x += 1.05, r++) row(x, r, 0, 0.32, 5, 2, 0.56, 0.34, [-1, -0.25, 0]);
  // breast and flanks: softer, larger arcs pointing down and back (symmetric about the keel, psi = pi)
  r = 0;
  for (let x = -7; x <= 12.2; x += 1.6, r++) row(x, r, Math.PI, 0.32, 5, 1, 0.74, 0.44, [-0.65, -0.76, 0]);
  return out;
})();
/** body feather texture: open tip arcs at mid distance; close up (above ~30 px/cm) the arcs become soft closed feather-tip
 *  crescents (a darker band just inside each tip edge) with a faint edge, so they read as overlapping feathers, not marks */
type ScalSet = {open: string[]; fill: string[]; edge: string[]; openK: number; fillK: number};
/** the texture's zoom response (s0 = px per cm at the body): open arcs fade out and closed tips fade in between ~26 and
 *  ~44 px/cm; the tips deepen with the zoom */
const scalZoom = (s0: number) => ({openK: clamp((44 - s0) / 16), fillK: clamp((s0 - 26) / 16), deep: 1 + 1.1 * clamp((s0 - 22) / 18)});
const scallopPaths = (cx: Ctx): ScalSet => {
  const res: ScalSet = {open: ['', '', ''], fill: ['', '', ''], edge: ['', '', ''], openK: 0, fillK: 0};
  const s0 = proj(cx.B, xf(cx.F, [0, 0, 0])).s;
  if (s0 < 3.5) return res;
  // open arcs hand over to closed tips between ~26 and ~44 px/cm; the tips deepen with the zoom (from the shallow
  // mid-distance scallop to nested tips about two thirds of the row spacing), both drawn on the same arc
  const z = scalZoom(s0);
  res.openK = z.openK;
  res.fillK = z.fillK;
  const deep = z.deep;
  const camL = cx.o;
  SCALLOPS.forEach((sc, idx) => {
    const r = scallopOne(cx, camL, sc, idx, res.fillK > 0.01, deep);
    if (!r) return;
    if (res.openK > 0.01) res.open[sc.kind] += r.arc;
    if (res.fillK > 0.01) {
      res.fill[sc.kind] += r.crescent;
      res.edge[sc.kind] += r.edge;
    }
  });
  return res;
};
const scallopOne = (cx: Ctx, camL: V3, sc: Scal, idx: number, closed: boolean, deep: number): {arc: string; edge: string; crescent: string} | null => {
  {
    const V = sub3(camL, sc.p);
    const dist = len3(V);
    const vn = mul3(V, 1 / dist);
    const nv = dot3(sc.n, vn);
    if (nv < 0.28) return null;
    const fb = fBrown(sc.p, sc.n);
    if (sc.kind === 0 && fb < 0.25) return null;
    if (sc.kind === 1 && fb > -0.35) return null;
    if (sc.kind === 2 && fb < 0.2) return null;
    if (sc.kind === 2 && fHead(sc.p, sc.n) > -0.4) return null;
    // occlusion (another part of the body in front)
    const back = firstHit(camL, mul3(V, -1 / dist));
    if (back < dist - 0.3) return null;
    const t0 = sub3(sc.dir, mul3(sc.n, dot3(sc.dir, sc.n)));
    const tb = norm3(t0), ts = norm3(cross3(sc.n, tb));
    const P = (a: number, b: number) => proj(cx.B, xf(cx.F, add3(sc.p, add3(mul3(ts, a), mul3(tb, b)))));
    // per-feather jitter (+-15 %) so the rows do not stamp
    const w = sc.w * (0.85 + 0.3 * hash(idx * 1.37 + 0.41)), h = deep * sc.h * (0.85 + 0.3 * hash(idx * 2.11 + 5.3));
    // the tip arc: ends on the feather's base line (b = 0), no hooks; the Bezier peak reaches b = h
    const A = P(w, 0), Bp = P(-w, 0);
    const arc = `M${sp(A)}C${sp(P(w, h * 1.33))} ${sp(P(-w, h * 1.33))} ${sp(Bp)}`;
    if (!closed) return {arc, edge: '', crescent: ''};
    // close up: a closed feather tip, a soft dark band just inside the tip edge
    return {arc, edge: arc, crescent: `${arc}C${sp(P(-w * 0.78, h * 0.72))} ${sp(P(w * 0.78, h * 0.72))} ${sp(A)}Z`};
  }
};

// ================================================================ wings
const SS = [0, 0.06, 0.16, 0.3, 0.45, 0.6, 0.72, 0.8, 0.86, 0.91, 0.95, 0.98, 1];
/** r0: the width at the base (lesser coverts keep their full width there, so the leading edge they form is smooth) */
const widthProfile = (s: number, sc: number, r0 = 0.58) => {
  const rise = r0 + (1 - r0) * sm(s / 0.24);
  const cap = s > sc ? Math.sqrt(Math.max(0, 1 - ((s - sc) / (1 - sc)) ** 2)) : 1;
  return rise * cap;
};
type F2 = [number, number];
type FeatherGeo = {at: (s: number, side: number) => F2; outline: F2[]; L: number};
const featherGeo = (base: F2, tip: F2, w: number, sc: number, kl = 0.92, kr = 1.08, r0 = 0.58): FeatherGeo => {
  const da = tip[0] - base[0], db = tip[1] - base[1];
  const L = Math.hypot(da, db);
  const u: F2 = [da / L, db / L], v: F2 = [-u[1], u[0]];
  const at = (s: number, side: number): F2 => {
    const hw = (w / 2) * widthProfile(s, sc, r0) * (side > 0 ? kl : kr) * Math.abs(side);
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
/** the feather's end beyond s0 (closed: a pale tip band; open: the exposed tip arc) */
const tipPoly = (g: FeatherGeo, s0: number): F2[] => {
  const out: F2[] = [];
  for (const s of SS) if (s > s0) out.push(g.at(s, 1));
  for (let i = SS.length - 2; i >= 0; i--) if (SS[i] > s0) out.push(g.at(SS[i], -1));
  return [g.at(s0, 1), ...out, g.at(s0, -1)];
};
/** a narrow dark shaft streak (a covert's centre mark), tapered at both ends */
/** a thin pale fringe along a feather's exposed tip edge (from s0 round the tip), thickness k (fraction of the length) */
const fringePoly = (g: FeatherGeo, s0: number, k: number): F2[] => {
  const ss = SS.filter((s) => s > s0);
  const sq = (s: number) => s0 + (s - s0) * (1 - k / (1 - s0));
  const wf = (s: number) => 1 - 0.26 * clamp((s - s0) / 0.12);
  const inner: F2[] = [...ss.map((s) => g.at(sq(s), -wf(s))), ...[...ss].reverse().map((s) => g.at(sq(s), wf(s)))];
  return [...tipPoly(g, s0), ...inner];
};
/** a feather's tip region pushed out along its axis by d cm (its soft shadow on the row beneath) */
const shadowPoly = (g: FeatherGeo, f: Feather, d: number): F2[] => {
  const da = f.tip[0] - f.base[0], db = f.tip[1] - f.base[1], l = Math.hypot(da, db) || 1;
  const ss = [0.42, 0.62, 0.78, 0.9, 0.97];
  const pts: F2[] = [...ss.map((t) => g.at(t, 1)), g.at(1, 0), ...[...ss].reverse().map((t) => g.at(t, -1))];
  return pts.map(([a, b]) => [a + (da / l) * d, b + (db / l) * d] as F2);
};
const streakPoly = (g: FeatherGeo): F2[] => [g.at(0.3, 0), g.at(0.42, 0.15), g.at(0.62, 0.15), g.at(0.8, 0), g.at(0.62, -0.15), g.at(0.42, -0.15)];

type FeatherSpec = {f: Feather; gi: number; g: FeatherGeo; hTone: number; hTip: number};
const KIND_SC: Record<Feather['kind'], number> = {primary: 0.7, secondary: 0.8, covert: 0.52, lesser: 0.4};
const KIND_W: Record<Feather['kind'], number> = {primary: 1, secondary: 1, covert: 1.22, lesser: 1.3};
const LESSER_FWD = 0.3;
/** one feather's drawing geometry, with a fixed per-feather variation (coverts' length +-5 %) from its index */
const mkSpec = (f0: Feather, gi: number): FeatherSpec => {
  let f = f0;
  if (f.kind === 'covert' || f.kind === 'lesser') {
    const k = 1 + 0.05 * (2 * hash(gi * 3.71 + 9.2) - 1);
    f = {...f, tip: [f.base[0] + (f.tip[0] - f.base[0]) * k, f.base[1] + (f.tip[1] - f.base[1]) * k]};
  }
  // the lesser coverts form the leading edge: full-width bases set 0.3 cm forward, so neighbours overlap into one smooth
  // edge (no notch at every covert)
  const lesser = f.kind === 'lesser';
  if (lesser) f = {...f, base: [f.base[0], f.base[1] - LESSER_FWD]};
  const pr = f.kind === 'primary';
  return {f, gi, g: featherGeo(f.base, f.tip, f.w * KIND_W[f.kind], KIND_SC[f.kind], pr ? 0.78 : 0.92, pr ? 1.12 : 1.08, lesser ? 1 : 0.58), hTone: hash(gi * 7.13 + 1.7), hTip: hash(gi * 5.37 + 4.4)};
};
const WING_FEATHERS: FeatherSpec[] = FEATHERS.map((f, i) => mkSpec(f, i));
/** inner feathers (tertials and inner coverts, rows continued toward the hinge): they carry the wing from the rig's root
 *  (a = 5.4) into the shell, so a raised wing never shows a cut root edge or a gap above the back; inside the body they
 *  are hidden. Listed innermost first (draw order). `k` (0..1) draws them in toward the root (exploded view). */
const INNER_DEF: Feather[] = (() => {
  const out: Feather[] = [];
  for (let j = 3; j >= 1; j--) {
    const a = 6.0 - j * 1.62;
    out.push({base: [a + 0.4, 3.2], tip: [a, 10.75 - 0.22 * j], w: 2.55, kind: 'secondary'});
  }
  for (let j = 3; j >= 1; j--) {
    const a = 5.8 - j * 1.6;
    out.push({base: [a + 0.3, 0.6], tip: [a, 5.55 - 0.12 * j], w: 2.1, kind: 'covert'});
  }
  for (let j = 3; j >= 1; j--) {
    const a = 5.7 - j * 1.45;
    out.push({base: [a + 0.2, -1.9], tip: [a, 1.35], w: 1.7, kind: 'lesser'});
  }
  return out;
})();
const innerSpecs = (k: number): FeatherSpec[] => {
  if (k < 0.05) return [];
  const sq = (a: number) => 5.4 - (5.4 - a) * k;
  return INNER_DEF.map((f, j) => mkSpec({...f, base: [sq(f.base[0]), f.base[1]], tip: [sq(f.tip[0]), f.tip[1]]}, 100 + j));
};
const INNER_FULL = innerSpecs(1);

/** the wing seen (nearly) edge-on: an airfoil-like blade, a rounded leading edge tapering to the trailing edge, so the
 *  wing keeps a readable profile instead of collapsing to a line. Span stations (a, leading-edge radius cm), from a = 6
 *  (never into the body) to the hand. Drawn only near edge-on. */
// (V2) twice the V1 thickness: edge-on, the wing reads as a feathered wing profile, not a stick
const BLADE: [number, number][] = [[6.0, 0.85], [9, 0.76], [13, 0.64], [17, 0.52], [20.4, 0.42], [23.5, 0.32], [27, 0.24], [31, 0.16]];
/** the blade covers the front of the chord only (behind it the feathers themselves continue as the thin trailing part),
 *  so when the wing turns face-on the fading blade always lies under the coverts */
const BLADE_CHORD = 0.5;
/** the blade's leading edge follows the feathers' own front (the lesser coverts' bases, then the outer primary), never
 *  the looser WING_OUTLINE envelope, so it adds no strip in front of the feathers */
const LE_TAB: [number, number][] = [[5.4, -2.1], [24.2, -2.1], [27, -0.55], [31, 1.25], [34.4, 2.9]];
/** the dorsal half of the blade, sampled finely: its edge is broken by shallow covert-tip scallops (the lesser coverts'
 *  rounded tips, period LESSER_P), so the edge-on wing reads as feathers, not a slat */
const LESSER_P = 1.6;
const BLADE_A: number[] = (() => {
  const out: number[] = [];
  for (let a = BLADE[0][0]; a < BLADE[BLADE.length - 1][0] - 1e-6; a += LESSER_P / 5) out.push(a);
  out.push(BLADE[BLADE.length - 1][0]);
  return out;
})();
const scallop = (a: number) => {
  const u = (((a - 5.7) / LESSER_P) % 1 + 1) % 1;
  return Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
};
const TE_TAB: [number, number][] = WING_OUTLINE.slice(10).map(([a, b]) => [a, b] as [number, number]).reverse();

// ---------------------------------------------------------------- the feathered shoulder (near wing): a lens of body
// feathers lying over the wing root, from the true wing / shell intersection out to a ragged scalloped edge
/** largest ray parameter at which the line o + t d (body-local) leaves the shell volumes (0 if it never enters) */
const exitAlong = (o: V3, d: V3): number => {
  let best = 0;
  for (const e of ELLS) {
    const e0 = toN(e, sub3(o, e.c)), g = toN(e, d);
    const a = dot3(g, g), b = dot3(e0, g), c0 = dot3(e0, e0);
    const disc = b * b - a * (c0 - 1);
    if (disc < 0) continue;
    const t = (-b + Math.sqrt(disc)) / a;
    if (t > best) best = t;
  }
  return best;
};
const FAIR = {b0: -3.5, b1: 12.0, n: 8, w: 2.3, nb: 20};
type FairArc = {a: number; b: number; w: number; h: number};
type FairGeo = {fill: F2[]; edge: F2[]; shadow: F2[]; tex: FairArc[]};
/** the lens in wing coords; k (0..1) scales its width (the exploded view draws it in to the junction: a fade by
 *  geometry, never by opacity) */
const fairGeo = (W: WingFrame, dy: number, k: number, deep: number): FairGeo => {
  const {b0, b1, n, w, nb} = FAIR;
  const raw: number[] = [];
  for (let k = 0; k <= nb; k++) {
    const b = b0 + ((b1 - b0) * k) / nb;
    raw.push(exitAlong(add3(wingPt(W, 0, b), [0, -dy, 0]), W.ex));
  }
  // smooth the intersection curve (switching from one body volume to the next leaves small kinks)
  const ae = raw.map((v, k) => (k === 0 || k === nb ? v : 0.25 * raw[k - 1] + 0.5 * v + 0.25 * raw[k + 1]));
  const aeAt = (b: number) => {
    const x = ((b - b0) / (b1 - b0)) * nb;
    const k = Math.max(0, Math.min(nb - 1, Math.floor(x)));
    const u = x - k;
    return ae[k] * (1 - u) + ae[k + 1] * u;
  };
  // lens envelope: zero width at both ends, where the patch tucks into the body
  const env = (b: number) => k * Math.pow(Math.max(0, Math.sin((Math.PI * (b - b0)) / (b1 - b0))), 0.55);
  const edge: F2[] = [], shadow: F2[] = [];
  for (let j = 0; j < n; j++) {
    const hb = hash(j * 4.71 + 2.3), hw = hash(j * 1.93 + 7.7);
    for (let q = 0; q < 6; q++) {
      const u = q / 6;
      const b = b0 + ((b1 - b0) * (j + u)) / n;
      const bulge = (0.34 + 0.32 * hb) * Math.pow(Math.sin(Math.PI * u), 0.75);
      const e = env(b);
      const a = aeAt(b) + e * (w * (0.86 + 0.28 * hw) + bulge);
      edge.push([a, b]);
      shadow.push([a + 0.5 * e, b]);
    }
  }
  edge.push([aeAt(b1), b1]);
  shadow.push([aeAt(b1), b1]);
  const prox: F2[] = [];
  for (let q = nb; q >= 0; q--) prox.push([ae[q] - 1.2, b0 + ((b1 - b0) * q) / nb]);
  // the patch's own feather tips (the body's back-feather size, tips pointing out toward the ragged edge): staggered
  // rows kept inside the lens; drawn only where the patch rises past the body (the body's texture shows elsewhere)
  const tex: FairArc[] = [];
  for (let r = 0; r < 5; r++) {
    const d = 0.1 + 0.55 * r;
    for (let bc = b0 + 0.8 + (r % 2) * 0.6; bc <= b1 - 0.8; bc += 1.2) {
      const id = r * 31 + bc * 3.7;
      const hw = 0.62 * (0.85 + 0.3 * hash(id * 1.37 + 0.41)), h = deep * 0.36 * (0.85 + 0.3 * hash(id * 2.11 + 5.3));
      if (d + h + 0.1 > env(bc) * w * 0.86) continue;
      tex.push({a: aeAt(bc) + d, b: bc, w: hw, h});
    }
  }
  return {fill: [...edge, ...prox], edge, shadow: [...shadow, ...prox], tex};
};

/** the shoulder patch in screen space: its paths, its screen box (the body grid is extended over it, so the body's own
 *  paint covers the whole patch) and its clip id. The patch is painted with the body's own layers (bands, feather
 *  texture, shading: the same screen paths through <use>), so it continues the body exactly where they meet. */
type FairScr = {fill: string; edge: string; shadow: string; k: number; box: {x0: number; y0: number; x1: number; y1: number}; cid: string; tex: ScalSet};
const fairScreen = (B: Basis, F: Frame, W: WingFrame, dy: number, k: number, s0: number): FairScr | null => {
  const z = scalZoom(s0);
  const fair = fairGeo(W, dy, k, z.deep);
  const P = (a: number, b: number): V2 => {
    const q = proj(B, xf(F, wingPt(W, a, b)));
    return {x: q.x, y: q.y};
  };
  const PP = (pts: F2[]) => pts.map(([a, b]) => P(a, b));
  const fill = PP(fair.fill);
  const box = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
  for (const p of fill) { box.x0 = Math.min(box.x0, p.x); box.x1 = Math.max(box.x1, p.x); box.y0 = Math.min(box.y0, p.y); box.y1 = Math.max(box.y1, p.y); }
  if (!isFinite(box.x0) || (box.x1 - box.x0) * (box.y1 - box.y0) < 4) return null;
  const tex: ScalSet = {open: ['', '', ''], fill: ['', '', ''], edge: ['', '', ''], openK: z.openK, fillK: z.fillK};
  if (s0 >= 3.5) {
    for (const t of fair.tex) {
      const A = P(t.a, t.b + t.w), Bp = P(t.a, t.b - t.w);
      const arc = `M${sp(A)}C${sp(P(t.a + 1.33 * t.h, t.b + t.w))} ${sp(P(t.a + 1.33 * t.h, t.b - t.w))} ${sp(Bp)}`;
      if (z.openK > 0.01) tex.open[0] += arc;
      if (z.fillK > 0.01) {
        tex.edge[0] += arc;
        tex.fill[0] += `${arc}C${sp(P(t.a + 0.72 * t.h, t.b - 0.78 * t.w))} ${sp(P(t.a + 0.72 * t.h, t.b + 0.78 * t.w))} ${sp(A)}Z`;
      }
    }
  }
  return {
    tex,
    fill: polyD(fill), edge: polyD(PP(fair.edge), false), shadow: polyD(PP(fair.shadow)),
    k, box, cid: uid('bwfc'),
  };
};

type WingStyle = {
  T: Tint;
  /** width of the feathered shoulder lens (near wing only; 0 when the root is exposed in the exploded view) */
  fair: number;
  /** 0..1: the inner feathers' extent toward the hinge (1 = to the hinge; shrinks as the shell lifts off) */
  inner: number;
  /** clamp collar at the root (exploded view), 0..1 */
  collar: number;
  detail: number;
  /** the near wing's feathered shoulder in screen space (its ink underlay is drawn under the body by Bird) */
  fairS?: FairScr | null;
  /** id of the body's paint group (Bird's defs), re-used inside the shoulder patch */
  skin?: string;
  /** clip id: everything outside the body outline (the patch's own feather tips show only there) */
  outClip?: string;
  /** the body texture's strength (distance) */
  texK?: number;
};
const DARK = '#2A180C';
const LIGHT = '#FFF6E4';
const wingColours = (dorsal: boolean, T: Tint, lightK: number) => {
  const L = (c: string) => T(lightK >= 0 ? mix(c, LIGHT, lightK * 0.32) : mix(c, DARK, -lightK * 0.42));
  if (dorsal) {
    return {
      L,
      primary: (i: number) => mix(mix(C.flight, C.plumageBar, 0.32), C.plumageBar, (i / 8) * 0.25),
      secondary: mix(C.flight, C.plumage, 0.14),
      covert: mix(C.plumage, C.plumageDeep, 0.12),
      lesser: mix(C.plumageLit, C.plumage, 0.42),
      bar: C.plumageBar,
      tip: C.flightEdge,
      covertTip: mix(C.flightEdge, C.plumageLit, 0.3),
      shaft: mix(C.flightEdge, C.flight, 0.35),
    };
  }
  return {
    L,
    primary: (i: number) => mix(mix(C.underwingDeep, C.underwing, 0.25), C.underwingDeep, (i / 8) * 0.35),
    secondary: mix(C.underwingDeep, C.underwing, 0.47),
    covert: mix(C.underwing, C.breastLit, 0.37),
    lesser: mix(C.breastLit, C.underwing, 0.3),
    bar: mix(C.underwingDeep, C.flight, 0.35),
    tip: mix(C.underwingDeep, C.flight, 0.22),
    covertTip: mix(C.underwing, C.underwingDeep, 0.35),
    shaft: mix(C.breastLit, '#FFFFFF', 0.4),
  };
};
/** a fixed per-feather tone shift (about +-4 %) */
const vary = (c: string, h: number) => (h >= 0.5 ? mix(c, '#FFF3DE', (h - 0.5) * 0.09) : mix(c, DARK, (0.5 - h) * 0.09));

const WingArt: React.FC<{B: Basis; F: Frame; W: WingFrame; st: WingStyle}> = ({B, F, W, st}) => {
  const P = (a: number, b: number): V2 => {
    const q = proj(B, xf(F, wingPt(W, a, b)));
    return {x: q.x, y: q.y};
  };
  const PP = (pts: F2[]) => pts.map(([a, b]) => P(a, b));
  const mid = xf(F, wingPt(W, 16, 5));
  const topW = xfv(F, W.top);
  const fc = facing(B, mid, topW);
  const dorsal = fc >= 0;
  const sideN = dorsal ? topW : mul3(topW, -1);
  const lightK = clamp(dot3(norm3(sideN), lightDir(B)) * 0.9 - 0.1, -0.6, 0.6);
  const K = wingColours(dorsal, st.T, lightK);
  const ink = st.T(INK);
  const pxcm = proj(B, mid).s;
  // seen edge-on, the interior feather lines fade (the wing reads as one solid blade, not a bundle of strokes)
  const edgeK = clamp(Math.abs(fc) * 3.2, 0.2, 1);
  const det = st.detail * clamp((pxcm - 6) / 10);
  // draw order: back to front (dorsal: as listed; ventral: each group reversed, so the stack mirrors)
  const specs = st.inner >= 0.999 ? [...INNER_FULL, ...WING_FEATHERS] : [...innerSpecs(st.inner), ...WING_FEATHERS];
  const order: FeatherSpec[] = [];
  for (const kd of ['primary', 'secondary', 'covert', 'lesser'] as Feather['kind'][]) {
    const g = specs.filter((s) => s.f.kind === kd);
    if (!dorsal) g.reverse();
    order.push(...g);
  }
  // the leading-edge strip under the lesser coverts: one smooth edge from the root to a rounded wrist
  const les = order.filter((s) => s.f.kind === 'lesser');
  let stripD = '';
  if (les.length) {
    const aMin = Math.min(...les.map((s) => s.f.base[0])) - 1.15, aMax = Math.max(...les.map((s) => s.f.base[0])) + 1.15;
    const bL = Math.min(...les.map((s) => s.f.base[1])) - 0.08;
    const strip: F2[] = [[aMin, bL]];
    for (let i = 0; i <= 6; i++) {
      // the wrist: a quarter ellipse from the leading edge round to the hand
      const t = (i / 6) * (Math.PI / 2);
      strip.push([aMax + 0.85 * Math.sin(t), bL + 1.5 * (1 - Math.cos(t))]);
    }
    strip.push([aMax + 0.75, bL + 2.4], [aMax + 0.3, bL + 3.15], [aMax - 2.6, bL + 3.15], [aMax - 3.4, bL + 1.6], [aMin, bL + 1.6]);
    // wound like the feather outlines (the union is filled nonzero: an opposite winding would cut holes in it)
    stripD = polyD(PP(strip.reverse()));
  }
  // ink underlay: the union silhouette of the feathers
  let inkD = stripD;
  const bb = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
  const outl = new Map<number, string>();
  for (const s of order) {
    const pts = PP(s.g.outline);
    for (const p of pts) { bb.x0 = Math.min(bb.x0, p.x); bb.x1 = Math.max(bb.x1, p.x); bb.y0 = Math.min(bb.y0, p.y); bb.y1 = Math.max(bb.y1, p.y); }
    const d = polyD(pts);
    outl.set(s.gi, d);
    inkD += d;
  }
  const gid = uid('bwg'), wcid = uid('bwc'), uidD = uid('bwu');
  // near edge-on: the blade (dorsal half in the dorsal lesser-covert colour, ventral half pale, the half lower on screen
  // shaded), under the feathers; it thins into the leading edge as the wing turns its face to the camera (always
  // opaque: no ghosted rim)
  const bladeK = clamp((0.22 - Math.abs(fc)) / 0.14);
  const bladeOp = bladeK > 0.03 ? 1 : 0;
  let bladeTop = '', bladeBot = '', bladeCols = {top: '', bot: ''};
  if (bladeOp > 0.01) {
    const Lw = lightDir(B);
    const Q = (a: number, b: number, k: number): V2 => {
      const q = proj(B, xf(F, add3(wingPt(W, a, b), mul3(W.top, k))));
      return {x: q.x, y: q.y};
    };
    const sec = (a: number, r0: number, sg: number) => {
      const r = r0 * bladeK;
      const bl = lerpTab(LE_TAB, a), bt = bl + BLADE_CHORD * (lerpTab(TE_TAB, a) - bl);
      const cb = bl + r, mb = bl + 0.4 * (bt - bl);
      // dorsal: the thickness dips between covert tips (shallow scallops, at most 45 % of the local thickness)
      const t = sg > 0 ? r - Math.min(0.12 * bladeK, 0.45 * r) * (1 - scallop(a)) : r;
      return [
        Q(a, bl, 0), Q(a, cb - r * Math.cos(0.35), sg * t * Math.sin(0.35)), Q(a, cb - r * Math.cos(0.96), sg * t * Math.sin(0.96)), Q(a, cb, sg * t),
        Q(a, mb, sg * 0.55 * t), Q(a, bt, 0), Q(a, cb, 0), Q(a, mb, 0),
      ];
    };
    const top = BLADE_A.map((a) => sec(a, lerpTab(BLADE, a), 1));
    const bot = BLADE.map(([a, r0]) => sec(a, r0, -1));
    for (let i = 0; i < top.length - 1; i++) bladeTop += polyD(hull([...top[i], ...top[i + 1]]));
    for (let i = 0; i < bot.length - 1; i++) bladeBot += polyD(hull([...bot[i], ...bot[i + 1]]));
    // seen down the span (the camera near the root, looking along the wing) the spanwise scallops stack on each other
    // and the visible top edge is the chordwise profile: there the root's dorsal surface shows its shingled covert rows
    // as rounded ridges (one per row, swept a few cm along the span), so the profile reads as feathers, not a slat
    const spanW = norm3(xfv(F, W.ex));
    const view = norm3(sub3(xf(F, wingPt(W, 8, 1)), B.eye));
    const endOn = sm((Math.abs(dot3(spanW, view)) - 0.55) / 0.3);
    if (endOn > 0.02) {
      const RA = [6.0, 7.0, 8.0, 9.0, 10.0, 11.0];
      const caps = RA.map((a) => {
        const r = lerpTab(BLADE, a) * bladeK;
        const bl = lerpTab(LE_TAB, a), bt = bl + BLADE_CHORD * (lerpTab(TE_TAB, a) - bl);
        const cb = bl + r, mb = bl + 0.4 * (bt - bl);
        const base = (b: number) => (b <= cb ? r * Math.sqrt(Math.max(0, 1 - ((cb - b) / r) ** 2)) : b <= mb ? r - (0.45 * r * (b - cb)) / (mb - cb) : (0.55 * r * (bt - b)) / (bt - mb));
        const d = 0.17 * bladeK * endOn * clamp((11 - a) / 3);
        const rows: V2[][] = [];
        for (let k = 0; k < 4; k++) {
          const b0 = cb + ((bt - cb) * k) / 4, b1 = cb + ((bt - cb) * (k + 1)) / 4;
          const pts: V2[] = [];
          for (let q = 0; q <= 6; q++) {
            const u = q / 6, b = b0 + (b1 - b0) * u;
            pts.push(Q(a, b, base(b) + d * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2))));
          }
          pts.push(Q(a, b1, 0), Q(a, b0, 0));
          rows.push(pts);
        }
        return rows;
      });
      for (let i = 0; i < caps.length - 1; i++) for (let k = 0; k < 4; k++) bladeTop += polyD(hull([...caps[i][k], ...caps[i + 1][k]]));
    }
    const lk = (n: V3) => clamp(dot3(norm3(n), Lw) * 0.9 - 0.1, -0.6, 0.6);
    const Kd = wingColours(true, st.T, lk(topW)), Kv = wingColours(false, st.T, lk(mul3(topW, -1)));
    const ct = Kd.L(Kd.lesser), cv = Kv.L(Kv.lesser);
    // which half is lower on screen
    const m0 = Q(13, -1, 0), m1 = Q(13, -1, 1);
    const topUp = m1.y < m0.y;
    bladeCols = {top: topUp ? ct : mix(ct, st.T(DARK), 0.16), bot: topUp ? mix(cv, st.T(DARK), 0.16) : cv};
  }
  const fill = (s: FeatherSpec) => {
    const kd = s.f.kind;
    const base = kd === 'primary' ? K.primary(s.gi % 9) : kd === 'secondary' ? K.secondary : kd === 'covert' ? K.covert : K.lesser;
    // the lesser coverts' full-width bases overlap side by side: only a faint tone variation, so they do not stripe
    return K.L(vary(base, kd === 'lesser' ? 0.5 + (s.hTone - 0.5) * 0.3 : s.hTone));
  };
  const fs = st.fair > 0.01 && st.skin ? st.fairS ?? null : null;

  return (
    <g>
      {fs && (
        <defs>
          <clipPath id={fs.cid}><path d={fs.fill} /></clipPath>
        </defs>
      )}
      {/* the feathers' union: one path, used as the ink underlay, the row-shadow clip and the modelling overlay */}
      <defs>
        <path id={uidD} d={inkD} vectorEffect={NS} />
        <clipPath id={wcid}><use href={`#${uidD}`} /></clipPath>
      </defs>
      <use href={`#${uidD}`} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" />
      {bladeTop && (
        <g opacity={bladeOp}>
          <path d={bladeTop + bladeBot} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" vectorEffect={NS} />
          <path d={bladeTop} fill={bladeCols.top} />
          <path d={bladeBot} fill={bladeCols.bot} />
        </g>
      )}
      {order.map((s, oi) => {
        const kd = s.f.kind;
        // before each covert row: the row's soft shadows on the feathers beneath (layered shingles, not flat tiles)
        const firstOfRow = !s.f.kind.startsWith('p') && kd !== 'secondary' && (oi === 0 || order[oi - 1].f.kind !== kd);
        const rowShadow = firstOfRow ? order.filter((o) => o.f.kind === kd).map((o) => polyD(PP(shadowPoly(o.g, o.f, kd === 'covert' ? 0.38 : 0.3)))).join('') : '';
        const flight = kd === 'primary' || kd === 'secondary';
        let barD = '', tipD = '', shaftD = '', lineD = '';
        let lineOp = 0;
        if (flight) {
          if (det > 0.15) {
            const bars = kd === 'primary' ? [[0.5, 0.56], [0.66, 0.71]] : [[0.46, 0.53], [0.63, 0.69]];
            for (const [a, b] of bars) barD += polyD(PP(barPoly(s.g, a, b, 0.025)));
          }
          const s0 = kd === 'primary' ? 0.9 : 0.88;
          tipD = polyD(PP(tipPoly(s.g, 1 - (1 - s0) * (0.75 + 0.5 * s.hTip))));
          if (det > 0.35) shaftD = polyD(PP([s.g.at(0.05, 0), s.g.at(0.86, 0)]), false);
          lineOp = 0.58 * edgeK;
        } else {
          // coverts: only the exposed tip arc is lined (overlapped bases draw no tile edges)
          lineD = polyD(PP(tipPoly(s.g, 0.6)), false);
          lineOp = (dorsal ? (kd === 'covert' ? 0.42 : 0.3) : 0.18) * edgeK;
          if (kd === 'covert' && dorsal) {
            barD = polyD(PP(streakPoly(s.g)));
            tipD = polyD(PP(fringePoly(s.g, 0.7, 0.03 * (0.75 + 0.5 * s.hTip))));
          }
        }
        const barOp = edgeK * (flight ? (dorsal ? 0.42 : 0.3) * clamp(det * 1.5) : 0.35);
        return (
          <g key={s.gi}>
            {kd === 'lesser' && firstOfRow && stripD && <path d={stripD} fill={K.L(vary(K.lesser, 0.42))} />}
            {rowShadow && <path d={rowShadow} fill={st.T(DARK)} opacity={(dorsal ? 0.16 : 0.08) * edgeK} clipPath={`url(#${wcid})`} />}
            <path d={outl.get(s.gi)} fill={fill(s)} {...(flight ? {stroke: ink, strokeWidth: LINE_PX, strokeOpacity: lineOp, strokeLinejoin: 'round' as const, vectorEffect: NS} : {})} />
            {barD && <path d={barD} fill={K.L(K.bar)} opacity={barOp} />}
            {tipD && <path d={tipD} fill={K.L(flight ? K.tip : K.covertTip)} opacity={flight ? 0.92 : 0.85} />}
            {!flight && lineD && <path d={lineD} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeOpacity={lineOp} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} />}
            {shaftD && <path d={shaftD} fill="none" stroke={K.L(K.shaft)} strokeWidth={LINE_PX * 0.75} strokeOpacity={0.55 * det} strokeLinecap="round" vectorEffect={NS} />}
          </g>
        );
      })}
      {/* soft modelling lit from the upper left over the whole wing (one path: the union of the feathers) */}
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={bb.x0} y1={bb.y0} x2={bb.x1} y2={bb.y1}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={0.2} />
          <stop offset="0.45" stopColor="#FFF8EA" stopOpacity={0} />
          <stop offset="1" stopColor="#24140A" stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <use href={`#${uidD}`} fill={`url(#${gid})`} />
      {fs && (
        <g>
          {/* the shoulder feathers' soft shadow on the coverts, then the feathers painted with the body's own layers
              (bands, feather texture, shading: the same screen paths, so they run on unbroken from the body) */}
          <path d={fs.shadow} fill={st.T(DARK)} opacity={0.14} clipPath={`url(#${wcid})`} />
          <g clipPath={`url(#${fs.cid})`}>
            <use href={`#${st.skin}`} />
            {st.outClip && <g clipPath={`url(#${st.outClip})`}><ScallopArt sc={fs.tex} T={st.T} texK={st.texK ?? 1} /></g>}
          </g>
          {/* the ragged edge is lined only where it lies over the wing's feathers (elsewhere it is the silhouette, or
              body over body) */}
          <path d={fs.edge} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.35 * sm(fs.k / 0.4)} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} clipPath={`url(#${wcid})`} />
        </g>
      )}
      {st.collar > 0.01 && (() => {
        const a = proj(B, xf(F, wingPt(W, 4.6, 0))), b = proj(B, xf(F, wingPt(W, 6.6, 0)));
        return (
          // the clamp collar grows in (geometry, not opacity: no grey smudge while the shell lifts)
          <path d={capsule2(a, b, 0.5 * st.collar * a.s, 0.5 * st.collar * b.s)} fill={st.T(C.dark)} stroke={ink} strokeWidth={LINE_PX} vectorEffect={NS} />
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
/** the fan is gently arched (outer feathers lower at the tips), so it reads as a fan from the side too */
const TAIL_ARCH = 2.0;
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
    const tip: V3 = [xt, yAt(xt) - TAIL_ARCH * (zt / TAIL.spread) ** 2, zt];
    const ax = norm3(sub3(tip, base));
    const wv = norm3(cross3(nT, ax));
    out.push({k, base, tip, wv, z: zt});
  }
  return {feathers: out, nT};
})();
const tailPt = (f: {base: V3; tip: V3; wv: V3; z: number}, s: number, side: number) => {
  const hw = (TAIL.width / 2) * (0.55 + 0.45 * sm(s / 0.3)) * (s > 0.84 ? Math.sqrt(Math.max(0, 1 - ((s - 0.84) / 0.16) ** 2)) : 1);
  // across the feather, follow the arched fan's slope so neighbours stay overlapped when seen edge-on
  const slope = ((-2 * TAIL_ARCH * f.z) / (TAIL.spread * TAIL.spread)) * s;
  const w = mul3(f.wv, hw * side);
  return add3(add3(f.base, mul3(sub3(f.tip, f.base), s)), [w[0], w[1] + slope * w[2], w[2]]);
};
const TailArt: React.FC<{B: Basis; F: Frame; T: Tint; L: V3}> = ({B, F, T, L}) => {
  const P = (p: V3): V2 => {
    const q = proj(B, xf(F, p));
    return {x: q.x, y: q.y};
  };
  const nW = xfv(F, TAIL_FEATHERS.nT);
  const centre = xf(F, [-21, 3, 0]);
  const fT = facing(B, centre, nW);
  const dorsal = fT >= 0;
  const edgeK = clamp(Math.abs(fT) * 3.2, 0.15, 1);
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
            <path d={polyD(outline(f))} fill={Lc(cen ? mix(base, C.plumage, 0.25) : mix(base, C.plumageDeep, (Math.abs(f.z) / TAIL.spread) * 0.2))} stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.6 * edgeK} strokeLinejoin="round" vectorEffect={NS} />
            <path d={polyD(band(f, 0.76, 0.84))} fill={Lc(bar)} opacity={(dorsal ? 0.62 : 0.35) * (0.4 + 0.6 * edgeK)} />
            <path d={polyD(band(f, 0.9, 1))} fill={Lc(tip)} opacity={0.88} />
            <path d={polyD([P(tailPt(f, 0.06, 0)), P(tailPt(f, 0.86, 0))], false)} fill="none" stroke={Lc(mix(C.flightEdge, C.tail, 0.35))} strokeWidth={LINE_PX * 0.7} strokeOpacity={0.45 * edgeK} vectorEffect={NS} />
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
      <ellipse cx={p.x - 0.3 * k} cy={p.y - 0.33 * k} rx={0.27 * k} ry={0.22 * k} fill={T("#FFFFFF")} opacity={0.92} />
      <circle cx={p.x + 0.33 * k} cy={p.y + 0.3 * k} r={0.09 * k} fill={T("#FFFFFF")} opacity={0.7} />
    </g>
  );
};

// ================================================================ the cutaway window (body-local x, y on the near flank)
const WINDOW_CTRL: [number, number][] = [
  // (V2) the top rises over the shoulder (to y 6.3 at x 2.8, about 0.7 cm of back left above it), so the hinge, the near
  // lever, both rod tops and the spar root are inside the opening under the cameras' downward pitch
  [8.5, 0.4], [8.0, 3.0], [6.75, 4.85], [5.0, 5.9], [2.8, 6.3], [0.6, 5.8], [-1.25, 3.85], [-2.9, 1.0], [-3.5, -0.3], [-2.7, -1.7], [-1.0, -3.9], [1.6, -5.7], [4.6, -6.2], [6.9, -5.0], [8.2, -2.6],
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
  <WingArt B={B} F={F} W={ps.wing.near} st={{T: (c) => c, fair: 0, inner: 0, collar: 0, detail: 1}} />
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
  const lifted = lift > 0.02;
  // the near wing's facing (> 0: its top toward the camera; near 0: edge-on)
  const fcN = facing(B, xf(F, wingPt(Wn, 16, 5)), xfv(F, Wn.top));
  // the feathered shoulder over the near wing's root: its lens narrows to the junction as the shell lifts off, and as
  // the wing turns edge-on (a planar lens seen at a grazing angle would read as a band; the blade carries the profile)
  const fairK = clamp(1 - lift / 1.6);
  const lensK = fairK * (0.15 + 0.85 * sm((Math.abs(fcN) - 0.05) / 0.17));
  const s0 = proj(B, xf(Fs, [0, 0, 0])).s;
  const fairS = wings && lensK > 0.01 ? fairScreen(B, F, Wn, lift, lensK, s0) : null;
  const body = buildBody(cx, wingPlane, fairS ? fairS.box : null);
  const eCut = sm(cut);
  const hole = eCut > 0.004 ? holeGeo(B, Fs, eCut) : null;
  const reveal = hole && look.cutReveal ? look.cutReveal(B) : null;
  const ids = {clip: uid('bbody'), outl: uid('bol'), out: uid('bout'), skin: uid('bskin'), win: uid('bwin'), rev: uid('brev'), mBody: uid('bmb'), mWing: uid('bmw'), mHide: uid('bmh'), gIn: uid('bgin'), gRim: uid('bgrim'), gBody: uid('bgb')};
  const BIG = {x: -4000, y: -4000, width: 9000, height: 10000};
  const scal = body ? scallopPaths(cx) : null;
  // feather texture thins out at small sizes (it would read as noise at a distance)
  const texK = clamp((s0 - 5) / 10, 0.3, 1);
  const st: WingStyle = {T, fair: fairK, inner: fairK, collar: clamp(lift / 2.0), detail: 1, fairS: body ? fairS : null, skin: body ? ids.skin : undefined, outClip: ids.out, texK};
  const holeFill = reveal ?? (hole ? hole.outer : '');
  // the hole region (window, limited by the reveal) as a clipped group
  const inHole = (child: React.ReactNode) => (
    <g clipPath={`url(#${ids.win})`}>{reveal ? <g clipPath={`url(#${ids.rev})`}>{child}</g> : child}</g>
  );
  const hb = hole?.bbox;

  // the near wing's soft cast shadow on the body (light from the upper left), from its coarse outline; a wing seen
  // edge-on casts no stripe
  const wingShadow = wings && lift < 0.5 ? (() => {
    const P = (a: number, b: number): V2 => {
      const q = proj(B, xf(F, wingPt(Wn, a, b)));
      return {x: q.x, y: q.y};
    };
    const op = 0.2 * clamp((Math.abs(fcN) - 0.1) * 5);
    if (op < 0.005) return null;
    const k = 0.85 * proj(B, xf(F, Wn.o)).s;
    return {
      d: smoothClosed(WING_OUTLINE.map(([a, b]) => P(a, b))),
      tr: `translate(${f1(0.6 * k)},${f1(0.8 * k)})`,
      op,
    };
  })() : null;
  // ---- body (near shell)
  const g = body?.grid;
  const bodyArt = body && g && (
    <g>
      <defs>
        <path id={ids.outl} d={body.outline} fillRule="evenodd" clipRule="evenodd" vectorEffect={NS} />
        <clipPath id={ids.clip}><use href={`#${ids.outl}`} /></clipPath>
        <linearGradient id={ids.gBody} gradientUnits="userSpaceOnUse" x1={body.box.x0} y1={body.box.y0} x2={body.box.x1} y2={body.box.y1}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={0.2} />
          <stop offset="0.5" stopColor="#FFF8EA" stopOpacity={0} />
          <stop offset="1" stopColor="#24140A" stopOpacity={0.16} />
        </linearGradient>
        {/* the body's paint (base, cel bands, feather texture, shading, the wing's cast shadow) over the whole grid:
            clipped to the outline here, and re-used by the near wing's shoulder patch */}
        <g id={ids.skin}>
          <rect x={f1(g.x0)} y={f1(g.y0)} width={f1(g.x1 - g.x0)} height={f1(g.y1 - g.y0)} fill={T(C.breast)} />
          <path d={body.mid} fill={T(mix(C.breast, C.plumage, 0.5))} fillRule="evenodd" />
          <path d={body.brown} fill={T(C.plumage)} fillRule="evenodd" />
          <path d={body.head} fill={T(mix(C.head, C.plumageDeep, 0.28))} fillRule="evenodd" />
          <path d={body.cheek} fill={T(C.cheek)} fillRule="evenodd" />
          {scal && <ScallopArt sc={scal} T={T} texK={texK} />}
          <path d={body.sh1} fill={T('#5E3C22')} opacity={0.22} fillRule="evenodd" />
          <path d={body.sh2} fill={T('#3B220F')} opacity={0.16} fillRule="evenodd" />
          <path d={body.li} fill={T('#FFF6E2')} opacity={0.2} fillRule="evenodd" />
          <rect x={f1(g.x0)} y={f1(g.y0)} width={f1(g.x1 - g.x0)} height={f1(g.y1 - g.y0)} fill={`url(#${ids.gBody})`} />
          {wingShadow && <path d={wingShadow.d} transform={wingShadow.tr} fill={T('#2E1A0C')} opacity={wingShadow.op} />}
        </g>
        {fairS && <clipPath id={ids.out}><path d={`M-4000,-4000H5000V6000H-4000Z${body.outline}`} clipRule="evenodd" /></clipPath>}
      </defs>
      {/* the near wing's shoulder patch is part of the silhouette where it rises past the body: its ink underlay (solid,
          outside the body only) goes under the body */}
      {fairS && <g clipPath={`url(#${ids.out})`}><path d={fairS.fill} fill={ink} stroke={ink} strokeWidth={INK_PX * 2} strokeLinejoin="round" vectorEffect={NS} /></g>}
      <g clipPath={`url(#${ids.clip})`}>
        <use href={`#${ids.skin}`} />
        <HeadLine cx={cx} ink={ink} />
      </g>
      <use href={`#${ids.outl}`} fill="none" stroke={ink} strokeWidth={INK_PX} strokeLinejoin="round" />
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
      {wings && <WingArt B={B} F={F} W={ps.wing.far} st={{...st, fair: 0, detail: 0.6}} />}
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
        <g mask={`url(#${ids.mHide})`} opacity={0.5 * phantom}>{/* (V2) lighter ghost: the drive stays readable under the wing */}
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
  const segLen = (s: V2[]) => s.reduce((a, p, i) => (i ? a + Math.hypot(p.x - s[i - 1].x, p.y - s[i - 1].y) : 0), 0);
  const minLen = 2.2 * proj(cx.B, xf(cx.F, ELLS[HEAD_I].c)).s;
  const d = segs.filter((s) => s.length >= 4 && segLen(s) > minLen).map((s) => smoothOpen(s)).join('');
  if (!d) return null;
  return <path d={d} fill="none" stroke={ink} strokeWidth={LINE_PX} strokeOpacity={0.45} strokeLinecap="round" vectorEffect={NS} />;
};

/** the body's feather texture: open arcs at mid distance, soft closed tip crescents close up */
const ScallopArt: React.FC<{sc: ScalSet; T: Tint; texK: number}> = ({sc, T, texK}) => {
  const cols = [T(C.plumageBar), T(C.breastDeep), T(C.plumageBar)];
  const fillCols = [T(mix(C.plumage, C.plumageBar, 0.6)), T(mix(C.breastDeep, C.plumageDeep, 0.25)), T(mix(C.head, C.plumageBar, 0.6))];
  const ow = [LINE_PX, LINE_PX, LINE_PX * 0.85], oo = [0.55, 0.6, 0.5];
  return (
    <g>
      {sc.openK > 0.01 && [0, 2, 1].map((k) => sc.open[k] && (
        <path key={`o${k}`} d={sc.open[k]} fill="none" stroke={cols[k]} strokeWidth={ow[k]} strokeOpacity={oo[k] * texK * sc.openK} strokeLinecap="round" vectorEffect={NS} />
      ))}
      {sc.fillK > 0.01 && [0, 2, 1].map((k) => sc.fill[k] && (
        <g key={`f${k}`}>
          <path d={sc.fill[k]} fill={fillCols[k]} opacity={0.2 * sc.fillK} />
          <path d={sc.edge[k]} fill="none" stroke={cols[k]} strokeWidth={LINE_PX} strokeOpacity={0.3 * sc.fillK} strokeLinecap="round" vectorEffect={NS} />
        </g>
      ))}
    </g>
  );
};

/** the shell's spar slot at the near shoulder (seen only when the shell is lifted off the frame): a dark slit along
 *  the shell surface following the spar's whole sweep about the hinge (where the spar leaves the shell at each angle) */
const SLOT_TH: [number, number] = [-31, 51];
const SLOT_PTS: {p: V3; n: V3}[] = (() => {
  const out: {p: V3; n: V3}[] = [];
  const N = 22;
  for (let k = 0; k <= N; k++) {
    const th = (SLOT_TH[0] + ((SLOT_TH[1] - SLOT_TH[0]) * k) / N) * D2R;
    const d: V3 = [0, Math.sin(th), Math.cos(th)];
    const t = exitAlong(HINGE.near, d);
    const p = add3(HINGE.near, mul3(d, t));
    out.push({p, n: blendNormal(p)});
  }
  return out;
})();
const ShoulderSlot: React.FC<{B: Basis; F: Frame; a: number; T: Tint}> = ({B, F, a, T}) => {
  const o = toLocalV(F, sub3(B.eye, F.o));
  const runs: SP[][] = [];
  let cur: SP[] = [];
  for (const {p, n} of SLOT_PTS) {
    const V = sub3(o, p), dist = len3(V);
    let ok = dot3(n, V) / dist > 0.08;
    if (ok && firstHit(o, mul3(V, -1 / dist)) < dist - 0.25) ok = false;
    if (ok) cur.push(proj(B, xf(F, p)));
    else if (cur.length) { runs.push(cur); cur = []; }
  }
  if (cur.length) runs.push(cur);
  const live = runs.filter((r) => r.length >= 2);
  if (!live.length) return null;
  const s = live[0][0].s;
  const d = live.map((r) => smoothOpen(r)).join('');
  return (
    <g opacity={a}>
      <path d={d} fill="none" stroke={T(C.shellCut)} strokeWidth={0.5 * s + 2 * LINE_PX} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={T('#2E2118')} strokeWidth={0.5 * s} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

