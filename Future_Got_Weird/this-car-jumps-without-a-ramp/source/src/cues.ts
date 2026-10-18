// Narration word cues. The animation is timed to the stitched narration (tools/stitch_narration.py writes
// data/words.json), so a re-recorded block moves its pictures with it.
import data from './data/words.json';

type Word = {text: string; start: number; end: number; block: string; i: number};
const WORDS = data.words as Word[];
export const DURATION_S = data.duration as number;
export const FPS = 30;
export const DURATION_FRAMES = Math.ceil(DURATION_S * FPS);

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, '');

/** Start time (s) of the n-th occurrence (0-based) of `text` in block b. Throws if missing, so a script edit can't
 *  silently detach a cue. */
export const w = (b: string, text: string, n = 0): number => hit(b, text, n).start;
/** End time (s) of that word. */
export const we = (b: string, text: string, n = 0): number => hit(b, text, n).end;
const hit = (b: string, text: string, n: number) => {
  const want = norm(text);
  const list = WORDS.filter((x) => x.block === b && norm(x.text) === want);
  if (!list[n]) throw new Error(`cue not found: ${b} "${text}" #${n}`);
  return list[n];
};
/** First / last word times of a block. */
export const blockStart = (b: string) => WORDS.find((x) => x.block === b)!.start;
export const blockEnd = (b: string) => [...WORDS].reverse().find((x) => x.block === b)!.end;
export const ALL_WORDS = WORDS;
