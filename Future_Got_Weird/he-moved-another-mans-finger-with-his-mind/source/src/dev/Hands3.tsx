import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CrewChar, IDLE, reach} from '../v3/crew3';
import {RAO, STOCCO, EEGCap} from '../art/people';
import {K} from '../art/kit';
const shapes = [{curl: 0.1, spread: 0.6}, {curl: 0.35, spread: 0.3}, {curl: 0.9, spread: 0.1}, {curl: 0.85, spread: 0.2, point: 1}];
export const Hands3: React.FC = () => (
  <AbsoluteFill style={{background: K.paper}}>
    <svg width={1920} height={1080}>
      {shapes.map((h, i) => (
        <g key={i}>
          <CrewChar id={`h${i}`} look={i % 2 ? STOCCO : RAO} pose={{...IDLE, armL: {a: 12, b: 8}, armR: {a: 55, b: 35}, handL: h, handR: h}} frame={0} x={260 + i * 460} y={1000} scale={2} headGear={i % 2 ? undefined : <EEGCap />} />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
