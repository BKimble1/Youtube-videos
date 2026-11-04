// V2 captions: the channel treatment (Captions.tsx CaptionLine), phrase by phrase in screen space; each caption's
// height is chosen per shot to stay clear of the toes, the joint and the impact.
import React from 'react';
import {CAPTIONS, clamp} from '../lib';
import {CaptionLine} from '../Captions';

export const CAP_Y2: [string, number][] = [
  ['Doctors turned', 300], ['into a', 300], ['Wyatt had', 1660], ['Surgeons had', 300], ['but they', 300],
  ['They turned', 300], ['and attached', 300], ['with his', 1690], ['That backward', 1770], ['the same', 1770],
  ['When Wyatt', 300], ['he could', 300], ['And once', 250], ['to use', 1730], ['that same', 1730], ['kick a', 1730],
];
const idx = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < (k + 1 < CAPTIONS.length ? CAPTIONS[k + 1].show : 1e9));
export const Captions2: React.FC<{t: number}> = ({t}) => {
  const i = idx(t);
  if (i < 0) return null;
  const [first, y] = CAP_Y2[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}`);
  return <CaptionLine key={i} c={CAPTIONS[i]} y={y} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
};
