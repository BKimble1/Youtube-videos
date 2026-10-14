// V2 master timeline. Every section start/end comes from the V2 narration cues (cues.ts).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {HookFoundry, HOOK_FOUNDRY_END} from './shots/HookFoundry';
import {HookTurn, HOOK_TURN_START, HOOK_TURN_END} from './shots/HookTurn';
import {Why, WHY_START, WHY_END} from './shots/Why';
import {Film, FILM_START, FILM_END} from './shots/Film';
import {Train, TRAIN_START, TRAIN_END} from './shots/Train';
import {Real, REAL_START, REAL_END} from './shots/Real';
import {Prove, PROVE_START, PROVE_END} from './shots/Prove';
import {End, END_START, END_FRAMES_TOTAL} from './shots/End';

export const SECTIONS_V2: {id: string; start: number; end: number; C: React.FC}[] = [
  {id: 'h_foundry', start: 0, end: HOOK_FOUNDRY_END, C: HookFoundry},
  {id: 'h_turn', start: HOOK_TURN_START, end: HOOK_TURN_END, C: HookTurn},
  {id: 'b2_why', start: WHY_START, end: WHY_END, C: Why},
  {id: 'b3_film', start: FILM_START, end: FILM_END, C: Film},
  {id: 'b4_train', start: TRAIN_START, end: TRAIN_END, C: Train},
  {id: 'b5_real', start: REAL_START, end: REAL_END, C: Real},
  {id: 'b6_prove', start: PROVE_START, end: PROVE_END, C: Prove},
  {id: 'b7_end', start: END_START, end: END_FRAMES_TOTAL / 30, C: End},
];
export const MAIN_V2_FRAMES = END_FRAMES_TOTAL;

export const MainV2: React.FC<{audio?: 'mix' | 'narration' | false}> = ({audio = 'narration'}) => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SECTIONS_V2.map(({id, start, end, C}) => {
        const from = Math.round(start * 30);
        const to = Math.round(end * 30);
        return <Sequence key={id} name={id} from={from} durationInFrames={Math.max(1, to - from)}><C /></Sequence>;
      })}
      {audio === 'mix' ? <Audio src={staticFile('v2/audio/mix_v2.mp3')} /> : audio === 'narration' ? <Audio src={staticFile('v2/audio/narration_v2.mp3')} /> : null}
    </AbsoluteFill>
  );
};
