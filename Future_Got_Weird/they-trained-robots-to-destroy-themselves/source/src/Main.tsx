import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {SceneOffset} from './lib/SceneFrame';
import {S1Cold} from './scenes/S1Cold';
import {S2Why, whyCues} from './scenes/S2Why';
import {S3Film, filmCues} from './scenes/S3Film';
import {S4Train, trainCues} from './scenes/S4Train';
import {S5Real, realCues} from './scenes/S5Real';
import {S6Prove, proveCues} from './scenes/S6Prove';
import {S7React, reactCues, END_CARD_FRAMES} from './scenes/S7React';

// Scene boundaries follow the narration's own phrase timings (lib/narration.ts); nothing is hand-timed in seconds.
export const BOUNDS = (() => {
  const b = [0, whyCues().start, filmCues().start, trainCues().start, realCues().start, proveCues().start, reactCues().start];
  const total = reactCues().narrEnd + END_CARD_FRAMES;
  return {starts: b, total};
})();
export const SCENES = [
  {id: 's1_cold', C: S1Cold},
  {id: 's2_why', C: S2Why},
  {id: 's3_film', C: S3Film},
  {id: 's4_train', C: S4Train},
  {id: 's5_real', C: S5Real},
  {id: 's6_prove', C: S6Prove},
  {id: 's7_react', C: S7React},
];
export const MAIN_FRAMES = BOUNDS.total;

export const Main: React.FC<{audio?: 'mix' | 'narration' | false}> = ({audio = 'mix'}) => (
  <AbsoluteFill style={{background: '#FAF3DF'}}>
    {SCENES.map(({id, C}, i) => {
      const from = BOUNDS.starts[i];
      const to = i + 1 < SCENES.length ? BOUNDS.starts[i + 1] : BOUNDS.total;
      return (
        <Sequence key={id} name={id} from={from} durationInFrames={to - from}>
          <SceneOffset from={from}><C /></SceneOffset>
        </Sequence>
      );
    })}
    {audio === 'mix' ? <Audio src={staticFile('audio/mix.mp3')} /> : audio === 'narration' ? <Audio src={staticFile('audio/narration.mp3')} /> : null}
  </AbsoluteFill>
);
