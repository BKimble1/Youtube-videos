// Exact paint order for convex solids (V3).
//
// Every mechanical piece is drawn as one convex solid: a sphere or a capsule (a cylinder with round ends). Two convex
// solids that do not intersect always occlude each other the same way wherever their pictures overlap (a separating
// plane exists, and the eye is on one side of it). So the order of an overlapping pair is decided by one ray through a
// point inside both pictures: the solid hit first is in front. All such pairwise results are combined by a
// topological sort, far-to-near as the tie-break. Pieces of the same link that touch along the link axis (ball, neck,
// motor block, housing, rod) are ordered by the link's axial direction instead: the end nearer the camera is drawn
// last. Nothing is sorted by a single "centre depth", so a joint or a crossing rod cannot pop between layers.
import {V3} from './v3';

/** sphere, capsule (round ends) or cylinder (flat ends) */
export type Solid = {k: 's'; c: V3; r: number} | {k: 'c'; a: V3; b: V3; r: number} | {k: 'y'; a: V3; b: V3; r: number};

type P2 = {x: number; y: number};
/** a drawn 2D shape: a segment p-q swept by a radius going from rp to rq (a circle when p = q) */
export type Shape2 = {p: P2; q: P2; rp: number; rq: number};

const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
const mul3 = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});

/** nearest positive hit of the ray t*d (origin at the eye, camera space) with a sphere */
export const raySphere = (d: V3, c: V3, r: number): number => {
  const a = dot3(d, d), b = dot3(d, c), cc = dot3(c, c) - r * r;
  const disc = b * b - a * cc;
  if (disc < 0) return Infinity;
  const t = (b - Math.sqrt(disc)) / a;
  return t > 0 ? t : Infinity;
};

/** nearest hit of the ray t*d with a capsule a-b of radius r (camera space) */
export const rayCapsule = (d: V3, A: V3, B: V3, r: number): number => {
  let best = Math.min(raySphere(d, A, r), raySphere(d, B, r));
  const ab = sub3(B, A);
  const h = Math.sqrt(dot3(ab, ab));
  if (h > 1e-9) {
    const w = mul3(ab, 1 / h);
    const m = mul3(A, -1); // ray origin (0) minus A
    const dp = sub3(d, mul3(w, dot3(d, w)));
    const mp = sub3(m, mul3(w, dot3(m, w)));
    const qa = dot3(dp, dp), qb = 2 * dot3(mp, dp), qc = dot3(mp, mp) - r * r;
    const disc = qb * qb - 4 * qa * qc;
    if (qa > 1e-12 && disc >= 0) {
      const t = (-qb - Math.sqrt(disc)) / (2 * qa);
      const s = dot3(add3(m, mul3(d, t)), w);
      if (t > 0 && s >= 0 && s <= h) best = Math.min(best, t);
    }
  }
  return best;
};

/** nearest hit of the ray t*d with a flat-ended cylinder a-b of radius r (camera space) */
export const rayCylinder = (d: V3, A: V3, B: V3, r: number): number => {
  const ab = sub3(B, A);
  const h = Math.sqrt(dot3(ab, ab));
  if (h < 1e-9) return Infinity;
  const w = mul3(ab, 1 / h);
  let best = Infinity;
  const m = mul3(A, -1);
  const dp = sub3(d, mul3(w, dot3(d, w)));
  const mp = sub3(m, mul3(w, dot3(m, w)));
  const qa = dot3(dp, dp), qb = 2 * dot3(mp, dp), qc = dot3(mp, mp) - r * r;
  const disc = qb * qb - 4 * qa * qc;
  if (qa > 1e-12 && disc >= 0) {
    const t = (-qb - Math.sqrt(disc)) / (2 * qa);
    const s = dot3(add3(m, mul3(d, t)), w);
    if (t > 0 && s >= 0 && s <= h) best = t;
  }
  // the two end discs
  const dw = dot3(d, w);
  if (Math.abs(dw) > 1e-12)
    for (const C of [A, B]) {
      const t = dot3(C, w) / dw;
      if (t > 0 && t < best) {
        const p = sub3(mul3(d, t), C);
        if (dot3(p, p) <= r * r) best = t;
      }
    }
  return best;
};

export const rayHit = (d: V3, s: Solid): number => (s.k === 's' ? raySphere(d, s.c, s.r) : s.k === 'c' ? rayCapsule(d, s.a, s.b, s.r) : rayCylinder(d, s.a, s.b, s.r));

