// V2 liquid-metal engine: volume-conserving choreography helpers (2D, any plane: screen px or floor units).
//
// Every helper returns prims for ChromeBody (or floorPrims) whose smooth union keeps a FIXED total area: the shapes
// are built from a schedule (mass passed through a gap, melt progress per part, ...), then one scale variable (the
// size of the source / pool blobs) is solved numerically each frame (secant on the marched area) so the union's area
// equals the target. Streams neck and stretch, they never shrink the body; droplets leave the stream and land back in
// the pool (merging); everything is a pure function of its inputs (no randomness, no state).
import {Cam3, P3} from '../../world';
import {clamp, noise1, ss} from '../../lib';
import {Prim, Prim3, primBox, sdPrim, smin} from './sdf';
import {lattice, loopsArea, marchLoops} from './march';

export type V = {x: number; y: number};
export type Circle = {x: number; y: number; r: number};
/** a gap: centre, unit axis (the direction of flow through it), clear width */
export type GapSpec = {x: number; y: number; ax: number; ay: number; w: number};

// ---------------------------------------------------------------------------------------------------------------
// area of a smooth union (marching squares on a coarse lattice, linear edge interpolation: ~0.5 % accurate)
export const unionArea = (prims: Prim[], blend: number, cellK = 80): number => {
  if (!prims.length) return 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of prims) {
    const b = primBox(p);
    x0 = Math.min(x0, b.x0);
    y0 = Math.min(y0, b.y0);
    x1 = Math.max(x1, b.x1);
    y1 = Math.max(y1, b.y1);
  }
  const size = Math.max(x1 - x0, y1 - y0, 1e-3);
  const c = size / cellK;
  const L = lattice({x0: x0 - 2 * c, y0: y0 - 2 * c, x1: x1 + 2 * c, y1: y1 + 2 * c}, c);
  const v = new Float32Array(L.nx * L.ny);
  for (let j = 0; j < L.ny; j++) {
    const y = L.y0 + j * c;
    for (let i = 0; i < L.nx; i++) {
      const x = L.x0 + i * c;
      let a = 1e9;
      for (const p of prims) a = smin(a, sdPrim(p, x, y), p.blend ?? blend);
      v[j * L.nx + i] = a;
    }
  }
  return loopsArea(marchLoops(v, L, 0));
};

/** solve build(a) so that unionArea = target (secant, monotone in a). Returns the prims and the achieved area. */
export const calibrate = (build: (a: number) => Prim[], blend: number, target: number, a0 = 1, lo = 0, hi = 3, iters = 5) => {
  let xa = a0, xb = a0 * 0.9 + 0.01;
  let fa = unionArea(build(xa), blend) - target, fb = unionArea(build(xb), blend) - target;
  for (let k = 0; k < iters; k++) {
    if (Math.abs(fb) < target * 0.002) break;
    const den = fb - fa;
    let xn = Math.abs(den) < 1e-9 ? xb : xb - (fb * (xb - xa)) / den;
    xn = clamp(xn, lo, hi);
    xa = xb;
    fa = fb;
    xb = xn;
    fb = unionArea(build(xb), blend) - target;
  }
  const prims = build(xb);
  return {prims, a: xb, area: fb + target};
};

// ---------------------------------------------------------------------------------------------------------------
// paths (Catmull-Rom through control points, arc-length parametrised)
export type Path = {pts: V[]; s: number[]; len: number; at: (s: number) => V; tan: (s: number) => V};
export const makePath = (ctrl: V[], n = 24): Path => {
  const pts: V[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      pts.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const len = s[s.length - 1];
  const find = (q: number) => {
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (s[m] <= q) lo = m;
      else hi = m;
    }
    return lo;
  };
  const at = (q: number): V => {
    if (q <= 0) {
      const t = tan(0);
      return {x: pts[0].x + t.x * q, y: pts[0].y + t.y * q};
    }
    if (q >= len) {
      const t = tan(len);
      return {x: pts[pts.length - 1].x + t.x * (q - len), y: pts[pts.length - 1].y + t.y * (q - len)};
    }
    const i = find(q);
    const u = (q - s[i]) / Math.max(1e-9, s[i + 1] - s[i]);
    return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u};
  };
  const tan = (q: number): V => {
    const i = Math.min(pts.length - 2, find(clamp(q, 0, len)));
    const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    const l = Math.hypot(dx, dy) || 1;
    return {x: dx / l, y: dy / l};
  };
  return {pts, s, len, at, tan};
};

