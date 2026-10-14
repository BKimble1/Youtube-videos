// 2D helpers: convex hulls of projected sample points, smoothed outlines, and plane clipping in 3D.
import {Proj, NEAR} from './camera';
import {V3, lerp3} from './math';

export type Pt = {x: number; y: number};

/** Andrew's monotone chain. Returns counter-clockwise hull without repeating the first point. */
export const hull = (pts: Pt[]): Pt[] => {
  if (pts.length < 3) return pts.slice();
  const p = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const crossZ = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && crossZ(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && crossZ(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Closed outline through the midpoints of a polygon's edges, using the vertices as quadratic controls. */
export const smoothClosed = (pts: Pt[]): string => {
  const n = pts.length;
  if (n === 0) return '';
  if (n < 3) return polyClosed(pts);
  const mid = (a: Pt, b: Pt) => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
  let m = mid(pts[n - 1], pts[0]);
  let d = `M${f1(m.x)} ${f1(m.y)}`;
  for (let i = 0; i < n; i++) {
    const v = pts[i];
    const nx = mid(v, pts[(i + 1) % n]);
    d += `Q${f1(v.x)} ${f1(v.y)} ${f1(nx.x)} ${f1(nx.y)}`;
    m = nx;
  }
  return d + 'Z';
};

export const polyClosed = (pts: Pt[]): string =>
  pts.length ? 'M' + pts.map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L') + 'Z' : '';
export const polyOpen = (pts: Pt[]): string => (pts.length ? 'M' + pts.map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L') : '');

/** Smooth open curve (Catmull-Rom → cubic Bézier). */
export const smoothOpen = (pts: Pt[]): string => {
  if (pts.length < 3) return polyOpen(pts);
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = {x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6};
    const c2 = {x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6};
    d += `C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d;
};

/** A horizontal clipping plane: keep geometry with y >= level (used for the molten surface, floors, airbags). */
export type ClipY = {level: number} | null | undefined;

/**
 * Clip a set of rings (each a closed loop of 3D points, consecutive rings aligned point-for-point) against y >= level.
 * Returns surviving points plus intersection points on ring edges and on edges between rings — enough for the hull
 * of a convex solid cut by the plane.
 */
export const clipRings = (rings: V3[][], level: number): V3[] => {
  const out: V3[] = [];
  const edge = (a: V3, b: V3) => {
    if ((a[1] - level) * (b[1] - level) < 0) out.push(lerp3(a, b, (level - a[1]) / (b[1] - a[1])));
  };
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k];
      if (a[1] >= level) out.push(a);
      edge(a, ring[(k + 1) % ring.length]);
      if (r + 1 < rings.length) edge(a, rings[r + 1][k]);
    }
  }
  return out;
};

/** Clip a 3D polyline to y >= level, returning the kept pieces. */
export const clipPolyline = (pts: V3[], level: number): V3[][] => {
  const pieces: V3[][] = [];
  let cur: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const inA = a[1] >= level;
    if (i > 0) {
      const b = pts[i - 1];
      const inB = b[1] >= level;
      if (inA !== inB) cur.push(lerp3(b, a, (level - b[1]) / (a[1] - b[1])));
      if (!inA && inB) {
        pieces.push(cur);
        cur = [];
      }
    }
    if (inA) cur.push(a);
  }
  if (cur.length > 1) pieces.push(cur);
  return pieces.filter((p) => p.length > 1);
};

export const projectAll = (pr: Proj, pts: V3[]): Pt[] => pts.map((q) => pr.p(q));

/** Hull outline path of a 3D point cloud. */
export const hullPath = (pr: Proj, pts: V3[]): {d: string; hull: Pt[]} => {
  const h = hull(projectAll(pr, pts));
  return {d: smoothClosed(h), hull: h};
};

/** Bounding box of 2D points. */
export const bbox = (pts: Pt[]) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return {x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2};
};

/** Clip a 3D polygon against the camera near plane (Sutherland–Hodgman). */
export const clipNear = (pr: Proj, pts: V3[], near = NEAR + 2): V3[] => {
  const out: V3[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const da = pr.depth(a) - near, db = pr.depth(b) - near;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) out.push(lerp3(a, b, da / (da - db)));
  }
  return out;
};
/** Clip a 3D polyline against the near plane, returning visible pieces. */
export const clipNearLine = (pr: Proj, pts: V3[], near = NEAR + 2): V3[][] => {
  const pieces: V3[][] = [];
  let cur: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const inA = pr.depth(a) >= near;
    if (i > 0) {
      const b = pts[i - 1];
      const inB = pr.depth(b) >= near;
      const da = pr.depth(a) - near, db = pr.depth(b) - near;
      if (inA !== inB) cur.push(lerp3(b, a, db / (db - da)));
      if (!inA && inB) { pieces.push(cur); cur = []; }
    }
    if (inA) cur.push(a);
  }
  if (cur.length > 1) pieces.push(cur);
  return pieces.filter((p) => p.length > 1);
};
/** Keep only points in front of the camera (for hull-based solids). */
export const inFront = (pr: Proj, pts: V3[], near = NEAR + 2) => pts.filter((q) => pr.depth(q) >= near);
