// Caption placement per caption (by its first words): the centre height on screen. A caption never moves while it
// shows. Chosen on contact sheets against the protected regions (the laser exit, hands, the skeleton's torso, the
// bracket's endpoints, the tower tip, the molecules' electrons).
import {CAPTIONS} from './lib';

export const CAP_Y: [string, number][] = [
  ['They fired', 1380], ['into a', 1380], ['and the', 200],
  ['You see', 1480], ['the flow', 1500],
  ['But this', 380], ['a thousand', 380], ['every', 380],
  ['stripping', 1500], ['from air', 1500], ['and heating', 1500], ['through', 1500],
  ['That gave', 1500], ['an easier', 1500],
  ['So when', 1500], ['from a', 1500], ['part of', 1520], ['followed', 1520], ['for over', 1520],
  ['A normal', 380], ['only', 380], ['as its', 380],
  ['But these', 1420], ['into the', 1420], ['using', 1420],
];
const at = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const [first, y] = CAP_Y[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const capY = (t: number) => at(t) ?? 1500;
