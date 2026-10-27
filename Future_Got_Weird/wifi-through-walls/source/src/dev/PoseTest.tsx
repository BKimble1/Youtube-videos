// working still: the guesser in up to 4 pose variants (rig-local overrides on a standing base), for tuning gestures
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Person, pose} from '../art/person';
import {ManPose} from '../dc/Man';
import {HandPose} from '../dc/Hand';

export const PoseTest: React.FC<{variants: Partial<ManPose>[]; hand?: HandPose}> = ({variants, hand}) => (
  <AbsoluteFill style={{backgroundColor: '#DDE6EA'}}>
    <svg width={1080} height={1920}>
      {variants.map((v, i) => (
        <g key={i}>
          <line x1={(i % 2) * 540} y1={Math.floor(i / 2) * 960 + 900} x2={(i % 2) * 540 + 540} y2={Math.floor(i / 2) * 960 + 900} stroke="#999" />
          <Person id={`pt${i}`} cd={{x: (i % 2) * 540 + 300, y: Math.floor(i / 2) * 960 + 900, k: 0.78, depth: 1}} p={pose({y: -495, lAx: -60, lAy: -27, lA: 1, rAx: 40, rAy: -27, rA: 1, ...v})} look={{lHand: hand, rHand: hand}} />
          <text x={(i % 2) * 540 + 10} y={Math.floor(i / 2) * 960 + 40} fontSize={26}>{JSON.stringify(v).slice(0, 60)}</text>
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
