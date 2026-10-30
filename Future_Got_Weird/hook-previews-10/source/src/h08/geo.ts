// HOOK 08 geometry and camera (adapted from the Infrared Contacts V2 lib.ts).
// Two nested drawing levels:
//   L1  the lead's head group (head ~600 units tall, near-eye fissure centre near the origin, facing right)
//   L2  the eye section (eyeball radius 100, front of the eye = +x); L2 -> L1 = SEC.o + SEC.s * p
// The camera keeps one world point F (L1) at a screen anchor S with a zoom z (screen px per L1 unit). Because F is the
// lens point where the signal enters, the dives into the lens and back out never swing sideways.
export type Pt = {x: number; y: number};
export const P = (x: number, y: number): Pt => ({x, y});
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const ramp = (a: number, b: number, x: number, e: (t: number) => number = eio) => e(inv(a, b, x));
export const fadeWin = (t: number, a: number, b: number, f = 0.15) => clamp(Math.min(inv(a, a + f, t), 1 - inv(b - f, b, t)));
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const lerpP = (a: Pt, b: Pt, t: number): Pt => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
export const rot = (p: Pt, deg: number, c: Pt = {x: 0, y: 0}): Pt => {
  const r = (deg * Math.PI) / 180, dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};
const d2r = (d: number) => (d * Math.PI) / 180;
export const polar = (c: Pt, r: number, deg: number) => P(c.x + r * Math.cos(d2r(deg)), c.y + r * Math.sin(d2r(deg)));
export const arcPts = (c: Pt, r: number, a0: number, a1: number, n = 48) => Array.from({length: n + 1}, (_, i) => polar(c, r, lerp(a0, a1, i / n)));
export const pathD = (pts: Pt[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('') + (close ? 'Z' : '');
export const smooth = (pts: Pt[], close = false, k = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return pathD(pts, close);
  const g = (i: number) => (close ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${pts[0].x.toFixed(3)} ${pts[0].y.toFixed(3)}`;
  const m = close ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${(p1.x + (p2.x - p0.x) * k).toFixed(3)} ${(p1.y + (p2.y - p0.y) * k).toFixed(3)} ${(p2.x - (p3.x - p1.x) * k).toFixed(3)} ${(p2.y - (p3.y - p1.y) * k).toFixed(3)} ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
  }
  return d + (close ? 'Z' : '');
};

// ---- levels ----
export const SEC = {o: {x: -17.7, y: 2}, s: 0.36};
export const NECK = {x: -30, y: 250};

export type Mat = [number, number, number, number, number, number];
export const matStr = (m: Mat) => `matrix(${m.map((v) => (Math.abs(v) < 1e-12 ? 0 : v)).join(' ')})`;
export const mmul = (A: Mat, B: Mat): Mat => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
export const apply = (m: Mat, p: Pt): Pt => ({x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5]});
export const T = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const S = (k: number): Mat => [k, 0, 0, k, 0, 0];
export const R = (deg: number, c: Pt = {x: 0, y: 0}): Mat => {
  const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r);
  return mmul(T(c.x, c.y), mmul([co, si, -si, co, 0, 0], T(-c.x, -c.y)));
};
export const invMat = (m: Mat): Mat => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};
export const M21: Mat = mmul(T(SEC.o.x, SEC.o.y), S(SEC.s));
export const L2toL1 = (p: Pt) => apply(M21, p);

export type Cam = {F: Pt; S: Pt; z: number};
export const camMat = (c: Cam): Mat => [c.z, 0, 0, c.z, c.S.x - c.z * c.F.x, c.S.y - c.z * c.F.y];
