// V3 caption heights per caption (by its first words). Wording and timing are the locked ones (src/data/timeline.json);
// only the height changes, chosen on V3 contact sheets so captions stay off the active action.
import {CAPTIONS} from '../lib';

export const CAP_Y3: [string, number][] = [
  ['They fired', 1660], ['into a', 1660], ['and the', 1660],
  ['You see', 1660], ['the flow', 1660],
  ['But this', 1660], ['a thousand', 1705], ['every', 1660],
  ['stripping', 1660], ['from air', 1660], ['and heating', 1660], ['through', 1660],
  ['That gave', 1660], ['an easier', 1660],
  ['So when', 1660], ['from a', 1660], ['part of', 1660], ['followed', 1660], ['for over', 1660],
  ['A normal', 1660], ['only', 1660], ['as its', 1660],
  ['But these', 1660], ['into the', 1660], ['using', 1660],
];
const at = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const [first, y] = CAP_Y3[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`V3 caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const capY3 = (t: number) => at(t) ?? 1660;
