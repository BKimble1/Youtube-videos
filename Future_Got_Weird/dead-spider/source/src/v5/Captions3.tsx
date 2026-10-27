// V5 captions: the same V2 captions (text and timing unchanged), with heights chosen for the V5 picture.
import React from 'react';
import {CaptionLine} from '../Captions';
import {clamp} from '../lib';
import {CAPTIONS} from '../v2/lib2';

export const CAP_Y3: [string, number][] = [
  ["If you", 1500], ["into a", 1500], ["you could", 1470], ["Because when", 1470], ["all its", 1470], ["You see,", 380], ["to straighten", 400], ["And when", 1500], ["that pressure", 1470], ["So scientists", 700], ["to a", 1500], ["and pumped", 1470], ["Its legs", 1470], ["But when", 1470], ["the legs", 1470], ["They'd turned", 1470], ["into a", 1500], ["And they", 1470], ["to pick", 1500], ["ANOTHER dead", 1500],
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
  // kept inside the Shorts safe area: clear of the title/channel band at the bottom and the action buttons on the right
  return <CaptionLine c={CAPTIONS[i]} y={capY3(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} left={110} width={760} />;
};
