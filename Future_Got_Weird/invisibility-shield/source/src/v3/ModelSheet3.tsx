// V3 model sheet (dev still): one character, five poses (rows) x four views (front, three-quarter, side, rear).
// Rows - woman: stand, run (mid-stride), crouch holding the shield grips, reach round an edge, turn (mid-pivot);
//        guard: stand with torch, walk, lean in with torch, reach with the left hand, cuffs out (open).
// Every cell is the same rig evaluated from the same long-lens camera, so proportions can be compared directly.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HAND_RELAXED} from '../art/Hand';
import {a3, basis, m3, n3, v3, V3, fwdOf} from '../v2/p3';
import {EXP0} from '../v2/Head3';
import {footState, Plant} from './gait';
import {DIM_G3, DIM_W3, Dims3, joints3, LOOK_G3, LOOK_W3, Person3, Pose3} from './Person3';
import {GRIP, OPEN} from './hands';

const pl = (p: V3, yaw: number): Plant => ({t0: -Infinity, t1: -Infinity, p, yaw});
const rotXZ = (p: V3, yaw: number) => v3(p.x * Math.cos(yaw) + p.z * Math.sin(yaw), p.y, -p.x * Math.sin(yaw) + p.z * Math.cos(yaw));
/** feet: local offsets (x right, z forward) of planted feet, or a swing between two plants at progress s */
const feetOf = (D: Dims3, yaw: number, l: V3, r: V3, swing?: {foot: 'l' | 'r'; from: V3; to: V3; s: number; h: number}, pitchL = 0) => {
  const fd = D.foot;
  const mk = (p: V3, k: 'l' | 'r') => {
    if (swing && swing.foot === k) {
      const tr: Plant[] = [pl(rotXZ(swing.from, yaw), yaw), {t0: 0, t1: 1, p: rotXZ(swing.to, yaw), yaw, h: swing.h}];
      return footState(tr, swing.s, fd);
    }
    const st = footState([pl(rotXZ(p, yaw), yaw)], 0, fd);
    if (k === 'l' && pitchL) {
      // heel raised about the ball (pivoting foot)
      const tr: Plant[] = [pl(rotXZ(p, yaw), yaw), {t0: 1.0, t1: 1.5, p: rotXZ(p, yaw), yaw}];
      return footState(tr, 1.0 - 0.12 * (1 - pitchL), fd);
    }
    return st;
  };
  return {l: mk(l, 'l'), r: mk(r, 'r')};
};
const base = (yaw: number): Omit<Pose3, 'feet'> => ({
  pos: v3(0, 0, 0), yaw, crouch: 0, lean: 0.02, side: 0, twist: 0, bob: 0, shrug: 0, headYaw: yaw, headPitch: 0.04, headRoll: 0,
  R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, carriage: 0, expr: EXP0, blink: 0, sway: 0,
});
const W = (yaw: number, x: number, y: number, z: number) => rotXZ(v3(x, y, z), yaw);

