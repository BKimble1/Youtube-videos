// Shared timing helpers and the measured narration timeline (source/src/data/timeline.json, from tools/make_narration.py).
import TL from './data/timeline.json';

export const FPS = 30;
export const W = 1080, H = 1920;
export const FRAMES = TL.frames;
export const DUR = TL.duration;
export const CAPTIONS = TL.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
export const WORDS = TL.words as {word: string; start: number; end: number}[];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** smoothstep of t between a and b */
export const ss = (t: number, a: number, b: number) => sm((t - a) / (b - a));
/** C2 smootherstep between a and b (camera moves) */
export const ss5 = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const easeOut = (x: number) => 1 - (1 - clamp(x)) ** 3;
export const easeIn = (x: number) => clamp(x) ** 2;
export const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
/** a damped settle: 0 at t0, overshoots and decays (amplitude 1 at the first peak) */
export const settle = (t: number, t0: number, freq = 5, decay = 6) => (t < t0 ? 0 : Math.sin((t - t0) * freq * 2 * Math.PI) * Math.exp(-(t - t0) * decay));
export type Ease = (x: number) => number;
/** piecewise keyed scalar; each key's easing applies to the segment that ends at it (default smoothstep) */
export const keyS = (t: number, keys: [number, number, Ease?][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
      return a + (b - a) * (e ?? sm)((t - t0) / (t1 - t0 || 1));
    }
  }
  return keys[keys.length - 1][1];
};
/** start / end time of the n-th occurrence of a spoken word */
export const word = (w: string, n = 0) => {
  const x = WORDS.filter((q) => q.word === w)[n];
  if (!x) throw new Error(`word ${w}#${n} not in the narration`);
  return x;
};
export const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixHex = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};
export const f1 = (n: number) => n.toFixed(1);
export const f2 = (n: number) => n.toFixed(2);
/** stable hash noise in [0,1) */
export const hash = (i: number, seed = 0) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed + 0x27d4eb2f, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
};
import React from 'react';
/** per-frame prefix for SVG ids, so contact sheets (several frames in one page) never share a gradient or clip */
export const IdCtx = React.createContext('');
export const useUid = () => React.useContext(IdCtx);
