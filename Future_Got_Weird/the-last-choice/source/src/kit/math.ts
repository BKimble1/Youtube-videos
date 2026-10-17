// Shared deterministic math: easing, keys, seeded noise, small vector helpers. Everything is a pure function of time.
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const clamp01 = (x: number) => clamp(x, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => (b === a ? 0 : (x - a) / (b - a));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOut2 = (x: number) => 1 - Math.pow(1 - clamp01(x), 2);
export const easeIn2 = (x: number) => Math.pow(clamp01(x), 2);
export const backOut = (x: number, k = 1.4) => {
  const t = clamp01(x) - 1;
  return 1 + t * t * ((k + 1) * t + k);
};
/** Damped settle from 0 to 1 after t0 (seconds). */
export const spring = (t: number, t0: number, f = 2.2, d = 6) => (t <= t0 ? 0 : 1 - Math.exp(-d * (t - t0)) * Math.cos(2 * Math.PI * f * (t - t0)));
/** Decaying oscillation after an impact at t0 (0 before). */
export const ring = (t: number, t0: number, f = 6, d = 5) => (t < t0 ? 0 : Math.exp(-d * (t - t0)) * Math.sin(2 * Math.PI * f * (t - t0)));
export type Ease = (x: number) => number;
/** Piecewise keys [[t, v], ...]; the segment arriving at a key uses that key's ease (default smooth). */
export const keys = (t: number, k: ([number, number] | [number, number, Ease])[]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const e = (k[i] as [number, number, Ease])[2] ?? smooth;
      return lerp(k[i - 1][1], k[i][1], e((t - k[i - 1][0]) / Math.max(1e-6, k[i][0] - k[i - 1][0])));
    }
  }
  return k[k.length - 1][1];
};
/** keys over 2D points */
export const keys2 = (t: number, k: [number, number, number, Ease?][]) => ({
  x: keys(t, k.map((q) => (q[3] ? [q[0], q[1], q[3]] : [q[0], q[1]]) as [number, number, Ease])),
  y: keys(t, k.map((q) => (q[3] ? [q[0], q[2], q[3]] : [q[0], q[2]]) as [number, number, Ease])),
});
export const rnd = (seed: number) => {
  let t = (Math.floor(seed) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const rndr = (seed: number, a: number, b: number) => a + (b - a) * rnd(seed);
/** Smooth 1D value noise in [-1, 1] (seeded, C1-continuous). */
export const noise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = rnd(i * 374761 + seed * 668265) * 2 - 1;
  const b = rnd((i + 1) * 374761 + seed * 668265) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
export const fbm = (x: number, seed = 0) => noise(x, seed) * 0.6 + noise(x * 2.13, seed + 7) * 0.28 + noise(x * 4.7, seed + 13) * 0.12;
export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;
export const wrapDeg = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export type V2 = {x: number; y: number};
export type V3 = {x: number; y: number; z: number};
export const v2 = (x: number, y: number): V2 => ({x, y});
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul3 = (a: V3, k: number): V3 => ({x: a.x * k, y: a.y * k, z: a.z * k});
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
export const norm3 = (a: V3): V3 => {
  const l = len3(a) || 1;
  return {x: a.x / l, y: a.y / l, z: a.z / l};
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t)});
export const lerp2 = (a: V2, b: V2, t: number): V2 => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
/** Rotate vector v about unit axis k by angle a (radians), Rodrigues. */
export const rotAxis = (v: V3, k: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  const kv = cross3(k, v);
  const kd = dot3(k, v) * (1 - c);
  return {x: v.x * c + kv.x * s + k.x * kd, y: v.y * c + kv.y * s + k.y * kd, z: v.z * c + kv.z * s + k.z * kd};
};
export const f2 = (n: number) => (Math.round(n * 100) / 100).toString();
export const pt = (p: V2) => `${f2(p.x)} ${f2(p.y)}`;
/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
export const smoothPath = (pts: V2[], closed = true, tension = 0.5) => {
  const n = pts.length;
  if (n < 3) return 'M ' + pts.map(pt).join(' L ') + (closed ? ' Z' : '');
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${pt(pts[0])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = {x: p1.x + ((p2.x - p0.x) * tension) / 3, y: p1.y + ((p2.y - p0.y) * tension) / 3};
    const c2 = {x: p2.x - ((p3.x - p1.x) * tension) / 3, y: p2.y - ((p3.y - p1.y) * tension) / 3};
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + (closed ? ' Z' : '');
};
export const polyPath = (pts: V2[], closed = true) => 'M ' + pts.map(pt).join(' L ') + (closed ? ' Z' : '');
