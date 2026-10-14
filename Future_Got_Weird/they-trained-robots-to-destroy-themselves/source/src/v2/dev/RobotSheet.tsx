// Reference sheet for the canonical robot assets (RIG-F02 + MODEL-F02/F03/SIM/PERF). Rendered to production/v2/.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {makeProj, orbit} from '../engine/camera';
import {DEG, V3} from '../engine/math';
import {Robot} from '../robot/Robot';
import {Pose, restPose} from '../robot/rig';
import {ModelKind} from '../robot/model';
import {C, F} from '../../theme';

const standing = (): Pose => {
  const p = restPose([0, 95.4, 0]);
  p.armL = {pitch: 0.08, roll: 0.16, twist: 0, elbow: 0.22, wrist: 0, grip: 0.35};
  p.armR = {pitch: 0.02, roll: 0.16, twist: 0, elbow: 0.3, wrist: 0, grip: 0.35};
  p.legL = {pitch: 0.02, roll: 0.03, knee: 0.04, ankle: 0.02};
  p.legR = {pitch: -0.02, roll: 0.03, knee: 0.04, ankle: -0.02};
  return p;
};

const View: React.FC<{x: number; y: number; w: number; h: number; angle: number; kind?: ModelKind; pose?: Pose; dist?: number; height?: number; target?: V3; fov?: number; label: string}> = ({x, y, w, h, angle, kind = 'F02', pose, dist = 520, height = 18, target = [0, 92, 0], fov = 22, label}) => {
  const pr = makeProj(orbit(target, dist, angle, height, fov), w, h);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={w} height={h} rx={18} fill="#FFFDF6" stroke={C.paperLine} strokeWidth={3} />
      <svg x={0} y={0} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
        <ellipse cx={w / 2} cy={pr.p([0, 0, 0]).y} rx={w * 0.22} ry={10} fill="rgba(22,42,50,0.12)" />
        <Robot pr={pr} pose={pose ?? standing()} kind={kind} id={`sheet-${label.replace(/\W/g, '')}`} />
      </svg>
      <text x={16} y={34} fontFamily={F.body} fontWeight={800} fontSize={22} fill={C.inkSoft}>{label}</text>
    </g>
  );
};

export const RobotSheet: React.FC = () => {
  const crouch = (() => {
    const p = standing();
    p.pos = [0, 76, 0];
    p.pitch = 0.32;
    p.spine.pitch = 0.18;
    p.head.pitch = -0.35;
    p.armL = {pitch: -0.7, roll: 0.12, twist: 0, elbow: 0.25, wrist: 0, grip: 0.4};
    p.armR = {pitch: -0.7, roll: 0.12, twist: 0, elbow: 0.25, wrist: 0, grip: 0.4};
    p.footL = {pos: [9.5, 10, 4]};
    p.footR = {pos: [-9.5, 10, 4]};
    return p;
  })();
  const air = (() => {
    const p = standing();
    p.pos = [0, 120, 0];
    p.pitch = 0.12;
    p.armL = {pitch: 1.1, roll: 0.25, twist: 0, elbow: 0.5, wrist: 0, grip: 0.2};
    p.armR = {pitch: 1.0, roll: 0.25, twist: 0, elbow: 0.6, wrist: 0, grip: 0.2};
    p.legL = {pitch: 0.55, roll: 0.05, knee: 0.9, ankle: -0.2};
    p.legR = {pitch: 0.2, roll: 0.05, knee: 0.5, ankle: -0.3};
    return p;
  })();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <text x={40} y={58} fontFamily={F.display} fontWeight={700} fontSize={40} fill={C.ink}>RIG-F02 · canonical robot reference (V2)</text>
        <text x={40} y={92} fontFamily={F.body} fontWeight={700} fontSize={22} fill={C.inkMuted}>One 3D skeleton, projected per shot. Original illustration; no logo or on-body marking (unverified here).</text>
        <View x={40} y={120} w={300} h={470} angle={0} label="F.02 front" />
        <View x={355} y={120} w={300} h={470} angle={40} label="F.02 three-quarter" />
        <View x={670} y={120} w={300} h={470} angle={90} label="F.02 side" />
        <View x={985} y={120} w={300} h={470} angle={180} label="F.02 back" />
        <View x={1300} y={120} w={580} h={470} angle={-28} dist={150} height={8} target={[0, 156, 0]} fov={26} label="F.02 head close-up" />
        <View x={40} y={605} w={300} h={455} angle={30} kind="F03" label="F.03 (soft cover)" />
        <View x={355} y={605} w={300} h={455} angle={30} kind="SIM" label="Virtual robot" />
        <View x={670} y={605} w={300} h={455} angle={30} kind="PERF" label="Generic performer" />
        <View x={985} y={605} w={300} h={455} angle={70} pose={crouch} label="Crouch (IK feet)" />
        <View x={1300} y={605} w={300} h={455} angle={80} pose={air} target={[0, 110, 0]} label="Airborne" />
        <View x={1615} y={605} w={265} h={455} angle={-120} label="Rear three-quarter" />
      </svg>
    </AbsoluteFill>
  );
};
void DEG;
