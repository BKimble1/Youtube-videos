// V2 captions: the channel treatment (Captions.CaptionLine), one fixed height per caption chosen off the action.
import React from 'react';
import {CaptionLine} from '../Captions';
import {clamp} from '../lib';
import {CAPTIONS} from './lib2';

export const CAP_Y2: [string, number][] = [
  ['If you', 1500], ['into a', 1500], ['you could', 1540], ['Because', 1540], ['all its', 1500], ['You see', 340], ['to straighten', 1520],
  ['And when', 1500], ['that pressure', 1500], ['So scientists', 1540], ['to a', 1500], ['and pumped', 340], ['Its legs', 1500],
  ['But when', 640], ['the legs', 1500], ["They'd", 1500], ['into a working', 1500], ['And they', 1500], ['to pick', 1500], ['ANOTHER', 1500],
];
export const capIndex2 = (t: number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
export const capY2 = (i: number) => {
  const [first, y] = CAP_Y2[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
export const Captions2: React.FC<{t: number}> = ({t}) => {
  const i = capIndex2(t);
  if (i < 0) return null;
  return <CaptionLine c={CAPTIONS[i]} y={capY2(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
};
