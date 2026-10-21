// Art test still: the test bay through an arbitrary camera and pose (development only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {camTransform} from './proj';
import {TestBay, WorldDefs} from './World3';

export const Test3: React.FC<{cam: {x: number; d: number; h: number; z: number; e: number; ay: number}; pose: {x: number; h: number; phi: number}}> = ({cam, pose}) => (
  <AbsoluteFill style={{backgroundColor: '#0A1015'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <WorldDefs />
      <g transform={camTransform(cam)}>
        <TestBay c={cam} pose={pose} />
      </g>
    </svg>
  </AbsoluteFill>
);
