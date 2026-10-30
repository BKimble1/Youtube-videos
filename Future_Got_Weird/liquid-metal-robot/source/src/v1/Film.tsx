// Placeholder: replaced by the V1 film.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/words.json';
import {Words} from '../shared/lib';

export const Film: React.FC<HookProps> = (props) => (
  <HookFrame hook="v1" W={WORDS as Words} bg="#1B2A33" capY={1500} props={props}>
    {(t) => <svg width={1080} height={1920}><circle cx={540} cy={900} r={200 + 40 * Math.sin(t * 3)} fill="#3A6A7A" /></svg>}
  </HookFrame>
);
