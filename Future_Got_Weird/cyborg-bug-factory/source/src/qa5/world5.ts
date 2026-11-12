// V5 as the audit sees it (src/v5).
import {add3, V3} from '../core/three';
import {frame, toW, Frame} from '../core/frame';
import {armAt5, bugAt5, ground5, holderA5, holderB5, LOOP_K5, prevLoopBug5, ROD_DEFS, ROD_TIP_R, rodsAt5, sledX5} from '../v5/story5';
import {ARM3, HOLD_A, HOLD_B, holdF, holderBoxes5, PLAT5, rodGeom, solveArm3} from '../v5/machine5';
import {camA_C3, camG3} from '../v5/labShots5';
import {bugD, D0_3} from '../v5/build5';
import {bugF, camF3, CHUNKS, F0_3, G0_3, SLABS} from '../v5/rubble5';
import {Box, Cap} from './geom';
import {World, WBug} from './world';
import {armLinks, packBoxes2, packHanging2} from './world4';

export const gripper5Of = (tool: Frame, open: number) => {
  const at = (p: V3) => toW(tool, p);
  const gripBody: Box = {F: {...tool, o: at([0, 0, ARM3.tool - 3.6])}, h: [4.6, 11.5, 3.4], name: 'gripper body'};
  const fingers: Box[] = [], pads: Box[] = [];
  [1, -1].forEach((s) => {
    const y = (4.6 + 0.8 + open) * s;
    fingers.push({F: {...tool, o: at([0, y, 8.2])}, h: [2.4, 0.8, 4.4], name: `finger${s}`});
    pads.push({F: {...tool, o: at([0, y - 0.45 * s, 3.6])}, h: [2.0, 0.35, 1.3], name: `pad${s}`});
  });
  return {gripBody, fingers, pads};
};
export const rods5 = (t: number): {solid: Cap[]; tips: Cap[]} => {
  const solid: Cap[] = [], tips: Cap[] = [];
  ROD_DEFS.forEach((d, i) => {
    const g = rodGeom(d, sledX5(t), rodsAt5(t));
    const n = i ? 'rod B' : 'rod A';
    solid.push({a: g.post, b: add3(g.postTop, [0, 0, 2.5]), r: 2.2, name: `${n} post`});
    solid.push({a: g.postTop, b: g.top, r: 1.1, name: `${n} arm`});
    solid.push({a: g.top, b: add3(g.tip, [0, 0, 1.2]), r: 0.9, name: `${n} pin`});
    tips.push({a: g.tip, b: g.tip, r: ROD_TIP_R, name: `${n} tip`});
  });
  return {solid, tips};
};
export const world5: World = {
  name: 'V5',
  labBugs: (t) => {
    const out: WBug[] = [];
    for (let k = 0; k <= LOOP_K5; k++) {
      const b = bugAt5(k, t);
      if (b) out.push({k, st: b.st, packF: b.pack?.F ?? null, hook: b.pack?.hook ?? 0, onSled: b.onSled});
    }
    const pl = prevLoopBug5(t);
    if (pl) out.push({k: -1, st: pl.st, packF: pl.pack?.F ?? null, hook: pl.pack?.hook ?? 0, onSled: pl.onSled});
    return out;
  },
  arm: (t) => {
    const {arm, held} = armAt5(t);
    const R = solveArm3(arm);
    const g = gripper5Of(R.tool, arm.open);
    return {tool: R.tool, open: arm.open, held, heldF: held !== null ? R.tool : null, links: armLinks(R), ...g};
  },
  sledX: sledX5,
  walkGround: ground5,
  platform: (t) => ({F: frame([PLAT5.cx + sledX5(t), PLAT5.cy, 1.6], [1, 0, 0], [0, 0, 1]), h: [PLAT5.hx, PLAT5.hy, 1.6], name: 'platform'}),
  rods: rods5,
  holderSolids: holderBoxes5(),
  holderCyl: {c: [0, 0, 0], r: 0, h: 0},
  parked: (t) => [...(holderA5(t) ? [holdF(HOLD_A)] : []), ...(holderB5(t) ? [holdF(HOLD_B)] : [])],
  packBoxes: packBoxes2,
  packHanging: packHanging2,
  labCam: (t) => (t < D0_3 ? camA_C3(t) : t >= G0_3 ? camG3(t) : null),
  rubble: {t0: F0_3, t1: G0_3, bug: (t) => { const b = bugF(t); return {st: b.st, packF: b.pack.F}; }, solids: [
    ...SLABS.map((s, i) => ({F: s.F, h: s.h, name: `slab${i}`})),
    ...CHUNKS.map((c, i) => ({F: frame(c.p, [Math.cos(c.yaw), Math.sin(c.yaw), 0], [0, 0, 1]), h: c.h, name: `chunk${i}`})),
  ], cam: camF3},
  build: {t0: 17.93, t1: F0_3, bug: (t) => { const b = bugD(t); return {st: b.st, packF: b.pack.F}; }},
};
void LOOP_K5;
