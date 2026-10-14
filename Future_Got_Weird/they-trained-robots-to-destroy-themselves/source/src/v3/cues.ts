// V2 cue system: every timing comes from the word alignment of the locked V2 narration
// (data/narration_words_v2.json, built by tools/v2/stitch_narration_v2.py). Never hand-typed seconds.
import words from './data/narration_words_v2.json';

export const FPS = 30;
type Word = {text: string; start: number; end: number; type?: string; block?: string};
export const WORDS: Word[] = (words as unknown as {words: Word[]}).words;
const norm = (s: string) => s.replace(/’/g, "'").toLowerCase().replace(/[^a-z0-9']/g, '');

/** Start (s) of the nth occurrence of a phrase. */
export const T = (phrase: string, nth = 1): number => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return WORDS[i].start;
    }
  }
  throw new Error(`V2 phrase not found: "${phrase}" (#${nth})`);
};
/** End (s) of the last word of a phrase. */
export const TE = (phrase: string, nth = 1): number => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return WORDS[i + want.length - 1].end;
    }
  }
  throw new Error(`V2 phrase not found: "${phrase}" (#${nth})`);
};
export const fr = (sec: number) => Math.round(sec * FPS);
export const at = (phrase: string, nth = 1) => fr(T(phrase, nth));
export const atEnd = (phrase: string, nth = 1) => fr(TE(phrase, nth));
export const NARR_END = WORDS[WORDS.length - 1].end;
/** Start of a narration block (B01..B07). */
export const blockStart = (b: string) => WORDS.find((w) => w.block === b)!.start;
