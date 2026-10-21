// V2 timing: every cue comes from the measured Test Voice narration (src/v2/data/narr.json, built by tools/v2_build_voice.py).
import narr from './data/narr.json';

type Line = {id: string; sec: string; s: number; e: number; text: string};
type Word = {line: string; w: string; s: number; e: number};
const N = narr as {duration: number; sections: {id: string; s: number; e: number}[]; lines: Line[]; words: Word[]};

export const NARR_V2 = N.duration;
export const FILM_END = N.duration + 1.4;
const byLine: Record<string, Line> = Object.fromEntries(N.lines.map((l) => [l.id, l]));
const bySec = Object.fromEntries(N.sections.map((s) => [s.id, s]));

/** Line start / end on the film timeline. */
export const ls = (id: string) => byLine[id].s;
export const le = (id: string) => byLine[id].e;
/** Section start / end. */
export const ss = (id: string) => bySec[id].s;
export const se = (id: string) => bySec[id].e;
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Start of the nth occurrence of `word` in line `id` (end with which='e'). */
export const wt = (id: string, word: string, nth = 0, which: 's' | 'e' = 's') => {
  const ws = N.words.filter((w) => w.line === id && norm(w.w) === norm(word));
  if (!ws.length) throw new Error(`word ${word} not in ${id}`);
  return ws[Math.min(nth, ws.length - 1)][which];
};
export const lines = N.lines;
export const words = N.words;
