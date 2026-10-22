// Art check stills (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {camT} from './lib';
import {FaceDevice, K} from './art/Face';
import {DeviceSection} from './art/Section';

export const ArtTest: React.FC<{yaw: number; pitch: number; s: number; cam: {x: number; y: number; z: number; r?: number}; win: number; tone: number; scene?: string}> = ({yaw, pitch, s, cam, win, tone, scene}) => (
  <AbsoluteFill style={{background: `linear-gradient(${K.bg0}, ${K.bg1})`}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={camT(cam)}>
        {scene === 'sec' ? <DeviceSection d={s} t={1} tone={tone} id="sec" anchorGlow={[0, 0, 0, 1]} /> : <FaceDevice v={{yaw, pitch}} s={s} t={1} id="t" win={win} winTone={tone} stretch={1} />}
      </g>
    </svg>
  </AbsoluteFill>
);
