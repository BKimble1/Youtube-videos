// Dev only: an atrium V5 frame from an explicit camera.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, v3} from '../v4/rig/geo4';
import {lookCam} from '../v4/core4';
import {AtriumV5} from './AtriumV5';

export const TestV5: React.FC<{t: number; pos: number[]; at: number[]; f: number; beam?: number; visitor?: boolean}> = ({t, pos, at, f, beam = 0, visitor = false}) => {
  const b = basis(lookCam(v3(pos[0], pos[1], pos[2]), v3(at[0], at[1], at[2]), f));
  return <AbsoluteFill style={{background: '#21323A'}}><AtriumV5 b={b} t={t} o={{beam, visitor, whisper: 0}} /></AbsoluteFill>;
};
