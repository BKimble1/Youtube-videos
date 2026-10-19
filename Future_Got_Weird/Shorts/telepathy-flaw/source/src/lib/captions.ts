// Caption chunks: 2-5-word phrases of the exact narration. Every chunk is a contiguous run of narration words, so the
// captions can never drift from the script; times come from the aligned word list (lib/timeline.ts). Six chunks carry
// one yellow emphasis word, as in the Death Clock Short.
import {WORDS} from './timeline';

export type Chunk = {from: number; to: number; hl?: string};

// [first word index, last word index (inclusive), emphasised word]
const RAW: [number, number, string?][] = [
  [0, 2], // This brain chip
  [3, 5], // lets you talk
  [6, 7], // to someone
  [8, 10, 'thinking.'], // just by thinking.
  [11, 13], // Instead of using
  [14, 15], // vocal cords,
  [16, 18], // the chip reads
  [19, 20], // neural impulses
  [21, 24], // in your motor cortex,
  [25, 27], // translating your thoughts
  [28, 30], // into direct messages
  [31, 31], // instantly.
  [32, 34], // It works seamlessly—
  [35, 35, 'until'], // until
  [36, 38], // your brain generates
  [39, 41, 'intrusive'], // an intrusive thought.
  [42, 44], // Humans have thousands
  [45, 48], // of dark, unwanted thoughts
  [49, 51], // every single day
  [52, 55], // that we never intend
  [56, 58], // to act on.
  [59, 62, "can't"], // The chip can't tell
  [63, 65], // the difference between
  [66, 70], // what you wanted to say...
  [71, 74, 'dark'], // and the dark thought
  [75, 77], // you were desperately
  [78, 80, 'bury.'], // trying to bury.
];

export const CHUNKS = RAW.map(([from, to, hl]) => ({from, to, hl, words: WORDS.slice(from, to + 1).map((w) => w.text)}));

// the chunks tile the narration exactly
CHUNKS.reduce((expect, c) => {
  if (c.from !== expect) throw new Error(`caption chunk starting at word ${c.from} leaves a gap/overlap (expected ${expect})`);
  return c.to + 1;
}, 0);
if (CHUNKS[CHUNKS.length - 1].to !== WORDS.length - 1) throw new Error('captions do not cover the narration');

/** visible window (seconds) of each chunk: from its first word to the next chunk (held through short gaps, but not
 *  more than 0.7 s past its last word; the last phrase clears 0.45 s after "bury." so the loop seam carries none) */
export const chunkWindows = () =>
  CHUNKS.map((c, k) => {
    const start = WORDS[c.from].start - 0.06;
    const lastEnd = WORDS[c.to].end;
    const next = k < CHUNKS.length - 1 ? WORDS[CHUNKS[k + 1].from].start - 0.06 : lastEnd + 0.45;
    const end = Math.min(next, lastEnd + 0.7);
    // "seamlessly—" and "until" are joined by the dash: the caption shows them as one word pair
    return {...c, start, end, text: c.words.join(' ').replace('— ', '—')};
  });
