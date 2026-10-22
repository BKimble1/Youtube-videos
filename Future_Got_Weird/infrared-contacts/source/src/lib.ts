// Shared maths, easing, timeline and the nested-level camera for FGW "These Contacts Let You See With Your Eyes Closed".
//
// One spatial model for the whole film. Three nested drawing levels, each mapped into its parent:
//   L0  train compartment (px of the 1080x1920 wide shot)
//   L1  the lead's rig (head ~600 units tall, eyeball centre near the origin); L1 -> L0 = LEAD.at + LEAD.s * p
//   L2  the eye section (eyeball radius 100, front of the eye = +x); L2 -> L1 = head rotation of (SEC.o + SEC.s * p)
// The camera is a centre in L0 and a zoom (screen px per L0 px). Every level's screen matrix is computed here in double
// precision, so the dive from the compartment to one nanoparticle (zoom ~ 10^5) never loses precision in the browser.
import tl from './data/timeline.json';

export const W = 1080;
export const H = 1920;
export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;

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
export const lerpP = (a: Pt, b: Pt, t: number): Pt => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
export const rot = (p: Pt, deg: number, c: Pt = {x: 0, y: 0}): Pt => {
  const r = (deg * Math.PI) / 180, dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};
export const pathD = (pts: Pt[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('') + (close ? 'Z' : '');
// Catmull-Rom smooth path through points
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

// --- narration words (measured on the final narration, see tools/make_narration.py) ---
type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const word = (w: string, n = 1) => {
  const hits = WORDS.filter((x) => x.word === w);
  if (hits.length < n) throw new Error('missing word ' + w);
  return hits[n - 1];
};
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];

// --- levels ---
// L1 -> L0: the lead sits on the left bench of the compartment
export const LEAD = {at: {x: 262, y: 806}, s: 0.35};
// L2 -> L1: the eye section sits under the lead's near eye. Head rotation (sleep settle) is about NECK in L1.
export const SEC = {o: {x: -17.7, y: 2}, s: 0.36};
export const NECK = {x: -30, y: 250};

export type Cam = {x: number; y: number; z: number}; // centre in L0, zoom (screen px per L0 px)
export type Mat = [number, number, number, number, number, number]; // SVG matrix(a b c d e f)
export const matStr = (m: Mat) => `matrix(${m.map((v) => (Math.abs(v) < 1e-12 ? 0 : v)).join(' ')})`;
const mmul = (A: Mat, B: Mat): Mat => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
export const apply = (m: Mat, p: Pt): Pt => ({x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5]});
const T = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
const S = (k: number): Mat => [k, 0, 0, k, 0, 0];
const R = (deg: number, c: Pt = {x: 0, y: 0}): Mat => {
  const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.sin(r);
  return mmul(T(c.x, c.y), mmul([co, si, -si, co, 0, 0], T(-c.x, -c.y)));
};
// level -> L0 matrices (head tilt in degrees)
export const M10 = (): Mat => mmul(T(LEAD.at.x, LEAD.at.y), S(LEAD.s));
export const MHead = (tilt: number): Mat => R(tilt, NECK); // head group inside L1
export const M21 = (tilt: number): Mat => mmul(MHead(tilt), mmul(T(SEC.o.x, SEC.o.y), S(SEC.s)));
export const M20 = (tilt: number): Mat => mmul(M10(), M21(tilt));
export const camMat = (c: Cam): Mat => mmul(T(W / 2, H / 2), mmul(S(c.z), T(-c.x, -c.y)));
export const screenMats = (c: Cam, tilt: number) => {
  const C = camMat(c);
  return {L0: C, L1: mmul(C, M10()), Head: mmul(C, mmul(M10(), MHead(tilt))), L2: mmul(C, M20(tilt))};
};
export const L1toL0 = (p: Pt) => apply(M10(), p);
export const L2toL0 = (p: Pt, tilt: number) => apply(M20(tilt), p);
export const headToL0 = (p: Pt, tilt: number) => apply(mmul(M10(), MHead(tilt)), p);
// zoom expressed per level unit: z0 = zLevel * levelScale^-1
export const SCALE1 = LEAD.s;
export const SCALE2 = LEAD.s * SEC.s;

// camera key: a point given in any level (as an L0 point getter), the screen point it should sit at, and a zoom in
// that level's units. Interpolation is in log zoom with an inverse-zoom-weighted centre so zooms read as dives.
export type CamKey = {p: Pt; sx: number; sy: number; zl: number; lvl: 0 | 1 | 2};
export const keyCam = (k: CamKey): Cam => {
  const z = k.zl / (k.lvl === 0 ? 1 : k.lvl === 1 ? SCALE1 : SCALE2);
  return {x: k.p.x - (k.sx - W / 2) / z, y: k.p.y - (k.sy - H / 2) / z, z};
};
export const camLerp = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  const wa = 1 / a.z, wb = 1 / b.z, wz = 1 / z;
  const k = Math.abs(wa - wb) < 1e-12 ? t : (wa - wz) / (wa - wb);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z};
};
export const camKeys = (t: number, keys: [number, Cam, ((x: number) => number)?][]): Cam => {
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
// a sub-transform that places a small detail (local units) at p (parent units) with scale k
export const place = (p: Pt, k: number, deg = 0) => `translate(${p.x} ${p.y}) rotate(${deg}) scale(${k})`;
