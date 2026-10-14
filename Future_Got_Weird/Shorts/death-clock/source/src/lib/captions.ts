// V3 caption chunks: 2-5-word phrases of the V3 narration; six of them carry one emphasis word (no more).
// Every chunk is a contiguous run of narration words (checked at load), so the captions can never
// drift from the script. Times come from the aligned word list.
import {WORDS} from './timeline3';

export type Chunk = {from: number; to: number; hl?: string; caps?: boolean};

// [first word index, last word index (inclusive)] in narration order
const RAW: [string, string?, boolean?][] = [
  ['This device'],
  ['tells you exactly'],
  ['when you are dying.', 'dying.'],
  ['And he has'],
  ['just over two minutes'],
  ['to change it.'],
  ['Under the band,'],
  ['microscopic nano-sensors', 'nano-sensors'],
  ['slip through his skin'],
  ['and race into his bloodstream.'],
  ['They sweep past blood cells,'],
  ['monitoring cellular decay'],
  ['and sending a constant'],
  ['stream of signals.'],
  ['If an organ starts failing,'],
  ['or his heart slips'],
  ['into a lethal rhythm,', 'lethal'],
  ['the warning races'],
  ['back to his wrist.'],
  ['The red screen keeps counting.'],
  ['Every second matters.', 'second'],
  ['His location and medical data'],
  ['reach a nearby hospital,'],
  ['where an emergency drone'],
  ['launches straight toward him.'],
  ['While help is coming,'],
  ['the band delivers'],
  ['an automatic injection,'],
  ['potentially buying him time.'],
  ['His heartbeat steadies'],
  ['as he sits up.'],
  ['Green replaces red:'],
  ['life expectancy,'],
  ['forty-two years.', 'forty-two'],
  ['But that number'],
  ['already changed once.'],
  ['If your countdown started,'],
  ['would you want to know?', 'know?'],
];

const build = (): (Chunk & {words: string[]})[] => {
  let i = 0;
  return RAW.map(([text, hl, caps]) => {
    const want = text.split(' ');
    want.forEach((w, k) => {
      if (WORDS[i + k]?.text !== w) throw new Error(`caption chunk "${text}" does not match narration at word ${i + k} ("${WORDS[i + k]?.text}")`);
    });
    const c = {from: i, to: i + want.length - 1, hl, caps, words: want};
    i += want.length;
    return c;
  }).map((c, _k, all) => {
    if (_k === all.length - 1 && c.to !== WORDS.length - 1) throw new Error('captions do not cover the narration');
    return c;
  });
};
export const CHUNKS = build();

/** Visible window (seconds) of each chunk: from its first word to the next chunk (held through short gaps). */
export const chunkWindows = () =>
  CHUNKS.map((c, k) => {
    const start = WORDS[c.from].start - 0.06;
    const lastEnd = WORDS[c.to].end;
    // the last phrase clears 0.3 s after "know?", so the loop seam carries no caption
    const next = k < CHUNKS.length - 1 ? WORDS[CHUNKS[k + 1].from].start - 0.06 : lastEnd + 0.3;
    const end = Math.min(next, lastEnd + 0.7);
    return {...c, start, end, text: c.words.join(' ')};
  });
