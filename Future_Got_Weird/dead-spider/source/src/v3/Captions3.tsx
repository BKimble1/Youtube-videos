// V3 captions: the same V2 captions (text and timing unchanged), with heights chosen for the V3 picture.
import React from 'react';
import {CaptionLine} from '../Captions';
import {clamp} from '../lib';
import {CAPTIONS} from '../v2/lib2';

export const CAP_Y3: [string, number][] = [
  ['If you', 1540], ['into a', 1540], ['you could', 1540], ['Because', 1540], ['all its', 1540], ['You see', 1540], ['to straighten', 1540],
  ['And when', 1540], ['that pressure', 1540], ['So scientists', 1540], ['to a', 1540], ['and pumped', 1540], ['Its legs', 1540],
  ['But when', 1540], ['the legs', 1540], ["They'd", 1540], ['into a working', 1540], ['And they', 1540], ['to pick', 1540], ['ANOTHER', 1540],
];
export const capIndex3 = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
export const capY3 = (i: number) => {
  const [first, y] = CAP_Y3[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const Captions3: React.FC<{t: number}> = ({t}) => {
  const i = capIndex3(t);
  if (i < 0) return null;
  return <CaptionLine c={CAPTIONS[i]} y={capY3(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
};
