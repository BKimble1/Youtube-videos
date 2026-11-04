// Cast sheet: every person in the film on the cast rig, with head gear (dev only).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CrewChar, IDLE} from '../art/crew';
import {BN, EEGCap, Earbuds, Headphones, RAO, STOCCO, SwimCap, V14} from '../art/people';
import {FONT_HEAD, K} from '../art/kit';
const row: [string, any, React.ReactNode][] = [
  ['Rao', RAO, <EEGCap key="e" />], ['Stocco', STOCCO, <><SwimCap /><Earbuds /></>],
  ['send1', V14.send1, <EEGCap key="e" />], ['recv1', V14.recv1, <><SwimCap /><Headphones /></>], ['send2', V14.send2, <EEGCap key="e" />], ['recv2', V14.recv2, <Headphones key="h" />],
  ['senderA', BN.senderA, <EEGCap key="e" />], ['senderB', BN.senderB, <EEGCap key="e" />], ['receiver', BN.receiver, <EEGCap key="e" />],
];
export const CastSheet: React.FC = () => (
  <AbsoluteFill style={{background: K.paper}}>
    <svg width={1920} height={1080}>
      {row.map(([n, look, gear], i) => (
        <g key={n}>
          <CrewChar look={look} pose={IDLE} frame={0} x={110 + i * 205} y={760} scale={0.95} headGear={gear} id={`c${i}`} />
          <text x={110 + i * 205} y={830} textAnchor="middle" fontFamily={FONT_HEAD} fontSize={28}>{n}</text>
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
