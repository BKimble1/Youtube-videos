/**
 * Exact optics / geometry primitives for Video 02, in PLAN space (metres).
 *
 * Plan coordinates (DIRECTION.md §2): x to the right, z = distance from the relay wall toward the camera (wall at
 * z = 0). Angles are measured in the plan as atan2(dz, dx): 0 = +x, π/2 = +z (away from the wall, into the room).
 *
 * Pure TypeScript, no React, no randomness except the seeded `rand` from lib/anim, so every result is a pure function
 * of its inputs (renders are deterministic). Drawing components live in components/v02/Optics.tsx and take a
 * `toPx(p)` mapping, so they work in the plan view, the oblique room view or anything in between.
 */
import layoutJson from '../data/layout.json';
import {rand} from './anim';

/* ------------------------------------------------------------------ types */

/** A point (or vector) in plan space, metres. `id` optionally names it (used in error messages). */
export type P2 = {x: number; z: number; id?: string};

/** The parts of layout.json the optics need (structural, so a verified replacement layout fits too). */
export type OpticsLayout = {
  room: {x0: number; x1: number; z0: number; z1: number};
  relayWall: {x0: number; x1: number; z: number};
  occluder: {x: number; z0: number; z1: number; thickness: number};
  sensor: {x: number; z: number};
  hidden: {x: number; z: number};
  wallSamples: {id: string; x: number}[];
  c_m_per_ns: number;
};

/** Axis-aligned rectangle in plan space. */
export type Rect = {x0: number; x1: number; z0: number; z1: number};

/** The provisional layout (data/layout.json). */
export const LAYOUT: OpticsLayout = layoutJson;

/* ------------------------------------------------------------------ vector helpers */

export const add = (a: P2, b: P2): P2 => ({x: a.x + b.x, z: a.z + b.z});
export const sub = (a: P2, b: P2): P2 => ({x: a.x - b.x, z: a.z - b.z});
export const scale = (a: P2, k: number): P2 => ({x: a.x * k, z: a.z * k});
export const dot = (a: P2, b: P2) => a.x * b.x + a.z * b.z;
/** 2D cross product (z-component of a × b with x→x, z→y). */
export const cross = (a: P2, b: P2) => a.x * b.z - a.z * b.x;
export const len = (a: P2) => Math.hypot(a.x, a.z);
export const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.z - b.z);
export const normalize = (a: P2): P2 => {
  const l = len(a);
  return l > 0 ? {x: a.x / l, z: a.z / l} : {x: 0, z: 0};
};
export const lerpP = (a: P2, b: P2, t: number): P2 => ({x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t});
/** Point at plan angle `a` on the circle (center, r). */
export const polar = (center: P2, r: number, a: number): P2 => ({x: center.x + r * Math.cos(a), z: center.z + r * Math.sin(a)});
const pname = (p: P2, i: number) => p.id ?? `P${i}`;
const fmt = (p: P2) => `(${p.x.toFixed(3)}, ${p.z.toFixed(3)})`;

/* ------------------------------------------------------------------ named layout points */

/** Sensor S, hidden person H and the wall sample points W1..Wn of a layout, as named plan points. */
export const layoutPoints = (layout: OpticsLayout = LAYOUT) => ({
  S: {x: layout.sensor.x, z: layout.sensor.z, id: 'S'} as P2,
  H: {x: layout.hidden.x, z: layout.hidden.z, id: 'H'} as P2,
  W: layout.wallSamples.map((w) => ({x: w.x, z: layout.relayWall.z, id: w.id}) as P2),
});

/** The confocal path S → W → H → W → S for one wall point. */
export const confocalPath = (S: P2, W: P2, H: P2): P2[] => [S, W, H, W, S];

/* ------------------------------------------------------------------ intersections and occlusion */

export type SegHit = {t: number; u: number; p: P2};

/**
 * Proper segment–segment intersection of [a, b] and [c, d]. Returns the parameters t (along ab) and u (along cd) in
 * [0, 1] and the point, or null when they do not meet. Parallel segments return null (collinear overlap is handled by
 * the rectangle test in segmentBlocked, which also tests containment).
 */
export const segmentIntersection = (a: P2, b: P2, c: P2, d: P2, eps = 1e-12): SegHit | null => {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = cross(r, s);
  if (Math.abs(den) < eps) return null;
  const ca = sub(c, a);
  const t = cross(ca, s) / den;
  const u = cross(ca, r) / den;
  if (t < -eps || t > 1 + eps || u < -eps || u > 1 + eps) return null;
  return {t, u, p: add(a, scale(r, t))};
};

export const pointInRect = (p: P2, r: Rect) => p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1;

/** The occluder as a rectangle: x ± thickness/2, z0..z1, grown by `margin` metres on every side. */
export const occluderRect = (layout: OpticsLayout = LAYOUT, margin = 0): Rect => ({
  x0: layout.occluder.x - layout.occluder.thickness / 2 - margin,
  x1: layout.occluder.x + layout.occluder.thickness / 2 + margin,
  z0: layout.occluder.z0 - margin,
  z1: layout.occluder.z1 + margin,
});

/** The room floor as a rectangle. */
export const roomRect = (layout: OpticsLayout = LAYOUT): Rect => ({...layout.room});

