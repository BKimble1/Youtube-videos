// Timing and math helpers. Every cue in the film is placed from the measured word times of the narration take
// (src/data/timeline.json, zipformer alignment of t2_ePVX), never from hand-typed seconds.
import TL from './data/timeline.json';

export const FPS = 30;
export const DUR = TL.duration as number;
export const FRAMES = TL.frames as number;
export type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = TL.words as Word[];

const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');
/** start (s) of the n-th (1-based) occurrence of a word */
export const W = (word: string, n = 1): number => {
  let k = 0;
  for (const w of WORDS) if (clean(w.word) === clean(word) && ++k === n) return w.start;
  throw new Error(`word not found: ${word} #${n}`);
};
/** end (s) of the n-th occurrence of a word */
export const WE = (word: string, n = 1): number => {
  let k = 0;
  for (const w of WORDS) if (clean(w.word) === clean(word) && ++k === n) return w.end;
  throw new Error(`word not found: ${word} #${n}`);
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** smoothstep 0..1 between t0 and t1 */
export const ss = (t: number, t0: number, t1: number) => {
  const x = clamp((t - t0) / (t1 - t0));
  return x * x * (3 - 2 * x);
};
/** smootherstep */
export const ss5 = (t: number, t0: number, t1: number) => {
  const x = clamp((t - t0) / (t1 - t0));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** ease-out (fast start, soft landing) */
export const eo = (t: number, t0: number, t1: number) => {
  const x = clamp((t - t0) / (t1 - t0));
  return 1 - Math.pow(1 - x, 3);
};
/** ease-in */
export const ei = (t: number, t0: number, t1: number) => {
  const x = clamp((t - t0) / (t1 - t0));
  return x * x * x;
};
/** back-out overshoot */
export const bo = (t: number, t0: number, t1: number, k = 1.70158) => {
  const x = clamp((t - t0) / (t1 - t0)) - 1;
  return 1 + (k + 1) * x * x * x + k * x * x;
};
/** rise a→b, hold, fall c→d */
export const pulse = (t: number, a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d));
/** keyed interpolation with smooth easing between keys: [[t, v], ...] */
export const keys = (t: number, ks: [number, number][], ease: (t: number, a: number, b: number) => number = ss) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
    if (t <= t1) return lerp(v0, v1, ease(t, t0, t1));
  }
  return ks[ks.length - 1][1];
};
/** a decaying spring kick that starts at t0 */
export const kick = (t: number, t0: number, freq = 9, decay = 7) => (t < t0 ? 0 : Math.sin((t - t0) * freq * Math.PI * 2 * 0.5) * Math.exp(-(t - t0) * decay));
/** a damped impulse 0→1→0 (sharp attack) */
export const blip = (t: number, t0: number, len = 0.25) => (t < t0 ? 0 : Math.exp(-((t - t0) / len) * 3) * clamp((t - t0) / 0.03));

export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = hash(i + seed * 57.3), b = hash(i + 1 + seed * 57.3);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
/** smooth noise in -1..1 */
export const wob = (t: number, rate: number, seed = 0) => noise1(t * rate, seed) * 2 - 1;

export type P = {x: number; y: number};
export const mixP = (a: P, b: P, t: number): P => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
export const f2 = (n: number) => n.toFixed(2);
export const pts = (ps: P[]) => ps.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ');
/** closed smooth path through points (Catmull-Rom → cubic Bezier) */
export const smoothPath = (ps: P[], closed = true, tension = 0.5) => {
  const n = ps.length;
  if (n < 2) return '';
  const g = (i: number) => (closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f2(ps[0].x)},${f2(ps[0].y)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = {x: p1.x + ((p2.x - p0.x) * tension) / 3, y: p1.y + ((p2.y - p0.y) * tension) / 3};
    const c2 = {x: p2.x - ((p3.x - p1.x) * tension) / 3, y: p2.y - ((p3.y - p1.y) * tension) / 3};
    d += ` C${f2(c1.x)},${f2(c1.y)} ${f2(c2.x)},${f2(c2.y)} ${f2(p2.x)},${f2(p2.y)}`;
  }
  return d + (closed ? ' Z' : '');
};
