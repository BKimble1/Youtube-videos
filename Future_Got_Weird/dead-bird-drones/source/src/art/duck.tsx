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
//   light-grey 3D-printed sealed module (a gear cover over its small drive, an output shaft with two cranks 180 deg
//   apart); each crank pushes a pushrod down to a lever on a leg's hip pivot (carried by a printed bracket), so the
//   legs swing alternately; the orange webbed feet spread on the power stroke (back) and fold on the recovery
//   (forward). The leg angle is SOLVED from the pushrod length (crank-rocker), so the feet move only because the
//   module turns. No propeller.
// - The pond convention for the split (over/under) view: a vertical "glass" plane at z = GLASS_Z in front of the
//   duck. Below the water, only what lies behind that plane is shown, through it (below the projected line y = 0,
//   z = GLASS_Z, the frame's waterline); above it the far water surface is seen from just above. Pond's 'under' layer
//   fades in from the camera's grazing angle (pondSplit), so the film's camera dip drives it.
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
/** the split view's "glass" plane (world z): below the water only what lies behind it is shown */
export const GLASS_Z = 40;
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
  specW: '#F6F5F0',
  spec: '#34489E',
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
  tailMid: '#B9B6AB',
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
  rod: '#74828D',
  rodLit: '#C9D3DA',
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
const loopPath = (pts: V2[]) => {
  const p = dec(pts, 2.2);
  return p.length >= 3 ? smoothClosed(p) : '';
};
const convexPath = (pts: V2[], step = 9) => {
  const hl = hull(pts);
  return hl.length >= 3 ? smoothClosed(resample(hl, step)) : '';
};
const toEye = (B: Basis, p: V3) => norm3(sub3(B.eye, p));
const fx = (n: number) => n.toFixed(1);
const circ = (x: number, y: number, r: number) => `M${fx(x - r)},${fx(y)}a${fx(r)},${fx(r)} 0 1,0 ${fx(2 * r)},0a${fx(r)},${fx(r)} 0 1,0 ${fx(-2 * r)},0Z`;
/** the light, fixed in camera space: from the upper left, a little in front */
const lightDir = (B: Basis): V3 => norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.66)), mul3(B.fw, -0.5)));
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
const specBox = (s: HS, g: number) => {
  const x = s.l[0], y = s.l[1], yb = yFlank0(x);
  return Math.min(x + 13.0 - 0.5 * (y - yb) + g, -7.2 - 0.5 * (y - yb) + g - x, y - (yb - 0.25 - g), yb + 0.75 + g - y);
};
const F_SPECW = (s: HS) => specBox(s, 0.22);
/** the folded primaries: a dark tapering band along the rear of the back */
const F_PRIM = (s: HS) => {
  const x = s.l[0];
  const u = clamp((x + 19.4) / 9.6);
  return Math.min((-9.6 - x) * 0.6, (x + 19.4) * 0.6, s.l[1] - (topY(x) - lerp(0.5, 2.3, Math.sqrt(u))));
};
const F_SPEC = (s: HS) => specBox(s, 0);
const F_BREAST = (s: HS) => s.l[0] - xBreast(s.l[1]);
const F_BELLY = (s: HS) => -2.2 - s.l[1];
const F_SHADOW = (s: HS) => (0.1 - s.nl) * 10;
const F_CORE = (s: HS) => (-0.32 - s.nl) * 10;
const F_HI = (s: HS) => (s.nl - 0.74) * 10;