/** The four edges of a rectangle as segments. */
export const rectEdges = (r: Rect): [P2, P2][] => {
  const p00 = {x: r.x0, z: r.z0};
  const p10 = {x: r.x1, z: r.z0};
  const p11 = {x: r.x1, z: r.z1};
  const p01 = {x: r.x0, z: r.z1};
  return [[p00, p10], [p10, p11], [p11, p01], [p01, p00]];
};

/** Does segment [a, b] touch or cross the rectangle? (segment–segment tests against its edges plus containment) */
export const segmentHitsRect = (a: P2, b: P2, r: Rect) => {
  if (pointInRect(a, r) || pointInRect(b, r)) return true;
  return rectEdges(r).some(([c, d]) => segmentIntersection(a, b, c, d) !== null);
};

/** Does the occluder (treated as a rectangle, optionally grown by `margin`) block the straight segment [a, b]? */
export const segmentBlocked = (a: P2, b: P2, layout: OpticsLayout = LAYOUT, margin = 0) => segmentHitsRect(a, b, occluderRect(layout, margin));

/**
 * Liang–Barsky clip of segment [a, b] against a rectangle. Returns the parameter interval [tIn, tOut] (0..1 along ab)
 * that lies inside the rectangle, or null when the segment misses it. `tIn` is the first contact.
 */
export const clipSegmentToRect = (a: P2, b: P2, r: Rect): {tIn: number; tOut: number} | null => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dz, dz];
  const q = [a.x - r.x0, r.x1 - a.x, a.z - r.z0, r.z1 - a.z];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return {tIn: t0, tOut: t1};
};

/** Parameter (0..1) along [a, b] where it first touches the occluder, or 1 if it is clear. Used to stop rays. */
export const firstOccluderHit = (a: P2, b: P2, layout: OpticsLayout = LAYOUT, margin = 0) => {
  const c = clipSegmentToRect(a, b, occluderRect(layout, margin));
  return c ? c.tIn : 1;
};

/**
 * Throws if any straight segment of the polyline crosses the occluder. The error names the segment by index and by
 * point ids (e.g. "segment 2 H→W3"), so a hand-edited path fails loudly in dev.
 */
export const assertPath = (points: P2[], layout: OpticsLayout = LAYOUT, margin = 0) => {
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (segmentBlocked(a, b, layout, margin)) {
      throw new Error(`optics.assertPath: segment ${i} ${pname(a, i)}→${pname(b, i + 1)} ${fmt(a)}→${fmt(b)} crosses the occluder (x=${layout.occluder.x}, z ${layout.occluder.z0}..${layout.occluder.z1})`);
    }
  }
};

/* ------------------------------------------------------------------ clearance (how close a drawn line passes) */

/** Shortest distance from point p to segment [a, b], and the nearest point on the segment. */
export const pointSegmentNearest = (p: P2, a: P2, b: P2): {d: number; q: P2} => {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 > 0 ? Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2)) : 0;
  const q = add(a, scale(ab, t));
  return {d: dist(p, q), q};
};

/** The point of rectangle r closest to p (p itself when inside). */
export const clampToRect = (p: P2, r: Rect): P2 => ({x: Math.max(r.x0, Math.min(r.x1, p.x)), z: Math.max(r.z0, Math.min(r.z1, p.z))});

/**
 * The closest approach of segment [a, b] to rectangle r: the distance `d` (0 when they touch), the rectangle point
 * `onRect` and the segment point `onSeg` that realise it. For a thin partition this is how close a light leg grazes
 * it, which matters for drawing (stroke widths and lane offsets are in pixels, the geometry check is in metres).
 */
export const segmentRectNearest = (a: P2, b: P2, r: Rect): {d: number; onRect: P2; onSeg: P2} => {
  const c = clipSegmentToRect(a, b, r);
  if (c) {
    const p = lerpP(a, b, c.tIn);
    return {d: 0, onRect: p, onSeg: p};
  }
  let best = {d: Infinity, onRect: a, onSeg: a};
  for (const [corner] of rectEdges(r)) {
    const n = pointSegmentNearest(corner, a, b);
    if (n.d < best.d) best = {d: n.d, onRect: corner, onSeg: n.q};
  }
  for (const e of [a, b]) {
    const q = clampToRect(e, r);
    const d = dist(e, q);
    if (d < best.d) best = {d, onRect: q, onSeg: e};
  }
  return best;
};

/** Plan clearance (metres) between segment [a, b] and the occluder footprint; 0 when they touch. */
export const occluderClearance = (a: P2, b: P2, layout: OpticsLayout = LAYOUT) => segmentRectNearest(a, b, occluderRect(layout)).d;

/** Smallest occluder clearance (metres) over the segments of a polyline. */
export const pathClearance = (points: P2[], layout: OpticsLayout = LAYOUT) => {
  let m = Infinity;
  for (let i = 0; i + 1 < points.length; i++) m = Math.min(m, occluderClearance(points[i], points[i + 1], layout));
  return m;
};

/**
 * The sub-intervals [u0, u1] (0..1 along a → b) where `hidden(p)` is false: sampled in `n` steps, each change of
 * visibility refined by bisection. Used to draw only the visible parts of a light leg in the room view, e.g.
 * hidden = (p) => isHiddenByOccluder({...p, h: 1.2}, tilt) from lib/room.
 */
