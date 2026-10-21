// One consistent arm rig: mast + mobile base (fixed), UR-style links and joint caps, Hand-E style gripper, toy knife.
// Geometry comes only from solve(pose); the knife is drawn inside the gripper transform.
import React from 'react';
import {C, ROBOT} from '../theme';
import {Pose, solve} from '../rig/kin';
import {ToyKnife} from './Props';

const Link: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; w: number; outline?: string}> = ({a, b, w, outline}) => (
  <g>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={outline ?? C.robotInk} strokeWidth={w + 5} strokeLinecap="round" />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.robot} strokeWidth={w} strokeLinecap="round" />
    <line x1={a.x} y1={a.y - w * 0.22} x2={b.x} y2={b.y - w * 0.22} stroke="#E6ECF4" strokeWidth={w * 0.18} strokeLinecap="round" opacity={0.7} />
  </g>
);

const Cap: React.FC<{p: {x: number; y: number}; r: number; ring?: boolean}> = ({p, r, ring = true}) => (
  <g>
    <circle cx={p.x} cy={p.y} r={r + 2.5} fill={C.robotInk} />
    <circle cx={p.x} cy={p.y} r={r} fill={C.robotMid} />
    <circle cx={p.x} cy={p.y} r={r * 0.78} fill={C.robot} />
    {ring && <circle cx={p.x} cy={p.y} r={r * 0.78} fill="none" stroke={C.cyan} strokeWidth={Math.max(2.5, r * 0.09)} opacity={0.9} />}
    <circle cx={p.x} cy={p.y} r={r * 0.3} fill={C.robotMid} />
  </g>
);

export const MobileBase: React.FC = () => {
  const m = ROBOT.mobile;
  const S = ROBOT.shoulder;
  return (
    <g>
      {/* mast from base cylinder down to the mobile base (passes behind the table) */}
      <rect x={S.x - 34} y={ROBOT.baseTop + 60} width={68} height={m.top - ROBOT.baseTop - 60} fill={C.slate} stroke="#33445F" strokeWidth={3} />
      <rect x={S.x - 20} y={ROBOT.baseTop + 70} width={10} height={m.top - ROBOT.baseTop - 80} fill="#2E3F5A" />
      <rect x={m.x - m.w / 2} y={m.top} width={m.w} height={m.bottom - m.top} rx={18} fill={C.slate} stroke="#33445F" strokeWidth={3} />
      <rect x={m.x - m.w / 2 + 16} y={m.top + 18} width={m.w - 32} height={10} rx={5} fill={C.cyanDim} opacity={0.7} />
      {[m.x - m.w / 2 + 44, m.x + m.w / 2 - 44].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={m.bottom} r={m.wheelR} fill="#141C2B" stroke="#33445F" strokeWidth={3} />
          <circle cx={wx} cy={m.bottom} r={m.wheelR * 0.4} fill="#2E3F5A" />
        </g>
      ))}
    </g>
  );
};

export const RobotArm: React.FC<{pose: Pose; sweep?: number; outlineOnly?: string; dash?: string}> = ({pose, sweep, outlineOnly, dash}) => {
  const j = solve(pose);
  const S = j.S;
  if (outlineOnly) {
    // registered outline of the same pose (used for "same machine")
    const st = {stroke: outlineOnly, fill: 'none', strokeWidth: 5, strokeDasharray: dash, strokeLinecap: 'round' as const};
    return (
      <g>
        <line x1={S.x} y1={S.y} x2={j.E.x} y2={j.E.y} {...st} />
        <line x1={j.E.x} y1={j.E.y} x2={j.W1.x} y2={j.W1.y} {...st} />
        <line x1={j.W1.x} y1={j.W1.y} x2={j.W2.x} y2={j.W2.y} {...st} />
        <circle cx={S.x} cy={S.y} r={50} {...st} />
        <circle cx={j.E.x} cy={j.E.y} r={42} {...st} />
        <circle cx={j.W1.x} cy={j.W1.y} r={32} {...st} />
        <g transform={`translate(${j.W2.x} ${j.W2.y}) rotate(${pose.phi - 90})`}>
          <rect x={-29} y={8} width={58} height={42} rx={8} {...st} />
          <rect x={-9} y={46} width={18} height={40} rx={5} {...st} />
        </g>
      </g>
    );
  }
  return (
    <g>
      {/* J1 base cylinder */}
      <rect x={S.x - 52} y={ROBOT.baseTop - 14} width={104} height={80} rx={14} fill={C.robotMid} stroke={C.robotInk} strokeWidth={3} />
      <rect x={S.x - 52} y={ROBOT.baseTop + 26} width={104} height={8} fill={C.cyan} opacity={0.85} />
      <Link a={S} b={j.E} w={54} />
      <Cap p={S} r={50} />
      <Link a={j.E} b={j.W1} w={44} />
      <Cap p={j.E} r={42} />
      <Link a={j.W1} b={j.W2} w={36} />
      <Cap p={j.W1} r={32} />
      <g transform={`translate(${j.W2.x} ${j.W2.y}) rotate(${pose.phi - 90})`}>
        {/* J5 seen side-on, J6 flange */}
        <rect x={-30} y={-26} width={60} height={34} rx={10} fill={C.robotMid} stroke={C.robotInk} strokeWidth={3} />
        <rect x={-30} y={-12} width={60} height={6} fill={C.cyan} opacity={0.85} />
        <rect x={-24} y={6} width={48} height={8} rx={3} fill={C.robotDark} />
        {/* gripper body */}
        <rect x={-29} y={12} width={58} height={38} rx={7} fill="#3B4A61" stroke="#232F42" strokeWidth={3} />
        <rect x={-21} y={20} width={42} height={5} rx={2} fill={C.cyanDim} />
        {/* back jaw (behind the handle) */}
        <rect x={-3} y={44} width={18} height={42} rx={5} fill="#2A364A" stroke="#1B2433" strokeWidth={2.5} />
        <g transform={`translate(0 ${ROBOT.GRIP})`}>
          <ToyKnife sweep={sweep} />
        </g>
        {/* front jaw (in front of the handle) */}
        <rect x={-13} y={44} width={18} height={42} rx={5} fill="#4A5A74" stroke="#1B2433" strokeWidth={2.5} />
        <rect x={-9} y={66} width={10} height={14} rx={3} fill="#5D6F8C" />
      </g>
    </g>
  );
};
