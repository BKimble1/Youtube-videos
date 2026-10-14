// Caption chunks: 2-5-word phrases of the locked narration, each with one highlighted word.
// Every chunk is a contiguous run of narration words (checked at load), so the captions can never
// drift from the script. Times come from the aligned word list.
import {WORDS} from './timeline';

export type Chunk = {from: number; to: number; hl?: string; caps?: boolean};

// [first word index, last word index (inclusive)] in narration order
const RAW: [string, string?, boolean?][] = [
  ['This device'],
  ['tells you exactly', 'exactly'],
  ['when you are dying.', 'dying.'],
  ['It works by injecting', 'injecting'],
  ['thousands of'],
  ['microscopic nano-sensors', 'nano-sensors', true],
  ['through your skin.', 'skin.'],
  ['These sensors constantly travel', 'travel'],
  ['through your bloodstream,', 'bloodstream,'],
  ['monitoring your'],
  ['cellular decay.', 'decay.'],
  ['If your organs', 'organs'],
  ['begin to fail,', 'fail,'],
  ['or your heart', 'heart'],
  ['experiences a lethal rhythm,', 'lethal'],
  ['the device immediately', 'immediately'],
  ['calculates your'],
  ['remaining life expectancy', 'expectancy'],
  ['down to the exact second.', 'second.', true],
  ['This gives you'],
  ['a critical window', 'critical'],
  ['to seek help.', 'help.'],
  ['The device automatically', 'automatically'],
  ['alerts emergency services', 'emergency'],
  ['with your exact location', 'location'],
  ['and medical data,', 'data,'],
  ['potentially saving your life', 'potentially'],
  ['before you even'],
  ['lose consciousness.', 'consciousness.'],
  ['But if the countdown starts,', 'countdown'],
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
    const next = k < CHUNKS.length - 1 ? WORDS[CHUNKS[k + 1].from].start - 0.06 : lastEnd + 1.2;
    const end = Math.min(next, lastEnd + 0.7);
    return {...c, start, end, text: c.words.join(' ')};
  });
