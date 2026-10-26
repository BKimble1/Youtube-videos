// Glass Climbing V8: working stills.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from '../lib';
import {BayWorld5 as BayWorld8} from './Bay8';
import {climbAt, climbTop} from './climb8';

/** up to 12 frames of the bay, 4 across at quarter size; follow: the camera centred on his hips (cx, cy offsets);
 *  top: the frames in the top coordinates (climbTop), for the seam */
export const BaySheet8: React.FC<{fs: number[]; cx: number; cy: number; z: number; follow: boolean; top?: boolean}> = ({fs, cx, cy, z, follow, top}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => {
      const st = top ? climbTop(f) : climbAt(f);
      const cam = follow ? {x: st.pose.x - 140 + cx, y: st.pose.y - 60 + cy, z} : {x: cx, y: cy, z};
      return (
        <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <BayWorld8 id={`b8s${i}`} st={st} cam={cam} k={1 / Math.sqrt(Math.max(0.4, z))} f={f} />
          </svg>
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{f}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

import {Exterior8} from './Exterior8';
import {Cam3} from './Tower8';
/** one exterior view: the 2D climber over the perspective tower (eye, target in metres) */
export const ExtTest8: React.FC<{f: number; eye: [number, number, number]; target: [number, number, number]; fl: number; top?: boolean; brick?: number; noMan?: boolean; shift?: number}> = ({f, eye, target, fl, top, brick, noMan, shift}) => {
  const cam: Cam3 = {eye: {x: eye[0], y: eye[1], z: eye[2]}, target: {x: target[0], y: target[1], z: target[2]}, f: fl};
  const at = (t: number) => (top ? climbTop(t) : climbAt(t));
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      <Exterior8 id="ext" f={f} cam={cam} st={noMan ? null : at(f)} brickMatch={brick == null ? null : at(brick)} floorShift={shift} />
    </AbsoluteFill>
  );
};

type ExtV = {f: number; eye: [number, number, number]; target: [number, number, number]; fl: number; top?: boolean};
/** several exterior views, 4 across at quarter size */
export const ExtSheet8: React.FC<{vs: ExtV[]}> = ({vs}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {vs.map((v, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <ExtTest8 {...v} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{v.f}</div>
      </div>
    ))}
  </AbsoluteFill>
);

import {TowerScene} from './Tower8';
/** the clean environment at an exterior camera (no climber, no gear, no captions): a composition reference */
export const PlateRef8: React.FC<{f: number; eye: [number, number, number]; target: [number, number, number]; fl: number}> = ({f, eye, target, fl}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    <TowerScene id="pref" cam={{eye: {x: eye[0], y: eye[1], z: eye[2]}, target: {x: target[0], y: target[1], z: target[2]}, f: fl}} f={f} st={null} />
  </AbsoluteFill>
);
/** the bay facade in the film's own drawing (no climber, no gear): a style reference */
export const BayStyle8: React.FC<{cx: number; cy: number; z: number}> = ({cx, cy, z}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <BayWorld8 id="bstyle" st={climbAt(700)} cam={{x: cx, y: cy, z}} k={1 / Math.sqrt(Math.max(0.4, z))} f={700} man={false} gear={false} />
    </svg>
  </AbsoluteFill>
);
