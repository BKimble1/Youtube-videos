// V2 arm (from kit/arm.tsx): the paper's cell used a Universal Robots UR3e with a Robotiq Hand-e gripper and a RealSense
// D435 depth camera on the wrist, gripper and camera pointing straight down. Drawn white with dark joint housings and
// a thin teal ring (orange is reserved for stimulation). The depth camera is a dark bar beside the flange.
// The assembly arm: a compact six-axis-style lab arm reduced to what reads on screen (base and turret, shoulder,
// upper arm, elbow, forearm, the wrist, the flange and a two-finger parallel gripper). It is posed by IK from
// its tool point (the middle of the gripper's fingertips, which is where a held backpack's frame sits) and a tool yaw,
// so every move is mechanically coherent: the turret yaws toward the target, shoulder and elbow solve the reach, and the
// tool leans a fixed angle toward the base (the wrist rises away from the work) while the held board stays level.
import React from 'react';
import {add3, Basis, cross3, dot3, len3, mul3, norm3, proj, sub3, V3} from '../core/three';
import {obbItem} from '../core/obb';
import {capsuleItem, cylinderItem, Item} from '../core/draw3';
import {frame, Frame, toW} from '../core/frame';

export const ARM2 = {base: [-150, -140, 0] as V3, h0: 128, L1: 165, L2: 150, wrist: 30, tool: 15};
const ARM = ARM2;
export const ARM_COL2 = {shell: '#9FB0BD', joint: '#3A4651', dark: '#1C242C', grip: '#4A5662', pad: '#7FD8E0', ring: '#3FD0D8'};
const ARM_COL = ARM_COL2;

export type ArmState2 = {tcp: V3; yaw: number; open: number; tilt?: number}; // open: finger gap beyond the board edge (mm); tilt: tool axis leaned toward the base (deg)

export type ArmRig2 = {shoulder: V3; elbow: V3; wristTop: V3; flange: V3; tool: Frame; axis: V3; ok: boolean};
export const solveArm2 = (A: ArmState2): ArmRig2 => {
  const base = ARM.base;
  // the tool axis leans from vertical toward the base, so the wrist rises away from the work (and from the camera)
  const toBase = norm3([base[0] - A.tcp[0], base[1] - A.tcp[1], 0.0001]);
  const tl = ((A.tilt ?? 16) * Math.PI) / 180;
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
export const armItems2 = (B: Basis, A: ArmState2, key = 'arm', boardHalfY = 7.4): Item[] => {
  const R = solveArm2(A);
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
  [R.elbow, R.wristTop].forEach((j, i) => it.push(cylinderItem(B, add3(j, mul3(across, i ? 13.2 : 19.2)), add3(j, mul3(across, i ? 14.4 : 20.6)), i ? 12.4 : 17.4, C.ring, {key: `${key}rg${i}`})));
  // gripper body and fingers (in the tool frame)
  const T = R.tool;
  const at = (p: V3) => toW(T, p);
  it.push(obbItem(B, {...T, o: at([0, 0, ARM.tool - 2.5])}, [3.4, boardHalfY + 3.2, 2.2], C.grip, {key: `${key}gb`}));
  [1, -1].forEach((s) => {
    const y = (boardHalfY + 0.9 + A.open) * s;
    it.push(obbItem(B, {...T, o: at([0, y, ARM.tool / 2 - 1.0])}, [2.6, 0.75, ARM.tool / 2], C.grip, {key: `${key}gf${s}`}));
    it.push(obbItem(B, {...T, o: at([0, y - 0.55 * s, 0.9])}, [2.3, 0.4, 1.0], C.pad, {key: `${key}gp${s}`}));
  });
  // the wrist depth camera: a dark bar on the flange, two lenses looking down
  it.push(obbItem(B, {...T, o: at([-11, 0, ARM.tool + 4])}, [3.2, 9, 2.4], C.dark, {key: `${key}cam`}));
  [-4.5, 4.5].forEach((y, i) => {
    const p = proj(B, at([-11, y, ARM.tool + 1.4]));
    it.push({z: p.z - 0.5, el: <circle key={`${key}cl${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(1.3 * p.s).toFixed(1)} fill="#2E6C8A" stroke="#0B1218" strokeWidth={Math.max(0.6, 0.3 * p.s).toFixed(1)} />});
  });
  return it;
};
