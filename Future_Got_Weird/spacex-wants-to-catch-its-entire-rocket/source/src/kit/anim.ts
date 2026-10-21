// Deterministic animation helpers. Everything is a pure function of time (seconds) so every frame renders identically.
import lines from '../data/narration_lines.json';

export const FPS = 30;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0..1 progress of t through [t0, t1] (clamped). */
export const prog = (t: number, t0: number, t1: number) => (t1 === t0 ? (t >= t1 ? 1 : 0) : clamp((t - t0) / (t1 - t0)));
export const smooth = (u: number) => u * u * (3 - 2 * u);
export const smoother = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
/** Eased progress through [t0, t1]. */
export const ep = (t: number, t0: number, t1: number, f: (u: number) => number = smoother) => f(prog(t, t0, t1));
/** Piecewise interpolation through keyframes [[t, v], ...] with smoother easing between keys. */
export const keys = (t: number, k: [number, number][], f: (u: number) => number = smoother) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], f(prog(t, k[i - 1][0], k[i][0])));
  }
  return k[k.length - 1][1];
};
/** Fade in over [a, a+d] and out over [b-d, b]. */
export const fadeWin = (t: number, a: number, b: number, d = 0.4) => Math.min(prog(t, a, a + d), 1 - prog(t, b - d, b));
/** Smooth deterministic noise in [-1, 1]. */
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 1.7 + seed * 12.9) * 0.5 + Math.sin(t * 3.1 + seed * 7.3 + 1.3) * 0.3 + Math.sin(t * 7.9 + seed * 3.1 + 0.4) * 0.2;
/** Hash-based pseudo random in [0,1) for static scatter (stable across frames). */
export const rnd = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Line = {id: string; scene: string; s: number; e: number; text: string};
const L = (lines as {lines: Line[]}).lines;
const byId: Record<string, Line> = Object.fromEntries(L.map((l) => [l.id, l]));
/** Narration line start/end (seconds on the master timeline). */
export const ls = (id: string) => byId[id].s;
export const le = (id: string) => byId[id].e;
/** Time of the first occurrence of `word` in line `id` (actual audio word event). */
import words from '../data/narration_words.json';
type W = {line: string; w: string; s: number; e: number};
export const wt = (id: string, word: string, nth = 0) => {
  const ws = (words as W[]).filter((w) => w.line === id && w.w.toLowerCase().replace(/[^a-z0-9]/g, '') === word.toLowerCase());
  if (!ws.length) throw new Error(`word ${word} not in ${id}`);
  return ws[Math.min(nth, ws.length - 1)].s;
};
export const NARR_DUR = (lines as {duration: number}).duration;
export const sceneStart = (scene: string) => L.find((l) => l.scene === scene)!.s;
export const sceneEnd = (scene: string) => [...L].reverse().find((l) => l.scene === scene)!.e;
