// DUCK: the SEPARATE swimming prototype (a preserved mallard drake robot) and its pond. It never shares a body with
// the flying bird drone: its own world, its own geometry, the same three.ts camera tools.
//
// World (cm): water surface y = 0, x = the swimming direction (+x, screen-right), z toward the camera side.
// Duck-local frame: origin on the waterline under the middle of the body, x forward (bill), y up, z = near side.
//
// How it is drawn (Weird Crew finish):
// - The hull (body) is a loft of superellipse sections (rounded ends), sampled on a (lambda, theta) grid. Its
//   silhouette is the convex hull of the projected samples (the hull is convex), cut at the water: above water the
//   part with world y >= 0, below water the rest. The plumage regions (chestnut breast, grey flank, grey-brown back and
//   folded wing, blue speculum, white vent, black stern) and the cel bands (N.L from the upper left, fixed in camera
//   space) are scalar fields on the surface, extracted with marching squares where the surface faces the camera, and
//   clipped to the silhouette. Neck, head, bill, tail fan, drake curls and wing tips are separate projected parts.
//   One ink line runs round the union of body, neck and head (stroke-under, fills over).
// - The duck is PASSIVE: fixed glossy glass eye, the head never moves relative to the body. Only the drive moves:
//   a small heave/pitch from the alternating paddle strokes.
// - Below the waterline (look.cut): the submerged hull with a cutaway window in the near flank; inside, a clean
//   light-grey 3D-printed sealed module (a gear cover over its small drive, an output shaft at its lower rear corner with
//   two dark-steel cranks 180 deg apart); each crank drives a pushrod diagonally back across the open shell to a rocker
//   (the leg's own extension above its hip pivot, on a printed bracket), so the legs swing alternately; the orange webbed feet spread on the power stroke (back) and fold on the recovery
//   (forward). The leg angle is SOLVED from the pushrod length (crank-rocker), so the feet move only because the
//   module turns. No propeller.
// - The pond convention for the split (over/under) view: a vertical "glass" plane at z = GLASS_Z in front of the
//   duck. Below the water, only what lies behind that plane is shown, through it (below the projected line y = 0,
//   z = GLASS_Z, the frame's waterline); above it the far water surface is seen from just above. As the camera's
//   grazing angle falls (pondSplit 0 -> 1, the film's dip) that waterline WIPES up the frame from below: under it the
//   underwater view is opaque, and everything lying on the surface (glints, reflection, wake) is hard-clipped above it.
import React from 'react';
import {
  add3, Basis, cross3, deg, dot3, ellipsoid2, Frame, hull, len3, mul3, norm3, P2, planeMatrix, poly, proj, rotZ, smoothClosed,
  smoothOpen, sub3, unproj, V2, V3, xf, xfv, capsule2, SP,
} from '../three';
import {C, INK, INK_PX, LINE_PX, NS} from './palette';
import {uid} from '../core/ids';
import {lit, mix} from '../core/color';
import {clamp, hash, lerp, noise1, sm, ss, W, H} from '../lib';

// ================================================================ public constants
/** default swimming speed (cm/s); story.ts DUCK_V. Used only to place the paddle rings already left behind. */
export const SWIM_V = 38;
/** crank turns per second (each foot makes one stroke per turn; the two feet alternate) */
export const PADDLE_HZ = 1.5;
/** the split view's "glass" plane (world z): below the water only what lies behind it is shown. Just clear of the
 *  hull's widest waterline (10.2 cm) and the near foot, so the band of surface between the duck's own waterline and
 *  the frame's waterline stays a thin sliver during the camera's dip */
export const GLASS_Z = 14;
/** bill tip to tail tip (cm) */
export const DUCK_LEN = 54;

// ================================================================ local colours (palette C extended)
const K = {
  flank: mix(C.duckBody, C.duckBodyLit, 0.35),
  vermic: '#8F8D85',
  upper: '#9C8E76', // scapulars / folded wing (grey-brown)
  mantle: '#6A6255',
  tertialLine: '#5A5043',
  vent: '#EEEDE6',
  stern: '#222527',
  specW: '#F3F2EC',
  spec: '#3F3D96', // blue-violet secondaries
  specDeep: '#24225C',
  breast: C.duckBreast,
  belly: '#D7D5CC',
  head: C.duckHead,
  headSheen: C.duckHeadLit,
  headShadow: '#14503C',
  breastSheen: '#9A5A40',
  breastShadow: '#552517',
  bill: C.duckBill,
  billSheen: '#F3DE84',
  billShadow: '#AE8E22',
  nail: '#2B2A24',
  eye: '#2C1B10',
  eyeDeep: '#0F0906',
  tail: '#E7E5DD',
  tailMid: '#BDBAB0',
  tailLine: '#9A978D',
  curl: '#1E2123',
  curlGloss: '#47697A',
  primary: '#5E5649',
  primaryEdge: '#B0A691',
  foot: C.duckFoot,
  footLit: '#F6A955',
  footWeb: '#D9762A',
  footSole: '#E99A5C',
  claw: '#3A2A20',
  // the 3D-printed module and its linkage
  printed: C.printed,
  printedSide: C.printedDeep,
  printedLine: '#8EA2A9',
  steel: C.dark, // the moving linkage (crank, pushrod, rocker): dark steel
  steelLit: '#B5C2CC',
  footCrease: '#A9541C',
  axle: C.dark,
  innerShell: '#A8957A', // the far inner surface of the preserved skin seen through the window (in shade)
  innerShellLit: '#C9B79A',
  rim: C.shellCut,
  // water
  uw: '#2C7A88', // underwater tint
  uwLit: '#6FB7BC',
  uwDeep: '#14495A',
  surfLine: '#EAF7F5',
};

// ================================================================ helpers
const sp = (v: number, e: number) => (v < 0 ? -Math.pow(-v, e) : Math.pow(v, e));
const R2 = Math.PI / 180;
/** monotone cubic (Fritsch-Carlson) through knots */
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
};
const dist2 = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.y - b.y);
/** drop points closer than d (closed loop) */
const dec = (pts: V2[], d = 2.5): V2[] => {
  const out: V2[] = [];
  for (const p of pts) if (!out.length || dist2(p, out[out.length - 1]) >= d) out.push(p);
  while (out.length > 3 && dist2(out[0], out[out.length - 1]) < d) out.pop();
  return out;
};
/** resample a closed polygon at a uniform step (px) */
const resample = (pts: V2[], step: number): V2[] => {
  const n = pts.length;
  if (n < 3) return pts;
  let per = 0;
  for (let i = 0; i < n; i++) per += dist2(pts[i], pts[(i + 1) % n]);
  const m = Math.max(8, Math.round(per / step));
  const out: V2[] = [];
  let i = 0, acc = 0, segL = dist2(pts[0], pts[1 % n]);
  for (let k = 0; k < m; k++) {
    const target = (k / m) * per;
    while (acc + segL < target && i < n - 1) { acc += segL; i++; segL = dist2(pts[i], pts[(i + 1) % n]); }
    const u = segL > 1e-9 ? (target - acc) / segL : 0;
    const a = pts[i], b = pts[(i + 1) % n];
    out.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
  }
  return out;
};
/** closed Catmull-Rom path, written at 0.1 px (the markup stays small) */
const smoothC = (pts: V2[], k = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return '';
  const f = (v: number) => (Math.round(v * 10) / 10).toString();
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + 'Z';
};
const loopPath = (pts: V2[]) => {
  const p = dec(pts, 3.2);
  return p.length >= 3 ? smoothC(p) : '';
};
const convexPath = (pts: V2[], step = 13) => {
  const hl = hull(pts);
  return hl.length >= 3 ? smoothC(resample(hl, step)) : '';
};
// ---------------------------------------------------------------- 2D polygon tools (screen px)
/** twice-signed area convention: > 0 for one winding; both union inputs are brought to > 0 */
const area2 = (p: V2[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i], r = p[(i + 1) % p.length];
    a += q.x * r.y - r.x * q.y;
  }
  return a / 2;
};
const inPoly = (pt: V2, pg: V2[]) => {
  let c = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const a = pg[i], b = pg[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
/** where segments a-b and c-d cross: t along a-b, u along c-d (both 0..1), or null */
const segX = (a: V2, b: V2, c: V2, d: V2): {t: number; u: number} | null => {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const qx = c.x - a.x, qy = c.y - a.y;
  const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? {t, u} : null;
};
/** points along the closed Catmull-Rom curve that smoothC / smoothClosed draw through pts */
const crSample = (pts: V2[], per = 4, k = 1 / 6): V2[] => {
  const n = pts.length, out: V2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k}, c2 = {x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k};
    for (let s = 0; s < per; s++) {
      const u = s / per, v = 1 - u;
      out.push({
        x: v * v * v * p1.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * p2.x,
        y: v * v * v * p1.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * p2.y,
      });
    }
  }
  return out;
};
/** the outline of the union of two simple closed polygons (a Weiler-Atherton walk, both brought to the same winding),
 *  starting from A's vertex `start` (which must lie outside B); `sw` = the indices where the walk changes polygon */
const unionWalk = (A0: V2[], B0: V2[], start: number): {pts: V2[]; sw: number[]} | null => {
  const rev = area2(A0) < 0;
  const A = rev ? A0.slice().reverse() : A0, Bq = area2(B0) < 0 ? B0.slice().reverse() : B0;
  const s0 = rev ? A0.length - 1 - start : start;
  if (inPoly(A[s0], Bq)) return null;
  const PL = [A, Bq];
  let cur = 0, i = s0, p = A[s0];
  const pts: V2[] = [p], sw: number[] = [];
  for (let guard = 0; guard < 4 * (A.length + Bq.length); guard++) {
    const pc = PL[cur], po = PL[1 - cur];
    const nI = (i + 1) % pc.length, q = pc[nI];
    let bt = Infinity, bj = -1, bx: V2 | null = null;
    for (let j = 0; j < po.length; j++) {
      const r = segX(p, q, po[j], po[(j + 1) % po.length]);
      if (!r || r.t >= bt) continue;
      const X = {x: p.x + (q.x - p.x) * r.t, y: p.y + (q.y - p.y) * r.t};
      if (dist2(X, p) < 1e-3) continue; // the crossing just switched at
      bt = r.t; bj = j; bx = X;
    }
    if (bx) {
      pts.push(bx);
      sw.push(pts.length - 1);
      cur = 1 - cur; i = bj; p = bx;
      continue;
    }
    if (cur === 0 && nI === s0) return {pts, sw};
    pts.push(q);
    i = nI; p = q;
  }
  return null;
};
/** round the corner at index J of a closed polyline: the stretch within arc length t on either side is replaced by a
 *  quadratic blend through the corner (tangent to the two chords), i.e. a fillet */
const filletAt = (p: V2[], J: number, t: number): V2[] => {
  const n = p.length;
  const c: number[] = [0];
  for (let i = 1; i < n; i++) c.push(c[i - 1] + dist2(p[i - 1], p[i]));
  const total = c[n - 1] + dist2(p[n - 1], p[0]);
  if (t <= 0 || 2 * t > 0.45 * total) return p;
  const at = (s0: number): V2 => {
    const s = ((s0 % total) + total) % total;
    let i = 0;
    while (i < n - 1 && c[i + 1] <= s) i++;
    const a = p[i], b = p[(i + 1) % n];
    const L = (i < n - 1 ? c[i + 1] : total) - c[i];
    const u = L > 1e-9 ? (s - c[i]) / L : 0;
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u};
  };
  const sJ = c[J], P0 = at(sJ - t), P1 = at(sJ + t), Q = p[J];
  const out: V2[] = [P1];
  for (let k = 1; k < n; k++) {
    const idx = (J + k) % n;
    const d = (c[idx] - sJ + total) % total;
    if (d > t && d < total - t) out.push(p[idx]);
  }
  out.push(P0);
  for (let k = 1; k < 10; k++) {
    const u = k / 10, v = 1 - u;
    out.push({x: v * v * P0.x + 2 * u * v * Q.x + u * u * P1.x, y: v * v * P0.y + 2 * u * v * Q.y + u * u * P1.y});
  }
  return out;
};
/** the turn (rad) of a closed polyline at index J, measured over arc length L each side; negative = concave (for
 *  area2 > 0) */
const turnAt = (p: V2[], J: number, L: number) => {
  const n = p.length;
  const walk = (dir: number): V2 => {
    let acc = 0, i = J;
    for (let k = 0; k < n; k++) {
      const j = (i + dir + n) % n;
      const d = dist2(p[i], p[j]);
      if (acc + d >= L) {
        const u = (L - acc) / (d || 1);
        return {x: p[i].x + (p[j].x - p[i].x) * u, y: p[i].y + (p[j].y - p[i].y) * u};
      }
      acc += d; i = j;
    }
    return p[i];
  };
  const a = walk(-1), b = walk(1), q = p[J];
  const ax = q.x - a.x, ay = q.y - a.y, bx = b.x - q.x, by = b.y - q.y;
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
};
const toEye = (B: Basis, p: V3) => norm3(sub3(B.eye, p));
const fx = (n: number) => n.toFixed(1);
const circ = (x: number, y: number, r: number) => `M${fx(x - r)},${fx(y)}a${fx(r)},${fx(r)} 0 1,0 ${fx(2 * r)},0a${fx(r)},${fx(r)} 0 1,0 ${fx(-2 * r)},0Z`;
/** the light, fixed in camera space: from the upper left, a little in front */
const lightDir = (B: Basis): V3 => norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.66)), mul3(B.fw, -0.5)));
/** plumage regions are stroked in their own colour this wide (screen px), so each overlaps the silhouette edge */
const BLEED_PX = 2.5;
/** screen direction toward the light (for the shifted-silhouette cel bands) */
const LD = {x: -0.62, y: -0.78};

/** marching squares on a (ni x nj) grid of samples, padded outside with -1. Returns closed loops in screen space
 *  (inside on the left in grid space). val >= 0 is inside. pos gives each sample's screen point. */
