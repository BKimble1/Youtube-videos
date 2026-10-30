// HOOK 02 placeholder: replaced by the hook's own scene.
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h02_words.json';
import {Words} from '../shared/lib';

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="02" W={WORDS as Words} bg="#1B2A33" capY={1500} props={props}>
    {(t) => <svg width={1080} height={1920}><circle cx={540} cy={900} r={200 + 40 * Math.sin(t * 3)} fill="#3A6A7A" /></svg>}
  </HookFrame>
);
