// V4 master timeline. Section boundaries come from the (unchanged) V2 narration cues.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {NARR_END} from '../v3/cues';
import {Opening, OPEN_END} from './shots/Opening';
import {Why, WHY_END} from './shots/Why';
import {Film, FILM_START, FILM_END} from './shots/Film';
import {Real, REAL_START, REAL_END} from './shots/Real';

export const MAIN_V4_FRAMES = Math.round((NARR_END + 2.95) * 30);
export const SECTIONS_V4: {id: string; start: number; end: number; C: React.FC}[] = [
  {id: 'open', start: 0, end: OPEN_END, C: Opening},
  {id: 'why', start: OPEN_END, end: WHY_END, C: Why},
  {id: 'film', start: FILM_START, end: FILM_END, C: Film},
  {id: 'real', start: REAL_START, end: REAL_END, C: Real},
];

export const MainV4: React.FC<{audio?: 'mix' | 'narration' | false}> = ({audio = 'narration'}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {SECTIONS_V4.map(({id, start, end, C}) => {
      const from = Math.round(start * 30);
      const to = Math.round(end * 30);
      return <Sequence key={id} name={id} from={from} durationInFrames={Math.max(1, to - from)}><C /></Sequence>;
    })}
    {audio === 'mix' ? <Audio src={staticFile('v4/audio/mix_v4.mp3')} /> : audio === 'narration' ? <Audio src={staticFile('v2/audio/narration_v2.mp3')} /> : null}
  </AbsoluteFill>
);
