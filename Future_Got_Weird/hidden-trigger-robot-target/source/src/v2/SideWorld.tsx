// The side-view lab in world coordinates (V1 units). Left to right: shelf, test bench with the toy apple and model hand,
// the robot on its mobile base, a glass partition, and the researchers' workstation with a portrait monitor.
// One robot, drawn once. The monitor shows whatever `screen` renders, mapped from 1080x1920 into its 360x640 glass.
import React from 'react';
import {C, TABLE, APPLE, HANDPROP, ROBOT, F} from '../theme';
import {Pose, knifeFrame} from '../rig/kin';
import {ToyApple} from '../components/Props';
import {MobileBase} from '../components/RobotRig';
import {ModelHand2, RobotArm2} from './Props2';
import {C2} from './theme2';

export const MONITOR = {x: 1900, y: 420, w: 360, h: 640}; // glass (world units); 1080x1920 / 3
export const MONITOR_CAM = {cx: MONITOR.x + MONITOR.w / 2, cy: MONITOR.y + MONITOR.h / 2, z: 3, ay: 960};
export const FLOOR_Y = 1500;

export const SideDefs: React.FC = () => (
  <defs>
    <linearGradient id="fgwht2-wall" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#101A2E" />
      <stop offset="0.6" stopColor={C2.wallTop} />
      <stop offset="1" stopColor={C2.wallBot} />
    </linearGradient>
    <linearGradient id="fgwht2-warm" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={C2.warmWall2} />
      <stop offset="1" stopColor={C2.warmWall} />
    </linearGradient>
    <radialGradient id="fgwht2-pool" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#5D7BA8" stopOpacity={0.42} />
      <stop offset="1" stopColor="#5D7BA8" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="fgwht2-warmpool" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={C2.warmLight} stopOpacity={0.3} />
      <stop offset="1" stopColor={C2.warmLight} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="fgwht2-mat" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#8E9DB3" />
      <stop offset="1" stopColor={C2.mat} />
    </linearGradient>
    <linearGradient id="fgwht2-floor" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#0E1526" />
      <stop offset="1" stopColor="#070B14" />
    </linearGradient>
    <radialGradient id="fgwht2-soft" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#1A2236" stopOpacity={0.55} />
      <stop offset="1" stopColor="#1A2236" stopOpacity={0} />
    </radialGradient>
  </defs>
);

// Flat ring on the mat around a prop's base: the plan's current target (cyan = asked, amber = changed).
export const TargetRing: React.FC<{x: number; color: string; a: number; rx?: number}> = ({x, color, a, rx = 120}) =>
  a <= 0 ? null : (
    <g opacity={a}>
      <ellipse cx={x} cy={1252} rx={rx} ry={22} fill={color} opacity={0.22} />
      <ellipse cx={x} cy={1252} rx={rx} ry={22} fill="none" stroke={color} strokeWidth={6} />
    </g>
  );

