// Shared maths, easing, camera and timeline helpers for FGW "This Robot Is Wearing Living Human Skin".
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
// smoother in/out with gentle start and settle (quintic)
export const eio5 = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);
export const ramp = (a: number, b: number, x: number, e: (t: number) => number = eio) => e(inv(a, b, x));
export const fr = (s: number) => Math.round(s * FPS) / FPS;

// --- narration words (measured on the final narration, see tools/make_narration.py) ---
type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const word = (w: string, n = 1) => {
  const hits = WORDS.filter((x) => x.word === w);
  if (hits.length < n) throw new Error('missing word ' + w);
  return hits[n - 1];
};
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];

// --- camera: world -> screen as translate(540,960) rotate(r) scale(z) translate(-x,-y) ---
export type Cam = {x: number; y: number; z: number; r?: number};
export const camT = (c: Cam) => `translate(${W / 2} ${H / 2}) rotate(${c.r ?? 0}) scale(${c.z}) translate(${-c.x} ${-c.y})`;
export const toScreen = (c: Cam, p: Pt): Pt => {
  const r = ((c.r ?? 0) * Math.PI) / 180;
  const dx = (p.x - c.x) * c.z, dy = (p.y - c.y) * c.z;
  return {x: W / 2 + dx * Math.cos(r) - dy * Math.sin(r), y: H / 2 + dx * Math.sin(r) + dy * Math.cos(r)};
};
// interpolate cameras: zoom in log space; the centre is interpolated so the screen-space motion is even across a zoom
export const camLerp = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  // weight centre by inverse zoom so zooms toward a point feel like a dive, not a slide
  const wa = 1 / a.z, wb = 1 / b.z, wz = 1 / z;
  const k = Math.abs(wa - wb) < 1e-9 ? t : (wa - wz) / (wa - wb);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z, r: lerp(a.r ?? 0, b.r ?? 0, t)};
};
// keyframed camera: [time, cam, ease-into-this-key]
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

export const path = (pts: Pt[], close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('') + (close ? 'Z' : '');
// Catmull-Rom smooth path through points
export const smooth = (pts: Pt[], close = false, k = 1 / 6) => {
  const n = pts.length;
  if (n < 3) return path(pts, close);
  const g = (i: number) => (close ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  const m = close ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${(p1.x + (p2.x - p0.x) * k).toFixed(2)} ${(p1.y + (p2.y - p0.y) * k).toFixed(2)} ${(p2.x - (p3.x - p1.x) * k).toFixed(2)} ${(p2.y - (p3.y - p1.y) * k).toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + (close ? 'Z' : '');
};
export const hull = (P: Pt[]): Pt[] => {
  const p = [...P].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
// deterministic pseudo-random
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Camera B that shows mapping B's tissue point (u, w) exactly where (and at the scale/orientation) camera A shows
// mapping A's: used for matched cuts between scenes that draw the same cells.
export const matchCam = (camA: Cam, mapA: (u: number, w: number) => Pt, mapB: (u: number, w: number) => Pt, u: number, w: number): Cam => {
  const SA = toScreen(camA, mapA(u, w)), SA2 = toScreen(camA, mapA(u + 20, w));
  const PB = mapB(u, w), PB2 = mapB(u + 20, w);
  const sA = Math.hypot(SA2.x - SA.x, SA2.y - SA.y), aA = Math.atan2(SA2.y - SA.y, SA2.x - SA.x);
  const sB = Math.hypot(PB2.x - PB.x, PB2.y - PB.y), aB = Math.atan2(PB2.y - PB.y, PB2.x - PB.x);
  const z = sA / sB, r = aA - aB;
  const dx = (SA.x - W / 2) / z, dy = (SA.y - H / 2) / z;
  // c = PB - R(-r) * d
  const cx = PB.x - (dx * Math.cos(-r) - dy * Math.sin(-r)), cy = PB.y - (dx * Math.sin(-r) + dy * Math.cos(-r));
  return {x: cx, y: cy, z, r: (r * 180) / Math.PI};
};
// camera that puts world point p at screen point s with zoom z and rotation r
export const camAt = (p: Pt, s: Pt, z: number, r = 0): Cam => {
  const rr = (-r * Math.PI) / 180, dx = (s.x - W / 2) / z, dy = (s.y - H / 2) / z;
  return {x: p.x - (dx * Math.cos(rr) - dy * Math.sin(rr)), y: p.y - (dx * Math.sin(rr) + dy * Math.cos(rr)), z, r};
};
