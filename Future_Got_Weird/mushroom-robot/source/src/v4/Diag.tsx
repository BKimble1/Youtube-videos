// Stage A rig validation: the walker on its own, continuous (no cuts), at a fixed angle relative to it.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {fixedCam} from './cam';
import {FPS} from './timing';
export const DiagWalk: React.FC<{t0: number; yawRel: number; pitch: number; dist: number}> = ({t0, yawRel, pitch, dist}) => {
  const t = t0 + useCurrentFrame() / FPS;
  return <AbsoluteFill style={{background: '#000'}}><RobotWorld t={t} cam={fixedCam(t, yawRel, pitch, dist, 1.2, 46)} /></AbsoluteFill>;
};
