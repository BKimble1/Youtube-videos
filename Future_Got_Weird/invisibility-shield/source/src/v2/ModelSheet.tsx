// Model sheet (dev still): the V2 protagonist and the guard from several camera angles, standing and in action poses,
// drawn by the same rigs the film uses. Used to keep both characters consistent and to check anatomy.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../fonts';
import {basis, v3, V3} from './p3';
import {DIM_G, DIM_W, LOOK_G, LOOK_W, Person, Pose} from './Person';
import {EXP0, HeadExpr} from './Head3';
import {HAND_RELAXED} from '../art/Hand';

const base = (pos: V3, yaw: number, e: HeadExpr = EXP0): Pose => ({pos, yaw, crouch: 0, lean: 0, side: 0, twist: 0, bob: 0, headYaw: 0, headPitch: 0, headRoll: 0, walk: 0, walkAmt: 0, R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, expr: e, blink: 0, sway: 0});

export const ModelSheet: React.FC<{row: number}> = ({row}) => {
  const yaws = [Math.PI, Math.PI * 0.78, Math.PI * 0.5, 0];
  const cells: React.ReactNode[] = [];
  yaws.forEach((yaw, i) => {
    const x = -1.05 + i * 0.7;
    const crouch = row === 1 ? 0.95 : 0;
    const pz = {...base(v3(x, 0, 0), yaw), crouch};
    const pg = {...base(v3(x, 0, 0), yaw), flashlight: true, R: {hand: {curl: [0.8, 0.85, 0.85, 0.9], spread: 0.1, thumb: 30, thumbCurl: 0.6} as any, W: v3(x + 0.3 * Math.cos(yaw), 1.2, 0.45 * Math.cos(yaw) - 0.3 * Math.sin(yaw))}};
    cells.push(<g key={i}>{row === 2 ? <Person id={`g${i}`} b={B} pz={pg} look={LOOK_G} /> : <Person id={`w${i}`} b={B} pz={pz} look={LOOK_W} />}</g>);
  });
  return (
    <AbsoluteFill style={{background: '#203040'}}>
      <svg width={1080} height={1920}>{cells}</svg>
    </AbsoluteFill>
  );
};
const B = basis({pos: v3(0, 1.0, -7.5), tgt: v3(0, 0.85, 0), f: 2300});
void DIM_G; void DIM_W;
