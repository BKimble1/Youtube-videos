// V7 caption placement per caption (the micro captions sit over the glass side, clear of the wedges and the contact
// edge) (by its first words): the centre height, and `side` for a right-hand block. A
// caption never moves while it shows; positions are checked on V6 contact sheets at each caption's start, middle and
// end against the protected regions (grips, feet and stirrups, the contact interface, the falling body, faces).
import {CAPTIONS6} from '../v6/tl6';

export const CAP_Y7: [string, number, boolean | [number, number]][] = [
  ['If you', 270, false], ['against', 1480, false], ['you could', 1480, false], ['off the', 1480, false], ['and climb', 300, false],
  ['Their', 300, false], ['in microscopic', 1480, false],
  ['As you', 1480, [30, 420]], ['the wedges', 1300, [30, 420]], ['against the', 1300, [30, 420]],
  ['This brings', 1420, [30, 420]], ['that tiny', 1420, [20, 370]], ['can hold', 270, [20, 440]],
  ['Special', 270, false], ['so one', 270, false], ['doesn', 1480, [40, 620]],
  ['Then,', 300, false], ['onto the', 300, false], ['The first', 1480, false], ['letting', 1480, false], ['higher', 1480, false],
  ['But there', 1480, false], ['They need', 1480, false], ['to grip', 1480, false], ['So you', 1480, false], ['but switch', 1480, false],
  ['and those', 960, false], ['can', 960, false],
];
const at = (t: number) => {
  const i = CAPTIONS6.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const [first, y, side] = CAP_Y7[i];
  if (!CAPTIONS6[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS6[i].text}`);
  return {i, y, side};
};
export const capAt7 = (t: number) => at(t);
