// Shared timing helpers and the measured narration timeline (tools/make_narration.py -> data/timeline.json).
import TL from './data/timeline.json';

export const FPS = 30;
export const W = 1080, H = 1920;
export type Caption = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
export type Word = {word: string; start: number; end: number};
/** a measured narration timeline (frames, captions, words) and its word / phrase lookups */
export const makeTimeline = (tl: {frames: number; duration: number; captions: unknown; words: unknown}) => {
  const CAPTIONS = tl.captions as Caption[];
  const WORDS = tl.words as Word[];
  const k = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '');
  /** the n-th occurrence of a spoken word (display form without punctuation, case-insensitive) */
  const word = (w: string, n = 0) => {
    const hit = WORDS.filter((x) => k(x.word) === k(w))[n];
    if (!hit) throw new Error(`word not in narration: ${w} #${n}`);
    return hit;
  };
  /** start time of a phrase (consecutive words), e.g. T('legs opened') */
  const T = (phrase: string, n = 0) => {
    const ws = phrase.split(' ').map(k);
    let hits = 0;
    for (let i = 0; i + ws.length <= WORDS.length; i++) {
      if (ws.every((w, j) => k(WORDS[i + j].word) === w)) {
        if (hits === n) return {start: WORDS[i].start, end: WORDS[i + ws.length - 1].end};
        hits++;
      }
    }
    throw new Error(`phrase not in narration: ${phrase}`);
  };
  return {FRAMES: tl.frames, DUR: tl.duration, CAPTIONS, WORDS, word, T};
};
const V1 = makeTimeline(TL);
export const FRAMES = V1.FRAMES;
export const DUR = V1.DUR;
export const CAPTIONS = V1.CAPTIONS;
export const WORDS = V1.WORDS;
export const word = V1.word;
export const T = V1.T;

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
export const fmt = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
