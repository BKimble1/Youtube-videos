// V3 captions: the approved phrases, timed to the V3 master (timeline_v3.json); heights per shot keep them clear of
// the feet, the joint and the impact.
import React from 'react';
import {clamp} from '../lib';
import {CaptionLine} from '../Captions';
import {CAPS3} from './story3';

export const CAP_Y3: [string, number][] = [
  ['Doctors turned', 270], ['into a', 270], ['Wyatt had', 270], ['Surgeons had', 270], ['but they', 270],
  ['They turned', 270], ['and attached', 1700], ['with his', 270], ['That backward', 270], ['the same', 270],
  ['When Wyatt', 270], ['he could', 270], ['And once', 270], ['to use', 250], ['that same', 250], ['kick a', 250],
];
export const Captions3: React.FC<{t: number}> = ({t}) => {
  const i = CAPS3.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < (k + 1 < CAPS3.length ? CAPS3[k + 1].show : 1e9));
  if (i < 0) return null;
  const [first, y] = CAP_Y3[i];
  if (!CAPS3[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}`);
  return <CaptionLine key={i} c={CAPS3[i]} y={y} a={i === 0 ? 1 : clamp((t - CAPS3[i].show) / 0.067)} />;
};
