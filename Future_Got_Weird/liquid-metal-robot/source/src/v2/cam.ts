// Hook 04 camera: one perspective camera over the bench, in centimetres (x right, y away from the viewer, z up).
// Every object is projected through it, so the cage bars, the coil, the mould and the liquid share one perspective
// and the camera's slow orbit gives real parallax.
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const a3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const s3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const m3 = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});
export const l3 = (a: V3, b: V3, u: number): V3 => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u});
export const d3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const n3 = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};

export type Cam = {t: V3; s: number; yaw: number; pitch: number; D: number; cx: number; cy: number};
/** a projected point: screen x, y (px), local scale k (px per cm at that depth), depth d (cm) */
export type SP = {x: number; y: number; k: number; d: number};

const R = Math.PI / 180;
export const project = (c: Cam, p: V3): SP => {
  const rx = p.x - c.t.x, ry = p.y - c.t.y, rz = p.z - c.t.z;
  const cy = Math.cos(c.yaw * R), sy = Math.sin(c.yaw * R);
  const x1 = rx * cy - ry * sy;
  const y1 = rx * sy + ry * cy;
  const cp = Math.cos(c.pitch * R), sp = Math.sin(c.pitch * R);
  const up = y1 * sp + rz * cp;
  const dep = c.D + y1 * cp - rz * sp;
  const f = c.D / dep;
  return {x: c.cx + c.s * x1 * f, y: c.cy - c.s * up * f, k: c.s * f, d: dep};
};

/** the camera's position in world space (for face visibility and depth sorting) */
export const camPos = (c: Cam): V3 => {
  const cp = Math.cos(c.pitch * R), sp = Math.sin(c.pitch * R);
  const cy = Math.cos(c.yaw * R), sy = Math.sin(c.yaw * R);
  const y1 = -c.D * cp;
  return {x: c.t.x + y1 * sy, y: c.t.y + y1 * cy, z: c.t.z + c.D * sp};
};

export type Ell = {cx: number; cy: number; rx: number; ry: number; rot: number};
/** screen outline of an ellipsoid with centre c and three (orthogonal) world half-axes */
export const ellipsoid = (c: Cam, ctr: V3, axes: V3[]): Ell => {
  const o = project(c, ctr);
  let A = 0, B = 0, C = 0;
  for (const ax of axes) {
    const q = project(c, a3(ctr, ax));
    const jx = q.x - o.x, jy = q.y - o.y;
    A += jx * jx;
    B += jx * jy;
    C += jy * jy;
  }
  const m = (A + C) / 2, d = Math.sqrt(((A - C) / 2) ** 2 + B * B);
  const ang = 0.5 * Math.atan2(2 * B, A - C);
  return {cx: o.x, cy: o.y, rx: Math.sqrt(Math.max(1e-6, m + d)), ry: Math.sqrt(Math.max(1e-6, m - d)), rot: ang / R};
};

/** points of a horizontal circle (centre c, radius r) projected, from angle a0 to a1 (deg) */
export const circlePts = (c: Cam, ctr: V3, r: number, a0 = 0, a1 = 360, n = 64) => {
  const out: SP[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * R;
    out.push(project(c, {x: ctr.x + r * Math.cos(a), y: ctr.y + r * Math.sin(a), z: ctr.z}));
  }
  return out;
};
/** the world angle (deg) of the horizontal direction that faces the camera, seen from point p */
export const facingAngle = (c: Cam, p: V3) => {
  const cp = camPos(c);
  return Math.atan2(cp.y - p.y, cp.x - p.x) / R;
};
export const poly = (pts: {x: number; y: number}[], close = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + (close ? 'Z' : '');
