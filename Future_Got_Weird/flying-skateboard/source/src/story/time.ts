// Narration timing: every spoken event in the film is placed from the measured words (src/data/timeline.json,
// written by tools/make_narration.py). T('phrase') is the start of the phrase's first word, E('phrase') the end of
// its last; n picks a later occurrence.
import TL from '../data/timeline.json';

export const FPS = 30;
export const FRAMES: number = TL.frames;
export const DUR: number = TL.duration;
export const WORDS: {word: string; start: number; end: number}[] = TL.words;
export const CAPS: {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[] = TL.captions;

const find = (phrase: string, n = 0) => {
  const ws = phrase.toLowerCase().replace(/’/g, "'").split(/\s+/);
  let hit = -1;
  for (let i = 0; i + ws.length <= WORDS.length; i++) {
    if (ws.every((w, k) => WORDS[i + k].word === w)) {
      if (n-- === 0) {
        hit = i;
        break;
      }
    }
  }
  if (hit < 0) throw new Error(`phrase not in narration: ${phrase}`);
  return {i: hit, n: ws.length};
};
export const T = (phrase: string, n = 0) => WORDS[find(phrase, n).i].start;
export const E = (phrase: string, n = 0) => {
  const h = find(phrase, n);
  return WORDS[h.i + h.n - 1].end;
};
