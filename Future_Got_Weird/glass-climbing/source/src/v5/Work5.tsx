// Glass Climbing V5: working stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {Layer} from '../dc/camera';
import {H_BAR} from '../world/rig';
import {allTiles, Pad3D, Pad3DState} from './Pad3D';

const BASE: Pad3DState = {yaw: 40, pitch: 14, load: 0.5, contact: allTiles(0.7), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 300};
export const PadTest5: React.FC<{sts: Partial<Pad3DState>[]; z: number}> = ({sts, z}) => (
  <AbsoluteFill style={{backgroundColor: '#24323B'}}>
    {sts.map((s, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <rect width={W} height={H} fill="#24323B" />
          <Layer cam={{x: 30, y: 20, z}} depth={1}>
            <Pad3D id={`pt${i}`} st={{...BASE, ...s}} z={z} />
          </Layer>
        </svg>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{JSON.stringify(s).slice(0, 40)}</div>
      </div>
    ))}
  </AbsoluteFill>
);

import {BayWorld5} from './Bay5';
import {climbAt as climbAt5} from './climb5';
export const BaySheet5: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean}> = ({fs, cx, cy, z, follow}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = climbAt5(f);
      const cam = follow ? {x: st.pose.x - 140 + cx, y: st.pose.y - 60 + cy, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld5 id={`b5s${i}`} st={st} cam={cam} k={1 / Math.sqrt(Math.max(0.4, z))} f={f} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

import {LookDown} from './LookDown';
export const LookTest5: React.FC<{f: number; view?: number[]}> = ({f, view}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    <LookDown id="ld" f={f} f0={868} view={view} />
  </AbsoluteFill>
);
