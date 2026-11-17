import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Heart, beatAt} from '../art/heart';
export const HeartTest: React.FC = () => (
  <AbsoluteFill style={{background: '#DDE8EE'}}>
    <svg width={1080} height={1920}>
      <g transform="translate(290 450) scale(1.4)"><Heart id="a" style="model" /></g>
      <g transform="translate(800 450) scale(1.4)"><Heart id="b" style="live" beat={beatAt(0)} /></g>
      <g transform="translate(290 1350) scale(1.4)"><Heart id="c" style="live" beat={beatAt(0.3)} /></g>
      <g transform="translate(800 1350) scale(1.4)"><Heart id="d" style="live" beat={beatAt(0.08)} /></g>
    </svg>
  </AbsoluteFill>
);
