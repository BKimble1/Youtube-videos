// Dev still: the V4 scene at time t from any camera (rig and staging audits).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lookAt} from '../rig/draw';
import {v3} from '../rig/geo';
import {RoomScene} from '../Scene';
import {cast} from '../story';

export const C4Probe: React.FC<{pos: number[]; tgt: number[]; f: number; t: number}> = ({pos, tgt, f, t}) => (
  <AbsoluteFill style={{background: '#F1E6CC'}}>
    <RoomScene t={t} cam={lookAt(v3(pos[0], pos[1], pos[2]), v3(tgt[0], tgt[1], tgt[2]), f)} actors={cast(t)} />
  </AbsoluteFill>
);
