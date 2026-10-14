// The single cue system. Word times come from the aligned final narration (narration_words_final.json,
// built by tools/build_voice.py from the blind Scribe transcript). Shots, captions, device states,
// sound cues and particle triggers all read frames from here; nothing is timed from word count.
import data from '../data/narration_words_final.json';

export const FPS = 30;
type Word = {text: string; block: number; start: number; end: number};
export const WORDS: Word[] = (data as unknown as {words: Word[]}).words;
export const AUDIO_DURATION = (data as unknown as {duration_s: number}).duration_s;
/** Film length in frames: the narration timeline rounded up to a whole frame. */
export const TOTAL = Math.ceil(AUDIO_DURATION * FPS - 1e-6);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Index of the first word of the nth occurrence of a phrase. */
export const wordIndex = (phrase: string, nth = 1) => {
  const want = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i + want.length <= WORDS.length; i++) {
    if (want.every((w, k) => norm(WORDS[i + k].text) === w)) {
      seen++;
      if (seen === nth) return i;
    }
  }
  throw new Error(`phrase not in narration: "${phrase}" #${nth}`);
};
/** Start (s) of a phrase. */
export const T = (phrase: string, nth = 1) => WORDS[wordIndex(phrase, nth)].start;
/** End (s) of a phrase's last word. */
export const TE = (phrase: string, nth = 1) => {
  const n = phrase.split(/\s+/).filter(Boolean).length;
  return WORDS[wordIndex(phrase, nth) + n - 1].end;
};
export const toF = (sec: number) => Math.round(sec * FPS);
/** Frame at which a phrase starts / ends. */
export const fS = (phrase: string, nth = 1) => toF(T(phrase, nth));
export const fE = (phrase: string, nth = 1) => toF(TE(phrase, nth));

// ---------------------------------------------------------------- shot table (start-inclusive, end-exclusive)
// Boundaries are tied to measured narration; see script/CUE_SHEET.md (generated from this table).
export const SHOT = {
  s01: [0, 24],
  s02: [24, 51],
  s03: [51, fS('It works') - 2],
  s04: [fS('It works') - 2, fS('These sensors') - 8],
  s05: [fS('These sensors') - 8, fS('monitoring') - 4],
  s06: [fS('monitoring') - 4, fS('If your organs') - 1],
  s07: [fS('If your organs') - 1, fS('the device immediately') - 4],
  s08: [fS('the device immediately') - 4, fS('down to the exact') - 2],
  s09: [fS('down to the exact') - 2, fS('This gives you') - 1],
  s10: [fS('This gives you') - 1, fS('The device automatically') - 2],
  s11: [fS('The device automatically') - 2, fS('with your exact location') - 4],
  s12: [fS('with your exact location') - 4, fS('potentially') - 2],
  s13: [fS('potentially') - 2, fE('consciousness') + 8],
  s14: [fE('consciousness') + 8, fS('But if the countdown') - 1],
  s15: [fS('But if the countdown') - 1, fE('want to know') + 2],
  s16: [fE('want to know') + 2, TOTAL],
} as const;
export type ShotId = keyof typeof SHOT;
