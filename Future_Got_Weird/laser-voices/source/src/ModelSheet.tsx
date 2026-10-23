// Model sheet (dev still): the recipient and the bystander from four angles, drawn by the film's rigs. Used to check
// proportions (head size, torso length, shoulders), faces, hands and the recipient's exposed left ear.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import './fonts';
import {basis, v3, V3} from './p3';
import {LOOK_B, LOOK_R, Person, Pose} from './Person';
import {EXP0, HeadExpr} from './Head3';
import {HAND_RELAXED} from './art/Hand';

export const base = (pos: V3, yaw: number, e: HeadExpr = EXP0): Pose => ({pos, yaw, crouch: 0, lean: 0, side: 0, twist: 0, bob: 0, headYaw: 0, headPitch: 0, headRoll: 0, walk: 0, walkAmt: 0, R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, expr: e, blink: 0, sway: 0});

export const ModelSheet: React.FC<{row: number}> = ({row}) => {
  if (row === 3) {
    // the recipient's exposed left ear: from her left side (the transmitter's side) and from the front-left
    const cams = [basis({pos: v3(-0.6, 1.47, 0.05), tgt: v3(0, 1.45, 0.0), f: 2600}), basis({pos: v3(-0.45, 1.5, 0.45), tgt: v3(0, 1.44, 0), f: 2600})];
    return (
      <AbsoluteFill style={{background: '#E8DFD0'}}>
        <svg width={1080} height={1920}>
          <g transform="translate(0,-480)"><Person id="a" b={cams[0]} pz={base(v3(0, 0, 0), 0)} look={LOOK_R} /></g>
          <g transform="translate(0,480)"><Person id="b" b={cams[1]} pz={base(v3(0, 0, 0), 0)} look={LOOK_R} /></g>
        </svg>
      </AbsoluteFill>
    );
  }
  const yaws = [Math.PI, Math.PI * 0.75, Math.PI * 0.5, Math.PI * 0.25 + Math.PI, 0];
  const B = basis({pos: v3(0, row === 2 ? 1.5 : 1.0, -6.5), tgt: v3(0, row === 2 ? 1.5 : 0.9, 0), f: row === 2 ? 7000 : 2600});
  const cells = yaws.map((yaw, i) => {
    const x = row === 2 ? -0.62 + i * 0.31 : -1.12 + i * 0.56;
    const look = row === 1 ? LOOK_B : LOOK_R;
    return <Person key={i} id={`p${i}`} b={B} pz={base(v3(x, 0, 0), yaw)} look={look} />;
  });
  return (
    <AbsoluteFill style={{background: '#E8DFD0'}}>
      <svg width={1080} height={1920}>{cells}</svg>
    </AbsoluteFill>
  );
};