const msLoops = (ni: number, nj: number, val: (i: number, j: number) => number, pos: (i: number, j: number) => V2): V2[][] => {
  const W2 = nj + 2;
  const vals = new Float64Array((ni + 2) * W2).fill(-1);
  let any = false;
  for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
    const v = val(i, j);
    vals[(i + 1) * W2 + j + 1] = v;
    if (v >= 0) any = true;
  }
  if (!any) return [];
  const V = (i: number, j: number) => vals[(i + 1) * W2 + j + 1];
  const Pp = (i: number, j: number) => pos(Math.max(0, Math.min(ni - 1, i)), Math.max(0, Math.min(nj - 1, j)));
  const key = (i: number, j: number, vert: number) => ((i + 1) * W2 + (j + 1)) * 2 + vert;
  const edgePt = (ia: number, ja: number, ib: number, jb: number): V2 => {
    const va = V(ia, ja), vb = V(ib, jb);
    const t = va / (va - vb);
    const a = Pp(ia, ja), b = Pp(ib, jb);
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
  };
  const next = new Map<number, number>();
  const pts = new Map<number, V2>();
  const ci = [0, 1, 1, 0], cj = [0, 0, 1, 1];
  for (let i = -1; i < ni; i++) {
    for (let j = -1; j < nj; j++) {
      const v0 = V(i, j), v1 = V(i + 1, j), v2 = V(i + 1, j + 1), v3 = V(i, j + 1);
      const b = [v0 >= 0, v1 >= 0, v2 >= 0, v3 >= 0];
      const code = (b[0] ? 1 : 0) | (b[1] ? 2 : 0) | (b[2] ? 4 : 0) | (b[3] ? 8 : 0);
      if (code === 0 || code === 15) continue;
      const ek = [key(i, j, 0), key(i + 1, j, 1), key(i, j + 1, 0), key(i, j, 1)];
      const io: number[] = [], oi: number[] = [];
      for (let k = 0; k < 4; k++) {
        const c = (k + 1) % 4;
        if (b[k] && !b[c]) io.push(k);
        else if (!b[k] && b[c]) oi.push(k);
      }
      const link = (a: number, z: number) => {
        next.set(ek[a], ek[z]);
        if (!pts.has(ek[a])) {
          const c = (a + 1) % 4;
          pts.set(ek[a], edgePt(i + ci[a], j + cj[a], i + ci[c], j + cj[c]));
        }
      };
      if (io.length === 1) link(io[0], oi[0]);
      else {
        const center = (v0 + v1 + v2 + v3) / 4;
        for (const a of io) {
          let z = oi[0];
          for (let d = 1; d < 4; d++) {
            const k = center >= 0 ? (a + d) % 4 : (a - d + 4) % 4;
            if (oi.includes(k)) { z = k; break; }
          }
          link(a, z);
        }
      }
    }
  }
  const loops: V2[][] = [];
  const used = new Set<number>();
  for (const start of next.keys()) {
    if (used.has(start)) continue;
    const loop: V2[] = [];
    let k: number | undefined = start;
    let guard = 0;
    while (k !== undefined && !used.has(k) && guard++ < 200000) {
      used.add(k);
      const p = pts.get(k);
      if (p) loop.push(p);
      k = next.get(k);
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
};

// ================================================================ the hull (body) geometry, duck-local cm
const X0 = -20, X1 = 18.2, XM = (X0 + X1) / 2, HLX = (X1 - X0) / 2;
const KX = [X0, -18, -12, 0, 12, 16, X1];
const YC = pchip(KX, [6.0, 4.9, 2.5, 2.05, 3.4, 4.2, 4.2]);
const HT = pchip(KX, [2.4, 3.2, 6.6, 8.75, 8.2, 7.6, 7.3]);
const HB = pchip(KX, [3.0, 5.2, 7.9, 8.55, 8.4, 8.0, 7.8]);
const WD = pchip(KX, [4.0, 5.0, 8.3, 10.2, 9.4, 8.0, 7.5]);
const NE = 2.5; // end rounding exponent
const PX = 2.4; // section exponent (a little boxy, like a floating duck)
const envX = (x: number) => {
  const s = Math.min(1, Math.abs((x - XM) / HLX));
  return Math.pow(1 - Math.pow(s, NE), 1 / NE);
};
const hullPt = (lam: number, th: number): V3 => {
  const x = XM + HLX * sp(Math.sin(lam), 2 / NE);
  const E = Math.pow(Math.abs(Math.cos(lam)), 2 / NE);
  const u = Math.sin(th), v = -Math.cos(th); // theta = 0 at the keel, pi/2 near side, pi on top
  const z = WD(x) * E * sp(u, 2 / PX);
  const y = YC(x) + (v >= 0 ? HT(x) : HB(x)) * E * sp(v, 2 / PX);
  return [x, y, z];
};
/** the hull's half-width at local (x, y) (near surface z), or -1 outside */
const zAt = (x: number, y: number) => {
  const E = envX(x);
  if (E <= 1e-6) return -1;
  const dy = y - YC(x);
  const h = (dy >= 0 ? HT(x) : HB(x)) * E;
  const q = Math.abs(dy) / h;
  if (q >= 1) return -1;
  return WD(x) * E * Math.pow(1 - Math.pow(q, PX), 1 / PX);
};
const insideHull = (p: V3) => {
  const w = zAt(p[0], p[1]);
  return w > 0 && Math.abs(p[2]) < w;
};
const topY = (x: number) => YC(x) + HT(x) * envX(x);
const keelY = (x: number) => YC(x) - HB(x) * envX(x);

const NL = 40, NT = 56, NJ = NT + 1;
type HL = {l: V3; n: V3};
/** camera-independent samples: local points and outward normals */
const HULL_LOCAL: HL[] = (() => {
  const out: HL[] = [];
  const d = 1e-3;
  for (let i = 0; i < NL; i++) {
    const lam = -Math.PI / 2 + (Math.PI * i) / (NL - 1);
    for (let j = 0; j < NJ; j++) {
      const th = (2 * Math.PI * j) / NT;
      const p = hullPt(lam, th);
      let n: V3;
      if (i === 0 || i === NL - 1) n = [i === 0 ? -1 : 1, 0, 0];
      else {
        const pl = sub3(hullPt(lam + d, th), hullPt(lam - d, th));
        const pt = sub3(hullPt(lam, th + d), hullPt(lam, th - d));
        n = norm3(cross3(pt, pl));
        const c: V3 = [p[0], YC(p[0]), 0];
        const r = sub3(p, c);
        if (dot3(n, r) < 0 && len3(r) > 1e-6) n = mul3(n, -1);
      }
      out.push({l: p, n});
    }
  }
  return out;
})();

type HS = {l: V3; w: V3; x: number; y: number; s: number; g: number; nl: number};
type HullView = {
  S: HS[];
  above: string;
  below: string;
  /** the near half of the waterline, projected (stern to bow) */
  wlNear: V2[];
  wlLocal: V3[];
};
/** local y of the water surface (world y = 0) at section x, for the duck frame F */
const wlYOf = (F: Frame) => (x: number) => -(F.o[1] + F.ex[1] * x) / (F.ey[1] || 1);

const buildHull = (B: Basis, F: Frame): HullView => {
  const L = lightDir(B);
  const S: HS[] = HULL_LOCAL.map(({l, n}) => {
    const w = xf(F, l);
    const nw = xfv(F, n);
    const q = proj(B, w);
    return {l, w, x: q.x, y: q.y, s: q.s, g: dot3(nw, toEye(B, w)), nl: dot3(nw, L)};
  });
  const wlY = wlYOf(F);
  const near: V3[] = [];
  for (let k = 0; k <= 72; k++) {
    const lam = -Math.PI / 2 + (Math.PI * k) / 72;
    const x = XM + HLX * sp(Math.sin(lam), 2 / NE);
    const y = wlY(x);
    const z = zAt(x, y);
    if (z > 0) near.push([x, y, z]);
  }
  const far = near.map((p) => [p[0], p[1], -p[2]] as V3).reverse();
  const loop = [...near, ...far];
  const loopS = loop.map((p) => {
    const q = proj(B, xf(F, p));
    return {x: q.x, y: q.y};
  });
  const up: V2[] = [...loopS], dn: V2[] = [...loopS];
  for (const s of S) {
    if (s.w[1] >= 0) up.push({x: s.x, y: s.y});
    if (s.w[1] <= 0) dn.push({x: s.x, y: s.y});
  }
  return {
    S,
    above: convexPath(up),
    below: convexPath(dn),
    wlNear: near.map((p) => {
      const q = proj(B, xf(F, p));
      return {x: q.x, y: q.y};
    }),
    wlLocal: near,
  };
};
const hullRegion = (HV: HullView, f: (s: HS) => number, facing = true) => {
  const loops = msLoops(
    NL,
    NJ,
    (i, j) => {
      const s = HV.S[i * NJ + j];
      const a = f(s);
      return facing ? Math.min(a, (s.g + 0.05) * 14) : a;
    },
    (i, j) => {
      const s = HV.S[i * NJ + j];
      return {x: s.x, y: s.y};
    },
  );
  return loops.map(loopPath).join(' ');
};

// ---------------------------------------------------------------- plumage fields (duck-local, cm; > 0 inside)
/** the breast's rear edge (x as a function of height), gently scalloped */
const xBreast = (y: number) => 9.4 - 0.12 * (y - 4) + 0.03 * Math.min(0, y - 4) ** 2 + 0.22 * Math.sin(y * 1.7);
/** the flank's upper edge (the folded wing and scapulars lie above it) */
const yFlank0 = pchip([-22, -16, -9, -2, 5, 10], [4.4, 4.9, 5.6, 6.4, 7.7, 9.3]);
const yFlank = (x: number) => yFlank0(x) + 0.2 * Math.sin(x * 1.35);
/** the black stern's front edge */
const xStern = (y: number) => -14.6 + 0.16 * y;
const F_UPPER = (s: HS) => s.l[1] - yFlank(s.l[0]);
const F_MANTLE = (s: HS) => s.l[1] - (topY(s.l[0]) - 1.15);
const F_VENT = (s: HS) => Math.min(xStern(s.l[1]) + 1.7 - s.l[0], 5.6 - s.l[1]);
const F_STERN = (s: HS) => xStern(s.l[1]) - s.l[0];
/** the folded primaries: a dark tapering band along the rear of the back */
const F_PRIM = (s: HS) => {
  const x = s.l[0];
  const u = clamp((x + 19.4) / 9.6);
  return Math.min((-9.6 - x) * 0.6, (x + 19.4) * 0.6, s.l[1] - (topY(x) - lerp(0.5, 2.3, Math.sqrt(u))));
};
/** the speculum: a narrow slanted band of secondaries along the folded wing's lower edge, (x, dy above yFlank0) */
const SPEC = {xa: -14.1, xb: -8.6, lo: -0.4, hi: 0.32, slant: 0.7, bar: 0.3};
/** a parallelogram on the near hull surface, following the flank line: corners at dy = lo / hi, ends slanted */
const specQuad = (xa: number, xb: number, lo: number, hi: number): [number, number][] => {
  const out: [number, number][] = [];
  const at = (x0: number, dy: number): [number, number] => {
    const x = x0 + SPEC.slant * (dy - SPEC.lo);
    return [x, yFlank0(x) + dy];
  };
  for (let k = 0; k <= 8; k++) out.push(at(lerp(xa, xb, k / 8), lo));
  for (let k = 1; k < 3; k++) out.push(at(xb, lerp(lo, hi, k / 3)));
  for (let k = 0; k <= 8; k++) out.push(at(lerp(xb, xa, k / 8), hi));
  for (let k = 1; k < 3; k++) out.push(at(xa, lerp(hi, lo, k / 3)));
  return out;
};
const F_BREAST = (s: HS) => s.l[0] - xBreast(s.l[1]);
const F_BELLY = (s: HS) => -2.2 - s.l[1];
const F_SHADOW = (s: HS) => (0.1 - s.nl) * 10;
const F_CORE = (s: HS) => (-0.32 - s.nl) * 10;
const F_HI = (s: HS) => (s.nl - 0.74) * 10;

// ================================================================ neck, head, bill, tail (duck-local)
/** the neck: a tube along a quadratic curve from inside the breast up into the head, radius varying (a slight waist) */
const NECK = {a: [11.3, 4.4, 0] as V3, m: [13.3, 10.0, 0] as V3, b: [16.0, 16.4, 0] as V3, r: [5.1, 4.3, 3.95]};
const neckAt = (u: number): {c: V3; t: V3; r: number} => {
  const a = NECK.a, m = NECK.m, b = NECK.b;
  const c = add3(add3(mul3(a, (1 - u) ** 2), mul3(m, 2 * u * (1 - u))), mul3(b, u * u));
  const t = norm3(add3(mul3(sub3(m, a), 2 * (1 - u)), mul3(sub3(b, m), 2 * u)));
  const r = u < 0.5 ? lerp(NECK.r[0], NECK.r[1], sm(u / 0.5)) : lerp(NECK.r[1], NECK.r[2], sm((u - 0.5) / 0.5));
  return {c, t, r};
};
const COLLAR_U = 0.56; // along the neck curve
const HEAD = {
  nape: {c: [14.2, 18.2, 0] as V3, r: [3.3, 3.6, 3.05] as V3, tilt: 14},
  cranium: {c: [16.7, 19.1, 0] as V3, r: [5.0, 3.95, 3.15] as V3, tilt: -6},
  face: {c: [19.2, 18.0, 0] as V3, r: [3.4, 3.05, 2.7] as V3, tilt: -16},
};
/** the bill loft starts inside the face, its top level with the forehead line, so the culmen continues the forehead */
const BILL = {base: [21.3, 18.72, 0] as V3, tip: [27.2, 16.95, 0] as V3};
const EYE_L: V3 = (() => {
  const c = HEAD.cranium.c, r = HEAD.cranium.r;
  const x = 18.9, y = 19.65;
  const q = 1 - ((x - c[0]) / r[0]) ** 2 - ((y - c[1]) / r[1]) ** 2;
  return [x, y, r[2] * Math.sqrt(Math.max(0, q)) + 0.05];
})();
const EYE_R = 0.52;

const ellFrame = (F: Frame, c: V3, tilt: number): Frame => ({
  o: xf(F, c),
  ex: xfv(F, rotZ([1, 0, 0], tilt)),
  ey: xfv(F, rotZ([0, 1, 0], tilt)),
  ez: xfv(F, [0, 0, 1]),
});
const ellPath = (B: Basis, F: Frame, e: {c: V3; r: V3; tilt: number}) => smoothClosed(ellipsoid2(B, ellFrame(F, e.c, e.tilt), [0, 0, 0], e.r, 40));
/** the head as ONE smooth rounded shape: the convex hull of its three volumes (nape, cranium, face) and the top of the
 *  neck tube, so the nape and the throat blend into the neck (no notches) */
const headHull = (B: Basis, F: Frame): V2[] => {
  const pts: V2[] = [HEAD.nape, HEAD.cranium, HEAD.face].flatMap((e) => ellipsoid2(B, ellFrame(F, e.c, e.tilt), [0, 0, 0], e.r, 36));
  for (const u of [0.86, 0.93, 1.0]) {
    const nk = neckAt(u);
    const c = proj(B, xf(F, nk.c));
    const r = nk.r * c.s;
    for (let k = 0; k < 24; k++) pts.push({x: c.x + r * Math.cos((k / 24) * Math.PI * 2), y: c.y + r * Math.sin((k / 24) * Math.PI * 2)});
  }
  const hl = hull(pts);
  return hl.length >= 3 ? resample(hl, 10) : [];
};
const headPath = (B: Basis, F: Frame) => {
  const h = headHull(B, F);
  return h.length >= 3 ? smoothC(h) : '';
};
/** the fillet at the head/neck junctions (nape and throat): the blend runs this far (cm) along the outline on either
 *  side of each junction */
const NECK_FILLET = 0.8;
/** head and neck as ONE outline: the union of the head's rounded hull and the neck tube, with smooth fillets where
 *  the tube meets the head (no helmet-on-a-tube corners). Falls back to the two shapes (as separate paths) if the
 *  union cannot be traced. */
const neckHeadPaths = (B: Basis, F: Frame): string[] => {
  const hd = headHull(B, F);
  const nk = neckPts(B, F);
  const apart = () => [neckPath(B, F), headPath(B, F)].filter(Boolean);
  if (hd.length < 3 || nk.length < 3) return apart();
  const H2 = crSample(hd, 3), N2 = crSample(nk, 4);
  // start the walk on the neck's buried lower cap: its point farthest from the head
  let cx = 0, cy = 0;
  for (const q of H2) { cx += q.x; cy += q.y; }
  cx /= H2.length; cy /= H2.length;
  let st = 0, bd = -1;
  N2.forEach((q, i) => { const d = Math.hypot(q.x - cx, q.y - cy); if (d > bd) { bd = d; st = i; } });
  const U = unionWalk(N2, H2, st);
  if (!U || U.sw.length < 2) return apart();
  const s = proj(B, xf(F, neckAt(0.86).c)).s;
  // the junctions: the concave switches, the sharpest first, at most one per side (a near-tangent graze of the two
  // outlines can add a pair of shallow switches next to a real junction)
  const cand = U.sw.map((J) => ({q: U.pts[J], turn: turnAt(U.pts, J, 1.0 * s)})).filter((c) => c.turn < -0.12);
  cand.sort((a, b) => a.turn - b.turn);
  const keep: V2[] = [];
  for (const c of cand) if (keep.length < 2 && keep.every((k) => dist2(k, c.q) > 3 * NECK_FILLET * s)) keep.push(c.q);
  let pts = U.pts;
  for (const q of keep) {
    let J = 0, bj = Infinity;
    pts.forEach((p, i) => { const d = dist2(p, q); if (d < bj) { bj = d; J = i; } });
    pts = filletAt(pts, J, NECK_FILLET * s);
  }
  return [smoothC(resample(pts, 5))];
};
/** the neck tube's outline (both ends rounded; both are buried, in the body and in the head) */
const neckPts = (B: Basis, F: Frame): V2[] => {
  const n = 12;
  const S: SP[] = [], rr: number[] = [];
  for (let i = 0; i <= n; i++) {
    const q = neckAt(i / n);
    S.push(proj(B, xf(F, q.c)));
    rr.push(q.r);
  }
  const L: V2[] = [], R: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const w = rr[i] * S[i].s;
    L.push({x: S[i].x - ty * w, y: S[i].y + tx * w});
    R.push({x: S[i].x + ty * w, y: S[i].y - tx * w});
  }
  // rounded caps (both ends are buried in the body and the head), bulging away from the tube
  const cap = (c: SP, r: number, from: V2, out: V2): V2[] => {
    const a0 = Math.atan2(from.y - c.y, from.x - c.x);
    const ao = Math.atan2(out.y, out.x);
    const sgn = Math.cos(a0 + Math.PI / 2 - ao) > 0 ? 1 : -1;
    const pts: V2[] = [];
    for (let k = 1; k < 8; k++) {
      const a = a0 + (sgn * Math.PI * k) / 8;
      pts.push({x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a)});
    }
    return pts;
  };
  const endCap = cap(S[n], rr[n] * S[n].s, L[n], {x: S[n].x - S[n - 1].x, y: S[n].y - S[n - 1].y});
  const startCap = cap(S[0], rr[0] * S[0].s, R[0], {x: S[0].x - S[1].x, y: S[0].y - S[1].y});
  return [...L, ...endCap, ...R.slice().reverse(), ...startCap];
};
const neckPath = (B: Basis, F: Frame) => smoothClosed(neckPts(B, F));
/** bill loft sample points (local) */
const billSections = (() => {
  const secs: V3[][] = [];
  const n = 9;
  const ax = sub3(BILL.tip, BILL.base);
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * 1.08;
    const c = add3(add3(BILL.base, mul3(ax, Math.min(u, 1))), [0, -0.38 * Math.sin(Math.PI * Math.min(u, 1)), 0]);
    const tipK = u > 0.93 ? Math.sqrt(Math.max(0, 1 - ((u - 0.93) / 0.15) ** 2)) : 1;
    const hw = (1.3 + 0.32 * Math.min(u, 1)) * tipK;
    const hh = lerp(1.25, 0.52, Math.min(u, 1)) * Math.max(0.7, tipK);
    const cc = u > 1 ? add3(c, mul3(norm3(ax), (u - 1) * len3(ax))) : c;
    const ring: V3[] = [];
    for (let j = 0; j < 14; j++) {
      const t = (j / 14) * Math.PI * 2;
      ring.push([cc[0], cc[1] + hh * sp(Math.cos(t), 0.75), hw * sp(Math.sin(t), 0.75)]);
    }
    secs.push(ring);
  }
  return secs;
})();
/** tail fan (short, pale, pointed, held a little raised; a little cupped so it has some depth from the side), in the
 *  mid-plane behind the stern; TAIL_IN is its greyer centre */
