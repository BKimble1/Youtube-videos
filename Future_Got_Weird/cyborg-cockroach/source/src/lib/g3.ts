// Projected solids: exact perspective contours of ellipsoids, visible surface curves, capsules and cylinders.
// Everything returns screen-space geometry (px) for the 2D ink/shade primitives (lib/ink.tsx, lib/shade.tsx).
import {V3, V2, Frame, toW, dirW, sub, add, mul, dot, cross, norm, len} from './v3';
import {Cam, proj, depth, scaleAt} from './cam';

export type EllW = {f: Frame; c: V3; r: V3}; // ellipsoid in frame-local coords: centre and radii along local axes

/** Point on the ellipsoid from unit-sphere coordinates. */
export const ellPoint = (e: EllW, s: V3): V3 => toW(e.f, [e.c[0] + e.r[0] * s[0], e.c[1] + e.r[1] * s[1], e.c[2] + e.r[2] * s[2]]);
/** Camera position in the ellipsoid's unit-sphere space. */
export const camSphere = (e: EllW, cam: Cam): V3 => {
  const d = sub(cam.eye, toW(e.f, e.c));
  return [dot(d, e.f.x) / e.r[0], dot(d, e.f.y) / e.r[1], dot(d, e.f.z) / e.r[2]];
};
/** A unit-sphere point is visible from the camera when the camera is outside its tangent plane. */
export const visibleS = (C: V3, s: V3) => dot(C, s) > 1;

/** Perspective silhouette of an ellipsoid (the contour generator is the circle s.C' = 1 on the unit sphere). */
export const ellContour = (e: EllW, cam: Cam, n = 72): V2[] => {
  const C = camSphere(e, cam);
  const L = len(C);
  if (L <= 1.0001) return [];
  const q = mul(C, 1 / (L * L));
  const rho = Math.sqrt(Math.max(0, 1 - 1 / (L * L)));
  const w = mul(C, 1 / L);
  const a = norm(Math.abs(w[1]) < 0.9 ? cross(w, [0, 1, 0]) : cross(w, [1, 0, 0]));
  const b = cross(w, a);
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const s = add(q, add(mul(a, rho * Math.cos(t)), mul(b, rho * Math.sin(t))));
    pts.push(proj(cam, ellPoint(e, s)));
  }
  return pts;
};

/** Visible runs of a curve on the unit sphere (each run is a list of screen points). */
export const surfRuns = (e: EllW, cam: Cam, sPts: V3[], margin = 0.0): V2[][] => {
  const C = camSphere(e, cam);
  const runs: V2[][] = [];
  let cur: V2[] = [];
  for (const s of sPts) {
    if (dot(C, s) > 1 + margin) cur.push(proj(cam, ellPoint(e, s)));
    else if (cur.length) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
};
/** Cross-section of the unit sphere by the plane x = k (|k| < 1), as an angle-sampled loop; tilt leans the plane. */
export const ringX = (k: number, n = 64, tilt = 0, from = 0, to = Math.PI * 2): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    const y = Math.cos(a), z = Math.sin(a);
    const kk = k + tilt * y;
    const r = Math.sqrt(Math.max(0, 1 - kk * kk));
    out.push([kk, r * y, r * z]);
  }
  return out;
};
/** Latitude ring y = k */
export const ringY = (k: number, n = 64, from = 0, to = Math.PI * 2): V3[] => {
  const out: V3[] = [];
  const r = Math.sqrt(Math.max(0, 1 - k * k));
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    out.push([r * Math.cos(a), k, r * Math.sin(a)]);
  }
  return out;
};