/** a tube of capsules along a path between arc lengths s0..s1 with radius profile r(s) */
export const tube = (P: Path, s0: number, s1: number, r: (s: number) => number, step: number, extra: Partial<Prim> = {}): Prim[] => {
  const out: Prim[] = [];
  if (s1 - s0 < 1e-3) return out;
  const n = Math.max(1, Math.ceil((s1 - s0) / Math.max(step, 0.5)));
  let prev = P.at(s0), pr = r(s0);
  for (let k = 1; k <= n; k++) {
    const q = s0 + ((s1 - s0) * k) / n;
    const p = P.at(q), rr = r(q);
    if (pr > 0.05 || rr > 0.05) out.push({k: 'cap', ax: prev.x, ay: prev.y, bx: p.x, by: p.y, ra: Math.max(0, pr), rb: Math.max(0, rr), ...extra} as Prim);
    prev = p;
    pr = rr;
  }
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// droplets that detach and merge back: a drop leaves the stream at `from`, flies an arc bulging to `side`, lands in
// the pool at `to`. k = 0..1 progress (0: still in the stream, 1: merged into the pool).
export const dropletArc = (from: V, to: V, side: V, k: number, r: number): Prim | null => {
  if (k <= 0 || k >= 1) return null;
  const e = k * k * (3 - 2 * k);
  const b = 4 * e * (1 - e);
  const x = from.x + (to.x - from.x) * e + side.x * b;
  const y = from.y + (to.y - from.y) * e + side.y * b;
  // a drop is slightly stretched along its motion while it is near the stream / pool, round in flight
  return {k: 'c', x, y, r: r * (0.85 + 0.15 * Math.sin(Math.PI * k))};
};

// ---------------------------------------------------------------------------------------------------------------
export type StreamOpts = {
  /** the body before the gap (its area is the conserved area) */
  start: Circle;
  gap: GapSpec;
  /** where the pool collects */
  dest: V;
  /** progress 0..1 (0: whole body before the gap, 1: whole body in the pool) */
  u: number;
  t?: number;
  /** smooth-min radius (default 0.5 * gap width) */
  blend?: number;
  /** stream radius at the neck as a fraction of the gap's clear width (diameter = 2 * neck * w < w). Default 0.36 */
  neck?: number;
  /** number of droplets that detach and merge back (default 2) */
  drops?: number;
  seed?: number;
  /** squash of the source / pool blobs (ry/rx; < 1 for a puddle seen from an angle). Default 1 */
  squash?: number;
  /** override the conserved area (default pi * start.r^2) */
  area?: number;
};
export type StreamOut = {prims: Prim[]; blend: number; area: number; target: number; source: Circle; pool: Circle; path: Path};

const blobPrim = (c: V, r: number, sq: number, t: number, seed: number): Prim[] => {
  if (r < 0.05) return [];
  if (sq === 1) return [{k: 'c', x: c.x, y: c.y, r}];
  return [{k: 'ell', x: c.x, y: c.y, rx: r / Math.sqrt(sq), ry: r * Math.sqrt(sq), rot: 3 * noise1(t * 0.5, seed)}];
};

/** a body of fixed area flowing along a path through a gap of width g: it necks to < g, stretches into a CONTINUOUS
 *  stream and collects into a pool on the far side. */
export const streamThroughGap = (o: StreamOpts): StreamOut => {
  const {start, gap, dest} = o;
  const u = clamp(o.u), t = o.t ?? 0, seed = o.seed ?? 1, sq = o.squash ?? 1;
  const w = gap.w;
  const blend = o.blend ?? w * 0.5;
  const neck = clamp(o.neck ?? 0.36, 0.05, 0.49);
  const A0 = o.area ?? Math.PI * start.r * start.r;
  const r0 = Math.sqrt(A0 / Math.PI);
  const G = {x: gap.x, y: gap.y};
  const ax = gap.ax, ay = gap.ay;
  const Gin = {x: G.x - ax * w * 0.9, y: G.y - ay * w * 0.9}, Gout = {x: G.x + ax * w * 0.9, y: G.y + ay * w * 0.9};
  const P = makePath([{x: start.x, y: start.y}, Gin, G, Gout, dest]);
  // arc length of the gap centre
  let sG = 0, best = 1e9;
  for (let i = 0; i < P.pts.length; i++) {
    const d = Math.hypot(P.pts[i].x - G.x, P.pts[i].y - G.y);
    if (d < best) {
      best = d;
      sG = P.s[i];
    }
  }
  const sD = P.len;
  const m = ss(u, 0.1, 0.94); // mass fraction that has passed the gap
  const build = (a: number): Prim[] => {
    const rs = r0 * Math.sqrt(Math.max(0, 1 - m) * a);
    const rp = r0 * Math.sqrt(m * a);
    const sS = (sG - 0.8 * rs - 0.3 * w) * ss(u, 0, 0.14);
    const sF = sS + 0.4 * rs + (sD - sS - 0.4 * rs) * ss(u, 0.02, 0.5);
    const sP = clamp(sF - 0.4 * rp, Math.min(sD, sG + 0.35 * w + 0.7 * rp), sD);
    const s1 = Math.max(sS, Math.min(sF, sP));
    // as the source empties, its last bit and the stream's tail retract through the gap into the pool (never a
    // stray drop left behind the bars, never a tail vanishing in place)
    const sT = sS + (s1 - sS) * ss(u, 0.6, 0.9);
    const src = P.at(sT), pool = P.at(sP);
    // stream radius: limited by the gap (neck) and by what is left in the source (the tail thins as it empties)
    const rMax = Math.min(0.5 * w, 0.75 * r0) * Math.min(1, 1.25 * rs / Math.max(1e-6, r0 * 0.35));
    const tail = ss(u, 0.0, 0.06);
    const prof = (s: number) => {
      const dn = Math.abs(s - sG) / (0.9 * w);
      const nk = dn < 1 ? neck * w + (rMax - neck * w) * ss(dn, 0, 1) : rMax;
      const rr = Math.min(rMax, nk);
      // taper at the leading tip (before the pool has formed)
      const tip = clamp((sF - s) / Math.max(1e-6, 0.8 * w));
      return rr * tail * (0.55 + 0.45 * Math.min(1, tip * 1.4)) * (1 + 0.05 * noise1(s * 0.05 - t * 3, seed));
    };
    const out: Prim[] = [...blobPrim(src, rs, sq, t, seed), ...blobPrim(pool, rp, sq, t, seed + 5)];
    if (u > 0 && u < 1 && rMax * tail > 0.05 && s1 - sT > 1e-3) out.push(...tube(P, sT, s1, prof, Math.max(1.5, rMax * 0.8)));
    // droplets: leave the stream just past the gap, arc out to one side and land back in the pool
    const nd = o.drops ?? 2;
    for (let k = 0; k < nd; k++) {
      const ua = 0.3 + 0.38 * (k / Math.max(1, nd)) + 0.04 * Math.sin(seed * 3.1 + k);
      const kk = (u - ua) / 0.22;
      const from = P.at(sG + 0.9 * w), to = P.at(sP - 0.2 * rp);
      const tn = P.tan(sG + 0.9 * w);
      const sd = k % 2 === 0 ? 1 : -1;
      const lift = (0.7 + 0.3 * k) * w;
      const d = dropletArc(from, to, {x: -tn.y * sd * lift, y: tn.x * sd * lift}, kk, Math.max(0.6, 0.3 * neck * w * 2));
      if (d) out.push(d);
    }
    return out;
  };
  const cal = calibrate(build, blend, A0, 1, 0, 1.5, 6);
  const rsF = r0 * Math.sqrt(Math.max(0, 1 - m) * cal.a), rpF = r0 * Math.sqrt(m * cal.a);
  const sS = (sG - 0.8 * rsF - 0.3 * w) * ss(u, 0, 0.14);
  const sF = sS + 0.4 * rsF + (sD - sS - 0.4 * rsF) * ss(u, 0.02, 0.5);
  const sP = clamp(sF - 0.4 * rpF, Math.min(sD, sG + 0.35 * w + 0.7 * rpF), sD);
  const sc = P.at(sS), pc = P.at(sP);
  return {prims: cal.prims, blend, area: cal.area, target: A0, source: {x: sc.x, y: sc.y, r: rsF}, pool: {x: pc.x, y: pc.y, r: rpF}, path: P};
};

/** the same body split over several gaps at once (the lab cage: liquid streams through every opening near the magnet
 *  and re-merges outside). share[i] = fraction of the mass through gap i (default equal). */
export const streamThroughGaps = (o: Omit<StreamOpts, 'gap'> & {gaps: GapSpec[]; share?: number[]}): StreamOut => {
  const n = o.gaps.length;
  const share = o.share ?? o.gaps.map(() => 1 / n);
  const A0 = o.area ?? Math.PI * o.start.r * o.start.r;
  const u = clamp(o.u);
  const blend = o.blend ?? Math.min(...o.gaps.map((g) => g.w)) * 0.5;
  const parts: StreamOut[] = o.gaps.map((g, i) =>
    streamThroughGap({...o, gap: g, area: A0 * share[i], u: clamp(u * (1 + 0.08 * i) - 0.04 * i), drops: i === 0 ? o.drops ?? 2 : 1, seed: (o.seed ?? 1) + i * 7}),
  );
  // the sub-bodies overlap in the source and in the pool: re-solve one common scale on all blob radii for the total
  const build = (a: number) => parts.flatMap((p) => p.prims.map((q) => scaleBlob(q, p, a)));
  const cal = calibrate(build, blend, A0, 1, 0.2, 3, 6);
  return {prims: cal.prims, blend, area: cal.area, target: A0, source: parts[0].source, pool: parts[0].pool, path: parts[0].path};
};
const scaleBlob = (q: Prim, p: StreamOut, a: number): Prim => {
  const isBlob = (c: Circle) => q.k === 'c' && Math.abs(q.x - c.x) < 1e-6 && Math.abs(q.y - c.y) < 1e-6;
  const isEll = (c: Circle) => q.k === 'ell' && Math.abs(q.x - c.x) < 1e-6 && Math.abs(q.y - c.y) < 1e-6;
  const k = Math.sqrt(a);
  if (isBlob(p.source) || isBlob(p.pool)) return {...q, r: (q as {r: number}).r * k} as Prim;
  if (isEll(p.source) || isEll(p.pool)) return {...q, rx: (q as {rx: number}).rx * k, ry: (q as {ry: number}).ry * k} as Prim;
  return q;
};

// ---------------------------------------------------------------------------------------------------------------
/** a spreading pool with a living edge (lobes) and ripple rings (draw `ripples` as thin light ellipses on top) */
export const puddle = (o: {x: number; y: number; R: number; squash?: number; t: number; seed?: number; ripple?: number; lobes?: number}) => {
  const sq = o.squash ?? 1, seed = o.seed ?? 3, n = o.lobes ?? 7;
  const A0 = Math.PI * o.R * o.R * sq;
  const build = (a: number): Prim[] => {
    const R = o.R * Math.sqrt(a);
    const out: Prim[] = [{k: 'ell', x: o.x, y: o.y, rx: R * 0.86, ry: R * 0.86 * sq, rot: 0}];
    for (let i = 0; i < n; i++) {
      const an = (i / n) * Math.PI * 2 + 0.3 * noise1(o.t * 0.4 + i, seed);
      const rr = R * (0.32 + 0.06 * noise1(o.t * 0.7 + i * 1.7, seed + 1));
      const dd = R * 0.66;
      out.push({k: 'ell', x: o.x + Math.cos(an) * dd, y: o.y + Math.sin(an) * dd * sq, rx: rr, ry: rr * sq, rot: 0});
    }
    return out;
  };
  const blend = o.R * 0.35;
  const cal = calibrate(build, blend, A0, 1, 0.2, 2, 7);
  const rip = clamp(o.ripple ?? 0);
  const ripples: {cx: number; cy: number; rx: number; ry: number; op: number}[] = [];
  if (rip > 0) {
    for (let k = 0; k < 3; k++) {
      const ph = (o.t * 0.7 + k / 3) % 1;
      const r = o.R * (0.12 + 0.62 * ph);
      ripples.push({cx: o.x, cy: o.y, rx: r, ry: r * sq, op: rip * Math.sin(Math.PI * ph) * 0.7});
    }
  }
  return {prims: cal.prims, blend, area: cal.area, target: A0, ripples};
};

// ---------------------------------------------------------------------------------------------------------------
/** rigid -> pool under gravity. prims in a plane with y DOWN and the floor at y = floor.
 *  The structure loses rigidity from the TOP (and the limbs) first and SAGS: one continuous deformation of the plane
 *  compresses each horizontal band vertically (top bands first), while the material it loses runs down into a FLAT
 *  pool spreading on the floor (a thin floor ellipse, `flat` = 1, radius growing to `poolR1`). Bands widen only a
 *  little and the LOWER bands widen more than the upper ones, so the silhouette is never top-heavy (no mushroom
 *  stage): it reads as a soft metal statue sagging into its own puddle. Parts round off into liquid lumps and turn
 *  flat as they are squashed. A global scale on the figure (not the pool) is solved so the frontal area follows the
 *  target: the rigid area until the pool starts to spread, then easing to `areaEnd` x it, because from then on the
 *  material's volume is carried by the floor pool's DEPTH as it spreads (the caller's perspective floor disc of radius poolR). */
export const collapse = (o: {
  prims: Prim[];
  u: number;
  floor: number;
  t?: number;
  cx?: number;
  /** per-prim extra early start (0..0.3), e.g. limbs */
  delay?: number[];
  blendRigid: number;
  blendLiquid: number;
  /** final vertical squash of the figure (0.95: 5 % of its height is left, inside the pool) */
  flat?: number;
  /** target area (default: the rigid union's area) */
  area?: number;
  seed?: number;
  thick?: number;
  /** the pool's final half width (same units as the prims). Default 2.6 x the figure's half width */
  poolR1?: number;
  /** frontal area at u = 1 as a fraction of the rigid area (the rest is in the pool's depth). Default 0.42 */
  areaEnd?: number;
}) => {
  const u = clamp(o.u), t = o.t ?? 0, seed = o.seed ?? 2;
  const boxes = o.prims.map(primBox);
  const top = Math.min(...boxes.map((b) => b.y0));
  const y1 = o.floor;
  const H = Math.max(1e-3, y1 - top);
  const x0 = Math.min(...boxes.map((b) => b.x0)), x1 = Math.max(...boxes.map((b) => b.x1));
  const cx = o.cx ?? (x0 + x1) / 2;
  const A0 = o.area ?? unionArea(o.prims, o.blendRigid);
  const poolR1 = o.poolR1 ?? 2.6 * Math.max(cx - x0, x1 - cx);
  const target = A0 * (1 - (1 - (o.areaEnd ?? 0.42)) * ss(u, 0.15, 1));
  // the blend radius grows as the structure goes liquid, then shrinks with the pool's thickness
  const blend = (o.blendRigid + (o.blendLiquid - o.blendRigid) * ss(u, 0.05, 0.55)) * (1 - 0.72 * ss(u, 0.45, 1));
  const flat = o.flat ?? 0.95;
  // comp(h) for h = height above the floor (0..H): the top first, the base last
  const comp = (h: number) => {
    const hn = clamp(h / H);
    const st = 0.3 * (1 - hn);
    return flat * ss(u, st, st + 0.7);
  };
  const N = 96;
  const Yt: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const h0 = ((i - 1) / N) * H * 1.2, h1 = (i / N) * H * 1.2;
    Yt.push(Yt[i - 1] + (h1 - h0) * (1 - comp((h0 + h1) / 2)));
  }
  const Yof = (h: number) => {
    const f = clamp(h / (H * 1.2)) * N;
    const i = Math.min(N - 1, Math.floor(f));
    return Yt[i] + (Yt[i + 1] - Yt[i]) * (f - i);
  };
  const wob = (h: number) => 0.03 * H * ss(u, 0.05, 0.4) * (1 - ss(u, 0.8, 1)) * noise1(((h * 0.9) / H) * 6 + t * 1.6, seed);
  // widening: small, and larger for the lower bands (the slumping mass spreads at the base, never at the top)
  const mapP = (x: number, y: number) => {
    const h = y1 - y;
    const hn = clamp(h / H);
    const c = comp(h);
    // material running down the sagging body accumulates at the base: the lower bands spread early (the legs merge
    // into a wide foot of liquid), the top hardly widens
    const sx = 1 + c * 0.08 + Math.pow(1 - hn, 1.5) * 0.9 * ss(u, 0.08, 0.6);
    return {x: cx + (x - cx) * sx + wob(h), y: y1 - Yof(h), sx, sy: 1 - c};
  };
  const mapOne = (p: Prim, i: number): Prim => {
    const b = boxes[i];
    const pc = mapP((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    const mu = ss(1 - pc.sy, 0.02, 0.4);
    let rigid: Prim;
    switch (p.k) {
      case 'c': {
        const q = mapP(p.x, p.y);
        rigid = {...p, k: 'ell', x: q.x, y: q.y, rx: p.r * Math.sqrt(q.sx), ry: p.r * q.sy, rot: 0};
        break;
      }
      case 'cap': {
        const a = mapP(p.ax, p.ay), c = mapP(p.bx, p.by);
        const k = Math.sqrt(((a.sx + c.sx) / 2) * ((a.sy + c.sy) / 2));
        rigid = {...p, ax: a.x, ay: a.y, bx: c.x, by: c.y, ra: p.ra * Math.min(1, Math.sqrt(a.sy) * k), rb: p.rb * Math.min(1, Math.sqrt(c.sy) * k)};
        break;
      }
      case 'box': {
        // map the top and bottom edges (neighbouring parts stay in contact), width from the band
        const q = mapP(p.x, p.y), qt = mapP(p.x, p.y - p.hh), qb = mapP(p.x, p.y + p.hh);
        const hh = Math.max(1e-3, (qb.y - qt.y) / 2), hw = p.hw * Math.max(q.sx, (qt.sx + qb.sx) / 2);
        rigid = {...p, x: q.x, y: (qt.y + qb.y) / 2, hw, hh, r: Math.min(p.r + hh * mu * 0.35, hh, hw)};
        break;
      }
      case 'trap': {
        const q = mapP(p.x, p.y), qt = mapP(p.x, p.y - p.hh), qb = mapP(p.x, p.y + p.hh);
        rigid = {...p, x: q.x, y: (qt.y + qb.y) / 2, wt: p.wt * qt.sx, wb: p.wb * qb.sx, hh: Math.max(1e-3, (qb.y - qt.y) / 2), r: Math.min(p.r, Math.max(1e-3, (qb.y - qt.y) / 2))};
        break;
      }
      case 'ell': {
        const q = mapP(p.x, p.y);
        rigid = {...p, x: q.x, y: q.y, rx: p.rx * q.sx, ry: p.ry * q.sy};
        break;
      }
      default: {
        const q = mapP((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
        rigid = shiftPrim(p, q.x - (b.x0 + b.x1) / 2, q.y - (b.y0 + b.y1) / 2);
      }
    }
    // each prim's own blend follows its own melt, so still-rigid parts (legs) stay separate while the top flows
    const pb = Math.max(o.blendRigid + (blend - o.blendRigid) * ss(1 - pc.sy, 0.02, 0.3), (o.blendRigid + 0.25 * (o.blendLiquid - o.blendRigid)) * ss(u, 0.01, 0.15) * (1 - 0.6 * ss(u, 0.5, 1)));
    // squashed parts are lying in the pool: they shade flat
    const fl = ss(1 - pc.sy, 0.7, 0.92) * (1 - ss(y1 - pc.y, 0.06 * H, 0.16 * H));
    rigid = {...rigid, blend: pb, flat: fl};
    if (mu <= 0.001) return rigid;
    // liquid lump spanning the same extents (so neighbouring parts stay in contact while they round off)
    const rb = primBox(rigid);
    const lx = (rb.x0 + rb.x1) / 2, ly = (rb.y0 + rb.y1) / 2, lw = ((rb.x1 - rb.x0) / 2) * 1.03, lh = ((rb.y1 - rb.y0) / 2) * 1.03;
    const lump: Prim =
      p.k === 'box' || p.k === 'trap' ? {k: 'box', x: lx, y: ly, hw: lw, hh: lh, r: Math.min(lw, lh) * 0.96, rot: 0} : {k: 'ell', x: lx, y: ly, rx: lw, ry: lh, rot: 0};
    return {k: 'mix', a: rigid, b: lump, t: mu, g: p.g, z: p.z, blend: pb, flat: fl};
  };
  const mapped = o.prims.map(mapOne);
  // limbs (delay > 0) fold in toward the body early (arms droop into the torso)
  const folded = mapped.map((p, i) => {
    const e = o.delay?.[i] ?? 0;
    if (!e) return p;
    const k = ss(u, 0, 0.35) * e * 2;
    const b = primBox(p);
    const px = (b.x0 + b.x1) / 2;
    return shiftPrim(p, (cx - px) * 0.35 * k, (b.y1 - b.y0) * 0.25 * k);
  });
  // the pool: a thin flat ellipse on the floor, spreading from under the feet
  const pr = poolR1 * Math.pow(ss(u, 0.12, 1), 0.8);
  const ph = Math.max(0.02 * H, Math.min(0.055 * H, pr * 0.12));
  const pool: Prim | null = pr > 0.02 * H ? {k: 'ell', x: cx, y: y1 - ph * 0.55, rx: pr, ry: ph, rot: 0, flat: 1, blend: Math.min(blend, ph * 1.5)} : null;
  const build = (a: number): Prim[] => {
    const f = folded.map((p) => scalePrim(p, cx, y1, a));
    return pool ? [...f, pool] : f;
  };
  const cal = calibrate(build, blend, target, 1, 0.2, 1.12, 6);
  return {prims: cal.prims, blend, area: cal.area, target, poolR: pr};
};

/** scale a prim about (ox, oy) by sqrt(a) (area factor a) */
export const scalePrim = (p: Prim, ox: number, oy: number, a: number): Prim => {
  const k = Math.sqrt(a);
  const X = (x: number) => ox + (x - ox) * k, Y = (y: number) => oy + (y - oy) * k;
  switch (p.k) {
    case 'c':
      return {...p, x: X(p.x), y: Y(p.y), r: p.r * k};
    case 'cap':
      return {...p, ax: X(p.ax), ay: Y(p.ay), bx: X(p.bx), by: Y(p.by), ra: p.ra * k, rb: p.rb * k};
    case 'box':
      return {...p, x: X(p.x), y: Y(p.y), hw: p.hw * k, hh: p.hh * k, r: p.r * k};
    case 'ell':
      return {...p, x: X(p.x), y: Y(p.y), rx: p.rx * k, ry: p.ry * k};
    case 'trap':
      return {...p, x: X(p.x), y: Y(p.y), wt: p.wt * k, wb: p.wb * k, hh: p.hh * k, r: p.r * k};
    case 'aff':
      return {...p, x: X(p.x), y: Y(p.y), ux: p.ux * k, uy: p.uy * k, vx: p.vx * k, vy: p.vy * k};
    case 'mix':
      return {...p, a: scalePrim(p.a, ox, oy, a), b: scalePrim(p.b, ox, oy, a)};
    case 'sup':
      return {...p, x: X(p.x), y: Y(p.y), rx: p.rx * k, ryT: p.ryT * k, ryB: p.ryB * k};
  }
};

/** translate any prim */
export const shiftPrim = (p: Prim, dx: number, dy: number): Prim => {
  switch (p.k) {
    case 'c':
    case 'box':
    case 'ell':
    case 'trap':
    case 'aff':
    case 'sup':
      return {...p, x: p.x + dx, y: p.y + dy};
    case 'cap':
      return {...p, ax: p.ax + dx, ay: p.ay + dy, bx: p.bx + dx, by: p.by + dy};
    case 'mix':
      return {...p, a: shiftPrim(p.a, dx, dy), b: shiftPrim(p.b, dx, dy)};
  }
};

// ---------------------------------------------------------------------------------------------------------------
/** lay 2D prims (x -> world x, y -> world d) on the floor plane h = h0 as flat discs with a little thickness
 *  (each disc twice: at h0 and h0 + thick, so a low camera sees the liquid's edge). Capsules become disc chains. */
export const floorPrims = (prims: Prim[], h0 = 0, thick = 0.15, g?: number): Prim3[] => {
  const out: Prim3[] = [];
  const disc = (x: number, d: number, rx: number, rd: number, rot = 0) => {
    const p: P3 = {x, h: h0, d};
    out.push({k: 'disc3', p, rx, rd, rot, g});
    if (thick > 0) out.push({k: 'disc3', p: {...p, h: h0 + thick}, rx: rx * 0.97, rd: rd * 0.97, rot, g});
  };
  for (const q of prims) {
    if (q.k === 'c') disc(q.x, q.y, q.r, q.r);
    else if (q.k === 'ell') disc(q.x, q.y, q.rx, q.ry, q.rot);
    else if (q.k === 'cap') {
      const L = Math.hypot(q.bx - q.ax, q.by - q.ay);
      const n = Math.max(1, Math.ceil(L / Math.max(0.05, Math.min(q.ra, q.rb) * 0.7)));
      for (let k = 0; k <= n; k++) {
        const e = k / n;
        const r = q.ra + (q.rb - q.ra) * e;
        if (r > 0.01) disc(q.ax + (q.bx - q.ax) * e, q.ay + (q.by - q.ay) * e, r, r);
      }
    }
  }
  return out;
};

/** convenience: the camera-projected floor prims */
export type FloorCam = Cam3;