const tailFan = (k: number, zk: number): V3[] => {
  const out: V3[] = [[-18.0, 6.2, -2.1 * zk]];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const z = (-3.0 + (6.0 * i) / (n - 1)) * zk;
    const q = (z / (3.0 * zk)) ** 2;
    const tip: V3 = [-24.5 + 1.7 * q, 9.0 - 1.9 * q, z];
    out.push([lerp(-18.0, tip[0], k), lerp(6.4, tip[1], k), z]);
  }
  out.push([-18.0, 6.2, 2.1 * zk]);
  return out;
};
const TAIL_PTS: V3[] = tailFan(1, 1);
const TAIL_IN: V3[] = tailFan(0.72, 0.55);
/** the drake curl: one small upturned black feather rising from the tail's root (duck-local x, y; mid-plane) */
const CURLS: {pts: [number, number][]; z: number; w: number}[] = [
  {pts: ([[0, 0], [-0.96, 0.9], [-1.62, 1.74], [-1.6, 2.5], [-1.14, 2.92], [-0.62, 2.68], [-0.64, 2.2], [-1.04, 2.0]] as [number, number][]).map(([x, y]) => [-17.1 + x, 6.55 + y] as [number, number]), z: 0, w: 0.72},
];
// ================================================================ the drive and the legs (duck-local)
/** the sealed printed module (a rounded box extruded along z, near face at z) */
const MODULE = {x0: -4.6, x1: 5.4, y0: -3.75, y1: -1.3, z: 3.0, r: 0.9};
/** the gear cover on its near face: from the motor-end pulley at the front to the output shaft at the lower rear */
const COVER = {a: [3.2, -2.3] as [number, number], b: [-3.6, -3.2] as [number, number], r: 0.9, z: 3.32};
/** the linkage (duck-local x, y; near side, mirrored in z for the far side): the output shaft c with crank radius rc;
 *  the hip pivot behind it on a printed bracket; the rocker (lev long) is the leg's own extension above the hip, at
 *  lam deg from the leg's forward perpendicular; the pushrod joins the crank pin to the rocker's top. */
const LEG = {c: [-3.6, -3.2] as [number, number], rc: 1.4, hip: [-8.0, -3.6] as [number, number], lev: 2.4, lam: -68.4, shank: 5.7, zBracket: 3.3, zCrank: 3.45, zLeg: 3.7, zRod: 3.95};
const ALPHA0 = 6; // mid swing (deg, + = foot back): the rocker's top is one pushrod length from the shaft there
const pinOf = (phi: number): [number, number] => [LEG.c[0] + LEG.rc * Math.cos(phi), LEG.c[1] + LEG.rc * Math.sin(phi)];
const leverTip = (a: number): [number, number] => [LEG.hip[0] + LEG.lev * Math.cos((a + LEG.lam) * R2), LEG.hip[1] - LEG.lev * Math.sin((a + LEG.lam) * R2)];
const ROD_L = (() => {
  const q = leverTip(ALPHA0);
  return Math.hypot(q[0] - LEG.c[0], q[1] - LEG.c[1]);
})();
/** the leg's swing (deg, + = foot back) for a crank angle: SOLVED from the pushrod length (bisection on the assembled
 *  branch: the rocker angle between the hip-to-pin direction and its opposite, where the distance falls monotonically) */
const legAlpha = (phi: number) => {
  const P = pinOf(phi), Hp = LEG.hip;
  const psiP = Math.atan2(-(P[1] - Hp[1]), P[0] - Hp[0]) / R2;
  const d = (psi: number) => Math.hypot(Hp[0] + LEG.lev * Math.cos(psi * R2) - P[0], Hp[1] - LEG.lev * Math.sin(psi * R2) - P[1]);
  let lo = psiP - 180, hi = psiP;
  for (let i = 0; i < 36; i++) {
    const m = (lo + hi) / 2;
    if (d(m) > ROD_L) lo = m; else hi = m;
  }
  let a = (lo + hi) / 2 - LEG.lam;
  while (a > 180) a -= 360;
  while (a <= -180) a += 360;
  return a;
};
/** the crank angles of the leg's two reversals: `fwd` = foot fully forward (the power stroke starts), `back` = foot
 *  fully back (the recovery starts). The crank angle grows with time. */
const PHI_REV = (() => {
  let mx = -Infinity, mn = Infinity, back = 0, fwd = 0;
  for (let k = 0; k < 1440; k++) {
    const phi = (k / 1440) * Math.PI * 2;
    const a = legAlpha(phi);
    if (a > mx) { mx = a; back = phi; }
    if (a < mn) { mn = a; fwd = phi; }
  }
  return {fwd, back};
})();
const wrap2pi = (x: number) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
/** the web unfolds / folds over this much crank angle (75 deg = 4+ frames at 30 fps), starting a little before each
 *  reversal (the water loads the web as the foot turns round) */
const FOLD_PRE = 15 * R2, FOLD_LEN = 75 * R2;
/** 0 = recovery (foot moving forward, web folded) .. 1 = power stroke (foot moving back, web spread), from the crank
 *  phase relative to the two reversal angles: a smooth ramp at each reversal, so the foot never flips in one frame */
const powerOf = (phi: number) => {
  const d = wrap2pi(phi - PHI_REV.fwd + FOLD_PRE);
  const pow = wrap2pi(PHI_REV.back - PHI_REV.fwd);
  if (d < FOLD_LEN) return sm(d / FOLD_LEN);
  if (d < pow) return 1;
  if (d < pow + FOLD_LEN) return 1 - sm((d - pow) / FOLD_LEN);
  return 0;
};
/** the near foot's crank angle at the middle of its power stroke (fastest backward swing); the far foot's is half a
 *  turn away */
const PHI_POWER = (() => {
  let best = 0, bv = -Infinity;
  for (let k = 0; k < 360; k++) {
    const phi = (k / 360) * Math.PI * 2;
    const v = legAlpha(phi + 0.02) - legAlpha(phi - 0.02);
    if (v > bv) { bv = v; best = phi; }
  }
  return best;
})();
type LegG = {side: 1 | -1; phi: number; a: number; pin: V3; crank0: V3; lever: V3; hip: V3; exit: V3; ankle: V3; pw: number; D: V3; E: V3; tips: V3[]; notch: V3[]; heel: V3};
const legGeo = (side: 1 | -1, phi: number): LegG => {
  const a = legAlpha(phi);
  const ar = a * R2;
  const hip: V3 = [LEG.hip[0], LEG.hip[1], side * LEG.zLeg];
  const Sd: V3 = [-Math.sin(ar), -Math.cos(ar), 0];
  const ankle = add3(hip, mul3(Sd, LEG.shank));
  // where the shank leaves the hull
  let lo = 0, hi = 1;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (insideHull(add3(hip, mul3(Sd, LEG.shank * m)))) lo = m; else hi = m;
  }
  const exit = add3(hip, mul3(Sd, LEG.shank * hi));
  const lt = leverTip(a);
  const pp = pinOf(phi);
  const pw = powerOf(phi);
  const gam = lerp(-74, 16 - 0.55 * a, pw) * R2;
  const D = norm3([Math.sin(gam), -Math.cos(gam), side * 0.12]);
  const beta = 36 * R2;
  const E0: V3 = [-Math.sin(beta), 0, side * Math.cos(beta)];
  const E = norm3(sub3(E0, mul3(D, dot3(E0, D))));
  const sig = lerp(4, 31, pw) * R2;
  const toe = (ang: number, Lt: number): V3 => add3(ankle, mul3(add3(mul3(D, Math.cos(ang)), mul3(E, Math.sin(ang))), Lt));
  const tips = [toe(-sig, 4.7), toe(0, 5.9), toe(sig, 5.3)];
  const notch = [0, 1].map((k) => add3(ankle, mul3(add3(sub3(tips[k], ankle), sub3(tips[k + 1], ankle)), 0.5 * lerp(0.93, 0.7, pw))));
  const heel = add3(ankle, add3(mul3(D, -0.9), mul3(E, -0.25)));
  return {
    side, phi, a, pin: [pp[0], pp[1], side * LEG.zRod], crank0: [LEG.c[0], LEG.c[1], side * LEG.zCrank], lever: [lt[0], lt[1], side * LEG.zRod],
    hip, exit, ankle, pw, D, E, tips, notch, heel,
  };
};

// ================================================================ motion
const duckFrame = (o: V3, t: number): Frame => {
  const w = 2 * Math.PI * PADDLE_HZ * 2; // two strokes per crank turn
  const heave = 0.1 * Math.sin(w * t);
  const pitch = 0.35 * Math.sin(w * t + 0.9);
  return {o: add3(o, [0, heave, 0]), ex: rotZ([1, 0, 0], pitch), ey: rotZ([0, 1, 0], pitch), ez: [0, 0, 1]};
};
/** crank angle of the near leg at time t (rad) */
export const duckCrank = (t: number) => 2 * Math.PI * PADDLE_HZ * t + 0.6;

// ================================================================ the split convention (shared by Duck and Pond)
/** how far the pond's underwater view is shown (0 = camera well above the water, 1 = at the waterline), from the
 *  camera's grazing angle to the glass plane's top edge */
export const pondSplit = (B: Basis) => {
  const h = B.eye[1];
  const d = Math.max(1, B.eye[2] - GLASS_Z);
  const a = deg(Math.atan2(h, d));
  return 1 - ss(a, 0.7, 8.0);
};
/** the frame's waterline: the projected top edge of the glass plane (y = 0, z = GLASS_Z), with a gentle ripple */
const edgeLine = (B: Basis, t: number): V2[] => {
  const xc = B.eye[0];
  const a = proj(B, [xc - 220, 0, GLASS_Z]), b = proj(B, [xc + 220, 0, GLASS_Z]);
  const slope = (b.y - a.y) / (b.x - a.x || 1);
  const sc = proj(B, [xc, 0, GLASS_Z]).s;
  const out: V2[] = [];
  for (let i = 0; i <= 54; i++) {
    const x = -90 + (i / 54) * (W + 180);
    const y = a.y + (x - a.x) * slope + sc * (0.09 * Math.sin(x / (sc * 8.5) + t * 2.2) + 0.045 * Math.sin(x / (sc * 3.3) - t * 3.4));
    out.push({x, y});
  }
  return out;
};
/** the frame's waterline as drawn: the glass edge, wiped up the frame from below as the camera reaches the water
 *  (pondSplit 0 -> 1). Below it the underwater view is opaque; everything that lies ON the surface is hard-clipped
 *  above it (no cross-fade, no double exposure). */