const Workstation: React.FC<{screen?: React.ReactNode}> = ({screen}) => {
  const M = MONITOR;
  const deskY = 1170;
  return (
    <g>
      <rect x={1370} y={-1200} width={1600} height={2700} fill="url(#fgwht2-warm)" />
      <ellipse cx={2060} cy={900} rx={720} ry={560} fill="url(#fgwht2-warmpool)" />
      {/* wall sign and pinned notes */}
      <rect x={1930} y={276} width={300} height={84} rx={10} fill="#F1E7D6" stroke="#9C8B70" strokeWidth={3} />
      <text x={2080} y={331} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={34} fill="#3A3346" letterSpacing={3}>RESEARCH LAB</text>
      <rect x={1540} y={450} width={250} height={330} rx={8} fill="#E8E1D3" stroke="#9C8B70" strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1566 + (i % 2) * 112} y={478 + Math.floor(i / 2) * 140} width={86} height={100} rx={4} fill={['#F7D774', '#9ED8E6', '#F5B38A', '#C9E59B'][i]} transform={`rotate(${[-3, 2, 3, -2][i]} ${1609 + (i % 2) * 112} ${528 + Math.floor(i / 2) * 140})`} />
      ))}
      {/* desk */}
      <rect x={1440} y={deskY} width={1100} height={26} rx={6} fill={C2.deskTop} />
      <rect x={1440} y={deskY + 26} width={1100} height={18} fill={C2.desk} />
      {[1470, 2490].map((x) => (
        <rect key={x} x={x} y={deskY + 44} width={26} height={FLOOR_Y - deskY - 44} fill={C2.deskDark} />
      ))}
      {/* desk lamp */}
      <path d={`M 1600 ${deskY} L 1660 ${deskY} L 1640 ${deskY - 12} L 1620 ${deskY - 12} Z`} fill="#3A3346" />
      <line x1={1630} y1={deskY - 12} x2={1680} y2={deskY - 190} stroke="#3A3346" strokeWidth={9} strokeLinecap="round" />
      <line x1={1680} y1={deskY - 190} x2={1770} y2={deskY - 150} stroke="#3A3346" strokeWidth={9} strokeLinecap="round" />
      <path d="M 1752 1004 L 1810 1040 L 1782 1068 L 1736 1030 Z" fill="#E9A23B" />
      <path d={`M 1782 1060 L 1700 ${deskY} L 1880 ${deskY} Z`} fill={C2.warmLight} opacity={0.12} />
      {/* monitor: portrait glass on a stand */}
      <rect x={M.x + M.w / 2 - 70} y={deskY - 8} width={140} height={10} rx={4} fill="#22293A" />
      <rect x={M.x + M.w / 2 - 14} y={M.y + M.h} width={28} height={deskY - M.y - M.h - 4} fill="#22293A" />
      <rect x={M.x - 18} y={M.y - 18} width={M.w + 36} height={M.h + 36} rx={18} fill="#161B27" stroke="#2C3446" strokeWidth={4} />
      <svg x={M.x} y={M.y} width={M.w} height={M.h} viewBox="0 0 1080 1920" overflow="hidden">
        <rect x={0} y={0} width={1080} height={1920} fill={C2.diagBg} />
        {screen}
      </svg>
      {/* keyboard, mug, notebook */}
      <rect x={1930} y={deskY - 12} width={260} height={12} rx={4} fill="#2C3446" />
      <rect x={2300} y={deskY - 64} width={56} height={64} rx={8} fill="#E8E1D3" stroke="#9C8B70" strokeWidth={3} />
      <path d="M 2356 1124 q 26 0 26 20 q 0 18 -26 18" stroke="#9C8B70" strokeWidth={6} fill="none" />
      <rect x={1700} y={deskY - 10} width={150} height={10} rx={3} fill="#5D7BA8" />
    </g>
  );
};

