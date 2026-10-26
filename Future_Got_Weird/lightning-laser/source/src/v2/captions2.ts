// V2 caption heights per caption (by its first words), chosen on V2 contact sheets against the mechanism.
import {CAPTIONS} from '../lib';

export const CAP_Y2: [string, number][] = [
  ['They fired', 1450], ['into a', 1450], ['and the', 1560],
  ['You see', 1500], ['the flow', 1500],
  ['But this', 1500], ['a thousand', 1500], ['every', 1500],
  ['stripping', 1500], ['from air', 1660], ['and heating', 1500], ['through', 1500],
  ['That gave', 1500], ['an easier', 1500],
  ['So when', 1500], ['from a', 1500], ['part of', 1500], ['followed', 1500], ['for over', 1500],
  ['A normal', 1500], ['only', 1500], ['as its', 1660],
  ['But these', 1500], ['into the', 1500], ['using', 1450],
];
const at = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const [first, y] = CAP_Y2[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`V2 caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const capY2 = (t: number) => at(t) ?? 1500;