const wipeLine = (B: Basis, t: number): V2[] => {
  const e = edgeLine(B, t);
  const uw = pondSplit(B);
  if (uw >= 0.999) return e;
  let top = Infinity;
  for (const p of e) top = Math.min(top, p.y);
  const dy = (1 - uw) * Math.max(0, H + 160 - top);
  return e.map((p) => ({x: p.x, y: p.y + dy}));
};
const underClipD = (B: Basis, t: number) => {
  const e = wipeLine(B, t);
  return `M${e.map(P2).join(' L')} L${W + 90},${H + 600} L-90,${H + 600} Z`;
};
const overClipD = (B: Basis, t: number) => {
  const e = wipeLine(B, t);
  return `M${e.map(P2).join(' L')} L${W + 90},-600 L-90,-600 Z`;
};
/** things that lie ON the water surface (reflection, wake): hard-clipped above the frame's waterline */
const OnSurface: React.FC<{B: Basis; t: number; children: React.ReactNode}> = ({B, t, children}) => {
  const uw = pondSplit(B);
  if (uw < 0.01) return <g>{children}</g>;
  const id = uid('dks');
  return (
    <g>
      <defs>
        <clipPath id={id}><path d={overClipD(B, t)} /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};
/** grazing angle (deg) of the camera over the water at a world point */
const grazing = (B: Basis, p: V3) => deg(Math.atan2(B.eye[1] - p[1], Math.hypot(B.eye[0] - p[0], B.eye[2] - p[2])));

// ================================================================ cel helper: shadow / base / sheen by shifted silhouettes
const Cel: React.FC<{paths: string[]; base: string; shadow: string; sheen?: string; dS: number; dH?: number; clipExtra?: string}> = ({paths, base, shadow, sheen, dS, dH = 0}) => {
  const idU = uid('celu'), idS = uid('cels');
  const all = paths.filter(Boolean);
  if (!all.length) return null;
  return (
    <g>
      <defs>
        <clipPath id={idU}>{all.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={idS}>
          {all.map((d, i) => <path key={i} d={d} transform={`translate(${fx(LD.x * dS)},${fx(LD.y * dS)})`} />)}
        </clipPath>
      </defs>
      {all.map((d, i) => <path key={i} d={d} fill={shadow} />)}
      <g clipPath={`url(#${idU})`}>
        <g clipPath={`url(#${idS})`}>
          {sheen ? <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={sheen} /> : null}
          <g transform={sheen ? `translate(${fx(-LD.x * dH)},${fx(-LD.y * dH)})` : undefined}>
            {all.map((d, i) => <path key={i} d={d} fill={base} />)}
          </g>
        </g>
      </g>
    </g>
  );
};

// ================================================================ Duck parts
const lineOnSurf = (B: Basis, F: Frame, xy: [number, number][], out = 0.05): string => {
  const pts: V2[] = [];
  let d = '';
  const flush = () => {
    if (pts.length >= 2) d += smoothOpen(pts) + ' ';
    pts.length = 0;
  };
  for (const [x, y] of xy) {
    const z = zAt(x, y);
    if (z <= 0) { flush(); continue; }
    const pl: V3 = [x, y, z + out];
    // facing test with the analytic-ish normal (finite differences of the near surface)
    const dx = 0.05;
    const zx = (zAt(x + dx, y) - zAt(x - dx, y)) / (2 * dx), zy = (zAt(x, y + dx) - zAt(x, y - dx)) / (2 * dx);
    const nl = norm3([-zx, -zy, 1]);
    const w = xf(F, pl);
    if (dot3(xfv(F, nl), toEye(B, w)) < 0.04) { flush(); continue; }
    const q = proj(B, w);
    pts.push({x: q.x, y: q.y});
  }
  flush();
  return d;
};
/** a closed (x, y) outline laid on the near hull surface, projected ('' if any point leaves the hull) */
const surfPoly = (B: Basis, F: Frame, xy: [number, number][], out = 0.04): string => {
  const pts: V2[] = [];
  for (const [x, y] of xy) {
    const z = zAt(x, y);
    if (z <= 0) return '';
    const q = proj(B, xf(F, [x, y, z + out]));
    pts.push({x: q.x, y: q.y});
  }
  return poly(pts);
};
/** projected ribbon (tapered) along a 3D centreline */
const ribbon = (B: Basis, F: Frame, c: V3[], w0: number, w1: number) => {
  const S = c.map((p) => proj(B, xf(F, p)));
  const n = S.length;
  const L: V2[] = [], R: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const w = (lerp(w0, w1, i / (n - 1)) * S[i].s) / 2;
    L.push({x: S[i].x - ty * w, y: S[i].y + tx * w});
    R.push({x: S[i].x + ty * w, y: S[i].y - tx * w});
  }
  return smoothClosed([...L, ...R.reverse()]);
};

/** the whole above-water duck (and, mirrored, its reflection silhouettes) */
const AboveWater: React.FC<{B: Basis; F: Frame; HV: HullView; t: number}> = ({B, F, HV}) => {
  const idA = uid('dka');
  const P = (p: V3) => proj(B, xf(F, p));
  const sAt = P([0, 8, 0]).s;
  // ---- regions on the hull
  const R = {
    upper: hullRegion(HV, F_UPPER),
    mantle: hullRegion(HV, F_MANTLE),
    vent: hullRegion(HV, F_VENT),
    stern: hullRegion(HV, F_STERN),
    prim: hullRegion(HV, F_PRIM),
    breast: hullRegion(HV, F_BREAST),
    shadow: hullRegion(HV, F_SHADOW),
    core: hullRegion(HV, F_CORE),
    hi: hullRegion(HV, F_HI),
  };
  // ---- feather lines: scapular/tertial edges along the folded wing, faint vermiculation on the flank
  const tert: string[] = [];
  const tertRows: [number, number, number][] = [[0.8, -15.5, 6.5], [1.7, -13.5, 5.0], [2.6, -11.0, 3.0]];
  for (const [dy, xa, xb] of tertRows) {
    const xy: [number, number][] = [];
    for (let k = 0; k <= 16; k++) {
      const x = lerp(xa, xb, k / 16);
      xy.push([x, yFlank0(x) + dy + 0.18 * Math.sin(x * 0.9)]);
    }
    tert.push(lineOnSurf(B, F, xy));
  }
  // short scallops (feather tips) along the wing's lower edge
  const scal: string[] = [];
  for (let k = 0; k < 7; k++) {
    const x0 = -15.2 + k * 2.6;
    const y0 = yFlank0(x0) + 0.35;
    const xy: [number, number][] = [];
    for (let m = 0; m <= 5; m++) {
      const u = m / 5;
      xy.push([x0 + 2.2 * u, y0 + 0.55 * Math.sin(Math.PI * u)]);
    }
    scal.push(lineOnSurf(B, F, xy));
  }
  const verm: string[] = [];
  for (let k = 0; k < 7; k++) {
    const y = 1.2 + k * 0.85;
    const xa = -12 + 1.3 * (k % 3), xb = 6.5 - 1.1 * (k % 2);
    const xy: [number, number][] = [];
    for (let m = 0; m <= 14; m++) {
      const x = lerp(xa, xb, m / 14);
      xy.push([x, y + 0.12 * Math.sin(x * 2.3 + k)]);
    }
    verm.push(lineOnSurf(B, F, xy));
  }
  // ---- neck and head: one filleted outline
  const neck = neckHeadPaths(B, F);
  // everything of the neck/head group lies in world y >= 0: the neck tube's buried lower cap reaches below the water
  // (local y ~ -0.7), so the group is clipped to the screen region above the projected near waterline (carried on
  // along the duck's axis past both ends, closed upward), pulled 3 px inside the hull, which covers that band
  const wlUp = (() => {
    const wl = HV.wlNear, wlL = HV.wlLocal;
    if (wl.length < 2) return '';
    const wlY = wlYOf(F);
    const far = (x: number): V2 => {
      const q = P([x, wlY(x), 0]);
      return {x: q.x, y: q.y};
    };
    const pts = [far(wlL[0][0] - 300), ...wl, far(wlL[wlL.length - 1][0] + 300)].map((p) => ({x: p.x, y: p.y - 3}));
    const a = pts[0], z = pts[pts.length - 1];
    return poly([...pts, {x: z.x, y: -4 * H}, {x: a.x, y: -4 * H}]);
  })();
  const yUp = wlUp ? `url(#${idA}y)` : undefined;
  // collar: a white band round the neck (front-facing arc)
  const e2: V3 = [0, 0, 1];
  const ringArc = (u: number, ext = 0.06): V2[] => {
    const nk = neckAt(u);
    const c = nk.c, r = nk.r + 0.02;
    const e1 = norm3(cross3(nk.t, [0, 0, 1]));
    const pts: {p: V2; f: number}[] = [];
    for (let k = 0; k < 72; k++) {
      const th = (k / 72) * Math.PI * 2;
      const nn = add3(mul3(e1, Math.cos(th)), mul3(e2, Math.sin(th)));
      const p = add3(c, mul3(nn, r));
      const w = xf(F, p);
      const f = dot3(xfv(F, nn), toEye(B, w));
      const q = proj(B, w);
      pts.push({p: {x: q.x, y: q.y}, f});
    }
    // rotate so that the arc of facing points is contiguous
    let s0 = pts.findIndex((q, i) => q.f > -ext && pts[(i + 71) % 72].f <= -ext);
    if (s0 < 0) s0 = 0;
    const out: V2[] = [];
    for (let k = 0; k < 72; k++) {
      const q = pts[(s0 + k) % 72];
      if (q.f > -ext) out.push(q.p); else break;
    }
    return out;
  };
  const cu0 = ringArc(COLLAR_U - 0.032), cu1 = ringArc(COLLAR_U + 0.032);
  const collar = cu0.length > 2 && cu1.length > 2 ? poly([...cu0, ...cu1.slice().reverse()]) : '';
  // the chestnut lower neck: below the collar's front arc; the arc's ends are carried outward along the collar plane's
  // screen trace (well past the neck's silhouette) and then down the neck axis, so the whole tube below the collar is
  // covered (no green wedge at the back of the neck)
  const lowN = (() => {
    const arc = ringArc(COLLAR_U - 0.032, 0.02);
    if (arc.length < 2) return '';
    const nk = neckAt(COLLAR_U - 0.032);
    const c0 = P(nk.c), c1 = P(add3(nk.c, nk.t));
    let tx = c1.x - c0.x, ty = c1.y - c0.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const A = arc[0], Z = arc[arc.length - 1];
    let ux = Z.x - A.x, uy = Z.y - A.y;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul; uy /= ul;
    const ext = 2.4 * nk.r * c0.s, down = 40 * c0.s;
    const Z1 = {x: Z.x + ux * ext, y: Z.y + uy * ext}, A1 = {x: A.x - ux * ext, y: A.y - uy * ext};
    return poly([...arc, Z1, {x: Z1.x - tx * down, y: Z1.y - ty * down}, {x: A1.x - tx * down, y: A1.y - ty * down}, A1]);
  })();
  // ---- the speculum (secondaries on the folded wing): a slim blue-violet band with white bars at its two ends only
  const specW = surfPoly(B, F, specQuad(SPEC.xa - SPEC.bar, SPEC.xb + SPEC.bar, SPEC.lo, SPEC.hi));
  const spec = surfPoly(B, F, specQuad(SPEC.xa, SPEC.xb, SPEC.lo, SPEC.hi));
  const specLo = surfPoly(B, F, specQuad(SPEC.xa, SPEC.xb, SPEC.lo, SPEC.lo + 0.27));
  // grey flank feather tips overlapping the band's lower edge, so it sits between feathers
  const specTuck = (() => {
    let d = '';
    for (let k = 0; k < 4; k++) {
      const x0 = SPEC.xa + 0.35 + k * 1.32 + 0.15 * (k % 2);
      const xy: [number, number][] = [];
      for (let m = 0; m <= 8; m++) {
        const u = m / 8;
        const dy = SPEC.lo - 0.08 + 0.22 * Math.sin(Math.PI * u);
        const x = x0 + 1.4 * u + SPEC.slant * (dy - SPEC.lo);
        xy.push([x, yFlank0(x) + dy]);
      }
      d += surfPoly(B, F, xy, 0.05) + ' ';
    }
    return d;
  })();
  // the tertials' lower edge laid over the band's top: the speculum reads as tucked under them
  const specTop = (() => {
    const xy: [number, number][] = [];
    for (let k = 0; k <= 12; k++) {
      const x0 = lerp(SPEC.xa - SPEC.bar - 0.4, SPEC.xb + SPEC.bar + 0.3, k / 12);
      const x = x0 + SPEC.slant * (SPEC.hi - SPEC.lo);
      xy.push([x, yFlank0(x) + SPEC.hi - 0.04]);
    }
    return lineOnSurf(B, F, xy, 0.06);
  })();
  // ---- bill
  const billPts = billSections.flat().map((p) => P(p));
  const bill = convexPath(billPts.map((q) => ({x: q.x, y: q.y})), 4);
  const mouth = (() => {
    const pts: V2[] = [];
    for (let k = 0; k < billSections.length - 1; k++) {
      const ring = billSections[k];
      const lo = ring[Math.round(ring.length * 0.32)];
      pts.push(P([lo[0] + (k === 0 ? 0.25 : 0), lo[1] + 0.1, lo[2] * 0.96]));
    }
    return smoothOpen(pts);
  })();
  const billTop = (() => {
    const pts: V2[] = [];
    for (let k = 1; k < billSections.length - 1; k++) {
      const ring = billSections[k];
      const tp = ring[Math.round(ring.length * 0.5) + 2];
      pts.push(P([tp[0], tp[1] - 0.12, tp[2] * 0.4]));
    }
    return smoothOpen(pts);
  })();
  // the dark nail: a cap on the bill tip (clipped to the bill)
  const bAx = norm3(sub3(BILL.tip, BILL.base));
  const nailC = add3(add3(BILL.tip, mul3(bAx, 0.55)), [0, 0.25, 0.9]);
  const nailM = planeMatrix(B, xf(F, nailC), xfv(F, bAx), xfv(F, [0, 1, 0]));
  const nostrilC = add3(add3(BILL.base, mul3(sub3(BILL.tip, BILL.base), 0.24)), [0, 0.35, 1.05]);
  const nostrilM = planeMatrix(B, xf(F, nostrilC), xfv(F, norm3(sub3(BILL.tip, BILL.base))), xfv(F, [0, 1, 0]));
  // ---- eye (fixed glass)
  const eN = norm3([(EYE_L[0] - HEAD.cranium.c[0]) / HEAD.cranium.r[0] ** 2, (EYE_L[1] - HEAD.cranium.c[1]) / HEAD.cranium.r[1] ** 2, EYE_L[2] / HEAD.cranium.r[2] ** 2]);
  const eU = norm3(cross3([0, 1, 0], eN)), eV = norm3(cross3(eN, eU));
  const eyeM = planeMatrix(B, xf(F, EYE_L), xfv(F, eU), xfv(F, eV));
  const eyeVis = dot3(xfv(F, eN), toEye(B, xf(F, EYE_L))) > 0.05;
  // ---- tail fan and curls
  const tailS = TAIL_PTS.map((p) => P(p));
  const tail = convexPath(tailS.map((q) => ({x: q.x, y: q.y})), 5);
  const tailIn = convexPath(TAIL_IN.map((p) => P(p)).map((q) => ({x: q.x, y: q.y})), 5);
  const tailRoot = P([-18.0, 6.1, 0]);
  const curls = CURLS.map((c) => ribbon(B, F, c.pts.map(([x, y]) => [x, y, c.z] as V3), c.w, c.w * 0.45));
  const curlGloss = CURLS.map((c) => smoothOpen(c.pts.slice(1, -2).map(([x, y]) => {
    const q = P([x - 0.12, y + 0.1, c.z + 0.2]);
    return {x: q.x, y: q.y};
  })));
  // primaries' edge lines
  const primLines = [0.9, 1.6].map((d) => {
    const xy: [number, number][] = [];
    for (let k = 0; k <= 10; k++) {
      const x = lerp(-10.5, -18.6, k / 10);
      xy.push([x, topY(x) - d * lerp(0.9, 0.35, k / 10)]);
    }
    return lineOnSurf(B, F, xy);
  });
  // ---- waterline foam (near half)
  const foam = HV.wlNear.length > 2 ? smoothOpen(HV.wlNear) : '';
  const headDS = 0.85 * sAt, headDH = 0.32 * sAt;
  // a region fill bled 1.25 px past its edge: inside the body's mask every region overlaps the silhouette, so no lighter
  // base shows through the anti-aliased edge
  const reg = (d: string, fill: string, opacity?: number) =>
    d ? <path d={d} fill={fill} stroke={fill} strokeWidth={BLEED_PX} vectorEffect={NS} strokeLinejoin="round" opacity={opacity} /> : null;
  return (
    <g>
      <defs>
        {/* the body's fills are composited as one layer and then masked by the silhouette (a mask, not a per-shape
            clip: the edge pixels are covered once, by the outermost region) */}
        <mask id={`${idA}m`} maskUnits="userSpaceOnUse" x={-W} y={-H} width={3 * W} height={3 * H}>
          <path d={HV.above} fill="#FFFFFF" />
        </mask>
        <clipPath id={`${idA}n`}>{neck.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={`${idA}b`}><path d={bill} /></clipPath>
        {lowN && <clipPath id={`${idA}l`}><path d={lowN} /></clipPath>}
        {wlUp && <clipPath id={`${idA}y`}><path d={wlUp} /></clipPath>}
      </defs>
      {/* tail fan behind the stern */}
      <path d={tail} fill={K.tail} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      {tailIn && <path d={tailIn} fill={K.tailMid} />}
      <path
        d={tailS.slice(1, -1).filter((_, i) => i === 2 || i === 4).map((q) => `M${P2(tailRoot)} L${P2(q)}`).join(' ')}
        stroke={K.tailLine} strokeWidth={LINE_PX} vectorEffect={NS} fill="none" opacity={0.7}
      />
      {/* the drake curl: one small upturned black feather on the tail's root */}
      {curls.map((d, i) => <path key={`c${i}`} d={d} fill={K.curl} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />)}
      {curlGloss.map((d, i) => <path key={`g${i}`} d={d} fill="none" stroke={K.curlGloss} strokeWidth={LINE_PX * 1.2} vectorEffect={NS} strokeLinecap="round" opacity={0.85} />)}
      {/* one ink line round body and neck/head: stroke under, fills over */}
      <g clipPath={yUp}>
        {neck.map((d, i) => <path key={i} d={d} fill="none" stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} strokeLinejoin="round" />)}
      </g>
      <path d={HV.above} fill="none" stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} strokeLinejoin="round" />
      {/* head and neck: one iridescent green form (green above the collar, chestnut below), above the water only */}
      <g clipPath={yUp}>
        <Cel paths={neck} base={K.head} shadow={K.headShadow} sheen={K.headSheen} dS={headDS} dH={headDH} />
        <g clipPath={`url(#${idA}n)`}>
          {lowN && <path d={lowN} fill={K.breast} />}
          {collar && <path d={collar} fill={C.duckCollar} />}
          {collar && <path d={collar} fill="none" stroke="#C9C8BF" strokeWidth={LINE_PX * 0.7} vectorEffect={NS} opacity={0.7} />}
        </g>
      </g>
      {/* body */}
      <g mask={`url(#${idA}m)`}>
        {reg(HV.above, K.flank)}
        <g fillRule="evenodd">
          <path d={verm.join(' ')} fill="none" stroke={K.vermic} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} opacity={0.28} />
          {reg(R.upper, K.upper)}
          {reg(R.mantle, K.mantle)}
          {reg(R.prim, K.primary)}
          {reg(R.vent, K.vent)}
          {reg(R.stern, K.stern)}
          <path d={primLines.join(' ')} fill="none" stroke={K.primaryEdge} strokeWidth={LINE_PX} vectorEffect={NS} opacity={0.6} strokeLinecap="round" />
          <path d={tert.join(' ') + ' ' + scal.join(' ')} fill="none" stroke={K.tertialLine} strokeWidth={LINE_PX} vectorEffect={NS} opacity={0.55} strokeLinecap="round" />
          {spec && <path d={specW} fill={K.specW} />}
          {spec && <path d={spec} fill={K.spec} />}
          {spec && <path d={specLo} fill={K.specDeep} />}
          {spec && <path d={specTuck} fill={K.flank} />}
          {spec && <path d={specTop} fill="none" stroke={K.tertialLine} strokeWidth={LINE_PX * 1.2} vectorEffect={NS} strokeLinecap="round" opacity={0.85} />}
          {reg(R.breast, K.breast)}
          {reg(R.shadow, INK, 0.2)}
          {reg(R.core, INK, 0.13)}
          {reg(R.hi, '#FFFFFF', 0.14)}
        </g>
      </g>
      {/* the body's edge crosses the chestnut lower neck: restate the chestnut along it (no anti-aliased grey seam) */}
      {lowN && (
        <g clipPath={yUp}>
          <g clipPath={`url(#${idA}n)`}>
            <g clipPath={`url(#${idA}l)`}>
              <path d={HV.above} fill="none" stroke={K.breast} strokeWidth={3.2} vectorEffect={NS} />
            </g>
          </g>
        </g>
      )}
      {/* bill */}
      <Cel paths={[bill]} base={K.bill} shadow={K.billShadow} sheen={K.billSheen} dS={0.5 * sAt} dH={0.22 * sAt} />
      <path d={bill} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
      <path d={mouth} fill="none" stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} strokeLinecap="round" opacity={0.8} />
      <path d={billTop} fill="none" stroke="#FFF6CC" strokeWidth={LINE_PX * 1.6} vectorEffect={NS} strokeLinecap="round" opacity={0.55} />
      <g clipPath={`url(#${idA}b)`}>
        <g transform={nailM}>
          <ellipse cx={0} cy={0} rx={0.85} ry={0.62} fill={K.nail} />
        </g>
      </g>
      <g transform={nostrilM}>
        <ellipse cx={0} cy={0} rx={0.42} ry={0.16} fill={INK} opacity={0.75} />
      </g>
      {/* glass eye: fixed, glossy */}
      {eyeVis && (
        <g transform={eyeM}>
          <circle r={EYE_R} fill={K.eye} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
          <circle r={EYE_R * 0.55} cx={0.05} cy={-0.04} fill={K.eyeDeep} />
          <circle r={EYE_R * 0.3} cx={-0.2} cy={0.2} fill="#FFFFFF" opacity={0.92} />
          <circle r={EYE_R * 0.12} cx={0.22} cy={-0.2} fill="#FFFFFF" opacity={0.6} />
        </g>
      )}
      {/* small gloss on the crown */}
      {(() => {
        const g = P([16.2, 22.2, 1.2]);
        return <ellipse cx={g.x} cy={g.y} rx={0.95 * g.s} ry={0.42 * g.s} transform={`rotate(-14 ${fx(g.x)} ${fx(g.y)})`} fill="#FFFFFF" opacity={0.42} />;
      })()}
      {/* waterline contact */}
      {foam && <path d={foam} fill="none" stroke="#FFFFFF" strokeWidth={5} vectorEffect={NS} strokeLinecap="round" opacity={0.22} />}
      {foam && <path d={foam} fill="none" stroke="#F4FBFA" strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={0.85} />}
    </g>
  );
};

