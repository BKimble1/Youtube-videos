// Timeline: the measured narration (data/timeline.json, written by tools/make_narration.py from the accepted take).
// Every action is keyed to a measured word, never to a nominal second.
import TL from './data/timeline.json';

export const FPS = 30;
export const FRAMES: number = TL.frames;
export const DURATION: number = TL.duration;
export type Caption = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
export const CAPTIONS: Caption[] = TL.captions;
export const WORDS: {word: string; start: number; end: number}[] = TL.words;

/** start time of the n-th occurrence of a word (0-based) */
export const ws = (word: string, n = 0) => {
  const m = WORDS.filter((w) => w.word === word);
  if (!m[n]) throw new Error(`word ${word}#${n} not in timeline`);
  return m[n].start;
};
export const we = (word: string, n = 0) => WORDS.filter((w) => w.word === word)[n].end;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
