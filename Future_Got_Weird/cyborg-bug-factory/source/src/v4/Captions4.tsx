// V4 captions: the same text, timing, font and positions as V1-V3; emphasis cut to five sparing highlights.
import React from 'react';
import {CAPTIONS, clamp} from '../lib';
import {capIndex, capY, CaptionLine} from '../Captions';

const EMPH4: Record<number, string[]> = {1: ['cockroaches'], 4: ['68', 'seconds'], 15: ['living'], 19: ['earthquake'], 23: ['bugs']};
export const Captions4: React.FC<{t: number}> = ({t}) => {
  const i = capIndex(t);
  if (i < 0) return null;
  const c = {...CAPTIONS[i], emph: EMPH4[i] ?? []};
  return <CaptionLine key={i} c={c} y={capY(i)} a={i === 0 ? 1 : clamp((t - CAPTIONS[i].show) / 0.067)} />;
};