export const visibleIntervals = (a: P2, b: P2, hidden: (p: P2) => boolean, n = 32): [number, number][] => {
  const vis = (u: number) => !hidden(lerpP(a, b, u));
  const out: [number, number][] = [];
  let prevU = 0;
  let prevV = vis(0);
  let runStart = 0;
  const steps = Math.max(1, Math.round(n));
  for (let k = 1; k <= steps; k++) {
    const u = k / steps;
    const v = vis(u);
    if (v !== prevV) {
      let lo = prevU;
      let hi = u;
      for (let it = 0; it < 20; it++) {
        const m = (lo + hi) / 2;
        if (vis(m) === prevV) lo = m;
        else hi = m;
      }
      const edge = (lo + hi) / 2;
      if (prevV) out.push([runStart, edge]);
      else runStart = edge;
    }
    prevU = u;
    prevV = v;
  }
  if (prevV) out.push([runStart, 1]);
  return out;
};

/* ------------------------------------------------------------------ path length and timing */

/** Total length of a polyline (metres). */
export const pathLength = (points: P2[]) => {
  let s = 0;
  for (let i = 0; i + 1 < points.length; i++) s += dist(points[i], points[i + 1]);
  return s;
};

/** Cumulative distances: cum[i] = length of the path up to points[i] (cum[0] = 0). */
export const pathCumulative = (points: P2[]) => {
  const cum = [0];
  for (let i = 0; i + 1 < points.length; i++) cum.push(cum[i] + dist(points[i], points[i + 1]));
  return cum;
};

/** The point at arc-length `s` along a polyline, with the segment index and the fraction along that segment. */
export const pointAtDistance = (points: P2[], s: number): {p: P2; seg: number; u: number} => {
  const cum = pathCumulative(points);
  const total = cum[cum.length - 1];
  const ss = Math.max(0, Math.min(total, s));
  for (let i = 0; i + 1 < points.length; i++) {
    const l = cum[i + 1] - cum[i];
    if (ss <= cum[i + 1] || i + 2 === points.length) {
      const u = l > 0 ? (ss - cum[i]) / l : 0;
      return {p: lerpP(points[i], points[i + 1], u), seg: i, u};
    }
  }
  return {p: points[0], seg: 0, u: 0};
};

/** Travel time in nanoseconds for a path length in metres. */
export const timeNs = (length: number, c: number = LAYOUT.c_m_per_ns) => length / c;

/** Path length in metres for a travel time in nanoseconds. */
export const lengthForTime = (tNs: number, c: number = LAYOUT.c_m_per_ns) => c * tNs;

/**
 * Confocal inversion: emitter and detector together at S, one wall point W. An arrival time tNs means
 * c·t = 2|SW| + 2|WH|, so every point H at distance r = (c·t − 2|SW|) / 2 from W fits.
 */
export const confocalRadius = (tNs: number, S: P2, W: P2, c: number = LAYOUT.c_m_per_ns) => (c * tNs - 2 * dist(S, W)) / 2;

/* ------------------------------------------------------------------ pulse schedule (frames) */

/**
 * The film's one illustrative, visibly slowed pulse speed: metres of plan per frame (0.18 m/frame = 5.4 m/s at
 * 30 fps). Give every path the same speed (pathSchedule with `speed`, the default) so a longer path visibly arrives
 * later, which is the whole timing argument; a fixed duration per path would make them all arrive together.
 */
export const PULSE_SPEED = 0.18;

export type PathSchedule = {
  /** Frame the pulse leaves points[0]. */
  start: number;
  /** Frames from start to arrival. */
  dur: number;
  /** Frame the pulse reaches the last point. */
  end: number;
  /** Path length, metres. */
  length: number;
  /** The real light travel time of the whole path, ns (for labels; the on-screen motion is slowed). */
  tNs: number;
  /** vertexFrames[k] = frame at which the pulse head reaches points[k] (cue scatter fans, rings and sounds here). */
  vertexFrames: number[];
  /** Pulse progress 0..1 by length (constant speed) at a frame: pass to LightPath `t`. */
  progress: (frame: number) => number;
  /** Frame at which the head has travelled `s` metres. */
  frameAt: (s: number) => number;
  /** Elapsed light time (ns) represented at a frame: pass to TimingRuler `marker`. */
  nsAt: (frame: number) => number;
};

/**
 * Frame timing for a pulse travelling a polyline at constant speed. Give either `speed` (metres per frame, default
 * PULSE_SPEED) or a fixed `dur` (frames). Pure: every field is derived from the points, so cues stay locked to the
 * geometry when the layout changes.
 */
export const pathSchedule = (points: P2[], opts: {start: number; dur?: number; speed?: number}, c: number = LAYOUT.c_m_per_ns): PathSchedule => {
  const cum = pathCumulative(points);
  const length = cum[cum.length - 1];
  const speed = opts.speed ?? PULSE_SPEED;
  const dur = Math.max(0, opts.dur ?? (speed > 0 ? length / speed : 0));
  const start = opts.start;
  const tNs = timeNs(length, c);
  const frameAt = (s: number) => start + (length > 0 ? (dur * Math.max(0, Math.min(length, s))) / length : 0);
  const progress = (frame: number) => (dur > 0 ? Math.max(0, Math.min(1, (frame - start) / dur)) : frame >= start ? 1 : 0);
  return {start, dur, end: start + dur, length, tNs, vertexFrames: cum.map(frameAt), progress, frameAt, nsAt: (frame) => progress(frame) * tNs};
};

