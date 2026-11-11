// V3 machine kit: the workstation from the paper (Lin et al., Nat Commun 16:6073, 2025, Figs 1A, 4A):
//  - the INSECT FIXATION STRUCTURE on a MOTOR-DRIVEN SLIDER: a platform on a rail; ROD A presses the anterior pronotum
//    and ROD B (a pair of side pads here) the mesothorax, which lifts the posterior pronotum and exposes the membrane; the rods retract
//    to release the insect, and the slider carries the platform out and back with the next insect;
//  - the BACKPACK HOLDER (one backpack, always placed in the same spot);
//  - the ARM (UR3e-like): turret, shoulder, upper arm, elbow, forearm, two wrist joints, flange, depth camera, and a
//    two-finger gripper (Hand-e) that holds the backpack by its GRASPING SECTION (the raised tab).
import React from 'react';
import {add3, Basis, cross3, dot3, len3, mul3, norm3, proj, sub3, V3} from '../core/three';
import {capsuleItem, cylinderItem, Item} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame, toW} from '../core/frame';
import {lit} from '../core/color';

export const ARM3 = {base: [-150, -140, 0] as V3, h0: 128, L1: 165, L2: 150, w1: 18, w2: 14, tool: 17};
export const C3 = {shell: '#A9B8C4', shellHi: '#C9D5DE', joint: '#36424D', dark: '#1B232B', grip: '#4A5662', pad: '#7FD8E0', ring: '#3FD0D8', steel: '#8E9CA8', white: '#E6ECF0'};
export type Arm3 = {tcp: V3; yaw: number; open: number; tilt?: number};
export type ArmRig3 = {shoulder: V3; elbow: V3; w1: V3; w2: V3; flange: V3; tool: Frame; axis: V3; yawT: number};

export const solveArm3 = (A: Arm3): ArmRig3 => {
  const base = ARM3.base;
  const toBase = norm3([base[0] - A.tcp[0], base[1] - A.tcp[1], 0.0001]);
  const tl = ((A.tilt ?? 14) * Math.PI) / 180;
  const axis = norm3(add3(mul3([0, 0, 1], Math.cos(tl)), mul3(toBase, Math.sin(tl))));
  const flange = add3(A.tcp, mul3(axis, ARM3.tool));
  const w2 = add3(flange, mul3(axis, ARM3.w2));
  // the first wrist sits back toward the base (the forearm meets it from the side, as on a six-axis arm)
  const w1 = add3(w2, add3(mul3(toBase, ARM3.w1 * 0.7), [0, 0, ARM3.w1 * 0.55]));
  const shoulder = add3(base, [0, 0, ARM3.h0]);
  const d = sub3(w1, shoulder);
  const hr = Math.hypot(d[0], d[1]);
  const L = Math.min(len3(d), (ARM3.L1 + ARM3.L2) * 0.999);
  const ang = Math.atan2(d[2], hr);
  const ca = (ARM3.L1 * ARM3.L1 + L * L - ARM3.L2 * ARM3.L2) / (2 * ARM3.L1 * L);
  const a1 = ang + Math.acos(Math.max(-1, Math.min(1, ca)));
  const dir: V3 = hr > 1e-6 ? [d[0] / hr, d[1] / hr, 0] : [1, 0, 0];
  const elbow = add3(shoulder, add3(mul3(dir, ARM3.L1 * Math.cos(a1)), [0, 0, ARM3.L1 * Math.sin(a1)]));
  const r = ((A.yaw + 90) * Math.PI) / 180;
  const by: V3 = [Math.cos(r), Math.sin(r), 0];
  const Tl = norm3(sub3(by, mul3(axis, dot3(by, axis))));
  const tool = frame(A.tcp, cross3(Tl, axis), axis);
  return {shoulder, elbow, w1, w2, flange, tool, axis, yawT: (Math.atan2(dir[1], dir[0]) * 180) / Math.PI};
};

