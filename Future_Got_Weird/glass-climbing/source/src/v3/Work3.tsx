// Glass Climbing V3: working stills (contact sheets of the bay through a fixed or following camera).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {BayWorld3} from './Bay3';
import {climbAt} from './climb3';

export const BaySheet3: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean}> = ({fs, cx, cy, z, follow}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = climbAt(f);
      const cam = follow ? {x: st.pose.x - 120, y: st.pose.y - 160, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld3 id={`b3s${i}`} st={st} cam={cam} k={1 / Math.sqrt(z)} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

import {PressView} from './Press';
import {H_BAR, H_BAR_OPEN} from '../world/rig';
export const PressTest: React.FC<{z: number; cx: number; cy: number}> = ({z, cx, cy}) => {
  const sts = [
    {surface: 'glass' as const, press: 0, shear: 0, gap: 6, tilt: 0, slide: 0, hand: H_BAR_OPEN, sag: 0},
    {surface: 'glass' as const, press: 0.5, shear: 1.5, gap: 0, tilt: 0, slide: 0, hand: H_BAR, sag: 0},
    {surface: 'glass' as const, press: 1, shear: 4, gap: 0, tilt: 0, slide: 0, hand: H_BAR, sag: 0},
    {surface: 'brick' as const, press: 1, shear: 4, gap: 0, tilt: 0, slide: 0, hand: H_BAR, sag: 0},
    {surface: 'brick' as const, press: 1, shear: 4, gap: 3, tilt: 9, slide: 14, hand: H_BAR, sag: 30},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {sts.map((st, i) => (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <PressView id={`pt${i}`} st={st} cam={{x: cx, y: cy, z}} />
          </svg>
        </div>
      ))}
    </AbsoluteFill>
  );
};