/** the duck's reflection on the water (surface views): mirrored silhouettes, broken by ripple bands */
const Reflection: React.FC<{B: Basis; F: Frame; HV: HullView; t: number; alpha: number}> = ({B, F, HV, t, alpha}) => {
  if (alpha < 0.02) return null;
  const id = uid('dkr');
  const M: Frame = {o: [F.o[0], -F.o[1], F.o[2]], ex: [F.ex[0], -F.ex[1], F.ex[2]], ey: [F.ey[0], -F.ey[1], F.ey[2]], ez: [F.ez[0], -F.ez[1], F.ez[2]]};
  const pts: V2[] = [];
  for (const s of HV.S) {
    if (s.w[1] >= 0) {
      const q = proj(B, [s.w[0], -s.w[1], s.w[2]]);
      pts.push({x: q.x, y: q.y});
    }
  }
  for (const p of HV.wlLocal) {
    const w = xf(F, p);
    const q = proj(B, [w[0], -w[1], w[2]]);
    pts.push({x: q.x, y: q.y});
  }
  const body = convexPath(pts, 12);
  const neckHead = neckHeadPaths(B, M);
  const bill = convexPath(billSections.flat().map((p) => {
    const q = proj(B, xf(M, p));
    return {x: q.x, y: q.y};
  }), 6);
  const brX = proj(B, xf(M, [xBreast(4), 4, 8])).x;
  const wl = proj(B, xf(F, [0, 0, 0]));
  const hd = proj(B, xf(M, HEAD.cranium.c));
  const x0 = Math.min(...pts.map((p) => p.x), hd.x) - 60, x1 = Math.max(...pts.map((p) => p.x), hd.x) + 120;
  const y0 = wl.y - 8, y1 = hd.y + 6 * hd.s;
  const sc = wl.s;
  const span = Math.max(1, y1 - y0);
  // ripple bands: rows that get taller and open wider gaps with depth below the waterline; each row is broken into
  // tapered dashes at hashed gaps (laid out along the duck, drifting slowly), and each row's slice of the mirrored image
  // wobbles sideways with its own phase; the whole reflection fades with depth (mask)
  const drift = 0.6 * sc * t;
  const bands: {d: string; dx: number}[] = [];
  let y = y0, k = 0;
  while (y < y1 && k < 60) {
    const q = clamp((y - y0) / span);
    const hgt = (0.42 + 0.75 * q) * sc * (0.8 + 0.4 * hash(k * 1.7 + 0.3));
    const gap = 1.2 + (0.06 + 0.6 * q * q) * sc * (0.6 + 0.8 * hash(k * 2.9 + 1.1));
    const wa = 0.11 * sc, wb = 0.13 * sc;
    const yT = (x: number) => y + wa * Math.sin(x / (1.9 * sc) + t * 3.1 + k * 0.9);
    const yB = (x: number) => y + hgt + wb * Math.sin(x / (1.55 * sc) - t * 2.6 + k * 1.3);
    let d = '';
    let r = -70 * sc, m = 0;
    while (m < 80) {
      const segL = lerp(15, 3.5, q) * sc * (0.5 + hash(k * 7.3 + m * 1.9));
      const gapL = (0.25 + 1.9 * q) * sc * (0.25 + hash(k * 3.1 + m * 5.7));
      const xa = wl.x + r - drift, xb = xa + segL;
      r += segL + gapL;
      m++;
      if (xb < x0) continue;
      if (xa > x1) break;
      const n = Math.max(4, Math.min(16, Math.round(segL / 10)));
      const top: V2[] = [], bot: V2[] = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = lerp(xa, xb, u);
        const env = Math.pow(Math.sin(Math.PI * u), 0.45);
        const t0 = yT(x), b0 = yB(x), mid = (t0 + b0) / 2;
        top.push({x, y: mid - (mid - t0) * env});
        bot.push({x, y: mid + (b0 - mid) * env});
      }
      d += poly([...top, ...bot.reverse()]) + ' ';
    }
    const dx = (0.06 + 0.45 * q) * sc * Math.sin(t * (2.0 + 0.9 * hash(k * 5.3)) + k * 2.1);
    if (d) bands.push({d, dx});
    y += hgt + gap;
    k++;
  }
  return (
    <g opacity={alpha}>
      <defs>
        <clipPath id={`${id}b`}><rect x={brX} y={-H} width={W * 2} height={H * 3} /></clipPath>
        <g id={`${id}s`}>
          {neckHead.map((d, i) => <path key={i} d={d} fill="#1E4B42" />)}
          <path d={bill} fill="#9C8E45" />
          <path d={body} fill="#7D8986" />
          <g clipPath={`url(#${id}b)`}><path d={body} fill="#5B4038" /></g>
        </g>
        {bands.map((b, i) => <clipPath key={i} id={`${id}c${i}`}><path d={b.d} /></clipPath>)}
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          <stop offset={0} stopColor="#FFFFFF" />
          <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0.8} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0.12} />
        </linearGradient>
        <mask id={`${id}f`} maskUnits="userSpaceOnUse" x={x0 - 300} y={y0 - 60} width={x1 - x0 + 600} height={span + 120}>
          <rect x={x0 - 300} y={y0 - 60} width={x1 - x0 + 600} height={span + 120} fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}f)`}>
        {bands.map((b, i) => (
          <g key={i} clipPath={`url(#${id}c${i})`}>
            <use href={`#${id}s`} transform={`translate(${fx(b.dx)},0)`} />
          </g>
        ))}
      </g>
    </g>
  );
};

/** wake: a small V from the breast, transverse crests behind, and rings left by the paddle strokes */
const Wake: React.FC<{B: Basis; F: Frame; o: V3; t: number; amt: number; v: number}> = ({B, o, t, amt, v}) => {
  if (amt < 0.02) return null;
  const P = (x: number, z: number) => proj(B, [o[0] + x, 0, o[2] + z]);
  const half = 19.5 * R2;
  let light = '', dark = '', light2 = '', arms = '';
  // the V starts at the breast's two waterline sides and diverges at the Kelvin half-angle, so both arms show from
  // the bow backwards (outside the hull's own waterline)
  const XB = 12.5;
  const ZB = Math.max(0, zAt(XB, 0));
  const armZ = (sdist: number) => ZB + sdist * Math.sin(half) + 0.04 * sdist;
  for (const side of [1, -1]) {
    // a soft continuous arm line
    const pts: V2[] = [];
    for (let i = 0; i <= 10; i++) {
      const sd = 1 + i * 5.2;
      const q = P(XB - sd * Math.cos(half), side * (armZ(sd) + 0.5));
      pts.push({x: q.x, y: q.y});
    }
    arms += smoothOpen(pts) + ' ';
    for (let k = 0; k < 8; k++) {
      const sdist = 2.5 + k * 6.8;
      const fade = 1 - k / 8;
      const cx = XB - sdist * Math.cos(half), cz = side * armZ(sdist);
      // short oblique crests (diverging waves), ~55 deg to the path
      const len = (3.2 + 0.55 * k) * (0.9 + 0.12 * Math.sin(t * 5 + k * 1.3));
      const dx = -Math.cos(55 * R2) * len, dz = side * Math.sin(55 * R2) * len;
      const a = P(cx - dx * 0.5, cz - dz * 0.5), b = P(cx + dx * 0.5, cz + dz * 0.5);
      const m = P(cx + 0.6, cz + side * 0.2);
      const seg = `M${P2(a)} Q${P2(m)} ${P2(b)} `;
      if (fade > 0.45) light += seg; else light2 += seg;
      const a2 = P(cx - dx * 0.5 - 1.4, cz - dz * 0.5), b2 = P(cx + dx * 0.5 - 1.4, cz + dz * 0.5);
      dark += `M${P2(a2)} L${P2(b2)} `;
    }
  }
  // transverse crests behind the stern
  for (let k = 0; k < 3; k++) {
    const xb = -21 - k * 9;
    const span = 3.5 + k * 2.8;
    const pts: V2[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = -1 + (2 * i) / 8;
      const q = P(xb + 2.2 * (1 - u * u), u * span);
      pts.push({x: q.x, y: q.y});
    }
    (k === 0 ? (light += smoothOpen(pts) + ' ') : (light2 += smoothOpen(pts) + ' '));
  }
  // paddle rings: one per stroke (two per crank turn), left behind as the duck moves on
  let rings = '';
  const ringOps: number[] = [];
  // a ring starts at the middle of each power stroke: the near foot's at crank angle PHI_POWER, the far foot's half a
  // turn earlier
  const w = 2 * Math.PI * PADDLE_HZ;
  const phi0 = PHI_POWER - Math.PI;
  const n0 = Math.floor((duckCrank(t) - phi0) / Math.PI);
  for (let k = 0; k < 4; k++) {
    const n = n0 - k;
    const te = t - (duckCrank(t) - (phi0 + n * Math.PI)) / w;
    const age = t - te;
    if (age < 0 || age > 1.9) continue;
    const xe = -8 - v * age;
    const ze = (((n % 2) + 2) % 2 === 0 ? -1 : 1) * 3.6;
    const r = 3 + 11 * age;
    const pts: V2[] = [];
    for (let i = 0; i < 24; i++) {
      const th = (i / 24) * Math.PI * 2;
      const q = P(xe + r * Math.cos(th), ze + r * 0.92 * Math.sin(th));
      pts.push({x: q.x, y: q.y});
    }
    rings += smoothClosed(pts) + ' ';
    ringOps.push(1 - age / 1.9);
  }
  const ringA = ringOps.length ? ringOps.reduce((a, b) => a + b, 0) / ringOps.length : 0;
  // bow cushion: a pale crescent of disturbed water at the breast
  const bow: V2[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = -1 + (2 * i) / 10;
    const q = P(18.6 - 4.2 * u * u, u * 6.2);
    bow.push({x: q.x, y: q.y});
  }
  return (
    <g opacity={amt} fill="none" strokeLinecap="round" vectorEffect={NS}>
      <path d={dark} stroke={K.uwDeep} strokeWidth={2.2} vectorEffect={NS} opacity={0.22} />
      <path d={arms} stroke="#FFFFFF" strokeWidth={1.6} vectorEffect={NS} opacity={0.42} />
      <path d={rings} stroke="#FFFFFF" strokeWidth={1.5} vectorEffect={NS} opacity={0.4 * ringA} />
      <path d={light2} stroke="#FFFFFF" strokeWidth={2.0} vectorEffect={NS} opacity={0.5} />
      <path d={light} stroke="#FFFFFF" strokeWidth={2.8} vectorEffect={NS} opacity={0.75} />
      <path d={smoothOpen(bow)} stroke="#FFFFFF" strokeWidth={3} vectorEffect={NS} opacity={0.5} />
    </g>
  );
};

