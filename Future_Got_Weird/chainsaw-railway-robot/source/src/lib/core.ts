// Timing and shared helpers. Every on-screen event is placed from the measured narration (data/narration_words.json,
// written by tools/make_narration.py from the selected takes), never from estimated seconds.
import NW from '../data/narration_words.json';
import {clamp, easeInOut, lerp} from '../dc/math';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const FRAMES: number = NW.frames;
export const DUR = FRAMES / FPS;
export type Word = {word: string; block: number; start: number; end: number};
export const WORDS: Word[] = NW.words as Word[];

const nrm = (s: string) => s.toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' -]/g, '');
/** index of the first word of `phrase` (searching from word index `from`) */
export const wi = (phrase: string, from = 0): number => {
  const ps = phrase.split(/\s+/).map(nrm);
  for (let i = from; i <= WORDS.length - ps.length; i++) {
    if (ps.every((p, k) => nrm(WORDS[i + k].word) === p)) return i;
  }
  throw new Error(`phrase not found: ${phrase}`);
};
/** start (s) of the phrase; `after` names an earlier phrase to search from (for repeated words) */
export const T = (phrase: string, after?: string) => WORDS[wi(phrase, after ? wi(after) : 0)].start;
/** end (s) of the phrase */
export const TE = (phrase: string, after?: string) => {
  const n = phrase.trim().split(/\s+/).length;
  return WORDS[wi(phrase, after ? wi(after) : 0) + n - 1].end;
};
/** eased 0..1 progress of time t between a and b */
export const pr = (t: number, a: number, b: number, e: (x: number) => number = easeInOut) => e(clamp((t - a) / (b - a || 1e-6)));
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6));
/** piecewise eased keys [time, value] */
export const keys = (t: number, ks: [number, number, ((x: number) => number)?][]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb, e] = ks[i + 1];
    if (t <= b) return lerp(va, vb, (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
/** keys on a log scale (zoom), so a zoom travel feels uniform */
export const zkeys = (t: number, ks: [number, number, ((x: number) => number)?][]) =>
  Math.exp(keys(t, ks.map(([a, v, e]) => [a, Math.log(v), e] as [number, number, ((x: number) => number)?])));
/** soft attack/hold/release pulse */
export const pulse = (t: number, a: number, b: number, c: number, d: number) => pr(t, a, b) * (1 - pr(t, c, d));
/** deterministic hash noise */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** smooth value noise in [-1,1] */
export const vnoise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 101.3) * 2 - 1, hash(i + 1 + seed * 101.3) * 2 - 1, u);
};
export const f2 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
