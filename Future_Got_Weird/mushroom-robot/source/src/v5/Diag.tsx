// V5 validation renders: the walker with a STATIC world camera (no movement, no cuts), from several angles.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {camPose} from './shots';
import {FPS} from './timing';
import {v3, V3} from '../lib';
import {H} from './cam';
export const DiagStatic: React.FC<{t0: number; anchor: number; yaw: number; pitch: number; dist: number; up: number; fov: number}> = (p) => {
  const t = p.t0 + useCurrentFrame() / FPS;
  const k = camPose({yaw: p.yaw, pitch: p.pitch, dist: p.dist, up: p.up, fov: p.fov, anchor: p.anchor, follow: 0}, t);
  const fwd = v3.nrm(v3.sub(k.target, k.pos)), right = v3.nrm(v3.cross(fwd, [0, 1, 0] as V3)), up = v3.cross(right, fwd);
  const cam = {pos: k.pos, fwd, right, up, fpx: H / 2 / Math.tan((k.fov * Math.PI) / 360), target: k.target};
  return <AbsoluteFill style={{background: '#000'}}><RobotWorld t={t} cam={cam} /></AbsoluteFill>;
};
