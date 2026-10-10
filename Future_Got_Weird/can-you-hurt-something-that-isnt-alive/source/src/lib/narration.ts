// Cue times come from the word-level alignment of the locked narration (data/narration_words.json),
// never from hand-typed seconds. Phrases match word sequences, ignoring case and punctuation.
import words from '../data/narration_words.json';

export const FPS = 30;
type Word = {text: string; start: number; end: number; type?: string};
const WORDS: Word[] = (words as unknown as {words: Word[]}).words.filter((w) => (w.type ?? 'word') === 'word');
const norm = (s: string) => s.replace(/\u2019/g, "'").toLowerCase().replace(/[^a-z0-9']/g, '');

/** Start time (seconds) of the nth occurrence of a phrase in the narration. */
export const T = (phrase: string, nth = 1): number => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return WORDS[i].start;
    }
  }
  throw new Error(`Phrase not found in narration: "${phrase}" (#${nth})`);
};

/** End time (seconds) of the last word of a phrase. */
export const TE = (phrase: string, nth = 1): number => {
  const n = phrase.split(/\s+/).filter(Boolean).length;
  const start = T(phrase, nth);
  const i = WORDS.findIndex((w) => w.start === start);
  return WORDS[i + n - 1].end;
};

export const frames = (sec: number) => Math.round(sec * FPS);
export const NARRATION_END = WORDS[WORDS.length - 1].end;
