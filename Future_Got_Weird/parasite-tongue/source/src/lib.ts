// Timing helpers and the measured narration timeline (tools/make_narration.py -> data/timeline.json).
import TL from './data/timeline.json';

export const FPS = 30;
export const W = 1080, H = 1920;
export type Word = {word: string; start: number; end: number};
export const FRAMES: number = TL.frames;
export const DUR: number = TL.duration;
export const WORDS = TL.words as Word[];
const k = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '').replace(/’/g, "'");
/** the n-th occurrence of a spoken word (case and punctuation ignored) */
export const word = (w: string, n = 0) => {
  const hit = WORDS.filter((x) => k(x.word.replace('’', "'")) === k(w))[n];
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