export const SideWorld: React.FC<{
  pose: Pose;
  glint?: number;
  hot?: number;
  ring?: {target: 'apple' | 'hand'; a: number} | null;
  screen?: React.ReactNode;
  showWorkstation?: boolean;
}> = ({pose, glint, hot, ring, screen, showWorkstation}) => {
  const k = knifeFrame(pose);
  const height = Math.max(0, 1215 - k.edgeMid.y);
  const shOp = Math.max(0.15, 0.6 - height / 600);
  return (
    <g>
      <rect x={-1400} y={-1200} width={2770} height={2700} fill="url(#fgwht2-wall)" />
      {/* wall panels, ceiling light, shelf with spare props */}
      {[-260, 80, 420, 760, 1100].map((x) => (
        <rect key={x} x={x} y={200} width={300} height={880} rx={10} fill="none" stroke="#24324E" strokeWidth={3} />
      ))}
      <rect x={300} y={140} width={520} height={18} rx={9} fill="#DCE6F2" opacity={0.85} />
      <ellipse cx={560} cy={1150} rx={820} ry={520} fill="url(#fgwht2-pool)" />
      <g>
        <rect x={-360} y={560} width={420} height={14} rx={4} fill="#3A4B69" />
        <rect x={-330} y={470} width={110} height={90} rx={6} fill="#2E3D59" stroke="#425578" strokeWidth={3} />
        <rect x={-200} y={500} width={150} height={60} rx={6} fill="#2E3D59" stroke="#425578" strokeWidth={3} />
        <rect x={-360} y={800} width={420} height={14} rx={4} fill="#3A4B69" />
        <circle cx={-290} cy={768} r={32} fill={C.apple} opacity={0.75} />
        <rect x={-230} y={730} width={140} height={70} rx={6} fill="#2E3D59" stroke="#425578" strokeWidth={3} />
      </g>
      {showWorkstation !== false && <Workstation screen={screen} />}
      {/* glass partition between the bench and the workstation */}
      <rect x={1330} y={-1200} width={40} height={2700} fill="#2B3A55" />
      <rect x={1342} y={-1200} width={8} height={2700} fill="#5D7BA8" opacity={0.5} />
      <rect x={-1400} y={FLOOR_Y} width={4400} height={1400} fill="url(#fgwht2-floor)" />
      <rect x={-1400} y={FLOOR_Y} width={4400} height={10} fill="#22304A" />
      {Array.from({length: 30}).map((_, i) => (
        <path key={i} d={`M ${-300 + i * 60} ${FLOOR_Y + 120} l 30 0 l -14 22 l -30 0 Z`} fill="#E9A23B" opacity={0.7} />
      ))}
      <rect x={-1400} y={FLOOR_Y + 142} width={4400} height={6} fill="#2A3753" />
      <MobileBase />
      {/* bench: light test mat on top, dark apron and legs */}
      <path d={`M ${TABLE.left} ${TABLE.backY} L ${TABLE.right} ${TABLE.backY} L ${TABLE.right + 40} ${TABLE.frontY} L ${TABLE.left - 40} ${TABLE.frontY} Z`} fill="url(#fgwht2-mat)" />
      {[-60, 100, 260, 420, 580, 740, 900, 1060, 1220].map((x) => (
        <line key={x} x1={x} y1={TABLE.backY} x2={x + (x - 540) * 0.06} y2={TABLE.frontY} stroke={C2.matLine} strokeWidth={2} opacity={0.6} />
      ))}
      {[1160, 1215].map((y) => (
        <line key={y} x1={TABLE.left} y1={y} x2={TABLE.right} y2={y} stroke={C2.matLine} strokeWidth={2} opacity={0.5} />
      ))}
      <line x1={TABLE.left} y1={TABLE.backY} x2={TABLE.right} y2={TABLE.backY} stroke={C2.matEdge} strokeWidth={3} />
      <rect x={TABLE.left - 40} y={TABLE.frontY} width={TABLE.right - TABLE.left + 80} height={TABLE.apronY - TABLE.frontY} fill={C2.apron} />
      <line x1={TABLE.left - 40} y1={TABLE.frontY} x2={TABLE.right + 40} y2={TABLE.frontY} stroke="#C9D3DF" strokeWidth={4} />
      <rect x={TABLE.left - 40} y={TABLE.apronY} width={TABLE.right - TABLE.left + 80} height={14} fill="#1A2436" />
      {[20, 1040].map((x) => (
        <rect key={x} x={x} y={TABLE.apronY + 14} width={34} height={FLOOR_Y - TABLE.apronY - 14} fill="#1B2539" />
      ))}
      {/* tape marks where the props sit */}
      <path d={`M ${APPLE.x - 95} 1272 l 0 -14 l 14 0 M ${APPLE.x + 95} 1272 l 0 -14 l -14 0`} stroke="#E9A23B" strokeWidth={4} fill="none" opacity={0.8} />
      <path d={`M ${HANDPROP.left - 25} 1272 l 0 -14 l 14 0 M ${HANDPROP.right + 30} 1272 l 0 -14 l -14 0`} stroke="#E9A23B" strokeWidth={4} fill="none" opacity={0.8} />
      {ring && <TargetRing x={ring.target === 'apple' ? APPLE.x : HANDPROP.x} color={ring.target === 'apple' ? C.cyan : C.amber} a={ring.a} rx={ring.target === 'apple' ? 105 : 185} />}
      {/* soft shadow of the gripper/knife on the mat */}
      <ellipse cx={k.edgeMid.x + 30} cy={1256} rx={150} ry={13} fill="url(#fgwht2-soft)" opacity={shOp * 1.5} />
      <ToyApple />
      <ModelHand2 />
      <RobotArm2 pose={pose} glint={glint} hot={hot} id="side" />
    </g>
  );
};

export const ROBOT_BASE_X = ROBOT.mobile.x;
