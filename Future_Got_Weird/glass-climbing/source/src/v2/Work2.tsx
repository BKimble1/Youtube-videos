// Glass Climbing V2: working stills (contact sheets of the bay through a fixed or following camera).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {BayWorld2} from './Bay2';
import {climbAt} from './climb2';

export const BaySheet2: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean}> = ({fs, cx, cy, z, follow}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = climbAt(f);
      const cam = follow ? {x: st.pose.x - 120, y: st.pose.y - 160, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld2 id={`b2s${i}`} st={st} cam={cam} k={1 / Math.sqrt(z)} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

import {FieldState, FieldView} from './Field';
/** working sheet for the 2.5D field: eight states */
export const FieldTest: React.FC<{cz: number}> = ({cz}) => {
  const base: FieldState = {alpha: 0, beta: 0, lam: 0, surface: 'glass', gx: 0, slip: 0, back: 0, y0: 0, count: 14, zF: -450, zN: 450};
  const st3: FieldState = {...base, alpha: 0.9, beta: 32, count: 18, zF: -700, zN: 60, y0: 0, fog: 1, surface: 'none'};
  const sts: FieldState[] = [
    st3,
    {...st3, alpha: 0.8, beta: 36},
    {...st3, alpha: 0.95, beta: 24},
    {...st3, alpha: 0.85, beta: 30, surface: 'glass', gx: -20},
    {...st3, alpha: 0.85, beta: 30, surface: 'glass', lam: 0.4},
    {...st3, alpha: 0.85, beta: 30, surface: 'glass', lam: 1},
    {...st3, alpha: 0.85, beta: 30, surface: 'brick', lam: 0},
    {...st3, alpha: 0.85, beta: 30, surface: 'brick', lam: 1},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {sts.map((st, i) => (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <FieldView id={`ft${i}`} st={st} cam={{x: 30, y: 330, z: cz}} />
          </svg>
        </div>
      ))}
    </AbsoluteFill>
  );
};
