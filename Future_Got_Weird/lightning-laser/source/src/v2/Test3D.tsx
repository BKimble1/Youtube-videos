// working still: several perspective cameras on one sheet
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Apparatus3D, Beam3D, Discharge3D, Sky3D, Tower3D} from './Scene3D';
import {axis3, BEAM_DIR, BOLT3, Cam3, EXIT3, lookAt, v3, add3} from './p3';

export const CAMS: Record<string, Cam3> = {
  Hf: lookAt(v3(-40, 112, -42), v3(14, 175, 0), 620),
  Hk: lookAt(v3(-34, 104, -36), v3(12, 166, 0), 520),
  H2e: lookAt(v3(-70, -16, -22), v3(-36, 18, 0), 620),
  E1g: lookAt(add3(EXIT3, v3(-2.6, -1.2, -5.5)), v3(-8, 95, 0), 430),
  T2: lookAt(v3(12, 1, -14), v3(1, 150, 0), 380),
  W: lookAt(v3(-60, 40, -420), v3(-5, 95, 0), 1500),
};
export const Test3D: React.FC<{names: string[]; sFrac: number; flash: number}> = ({names, sFrac, flash}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {names.map((n, i) => {
      const cam = CAMS[n];
      const s = BOLT3.total * sFrac;
      return (
        <div key={n} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <Sky3D cam={cam} flash={flash} boltTop={BOLT3.pts[BOLT3.pts.length - 1]} drift={0} rainT={0.3} />
            <Tower3D cam={cam} flash={flash} aviation={1} id={`t${i}`} />
            <Apparatus3D cam={cam} flash={flash} fire={1} id={`a${i}`} />
            <Beam3D cam={cam} alpha={0.8} pulses={[-600, -300, 0, 250, 500]} channel={0.8} id={`b${i}`} />
            <Discharge3D cam={cam} s={s} core={1} id={`d${i}`} />
            <text x={30} y={110} fontSize={90} fill="#FF0">{n}</text>
          </svg>
        </div>
      );
    })}
  </AbsoluteFill>
);
export {axis3, BEAM_DIR};

import {View3D} from './shots3d';
import {lookAt as la} from './p3';
import {ShotId} from './timeline2';
/** working still: shots at given times, optionally with a camera override [px,py,pz, tx,ty,tz, f, roll] */
export const ShotTest: React.FC<{items: {id: string; t: number; cam?: number[]}[]}> = ({items}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {items.map((it, i) => {
      const c = it.cam ? {...la(v3(it.cam[0], it.cam[1], it.cam[2]), v3(it.cam[3], it.cam[4], it.cam[5]), it.cam[6]), roll: it.cam[7] ?? 0} : undefined;
      return (
        <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <View3D id={it.id as ShotId} t={it.t} tag={`st${i}`} camOverride={c} />
            <text x={30} y={110} fontSize={80} fill="#FF0">{`${i} ${it.id} ${it.t}`}</text>
          </svg>
        </div>
      );
    })}
  </AbsoluteFill>
);
