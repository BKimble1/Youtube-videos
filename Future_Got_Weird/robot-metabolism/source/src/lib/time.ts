// Timing from the measured narration (source/src/data/timeline.json, written by tools/make_narration.py).
import TL from '../data/timeline.json';

export const FPS = 30;
export const FRAMES: number = TL.frames;
export const WORDS: {word: string; start: number; end: number}[] = TL.words;
export type Caption = {text: string; emph: string[]; start: number; end: number; show: number; hide: number; w0: number};
export const CAPTIONS: Caption[] = TL.captions as Caption[];

/** the n-th occurrence of a phrase in the narration: its first word's start and last word's end (seconds) */
export const ph = (phrase: string, n = 0) => {
  const p = phrase.toLowerCase().replace(/’/g, "'").split(/\s+/);
  let k = 0;
  for (let i = 0; i + p.length <= WORDS.length; i++) {
    if (p.every((w, j) => WORDS[i + j].word === w)) {
      if (k++ === n) return {start: WORDS[i].start, end: WORDS[i + p.length - 1].end};
    }
  }
  throw new Error(`phrase not in narration: ${phrase} #${n}`);
};
/** start (s) of a phrase */
export const T = (phrase: string, n = 0) => ph(phrase, n).start;
/** end (s) of a phrase */
export const E = (phrase: string, n = 0) => ph(phrase, n).end;
/** seconds -> frame */
export const fr = (s: number) => Math.round(s * FPS);
