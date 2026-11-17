// Timeline: the narration's measured word times (data/timeline.json, from tools/make_narration.py: WhisperX forced
// alignment of the locked words), the film length, and the shot schedule keyed to those words.
import TL from './data/timeline.json';

export const FPS = 60;
export const FRAMES: number = TL.frames;
export const DUR: number = TL.duration;
export type Word = {word: string; start: number; end: number};
export type Caption = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
export const WORDS: Word[] = TL.words as Word[];
export const CAPTIONS: Caption[] = TL.captions as Caption[];
export const SENT: {text: string; start: number; end: number}[] = TL.sentences;

const nrm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** the n-th (1-based) occurrence of a word, optionally only after time `after` */
export const W = (word: string, n = 1, after = -1): Word => {
  let k = 0;
  for (const w of WORDS) {
    if (w.start < after) continue;
    if (nrm(w.word) === word) {
      k++;
      if (k === n) return w;
    }
  }
  throw new Error(`word not found: ${word} #${n}`);
};
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a || 1e-9));
export const sm = (t: number) => t * t * (3 - 2 * t);
export const sm5 = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** eased progress of t through [a, b] */
export const ss = (t: number, a: number, b: number) => sm5(inv(a, b, t));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const ssOut = (t: number, a: number, b: number) => easeOut(inv(a, b, t));
export const ssIn = (t: number, a: number, b: number) => easeIn(inv(a, b, t));

// ------------------------------------------------------------------ shot schedule (seconds), keyed to the words
const S = SENT;
const at = (w: string, n = 1, after = -1) => W(w, n, after).start;
export const T = {
  // 1 underwater swim-by: "This fish swims using human heart cells."
  s1: 0,
  // 2 orbit and transparent cutaway: "But it doesn't actually have a heart."
  s2: S[1].start - 0.12,
  // 3 lab bench, assembly: "You see, scientists grew"
  s3: S[2].start - 0.1,
  // 4 microscope: "living heart muscle"
  s4: at('living') - 0.12,
  // 5 pull back onto the fish, both sides: "on both sides of an artificial fish's tail."
  s5: at('on', 1, S[2].start) - 0.15,
  // 6 overhead cutaway, first side: "When one side contracts,"
  s6: S[3].start - 0.25,
  // 7 the other side stretched and triggered: "it pulls on the other, triggering that side to contract."
  s7: at('it', 1, S[3].start) - 0.05,
  // 8 the cycle repeats and speeds up, into the water: "And this happens over and over again,"
  s8: S[4].start - 0.1,
  // 9 low follow: "propelling the fish through the water."
  s9: at('propelling') - 0.1,
  // 10 the structure again, no motor: "It doesn't even need a motor."
  s10: S[5].start - 0.15,
  // 11 time-lapse: "And as the cells matured, the fish actually got faster."
  s11: S[6].start - 0.12,
  // 12 out of the tank to the scientist, pan to the heart model: "But the scientists weren't trying to build a fish."
  s12: S[7].start - 0.12,
  // 13 the beating heart: "They were figuring out how to build a human heart."
  s13: S[8].start - 0.1,
  // 14 heart muscle -> fish muscle, back to frame 0
  s14: S[8].end + 0.05,
  end: DUR,
};
export const SHOTS = Object.entries(T);
