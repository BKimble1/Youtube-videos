// The measured narration timeline (tools/make_timeline.py -> data/timeline.json) and lookups by word and phrase.
import TL from './data/timeline.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const FRAMES: number = TL.frames;
export const DUR = FRAMES / FPS;
export type Caption = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
export const CAPTIONS = TL.captions as Caption[];
export const WORDS = TL.words as {word: string; text: string; start: number; end: number}[];
export const PHRASES = TL.phrases as {key: string; first: number; last: number; start: number; end: number; text: string}[];

/** the n-th occurrence of a word (normalised, e.g. "they've") -> {start, end} in seconds */
export const word = (w: string, n = 0) => {
  const hits = WORDS.filter((x) => x.word === w);
  if (!hits[n]) throw new Error(`no word ${w}#${n}`);
  return hits[n];
};
/** the first word of a run of words, matched in order (disambiguates repeated words): e.g. wordIn('fire the injector') */
export const wordIn = (run: string, idx = 0) => {
  const r = run.toLowerCase().split(' ');
  for (let i = 0; i + r.length <= WORDS.length; i++) if (r.every((x, k) => WORDS[i + k].word === x)) return WORDS[i + idx];
  throw new Error(`no run ${run}`);
};
export const phrase = (key: string) => {
  const p = PHRASES.find((x) => x.key === key);
  if (!p) throw new Error(`no phrase ${key}`);
  return p;
};
export const sec = (f: number) => f / FPS;
export const frm = (t: number) => Math.round(t * FPS);
