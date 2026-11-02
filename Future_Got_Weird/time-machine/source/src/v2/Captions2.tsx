// V2 captions: the channel treatment (Nunito Black, white with a dark stroke, key words in yellow capitals), phrase by
// phrase, in screen space, each at its own height so it stays clear of faces, hands, the watch and the photographs.
import React from 'react';
import {CAPTIONS, clamp} from '../lib';
import {CaptionLine} from '../Captions';

export const capIndex2 = (t: number, hide: (i: number) => number) => CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < hide(k));
export const Captions2: React.FC<{t: number; y: (i: number, t: number) => number; hide: (i: number) => number; left?: (i: number) => number}> = ({t, y, hide, left}) => {
  const i = capIndex2(t, hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const a = (i === 0 ? 1 : clamp((t - c.show) / 0.067)) * clamp((hide(i) - t) / 0.067);
  return <CaptionLine key={i} c={c} y={y(i, t)} a={a} left={left ? left(i) : undefined} />;
};
