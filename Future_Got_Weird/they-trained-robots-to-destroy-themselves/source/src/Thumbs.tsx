import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {RobotSide, RobotFront} from './components/Robot';
import {STAND, RobotPose} from './lib/robot';
import {STEEL} from './components/Foundry';

/**
 * Thumbnails, 1280 x 720. Original editorial illustration built from the episode's own rig: one robot, one dangerous
 * destination, no people, no logos, no face. Text sits in a clean area. A: mid-leap above the ladle. B: over the
 * shoulder, looking down into it.
 */
const Title: React.FC<{x: number; y: number; size?: number; align?: 'left' | 'right'}> = ({x, y, size = 132, align = 'right'}) => (
  <div style={{position: 'absolute', left: align === 'left' ? x : undefined, right: align === 'right' ? 1280 - x : undefined, top: y, fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 0.92, color: C.ink, textAlign: align, letterSpacing: '-0.01em', WebkitTextStroke: `0px ${C.ink}`, textShadow: `0 6px 0 ${C.saffron}`}}>
    ON<br />PURPOSE
  </div>
);

const Ladle: React.FC<{cx: number; cy: number; rx: number; ry: number; depth: number; id: string}> = ({cx, cy, rx, ry, depth, id}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-s`} cx={cx} cy={cy} r={rx} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})`}>
        <stop offset="0" stopColor={STEEL.hot} />
        <stop offset="0.45" stopColor={STEEL.core} />
        <stop offset="0.8" stopColor={STEEL.mid} />
        <stop offset="1" stopColor={STEEL.edge} />
      </radialGradient>
      <linearGradient id={`${id}-sh`} x1={cx - rx} x2={cx + rx} y1={0} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={STEEL.shellDark} />
        <stop offset="0.35" stopColor={STEEL.shellLight} />
        <stop offset="0.7" stopColor={STEEL.shell} />
        <stop offset="1" stopColor={STEEL.shellDark} />
      </linearGradient>
    </defs>
    <path d={`M ${cx - rx - 10} ${cy} A ${rx + 10} ${ry + 8} 0 0 0 ${cx + rx + 10} ${cy} L ${cx + rx - 40} ${cy + depth} Q ${cx} ${cy + depth + 50} ${cx - rx + 40} ${cy + depth} Z`} fill={`url(#${id}-sh)`} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={cx} cy={cy} rx={rx + 10} ry={ry + 8} fill="#B5643C" stroke={C.ink} strokeWidth={6} />
    <ellipse cx={cx} cy={cy + 4} rx={rx - 14} ry={ry - 8} fill={`url(#${id}-s)`} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <ellipse key={i} cx={cx - rx * 0.5 + (i * 61) % (rx)} cy={cy + 4 + ((i * 37) % (ry * 0.8)) - ry * 0.35} rx={16} ry={5} fill={STEEL.crust} opacity={0.35} />
    ))}
    <path d={`M ${cx - rx - 10} ${cy} A ${rx + 10} ${ry + 8} 0 0 0 ${cx + rx + 10} ${cy}`} fill="none" stroke={STEEL.shellLight} strokeWidth={12} />
  </g>
);

export const ThumbA: React.FC = () => {
  const pose: RobotPose = {...STAND, x: 420, y: 262, rot: 18, lean: 8, neck: 8, hipN: 48, kneeN: 74, ankleN: 22, hipF: 30, kneeF: 60, ankleF: 26, shN: 62, elN: 36, shF: 50, elF: 44};
  return (
    <AbsoluteFill style={{background: '#F4EBD8', overflow: 'hidden'}}>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <radialGradient id="ta-glow" cx={760} cy={640} r={760} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC27A" stopOpacity={0.95} />
            <stop offset="0.45" stopColor="#FFDCA8" stopOpacity={0.55} />
            <stop offset="1" stopColor="#F4EBD8" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* pale windows hint at a plant interior */}
        {[30, 330].map((x) => <rect key={x} x={x} y={-20} width={220} height={250} rx={8} fill="#FBF7EE" stroke="#D8CBB1" strokeWidth={4} />)}
        <rect x={0} y={0} width={1280} height={720} fill="url(#ta-glow)" />
        {/* ledge edge at the far left, so the leap reads */}
        <rect x={-40} y={560} width={150} height={200} fill="#C3BBAE" stroke={C.ink} strokeWidth={6} />
        <rect x={-40} y={560} width={150} height={26} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
        <Ladle cx={790} cy={590} rx={330} ry={70} depth={240} id="ta" />
        {/* soft heat haze above the steel */}
        {[0, 1, 2].map((i) => <path key={i} d={`M ${700 + i * 90} 500 Q ${720 + i * 90} 460 ${700 + i * 90} 420 Q ${680 + i * 90} 380 ${700 + i * 90} 340`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.25} />)}
        {/* arc of the leap */}
        <path d="M 120 520 Q 300 140 560 330" fill="none" stroke={C.ink} strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" opacity={0.35} />
        <RobotSide pose={pose} scale={1.06} />
      </svg>
      <Title x={1240} y={36} size={128} />
    </AbsoluteFill>
  );
};

export const ThumbB: React.FC = () => (
  <AbsoluteFill style={{background: '#F4EBD8', overflow: 'hidden'}}>
    <svg width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id="tb-glow" cx={820} cy={520} r={700} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC27A" stopOpacity={0.95} />
          <stop offset="0.5" stopColor="#FFDCA8" stopOpacity={0.5} />
          <stop offset="1" stopColor="#F4EBD8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1280} height={720} fill="url(#tb-glow)" />
      {/* looking down into the ladle: the steel fills the lower right */}
      <Ladle cx={820} cy={520} rx={460} ry={150} depth={260} id="tb" />
      {/* walkway edge under the robot */}
      <rect x={-20} y={640} width={560} height={120} fill="#C3BBAE" stroke={C.ink} strokeWidth={6} />
      <rect x={-20} y={640} width={560} height={24} fill={C.saffron} stroke={C.ink} strokeWidth={6} />
      {/* the robot from behind, large, head tilted down toward the steel */}
      {/* warm rim light on the side facing the steel (an offset copy behind the robot) */}
      <g transform="translate(9 3)"><RobotFront pose={{x: 300, y: 1290, tilt: 10, armL: 4, armR: 10, elL: 6, elR: 8}} view="back" finish="HOT" scale={2.25} shadow={false} /></g>
      <RobotFront pose={{x: 300, y: 1290, tilt: 10, armL: 4, armR: 10, elL: 6, elR: 8}} view="back" scale={2.25} shadow={false} />
    </svg>
    <Title x={1240} y={36} size={128} />
  </AbsoluteFill>
);
