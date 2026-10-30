// Shared timing and easing helpers for the 10-hook preview round (carried over from the Zombie Ant episode's lib.ts).
// Every hook is exactly 6.0 s: 180 frames at 30 fps, 1080 x 1920.
export const FPS = 30;
export const W = 1080, H = 1920;
export const DUR = 6;
export const FRAMES = 180;

export type Word = {word: string; start: number; end: number};
export type Words = {hook: string; line: string; emph: string[]; speech_end: number; words: Word[]};

const k = (s: string) => s.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
/** the n-th occurrence of a spoken word (case and punctuation ignored): {word, start, end} in seconds */
export const wordAt = (W: Words, w: string, n = 0): Word => {
  const hit = W.words.filter((x) => k(x.word) === k(w))[n];
  if (!hit) throw new Error(`word not in narration: ${w} #${n}`);
  return hit;
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** smoothstep of t between a and b */
export const ss = (t: number, a: number, b: number) => sm((t - a) / (b - a));
/** C2 step, for camera moves */
export const ss5 = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const easeOut = (x: number) => 1 - (1 - clamp(x)) ** 3;
export const easeIn = (x: number) => clamp(x) ** 2;
/** piecewise keyed scalar (C2 ease per segment) */
export const keyS = (t: number, keys: [number, number][], ease: (x: number) => number = (x) => ss5(x, 0, 1)) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i];
      return a + (b - a) * ease((t - t0) / (t1 - t0 || 1));
    }
  }
  return keys[keys.length - 1][1];
};
/**
 * Smooth camera path through keyed values with continuous velocity (Catmull-Rom in value, eased time per segment is
 * NOT used: velocity carries across keys, so a move never stops dead at a key unless two keys repeat a value).
 */
export const keyCR = (t: number, keys: [number, number][]) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const [t1, p1] = keys[i], [t2, p2] = keys[i + 1];
  const [t0, p0] = keys[Math.max(0, i - 1)], [t3, p3] = keys[Math.min(n - 1, i + 2)];
  const h = t2 - t1, u = (t - t1) / h;
  const m1 = i === 0 ? 0 : ((p2 - p0) / (t2 - t0)) * h;
  const m2 = i + 2 >= n ? 0 : ((p3 - p1) / (t3 - t1)) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
};
/** deterministic hash noise in [0,1) */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** smooth 1D value noise in [-1,1] */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = hash(i + seed * 101.3) * 2 - 1, b = hash(i + 1 + seed * 101.3) * 2 - 1;
  return a + (b - a) * f * f * (3 - 2 * f);
};
/** a damped oscillation after t0 (0 before) */
export const ring = (t: number, t0: number, freq: number, decay: number) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay) * Math.sin(2 * Math.PI * freq * (t - t0)));
/** fixed-precision number for SVG attributes */
export const f2 = (x: number) => x.toFixed(2);
/** a smooth closed path through points (Catmull-Rom -> cubic Bezier) */
export const closedPath = (pts: {x: number; y: number}[], tension = 1) => {
  const n = pts.length;
  let d = `M${f2(pts[0].x)},${f2(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension};
    const c2 = {x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension};
    d += ` C${f2(c1.x)},${f2(c1.y)} ${f2(c2.x)},${f2(c2.y)} ${f2(p2.x)},${f2(p2.y)}`;
  }
  return d + 'Z';
};
/** a smooth open path through points */
export const openPath = (pts: {x: number; y: number}[], tension = 1) => {
  const n = pts.length;
  let d = `M${f2(pts[0].x)},${f2(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = {x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension};
    const c2 = {x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension};
    d += ` C${f2(c1.x)},${f2(c1.y)} ${f2(c2.x)},${f2(c2.y)} ${f2(p2.x)},${f2(p2.y)}`;
  }
  return d;
};
