// V5 machine kit. Same arm, colours and style as V3; repaired geometry:
//  - the gripper's fingers and pads are returned separately (so a held module and the fingers that hold it are depth
//    sorted together), and the tool frame is the held module's parent frame;
//  - the fixation rods are rebuilt so nothing passes through a leg: each rod is a post on the platform OUTSIDE the leg
//    envelope, an overhead arm, and a vertical pin whose tip rests on the body surface (rod A on the anterior pronotum,
//    rod B on the thorax's dorsal edge, clear of the legs, the gripper and the backpack's branches). On release the pins
//    lift and retract along their arms, out of the walking path;
//  - the platform is a little wider (72 mm) so the posts stand clear of the legs;
//  - the backpack holder is a two-seat cradle: each module rests on two rails, with clearance below for its electrodes
//    and mounting branches (V3's parked module hung its electrodes through the holder).
import React from 'react';
import {add3, Basis, cross3, mul3, norm3, proj, sub3, V3} from '../core/three';
import {capsuleItem, cylinderItem, Item} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame, toW} from '../core/frame';
import {lit} from '../core/color';
import {ARM3, C3, solveArm3, Arm3} from '../v3/machine3';

export {ARM3, C3, solveArm3};
export type {Arm3};

/** the arm, split: structure items, and the gripper's fingers + pads (which interleave with a held module) */
export const armItems5 = (B: Basis, A: Arm3, key = 'a5'): {arm: Item[]; grip: Item[]; tool: Frame} => {
  const R = solveArm3(A);
  const it: Item[] = [];
  const grip: Item[] = [];
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
  const ax2 = norm3(cross3(R.axis, across));
  it.push(cylinderItem(B, add3(R.w2, mul3(ax2, -10)), add3(R.w2, mul3(ax2, 10)), 9.5, C.joint, {key: `${key}w2`}));
  it.push(cylinderItem(B, R.w2, R.flange, 8.2, C.shellHi, {key: `${key}w3`}));
  it.push(cylinderItem(B, R.flange, add3(R.flange, mul3(R.axis, 2.6)), 10.5, C.dark, {key: `${key}fl`}));
  const T = R.tool;
  const at = (p: V3) => toW(T, p);
  it.push(obbItem(B, {...T, o: at([0, 0, ARM3.tool - 3.6])}, [4.6, 11.5, 3.4], C.grip, {key: `${key}gb`}));
  it.push(obbItem(B, {...T, o: at([0, 0, ARM3.tool - 7.6])}, [1.2, 10.8, 0.6], C.steel, {key: `${key}rail`}));
  [1, -1].forEach((s) => {
    const y = (4.6 + 0.8 + A.open) * s;
    grip.push(obbItem(B, {...T, o: at([0, y, 8.2])}, [2.4, 0.8, 4.4], C.grip, {key: `${key}gf${s}`}));
    grip.push(obbItem(B, {...T, o: at([0, y + 0.9 * s, 12.2])}, [2.6, 1.4, 1.4], C.joint, {key: `${key}gc${s}`}));
    // pads: their inner faces exactly at the fingers' inner faces (they touch the tab, not enter it)
    grip.push(obbItem(B, {...T, o: at([0, y - 0.45 * s, 3.6])}, [2.0, 0.35, 1.3], C.pad, {key: `${key}gp${s}`}));
  });
  it.push(obbItem(B, {...T, o: at([-12, 0, ARM3.tool + 4])}, [3.2, 9, 2.4], C.dark, {key: `${key}cam`}));
  [-4.5, 4.5].forEach((y, i) => {
    const p = proj(B, at([-12, y, ARM3.tool + 1.4]));
    it.push({z: p.z - 0.5, el: <circle key={`${key}cl${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(1.3 * p.s).toFixed(1)} fill="#2E6C8A" stroke="#0B1218" strokeWidth={Math.max(0.6, 0.3 * p.s).toFixed(1)} />});
  });
  return {arm: it, grip, tool: T};
};

// ------------------------------------------------------------------ the fixation structure on its slider
// the slider carries the platform out toward +x: the -x side holds the backpack holder (V3/V4 slid the platform
// through the holder's base)
export const SLIDE_OUT = 300;
export const PLAT5 = {cx: 0, cy: -8, hx: 36, hy: 50, h: 3.2};
/** rod geometry at the station (world, platform at x = 0), with release progress r (0 pressing .. 1 lifted and retracted) */
export type RodDef = {post: [number, number]; tip: [number, number]; tipZ: number; armZ: number; retract: number};
export const RODS5 = (tipZA: number, tipZB: number): RodDef[] => [
  // rod A: presses the anterior pronotum on the midline (insect faces +y)
  {post: [-33, 32], tip: [0, 22], tipZ: tipZA, armZ: 24, retract: 20},
  // rod B: presses the thorax's dorsal edge on the insect's left (clear of the legs, the gripper, the branches)
  {post: [-33, -38], tip: [-13.6, -3.2], tipZ: tipZB, armZ: 24, retract: 12},
];
export const rodGeom = (d: RodDef, x: number, r: number) => {
  const post: V3 = [d.post[0] + x, d.post[1], 0];
  const dir = norm3([d.post[0] - d.tip[0], d.post[1] - d.tip[1], 0]);
  // lift first, then retract along the arm (and on the way back: extend, then lower), so the tip never sweeps sideways
  // through a leg next to it
  const lift = 7 * Math.min(1, r / 0.5);
  const ret = Math.max(0, (r - 0.5) / 0.5);
  const tip: V3 = [d.tip[0] + x + dir[0] * d.retract * ret, d.tip[1] + dir[1] * d.retract * ret, d.tipZ + lift];
  const armZ = d.armZ + lift;
  const top: V3 = [tip[0], tip[1], armZ];
  const postTop: V3 = [post[0], post[1], armZ];
  return {post, postTop, top, tip, armZ, lift};
};
export const stageItems5 = (B: Basis, x: number, rods: number, defs: RodDef[], key = 'st'): Item[] => {
  const items: Item[] = [];
  items.push(obbItem(B, frame([PLAT5.cx + x, PLAT5.cy, 1.6], [1, 0, 0], [0, 0, 1]), [PLAT5.hx, PLAT5.hy, 1.6], C3.white, {key: `${key}pl`, top: lit(C3.white, 0.15)}));
  defs.forEach((d, i) => {
    const g = rodGeom(d, x, rods);
    // the post carries a sleeve the arm slides in (the vertical lift); the arm runs over the insect to the pin
    items.push(cylinderItem(B, g.post, add3(g.postTop, [0, 0, 2.5]), 2.2, C3.steel, {key: `${key}p${i}`}));
    items.push(cylinderItem(B, add3(g.postTop, [0, 0, -1.6]), add3(g.postTop, [0, 0, 1.6]), 3.0, C3.joint, {key: `${key}s${i}`}));
    items.push(cylinderItem(B, g.postTop, g.top, 1.1, C3.steel, {key: `${key}a${i}`}));
    items.push(cylinderItem(B, g.top, add3(g.tip, [0, 0, 1.2]), 0.9, C3.steel, {key: `${key}n${i}`}));
    // a rounded (rubber) tip: its lowest point (tip centre - 1.3 mm) rests on the body surface
    items.push(capsuleItem(B, g.tip, add3(g.tip, [0, 0, 1.2]), 1.3, 1.3, C3.ring, {key: `${key}t${i}`, spec: 0.5}));
  });
  return items;
};

// ------------------------------------------------------------------ the backpack holder: two seats on rails
export const HOLDER5: V3 = [-72, -64, 0];
export const SEAT_Z = 8.2;
export const HOLD_A: V3 = add3(HOLDER5, [0, -9, SEAT_Z]);
export const HOLD_B: V3 = add3(HOLDER5, [0, 9, SEAT_Z]);
export const holdF = (p: V3): Frame => frame(p, [0, 1, 0], [0, 0, 1]);
const DECK = 3.7; // the deck sits 4.5 mm below the seat: room for the electrodes (3.7) and the flared branches (3.4)
export const holderBoxes5 = (): {F: Frame; h: V3; name: string}[] => [
  {F: frame(add3(HOLDER5, [0, 0, 1.55]), [0, 1, 0], [0, 0, 1]), h: [20, 11.5, 1.55], name: 'holder base'},
  {F: frame(add3(HOLDER5, [0, 0, 3.4]), [0, 1, 0], [0, 0, 1]), h: [19, 10.5, 0.3], name: 'holder deck'},
  ...[HOLD_A, HOLD_B].flatMap((s, j) => [1, -1].map((side) => ({
    // rails under the module's plate at pack y = +/-4.5 (world x -/+4.5), pack x -3..2 (between electrodes and branches)
    F: frame([s[0] - side * 4.5, s[1] - 0.5, (DECK + SEAT_Z) / 2], [0, 1, 0], [0, 0, 1]), h: [2.5, 0.8, (SEAT_Z - DECK) / 2] as V3, name: `rail ${j ? 'B' : 'A'}${side}`,
  }))),
];
export const holderItems5 = (B: Basis): Item[] => holderBoxes5().map((b, i) => obbItem(B, b.F, b.h, i === 0 ? C3.joint : C3.steel, {key: `hd${i}`, top: i === 0 ? undefined : lit(C3.steel, 0.3)}));
void sub3;