const womanPose = (row: number, yaw: number): Pose3 => {
  const D = DIM_W3;
  const b = base(yaw);
  switch (row) {
    case 0: return {...b, feet: feetOf(D, yaw, v3(-0.11, 0, 0.0), v3(0.11, 0, 0.02))};
    case 1: return {...b, lean: 0.22, carriage: 1, bob: 0.02, headPitch: -0.05,
      feet: feetOf(D, yaw, v3(-0.09, 0, -0.32), v3(0.09, 0, 0.3), {foot: 'l', from: v3(-0.09, 0, -0.55), to: v3(-0.09, 0, 0.85), s: 0.32, h: 0.2})};
    case 2: {
      const pz = {...b, crouch: 1, lean: 0.12, headPitch: -0.2, feet: feetOf(D, yaw, v3(-0.17, 0, 0.02), v3(0.17, 0, 0.16))};
      const j = joints3(pz as Pose3, D);
      const gl = a3(j.P, a3(W(yaw, -0.2, 0.0, 0), m3(fwdOf(yaw), 0.42)));
      const gr = a3(j.P, a3(W(yaw, 0.2, 0.0, 0), m3(fwdOf(yaw), 0.42)));
      return {...pz, L: {W: v3(gl.x, 0.62, gl.z), hand: GRIP}, R: {W: v3(gr.x, 0.62, gr.z), hand: GRIP}};
    }
    case 3: {
      const pz = {...b, crouch: 1, lean: 0.16, side: 0.08, twist: -0.25, headPitch: -0.1, headYaw: yaw + 0.25, feet: feetOf(D, yaw, v3(-0.17, 0, 0.02), v3(0.17, 0, 0.16))};
      const j = joints3(pz as Pose3, D);
      const gl = a3(j.P, a3(W(yaw, -0.2, 0, 0), m3(fwdOf(yaw), 0.42)));
      return {...pz, L: {W: v3(gl.x, 0.62, gl.z), hand: GRIP}, R: {W: a3(j.P, W(yaw, 0.48, 0.12, 0.5)), hand: OPEN, dir: n3(W(yaw, 0.05, 1, 0.15)), palm: n3(W(yaw, 0, 0, 1))}};
    }
    default: return {...b, twist: 0.5, headYaw: yaw + 1.1, lean: 0.1, side: -0.05,
      feet: feetOf(D, yaw, v3(-0.13, 0, -0.08), v3(0.14, 0, 0.12), undefined, 1), R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}};
  }
};
const guardPose = (row: number, yaw: number): Pose3 => {
  const D = DIM_G3;
  const b = base(yaw);
  const torchAt = (j: ReturnType<typeof joints3>, aim: V3) => ({W: a3(a3(j.sh.r, m3(j.Fs, 0.38)), v3(0, -0.16, 0)), hand: GRIP, dir: aim});
  switch (row) {
    case 0: {
      const pz = {...b, feet: feetOf(D, yaw, v3(-0.12, 0, 0), v3(0.12, 0, 0.03)), torch: true};
      const j = joints3(pz as Pose3, D);
      return {...pz, R: torchAt(j, n3(a3(fwdOf(yaw), v3(0, -0.2, 0))))};
    }
    case 1: {
      const pz = {...b, lean: 0.06, feet: feetOf(D, yaw, v3(-0.11, 0, -0.18), v3(0.11, 0, 0.2), {foot: 'l', from: v3(-0.11, 0, -0.38), to: v3(-0.11, 0, 0.42), s: 0.5, h: 0.08}), torch: true};
      const j = joints3(pz as Pose3, D);
      return {...pz, R: torchAt(j, n3(a3(fwdOf(yaw), v3(0, -0.25, 0))))};
    }
    case 2: {
      const pz = {...b, lean: 0.42, headPitch: 0.05, feet: feetOf(D, yaw, v3(-0.13, 0, -0.08), v3(0.13, 0, 0.18)), torch: true, expr: {...EXP0, squint: 0.7, browDown: 0.9}};
      const j = joints3(pz as Pose3, D);
      return {...pz, R: torchAt(j, n3(a3(fwdOf(yaw), v3(0, -0.4, 0))))};
    }
    case 3: {
      const pz = {...b, lean: 0.12, shrug: 0.03, feet: feetOf(D, yaw, v3(-0.13, 0, 0.12), v3(0.13, 0, -0.1)), torch: true, expr: {...EXP0, wide: 1, browIn: 0.5}};
      const j = joints3(pz as Pose3, D);
      return {...pz, R: torchAt(j, n3(a3(fwdOf(yaw), v3(0, -0.5, 0)))), L: {W: a3(j.sh.l, W(yaw, -0.08, -0.12, 0.5)), hand: OPEN, dir: n3(W(yaw, 0, 0.6, 1)), palm: n3(W(yaw, 0, 0, 1))}};
    }
    default: {
      const pz = {...b, feet: feetOf(D, yaw, v3(-0.13, 0, 0.05), v3(0.13, 0, -0.04)), torch: true, cuffs: {where: 'hand' as const, open: 1, swing: 0.3}};
      const j = joints3(pz as Pose3, D);
      return {...pz, R: torchAt(j, n3(a3(fwdOf(yaw), v3(0, -0.3, 0)))), L: {W: a3(j.sh.l, W(yaw, 0.05, -0.2, 0.42)), hand: GRIP, dir: n3(W(yaw, 0.3, 0.2, 1)), palm: n3(W(yaw, 1, 0, 0))}};
    }
  }
};

export const ModelSheet3: React.FC<{who: 'w' | 'g'; head?: boolean}> = ({who, head}) => {
  if (head) {
    // head close-ups: 8 headings x 2 rows (neutral, expressive), standing pose
    const hy = who === 'w' ? 1.5 : 1.68;
    const camH = basis({pos: v3(0, hy, 9), tgt: v3(0, hy, 0), f: 9000});
    const look = who === 'w' ? LOOK_W3 : LOOK_G3;
    const cells: React.ReactNode[] = [];
    const yaws = [0, 0.5, 1.0, Math.PI / 2, 2.1, Math.PI, -0.9, -Math.PI / 2];
    yaws.forEach((y, i) => [0, 1].forEach((r) => {
      const pz = who === 'w' ? womanPose(0, y) : guardPose(0, y);
      const e = r ? {...pz.expr, smirk: 0.8, smile: 0.45, browAsym: 0.7, wide: 0.3} : pz.expr;
      const cx = 270 + (i % 2) * 540, cy = 240 + Math.floor(i / 2) * 480 + r * 0;
      if (r) return;
      cells.push(<g key={i} transform={`translate(${cx - 540} ${cy - 960})`}><Person3 id={`hs${i}`} b={camH} pz={{...pz, expr: e}} look={look} shadow={false} /></g>);
    }));
    return (
      <AbsoluteFill style={{backgroundColor: '#1F2E3D'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">{cells}</svg>
      </AbsoluteFill>
    );
  }
  const cam = basis({pos: v3(0, 0.95, 9), tgt: v3(0, 0.82, 0), f: 1580});
  const views = [0, 0.75, Math.PI / 2, Math.PI];
  const look = who === 'w' ? LOOK_W3 : LOOK_G3;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
    const pz = who === 'w' ? womanPose(r, views[c]) : guardPose(r, views[c]);
    const cx = 135 + c * 270, cy = 192 + r * 384;
    cells.push(
      <g key={`${r}-${c}`} transform={`translate(${cx - 540} ${cy - 960})`}>
        <Person3 id={`ms${r}${c}`} b={cam} pz={pz} look={look} />
      </g>,
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#1F2E3D'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {[1, 2, 3, 4].map((r) => <line key={r} x1={0} x2={1080} y1={r * 384} y2={r * 384} stroke="#2E4458" strokeWidth={2} />)}
        {cells}
      </svg>
    </AbsoluteFill>
  );
};