/** below the waterline: submerged hull with the cutaway, the printed module, pushrods, legs and paddling feet */
const BelowWater: React.FC<{B: Basis; F: Frame; HV: HullView; t: number; cut: number}> = ({B, F, HV, t, cut}) => {
  const uw = pondSplit(B);
  // shown only below the frame's waterline (the wipe), where the underwater view is opaque: no double exposure
  const ua = ss(cut, 0, 0.3);
  if (ua < 0.01 || uw < 0.01) return null;
  const open = ss(cut, 0.22, 0.85);
  const id = uid('dkb');
  const P = (p: V3) => proj(B, xf(F, p));
  const tw = (c: string, k = 0.24) => mix(c, K.uw, Math.min(0.85, k + 0.45 * (1 - uw)));
  const s0 = P([-2, -3, 3]).s;
  // ---- hull exterior regions (tinted)
  const R = {
    belly: hullRegion(HV, F_BELLY),
    stern: hullRegion(HV, F_STERN),
    breast: hullRegion(HV, F_BREAST),
    shadow: hullRegion(HV, F_SHADOW),
    core: hullRegion(HV, F_CORE),
  };
  // ---- the cutaway window (near flank, below the waterline), following the keel; a band of skin stays below it
  const WXc = -2.2, WA = 10.4;
  const winF = (s: HS) => {
    const x = s.l[0], y = s.l[1];
    const lo = keelY(x) + 0.75, hi = -0.45;
    const ym = (lo + hi) / 2, hh = Math.max(0.2, (hi - lo) / 2);
    const k = Math.max(0.02, open);
    const u = (x - WXc) / (WA * k), v = (y - ym) / (hh * k);
    return Math.min((1 - u ** 4 - v ** 4) * 4, s.l[2] * 2);
  };
  const win = open > 0.03 ? hullRegion(HV, winF) : '';
  // a region fill bled past its edge (inside the hull's mask; see AboveWater)
  const reg = (d: string, fill: string, opacity?: number) =>
    d ? <path d={d} fill={fill} stroke={fill} strokeWidth={BLEED_PX} vectorEffect={NS} strokeLinejoin="round" opacity={opacity} /> : null;
  // ---- legs
  const phiN = duckCrank(t);
  const legs = [legGeo(1, phiN), legGeo(-1, phiN + Math.PI)];
  const rimPx = 0.42 * s0;
  const capsule = (a: V3, b: V3, ra: number, rb: number) => {
    const A = P(a), Bq = P(b);
    return capsule2(A, Bq, ra * A.s, rb * Bq.s);
  };
  /** a thin gloss line along a rod (a -> b), offset toward the light, its ends trimmed */
  const gloss = (a: V3, b: V3, off: number) => {
    const A = P(a), Bq = P(b);
    let nx = -(Bq.y - A.y), ny = Bq.x - A.x;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl; ny /= nl;
    if (nx * LD.x + ny * LD.y < 0) { nx = -nx; ny = -ny; }
    const o = off * (A.s + Bq.s) / 2;
    const p0 = {x: lerp(A.x, Bq.x, 0.12) + nx * o, y: lerp(A.y, Bq.y, 0.12) + ny * o};
    const p1 = {x: lerp(A.x, Bq.x, 0.88) + nx * o, y: lerp(A.y, Bq.y, 0.88) + ny * o};
    return `M${P2(p0)} L${P2(p1)}`;
  };
  /** one foot: a single outline that MORPHS (point for point) from the folded leaf (recovery) to the spread web (power
   *  stroke) as g.pw ramps at each reversal; the toes morph from the leaf's creases. No cross-fade, no one-frame flip. */
  const Foot: React.FC<{g: LegG}> = ({g}) => {
    const K0 = P(g.ankle);
    const T = g.tips.map(P), N = g.notch.map(P), Hl = P(g.heel);
    const e = g.pw;
    // which face do we see? dorsal normal = -(D x E) for the near-foot convention; the tone turns continuously as the
    // web swings through edge-on
    const nD = mul3(cross3(g.D, g.E), -g.side);
    const fd = dot3(xfv(F, nD), toEye(B, xf(F, g.ankle))) * g.side;
    const webTone = mix(K.footSole, K.footWeb, ss(fd, -0.2, 0.2));
    // the folded leaf: a tapered closed web along the middle toe, laid out in screen space so it keeps its width
    // (>= ~0.9 cm at mid) from any view
    const A = K0, Z = T[1];
    const dx = Z.x - A.x, dy = Z.y - A.y;
    const Ll = Math.hypot(dx, dy) || 1;
    const nx = -dy / Ll, ny = dx / Ll;
    const sc = (A.s + Z.s) / 2;
    const hw = (u: number) => Math.max(0.17 * (1 - u), 0.47 * Math.pow(Math.sin(Math.PI * clamp(u)), 0.85)) * sc;
    const at = (u: number, w: number): V2 => ({x: A.x + dx * u + nx * w, y: A.y + dy * u + ny * w});
    // the web's side carrying toe 2 goes to the leaf's +n side if that is where it lies
    const off = (q: V2) => (q.x - A.x) * nx + (q.y - A.y) * ny;
    const sg = off(T[2]) >= off(T[0]) ? 1 : -1;
    const lerpP = (a: V2, b: V2, u: number): V2 => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
    const quad = (a: V2, c: V2, b: V2, u: number): V2 => ({
      x: (1 - u) ** 2 * a.x + 2 * u * (1 - u) * c.x + u * u * b.x,
      y: (1 - u) ** 2 * a.y + 2 * u * (1 - u) * c.y + u * u * b.y,
    });
    // matching point lists: heel/base, side (toe 2), tip (middle toe), side (toe 0), back to the heel
    const n1 = 9, n2 = 7, UA = 0.8;
    const leafP: V2[] = [A], webP: V2[] = [Hl];
    for (let i = 1; i <= n1; i++) { leafP.push(at((UA * i) / n1, sg * hw((UA * i) / n1))); webP.push(lerpP(Hl, T[2], i / n1)); }
    for (let j = 1; j < n2; j++) { const u = UA + ((1 - UA) * j) / n2; leafP.push(at(u, sg * hw(u))); webP.push(quad(T[2], N[1], T[1], j / n2)); }
    leafP.push(at(1, 0)); webP.push(T[1]);
    for (let j = 1; j < n2; j++) { const u = 1 - ((1 - UA) * j) / n2; leafP.push(at(u, -sg * hw(u))); webP.push(quad(T[1], N[0], T[0], j / n2)); }
    for (let i = 0; i < n1; i++) { const u = UA * (1 - i / n1); leafP.push(at(u, -sg * hw(u))); webP.push(lerpP(T[0], Hl, i / n1)); }
    const outline = poly(leafP.map((p, i) => lerpP(p, webP[i], e)));
    // toes: from the leaf's two creases and its centre line (folded) to the three toes (spread)
    const toes = [0, 1, 2].map((i) => {
      const pts: V2[] = [];
      for (let k = 0; k <= 6; k++) {
        const u = 0.14 + (0.86 * k) / 6;
        const lf = i === 1 ? at(u * 0.93, 0) : at(u * UA, (i === 2 ? sg : -sg) * 0.42 * hw(u * UA));
        pts.push(lerpP(lf, lerpP(K0, T[i], u), e));
      }
      return pts;
    });
    const toeD = toes.map((p) => smoothOpen(p)).join(' ');
    const toeW = lerp(LINE_PX, 0.3 * sc, e);
    const tips = toes.map((p) => p[p.length - 1]);
    return (
      <g>
        <path d={capsule(g.exit, g.ankle, 0.42, 0.34)} fill={tw(K.foot)} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} />
        <path d={outline} fill={tw(mix(K.footWeb, webTone, e))} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
        {e > 0.02 && <path d={toeD} fill="none" stroke={INK} strokeWidth={toeW + 1.2} vectorEffect={NS} strokeLinecap="round" opacity={0.9 * e} />}
        <path d={toeD} fill="none" stroke={tw(mix(K.footCrease, K.footLit, e))} strokeWidth={toeW} vectorEffect={NS} strokeLinecap="round" />
        {e > 0.05 && tips.map((q, i) => <circle key={`k${i}`} cx={q.x} cy={q.y} r={0.16 * sc * e} fill={K.claw} />)}
        <circle cx={K0.x} cy={K0.y} r={0.4 * K0.s} fill={tw(K.foot)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
      </g>
    );
  };
  // the linkage: moving parts (crank, pushrod, rocker) in dark steel, fixed parts (module, bracket) in light print.
  // The FAR set (behind the module, seen through the open shell) recedes: tinted toward the inner shell, thin light
  // ink, no highlights, so it never tangles with the near set
  const Linkage: React.FC<{g: LegG; far?: boolean}> = ({g, far}) => {
    const col = (c: string) => (far ? tw(mix(c, K.innerShell, 0.62), 0.2) : tw(c, 0.12));
    const ink = far ? LINE_PX * 0.6 : INK_PX;
    const io = far ? 0.6 : 1;
    const sd = g.side;
    const pin = P(g.pin), lev = P(g.lever), hip = P(g.hip), cr = P(g.crank0);
    const zb = sd * LEG.zBracket;
    const hx = LEG.hip[0], hy = LEG.hip[1];
    // printed bracket: a sole on the inner shell's floor and a post rising from behind to the hip pivot (clear of the
    // leg's swing and of the pushrod's sweep)
    const br = [
      capsule([hx + 0.5, -4.85, zb], [hx - 2.3, -4.85, zb], 0.42, 0.42),
      capsule([hx - 1.5, -4.85, zb], [hx, hy, zb], 0.42, 0.55),
    ];
    const acc = P(add3(g.crank0, mul3(sub3(g.pin, g.crank0), 0.52)));
    const st = {stroke: INK, strokeWidth: ink, strokeOpacity: io, vectorEffect: NS} as const;
    return (
      <g>
        <g>
          {br.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke={INK} strokeWidth={far ? ink * 2 : LINE_PX * 2} strokeOpacity={io} vectorEffect={NS} />)}
          {br.map((d, i) => <path key={`f${i}`} d={d} fill={col(K.printedSide)} />)}
        </g>
        {/* the leg's upper end inside the hull, and its rocker (the leg's own extension above the hip) */}
        <path d={capsule(g.hip, g.exit, 0.45, 0.42)} fill={col(K.foot)} {...st} />
        <path d={capsule(g.hip, g.lever, 0.44, 0.34)} fill={col(K.steel)} {...st} strokeLinejoin="round" />
        {!far && <path d={gloss(g.hip, g.lever, 0.16)} stroke={K.steelLit} strokeWidth={1.3} vectorEffect={NS} strokeLinecap="round" opacity={0.75} />}
        {/* crank arm on the output shaft */}
        <path d={capsule(g.crank0, g.pin, 0.52, 0.42)} fill={col(K.steel)} {...st} strokeLinejoin="round" />
        {!far && <path d={gloss(g.crank0, g.pin, 0.2)} stroke={K.steelLit} strokeWidth={1.3} vectorEffect={NS} strokeLinecap="round" opacity={0.75} />}
        {!far && <circle cx={cr.x} cy={cr.y} r={0.24 * cr.s} fill={col(K.steelLit)} stroke={INK} strokeWidth={LINE_PX * 0.7} vectorEffect={NS} />}
        {!far && <circle cx={acc.x} cy={acc.y} r={0.2 * acc.s} fill={C.accent} />}
        {/* pushrod */}
        <path d={capsule(g.pin, g.lever, 0.3, 0.3)} fill={col(K.steel)} {...st} />
        {!far && <path d={gloss(g.pin, g.lever, 0.1)} stroke={K.steelLit} strokeWidth={1.2} vectorEffect={NS} strokeLinecap="round" opacity={0.7} />}
        {/* pin eyes */}
        {[pin, lev].map((q, i) => (
          <g key={`e${i}`}>
            <circle cx={q.x} cy={q.y} r={0.45 * q.s} fill={col(K.steel)} {...st} />
            {!far && <circle cx={q.x} cy={q.y} r={0.17 * q.s} fill={col(K.steelLit)} />}
          </g>
        ))}
        {/* hip pivot boss */}
        <circle cx={hip.x} cy={hip.y} r={0.42 * hip.s} fill={col(K.printed)} {...st} />
        <circle cx={hip.x} cy={hip.y} r={0.15 * hip.s} fill={col(K.axle)} />
      </g>
    );
  };
  // ---- the module (a rounded box, extruded along z)
  const prof: [number, number][] = [];
  {
    const {x0, x1, y0, y1, r} = MODULE;
    const corners: [number, number, number][] = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180], [x1 - r, y0 + r, 270]];
    for (const [cx, cy, a0] of corners) for (let k = 0; k <= 5; k++) {
      const a = (a0 + (90 * k) / 5) * R2;
      prof.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  const modNear = prof.map(([x, y]) => P([x, y, MODULE.z]));
  const modFar = prof.map(([x, y]) => P([x, y, -MODULE.z]));
  const modSil = convexPath([...modNear, ...modFar].map((q) => ({x: q.x, y: q.y})), 6);
  const modFace = smoothClosed(modNear.map((q) => ({x: q.x, y: q.y})), 1 / 10);
  const faceM = planeMatrix(B, xf(F, [0, 0, MODULE.z]), F.ex, F.ey);
  const coverM = planeMatrix(B, xf(F, [0, 0, COVER.z]), F.ex, F.ey);
  const {x0, x1, y0, y1} = MODULE;
  const layers: string[] = [];
  for (let k = 1; k < 7; k++) layers.push(`M${x0 + 0.5},${fx(y0 + k * 0.37)} L${x1 - 0.5},${fx(y0 + k * 0.37)}`);
  const cov = (() => {
    const [ax, ay] = COVER.a, [bx, by] = COVER.b;
    return capsule2({x: ax, y: ay}, {x: bx, y: by}, COVER.r, COVER.r * 0.92);
  })();
  // ---- inner surface light: a gradient across the window (dark under the top lip)
  const wTop = P([WXc, -0.5, 6]), wBot = P([WXc, keelY(WXc) + 0.75, 5]);
  const tint = 0.2;
  return (
    <g opacity={ua}>
      <defs>
        <clipPath id={`${id}e`}><path d={underClipD(B, t)} /></clipPath>
        <mask id={`${id}h`} maskUnits="userSpaceOnUse" x={-W} y={-H} width={3 * W} height={3 * H}>
          <path d={HV.below} fill="#FFFFFF" />
        </mask>
        <clipPath id={`${id}w`}><path d={win} /></clipPath>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={wTop.x} y1={wTop.y} x2={wBot.x} y2={wBot.y}>
          <stop offset={0} stopColor={tw(mix(K.innerShell, INK, 0.45), tint)} />
          <stop offset={0.35} stopColor={tw(K.innerShell, tint)} />
          <stop offset={1} stopColor={tw(K.innerShellLit, tint)} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}e)`}>
        {/* far leg and foot (behind the hull) */}
        <Foot g={legs[1]} />
        {/* submerged hull, tinted by the water */}
        <path d={HV.below} fill="none" stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} strokeLinejoin="round" />
        <g mask={`url(#${id}h)`}>
          {reg(HV.below, tw(K.flank))}
          <g fillRule="evenodd">
            {reg(R.belly, tw(K.belly))}
            {reg(R.stern, tw(K.stern))}
            {reg(R.breast, tw(K.breast))}
            {reg(R.shadow, INK, 0.2)}
            {reg(R.core, INK, 0.12)}
          </g>
          {/* the cutaway: inside the preserved skin, the printed drive */}
          {win && (
            <g clipPath={`url(#${id}w)`}>
              <path d={win} fill={`url(#${id}g)`} />
              <Linkage g={legs[1]} far />
              <path d={modSil} fill={tw(K.printedSide, tint)} stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
              <path d={modFace} fill={tw(K.printed, tint)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} strokeLinejoin="round" />
              <g transform={faceM}>
                <path d={layers.join(' ')} stroke={tw(K.printedLine, tint)} strokeWidth={0.7} vectorEffect={NS} opacity={0.35} />
                <rect x={x0 + 0.38} y={y0 + 0.38} width={x1 - x0 - 0.76} height={y1 - y0 - 0.76} rx={0.6} fill="none" stroke={tw(K.printedLine, tint)} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
                {[[x0 + 0.72, y0 + 0.72], [x1 - 0.72, y0 + 0.72], [x0 + 0.72, y1 - 0.72], [x1 - 0.72, y1 - 0.72]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={0.16} fill={tw('#7F939A', tint)} />
                ))}
              </g>
              <g transform={coverM}>
                <path d={cov} transform="translate(0.1,-0.12)" fill={tw(K.printedSide, tint)} />
                <path d={cov} fill={tw(lit(K.printed, 0.3), tint)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
                <circle cx={COVER.a[0]} cy={COVER.a[1]} r={0.74} fill={tw(K.printedSide, tint)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
                <circle cx={COVER.a[0] - 0.06} cy={COVER.a[1] + 0.06} r={0.54} fill={tw(K.printed, tint)} />
                <circle cx={COVER.a[0]} cy={COVER.a[1]} r={0.16} fill={tw(K.printedLine, tint)} />
                <circle cx={COVER.b[0]} cy={COVER.b[1]} r={0.72} fill={tw(K.printedSide, tint)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
              </g>
              <Linkage g={legs[0]} />
            </g>
          )}
        </g>
        {win && (
          <g>
            <g clipPath={`url(#${id}w)`}>
              <path d={win} fill="none" stroke={INK} strokeWidth={rimPx * 2 + 2.2} opacity={0.9} />
              <path d={win} fill="none" stroke={tw(K.rim, 0.12)} strokeWidth={rimPx * 2} />
            </g>
            <path d={win} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
          </g>
        )}
        {/* near leg and foot (outside the hull, in front) */}
        <Foot g={legs[0]} />
      </g>
    </g>
  );
};

// ================================================================ Duck
export type DuckLook = {
  /** 0..1 below-water schematic: the submerged hull, the cutaway window with the printed drive, legs and feet */
  cut?: number;
  /** 0..1 wake strength (V wake, crests, paddle rings) */
  wake?: number;
  /** swimming speed (cm/s) used to place the paddle rings left behind (default SWIM_V) */
  speed?: number;
};
/** a preserved mallard drake robot floating at the waterline y = 0 at o, swimming +x. Draw it between
 *  <Pond layer="under"/> and <Pond layer="surface"/>. */
export const Duck: React.FC<{B: Basis; t: number; o: V3; look?: DuckLook}> = ({B, t, o, look}) => {
  const cut = clamp(look?.cut ?? 0);
  const wake = clamp(look?.wake ?? 1);
  const v = look?.speed ?? SWIM_V;
  const F = duckFrame(o, t);
  const HV = buildHull(B, F);
  const gr = grazing(B, o);
  const surfVis = ss(gr, 0.6, 3.5);
  return (
    <g>
      <OnSurface B={B} t={t}>
        <Reflection B={B} F={F} HV={HV} t={t} alpha={0.5 * surfVis} />
        <Wake B={B} F={F} o={o} t={t} amt={wake * surfVis} v={v} />
      </OnSurface>
      <BelowWater B={B} F={F} HV={HV} t={t} cut={cut} />
      <AboveWater B={B} F={F} HV={HV} t={t} />
    </g>
  );
};

// ================================================================ Pond
const BANK_Z = -1100;
const FLOOR_Y = -55;
const TREE_Z = -6000;
const CLOUD_Z = -20000;
const PC = {
  skyTop: '#93C8E0',
  skyLow: '#E6F0E6',
  cloud: '#FFFFFF',
  treeFar: '#B4CDBE',
  tree: '#93B5A1',
  bank: '#5B5A3A',
  bankLit: '#8E9259',
  reed: ['#6F8B45', '#8AA656', '#52692F'],
  mass: '#5E7A40',
  massFar: '#86A070',
  reedRefl: '#3F5A3A',
  cattail: '#6E4B2E',
  waterTop: '#86B9BD',
  waterMid: '#5C9EAD',
  waterLow: '#2F6E80',
  pad: '#5D8E45',
  padLit: '#8DBB62',
  padDeep: '#3F6A30',
  uwTop: '#6FB2B4',
  uwMid: '#2F7D8B',
  uwLow: '#164E5E',
  floor: '#A99F7B',
  weed: '#4F7E52',
  weedNear: '#4C8150',
  pebble: ['#8C8676', '#74766B', '#9A8F78', '#6A6C63'],
  mote: '#DDF4EF',
};
/** world x where the ray through screen (sx, sy) meets the plane z = const */
const xAtScreen = (B: Basis, sx: number, sy: number, z: number) => {
  const p = unproj(B, sx, sy, 100);
  const d = sub3(p, B.eye);
  const tt = (z - B.eye[2]) / (d[2] || 1e-6);
  return B.eye[0] + d[0] * tt;
};
const visX = (B: Basis, y: number, z: number, m = 160): [number, number] => {
  const sy = proj(B, [B.eye[0], y, z]).y;
  const a = xAtScreen(B, -m, sy, z), b = xAtScreen(B, W + m, sy, z);
  return [Math.min(a, b), Math.max(a, b)];
};
/** the screen line of a world line (y, z) along x: two points, extended across the frame */
const lineAcross = (B: Basis, y: number, z: number): [V2, V2] => {
  const [xa, xb] = visX(B, y, z, 400);
  const a = proj(B, [xa, y, z]), b = proj(B, [xb, y, z]);
  return [{x: a.x, y: a.y}, {x: b.x, y: b.y}];
};
const yOnLine = (l: [V2, V2], x: number) => l[0].y + ((x - l[0].x) * (l[1].y - l[0].y)) / (l[1].x - l[0].x || 1);

const blade = (B: Basis, base: V3, h: number, lean: number, wb: number, mirror = false, frac = 1) => {
  const n = 5;
  const C: SP[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * frac;
    const p: V3 = [base[0] + lean * h * u * u, base[1] + h * u, base[2]];
    C.push(proj(B, mirror ? [p[0], -p[1], p[2]] : p));
  }
  const L: V2[] = [], R: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const u = (i / n) * frac;
    const w = (wb * Math.pow(Math.max(0, 1 - u), 0.85) * C[i].s) / 2 + 0.25;
    L.push({x: C[i].x - ty * w, y: C[i].y + tx * w});
    R.push({x: C[i].x + ty * w, y: C[i].y - tx * w});
  }
  return poly([...L, ...R.reverse()]) + ' ';
};

