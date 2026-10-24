import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Emitter} from '../art/Emitter';

export const RBEmitterSheet: React.FC = () => (
  <AbsoluteFill style={{background: '#16323B'}}>
    <svg width={1080} height={1920}>
      <Emitter id="a" view={{ox: 270, oy: 300, k: 4, yaw: 0, pitch: 8}} led={1} />
      <Emitter id="b" view={{ox: 810, oy: 300, k: 4, yaw: 90, pitch: 8}} led={1} />
      <Emitter id="c" view={{ox: 270, oy: 1000, k: 4, yaw: -120, pitch: 12}} led={1} />
      <Emitter id="d" view={{ox: 810, oy: 1000, k: 4, yaw: 40, pitch: 14}} led={1} dial={60} />
      <Emitter id="e" view={{ox: 520, oy: 1500, k: 13, yaw: 30, pitch: 14, f: 160}} pedestal={false} xray={1} prism={40} inner={1} t={0.3} led={1} />
    </svg>
  </AbsoluteFill>
);
