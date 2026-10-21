// The single tabletop environment in world coordinates: lab wall, table, props, robot and contact shadows.
import React from 'react';
import {C, TABLE, APPLE} from '../theme';
import {Pose, knifeFrame} from '../rig/kin';
import {ToyApple, ModelHand} from './Props';
import {MobileBase, RobotArm} from './RobotRig';

export const SceneDefs: React.FC = () => (
  <defs>
    <linearGradient id="fgwht-wall" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#0A101C" />
      <stop offset="0.55" stopColor={C.navy2} />
      <stop offset="1" stopColor="#070B14" />
    </linearGradient>
    <radialGradient id="fgwht-spot" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#3A5A86" stopOpacity={0.38} />
      <stop offset="1" stopColor="#3A5A86" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="fgwht-top" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#2A3B58" />
      <stop offset="1" stopColor={C.tableTop} />
    </linearGradient>
    <radialGradient id="fgwht-soft" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#03060C" stopOpacity={0.6} />
      <stop offset="1" stopColor="#03060C" stopOpacity={0} />
    </radialGradient>
  </defs>
);

export const TableScene: React.FC<{pose: Pose; sweep?: number}> = ({pose, sweep}) => {
  const k = knifeFrame(pose);
  const mid = k.edgeMid;
  const height = Math.max(0, 1215 - mid.y);
  const shOp = Math.max(0.12, 0.5 - height / 600);
  return (
    <g>
      <rect x={-1400} y={-1200} width={3900} height={4400} fill="url(#fgwht-wall)" />
      {/* wall panels */}
      {[-260, 80, 420, 760, 1100, 1440].map((x) => (
        <rect key={x} x={x} y={240} width={300} height={860} rx={10} fill="none" stroke="#16223A" strokeWidth={3} />
      ))}
      <ellipse cx={560} cy={1150} rx={760} ry={420} fill="url(#fgwht-spot)" />
      <MobileBase />
      {/* table */}
      <path d={`M ${TABLE.left} ${TABLE.backY} L ${TABLE.right} ${TABLE.backY} L ${TABLE.right + 40} ${TABLE.frontY} L ${TABLE.left - 40} ${TABLE.frontY} Z`} fill="url(#fgwht-top)" />
      <line x1={TABLE.left} y1={TABLE.backY} x2={TABLE.right} y2={TABLE.backY} stroke="#3B5079" strokeWidth={3} />
      <rect x={TABLE.left - 40} y={TABLE.frontY} width={TABLE.right - TABLE.left + 80} height={TABLE.apronY - TABLE.frontY} fill={C.table} />
      <line x1={TABLE.left - 40} y1={TABLE.frontY} x2={TABLE.right + 40} y2={TABLE.frontY} stroke={C.tableEdge} strokeWidth={4} />
      <rect x={TABLE.left - 40} y={TABLE.apronY} width={TABLE.right - TABLE.left + 80} height={14} fill="#121B2C" />
      {[20, 1040].map((x) => (
        <rect key={x} x={x} y={TABLE.apronY + 14} width={34} height={260} fill="#141E31" />
      ))}
      {/* faint tape marks on the test table */}
      <path d={`M ${APPLE.x - 95} 1268 l 0 -14 l 14 0 M ${APPLE.x + 95} 1268 l 0 -14 l -14 0`} stroke="#4B648F" strokeWidth={3} fill="none" opacity={0.6} />
      <path d="M 520 1272 l 0 -14 l 14 0 M 870 1272 l 0 -14 l -14 0" stroke="#4B648F" strokeWidth={3} fill="none" opacity={0.6} />
      {/* soft shadow of the gripper/knife on the table top (drawn under the props) */}
      <ellipse cx={mid.x + 40} cy={1262} rx={150} ry={14} fill="url(#fgwht-soft)" opacity={shOp * 1.4} />
      <ToyApple />
      <ModelHand />
      <RobotArm pose={pose} sweep={sweep} />
    </g>
  );
};
