// V2 captions: compact chunks (one to four words, phrased by hand: CH2) cut from the locked
// word timings, shown from just before their first word to the next chunk (or shortly after their last word), whole
// frames, snapped to a cut within two frames, and hidden on a cut that comes after (or within a frame of) their last word. Placement per shot.
import {WORDS, FPS} from '../timeline';
import {CUTS2, SHOTS2} from './cuts2';

export const EMPH2 = ['needle', 'remote', 'living', 'steer', 'second', 'camera', 'laboratory', 'collapsed', 'medicine', 'closer'];
export type Cap2 = {text: string; words: string[]; start: number; end: number; show: number; hide: number};

/** the chunks, phrased by hand (each is the next run of locked words; the texts are checked against them) */
export const CH2 = [
  'This cockroach', 'can fire a needle.', 'And a person', 'holding a remote', 'decides', 'when it shoots.',
  'Scientists strapped', 'a tiny launcher', 'onto a living', 'cockroach,', 'then used', 'electrical pulses', 'to steer it.',
  'A second cockroach', 'carries a camera,', 'letting the operator', 'watch', 'as the first', 'moves into position.',
  'Once it lines up,', 'they fire', 'the injector.', 'They’ve demonstrated this', 'on laboratory', 'targets.',
  'But the plan', 'is to send them', 'beneath', 'collapsed buildings,', 'carrying', 'emergency medicine.',
  'So if', 'you’re trapped', 'and something', 'starts crawling', 'toward you…', 'you might', 'actually want it', 'to get closer.',
];
const chunk = (): {i0: number; i1: number}[] => {
  const out: {i0: number; i1: number}[] = [];
  let i = 0;
  for (const c of CH2) {
    const n = c.split(' ').length;
    const got = WORDS.slice(i, i + n).map((w) => w.text).join(' ');
    if (got !== c) throw new Error(`caption chunk out of step: "${c}" vs "${got}"`);
    out.push({i0: i, i1: i + n - 1});
    i += n;
  }
  if (i !== WORDS.length) throw new Error('caption chunks do not cover the narration');
  return out;
};
const snap = (t: number) => {
  const f = t * FPS;
  const c = CUTS2.find((k) => Math.abs(k - f) <= 2);
  return c ?? Math.round(f);
};
export const CAPS2: Cap2[] = (() => {
  const ch = chunk();
  const raw = ch.map(({i0, i1}) => ({
    text: WORDS.slice(i0, i1 + 1).map((w) => w.text).join(' '),
    words: WORDS.slice(i0, i1 + 1).map((w) => w.word),
    start: WORDS[i0].start,
    end: WORDS[i1].end,
  }));
  return raw.map((c, k) => {
    const show = k === 0 ? 0 : snap(c.start - 0.04);
    const next = k + 1 < raw.length ? snap(raw[k + 1].start - 0.04) : Math.round((c.end + 0.35) * FPS);
    let hide = Math.min(next, Math.round((c.end + 0.5) * FPS));
    if (k + 1 < raw.length && raw[k + 1].start - c.end < 0.6) hide = next;
    const cut = CUTS2.find((x) => x >= c.end * FPS - 1 && x < hide);
    if (cut !== undefined) hide = cut;
    return {...c, show, hide};
  });
})();
/** caption centre height per shot (screen px): 'top' 270, 'low' 1500, or a number; set from each shot's composition */
export const CAP2_Y: Record<string, number> = {};
export const capAt2 = (f: number) => {
  const i = CAPS2.findIndex((c) => f >= c.show && f < c.hide);
  if (i < 0) return null;
  // placement from the shot the caption starts in (a caption never moves while it shows)
  const shot = [...SHOTS2].reverse().find(([, s]) => s <= CAPS2[i].show)![0];
  return {i, y: CAP2_Y[shot] ?? 1500};
};