type Reeds = {tone: string[]; refl: string; stalks: string; heads: string; mass: string[]; massRefl: string};
/** a soft band of dense reeds along the bank (world z), its top edge from smooth noise; and its mirror image */
const reedMass = (B: Basis, z: number, h0: number, amp: number, seed: number): [string, string] => {
  const [xa, xb] = visX(B, 0, z, 300);
  const n = 64;
  const top: V2[] = [], base: V2[] = [], mir: V2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n;
    const h = h0 + amp * (0.6 * noise1(x / 38, seed) + 0.4 * noise1(x / 11, seed + 3));
    const hm = h0 + amp * 0.5 * noise1(x / 120, seed + 7);
    const q = proj(B, [x, h, z]), b = proj(B, [x, 0, z]), m = proj(B, [x, -hm * 0.8, z]);
    top.push({x: q.x, y: q.y});
    base.push({x: b.x, y: b.y});
    mir.push({x: m.x, y: m.y});
  }
  const rb = base.slice().reverse();
  return [poly([...top, ...rb]), poly([...mir, ...rb])];
};
const buildReeds = (B: Basis, t: number): Reeds => {
  const [xa, xb] = visX(B, 40, BANK_Z, 220);
  const tone = ['', '', ''];
  let refl = '', stalks = '', heads = '';
  const sp0 = 21;
  for (let k = Math.floor(xa / sp0); k <= Math.ceil(xb / sp0); k++) {
    const cx = k * sp0 + (hash(k * 7.13) - 0.5) * 10;
    const cz = BANK_Z + (hash(k * 3.17) - 0.5) * 70;
    const tall = 0.55 + 0.45 * hash(k * 1.93);
    const n = 4 + Math.floor(hash(k * 1.71) * 6);
    for (let b = 0; b < n; b++) {
      const hb = hash(k * 13.7 + b * 1.31);
      const base: V3 = [cx + (hb - 0.5) * 11, 0, cz + (hash(k * 5.1 + b * 2.3) - 0.5) * 24];
      const h = (55 + 85 * hash(k * 2.3 + b * 0.71)) * tall;
      const lean = (hash(k * 4.1 + b * 0.37) - 0.5) * 0.55 + 0.025 * Math.sin(t * 1.3 + k * 0.7 + b);
      const wb = 1.2 + 0.9 * hash(k * 9.7 + b * 0.53);
      const tn = Math.floor(hash(k * 6.3 + b * 1.9) * 3);
      tone[tn] += blade(B, base, h, lean, wb);
    }
    if (hash(k * 9.1) > 0.5) {
      const base: V3 = [cx + (hash(k * 2.9) - 0.5) * 8, 0, cz + 6];
      const hs = (95 + 35 * hash(k * 8.3)) * tall;
      const lean = (hash(k * 4.4) - 0.5) * 0.08 + 0.012 * Math.sin(t * 1.1 + k);
      const pt = (u: number) => proj(B, [base[0] + lean * hs * u * u, hs * u, base[2]]);
      stalks += `M${P2(pt(0))} L${P2(pt(0.5))} L${P2(pt(0.98))} `;
      const a = pt(0.7), c = pt(0.86);
      heads += capsule2(a, c, 1.15 * a.s, 1.05 * c.s) + ' ';
    }
  }
  const [m0, r0] = reedMass(B, BANK_Z - 260, 105, 40, 2);
  const [m1, r1] = reedMass(B, BANK_Z - 40, 62, 26, 5);
  return {tone, refl, stalks, heads, mass: [m0, m1], massRefl: r0 + ' ' + r1};
};

const PondBack: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const id = uid('pdb');
  const ahead = add3(B.eye, mul3(norm3([B.fw[0], 0, B.fw[2]]), 1e6));
  const hz = proj(B, ahead).y;
  const bankL = lineAcross(B, 0, BANK_Z + 12);
  const yb = yOnLine(bankL, W / 2);
  const showAbove = yb > -40; // the far bank is in frame
  // treeline (bokeh) and clouds: only when the horizon region is in frame
  let trees = '', treesFar = '';
  if (hz > -200) {
    const [xa, xb] = visX(B, 0, TREE_Z, 400);
    for (let k = Math.floor(xa / 170); k <= Math.ceil(xb / 170); k++) {
      const x = k * 170 + (hash(k * 1.3) - 0.5) * 90;
      const hgt = 260 + 230 * hash(k * 2.7);
      const c = proj(B, [x, hgt, TREE_Z]);
      trees += circ(c.x, c.y, (120 + 90 * hash(k * 3.3)) * c.s);
      const c2 = proj(B, [x + 80, hgt + 120, TREE_Z - 1500]);
      treesFar += circ(c2.x, c2.y, (160 + 120 * hash(k * 5.9)) * c2.s);
    }
  }
  const treeBase = proj(B, [B.eye[0], 0, TREE_Z]).y;
  const treeTop = proj(B, [B.eye[0], 300, TREE_Z]).y;
  const clouds: {x: number; y: number; rx: number; ry: number}[] = [];
  if (hz > 0) {
    for (let k = -3; k <= 3; k++) {
      const x = B.eye[0] + k * 2600 + (hash(k * 7.7) - 0.5) * 1400;
      const c = proj(B, [x, 1500 + 500 * hash(k * 3.1), CLOUD_Z]);
      clouds.push({x: c.x, y: c.y, rx: (700 + 500 * hash(k * 1.9)) * c.s, ry: (130 + 60 * hash(k * 4.2)) * c.s});
    }
  }
  const reeds = showAbove ? buildReeds(B, t) : null;
  // water surface polygon (from the far bank to the bottom of the frame)
  const wTop: V2[] = [{x: -100, y: yOnLine(bankL, -100)}, {x: W + 100, y: yOnLine(bankL, W + 100)}];
  const water = `M${P2(wTop[0])} L${P2(wTop[1])} L${W + 100},${H + 100} L-100,${H + 100} Z`;
  // bank strip
  const bankTopL = lineAcross(B, 3, BANK_Z - 20);
  const bankD = `M-100,${fx(yOnLine(bankTopL, -100))} L${W + 100},${fx(yOnLine(bankTopL, W + 100))} L${W + 100},${fx(yOnLine(bankL, W + 100) + 1)} L-100,${fx(yOnLine(bankL, -100) + 1)} Z`;
  // reflection bands under the bank
  const reflEnd = yb + Math.max(30, (proj(B, [B.eye[0], -90, BANK_Z]).y - yb));
  const reflBands = (() => {
    let d = '';
    let y = yb - 2;
    const yEnd = yb + Math.max(30, (proj(B, [B.eye[0], -110, BANK_Z]).y - yb) * 0.6);
    let k = 0;
    while (y < yEnd && k < 80) {
      const hgt = 5 + 9 * hash(k * 1.7) * Math.max(0.3, 1 - k / 40);
      const top: V2[] = [], bot: V2[] = [];
      for (let i = 0; i <= 16; i++) {
        const x = -100 + (i / 16) * (W + 200);
        top.push({x, y: y + 2.2 * Math.sin(x / (40 + 30 * hash(k)) + t * 2.4 + k) + 1.2 * Math.sin(x / 13 + k * 3)});
        bot.push({x, y: y + hgt + 2.2 * Math.sin(x / (35 + 25 * hash(k + 9)) - t * 2.1 + k * 1.4)});
      }
      d += poly([...top, ...bot.reverse()]) + ' ';
      y += hgt + 1.5 + 3 * hash(k * 4.1) + 0.06 * (y - yb);
      k++;
    }
    return d;
  })();
  // ripple glints on the water (world-anchored rows)
  const g3 = ['', '', ''];
  let dk = '';
  const nearW = (() => {
    const p = unproj(B, W / 2, H, 100);
    const d = sub3(p, B.eye);
    if (d[1] >= -1e-6) return BANK_Z;
    const tt = -B.eye[1] / d[1];
    return B.eye[2] + d[2] * tt;
  })();
  for (let r = 0; r < 70; r++) {
    const z = 620 - 9 * Math.pow(r, 1.6);
    if (z < BANK_Z + 40) break;
    if (z > nearW + 30 || z > B.eye[2] - 60) continue;
    const dx = 14 + 0.05 * (620 - z);
    const [xa, xb] = visX(B, 0, z, 80);
    for (let m = Math.floor(xa / dx); m <= Math.ceil(xb / dx); m++) {
      const h1 = hash(r * 31.7 + m * 1.37);
      if (h1 < 0.35) continue;
      const x = m * dx + (hash(r * 7.1 + m * 3.3) - 0.5) * dx * 0.8 + 2.5 * Math.sin(t * 0.9 + m + r);
      const zz = z + (hash(r * 2.9 + m * 5.1) - 0.5) * 6;
      const L = dx * (0.12 + 0.2 * hash(r * 4.3 + m)) * (0.65 + 0.35 * Math.sin(t * 2.1 + h1 * 9));
      const light = h1 > 0.74;
      const Ls = light ? L : L * 0.55;
      const a = proj(B, [x - Ls, 0, zz]), b = proj(B, [x + Ls, 0, zz]);
      if (a.x < -50 && b.x < -50) continue;
      if (a.x > W + 50 && b.x > W + 50) continue;
      const bulge = Math.min(3, 0.12 * Math.abs(b.x - a.x));
      const seg = `M${P2(a)} Q${fx((a.x + b.x) / 2)},${fx((a.y + b.y) / 2 + (light ? -bulge : bulge))} ${P2(b)} `;
      if (light) g3[a.s > 9 ? 2 : a.s > 4 ? 1 : 0] += seg;
      else dk += seg;
    }
  }
  // lily pads
  const pads: {x: number; z: number; r: number; rot: number}[] = [
    {x: -150, z: -640, r: 12, rot: 0.6}, {x: -124, z: -612, r: 8.5, rot: 2.1}, {x: 70, z: -700, r: 14, rot: 4.0}, {x: 96, z: -662, r: 9.5, rot: 1.0},
    {x: 248, z: -628, r: 12, rot: 3.3}, {x: 380, z: -690, r: 10, rot: 5.5}, {x: -60, z: 236, r: 13, rot: 5.2}, {x: -34, z: 262, r: 9, rot: 0.3},
    {x: 140, z: 222, r: 12, rot: 2.6}, {x: 300, z: 250, r: 11, rot: 4.4},
  ];
  const padVis = ss(grazing(B, [B.eye[0], 0, 0]), 1.0, 3.0);
  const padEl = pads.map((p, i) => {
    if (p.z > B.eye[2] - 60) return null;
    const c = proj(B, [p.x, 0.2, p.z]);
    if (c.x < -200 || c.x > W + 200 || c.y < -100 || c.y > H + 100) return null;
    const m = planeMatrix(B, [p.x, 0.2, p.z], [1, 0, 0], [0, 0, 1]);
    const a0 = p.rot, a1 = p.rot + 2 * Math.PI - 0.5;
    const pt = (a: number, r: number) => `${fx(r * Math.cos(a))},${fx(r * Math.sin(a))}`;
    const d = `M0,0 L${pt(a0, p.r)} A${p.r},${p.r} 0 1,1 ${pt(a1, p.r)} Z`;
    const veins = [0.9, 1.9, 2.9, 3.9, 4.9].map((k) => `M0,0 L${pt(a0 + k * 1.15, p.r * 0.85)}`).join(' ');
    return (
      <g key={i} transform={m}>
        <path d={d} transform="translate(0.6,0.9)" fill={PC.padDeep} opacity={0.5} />
        <path d={d} fill={PC.pad} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} strokeLinejoin="round" />
        <path d={d} transform="translate(-0.9,-0.9) scale(0.82)" fill={PC.padLit} opacity={0.45} />
        <path d={veins} stroke={PC.padDeep} strokeWidth={0.9} vectorEffect={NS} opacity={0.45} />
      </g>
    );
  });
  const sheen: {x: number; y: number; rx: number; ry: number; a: number}[] = [];
  for (const [zr, k0] of [[-700, 0], [-380, 1], [-150, 2], [80, 3]] as [number, number][]) {
    if (zr > B.eye[2] - 80) continue;
    const [xa, xb] = visX(B, 0, zr, 200);
    const spx = 260 + 80 * k0;
    for (let k = Math.floor(xa / spx); k <= Math.ceil(xb / spx); k++) {
      const hh = hash(k * 3.9 + k0 * 17);
      if (hh < 0.4) continue;
      const c = proj(B, [k * spx + (hash(k * 1.3 + k0) - 0.5) * spx * 0.6, 0, zr + (hash(k * 2.7) - 0.5) * 60]);
      const e = proj(B, [k * spx + 100, 0, zr]);
      const flat = Math.max(0.04, Math.abs(Math.sin(grazing(B, [c.x, 0, zr]) * R2)) * 1.0);
      sheen.push({x: c.x, y: c.y, rx: (90 + 70 * hh) * c.s, ry: (90 + 70 * hh) * c.s * flat, a: 0.12 + 0.1 * hh});
      void e;
    }
  }
  const sky0 = Math.min(hz - 900, yb - 900);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1={0} y1={sky0} x2={0} y2={hz}>
          <stop offset={0} stopColor={PC.skyTop} />
          <stop offset={1} stopColor={PC.skyLow} />
        </linearGradient>
        <linearGradient id={`${id}w`} gradientUnits="userSpaceOnUse" x1={0} y1={yb} x2={0} y2={H}>
          <stop offset={0} stopColor={PC.waterTop} />
          <stop offset={0.3} stopColor={PC.waterMid} />
          <stop offset={1} stopColor={PC.waterLow} />
        </linearGradient>
        <filter id={`${id}f`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation={7} /></filter>
        <filter id={`${id}r`} x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation={1.4} /></filter>
        <filter id={`${id}q`} x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation={9} /></filter>
        <clipPath id={`${id}c`}><path d={reflBands} /></clipPath>
        <radialGradient id={`${id}sh`}>
          <stop offset={0} stopColor="#E9F6F4" stopOpacity={1} />
          <stop offset={1} stopColor="#E9F6F4" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}rg`} gradientUnits="userSpaceOnUse" x1={0} y1={yb} x2={0} y2={reflEnd}>
          <stop offset={0} stopColor={PC.reedRefl} stopOpacity={0.6} />
          <stop offset={0.5} stopColor={PC.reedRefl} stopOpacity={0.26} />
          <stop offset={1} stopColor={PC.reedRefl} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-50} y={-50} width={W + 100} height={H + 100} fill={`url(#${id}s)`} />
      {(clouds.length > 0 || trees || treesFar || reeds) && (
        <g filter={`url(#${id}f)`}>
          {clouds.map((c, i) => <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={PC.cloud} opacity={0.75} />)}
          {treesFar && <path d={treesFar} fill={PC.treeFar} />}
          {trees && <path d={trees} fill={PC.tree} />}
          {trees && <rect x={-100} y={treeTop} width={W + 200} height={Math.max(0, treeBase - treeTop + 30)} fill={PC.tree} />}
          {reeds && <path d={reeds.mass[0]} fill={PC.massFar} />}
        </g>
      )}
      {reeds && (
        <g filter={`url(#${id}r)`}>
          <path d={reeds.mass[1]} fill={PC.mass} />
          <path d={reeds.tone[0]} fill={PC.reed[0]} />
          <path d={reeds.tone[2]} fill={PC.reed[2]} />
          <path d={reeds.stalks} stroke={PC.reed[2]} strokeWidth={1.4} fill="none" />
          <path d={reeds.tone[1]} fill={PC.reed[1]} />
          <path d={reeds.heads} fill={PC.cattail} />
          <path d={bankD} fill={PC.bank} />
        </g>
      )}
      <path d={water} fill={`url(#${id}w)`} />
      {reeds && (
        <g filter={`url(#${id}q)`}>
          <path d={reeds.massRefl} fill={`url(#${id}rg)`} />
        </g>
      )}

      {sheen.map((q, i) => <ellipse key={`sh${i}`} cx={q.x} cy={q.y} rx={q.rx} ry={q.ry} fill={`url(#${id}sh)`} opacity={q.a} />)}
      <path d={dk} stroke={PC.waterLow} strokeWidth={1.6} vectorEffect={NS} strokeLinecap="round" opacity={0.28} fill="none" />
      <path d={g3[0]} stroke="#FFFFFF" strokeWidth={1.2} vectorEffect={NS} strokeLinecap="round" opacity={0.5} fill="none" />
      <path d={g3[1]} stroke="#FFFFFF" strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={0.5} fill="none" />
      <path d={g3[2]} stroke="#FFFFFF" strokeWidth={2.4} vectorEffect={NS} strokeLinecap="round" opacity={0.5} fill="none" />
      <g opacity={padVis}>{padEl}</g>
    </g>
  );
};