/* ------------------------------------------------------------------ ellipses (separated illumination / detection) */

export type Ellipse = {center: P2; a: number; b: number; angle: number; f1: P2; f2: P2; sum: number};

/** Ellipse with foci f1, f2 and constant distance sum `sum` (= 2a). Null when sum ≤ |f1 f2| (no ellipse). */
export const ellipseFromFoci = (f1: P2, f2: P2, sum: number): Ellipse | null => {
  const d = dist(f1, f2);
  if (sum <= d) return null;
  const a = sum / 2;
  const c = d / 2;
  return {center: lerpP(f1, f2, 0.5), a, b: Math.sqrt(a * a - c * c), angle: Math.atan2(f2.z - f1.z, f2.x - f1.x), f1, f2, sum};
};

/**
 * Non-confocal case: the laser lights wall point Wl and the detector watches wall point Wd, both from S. An arrival
 * time tNs means |S Wl| + |Wl H| + |H Wd| + |Wd S| = c·t, so H lies on the ellipse with foci Wl, Wd and
 * sum c·t − |S Wl| − |S Wd|.
 */
export const ellipseFromTime = (tNs: number, S: P2, Wl: P2, Wd: P2, c: number = LAYOUT.c_m_per_ns) =>
  ellipseFromFoci(Wl, Wd, c * tNs - dist(S, Wl) - dist(S, Wd));

/** Point on an ellipse at parametric angle θ. */
export const ellipsePoint = (e: Ellipse, th: number): P2 => {
  const ex = e.a * Math.cos(th);
  const ez = e.b * Math.sin(th);
  const c = Math.cos(e.angle);
  const s = Math.sin(e.angle);
  return {x: e.center.x + ex * c - ez * s, z: e.center.z + ex * s + ez * c};
};

/** n + 1 points on an ellipse for parametric angles a0..a1. */
export const sampleEllipse = (e: Ellipse, a0 = 0, a1 = Math.PI * 2, n = 96): P2[] =>
  Array.from({length: n + 1}, (_, i) => ellipsePoint(e, a0 + ((a1 - a0) * i) / n));

/* ------------------------------------------------------------------ arcs and bands */

/** n + 1 points on the circle (center, r) for plan angles a0..a1 (n ≥ 1 segments). */
export const sampleArc = (center: P2, r: number, a0: number, a1: number, n = 64): P2[] => {
  const k = Math.max(1, Math.round(n));
  return Array.from({length: k + 1}, (_, i) => polar(center, r, a0 + ((a1 - a0) * i) / k));
};

/**
 * The sub-intervals of the arc (center, r, a0..a1) that lie inside a rectangle, as [from, to] angle pairs in the
 * same direction as a0 → a1. Exact (from the circle–edge crossings), so a clipped arc can be drawn on without spending
 * time on invisible parts.
 */
export const arcRectIntervals = (center: P2, r: number, rect: Rect, a0 = 0, a1 = Math.PI * 2): [number, number][] => {
  if (r <= 0) return [];
  const lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  const cuts: number[] = [lo, hi];
  const addAngle = (a: number) => {
    // bring every representative a + 2πk that falls in [lo, hi]
    const k0 = Math.ceil((lo - a) / (Math.PI * 2));
    for (let k = k0; a + k * Math.PI * 2 <= hi; k++) cuts.push(a + k * Math.PI * 2);
  };
  for (const x of [rect.x0, rect.x1]) {
    const c = (x - center.x) / r;
    if (Math.abs(c) <= 1) {
      const a = Math.acos(c);
      addAngle(a);
      addAngle(-a);
    }
  }
  for (const z of [rect.z0, rect.z1]) {
    const s = (z - center.z) / r;
    if (Math.abs(s) <= 1) {
      const a = Math.asin(s);
      addAngle(a);
      addAngle(Math.PI - a);
    }
  }
  cuts.sort((p, q) => p - q);
  const tol = 1e-9;
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const s0 = cuts[i];
    const s1 = cuts[i + 1];
    if (s1 - s0 < 1e-9) continue;
    const m = polar(center, r, (s0 + s1) / 2);
    const inside = m.x >= rect.x0 - tol && m.x <= rect.x1 + tol && m.z >= rect.z0 - tol && m.z <= rect.z1 + tol;
    if (!inside) continue;
    if (out.length && Math.abs(out[out.length - 1][1] - s0) < 1e-9) out[out.length - 1][1] = s1;
    else out.push([s0, s1]);
  }
  if (a1 < a0) return out.reverse().map(([s, e]) => [e, s]);
  return out;
};

/**
 * Soft membership (0..1) of point p in the band of half-width `halfWidth` around the circle (center, r).
 * A super-Gaussian of the radial miss distance d = | |p − center| − r |: 1 on the circle, 0.5 at d = halfWidth,
 * ~0 beyond 1.6 × halfWidth. `sharpness` (default 4) is the exponent; 2 gives a plain Gaussian.
 */
