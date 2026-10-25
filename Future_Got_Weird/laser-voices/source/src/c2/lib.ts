// Shared timing helpers and the measured narration timeline.
import TL from '../data/timeline.json';

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
/** smoother (C2) step, for camera moves */
export const ss5 = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const easeOut = (x: number) => 1 - (1 - clamp(x)) ** 3;
export const easeIn = (x: number) => clamp(x) ** 2;
/** a damped settle: 0 at t0, overshoots and decays to 0 (amplitude 1 at the first peak) */
export const settle = (t: number, t0: number, freq = 5, decay = 6) => (t < t0 ? 0 : Math.sin((t - t0) * freq * 2 * Math.PI) * Math.exp(-(t - t0) * decay));
/** piecewise keyed scalar (smoothstep per segment) */
export const keyS = (t: number, keys: [number, number][], ease: (x: number) => number = sm) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i];
      return a + (b - a) * ease((t - t0) / (t1 - t0 || 1));
    }
  }
  return keys[keys.length - 1][1];
};
/** start / end time of the n-th occurrence of a word in the narration */
export const word = (w: string, n = 0) => WORDS.filter((x) => x.word === w)[n];
/** '#rrggbb' or 'rgb(r,g,b)' (mixHex's own output, so a mixed colour can be mixed again) to [r, g, b] */
export const hex = (h: string) => {
  if (h.startsWith('rgb')) return h.slice(h.indexOf('(') + 1, h.indexOf(')')).split(',').map((v) => parseFloat(v));
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
};
export const mixHex = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
export const f1 = (n: number) => n.toFixed(1);
