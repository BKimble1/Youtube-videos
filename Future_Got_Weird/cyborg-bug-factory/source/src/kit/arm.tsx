// The assembly arm: a compact six-axis-style lab arm reduced to what reads on screen (base and turret, shoulder,
// upper arm, elbow, forearm, the wrist, the flange and a two-finger parallel gripper). It is posed by IK from
// its tool point (the middle of the gripper's fingertips, which is where a held backpack's frame sits) and a tool yaw,
// so every move is mechanically coherent: the turret yaws toward the target, shoulder and elbow solve the reach, and the
// tool leans a fixed angle toward the base (the wrist rises away from the work) while the held board stays level.
import React from 'react';
import {add3, Basis, cross3, dot3, len3, mul3, norm3, sub3, V3} from '../core/three';
import {obbItem} from '../core/obb';
import {capsuleItem, cylinderItem, Item} from '../core/draw3';
import {frame, Frame, toW} from '../core/frame';

export const ARM = {base: [-150, -140, 0] as V3, h0: 128, L1: 165, L2: 150, wrist: 30, tool: 15};
export const ARM_COL = {shell: '#E9EEF2', joint: '#F08A24', dark: '#2A3440', grip: '#56626F', pad: '#F6B25A'};

export type ArmState = {tcp: V3; yaw: number; open: number; tilt?: number}; // open: finger gap beyond the board edge (mm); tilt: tool axis leaned toward the base (deg)

export type ArmRig = {shoulder: V3; elbow: V3; wristTop: V3; flange: V3; tool: Frame; axis: V3; ok: boolean};
export const solveArm = (A: ArmState): ArmRig => {
  const base = ARM.base;
  // the tool axis leans from vertical toward the base, so the wrist rises away from the work (and from the camera)
  const toBase = norm3([base[0] - A.tcp[0], base[1] - A.tcp[1], 0.0001]);
  const tl = ((A.tilt ?? 48) * Math.PI) / 180;
  const axis = norm3(add3(mul3([0, 0, 1], Math.cos(tl)), mul3(toBase, Math.sin(tl))));
  const wristTop = add3(A.tcp, mul3(axis, ARM.tool + ARM.wrist));
  const shoulder = add3(base, [0, 0, ARM.h0]);
  const d = sub3(wristTop, shoulder);
  const hr = Math.hypot(d[0], d[1]);
  const L = Math.min(len3(d), (ARM.L1 + ARM.L2) * 0.999);
  const ang = Math.atan2(d[2], hr);
  const ca = (ARM.L1 * ARM.L1 + L * L - ARM.L2 * ARM.L2) / (2 * ARM.L1 * L);
  const a1 = ang + Math.acos(Math.max(-1, Math.min(1, ca))); // elbow up
  const dir: V3 = hr > 1e-6 ? [d[0] / hr, d[1] / hr, 0] : [1, 0, 0];
  const elbow = add3(shoulder, add3(mul3(dir, ARM.L1 * Math.cos(a1)), [0, 0, ARM.L1 * Math.sin(a1)]));
  const flange = add3(A.tcp, mul3(axis, ARM.tool));
  // gripper frame: up = tool axis, left = the board's width direction (the fingers close across it)
  const r = ((A.yaw + 90) * Math.PI) / 180;
  const by: V3 = [Math.cos(r), Math.sin(r), 0];
  const Tl = norm3(sub3(by, mul3(axis, dot3(by, axis))));
  const tool = frame(A.tcp, cross3(Tl, axis), axis);
  return {shoulder, elbow, wristTop, flange, tool, axis, ok: len3(d) <= ARM.L1 + ARM.L2};
};

/** all arm items; the gripper fingers pinch the board's sides (y = +-(hy + open)) */
export const armItems = (B: Basis, A: ArmState, key = 'arm', boardHalfY = 7.4): Item[] => {
  const R = solveArm(A);
  const it: Item[] = [];
  const C = ARM_COL;
  const base = ARM.base;
  it.push(cylinderItem(B, base, add3(base, [0, 0, 26]), 46, C.dark, {key: `${key}b0`}));
  it.push(cylinderItem(B, add3(base, [0, 0, 26]), add3(base, [0, 0, ARM.h0 - 18]), 30, C.shell, {key: `${key}b1`}));
  // shoulder joint: a drum across the arm plane
  const plane = norm3([R.elbow[0] - R.shoulder[0], R.elbow[1] - R.shoulder[1], 0.0001]);
  const across: V3 = [-plane[1], plane[0], 0];
  it.push(cylinderItem(B, add3(R.shoulder, mul3(across, -24)), add3(R.shoulder, mul3(across, 24)), 24, C.joint, {key: `${key}sj`}));
  it.push(capsuleItem(B, R.shoulder, R.elbow, 19, 15, C.shell, {key: `${key}ua`, spec: 0.7}));
  it.push(cylinderItem(B, add3(R.elbow, mul3(across, -19)), add3(R.elbow, mul3(across, 19)), 17, C.joint, {key: `${key}ej`}));
  it.push(capsuleItem(B, R.elbow, R.wristTop, 14, 11, C.shell, {key: `${key}fa`, spec: 0.7}));
  it.push(cylinderItem(B, add3(R.wristTop, mul3(across, -13)), add3(R.wristTop, mul3(across, 13)), 12, C.joint, {key: `${key}wj`}));
  it.push(cylinderItem(B, R.wristTop, R.flange, 9, C.shell, {key: `${key}wl`}));
  it.push(cylinderItem(B, R.flange, add3(R.flange, mul3(R.axis, 3)), 11, C.dark, {key: `${key}fl`}));
  // gripper body and fingers (in the tool frame)
  const T = R.tool;
  const at = (p: V3) => toW(T, p);
  it.push(obbItem(B, {...T, o: at([0, 0, ARM.tool - 2.5])}, [3.4, boardHalfY + 3.2, 2.2], C.grip, {key: `${key}gb`}));
  [1, -1].forEach((s) => {
    const y = (boardHalfY + 0.9 + A.open) * s;
    it.push(obbItem(B, {...T, o: at([0, y, ARM.tool / 2 - 1.0])}, [2.6, 0.75, ARM.tool / 2], C.grip, {key: `${key}gf${s}`}));
    it.push(obbItem(B, {...T, o: at([0, y - 0.55 * s, 0.9])}, [2.3, 0.4, 1.0], C.pad, {key: `${key}gp${s}`}));
  });
  return it;
};
