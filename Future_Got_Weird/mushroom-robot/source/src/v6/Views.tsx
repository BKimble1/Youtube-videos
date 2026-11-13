// Test C: the SAME instant of the SAME rig seen from four static world cameras at once (2x2 grid, each 540x960).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {camPose} from './shots';
import {FPS} from './timing';
import {v3, V3} from '../lib';
import {H} from './cam';
const VIEWS = [{yaw: 45, pitch: 22, dist: 30}, {yaw: 45, pitch: 84, dist: 36}, {yaw: -90, pitch: 5, dist: 28}, {yaw: 180, pitch: 30, dist: 26}];
export const Views4: React.FC<{t0: number}> = ({t0}) => {
  const t = t0 + useCurrentFrame() / FPS;
  return <AbsoluteFill style={{background: '#000'}}>
    {VIEWS.map((v, k) => {
      const p = camPose({...v, up: 0.8, fov: 46, anchor: t0, follow: 0}, t);
      const fwd = v3.nrm(v3.sub(p.target, p.pos)), right = v3.nrm(v3.cross(fwd, [0, 1, 0] as V3)), up = v3.cross(right, fwd);
      const cam = {pos: p.pos, fwd, right, up, fpx: H / 2 / Math.tan((p.fov * Math.PI) / 360), target: p.target};
      return <div key={k} style={{position: 'absolute', left: (k % 2) * 540, top: Math.floor(k / 2) * 960, width: 1080, height: 1920, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <RobotWorld t={t} cam={cam} />
      </div>;
    })}
  </AbsoluteFill>;
};
