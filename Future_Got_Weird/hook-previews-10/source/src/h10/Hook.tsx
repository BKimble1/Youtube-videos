// HOOK 10: "A brain implant helped this man walk again… by bypassing his spinal injury."
// The scene lives in Scene.tsx; this wrapper adds the shared frame (background, vignette, captions, audio).
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h10_words.json';
import {Words} from '../shared/lib';
import {Scene} from './Scene';

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="10" W={WORDS as Words} bg="#1D343B" capY={300} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
