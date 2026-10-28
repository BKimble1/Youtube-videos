// A pinhole camera for the flat-illustration sets (the V4-V6 corridor method of Invisibility Shield / Real Web Fluid,
// rig/geo.ts there): sets are flat-filled polygons placed in metres and projected per frame; characters are 2D cutout
// cards drawn at the scale their ground point projects to. World: x right, y up, z away from the camera's rest view.
export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul3 = (a: V3, s: number): V3 => ({x: a.x * s, y: a.y * s, z: a.z * s});
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
export const norm3 = (a: V3): V3 => {
  const l = len3(a) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});
const R = Math.PI / 180;

/** yaw: 0 looks along +z, + turns toward +x. pitch: + looks up. f in px; (cx, cy) principal point; roll deg. */
export type Cam = {pos: V3; yaw: number; pitch: number; f: number; cx: number; cy: number; roll?: number};
export type B = {c: Cam; fwd: V3; right: V3; up: V3};
export const basis = (c: Cam): B => {
  const cy = Math.cos(c.yaw * R), sy = Math.sin(c.yaw * R), cp = Math.cos(c.pitch * R), sp = Math.sin(c.pitch * R);
  const fwd = v3(sy * cp, sp, cy * cp);
  const right = norm3(cross3(v3(0, 1, 0), fwd));
  const up = cross3(fwd, right);
  return {c, fwd, right, up};
};
export type P2 = {x: number; y: number; z: number};
export const proj = (b: B, p: V3): P2 => {
  const d = sub3(p, b.c.pos);
  const z = dot3(d, b.fwd);
  const zz = Math.max(z, 1e-4);
  let sx = (b.c.f * dot3(d, b.right)) / zz, sy = (-b.c.f * dot3(d, b.up)) / zz;
  if (b.c.roll) {
    const r = b.c.roll * R, c = Math.cos(r), s = Math.sin(r);
    [sx, sy] = [sx * c - sy * s, sx * s + sy * c];
  }
  return {x: b.c.cx + sx, y: b.c.cy + sy, z};
};
/** depth along the view axis */
export const depth = (b: B, p: V3) => dot3(sub3(p, b.c.pos), b.fwd);
/** px per metre for something at p */
export const scaleAt = (b: B, p: V3) => b.c.f / Math.max(depth(b, p), 1e-3);
/** clip a world polygon to the near plane, then project it */
export const projPoly = (b: B, pts: V3[], near = 0.05): P2[] => {
  const dz = (p: V3) => depth(b, p) - near;
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], c = pts[(i + 1) % pts.length];
    const da = dz(a), dc = dz(c);
    if (da >= 0) out.push(a);
    if (da >= 0 !== dc >= 0) out.push(lerp3(a, c, da / (da - dc)));
  }
  return out.map((p) => proj(b, p));
};
export const pathOf = (pts: {x: number; y: number}[], close = true) =>
  pts.length ? `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}${close ? 'Z' : ''}` : '';
export const lookAt = (pos: V3, target: V3, f: number, cx = 540, cy = 960, roll = 0): Cam => {
  const d = norm3(sub3(target, pos));
  return {pos, yaw: (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch: (Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI, f, cx, cy, roll};
};
export const lerpCam = (a: Cam, b: Cam, u: number): Cam => {
  let dy = b.yaw - a.yaw;
  while (dy > 180) dy -= 360;
  while (dy < -180) dy += 360;
  return {pos: lerp3(a.pos, b.pos, u), yaw: a.yaw + dy * u, pitch: a.pitch + (b.pitch - a.pitch) * u, f: a.f + (b.f - a.f) * u, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * u};
};
/** keyed camera path: each segment eased with the C2 smootherstep unless given an easing */
export const camKeys = (t: number, keys: [number, Cam, ((x: number) => number)?][]): Cam => {
  const s5 = (x: number) => {
    const u = Math.min(1, Math.max(0, x));
    return u * u * u * (u * (u * 6 - 15) + 10);
  };
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
      return lerpCam(a, b, (e ?? s5)((t - t0) / (t1 - t0 || 1)));
    }
  }
  return keys[keys.length - 1][1];
};
/** a camera that frames world point `target` at screen (sx, sy) from position `pos` (looking along +z, pitch p) */
export const camFraming = (pos: V3, pitch: number, f: number, cy = 960): Cam => ({pos, yaw: 0, pitch, f, cx: 540, cy});
/** V3: a camera path through keys with continuous velocity (cubic Hermite, finite-difference tangents), so a move
 *  can pass through a key without stopping; a key marked `stop` is passed at rest (a hold or a reversal). */
export const camPath = (t: number, keys: [number, Cam, boolean?][]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const flat = (c: Cam) => [c.pos.x, c.pos.y, c.pos.z, c.yaw, c.pitch, c.f, c.cx, c.cy, c.roll ?? 0];
  const tan = (k: number) => {
    if (k <= 0 || k >= n - 1 || keys[k][2]) return flat(keys[k][1]).map(() => 0);
    const a = flat(keys[k - 1][1]), b = flat(keys[k + 1][1]);
    const dt = keys[k + 1][0] - keys[k - 1][0];
    return a.map((v, j) => (b[j] - v) / dt);
  };
  const [t0, c0] = keys[i], [t1, c1] = keys[i + 1];
  const h = t1 - t0, s = (t - t0) / h;
  const p0 = flat(c0), p1 = flat(c1), m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  const v = p0.map((a, j) => h00 * a + h10 * h * m0[j] + h01 * p1[j] + h11 * h * m1[j]);
  return {pos: v3(v[0], v[1], v[2]), yaw: v[3], pitch: v[4], f: v[5], cx: v[6], cy: v[7], roll: v[8]};
};