export const bandMembership = (p: P2, center: P2, r: number, halfWidth: number, sharpness = 4) => {
  const d = Math.abs(dist(p, center) - r);
  if (halfWidth <= 0) return d === 0 ? 1 : 0;
  return Math.exp(-Math.LN2 * Math.pow(d / halfWidth, sharpness));
};

/* ------------------------------------------------------------------ the "possible locations" field */

/** A regular grid over a plan rectangle; samples sit on the nodes x0 + i·step, z0 + j·step. */
export type GridSpec = {x0: number; x1: number; z0: number; z1: number; step: number};

/** A scalar field sampled on a grid, values row-major by z: values[j * nx + i]. */
export type ScalarField = {spec: GridSpec; nx: number; nz: number; values: Float32Array; max: number; argmax: P2};

/** One timing constraint: wall point W and the measured radius r with its uncertainty half-width. */
export type BandSpec = {W: P2; r: number; halfWidth: number; sharpness?: number};

/**
 * The "possible locations" field: at each grid node, the combination of the soft band memberships of all
 * constraints, 0..1. 'product' (default) behaves like independent evidence; 'min' is the strict overlap.
 */
export const possibleCloud = (grid: GridSpec, bands: BandSpec[], combine: 'product' | 'min' = 'product'): ScalarField => {
  const nx = Math.max(2, Math.floor((grid.x1 - grid.x0) / grid.step + 1e-9) + 1);
  const nz = Math.max(2, Math.floor((grid.z1 - grid.z0) / grid.step + 1e-9) + 1);
  const values = new Float32Array(nx * nz);
  let max = 0;
  let argmax: P2 = {x: grid.x0, z: grid.z0};
  for (let j = 0; j < nz; j++) {
    const z = grid.z0 + j * grid.step;
    for (let i = 0; i < nx; i++) {
      const x = grid.x0 + i * grid.step;
      let v = 1;
      for (const b of bands) {
        const m = bandMembership({x, z}, b.W, b.r, b.halfWidth, b.sharpness ?? 4);
        v = combine === 'product' ? v * m : Math.min(v, m);
        if (v < 1e-6) break;
      }
      values[j * nx + i] = v;
      if (v > max) {
        max = v;
        argmax = {x, z};
      }
    }
  }
  return {spec: grid, nx, nz, values, max, argmax};
};

/* ------------------------------------------------------------------ contours (marching squares + smoothing) */

/** Uniformly resample a closed polygon at roughly `spacing` (metres) along its perimeter. */
export const resampleClosed = (pts: P2[], spacing: number): P2[] => {
  const n = pts.length;
  if (n < 3) return pts.slice();
  let per = 0;
  for (let i = 0; i < n; i++) per += dist(pts[i], pts[(i + 1) % n]);
  const m = Math.max(6, Math.round(per / Math.max(1e-6, spacing)));
  const step = per / m;
  const out: P2[] = [];
  let seg = 0;
  let acc = 0; // perimeter length at the start of `seg`
  for (let k = 0; k < m; k++) {
    const s = k * step;
    while (seg < n - 1 && acc + dist(pts[seg], pts[(seg + 1) % n]) < s) {
      acc += dist(pts[seg], pts[(seg + 1) % n]);
      seg++;
    }
    const l = dist(pts[seg], pts[(seg + 1) % n]);
    out.push(lerpP(pts[seg], pts[(seg + 1) % n], l > 0 ? (s - acc) / l : 0));
  }
  return out;
};

/** Closed uniform Catmull–Rom spline through `pts`, sampled `samples` times per span (returns a dense closed polygon). */
export const catmullRomClosed = (pts: P2[], samples = 5): P2[] => {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    // Catmull–Rom → cubic Bézier control points
    const b1 = {x: p1.x + (p2.x - p0.x) / 6, z: p1.z + (p2.z - p0.z) / 6};
    const b2 = {x: p2.x - (p3.x - p1.x) / 6, z: p2.z - (p3.z - p1.z) / 6};
    for (let k = 0; k < samples; k++) {
      const t = k / samples;
      const mt = 1 - t;
      const w0 = mt * mt * mt;
      const w1 = 3 * mt * mt * t;
      const w2 = 3 * mt * t * t;
      const w3 = t * t * t;
      out.push({x: w0 * p1.x + w1 * b1.x + w2 * b2.x + w3 * p2.x, z: w0 * p1.z + w1 * b1.z + w2 * b2.z + w3 * p2.z});
    }
  }
  return out;
};

/** Signed area of a closed polygon (plan units², positive = counter-clockwise in x/z). */
export const polygonArea = (pts: P2[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.z - q.x * p.z;
  }
  return a / 2;
};

export type ContourOptions = {
  /** Resample spacing before smoothing, in grid steps (default 1.6). Larger = smoother, less detail. */
  spacing?: number;
  /** Catmull–Rom samples per span (default 5). */
  samples?: number;
  /** Drop loops smaller than this area (m², default 0.25 · step²). */
  minArea?: number;
  /** Return raw marching-squares loops without smoothing. */
  raw?: boolean;
};