/** the arm. The fingers close on the backpack's grasping tab (half width 4.6 mm, ~3 mm up) */
export const armItems3 = (B: Basis, A: Arm3, key = 'a3'): Item[] => {
  const R = solveArm3(A);
  const it: Item[] = [];
  const C = C3;
  const base = ARM3.base;
  it.push(cylinderItem(B, base, add3(base, [0, 0, 22]), 48, C.dark, {key: `${key}b0`}));
  it.push(cylinderItem(B, add3(base, [0, 0, 22]), add3(base, [0, 0, 30]), 44, C.ring, {key: `${key}b1`}));
  it.push(cylinderItem(B, add3(base, [0, 0, 30]), add3(base, [0, 0, ARM3.h0 - 20]), 31, C.shell, {key: `${key}b2`}));
  const plane = norm3([R.elbow[0] - R.shoulder[0], R.elbow[1] - R.shoulder[1], 0.0001]);
  const across: V3 = [-plane[1], plane[0], 0];
  const drum = (c: V3, half: number, r: number, k: string) => {
    it.push(cylinderItem(B, add3(c, mul3(across, -half)), add3(c, mul3(across, half)), r, C.joint, {key: `${key}${k}`}));
    it.push(cylinderItem(B, add3(c, mul3(across, half)), add3(c, mul3(across, half + 1.4)), r * 0.86, C.ring, {key: `${key}${k}r`}));
  };
  drum(R.shoulder, 25, 25, 'sj');
  it.push(capsuleItem(B, R.shoulder, R.elbow, 19, 15, C.shell, {key: `${key}ua`, spec: 0.7}));
  drum(R.elbow, 19, 18, 'ej');
  it.push(capsuleItem(B, R.elbow, R.w1, 13, 10, C.shell, {key: `${key}fa`, spec: 0.7}));
  drum(R.w1, 12, 11, 'w1');
  it.push(capsuleItem(B, R.w1, R.w2, 9.5, 9.5, C.shell, {key: `${key}wl`, spec: 0.6}));
  // second wrist joint: a drum across the first
  const ax2 = norm3(cross3(R.axis, across));
  it.push(cylinderItem(B, add3(R.w2, mul3(ax2, -10)), add3(R.w2, mul3(ax2, 10)), 9.5, C.joint, {key: `${key}w2`}));
  it.push(cylinderItem(B, R.w2, R.flange, 8.2, C.shellHi, {key: `${key}w3`}));
  it.push(cylinderItem(B, R.flange, add3(R.flange, mul3(R.axis, 2.6)), 10.5, C.dark, {key: `${key}fl`}));
  // gripper body, rails and fingers (tool frame: x fwd, y across the board, z up the tool axis)
  const T = R.tool;
  const at = (p: V3) => toW(T, p);
  it.push(obbItem(B, {...T, o: at([0, 0, ARM3.tool - 3.6])}, [4.6, 11.5, 3.4], C.grip, {key: `${key}gb`}));
  it.push(obbItem(B, {...T, o: at([0, 0, ARM3.tool - 7.6])}, [1.2, 10.8, 0.6], C.steel, {key: `${key}rail`}));
  [1, -1].forEach((s) => {
    const y = (4.6 + 0.8 + A.open) * s;
    it.push(obbItem(B, {...T, o: at([0, y, 8.2])}, [2.4, 0.8, 4.4], C.grip, {key: `${key}gf${s}`}));
    it.push(obbItem(B, {...T, o: at([0, y + 0.9 * s, 12.2])}, [2.6, 1.4, 1.4], C.joint, {key: `${key}gc${s}`}));
    it.push(obbItem(B, {...T, o: at([0, y - 0.5 * s, 3.6])}, [2.0, 0.35, 1.3], C.pad, {key: `${key}gp${s}`}));
  });
  // wrist depth camera: a dark bar with two lenses, looking down
  it.push(obbItem(B, {...T, o: at([-12, 0, ARM3.tool + 4])}, [3.2, 9, 2.4], C.dark, {key: `${key}cam`}));
  [-4.5, 4.5].forEach((y, i) => {
    const p = proj(B, at([-12, y, ARM3.tool + 1.4]));
    it.push({z: p.z - 0.5, el: <circle key={`${key}cl${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(1.3 * p.s).toFixed(1)} fill="#2E6C8A" stroke="#0B1218" strokeWidth={Math.max(0.6, 0.3 * p.s).toFixed(1)} />});
  });
  return it;
};

// ------------------------------------------------------------------ the fixation structure on its slider
export const SLIDE_OUT = -300;
/** the platform at slider position x; rods: 0 pressing .. 1 retracted (lifted) */
export const stageItems = (B: Basis, x: number, rods: number, key = 'st'): {flat: React.ReactNode[]; items: Item[]} => {
  const items: Item[] = [];
  const W = (p: V3): V3 => add3([x, 0, 0], p);
  // rail (long, fixed) is drawn by the caller; the platform rides on it
  items.push(obbItem(B, frame(W([0, -8, 1.6]), [1, 0, 0], [0, 0, 1]), [30, 50, 1.6], C3.white, {key: `${key}pl`, top: lit(C3.white, 0.15)}));
  // low side-mounted rods (no overhead gantry, so the arm and the camera keep a clear view of the thorax):
  // rod A comes in from the right and presses the anterior pronotum (insect faces +y: pronotum front at y ~ +22)
  const lift = 7 * rods;
  const zA = 9.8 + lift;
  items.push(cylinderItem(B, W([25, 25, 0]), W([25, 25, zA + 2.5]), 2.2, C3.steel, {key: `${key}pa`}));
  items.push(cylinderItem(B, W([25, 25, zA + 2]), W([4, 23, zA + 2]), 1.1, C3.steel, {key: `${key}aa`}));
  items.push(cylinderItem(B, W([4, 23, zA + 2]), W([0, 22, zA]), 1.0, C3.steel, {key: `${key}ra`}));
  items.push(cylinderItem(B, W([0, 22, zA]), W([0, 22, zA + 0.9]), 1.8, C3.ring, {key: `${key}rat`}));
  // rod B: a pair of pads pressing the mesothorax from both sides (body x ~ +3)
  [-1, 1].forEach((s) => {
    const zB = 8.4 + lift * 0.8;
    items.push(cylinderItem(B, W([23 * s, 3, 0]), W([23 * s, 3, zB + 1.6]), 2.0, C3.steel, {key: `${key}pb${s}`}));
    items.push(cylinderItem(B, W([23 * s, 3, zB]), W([(11.5 + 6 * rods) * s, 3, zB]), 1.0, C3.steel, {key: `${key}rb${s}`}));
    items.push(cylinderItem(B, W([(11.5 + 6 * rods) * s, 3, zB]), W([(10.6 + 6 * rods) * s, 3, zB]), 1.7, C3.ring, {key: `${key}rbt${s}`}));
  });
  return {flat: [], items};
};

/** the backpack holder: a small pedestal with a seat for one backpack */
export const HOLDER: V3 = [-72, -64, 0];
export const holderItems = (B: Basis): Item[] => [
  cylinderItem(B, HOLDER, add3(HOLDER, [0, 0, 7]), 12, C3.joint, {key: 'hd0'}),
  obbItem(B, frame(add3(HOLDER, [0, 0, 7.6]), [0, 1, 0], [0, 0, 1]), [8.5, 9.5, 0.6], C3.steel, {key: 'hd1', top: lit(C3.steel, 0.3)}),
];
export const HOLD_SEAT: V3 = add3(HOLDER, [0, 0, 8.2]);
