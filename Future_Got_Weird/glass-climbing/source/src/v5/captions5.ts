// V5 caption placement per caption (by its first words; checked on V5 contact sheets at each caption's start, middle and end): the centre height, and `side` for the micro views' right-hand
// block. A caption never moves while it shows. Checked on contact sheets at each caption's start, middle and end
// against the protected regions (hands on bars, pad contacts, the wedge/glass gap, the springs, the faces).
import {CAPTIONS} from '../lib';

export const CAP_Y: [string, number, boolean | [number, number]][] = [
  ['If you', 1720, false], ['against', 1720, false], ['you could', 1650, false], ['off the', 1650, false], ['and climb', 1800, false],
  ['Their', 300, false], ['in microscopic', 1650, false],
  ['As you', 1650, false], ['the wedges', 1300, [560, 480]], ['against the', 1300, [560, 480]],
  ['This brings', 1420, true], ['that tiny', 1420, true], ['can hold', 1480, false],
  ['Special', 250, false], ['so one', 210, false], ['doesn', 250, false],
  ['Then,', 1740, false], ['onto the', 1620, false], ['The first', 1820, false], ['letting', 1640, false], ['higher', 170, false],
  ['But there', 200, false], ['They need', 1650, false], ['to grip', 1650, false], ['So you', 1700, false], ['but switch', 250, false],
  ['and those', 1650, false], ['can', 1750, false],
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