// Marching-squares segment table. Corners: a = (i, j), b = (i+1, j), c = (i+1, j+1), d = (i, j+1);
// case bits a:8 b:4 c:2 d:1. Edges: T = a–b, R = b–c, B = d–c, L = a–d.
type EdgeName = 'T' | 'R' | 'B' | 'L';
const MS: Record<number, [EdgeName, EdgeName][]> = {
  1: [['L', 'B']], 2: [['B', 'R']], 3: [['L', 'R']], 4: [['T', 'R']], 6: [['T', 'B']], 7: [['L', 'T']],
  8: [['L', 'T']], 9: [['T', 'B']], 11: [['T', 'R']], 12: [['L', 'R']], 13: [['B', 'R']], 14: [['L', 'B']],
};

/**
 * Iso-contours of a field at `threshold`, as closed polygons in plan space. The field is padded with zeros, so every
 * contour closes (a region touching the grid border is closed along it). By default each loop is resampled and passed
 * through a closed Catmull–Rom spline, so a filled contour renders as a clean smooth blob: no pixel grid, no steps.
 * Fill with fill-rule "evenodd" to respect holes.
 */
export const extractContours = (field: ScalarField, threshold: number, opts: ContourOptions = {}): P2[][] => {
  const {spec, nx, nz, values} = field;
  const NX = nx + 2;
  const NZ = nz + 2;
  const val = (i: number, j: number) => (i <= 0 || j <= 0 || i >= NX - 1 || j >= NZ - 1 ? 0 : values[(j - 1) * nx + (i - 1)]);
  const X = (i: number) => spec.x0 + (i - 1) * spec.step;
  const Z = (j: number) => spec.z0 + (j - 1) * spec.step;
  const pts = new Map<string, P2>();
  const edgePoint = (key: string, i0: number, j0: number, i1: number, j1: number) => {
    let p = pts.get(key);
    if (!p) {
      const v0 = val(i0, j0);
      const v1 = val(i1, j1);
      const t = v1 === v0 ? 0.5 : Math.max(0, Math.min(1, (threshold - v0) / (v1 - v0)));
      p = {x: X(i0) + (X(i1) - X(i0)) * t, z: Z(j0) + (Z(j1) - Z(j0)) * t};
      pts.set(key, p);
    }
    return key;
  };
  const segs: [string, string][] = [];
  for (let j = 0; j < NZ - 1; j++) {
    for (let i = 0; i < NX - 1; i++) {
      const a = val(i, j);
      const b = val(i + 1, j);
      const c = val(i + 1, j + 1);
      const d = val(i, j + 1);
      const code = (a >= threshold ? 8 : 0) | (b >= threshold ? 4 : 0) | (c >= threshold ? 2 : 0) | (d >= threshold ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const E = (e: EdgeName) =>
        e === 'T' ? edgePoint(`h${i},${j}`, i, j, i + 1, j)
        : e === 'B' ? edgePoint(`h${i},${j + 1}`, i, j + 1, i + 1, j + 1)
        : e === 'L' ? edgePoint(`v${i},${j}`, i, j, i, j + 1)
        : edgePoint(`v${i + 1},${j}`, i + 1, j, i + 1, j + 1);
      let list = MS[code];
      if (code === 5 || code === 10) {
        const centre = (a + b + c + d) / 4 >= threshold;
        // 5: b, d inside; 10: a, c inside
        list = (code === 5) === centre ? [['L', 'T'], ['B', 'R']] : [['T', 'R'], ['L', 'B']];
      }
      for (const [e0, e1] of list) segs.push([E(e0), E(e1)]);
    }
  }
  // join segments into loops through their shared edge points
  const byKey = new Map<string, number[]>();
  segs.forEach(([k0, k1], idx) => {
    for (const k of [k0, k1]) {
      const l = byKey.get(k);
      if (l) l.push(idx);
      else byKey.set(k, [idx]);
    }
  });
  const used = new Uint8Array(segs.length);
  const loops: P2[][] = [];
  for (let s0 = 0; s0 < segs.length; s0++) {
    if (used[s0]) continue;
    used[s0] = 1;
    const startKey = segs[s0][0];
    let cur = segs[s0][1];
    const loop: P2[] = [pts.get(startKey) as P2];
    for (let guard = 0; guard < segs.length + 2 && cur !== startKey; guard++) {
      loop.push(pts.get(cur) as P2);
      const next = (byKey.get(cur) ?? []).find((k) => !used[k]);
      if (next === undefined) break;
      used[next] = 1;
      cur = segs[next][0] === cur ? segs[next][1] : segs[next][0];
    }
    if (loop.length >= 3) loops.push(loop);
  }
  const minArea = opts.minArea ?? 0.25 * spec.step * spec.step;
  const kept = loops.filter((l) => Math.abs(polygonArea(l)) >= minArea);
  if (opts.raw) return kept;
  return kept.map((l) => {
    const rs = resampleClosed(l, (opts.spacing ?? 1.6) * spec.step);
    return catmullRomClosed(rs, opts.samples ?? 5);
  });
};

/* ------------------------------------------------------------------ scattering */

/** A unit direction in plan space with its cosine weight w = cos(angle to the surface normal), 0..1. */
export type ScatterDir = P2 & {w: number; angle: number};

/**
 * A deterministic, cosine-weighted fan of n directions leaving a matte surface with the given normal.
 * Angles are drawn by stratified inverse-CDF sampling of the 2D Lambertian lobe (θ = asin(2u − 1)), so rays crowd
 * toward the normal; each carries w = cos θ for drawing uneven ray lengths. `jitter` (0..1) seeds per-ray wobble.
 */
export const scatterDirections = (normal: P2, n: number, seed = 0, jitter = 0.7): ScatterDir[] => {
  const nn = normalize(normal);
  const base = Math.atan2(nn.z, nn.x);
  const out: ScatterDir[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5 + (rand(seed * 977 + i * 13 + 1) - 0.5) * jitter) / n;
    const th = Math.asin(Math.max(-0.985, Math.min(0.985, 2 * u - 1)));
    const a = base + th;
    out.push({x: Math.cos(a), z: Math.sin(a), w: Math.cos(th), angle: a});
  }
  return out;
};

