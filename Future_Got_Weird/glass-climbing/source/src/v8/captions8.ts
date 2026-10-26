// V8 caption placement per caption (the micro captions sit over the glass side, clear of the wedges and the contact
// edge) (by its first words): the centre height, and `side` for a right-hand block. A
// caption never moves while it shows; positions are checked on V6 contact sheets at each caption's start, middle and
// end against the protected regions (grips, feet and stirrups, the contact interface, the falling body, faces).
import {CAPTIONS6} from '../v6/tl6';

type Side = boolean | [number, number];
/** [first words, centre y, side, (V8) per-shot placements from a frame on: [frame, y, side]] */
export const CAP_Y8: [string, number, Side, [number, number, Side][]?][] = [
  ['If you', 1480, false], ['against', 1480, false], ['you could', 1480, false], ['off the', 1480, false], ['and climb', 1480, false],
  ['Their', 300, false], ['in microscopic', 300, [450, 570]],
  ['As you', 300, [450, 570]], ['the wedges', 300, [450, 570]], ['against the', 300, [450, 570]],
  ['This brings', 300, [450, 570]], ['that tiny', 300, [450, 570]], ['can hold', 300, [450, 570], [[503, 1480, false]]],
  ['Special', 1480, false], ['so one', 270, false], ['doesn', 1480, [40, 620]],
  ['Then,', 1480, false], ['onto the', 1480, false], ['The first', 1480, false], ['letting', 1480, false], ['higher', 1480, false],
  ['But there', 1480, false], ['They need', 1480, false], ['to grip', 1480, false], ['So you', 1480, false], ['but switch', 1480, false],
  ['and those', 960, false], ['can', 1480, false],
];
// (V8) shows and hides fall on whole frames (the nearest), so a caption never straddles a cut by one frame; a caption
// that spans a cut can take a new placement from the cut on (it never moves within a shot)
const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const at = (t: number) => {
  const f = Math.round(t * FPS);
  const i = CAPTIONS6.findIndex((c, k) => f >= (k === 0 ? 0 : fr(c.show)) && f < fr(c.hide));
  if (i < 0) return null;
  const [first, y0, side0, per] = CAP_Y8[i];
  if (!CAPTIONS6[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS6[i].text}`);
  let y = y0, side = side0;
  for (const [from, py, ps] of per ?? []) if (f >= from) [y, side] = [py, ps];
  return {i, y, side};
};
export const capAt8 = (t: number) => at(t);
