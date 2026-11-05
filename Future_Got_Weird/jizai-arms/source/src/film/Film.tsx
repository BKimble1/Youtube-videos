import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage, StageState} from '../r3/stage';
import {s1State} from './s1';
import {s2State, s34State} from './s2to4';
import {s5State, s6State} from './s56';
import {FPS} from './cast';
import {Captions} from './captions';
import {Audio, staticFile} from 'remotion';

export const stateAt = (t: number): StageState => {
  if (t < 6.45) return s1State(t);
  if (t < 13.3) return s2State(t);
  if (t < 21.6) return s34State(t);
  if (t < 26.2) return s5State(t);
  return s6State(t);
};

export const FilmFrame: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#24414F'}}>
    <Stage st={stateAt(t)} />
    {captions && <Captions t={t} />}
  </AbsoluteFill>
);

export const Film: React.FC<{captions?: boolean; audio?: string | false}> = ({captions = true, audio = false}) => {
  const f = useCurrentFrame();
  return (
    <>
      <FilmFrame t={f / FPS} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </>
  );
};

/** Probe: frame i shows film time times[i] (one bundle, many checks). */
export const Probe: React.FC<{times: number[]; capt?: boolean}> = ({times, capt = false}) => {
  const f = useCurrentFrame();
  return <FilmFrame t={times[Math.min(times.length - 1, f)]} captions={capt} />;
};