/* ------------------------------------------------------------------ toy arrival histogram (illustrative) */

export type HistogramData = {edges: number[]; values: number[]; firstBin: number; lateBin: number; tFirst: number; tLate: number};

/**
 * An ILLUSTRATIVE confocal arrival-time histogram for one wall point: a tall first-bounce peak at 2|SW|/c, a decaying
 * multipath tail, and a small late bump at (2|SW| + 2|WH|)/c from the hidden person. Values are relative (peak = 1).
 * The real hidden-object return is orders of magnitude weaker; `lateRatio` is a legible stand-in (label it).
 */
export const arrivalHistogram = (opts: {
  S: P2;
  W: P2;
  H: P2;
  rangeNs?: [number, number];
  binNs?: number;
  sigmaNs?: number;
  lateRatio?: number;
  tail?: number;
  noise?: number;
  seed?: number;
  c?: number;
}): HistogramData => {
  const {S, W, H, rangeNs = [0, 40], binNs = 1.25, sigmaNs = 0.55, lateRatio = 0.17, tail = 0.05, noise = 0.012, seed = 7, c = LAYOUT.c_m_per_ns} = opts;
  const tFirst = timeNs(2 * dist(S, W), c);
  const tLate = timeNs(2 * dist(S, W) + 2 * dist(W, H), c);
  const n = Math.max(1, Math.round((rangeNs[1] - rangeNs[0]) / binNs));
  const edges = Array.from({length: n + 1}, (_, i) => rangeNs[0] + i * binNs);
  const g = (t: number, mu: number, s: number) => Math.exp(-0.5 * ((t - mu) / s) ** 2);
  const raw = Array.from({length: n}, (_, i) => {
    // integrate over the bin with 8 sub-samples so a peak straddling two bins splits honestly
    let v = 0;
    for (let k = 0; k < 8; k++) {
      const t = edges[i] + ((k + 0.5) / 8) * binNs;
      v += g(t, tFirst, sigmaNs);
      v += lateRatio * g(t, tLate, sigmaNs * 1.5);
      if (t > tFirst) v += tail * Math.exp(-(t - tFirst) / 3.5);
    }
    v /= 8;
    const mid = edges[i] + binNs / 2;
    if (mid > tFirst - binNs) v += noise * rand(seed * 131 + i);
    return v;
  });
  const peak = Math.max(...raw);
  const values = raw.map((v) => v / peak);
  const binOf = (t: number) => Math.max(0, Math.min(n - 1, Math.floor((t - rangeNs[0]) / binNs)));
  return {edges, values, firstBin: binOf(tFirst), lateBin: binOf(tLate), tFirst, tLate};
};

/* ------------------------------------------------------------------ self-check */

/**
 * One wall sample. `clearance` is the closest plan approach (metres) of its legs S→W and W→H to the partition: it
 * passes the geometry check whenever it is > 0, but a value under ~0.05 m means the drawn stroke grazes the partition
 * at plan scale (LightPath with `layout` nudges its lanes clear; check it when a verified layout replaces this one).
 */
export type SelfTestRow = {id: string; SW: number; WH: number; path: number; tNs: number; radius: number; clearance: number};
export type SelfTestReport = {SH_blocked: true; rows: SelfTestRow[]; minClearance: number; cloudPeak: P2; cloudPeakErr: number};

const cache = new WeakMap<OpticsLayout, SelfTestReport>();

/**
 * Asserts the layout's claims and the primitives against each other; throws an Error naming the first violation.
 *  - the occluder is free-standing (gap to the relay wall) and blocks S→H;
 *  - for every wall sample W: S→W and W→H are clear, the confocal path passes assertPath, its length is
 *    2|SW| + 2|WH|, and confocalRadius(timeNs(length)) gives back |WH|;
 *  - segmentBlocked agrees with the Liang–Barsky clip; segmentIntersection solves a known case;
 *  - each wall sample's legs keep a positive clearance from the occluder (reported per row and as minClearance);
 *  - pathSchedule's duration and represented time agree with the path length; visibleIntervals splits correctly;
 *  - the ellipse for separated points passes through H; the possible-locations field peaks at H.
 * Results are memoised per layout object, so calling it every frame is free.
 */