/** closest points of 2D segments p1-q1 and p2-q2: parameters (s on the first, t on the second) */
const segSeg2 = (p1: P2, q1: P2, p2: P2, q2: P2): [number, number] => {
  const d1 = {x: q1.x - p1.x, y: q1.y - p1.y}, d2 = {x: q2.x - p2.x, y: q2.y - p2.y}, r = {x: p1.x - p2.x, y: p1.y - p2.y};
  const a = d1.x * d1.x + d1.y * d1.y, e = d2.x * d2.x + d2.y * d2.y, f = d2.x * r.x + d2.y * r.y;
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  if (a < 1e-9 && e < 1e-9) return [0, 0];
  if (a < 1e-9) return [0, cl(f / e)];
  const c = d1.x * r.x + d1.y * r.y;
  if (e < 1e-9) return [cl(-c / a), 0];
  const b = d1.x * d2.x + d1.y * d2.y;
  const den = a * e - b * b;
  let s = den > 1e-12 ? cl((b * f - c * e) / den) : 0;
  let t = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = cl(-c / a);
  } else if (t > 1) {
    t = 1;
    s = cl((b - c) / a);
  }
  return [s, t];
};

const at2 = (p: P2, q: P2, s: number): P2 => ({x: p.x + (q.x - p.x) * s, y: p.y + (q.y - p.y) * s});

/** a point inside both drawn shapes, or null when they do not overlap (with a small margin, px) */
export const overlapPoint = (A: Shape2, B: Shape2, margin = 0.5): P2 | null => {
  const [s, t] = segSeg2(A.p, A.q, B.p, B.q);
  const a = at2(A.p, A.q, s), b = at2(B.p, B.q, t);
  const ra = A.rp + (A.rq - A.rp) * s, rb = B.rp + (B.rq - B.rp) * t;
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if (d >= ra + rb - margin) return null;
  const k = ra + rb > 0 ? ra / (ra + rb) : 0.5;
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
};

const insideShape = (S: Shape2, p: P2, m = 0.75) => {
  const [s] = segSeg2(S.p, S.q, p, p);
  const a = at2(S.p, S.q, s);
  return Math.hypot(a.x - p.x, a.y - p.y) < S.rp + (S.rq - S.rp) * s - m;
};

/** candidate points inside both outlines: the overlap centre, then points spread over the overlap region (the outline
 *  of a flat-ended cylinder is a little smaller than its stadium, so callers keep the points whose rays hit both) */
export const overlapPoints = (A: Shape2, B: Shape2, n = 12): P2[] => {
  const c = overlapPoint(A, B, 0.5);
  if (!c) return [];
  const out: P2[] = [c];
  const ra = Math.max(1, Math.min(Math.max(A.rp, A.rq), Math.max(B.rp, B.rq)));
  for (let ring = 1; ring <= 3 && out.length < n; ring++)
    for (let k = 0; k < 8 && out.length < n; k++) {
      const a = (k / 8) * Math.PI * 2 + ring * 0.4;
      const p = {x: c.x + Math.cos(a) * ra * 0.45 * ring, y: c.y + Math.sin(a) * ra * 0.45 * ring};
      if (insideShape(A, p) && insideShape(B, p)) out.push(p);
    }
  return out;
};

/** 3D distance between two solids (negative when they intersect) */
export const solidGap = (a: Solid, b: Solid): number => {
  // (a flat-ended cylinder is treated as its capsule: conservative by at most its radius at the ends)
  const segA: [V3, V3] = a.k === 's' ? [a.c, a.c] : [a.a, a.b];
  const segB: [V3, V3] = b.k === 's' ? [b.c, b.c] : [b.a, b.b];
  return segSegDist3(segA[0], segA[1], segB[0], segB[1]) - a.r - b.r;
};

/** exact closest distance between 3D segments */
export const segSegDist3 = (p1: V3, q1: V3, p2: V3, q2: V3): number => {
  const d1 = sub3(q1, p1), d2 = sub3(q2, p2), r = sub3(p1, p2);
  const a = dot3(d1, d1), e = dot3(d2, d2), f = dot3(d2, r);
  const cl = (x: number) => Math.max(0, Math.min(1, x));
  let s = 0, t = 0;
  if (a < 1e-12 && e < 1e-12) return Math.sqrt(dot3(r, r));
  if (a < 1e-12) t = cl(f / e);
  else {
    const c = dot3(d1, r);
    if (e < 1e-12) s = cl(-c / a);
    else {
      const b = dot3(d1, d2);
      const den = a * e - b * b;
      s = den > 1e-14 ? cl((b * f - c * e) / den) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = cl(-c / a);
      } else if (t > 1) {
        t = 1;
        s = cl((b - c) / a);
      }
    }
  }
  const pa = add3(p1, mul3(d1, s)), pb = add3(p2, mul3(d2, t));
  const w = sub3(pa, pb);
  return Math.sqrt(dot3(w, w));
};
