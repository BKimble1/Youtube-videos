// Glass Climbing V6: working stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {BayWorld5 as BayWorld6} from './Bay6';
import {climbAt} from './climb6';

/** up to 12 frames of the bay, 4 across at quarter size; follow: the camera centred on his hips (cx, cy offsets) */
export const BaySheet6: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean}> = ({fs, cx, cy, z, follow}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = climbAt(f);
      const cam = follow ? {x: st.pose.x - 140 + cx, y: st.pose.y - 60 + cy, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld6 id={`b6s${i}`} st={st} cam={cam} k={1 / Math.sqrt(Math.max(0.4, z))} f={f} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

import {Layer} from '../dc/camera';
import {H_BAR} from '../world/rig';
import {allTiles, Pad3D as Pad6, Pad3DState} from './Pad6';
const BASE6: Pad3DState = {yaw: 40, pitch: 14, load: 0.5, contact: allTiles(0.9), cover: 1, gap: 0, tilt: 0, slide: 0, surface: 'glass', hand: H_BAR, strap: 300};
/** the pad in several states, 4 across at quarter size */
export const PadTest6: React.FC<{sts: Partial<Pad3DState>[]; z: number; cx?: number; cy?: number}> = ({sts, z, cx = 30, cy = 20}) => (
  <AbsoluteFill style={{backgroundColor: '#24323B'}}>
    {sts.map((s, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <rect width={W} height={H} fill="#5F8C9E" />
          <Layer cam={{x: cx, y: cy, z}} depth={1}>
            <Pad6 id={`p6t${i}`} st={{...BASE6, ...s}} z={z} />
          </Layer>
        </svg>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 60, color: '#FF0', fontFamily: 'monospace'}}>{JSON.stringify(s).slice(0, 40)}</div>
      </div>
    ))}
  </AbsoluteFill>
);

import {Cam3, TowerScene} from './Tower3D';
/** a perspective view of the tower (eye and target in metres) */
export const TowerTest6: React.FC<{f: number; eye: number[]; target: number[]; fl: number; climber?: boolean}> = ({f, eye, target, fl, climber = true}) => {
  const cam: Cam3 = {eye: {x: eye[0], y: eye[1], z: eye[2]}, target: {x: target[0], y: target[1], z: target[2]}, f: fl};
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      <TowerScene id="tt" cam={cam} f={f} st={climber ? climbAt(f) : null} />
    </AbsoluteFill>
  );
};

import {FieldView5} from '../v5/Field5';
import {FieldView6} from './Field6';
import {MicroView} from '../v5/Micro5';
/** the 3D wedge field side-on and the section, same camera: left, right and a 50% overlay */
export const MatchTest6: React.FC<{lam: number; cx: number; cy: number; z: number; alpha: number; beta: number; y0: number}> = ({lam, cx, cy, z, alpha, beta, y0}) => {
  const cam = {x: cx, y: cy, z};
  const fst = {alpha, beta, lam, surface: 'glass' as const, gx: 0, slip: 0, back: 0, y0, count: 64, zF: -700, zN: 140, fog: 0};
  const mst = {surface: 'glass' as const, lam, gx: 0, back: 0, glow: 0, slip: 0, y0: -80, count: 26};
  const cell = (k: number, node: React.ReactNode) => (
    <div style={{position: 'absolute', left: k * 360, top: 0, width: 1080, height: 1920, transform: 'scale(0.333)', transformOrigin: '0 0', overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{node}</svg>
    </div>
  );
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {cell(0, <FieldView5 id="mf" st={fst} cam={cam} />)}
      {cell(1, <MicroView id="mm" st={mst} cam={cam} />)}
      {cell(2, <><FieldView5 id="mf2" st={fst} cam={cam} /><g opacity={0.5}><MicroView id="mm2" st={mst} cam={cam} /></g></>)}
    </AbsoluteFill>
  );
};

/** the wedge field at several turns (alpha, beta, zF, camera), 4 across at quarter size */
export const FieldTurn6: React.FC<{v: number[][]}> = ({v}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {v.map(([alpha, beta, zF, cx, cy, z, lam, gx], i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <FieldView6 id={`ft${i}`} st={{alpha, beta, lam, surface: 'glass', gx, slip: 0, back: 0, y0: -80 - 29 * 42, count: 64, zF, zN: 140, fog: 1}} cam={{x: cx, y: cy, z}} />
        </svg>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 60, color: '#FF0', fontFamily: 'monospace'}}>{`a${alpha} b${beta} z${zF}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
