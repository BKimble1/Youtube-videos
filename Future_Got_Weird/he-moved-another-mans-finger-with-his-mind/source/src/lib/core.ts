// Timing and shared helpers. Every on-screen event is placed from the measured narration (data/narration_words.json,
// written by tools/make_narration.py from the selected takes), never from estimated seconds.
import NW from '../data/narration_words.json';
import {clamp, easeInOut} from '../dc/math';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const FRAMES: number = NW.frames;
export type Word = {word: string; block: number; start: number; end: number};
export const WORDS: Word[] = NW.words as Word[];

const nrm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/’/g, "'");
/** index of the first word of `phrase` (searching from word index `from`) */
export const wi = (phrase: string, from = 0): number => {
  const ps = phrase.toLowerCase().replace(/’/g, "'").split(/\s+/).map(nrm);
  for (let i = from; i <= WORDS.length - ps.length; i++) {
    if (ps.every((p, k) => nrm(WORDS[i + k].word.replace(/’/g, "'")) === p)) return i;
  }
  throw new Error(`phrase not found: ${phrase}`);
};
/** start time (s) of the phrase */
export const T = (phrase: string, from = 0) => WORDS[wi(phrase, from)].start;
/** end time (s) of the phrase */
export const TE = (phrase: string, from = 0) => {
  const n = phrase.trim().split(/\s+/).length;
  return WORDS[wi(phrase, from) + n - 1].end;
};
/** frame helpers */
export const F = (sec: number) => sec * FPS;
export const sec = (f: number) => f / FPS;
/** 0..1 eased progress of frame f between seconds a and b */
export const pr = (f: number, a: number, b: number, e: (t: number) => number = easeInOut) => e(clamp((f / FPS - a) / (b - a || 1e-6)));
/** linear 0..1 between seconds a and b */
export const lin = (f: number, a: number, b: number) => clamp((f / FPS - a) / (b - a || 1e-6));
/** a value held at piecewise keys (seconds) with eased transitions */
export const keys = (f: number, ks: [number, number][], e: (t: number) => number = easeInOut) => {
  const t = f / FPS;
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb] = ks[i + 1];
    if (t <= b) return va + (vb - va) * e(clamp((t - a) / (b - a || 1e-6)));
  }
  return ks[ks.length - 1][1];
};
/** soft attack/hold/release pulse 0..1..0 (seconds) */
export const pulse = (f: number, a: number, b: number, c: number, d: number) => pr(f, a, b) * (1 - pr(f, c, d));
