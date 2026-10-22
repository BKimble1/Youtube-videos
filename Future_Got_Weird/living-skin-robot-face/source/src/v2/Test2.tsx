// V2 art check stills (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {camT} from '../lib';
import {FaceDevice2, K} from './Face2';

export const ArtTest2: React.FC<{yaw: number; pitch: number; s: number; cam: {x: number; y: number; z: number; r?: number}; xc: number; tone: number}> = ({yaw, pitch, s, cam, xc, tone}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, #1D2B37 0%, ${K.bg1} 75%)`}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={camT(cam)}>
        <FaceDevice2 v={{yaw, pitch}} s={s} t={1} id="t2" xc={xc} tone={tone} stretch={1} />
      </g>
    </svg>
  </AbsoluteFill>
);
