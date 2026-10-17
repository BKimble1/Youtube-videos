// Small drawing helpers shared by the R2 rig.
import {V2, V3, rnd, smoothPath, polyPath} from '../../kit/math';

/** Irregular blob path (seeded) centred at 0,0 with radius r. */
export const blobPath = (r: number, seed: number, n = 9, rough = 0.32, sx = 1, sy = 1) => {
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 7);
    pts.push({x: Math.cos(a) * r * k * sx, y: Math.sin(a) * r * k * sy});
  }
  return smoothPath(pts, true, 0.9);
};
/** Jagged tear patch path. */
export const tearPath = (r: number, seed: number) => {
  const pts: V2[] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = i % 2 ? 0.55 + 0.25 * rnd(seed + i) : 1 + 0.15 * rnd(seed * 3 + i);
    pts.push({x: Math.cos(a) * r * k, y: Math.sin(a) * r * k * 0.8});
  }
  return polyPath(pts);
};

/**
 * Orthographic outline of an ellipsoid with centre c and three (scaled) semi-axis vectors in screen space (x right,
 * y down, z toward the viewer): the projected ellipse has shape matrix A·Aᵀ (A = the axes' xy parts).
 */
export const ellipsoid2 = (axes: V3[]) => {
  let a = 0, b = 0, d = 0;
  axes.forEach((v) => { a += v.x * v.x; b += v.x * v.y; d += v.y * v.y; });
  const tr = a + d, det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(1e-9, tr / 2 - disc);
  const ang = Math.abs(b) < 1e-9 ? (a >= d ? 0 : 90) : (Math.atan2(l1 - a, b) * 180) / Math.PI;
  return {rx: Math.sqrt(l1), ry: Math.sqrt(l2), rot: ang};
};

export const P2 = (q: V3): V2 => ({x: q.x, y: q.y});
export const ang2 = (a: V2, b: V2) => Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