export const fmt = (n: number) => (Math.round(n * 100) / 100).toString();
export const P2 = (p: V2) => `${fmt(p[0])} ${fmt(p[1])}`;
/** closed smooth path through points (Catmull-Rom to cubic Bezier) */
export const closedPath = (pts: V2[]) => {
  const n = pts.length;
  if (n < 3) return '';
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: V2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: V2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
  }
  return d + ' Z';
};
/** open smooth path */
export const openPath = (pts: V2[]) => {
  const n = pts.length;
  if (n < 2) return '';
  let d = `M${P2(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1: V2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: V2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
  }
  return d;
};
export const polyPath = (pts: V2[], close = true) => (pts.length ? `M${pts.map(P2).join(' L')}${close ? ' Z' : ''}` : '');
export const centroid = (pts: V2[]): V2 => {
  let x = 0, y = 0;
  for (const p of pts) (x += p[0]), (y += p[1]);
  return [x / pts.length, y / pts.length];
};
export const extent = (pts: V2[], c: V2) => Math.max(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));

/** Screen-space capsule endpoints and radii for a 3D segment. */
export const seg3 = (cam: Cam, a: V3, b: V3, ra: number, rb: number) => ({
  a: proj(cam, a), b: proj(cam, b), ra: ra * scaleAt(cam, a), rb: rb * scaleAt(cam, b), za: depth(cam, a), zb: depth(cam, b),
});

/** Cylinder (axis a->b, radius r): screen outline = side quad between the two projected end ellipses. */
export const cylOutline = (cam: Cam, a: V3, b: V3, r: number, n = 40) => {
  const ax = norm(sub(b, a));
  const u = norm(Math.abs(ax[1]) < 0.9 ? cross(ax, [0, 1, 0]) : cross(ax, [1, 0, 0]));
  const w = cross(ax, u);
  const ring = (c: V3) => {
    const pts: V2[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push(proj(cam, add(c, add(mul(u, r * Math.cos(t)), mul(w, r * Math.sin(t))))));
    }
    return pts;
  };
  const ra = ring(a), rb = ring(b);
  // the visible end cap faces the camera
  const capB = dot(sub(cam.eye, b), ax) > 0;
  return {ra, rb, capB, hull: convexHull([...ra, ...rb])};
};

export const convexHull = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
};

/** Box (centre, half sizes along frame axes): visible faces as screen quads with their world normals, back to front. */
export const boxFaces = (cam: Cam, f: Frame, c: V3, h: V3) => {
  const corner = (sx: number, sy: number, sz: number) => toW(f, [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]]);
  const faces: {n: V3; pts: V3[]}[] = [
    {n: f.x, pts: [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)]},
    {n: mul(f.x, -1), pts: [corner(-1, -1, 1), corner(-1, 1, 1), corner(-1, 1, -1), corner(-1, -1, -1)]},
    {n: f.y, pts: [corner(-1, 1, -1), corner(-1, 1, 1), corner(1, 1, 1), corner(1, 1, -1)]},
    {n: mul(f.y, -1), pts: [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)]},
    {n: f.z, pts: [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)]},
    {n: mul(f.z, -1), pts: [corner(-1, -1, -1), corner(-1, 1, -1), corner(1, 1, -1), corner(1, -1, -1)]},
  ];
  const cw = toW(f, c);
  return faces
    .filter((fc) => dot(sub(cam.eye, fc.pts[0]), fc.n) > 0)
    .map((fc) => ({n: fc.n, pts: fc.pts.map((p) => proj(cam, p)), z: depth(cam, add(cw, mul(fc.n, 0)))}));
};
export {dirW};

/** clip a 3D polygon to the camera's near plane, then project (null if nothing in front) */
export const projPoly = (cam: Cam, pts: V3[], near = 4): V2[] | null => {
  const dz = (p: V3) => depth(cam, p) - near;
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = dz(a), db = dz(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out.length >= 3 ? out.map((p) => proj(cam, p)) : null;
};
/** clip a 3D segment to the near plane and project */
export const projSeg = (cam: Cam, a: V3, b: V3, near = 4): [V2, V2] | null => {
  const da = depth(cam, a) - near, db = depth(cam, b) - near;
  if (da < 0 && db < 0) return null;
  let p = a, q = b;
  if (da < 0) p = lerp3(a, b, da / (da - db));
  if (db < 0) q = lerp3(a, b, da / (da - db));
  return [proj(cam, p), proj(cam, q)];
};
import {lerp3} from './v3';