const PondUnder: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const uw = pondSplit(B);
  if (uw < 0.01) return null;
  const id = uid('pdu');
  const e = edgeLine(B, t);
  const ey = e[Math.floor(e.length / 2)].y;
  // the highest point of the frame's waterline: anything wholly above it is hidden by the underwater clip anyway, so
  // only that is culled (no item pops in or out where it can be seen)
  let eTop = Infinity;
  for (const p of e) eTop = Math.min(eTop, p.y);
  const fog = (p: V3) => 1 - Math.exp(-Math.max(0, -(p[2] - B.eye[2])) / 1100);
  // pond floor
  const floorL = lineAcross(B, FLOOR_Y, BANK_Z + 60);
  const floorD = `M-100,${fx(yOnLine(floorL, -100))} L${W + 100},${fx(yOnLine(floorL, W + 100))} L${W + 100},${H + 100} L-100,${H + 100} Z`;
  const fy = yOnLine(floorL, W / 2);
  // weeds (ribbons from the floor, fogged by distance)
  const wd = ['', '', ''];
  for (const [zr, bucket] of [[-980, 0], [-770, 1], [-580, 2]] as [number, number][]) {
    const [xa, xb] = visX(B, -30, zr, 260);
    const spx = 34 + 10 * bucket;
    for (let k = Math.floor(xa / spx); k <= Math.ceil(xb / spx); k++) {
      if (hash(k * 3.7 + bucket * 11) < 0.35) continue;
      const n = 2 + Math.floor(hash(k * 1.9 + bucket) * 3);
      for (let b = 0; b < n; b++) {
        const base: V3 = [k * spx + (hash(k * 5.3 + b) - 0.5) * 18, FLOOR_Y, zr + (hash(k * 2.1 + b * 3) - 0.5) * 80];
        const hgt = 18 + 26 * hash(k * 7.9 + b * 1.3 + bucket);
        const sway = 0.12 * Math.sin(t * 0.8 + k * 1.3 + b) + (hash(k + b * 4.4) - 0.5) * 0.4;
        wd[bucket] += blade(B, base, hgt, sway, 2.0 + hash(k * 3 + b));
      }
    }
  }
  // the near floor (lower third): pebbles on the silt and a few rooted weed clumps, crisp and only lightly fogged.
  // Every item is anchored in the world (it slides by as the camera tracks the duck; nothing fades by screen position)
  const fogMix = (c: string, p: V3) => mix(c, PC.uwMid, clamp(0.08 + 0.55 * fog(p), 0, 0.8));
  type Peb = {d: string; sh: string; hi: V2 & {r: number}; fill: string; a: number; z: number};
  const pebs: Peb[] = [];
  for (const zr of [-125, -180, -245, -320, -410, -520]) {
    const [xa, xb] = visX(B, FLOOR_Y, zr, 120);
    const spx = 13 + 0.03 * -zr;
    for (let k = Math.floor(xa / spx); k <= Math.ceil(xb / spx); k++) {
      const h = hash(k * 3.31 + zr * 0.71);
      if (h < 0.42) continue;
      const x = k * spx + (hash(k * 7.7 + zr) - 0.5) * spx * 0.8;
      const z = zr + (hash(k * 2.9 + zr * 0.3) - 0.5) * 50;
      const r = 1.6 + 3.4 * hash(k * 5.3 + zr * 0.17) ** 1.5;
      const p: V3 = [x, FLOOR_Y, z];
      const c = proj(B, p);
      const rx = r * c.s, ry = r * c.s * (0.5 + 0.15 * hash(k * 4.4 + zr));
      if (c.y + ry < eTop || c.y - 2 * ry > H + 10) continue;
      const cy = c.y - ry * 0.55;
      const d = `M${fx(c.x - rx)},${fx(cy)} a${fx(rx)},${fx(ry)} 0 1,0 ${fx(2 * rx)},0 a${fx(rx)},${fx(ry)} 0 1,0 ${fx(-2 * rx)},0Z`;
      const sh = `M${fx(c.x - rx * 1.2)},${fx(c.y + ry * 0.25)} a${fx(rx * 1.2)},${fx(ry * 0.35)} 0 1,0 ${fx(rx * 2.4)},0 a${fx(rx * 1.2)},${fx(ry * 0.35)} 0 1,0 ${fx(-rx * 2.4)},0Z`;
      const tone = PC.pebble[Math.floor(hash(k * 9.1 + zr) * PC.pebble.length)];
      pebs.push({d, sh, hi: {x: c.x - rx * 0.28, y: cy - ry * 0.32, r: rx * 0.55}, fill: fogMix(tone, p), a: 1 - 0.35 * fog(p), z});
    }
  }
  type Clump = {d: string; fill: string; a: number; z: number};
  const clumps: Clump[] = [];
  for (const [zr, spx, seed] of [[-250, 46, 1], [-360, 58, 2]] as [number, number, number][]) {
    const [xa, xb] = visX(B, FLOOR_Y, zr, 320);
    for (let k = Math.floor(xa / spx); k <= Math.ceil(xb / spx); k++) {
      if (hash(k * 4.13 + seed * 17) < 0.42) continue;
      const cx = k * spx + (hash(k * 6.1 + seed) - 0.5) * spx * 0.5;
      const cz = zr + (hash(k * 2.3 + seed * 5) - 0.5) * 40;
      const c = proj(B, [cx, FLOOR_Y, cz]);
      // a clump reaches ~36 cm up: cull it only when even its tips lie above the waterline
      if (proj(B, [cx, FLOOR_Y + 40, cz]).y < eTop) continue;
      let d = '';
      const n = 5 + Math.floor(hash(k * 1.3 + seed) * 3);
      for (let b = 0; b < n; b++) {
        const u = (b + 0.5) / n - 0.5;
        const base: V3 = [cx + u * 9 + (hash(k * 5.7 + b) - 0.5) * 2, FLOOR_Y, cz + (hash(k * 3.9 + b * 2) - 0.5) * 6];
        const hgt = (16 + 20 * hash(k * 7.3 + b * 1.7 + seed)) * (1 - 0.45 * Math.abs(u));
        const sway = u * 0.9 + 0.1 * Math.sin(t * 0.9 + k + b * 0.7) + (hash(k + b * 3.1) - 0.5) * 0.25;
        d += blade(B, base, hgt, sway, 1.7 + 0.8 * hash(k * 2 + b));
      }
      clumps.push({d, fill: fogMix(PC.weedNear, [cx, FLOOR_Y, cz]), a: 1 - 0.3 * fog([cx, FLOOR_Y, cz]), z: cz});
    }
  }
  // faint ripples in the silt (sand ridges), world-anchored rows
  let silt = '';
  for (let r = 0; r < 9; r++) {
    const z = -180 - r * r * 11;
    const [xa, xb] = visX(B, FLOOR_Y, z, 200);
    const dx = 22 + 0.04 * -z;
    for (let m = Math.floor(xa / dx); m <= Math.ceil(xb / dx); m++) {
      if (hash(m * 1.9 + r * 7.7) < 0.45) continue;
      const x = m * dx + (hash(m * 3.1 + r) - 0.5) * dx * 0.6;
      const L = dx * (0.25 + 0.2 * hash(m + r * 2.2));
      const a = proj(B, [x - L, FLOOR_Y, z]), b = proj(B, [x + L, FLOOR_Y, z]);
      if (Math.max(a.y, b.y) < eTop - 4) continue;
      silt += `M${P2(a)} Q${fx((a.x + b.x) / 2)},${fx((a.y + b.y) / 2 - 1.6)} ${P2(b)} `;
    }
  }
  // light shafts (from the surface, slanting down-right: light from the upper left)
  const shafts: string[] = [];
  {
    const [xa0, xb0] = visX(B, 0, -260, 120);
    const sTop = proj(B, [B.eye[0], 0, -260]).s;
    const xa = xa0 - (330 + 30 * 2.4 * sTop) / Math.max(0.1, sTop), xb = xb0;
    const spx = 90;
    for (let k = Math.floor(xa / spx); k <= Math.ceil(xb / spx); k++) {
      if (hash(k * 4.9) < 0.3) continue;
      const x = k * spx + (hash(k * 2.2) - 0.5) * 50 + 6 * Math.sin(t * 0.55 + k);
      const top = proj(B, [x, 0, -260]);
      const w0 = (10 + 14 * hash(k * 6.1)) * top.s, len = 1100;
      const w1 = w0 * 2.4;
      const dx = 0.3 * len;
      shafts.push(`M${fx(top.x - w0 / 2)},${fx(Math.max(top.y, ey))} L${fx(top.x + w0 / 2)},${fx(Math.max(top.y, ey))} L${fx(top.x + dx + w1 / 2)},${fx(top.y + len)} L${fx(top.x + dx - w1 / 2)},${fx(top.y + len)} Z`);
    }
  }
  // motes
  let m1 = '', m2 = '';
  {
    const cell = 36;
    for (const zr of [-320, -180, -60, 10]) {
      const [xa, xb] = visX(B, -20, zr, 90);
      for (let k = Math.floor(xa / cell); k <= Math.ceil(xb / cell); k++) {
        for (let q = 0; q < 2; q++) {
          const hh = hash(k * 12.9 + q * 3.1 + zr);
          const p: V3 = [
            k * cell + hh * cell + 3 * Math.sin(t * 0.35 + hh * 20),
            -2 - 50 * hash(k * 5.7 + q + zr * 0.1) + 1.5 * Math.sin(t * 0.5 + hh * 13),
            zr + (hash(k * 1.1 + q * 7 + zr) - 0.5) * 60,
          ];
          const c = proj(B, p);
          if (c.y < eTop - 4) continue;
          const r = (0.18 + 0.22 * hash(hh * 91)) * c.s;
          if (fog(p) > 0.45) m1 += circ(c.x, c.y, r); else m2 += circ(c.x, c.y, r);
        }
      }
    }
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}><path d={underClipD(B, t)} /></clipPath>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={0} y1={ey} x2={0} y2={H}>
          <stop offset={0} stopColor={PC.uwTop} />
          <stop offset={0.28} stopColor={PC.uwMid} />
          <stop offset={1} stopColor={PC.uwLow} />
        </linearGradient>
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1={0} y1={fy - 6} x2={0} y2={Math.max(fy + 60, H)}>
          <stop offset={0} stopColor={mix(PC.floor, PC.uwMid, 0.66)} stopOpacity={0} />
          <stop offset={0.035} stopColor={mix(PC.floor, PC.uwMid, 0.58)} stopOpacity={0.92} />
          <stop offset={0.4} stopColor={mix(PC.floor, PC.uwMid, 0.36)} stopOpacity={1} />
          <stop offset={1} stopColor={mix(PC.floor, PC.uwLow, 0.4)} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}m`} gradientUnits="userSpaceOnUse" x1={0} y1={ey} x2={0} y2={ey + 60}>
          <stop offset={0} stopColor="#E6F5F2" stopOpacity={0.55} />
          <stop offset={1} stopColor="#E6F5F2" stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}b`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={2.2} /></filter>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect x={-100} y={ey - 40} width={W + 200} height={H - ey + 200} fill={`url(#${id}g)`} />
        <path d={floorD} fill={`url(#${id}f)`} />
        <g filter={`url(#${id}b)`}>
          <path d={wd[0]} fill={mix(PC.weed, PC.uwMid, 0.75)} />
          <path d={wd[1]} fill={mix(PC.weed, PC.uwMid, 0.62)} />
          <path d={wd[2]} fill={mix(PC.weed, PC.uwMid, 0.5)} />
        </g>
        {silt && <path d={silt} fill="none" stroke={mix(PC.floor, PC.uwLow, 0.6)} strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={0.55} />}
        {/* pebbles and clumps together, far to near */}
        {[...clumps.map((c) => ({z: c.z, c, p: null as Peb | null})), ...pebs.map((p) => ({z: p.z, c: null as Clump | null, p}))]
          .sort((a, b) => a.z - b.z)
          .map(({c, p}, i) => (c ? (
            <path key={`w${i}`} d={c.d} fill={c.fill} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} strokeOpacity={0.45} opacity={c.a} />
          ) : p ? (
            <g key={`p${i}`} opacity={p.a}>
              <path d={p.sh} fill={PC.uwLow} opacity={0.35} />
              <path d={p.d} fill={p.fill} stroke={INK} strokeWidth={LINE_PX * 0.9} vectorEffect={NS} strokeOpacity={0.6} />
              <ellipse cx={p.hi.x} cy={p.hi.y} rx={p.hi.r} ry={p.hi.r * 0.5} fill="#FFFFFF" opacity={0.16} />
            </g>
          ) : null))}
        {shafts.map((d, i) => <path key={i} d={d} fill={`url(#${id}s)`} opacity={0.7 + 0.3 * Math.sin(t * 0.9 + i * 1.7)} />)}
        <path d={m1} fill={PC.mote} opacity={0.35} />
        <path d={m2} fill={PC.mote} opacity={0.6} />
        <rect x={-100} y={ey - 10} width={W + 200} height={80} fill={`url(#${id}m)`} />
      </g>
    </g>
  );
};

const PondSurface: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const uw = pondSplit(B);
  const id = uid('pds');
  const e = wipeLine(B, t);
  const line = `M${e.map(P2).join(' L')}`;
  // glints on the near water (in front of the duck), drawn over its reflection; above the frame's waterline only
  let gl = '';
  const glA = 0.45 * (1 - ss(uw, 0.6, 1));
  if (glA > 0.01) {
    for (let r = 0; r < 14; r++) {
      const z = 32 + r * r * 2.2;
      if (z > B.eye[2] - 80) break;
      const dx = 16 + 0.06 * z;
      const [xa, xb] = visX(B, 0, z, 60);
      for (let m = Math.floor(xa / dx); m <= Math.ceil(xb / dx); m++) {
        const h1 = hash(r * 17.3 + m * 2.71);
        if (h1 < 0.72) continue;
        const x = m * dx + (hash(r * 3.3 + m * 9.1) - 0.5) * dx + 2 * Math.sin(t * 1.1 + m);
        const L = dx * (0.1 + 0.15 * hash(r + m * 0.3)) * (0.6 + 0.4 * Math.sin(t * 2.4 + h1 * 11));
        const a = proj(B, [x - L, 0, z]), b = proj(B, [x + L, 0, z]);
        gl += `M${P2(a)} L${P2(b)} `;
      }
    }
  }
  let eMid = Infinity;
  for (const p of e) eMid = Math.min(eMid, p.y);
  const show = uw > 0.01 && eMid < H + 40;
  return (
    <g>
      {gl && (
        uw > 0.01 ? (
          <g>
            <defs><clipPath id={`${id}o`}><path d={overClipD(B, t)} /></clipPath></defs>
            <path d={gl} clipPath={`url(#${id}o)`} stroke="#FFFFFF" strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={glA} fill="none" />
          </g>
        ) : (
          <path d={gl} stroke="#FFFFFF" strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={glA} fill="none" />
        )
      )}
      {show && (
        <g>
          <defs>
            <linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1={0} y1={eMid} x2={0} y2={eMid + 30}>
              <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.55} />
              <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${line} L${W + 90},${fx(eMid + 34)} L-90,${fx(eMid + 34)} Z`} fill={`url(#${id}h)`} />
          <path d={line} fill="none" stroke={INK} strokeWidth={1.2} vectorEffect={NS} opacity={0.35} transform="translate(0,-1.6)" />
          <path d={line} fill="none" stroke={K.surfLine} strokeWidth={2.4} vectorEffect={NS} />
        </g>
      )}
    </g>
  );
};

const PondFront: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const uw = pondSplit(B);
  const id = uid('pdf');
  // soft near bokeh glints at the bottom of the frame (surface views), soft near motes (split views)
  const disc: {x: number; y: number; r: number; a: number}[] = [];
  for (let k = 0; k < 7; k++) {
    const h1 = hash(k * 5.31 + 2), h2 = hash(k * 2.17 + 9);
    const x = (0.05 + 0.9 * h1) * W + 18 * Math.sin(t * 0.4 + k);
    if (x > 330 && x < 760) continue; // keep the subject clear
    disc.push({x, y: H - 140 - 260 * h2 + 10 * Math.sin(t * 0.6 + k * 2), r: 26 + 34 * hash(k * 7.7), a: 0.1 + 0.12 * hash(k * 3.9)});
  }
  const e = edgeLine(B, t);
  const ey = e[Math.floor(e.length / 2)].y;
  const near: {x: number; y: number; r: number}[] = [];
  for (let k = 0; k < 6; k++) {
    const x = (0.04 + 0.92 * hash(k * 8.1 + 1)) * W + 14 * Math.sin(t * 0.5 + k * 1.3);
    if (x > 300 && x < 800) continue;
    near.push({x, y: ey + 240 + (H - ey - 380) * hash(k * 4.4 + 3) + 12 * Math.sin(t * 0.7 + k), r: 9 + 12 * hash(k * 6.6)});
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}d`}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset={0.7} stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}v`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={PC.uwLow} stopOpacity={0} />
          <stop offset={1} stopColor={PC.uwLow} stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect x={-20} y={H - 360} width={W + 40} height={380} fill={`url(#${id}v)`} />
      {uw < 0.99 && disc.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`url(#${id}d)`} opacity={d.a * (1 - uw)} />)}
      {uw > 0.01 && near.map((d, i) => <circle key={`n${i}`} cx={d.x} cy={d.y} r={d.r} fill={`url(#${id}d)`} opacity={0.28 * uw} />)}
    </g>
  );
};

/** the pond: 'back' = sky, bokeh treeline, far reed bank, the water surface (reflections, ripples, lily pads);
 *  'under' = the underwater volume behind the glass plane, with the pond floor (wiped in from below at the waterline); 'surface' = the frame's
 *  waterline edge (split view) and near ripple glints; 'front' = soft foreground water (bokeh, vignette).
 *  Film order: back, under, <Duck/>, surface, front. */
export const Pond: React.FC<{B: Basis; t: number; layer: 'back' | 'surface' | 'under' | 'front'}> = ({B, t, layer}) => {
  if (layer === 'back') return <PondBack B={B} t={t} />;
  if (layer === 'under') return <PondUnder B={B} t={t} />;
  if (layer === 'surface') return <PondSurface B={B} t={t} />;
  return <PondFront B={B} t={t} />;
};
