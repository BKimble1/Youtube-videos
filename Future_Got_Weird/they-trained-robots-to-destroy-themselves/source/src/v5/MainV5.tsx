// V5 master timeline. Every section boundary comes from the V5 narration word timings (v5/cues.ts).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {NARR_END} from './cues';
import {Hook, HOOK_END} from './shots/Hook';
import {Factory, FACTORY_END} from './shots/Factory';
import {Options, OPTIONS_END} from './shots/Options';
import {Imatra, IMATRA_END} from './shots/Imatra';
import {Post, POST_END} from './shots/Post';
import {Train, TRAIN_END} from './shots/Train';
import {Real, REAL_END} from './shots/Real';
import {Prove, PROVE_END} from './shots/Prove';
import {End, END_HOLD} from './shots/End';

export const MAIN_V5_FRAMES = Math.round((NARR_END + END_HOLD) * 30);
export const SECTIONS_V5: {id: string; start: number; end: number; C: React.FC}[] = [
  {id: 'hook', start: 0, end: HOOK_END, C: Hook},
  {id: 'factory', start: HOOK_END, end: FACTORY_END, C: Factory},
  {id: 'options', start: FACTORY_END, end: OPTIONS_END, C: Options},
  {id: 'imatra', start: OPTIONS_END, end: IMATRA_END, C: Imatra},
  {id: 'post', start: IMATRA_END, end: POST_END, C: Post},
  {id: 'train', start: POST_END, end: TRAIN_END, C: Train},
  {id: 'real', start: TRAIN_END, end: REAL_END, C: Real},
  {id: 'prove', start: REAL_END, end: PROVE_END, C: Prove},
  {id: 'end', start: PROVE_END, end: NARR_END + END_HOLD, C: End},
];

export const MainV5: React.FC<{audio?: 'mix' | 'narration' | false}> = ({audio = 'narration'}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {SECTIONS_V5.map(({id, start, end, C}) => {
      const from = Math.round(start * 30);
      const to = Math.round(end * 30);
      return <Sequence key={id} name={id} from={from} durationInFrames={Math.max(1, to - from)}><C /></Sequence>;
    })}
    {audio === 'mix' ? <Audio src={staticFile('v5/audio/mix_v5.mp3')} /> : audio === 'narration' ? <Audio src={staticFile('v5/audio/narration_v5.mp3')} /> : null}
  </AbsoluteFill>
);
