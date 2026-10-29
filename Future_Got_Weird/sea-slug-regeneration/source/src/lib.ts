// Shared constants and small helpers. Everything in the film is a pure function of the frame.
import tl from './data/timeline.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const FRAMES: number = tl.frames;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of f through [f0, f1] */
export const seg = (f: number, f0: number, f1: number) => clamp((f - f0) / (f1 - f0));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const inCubic = (t: number) => t * t * t;
/** eased progress of f through [f0, f1] */
export const ease = (f: number, f0: number, f1: number, fn = inOut) => fn(seg(f, f0, f1));

/** deterministic PRNG */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hx = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** mix two #rrggbb colours */
export const mix = (a: string, b: string, t: number) => {
  const A = hx(a), B = hx(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join('');
};

// ---- narration timing (ElevenLabs Scribe word times of the final take) ----
type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words;
export const CAPTIONS: {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[] = tl.captions;
const key = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '');
/** the nth (1-based) spoken occurrence of a word */
export const word = (w: string, n = 1): Word => {
  let k = 0;
  for (const x of WORDS) if (key(x.word) === key(w) && ++k === n) return x;
  throw new Error(`word not found: ${w} #${n}`);
};
/** frame of a word's start (or end) */
export const F = (w: string, n = 1, at: 'start' | 'end' = 'start') => Math.round(word(w, n)[at] * FPS);
