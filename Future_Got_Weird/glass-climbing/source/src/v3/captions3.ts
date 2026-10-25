// V3 caption placement per caption (by its first words; checked on V2 contact sheets at each caption's midpoint): the centre height, and `side` for the micro views' right-hand
// block. A caption never moves while it shows. Checked on contact sheets at each caption's start, middle and end
// against the protected regions (hands on bars, pad contacts, the wedge/glass gap, the springs, the faces).
import {CAPTIONS} from '../lib';

export const CAP_Y: [string, number, boolean | [number, number]][] = [
  ['If you', 1500, false], ['against', 1480, false], ['you could', 250, false], ['off the', 1480, false], ['and climb', 300, false],
  ['Their', 380, false], ['in microscopic', 1300, true],
  ['As you', 1300, [560, 480]], ['the wedges', 1300, [560, 480]], ['against the', 1300, [560, 480]],
  ['This brings', 1420, true], ['that tiny', 1420, true], ['can hold', 1480, false],
  ['Special', 250, false], ['so one', 210, false], ['doesn', 250, false],
  ['Then,', 300, false], ['onto the', 1500, false], ['The first', 1420, true], ['letting', 1640, [560, 480]], ['higher', 1700, false],
  ['But there', 1480, false], ['They need', 1300, true], ['to grip', 1300, true], ['So you', 1500, false], ['but switch', 1470, [760, 300]],
  ['and those', 380, false], ['can', 1480, false],
];
const at = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const [first, y, side] = CAP_Y[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return {y, side};
};
export const capY = (t: number) => at(t)?.y ?? 1600;
export const capSide = (t: number) => at(t)?.side ?? false;
