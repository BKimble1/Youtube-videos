// Caption placement per caption (by its first words): the centre height and block. Shows and hides fall on whole frames,
// snapped to a cut when one is within a frame and a half. A caption never moves while it shows; one that spans a cut may
// take a new placement from the cut on. Heights are checked against each shot's protected regions (tools/cap_check.ts).
import {CAPTIONS, FPS} from './timeline';
import {CUTS} from './cuts';

type Block = {y: number; left?: number; width?: number};
/** [first words, placement, per-shot placements from a frame on] */
export const CAP_PLACE: [string, Block, [number, Block][]?][] = [
  ['This cockroach', {y: 1500}],
  ['And a person', {y: 1500}],
  ['decides', {y: 1500}],
  ['Scientists', {y: 1500}],
  ['onto a', {y: 1500}],
  ['then used', {y: 1500}],
  ['to steer', {y: 1500}],
  ['A second', {y: 1500}],
  ['carries', {y: 1500}],
  ['letting', {y: 1500}],
  ['as the first', {y: 270}],
  ['Once it', {y: 1500}],
  ['they fire', {y: 1500}],
  ['They’ve', {y: 1500}],
  ['on laboratory', {y: 1500}],
  ['But the plan', {y: 1500}],
  ['beneath', {y: 1500}],
  ['carrying', {y: 1500}],
  ['So if', {y: 270}],
  ['and something', {y: 270}],
  ['crawling', {y: 270}],
  ['you might', {y: 270}],
  ['to get', {y: 1500}],
];
const snap = (s: number) => {
  const f = s * FPS;
  const c = CUTS.find((k) => Math.abs(k - f) <= 1.5);
  return c ?? Math.round(f);
};
export const capFrames = CAPTIONS.map((c, k) => ({show: k === 0 ? 0 : snap(c.show), hide: snap(c.hide)}));
export const capAt = (f: number) => {
  const i = capFrames.findIndex((c) => f >= c.show && f < c.hide);
  if (i < 0) return null;
  const [first, b0, per] = CAP_PLACE[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  let b = b0;
  for (const [from, pb] of per ?? []) if (f >= from) b = pb;
  return {i, y: b.y, left: b.left ?? 96, width: b.width ?? 840};
};
