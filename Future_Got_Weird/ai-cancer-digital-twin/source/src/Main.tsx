// Master timeline. Section boundaries come from narration cues (each shot file exports its end time); every section
// receives the film time t (seconds) so all cues are absolute.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {DURATION, FPS} from './kit/core';
import {Hook, HOOK_END} from './shots/Hook';
import {Reveal, REVEAL_END} from './shots/Reveal';
import {Copy, COPY_END} from './shots/Copy';
import {Address, ADDRESS_END} from './shots/Address';
import {Switch, SWITCH_END} from './shots/Switch';
import {Survivor, SURVIVOR_END} from './shots/Survivor';
import {Future} from './shots/Future';

export const MAIN_FRAMES = Math.round(DURATION * FPS);
type Sec = {id: string; start: number; end: number; C: React.FC<{t: number}>};
export const SECTIONS: Sec[] = [
  {id: 'hook', start: 0, end: HOOK_END, C: Hook},
  {id: 'reveal', start: HOOK_END, end: REVEAL_END, C: Reveal},
  {id: 'copy', start: REVEAL_END, end: COPY_END, C: Copy},
  {id: 'address', start: COPY_END, end: ADDRESS_END, C: Address},
  {id: 'switch', start: ADDRESS_END, end: SWITCH_END, C: Switch},
  {id: 'survivor', start: SWITCH_END, end: SURVIVOR_END, C: Survivor},
  {id: 'future', start: SURVIVOR_END, end: DURATION + 1, C: Future},
];

export const Main: React.FC<{audio?: 'mix' | 'narration' | false}> = ({audio = 'narration'}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const active = SECTIONS.filter((s) => t >= s.start && t < s.end);
  const sec = active.length ? active[active.length - 1] : SECTIONS[SECTIONS.length - 1];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <sec.C t={t} />
      {audio === 'mix' ? <Audio src={staticFile('audio/mix.wav')} /> : audio === 'narration' ? <Audio src={staticFile('audio/narration.mp3')} /> : null}
    </AbsoluteFill>
  );
};