// ================================================================ neck, head, bill, tail (duck-local)
/** the neck: a tube along a quadratic curve from inside the breast up into the head, radius varying (a slight waist) */
const NECK = {a: [11.3, 4.4, 0] as V3, m: [13.3, 10.0, 0] as V3, b: [16.0, 16.4, 0] as V3, r: [5.1, 4.35, 4.45]};
const neckAt = (u: number): {c: V3; t: V3; r: number} => {
  const a = NECK.a, m = NECK.m, b = NECK.b;
  const c = add3(add3(mul3(a, (1 - u) ** 2), mul3(m, 2 * u * (1 - u))), mul3(b, u * u));
  const t = norm3(add3(mul3(sub3(m, a), 2 * (1 - u)), mul3(sub3(b, m), 2 * u)));
  const r = u < 0.5 ? lerp(NECK.r[0], NECK.r[1], sm(u / 0.5)) : lerp(NECK.r[1], NECK.r[2], sm((u - 0.5) / 0.5));
  return {c, t, r};
};
const COLLAR_U = 0.43; // along the neck curve
const HEAD = {
  nape: {c: [14.2, 18.2, 0] as V3, r: [3.3, 3.6, 3.05] as V3, tilt: 14},
  cranium: {c: [16.7, 19.1, 0] as V3, r: [5.0, 3.95, 3.15] as V3, tilt: -6},
  face: {c: [19.2, 18.0, 0] as V3, r: [3.4, 3.05, 2.7] as V3, tilt: -16},
};
const BILL = {base: [21.6, 18.1, 0] as V3, tip: [27.2, 16.85, 0] as V3};
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
const neckPath = (B: Basis, F: Frame) => {
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
  return smoothClosed([...L, ...endCap, ...R.slice().reverse(), ...startCap]);
};
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
/** tail fan (pale, pointed), in the duck's mid-plane region behind the stern */
const TAIL_PTS: V3[] = (() => {
  const out: V3[] = [[-18.0, 6.0, -2.1]];
  const n = 9;
  for (let k = 0; k < n; k++) {
    const z = -3.3 + (6.6 * k) / (n - 1);
    const q = (z / 3.3) ** 2;
    out.push([-26.0 + 1.0 * q, 7.6 - 1.7 * q, z]);
    if (k < n - 1) {
      const z2 = z + 6.6 / (n - 1) / 2;
      const q2 = (z2 / 3.3) ** 2;
      out.push([-25.25 + 1.0 * q2, 7.5 - 1.7 * q2, z2]);
    }
  }
  out.push([-18.0, 6.0, 2.1]);
  return out;
})();
const CURLS: {pts: [number, number][]; z: number; w: number}[] = [
  {pts: [[-16.0, 6.4], [-17.6, 7.9], [-18.8, 9.3], [-18.8, 10.6], [-18.0, 11.3], [-17.1, 10.9], [-17.1, 10.1], [-17.8, 9.7]], z: 0.35, w: 0.8},
  {pts: [[-15.6, 6.3], [-17.0, 7.6], [-18.0, 8.8], [-18.1, 9.9], [-17.4, 10.4], [-16.8, 10.0], [-16.9, 9.4]], z: -0.35, w: 0.7},
];
// ================================================================ the drive and the legs (duck-local)
const MODULE = {x0: -8.4, x1: 5.0, y0: -3.9, y1: -0.5, z: 3.0, r: 1.0};
const COVER = {a: [2.4, -2.2] as [number, number], b: [-4.2, -1.55] as [number, number], r: 1.05, z: 3.32};
const LEG = {c: [-4.2, -1.55] as [number, number], rc: 0.95, hip: [-5.7, -4.9] as [number, number], lev: 1.55, shank: 5.4, zCrank: 3.55, zRod: 3.8, zLeg: 4.0};
const ALPHA0 = 6; // mean swing (deg, + = foot back)
const ROD_L = (() => {
  const a = ALPHA0 * R2;
  const q = [LEG.hip[0] + LEG.lev * Math.cos(a), LEG.hip[1] - LEG.lev * Math.sin(a)];
  const p = [LEG.c[0] + LEG.rc, LEG.c[1]];
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
})();
const pinOf = (phi: number): [number, number] => [LEG.c[0] + LEG.rc * Math.cos(phi), LEG.c[1] + LEG.rc * Math.sin(phi)];
const leverTip = (a: number): [number, number] => [LEG.hip[0] + LEG.lev * Math.cos(a * R2), LEG.hip[1] - LEG.lev * Math.sin(a * R2)];
/** the leg's swing (deg, + = foot back) for a crank angle: SOLVED from the pushrod length (bisection) */
const legAlpha = (phi: number) => {
  const P = pinOf(phi);
  let lo = -44, hi = 80;
  for (let i = 0; i < 34; i++) {
    const m = (lo + hi) / 2;
    const q = leverTip(m);
    if (Math.hypot(q[0] - P[0], q[1] - P[1]) - ROD_L > 0) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
};
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
  // power stroke (foot sweeping back): the pin moves down while cos(phi) < 0
  const pw = sm(0.5 - 0.95 * Math.cos(phi - 0.4));
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
const underClipD = (B: Basis, t: number) => {
  const e = edgeLine(B, t);
  return `M${e.map(P2).join(' L')} L${W + 90},${H + 600} L-90,${H + 600} Z`;
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
    specW: hullRegion(HV, F_SPECW),
    spec: hullRegion(HV, F_SPEC),
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
  // ---- neck, crop, head
  const neck = neckPath(B, F);
  const nape = ellPath(B, F, HEAD.nape), cran = ellPath(B, F, HEAD.cranium), face = ellPath(B, F, HEAD.face);
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
  const cu0 = ringArc(COLLAR_U - 0.028), cu1 = ringArc(COLLAR_U + 0.028);
  const collar = cu0.length > 2 && cu1.length > 2 ? poly([...cu0, ...cu1.slice().reverse()]) : '';
  const lowN = (() => {
    const arc = ringArc(COLLAR_U - 0.028, 0.2);
    if (arc.length < 2) return '';
    const dn = P(add3(NECK.a, [0, -6, 0]));
    const A = arc[0], Z = arc[arc.length - 1];
    return poly([...arc, {x: Z.x + (dn.x - A.x) * 0 + (Z.x - A.x) * 0.3, y: dn.y + 200}, {x: A.x - (Z.x - A.x) * 0.3, y: dn.y + 200}]);
  })();
  // ---- bill
  const billPts = billSections.flat().map((p) => P(p));
  const bill = convexPath(billPts.map((q) => ({x: q.x, y: q.y})), 4);
  const mouth = (() => {
    const pts: V2[] = [];
    for (let k = 0; k < billSections.length - 1; k++) {
      const ring = billSections[k];
      const lo = ring[Math.round(ring.length * 0.32)];
      pts.push(P([lo[0] - (k === 0 ? 0.6 : 0), lo[1] + 0.1, lo[2] * 0.96]));
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
  const nailC = add3(BILL.tip, [0.15, 0.22, 0]);
  const nailM = planeMatrix(B, xf(F, nailC), xfv(F, norm3(sub3(BILL.tip, BILL.base))), xfv(F, [0, 0, 1]));
  const nostrilC = add3(add3(BILL.base, mul3(sub3(BILL.tip, BILL.base), 0.24)), [0, 0.35, 1.05]);
  const nostrilM = planeMatrix(B, xf(F, nostrilC), xfv(F, norm3(sub3(BILL.tip, BILL.base))), xfv(F, [0, 1, 0]));
  // ---- eye (fixed glass)
  const eN = norm3([(EYE_L[0] - HEAD.cranium.c[0]) / HEAD.cranium.r[0] ** 2, (EYE_L[1] - HEAD.cranium.c[1]) / HEAD.cranium.r[1] ** 2, EYE_L[2] / HEAD.cranium.r[2] ** 2]);
  const eU = norm3(cross3([0, 1, 0], eN)), eV = norm3(cross3(eN, eU));
  const eyeM = planeMatrix(B, xf(F, EYE_L), xfv(F, eU), xfv(F, eV));
  const eyeVis = dot3(xfv(F, eN), toEye(B, xf(F, EYE_L))) > 0.05;
  // ---- tail fan and curls
  const tailS = TAIL_PTS.map((p) => P(p));
  const tail = smoothClosed(tailS.map((q) => ({x: q.x, y: q.y})), 1 / 9);
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
  return (
    <g>
      <defs>
        <clipPath id={idA}><path d={HV.above} /></clipPath>
        <clipPath id={`${idA}n`}><path d={neck} /></clipPath>
      </defs>
      {/* tail fan behind the stern */}
      <path d={tail} fill={K.tail} stroke={INK} strokeWidth={INK_PX * 0.85} vectorEffect={NS} strokeLinejoin="round" />
      <path
        d={tailS.slice(1, -1).filter((_, i) => i % 4 === 0 && i > 0 && i < 16).map((q) => `M${P2(tailRoot)} L${P2(q)}`).join(' ')}
        stroke={K.tailMid} strokeWidth={LINE_PX} vectorEffect={NS} fill="none" opacity={0.8}
      />
      {/* drake curls */}
      {curls.map((d, i) => <path key={`c${i}`} d={d} fill={K.curl} stroke={INK} strokeWidth={LINE_PX * 1.3} vectorEffect={NS} strokeLinejoin="round" />)}
      {curlGloss.map((d, i) => <path key={`g${i}`} d={d} fill="none" stroke={K.curlGloss} strokeWidth={LINE_PX * 1.4} vectorEffect={NS} strokeLinecap="round" opacity={0.85} />)}
      {/* one ink line round body, neck and head: stroke under, fills over */}
      <g fill="none" stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} strokeLinejoin="round">
        <path d={neck} vectorEffect={NS} />
        <path d={nape} vectorEffect={NS} />
        <path d={cran} vectorEffect={NS} />
        <path d={face} vectorEffect={NS} />
        <path d={HV.above} vectorEffect={NS} />
      </g>
      {/* neck: green above the collar, chestnut below */}
      <Cel paths={[neck]} base={K.head} shadow={K.headShadow} sheen={K.headSheen} dS={0.95 * sAt} dH={0.3 * sAt} />
      <g clipPath={`url(#${idA}n)`}>
        {lowN && <path d={lowN} fill={K.breast} />}
        {collar && <path d={collar} fill={C.duckCollar} />}
        {collar && <path d={collar} fill="none" stroke="#C9C8BF" strokeWidth={LINE_PX * 0.7} vectorEffect={NS} opacity={0.7} />}
      </g>
      {/* head (iridescent green) */}
      <Cel paths={[nape, cran, face]} base={K.head} shadow={K.headShadow} sheen={K.headSheen} dS={headDS} dH={headDH} />
      {/* body */}
      <g clipPath={`url(#${idA})`}>
        <path d={HV.above} fill={K.flank} />
        <g fillRule="evenodd">
          <path d={verm.join(' ')} fill="none" stroke={K.vermic} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} opacity={0.28} />
          <path d={R.upper} fill={K.upper} />
          <path d={R.mantle} fill={K.mantle} />
          <path d={R.prim} fill={K.primary} />
          <path d={R.vent} fill={K.vent} />
          <path d={R.stern} fill={K.stern} />
          <path d={R.specW} fill={K.specW} />
          <path d={R.spec} fill={K.spec} />
          <path d={primLines.join(' ')} fill="none" stroke={K.primaryEdge} strokeWidth={LINE_PX} vectorEffect={NS} opacity={0.6} strokeLinecap="round" />
          <path d={tert.join(' ') + ' ' + scal.join(' ')} fill="none" stroke={K.tertialLine} strokeWidth={LINE_PX} vectorEffect={NS} opacity={0.55} strokeLinecap="round" />
          <path d={R.breast} fill={K.breast} />
          <path d={R.shadow} fill={INK} opacity={0.2} />
          <path d={R.core} fill={INK} opacity={0.13} />
          <path d={R.hi} fill="#FFFFFF" opacity={0.14} />
        </g>
      </g>
      {/* bill */}
      <Cel paths={[bill]} base={K.bill} shadow={K.billShadow} sheen={K.billSheen} dS={0.5 * sAt} dH={0.22 * sAt} />
      <path d={bill} fill="none" stroke={INK} strokeWidth={INK_PX * 0.9} vectorEffect={NS} strokeLinejoin="round" />
      <path d={mouth} fill="none" stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} strokeLinecap="round" opacity={0.8} />
      <path d={billTop} fill="none" stroke="#FFF6CC" strokeWidth={LINE_PX * 1.6} vectorEffect={NS} strokeLinecap="round" opacity={0.55} />
      <g transform={nailM}>
        <ellipse cx={0} cy={0} rx={0.62} ry={0.62} fill={K.nail} stroke={INK} strokeWidth={LINE_PX * 0.7} vectorEffect={NS} />
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
  const neck = neckPath(B, M);
  const head = [ellPath(B, M, HEAD.nape), ellPath(B, M, HEAD.cranium), ellPath(B, M, HEAD.face)];
  const bill = convexPath(billSections.flat().map((p) => {
    const q = proj(B, xf(M, p));
    return {x: q.x, y: q.y};
  }), 6);
  const brX = proj(B, xf(M, [xBreast(4), 4, 8])).x;
  const wl = proj(B, xf(F, [0, 0, 0]));
  const hd = proj(B, xf(M, HEAD.cranium.c));
  const x0 = Math.min(...pts.map((p) => p.x), hd.x) - 60, x1 = Math.max(...pts.map((p) => p.x), hd.x) + 120;
  const y0 = wl.y - 8, y1 = hd.y + 6 * hd.s;
  // ripple bands (gaps widen with distance below the waterline)
  let bands = '';
  let y = y0, k = 0;
  while (y < y1 && k < 60) {
    const hgt = 8 + 3 * Math.sin(k * 1.7);
    const top: V2[] = [], bot: V2[] = [];
    for (let i = 0; i <= 14; i++) {
      const x = lerp(x0, x1, i / 14);
      top.push({x, y: y + 1.6 * Math.sin(x / 26 + t * 3.1 + k * 0.9)});
      bot.push({x, y: y + hgt + 1.8 * Math.sin(x / 21 - t * 2.6 + k * 1.3)});
    }
    bands += poly([...top, ...bot.reverse()]) + ' ';
    y += hgt + 1.5 + 0.045 * (y - y0);
    k++;
  }
  return (
    <g opacity={alpha}>
      <defs>
        <clipPath id={id}><path d={bands} /></clipPath>
        <clipPath id={`${id}b`}><rect x={brX} y={-H} width={W * 2} height={H * 3} /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={neck} fill="#1E4B42" />
        {head.map((d, i) => <path key={i} d={d} fill="#1E4B42" />)}
        <path d={bill} fill="#9C8E45" />
        <path d={body} fill="#7D8986" />
        <g clipPath={`url(#${id}b)`}><path d={body} fill="#5B4038" /></g>
      </g>
    </g>
  );
};

/** wake: a small V from the breast, transverse crests behind, and rings left by the paddle strokes */
const Wake: React.FC<{B: Basis; F: Frame; o: V3; t: number; amt: number; v: number}> = ({B, o, t, amt, v}) => {
  if (amt < 0.02) return null;
  const P = (x: number, z: number) => proj(B, [o[0] + x, 0, o[2] + z]);
  const half = 19.5 * R2;
  let light = '', dark = '', light2 = '';
  for (const side of [1, -1]) {
    for (let k = 0; k < 8; k++) {
      const sdist = 6 + k * 7.5;
      const fade = 1 - k / 8;
      const cx = 16.5 - sdist * Math.cos(half), cz = side * (2.0 + sdist * Math.sin(half) + 0.06 * sdist);
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
  const period = 1 / (2 * PADDLE_HZ);
  const n0 = Math.floor(t / period);
  for (let k = 0; k < 4; k++) {
    const te = (n0 - k) * period;
    const age = t - te;
    if (age < 0 || age > 1.9) continue;
    const xe = -16 - v * age;
    const ze = ((n0 - k) % 2 === 0 ? 1 : -1) * 2.2;
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
      <path d={rings} stroke="#FFFFFF" strokeWidth={1.5} vectorEffect={NS} opacity={0.4 * ringA} />
      <path d={light2} stroke="#FFFFFF" strokeWidth={2.0} vectorEffect={NS} opacity={0.5} />
      <path d={light} stroke="#FFFFFF" strokeWidth={2.8} vectorEffect={NS} opacity={0.75} />
      <path d={smoothOpen(bow)} stroke="#FFFFFF" strokeWidth={3} vectorEffect={NS} opacity={0.5} />
    </g>
  );
};

/** below the waterline: submerged hull with the cutaway, the printed module, pushrods, legs and paddling feet */
const BelowWater: React.FC<{B: Basis; F: Frame; HV: HullView; t: number; cut: number}> = ({B, F, HV, t, cut}) => {
  const ua = ss(cut, 0, 0.4);
  if (ua < 0.01) return null;
  const open = ss(cut, 0.22, 0.85);
  const id = uid('dkb');
  const P = (p: V3) => proj(B, xf(F, p));
  const tw = (c: string, k = 0.24) => mix(c, K.uw, k);
  const s0 = P([-2, -3, 3]).s;
  // ---- hull exterior regions (tinted)
  const R = {
    belly: hullRegion(HV, F_BELLY),
    stern: hullRegion(HV, F_STERN),
    breast: hullRegion(HV, F_BREAST),
    shadow: hullRegion(HV, F_SHADOW),
    core: hullRegion(HV, F_CORE),
  };
  // ---- the cutaway window (near flank, below the waterline), following the keel
  const WXc = -1.2, WA = 10.0;
  const winF = (s: HS) => {
    const x = s.l[0], y = s.l[1];
    const lo = keelY(x) + 0.3, hi = -0.45;
    const ym = (lo + hi) / 2, hh = Math.max(0.2, (hi - lo) / 2);
    const k = Math.max(0.02, open);
    const u = (x - WXc) / (WA * k), v = (y - ym) / (hh * k);
    return Math.min((1 - u ** 4 - v ** 4) * 4, s.l[2] * 2);
  };
  const win = open > 0.03 ? hullRegion(HV, winF) : '';
  // ---- legs
  const phiN = duckCrank(t);
  const legs = [legGeo(1, phiN), legGeo(-1, phiN + Math.PI)];
  const rimPx = 0.42 * s0;
  const capsule = (a: V3, b: V3, ra: number, rb: number) => {
    const A = P(a), Bq = P(b);
    return capsule2(A, Bq, ra * A.s, rb * Bq.s);
  };
  const Foot: React.FC<{g: LegG}> = ({g}) => {
    const K0 = P(g.ankle);
    const T = g.tips.map(P), N = g.notch.map(P), Hl = P(g.heel);
    const web = `M${P2(Hl)} L${P2(T[2])} Q${P2(N[1])} ${P2(T[1])} Q${P2(N[0])} ${P2(T[0])} Z`;
    // which face do we see? dorsal normal = -(D x E) for the near-foot convention
    const nD = mul3(cross3(g.D, g.E), -g.side);
    const dorsal = dot3(xfv(F, nD), toEye(B, xf(F, g.ankle))) * g.side > 0;
    const webCol = tw(dorsal ? K.footWeb : K.footSole);
    return (
      <g>
        <path d={capsule(g.exit, g.ankle, 0.42, 0.34)} fill={tw(K.foot)} stroke={INK} strokeWidth={LINE_PX * 1.3} vectorEffect={NS} />
        <path d={web} fill={webCol} stroke={INK} strokeWidth={LINE_PX * 1.3} vectorEffect={NS} strokeLinejoin="round" />
        {g.tips.map((tp, i) => (
          <path key={i} d={capsule(g.ankle, tp, 0.22, 0.12)} fill={tw(K.footLit)} stroke={INK} strokeWidth={LINE_PX * 0.6} vectorEffect={NS} opacity={0.95} />
        ))}
        {T.map((q, i) => <circle key={`k${i}`} cx={q.x} cy={q.y} r={0.16 * q.s} fill={K.claw} />)}
        <circle cx={K0.x} cy={K0.y} r={0.4 * K0.s} fill={tw(K.foot)} stroke={INK} strokeWidth={LINE_PX * 0.9} vectorEffect={NS} />
      </g>
    );
  };
  const Linkage: React.FC<{g: LegG; far?: boolean}> = ({g, far}) => {
    const k = far ? 0.12 : 0;
    const col = (c: string) => tw(mix(c, K.uwDeep, k), 0.12);
    const pin = P(g.pin), lev = P(g.lever), hip = P(g.hip), cr = P(g.crank0);
    const brA: V3 = [g.hip[0] - 0.4, MODULE.y0 + 0.2, g.side * 3.3], brB: V3 = [g.hip[0], g.hip[1], g.side * 3.3];
    return (
      <g>
        {/* printed bracket carrying the hip pivot */}
        <path d={capsule(brA, brB, 0.62, 0.55)} fill={col(K.printedSide)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
        {/* the leg's upper end (inside the hull) */}
        <path d={capsule(g.hip, g.exit, 0.45, 0.42)} fill={col(K.foot)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
        {/* crank arm on the output shaft */}
        <path d={capsule(g.crank0, g.pin, 0.42, 0.3)} fill={col(K.printed)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
        <circle cx={cr.x} cy={cr.y} r={0.24 * cr.s} fill={col(K.axle)} />
        {/* lever on the hip pivot */}
        <path d={capsule(g.hip, g.lever, 0.4, 0.3)} fill={col(K.printed)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
        {/* pushrod */}
        <path d={capsule(g.pin, g.lever, 0.2, 0.2)} fill={col(K.rod)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
        <path d={`M${P2(pin)} L${P2(lev)}`} stroke={col(K.rodLit)} strokeWidth={1.2} vectorEffect={NS} opacity={0.7} />
        <circle cx={pin.x} cy={pin.y} r={0.3 * pin.s} fill={col(K.rod)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
        <circle cx={pin.x} cy={pin.y} r={0.11 * pin.s} fill={col(K.axle)} />
        <circle cx={lev.x} cy={lev.y} r={0.28 * lev.s} fill={col(K.rod)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
        <circle cx={hip.x} cy={hip.y} r={0.36 * hip.s} fill={col(K.printed)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
        <circle cx={hip.x} cy={hip.y} r={0.14 * hip.s} fill={col(K.axle)} />
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
  for (let k = 1; k < 9; k++) layers.push(`M${x0 + 0.5},${fx(y0 + k * 0.4)} L${x1 - 0.5},${fx(y0 + k * 0.4)}`);
  const cov = (() => {
    const [ax, ay] = COVER.a, [bx, by] = COVER.b;
    return capsule2({x: ax, y: ay}, {x: bx, y: by}, COVER.r, COVER.r * 0.78);
  })();
  // ---- inner surface light: a gradient across the window (dark under the top lip)
  const wTop = P([WXc, -0.5, 6]), wBot = P([WXc, keelY(WXc) + 0.3, 5]);
  const tint = 0.2;
  return (
    <g opacity={ua}>
      <defs>
        <clipPath id={`${id}e`}><path d={underClipD(B, t)} /></clipPath>
        <clipPath id={`${id}h`}><path d={HV.below} /></clipPath>
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
        <g clipPath={`url(#${id}h)`}>
          <path d={HV.below} fill={tw(K.flank)} />
          <g fillRule="evenodd">
            <path d={R.belly} fill={tw(K.belly)} />
            <path d={R.stern} fill={tw(K.stern)} />
            <path d={R.breast} fill={tw(K.breast)} />
            <path d={R.shadow} fill={INK} opacity={0.2} />
            <path d={R.core} fill={INK} opacity={0.12} />
          </g>
          {/* the cutaway: inside the preserved skin, the printed drive */}
          {win && (
            <g clipPath={`url(#${id}w)`}>
              <path d={win} fill={`url(#${id}g)`} />
              <Linkage g={legs[1]} far />
              <path d={modSil} fill={tw(K.printedSide, tint)} stroke={INK} strokeWidth={LINE_PX * 1.3} vectorEffect={NS} strokeLinejoin="round" />
              <path d={modFace} fill={tw(K.printed, tint)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} strokeLinejoin="round" />
              <g transform={faceM}>
                <path d={layers.join(' ')} stroke={tw(K.printedLine, tint)} strokeWidth={0.7} vectorEffect={NS} opacity={0.35} />
                <rect x={x0 + 0.38} y={y0 + 0.38} width={x1 - x0 - 0.76} height={y1 - y0 - 0.76} rx={0.7} fill="none" stroke={tw(K.printedLine, tint)} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
                {[[x0 + 0.75, y0 + 0.75], [x1 - 0.75, y0 + 0.75], [x0 + 0.75, y1 - 0.75], [x1 - 0.75, y1 - 0.75]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={0.17} fill={tw('#7F939A', tint)} />
                ))}
              </g>
              <g transform={coverM}>
                <path d={cov} transform="translate(0.1,-0.12)" fill={tw(K.printedSide, tint)} />
                <path d={cov} fill={tw(lit(K.printed, 0.3), tint)} stroke={INK} strokeWidth={LINE_PX} vectorEffect={NS} />
                <circle cx={COVER.a[0]} cy={COVER.a[1]} r={0.82} fill={tw(K.printedSide, tint)} stroke={INK} strokeWidth={LINE_PX * 0.8} vectorEffect={NS} />
                <circle cx={COVER.a[0] - 0.06} cy={COVER.a[1] + 0.06} r={0.6} fill={tw(K.printed, tint)} />
                <circle cx={COVER.a[0]} cy={COVER.a[1]} r={0.18} fill={tw(K.printedLine, tint)} />
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
            <path d={win} fill="none" stroke={INK} strokeWidth={INK_PX * 0.75} vectorEffect={NS} strokeLinejoin="round" />
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
      <Reflection B={B} F={F} HV={HV} t={t} alpha={0.5 * surfVis * (1 - 0.6 * cut)} />
      <Wake B={B} F={F} o={o} t={t} amt={wake * surfVis} v={v} />
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
  floor: '#7D8158',
  weed: '#4F7E52',
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
      {clouds.length > 0 && (
        <g filter={`url(#${id}f)`} opacity={0.75}>
          {clouds.map((c, i) => <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={PC.cloud} />)}
        </g>
      )}
      {(trees || treesFar) && (
        <g filter={`url(#${id}f)`}>
          <path d={treesFar} fill={PC.treeFar} />
          <path d={trees} fill={PC.tree} />
          <rect x={-100} y={treeTop} width={W + 200} height={Math.max(0, treeBase - treeTop + 30)} fill={PC.tree} />
        </g>
      )}
      {reeds && (
        <g filter={`url(#${id}f)`}>
          <path d={reeds.mass[0]} fill={PC.massFar} />
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
  const fog = (p: V3) => 1 - Math.exp(-Math.max(0, -(p[2] - B.eye[2])) / 1100);
  // pond floor
  const floorL = lineAcross(B, FLOOR_Y, BANK_Z + 60);
  const floorD = `M-100,${fx(yOnLine(floorL, -100))} L${W + 100},${fx(yOnLine(floorL, W + 100))} L${W + 100},${H + 100} L-100,${H + 100} Z`;
  const fy = yOnLine(floorL, W / 2);
  // weeds (ribbons from the floor, fogged by distance)
  const wd = ['', '', ''];
  for (const [zr, bucket] of [[-850, 0], [-560, 1], [-300, 2]] as [number, number][]) {
    const [xa, xb] = visX(B, -30, zr, 120);
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
  // light shafts (from the surface, slanting down-right: light from the upper left)
  const shafts: string[] = [];
  {
    const [xa, xb] = visX(B, 0, -260, 300);
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
      const [xa, xb] = visX(B, -20, zr, 60);
      for (let k = Math.floor(xa / cell); k <= Math.ceil(xb / cell); k++) {
        for (let q = 0; q < 2; q++) {
          const hh = hash(k * 12.9 + q * 3.1 + zr);
          const p: V3 = [
            k * cell + hh * cell + 3 * Math.sin(t * 0.35 + hh * 20),
            -2 - 50 * hash(k * 5.7 + q + zr * 0.1) + 1.5 * Math.sin(t * 0.5 + hh * 13),
            zr + (hash(k * 1.1 + q * 7 + zr) - 0.5) * 60,
          ];
          const c = proj(B, p);
          if (c.y < ey + 4) continue;
          const r = (0.18 + 0.22 * hash(hh * 91)) * c.s;
          if (fog(p) > 0.45) m1 += circ(c.x, c.y, r); else m2 += circ(c.x, c.y, r);
        }
      }
    }
  }
  return (
    <g opacity={uw}>
      <defs>
        <clipPath id={`${id}c`}><path d={underClipD(B, t)} /></clipPath>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={0} y1={ey} x2={0} y2={H}>
          <stop offset={0} stopColor={PC.uwTop} />
          <stop offset={0.28} stopColor={PC.uwMid} />
          <stop offset={1} stopColor={PC.uwLow} />
        </linearGradient>
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1={0} y1={fy} x2={0} y2={H}>
          <stop offset={0} stopColor={mix(PC.floor, PC.uwMid, 0.85)} stopOpacity={0} />
          <stop offset={0.35} stopColor={mix(PC.floor, PC.uwMid, 0.75)} stopOpacity={0.6} />
          <stop offset={1} stopColor={mix(PC.floor, PC.uwLow, 0.45)} stopOpacity={0.9} />
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
          <path d={wd[1]} fill={mix(PC.weed, PC.uwMid, 0.6)} />
          <path d={wd[2]} fill={mix(PC.weed, PC.uwMid, 0.45)} />
        </g>
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
  const e = edgeLine(B, t);
  const line = `M${e.map(P2).join(' L')}`;
  // glints on the near water (in front of the duck), drawn over its reflection
  let gl = '';
  if (uw < 0.98) {
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
  const eMid = e[Math.floor(e.length / 2)].y;
  return (
    <g>
      {gl && <path d={gl} stroke="#FFFFFF" strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" opacity={0.45 * (1 - uw)} fill="none" />}
      {uw > 0.01 && (
        <g opacity={uw}>
          <defs>
            <linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1={0} y1={eMid} x2={0} y2={eMid + 26}>
              <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.55} />
              <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${line} L${W + 90},${fx(eMid + 30)} L-90,${fx(eMid + 30)} Z`} fill={`url(#${id}h)`} />
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
 *  'under' = the underwater volume behind the glass plane (fades in at the waterline); 'surface' = the frame's
 *  waterline edge (split view) and near ripple glints; 'front' = soft foreground water (bokeh, vignette).
 *  Film order: back, under, <Duck/>, surface, front. */
export const Pond: React.FC<{B: Basis; t: number; layer: 'back' | 'surface' | 'under' | 'front'}> = ({B, t, layer}) => {
  if (layer === 'back') return <PondBack B={B} t={t} />;
  if (layer === 'under') return <PondUnder B={B} t={t} />;
  if (layer === 'surface') return <PondSurface B={B} t={t} />;
  return <PondFront B={B} t={t} />;
};
