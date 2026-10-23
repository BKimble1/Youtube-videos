// V2 maths, easing and the nested-level 2D camera. Ported from FGW Infrared Contacts (source/src/lib.ts on
// claude/new-session-fmiflr): the same log-zoom camera with an inverse-zoom-weighted centre, so every zoom reads as
// one continuous dive and nothing ever cuts. Generalised here to any number of nested levels (each level supplies its
// own matrix into L0).
export type Pt = {x: number; y: number};
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const sstep = (a: number, b: number, x: number) => {
  const t = inv(a, b, x);
  return t * t * (3 - 2 * t);
};
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = (t: number) => 1 - Math.pow(1 - t, 3);
export const ein = (t: number) => t * t * t;
export const eio2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const lin = (t: number) => t;
export const ramp = (a: number, b: number, x: number, e: (t: number) => number = eio) => e(inv(a, b, x));
export const fadeWin = (t: number, a: number, b: number, f = 0.15) => clamp(Math.min(inv(a, a + f, t), 1 - inv(b - f, b, t)));
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const P = (x: number, y: number): Pt => ({x, y});
export const add = (a: Pt, b: Pt): Pt => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Pt, b: Pt): Pt => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: Pt, k: number): Pt => ({x: a.x * k, y: a.y * k});
export const len = (a: Pt) => Math.hypot(a.x, a.y);
export const lerpP = (a: Pt, b: Pt, t: number): Pt => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
export const rot = (p: Pt, deg: number, c: Pt = {x: 0, y: 0}): Pt => {
  const r = (deg * Math.PI) / 180, dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};
export const f3 = (v: number) => (Math.abs(v) < 1e-9 ? '0' : v.toFixed(3));
export const pathD = (pts: Pt[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${f3(p.x)} ${f3(p.y)}`).join('') + (close ? 'Z' : '');
// Catmull-Rom smooth path through points
export const smooth = (pts: Pt[], close = false, k = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return pathD(pts, close);
  const g = (i: number) => (close ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${f3(pts[0].x)} ${f3(pts[0].y)}`;
  const m = close ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f3(p1.x + (p2.x - p0.x) * k)} ${f3(p1.y + (p2.y - p0.y) * k)} ${f3(p2.x - (p3.x - p1.x) * k)} ${f3(p2.y - (p3.y - p1.y) * k)} ${f3(p2.x)} ${f3(p2.y)}`;
  }
  return d + (close ? 'Z' : '');
};
// piecewise-linear keyed value with an optional ease per segment
export const pw = (t: number, keys: [number, number, ((x: number) => number)?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (keys[i][2] ?? eio)(inv(keys[i - 1][0], keys[i][0], t)));
  return keys[keys.length - 1][1];
};

// ---- affine matrices (SVG matrix(a b c d e f)) ----
export type Mat = [number, number, number, number, number, number];
export const matStr = (m: Mat) => `matrix(${m.map((v) => (Math.abs(v) < 1e-12 ? 0 : v)).join(' ')})`;
export const mmul = (A: Mat, B: Mat): Mat => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
export const apply = (m: Mat, p: Pt): Pt => ({x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5]});
export const T = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const S = (k: number, ky = k): Mat => [k, 0, 0, ky, 0, 0];
export const R = (deg: number, c: Pt = {x: 0, y: 0}): Mat => {
  const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r);
  return mmul(T(c.x, c.y), mmul([co, si, -si, co, 0, 0], T(-c.x, -c.y)));
};
export const matScale = (m: Mat) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

// ---- camera: centre in L0 and zoom (screen px per L0 px) ----
export const W = 1080;
export const H = 1920;
export type Cam = {x: number; y: number; z: number};
export const camMat = (c: Cam): Mat => mmul(T(W / 2, H / 2), mmul(S(c.z), T(-c.x, -c.y)));
// a key: an L0 point that sits at screen (sx, sy) with `zl` screen px per unit of a level whose L0 scale is `ls`
export const keyCam = (p: Pt, sx: number, sy: number, zl: number, ls = 1): Cam => {
  const z = zl / ls;
  return {x: p.x - (sx - W / 2) / z, y: p.y - (sy - H / 2) / z, z};
};
export const camLerp = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  const wa = 1 / a.z, wb = 1 / b.z, wz = 1 / z;
  const k = Math.abs(wa - wb) < 1e-12 ? t : (wa - wz) / (wa - wb);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z};
};
export type CamKey = [number, Cam, ((x: number) => number)?];
export const camKeys = (t: number, keys: CamKey[]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, c0] = keys[i - 1];
      const [t1, c1, e] = keys[i];
      return camLerp(c0, c1, (e ?? eio)(inv(t0, t1, t)));
    }
  }
  return keys[keys.length - 1][1];
};
export const place = (p: Pt, k: number, deg = 0) => `translate(${f3(p.x)} ${f3(p.y)}) rotate(${f3(deg)}) scale(${k})`;

// ---- continuous-velocity camera: each segment is the same log-zoom dive (camLerp), but its progress follows a cubic
// Hermite whose end slopes are chosen so the camera's screen-space speed is continuous through every key. A key is a
// stop only when the motion reverses there (or when marked 'hold').
const camMetric = (a: Cam, b: Cam) => {
  const z = Math.sqrt(a.z * b.z);
  return [Math.log(b.z / a.z) * 0.9, ((b.x - a.x) * z) / W, ((b.y - a.y) * z) / W];
};
const mlen = (v: number[]) => Math.hypot(v[0], v[1], v[2]);
export type FlowKey = [number, Cam, 'hold'?];
export const camFlow = (t: number, keys: FlowKey[]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const segSpeed = (i: number) => mlen(camMetric(keys[i][1], keys[i + 1][1])) / (keys[i + 1][0] - keys[i][0]);
  const dirAt = (i: number, end: boolean) => {
    const e = 1e-3, a = keys[i][1], b = keys[i + 1][1];
    const p = end ? camLerp(a, b, 1 - e) : camLerp(a, b, 0), q = end ? camLerp(a, b, 1) : camLerp(a, b, e);
    const v = camMetric(p, q);
    return {v, d: mlen(v) / e}; // metric per unit progress
  };
  // speed (metric per second) at key j (0 at holds, reversals, the first and last keys)
  const keySpeed = (j: number) => {
    if (j <= 0 || j >= n - 1 || keys[j][2] === 'hold') return 0;
    const A = dirAt(j - 1, true), B = dirAt(j, false);
    const dot = A.v[0] * B.v[0] + A.v[1] * B.v[1] + A.v[2] * B.v[2];
    if (dot <= 0.5 * mlen(A.v) * mlen(B.v)) return 0; // a turn sharper than 60 deg: stop and go
    return Math.sqrt(segSpeed(j - 1) * segSpeed(j));
  };
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const [t0, c0] = keys[i], [t1, c1] = keys[i + 1], T = t1 - t0;
  const s = (t - t0) / T;
  const a = Math.min(3, (keySpeed(i) * T) / Math.max(1e-9, dirAt(i, false).d));
  const b = Math.min(3, (keySpeed(i + 1) * T) / Math.max(1e-9, dirAt(i, true).d));
  const k = (s ** 3 - 2 * s ** 2 + s) * a + (-2 * s ** 3 + 3 * s ** 2) + (s ** 3 - s ** 2) * b;
  return camLerp(c0, c1, clamp(k, -0.05, 1.05));
};
