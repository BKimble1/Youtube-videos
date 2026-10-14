import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {RobotSide, RobotFront} from '../components/Robot';
import {STAND, RobotPose, legIK, joints, STAND_HEIGHT} from '../lib/robot';

// Dev sheet: the rig in its key poses, for geometry inspection only.
const at = (x: number, ground: number, over: Partial<RobotPose>): RobotPose => ({...STAND, x, y: ground - STAND_HEIGHT, ...over});

const crouch = (x: number, g: number): RobotPose => {
  const hip = {x, y: g - STAND_HEIGHT + 70};
  const base = {...STAND, x: hip.x, y: hip.y, lean: 24, rot: 4};
  const n = legIK(hip, {x: x + 18, y: g - 16}, base.rot);
  const f = legIK(hip, {x: x - 6, y: g - 16}, base.rot);
  const p = {...base, hipN: n.hip, kneeN: n.knee, hipF: f.hip, kneeF: f.knee, shN: -40, elN: 30, shF: -46, elF: 30};
  const j = joints(p);
  return {...p, ankleN: j.legN.shinAng, ankleF: j.legF.shinAng};
};

export const KitRobot: React.FC = () => {
  const g = 900;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <line x1={0} y1={g} x2={1920} y2={g} stroke={C.inkMuted} strokeWidth={3} />
        <RobotSide pose={at(170, g, {})} groundY={g} />
        <RobotSide pose={crouch(400, g)} groundY={g} />
        <RobotSide pose={at(640, g - 120, {rot: 18, lean: 10, hipN: 40, kneeN: 70, ankleN: 30, hipF: -30, kneeF: 20, ankleF: 40, shN: 150, elN: 10, shF: 130, elF: 20, neck: -10})} groundY={g} />
        <RobotSide pose={at(880, g, {lean: 14, hipN: 30, kneeN: 30, ankleN: 0, hipF: -24, kneeF: 6, ankleF: 20, shN: -30, elN: 70, shF: 34, elF: 60})} groundY={g} glowKnee={1} battery={1} />
        <RobotFront pose={{x: 1110, y: g}} />
        <RobotFront pose={{x: 1330, y: g}} view="back" />
        <RobotSide pose={at(1540, g, {})} finish="F03" groundY={g} />
        <RobotSide pose={at(1760, g, {lean: 8, shN: 30, elN: 40})} finish="SIM" groundY={g} />
      </svg>
      <div style={{position: 'absolute', left: 40, top: 30, fontFamily: F.display, fontSize: 40, color: C.ink}}>Rig check: stand · crouch · flight · stride (knee + battery callouts) · front · back · F.03 · SIM</div>
    </AbsoluteFill>
  );
};
