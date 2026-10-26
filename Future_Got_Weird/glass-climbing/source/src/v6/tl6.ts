// Glass Climbing V6: the measured timeline of the V6 narration (the channel voice, tools/v6/make_narration_v6.py).
import TL from '../data/timeline_v6.json';

export const FPS = 30;
export const FRAMES = TL.frames;
export const DUR = TL.duration;
export const CAPTIONS6 = TL.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
export const WORDS6 = TL.words as {word: string; start: number; end: number}[];
/** the start frame of the n-th occurrence of a word */
export const wordF = (w: string, n = 0) => Math.round(WORDS6.filter((x) => x.word === w)[n].start * FPS);
