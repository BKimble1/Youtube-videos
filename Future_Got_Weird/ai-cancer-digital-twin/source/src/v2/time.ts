// V2 timing: every spoken event comes from the measured word timings of the approved narration
// (data/narration_v2.json, built by tools/v2/stitch_narration_v2.py). Scenes never hand-type the second of a spoken word.
import data from './data/narration_v2.json';

type Word = {text: string; start: number; end: number};
const D = data as unknown as {duration: number; words: Word[]; script_words: Word[]};
export const WORDS2: Word[] = D.script_words;
export const DURATION2 = D.duration;
export const FRAMES2 = Math.ceil(D.duration * 30);
const norm = (s: string) => s.replace(/[’“”]/g, (c) => (c === '’' ? "'" : '')).toLowerCase().replace(/[^a-z0-9']/g, '');

const find = (phrase: string, nth: number) => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS2.length; i++) {
    if (want.every((w, k) => norm(WORDS2[i + k].text) === w)) {
      seen++;
      if (seen === nth) return [i, i + want.length - 1];
    }
  }
  throw new Error(`phrase not found: "${phrase}" (#${nth})`);
};
/** Start (s) of the nth occurrence of a spoken phrase. */
export const T = (phrase: string, nth = 1) => WORDS2[find(phrase, nth)[0]].start;
/** End (s) of the last word of the nth occurrence. */
export const TE = (phrase: string, nth = 1) => WORDS2[find(phrase, nth)[1]].end;
