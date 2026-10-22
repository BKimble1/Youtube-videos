// V3 art check stills (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {camT} from '../lib';
import {FaceDevice3, K, notchAt} from './Face3';

export const ArtTest3: React.FC<{yaw: number; pitch: number; s: number; cam: {x: number; y: number; z: number; r?: number}; k: number; tone: number}> = ({yaw, pitch, s, cam, k, tone}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, #1D2B37 0%, ${K.bg1} 75%)`}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={camT(cam)}><FaceDevice3 v={{yaw, pitch}} s={s} t={1} id="t3" notch={notchAt(k)} tone={tone} stretch={1} /></g>
    </svg>
  </AbsoluteFill>
);
