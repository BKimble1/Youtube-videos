// V10: the same module on the V10 narration (tools/tighten_narration_v10.py). Narration timing: every spoken event in the film is placed from the measured words (src/data/timeline.json,
// written by tools/make_narration.py). T('phrase') is the start of the phrase's first word, E('phrase') the end of
// its last; n picks a later occurrence.
import TL from '../data/timeline_v10.json';

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

// ---------------------------------------------------------------- narration marks (as story/shots.tsx M, on the V8 clock)
export const M = {
  yousee: T('you see'), ten: T('ten'), powerfulE: E('powerful'), electric: T('electric'), blast: T('blast'), lifting: T('lifting'), ground: T('ground'), groundE: E('ground'),
  but: T('but'), jet: T('jet'), engines: T('engines'), andCaught: T('and caught'), fire: T('fire'), fireE: E('fire'), so: T('so he'),
  electric2: T('electric', 1), switched: T('switched') - 0.05, except: T('except'), huge: T('huge'), problemE: E('problem'), theBoard: T('the board'), itself: T('itself'),
  heHas: T('he has'), body: T('body'), while: T('while'), ai: T('ai'), voice: T('voice'), coach: T('coach'), learn: T('learn'), balance2: T('balance', 1),
  andAfter: T('and after'), tenDays: T('ten days'), practice: T('practice'), heActually: T('he actually'), flew: T('flew'), river2: T('river', 1), river2E: E('river', 1),
  andThrough: T('and through'), through: T('through'), canyon: T('canyon'), canyonE: E('canyon'), howMuch: T('how much'), pay: T('pay'), thing: T('thing'), thingE: E('thing'),
};