export const selfTest = (layout: OpticsLayout = LAYOUT): SelfTestReport => {
  const hit = cache.get(layout);
  if (hit) return hit;
  const fail = (msg: string): never => {
    throw new Error(`optics.selfTest: ${msg}`);
  };
  const near = (a: number, b: number, tol: number, what: string) => {
    if (!(Math.abs(a - b) <= tol)) fail(`${what}: ${a} vs ${b}`);
  };
  const {S, H, W} = layoutPoints(layout);
  const room = roomRect(layout);
  const occ = occluderRect(layout);

  // primitive sanity
  const x = segmentIntersection({x: 0, z: 0}, {x: 1, z: 1}, {x: 0, z: 1}, {x: 1, z: 0});
  if (!x) fail('segmentIntersection missed the X case');
  else near(x.p.x, 0.5, 1e-12, 'segmentIntersection x');
  if (segmentIntersection({x: 0, z: 0}, {x: 1, z: 0}, {x: 0, z: 1}, {x: 1, z: 1})) fail('parallel segments reported as crossing');

  // layout sanity
  for (const p of [S, H, ...W]) if (!pointInRect(p, room)) fail(`${p.id} ${fmt(p)} is outside the room`);
  if (pointInRect(S, occ) || pointInRect(H, occ)) fail('S or H is inside the occluder');
  if (!(occ.z0 > layout.relayWall.z)) fail('the occluder touches the relay wall (no gap for light)');

  // the claim: S cannot see H
  if (!segmentBlocked(S, H, layout)) fail('S→H is NOT blocked by the occluder');
  if (!clipSegmentToRect(S, H, occ)) fail('segmentBlocked and clipSegmentToRect disagree on S→H');

  const rows: SelfTestRow[] = W.map((w) => {
    for (const [a, b] of [[S, w], [w, H]] as [P2, P2][]) {
      if (segmentBlocked(a, b, layout)) fail(`${a.id}→${b.id} is blocked (relay wall must be visible from S and H)`);
      if (clipSegmentToRect(a, b, occ)) fail(`segmentBlocked and clipSegmentToRect disagree on ${a.id}→${b.id}`);
    }
    const path = confocalPath(S, w, H);
    assertPath(path, layout);
    const L = pathLength(path);
    near(L, 2 * dist(S, w) + 2 * dist(w, H), 1e-9, `path length for ${w.id}`);
    const t = timeNs(L, layout.c_m_per_ns);
    const r = confocalRadius(t, S, w, layout.c_m_per_ns);
    near(r, dist(w, H), 1e-9, `confocal radius for ${w.id}`);
    const iv = arcRectIntervals(w, r, room, 0, Math.PI);
    const aH = Math.atan2(H.z - w.z, H.x - w.x);
    if (!iv.some(([a0, a1]) => aH >= Math.min(a0, a1) - 1e-9 && aH <= Math.max(a0, a1) + 1e-9)) fail(`arc of ${w.id} misses H inside the room`);
    const clearance = Math.min(occluderClearance(S, w, layout), occluderClearance(w, H, layout));
    if (!(clearance > 0)) fail(`${w.id}: a leg touches the occluder (clearance ${clearance})`);
    const sched = pathSchedule(path, {start: 0}, layout.c_m_per_ns);
    near(sched.end, L / PULSE_SPEED, 1e-9, `pathSchedule duration for ${w.id}`);
    near(sched.nsAt(sched.end), t, 1e-9, `pathSchedule time for ${w.id}`);
    return {id: w.id as string, SW: dist(S, w), WH: dist(w, H), path: L, tNs: t, radius: r, clearance};
  });

  // visibleIntervals: a predicate hiding the middle third of a segment leaves two runs that meet it exactly
  const vi = visibleIntervals({x: 0, z: 0}, {x: 3, z: 0}, (p) => p.x > 1 && p.x < 2);
  if (vi.length !== 2 || Math.abs(vi[0][1] - 1 / 3) > 1e-4 || Math.abs(vi[1][0] - 2 / 3) > 1e-4) fail(`visibleIntervals: ${JSON.stringify(vi)}`);

  // separated illumination/detection: H lies on the ellipse
  if (W.length >= 2) {
    const tl = timeNs(dist(S, W[0]) + dist(W[0], H) + dist(H, W[1]) + dist(W[1], S), layout.c_m_per_ns);
    const e = ellipseFromTime(tl, S, W[0], W[1], layout.c_m_per_ns);
    if (!e) fail('ellipseFromTime returned no ellipse');
    else {
      const d = sub(H, e.center);
      const c = Math.cos(-e.angle);
      const s = Math.sin(-e.angle);
      const lx = d.x * c - d.z * s;
      const lz = d.x * s + d.z * c;
      near((lx / e.a) ** 2 + (lz / e.b) ** 2, 1, 1e-9, 'H on the separated-points ellipse');
    }
  }

  // the field built from the same bands peaks at H
  const step = 0.01;
  const f = possibleCloud({x0: H.x - 0.3, x1: H.x + 0.3, z0: H.z - 0.3, z1: H.z + 0.3, step}, rows.map((r, i) => ({W: W[i], r: r.radius, halfWidth: 0.06})));
  const err = dist(f.argmax, H);
  if (err > step * 0.75) fail(`possible-locations field peaks ${err.toFixed(3)} m from H`);

  const report: SelfTestReport = {SH_blocked: true, rows, minClearance: Math.min(...rows.map((r) => r.clearance)), cloudPeak: f.argmax, cloudPeakErr: err};
  cache.set(layout, report);
  return report;
};
