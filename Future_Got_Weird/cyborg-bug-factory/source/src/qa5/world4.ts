// V4 as the audit sees it (the code the V4 render was made from: v3 schedule, machine and pack; v4 cameras and rubble).
import {add3, V3} from '../core/three';
import {frame, Frame, toW} from '../core/frame';
import {DUR} from '../lib';
import {solve} from '../roach/rig';
import {armAt3, bugAt3, holderFull3, LOOP_K3, PLAT_H, prevLoopBug, rodsAt3, sledX3, ground3} from '../v3/story3';
import {HOLD_SEAT, HOLDER, solveArm3, ARM3} from '../v3/machine3';
import {camA_C3, camG3} from '../v4/labShots4';
import {D0_3, bugD} from '../v4/build4';
import {bugF, camF3, CHUNKS, F0_3, G0_3, SLABS} from '../v4/rubble4';
import {Box, Cap} from './geom';
import {World, WBug} from './world';

export const ELEC = (s: number): V3[] => [[3.4, 2.2 * s, 0.0], [5.4, 2.2 * s, -0.5], [6.9, 2.1 * s, -2.3], [7.6, 2.1 * s, -3.7]];
export const HOOKP = (s: number, hook: number): V3[] => {
  const fl = 1 - hook;
  return [[-5.4, 6.2 * s, 0.1], [-5.6, (10.8 + 1.8 * fl) * s, -1.0], [-5.7, (13.5 + 2.6 * fl) * s, -3.4 + 1.2 * fl], [-5.4, (13.0 + 3.4 * fl) * s, -5.6 + 2.2 * fl]];
};
export const packBoxes2 = (F: Frame): Box[] => [
  {F: {...F, o: toW(F, [0, 0, 0.55])}, h: [6.3, 7.3, 0.55], name: 'mount plate'},
  {F: {...F, o: toW(F, [-1.0, 0, 3.0])}, h: [1.2, 4.6, 1.9], name: 'grasping tab'},
];
export const packHanging2 = (F: Frame, hook: number): V3[] => [1, -1].flatMap((s) => [...ELEC(s), ...HOOKP(s, hook)]).map((p) => toW(F, p));

export const gripperOf = (tool: Frame, open: number) => {
  const at = (p: V3) => toW(tool, p);
  const gripBody: Box = {F: {...tool, o: at([0, 0, ARM3.tool - 3.6])}, h: [4.6, 11.5, 3.4], name: 'gripper body'};
  const fingers: Box[] = [], pads: Box[] = [];
  [1, -1].forEach((s) => {
    const y = (4.6 + 0.8 + open) * s;
    fingers.push({F: {...tool, o: at([0, y, 8.2])}, h: [2.4, 0.8, 4.4], name: `finger${s}`});
    pads.push({F: {...tool, o: at([0, y - 0.5 * s, 3.6])}, h: [2.0, 0.35, 1.3], name: `pad${s}`});
  });
  return {gripBody, fingers, pads};
};
export const armLinks = (R: ReturnType<typeof solveArm3>): Cap[] => [
  {a: R.shoulder, b: R.elbow, r: 17, name: 'upper arm'},
  {a: R.elbow, b: R.w1, r: 11.5, name: 'forearm'},
  {a: R.w1, b: R.w2, r: 9.5, name: 'wrist 1'},
  {a: R.w2, b: R.flange, r: 8.2, name: 'wrist 3'},
];
export const rodParts = (x: number, rods: number, aZ = 9.8, bZ = 8.4, bTip = 10.6): {solid: Cap[]; tips: Cap[]} => {
  const W = (p: V3): V3 => add3([x, 0, 0], p);
  const lift = 7 * rods;
  const zA = aZ + lift;
  const zB = bZ + lift * 0.8;
  const solid: Cap[] = [
    {a: W([25, 25, 0]), b: W([25, 25, zA + 2.5]), r: 2.2, name: 'rod A post'},
    {a: W([25, 25, zA + 2]), b: W([4, 23, zA + 2]), r: 1.1, name: 'rod A arm'},
    {a: W([4, 23, zA + 2]), b: W([0, 22, zA]), r: 1.0, name: 'rod A'},
  ];
  const tips: Cap[] = [{a: W([0, 22, zA]), b: W([0, 22, zA + 0.9]), r: 1.8, name: 'rod A tip'}];
  [-1, 1].forEach((s) => {
    solid.push({a: W([23 * s, 3, 0]), b: W([23 * s, 3, zB + 1.6]), r: 2.0, name: `rod B post ${s}`});
    solid.push({a: W([23 * s, 3, zB]), b: W([(bTip + 0.9 + 6 * rods) * s, 3, zB]), r: 1.0, name: `rod B arm ${s}`});
    tips.push({a: W([(bTip + 0.9 + 6 * rods) * s, 3, zB]), b: W([(bTip + 6 * rods) * s, 3, zB]), r: 1.7, name: `rod B pad ${s}`});
  });
  return {solid, tips};
};

export const world4: World = {
  name: 'V4',
  labBugs: (t) => {
    const out: WBug[] = [];
    for (let k = 0; k <= LOOP_K3; k++) {
      const b = bugAt3(k, t);
      if (b) out.push({k, st: b.st, packF: b.pack?.F ?? null, hook: b.pack?.hook ?? 0, onSled: b.onSled});
    }
    const pl = prevLoopBug(t);
    if (pl) out.push({k: -1, st: pl.st, packF: pl.pack?.F ?? null, hook: pl.pack?.hook ?? 0, onSled: pl.onSled});
    return out;
  },
  arm: (t) => {
    const {arm, held} = armAt3(t);
    const R = solveArm3(arm);
    const g = gripperOf(R.tool, arm.open);
    return {tool: R.tool, open: arm.open, held, heldF: held !== null ? frame(arm.tcp, [0, 1, 0], [0, 0, 1]) : null, links: armLinks(R), ...g};
  },
  sledX: sledX3,
  walkGround: ground3,
  platform: (t) => ({F: frame([sledX3(t), -8, 1.6], [1, 0, 0], [0, 0, 1]), h: [30, 50, 1.6], name: 'platform'}),
  rods: (t) => rodParts(sledX3(t), rodsAt3(t)),
  holderSolids: [{F: frame(add3(HOLDER, [0, 0, 7.6]), [0, 1, 0], [0, 0, 1]), h: [8.5, 9.5, 0.6], name: 'holder plate'}],
  holderCyl: {c: HOLDER, r: 12, h: 7},
  parked: (t) => (holderFull3(t) ? [frame(HOLD_SEAT, [0, 1, 0], [0, 0, 1])] : []),
  packBoxes: packBoxes2,
  packHanging: packHanging2,
  labCam: (t) => (t < D0_3 ? camA_C3(t) : t >= G0_3 ? camG3(t) : null),
  rubble: {t0: F0_3, t1: G0_3, bug: (t) => { const b = bugF(t); return {st: b.st, packF: b.pack.F}; }, solids: [
    ...SLABS.map((s, i) => ({F: s.F, h: s.h, name: `slab${i}`})),
    ...CHUNKS.map((c, i) => ({F: frame(c.p, [Math.cos(c.yaw), Math.sin(c.yaw), 0], [0, 0, 1]), h: c.h, name: `chunk${i}`})),
  ], cam: camF3},
  build: {t0: 17.93, t1: F0_3, bug: (t) => { const b = bugD(t); return {st: b.st, packF: b.pack.F}; }},
};
void PLAT_H; void DUR; void solve;
