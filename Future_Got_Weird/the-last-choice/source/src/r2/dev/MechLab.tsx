// R2/R3 machine lab (not part of the film). Composition R2MechLab, prop `page`:
//   0 turnarounds · 1 march, strike → block · 2 damage · 3 heavy topple · 4 formation re-form · 5 the army · 6 heavy
//   turnaround · 7 heavy ram/launcher, drones.
//   R3 (machines that fight back; a stand-in Crew rig figure drives or receives every contact):
//   8  block → shove → press (stepping pursuit) → combo; overhead parry (deflect); catch + wrench
//   9  dodges: lean back, duck, step back — each clear before the bar passes — and the counter
//   10 brace + shove-back against a shoulder charge; attend → turn-to-threat (planted pivot) → retreat-to-regroup
//   11 damage and failure: plate pivots off and falls flat, arm hangs on its cables then drops, knees give → topple
//      with limp arms, drone crash, drone smashed — all settle on bumpy ground and stay
//   12 heavy weight: lateral-sequence walk (planted-foot markers), hull compression, dust, halt, ram, launcher recoil
//   13 securing: step into a perimeter (staggered), ready postures, scans with pauses, attention to a moving survivor,
//      a controlled restraint tracking a kneeling survivor's shoulder
//   14 routes: a column detours around a toppled heavy and steps over fallen units (wreck obstacles)
//   15 silhouettes: side-on pairs at full and mid LOD, far sprites (wide)
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Scene, Item, makeView, orbit, prep, terrain, LightRig, Material, Cam3, View} from '../engine';
import {V3, seg, smooth, lerp, lerp3, add3, sub3, mul3, norm3, clamp, easeOut, easeIn2, f2} from '../../kit/math';
import {
  MECH_MATS, combatUnit, drone, heavy, straightPath, polyPathFn, armyItems, reformSlots, lineSlots, arcSlots, column, standing, combine, Formation,
  unitAttach, UnitSpec, HeavySpec, heavyAttach, cable, ringSlots, stepInto, securing, staggerT, obstaclesFrom, Slot, DroneSpec,
} from '../mech';
import {figureSprite, figureRig, lookR2, STAND, BRACED, BLOCK_HIGH, KNOCKED_BACK, CHARGE_POSE, KNEEL, blendPose, gaitW, WALK_W, Pose, FigSpec} from '../rig';
import type {Role2} from '../rig/looks';
import {SH_H, SH_X} from '../rig/figure';

const MATS: Record<string, Material> = {
  ...MECH_MATS,
  g_ground: {base: '#6B625C'}, g_asphalt: {base: '#46413F'}, g_line: {base: '#B9AE8E'},
};
const LIGHT: LightRig = {
  sun: {x: -0.84, y: 0.32, z: 0.2}, sunColor: '#FFC08A', ambient: '#4A5878',
  lights: [], fogColor: '#9C7E73', fogStart: 40, fogEnd: 700, skyTop: '#3B3446', skyHorizon: '#C88466', ink: '#162A32',
};
const GROUND = prep(terrain(-80, 420, -90, 90, 10, () => 0, (x, z) => (Math.abs(z) < 14 ? 'g_asphalt' : 'g_ground')));
const BUMP = (x: number, z: number) => 0.16 * Math.sin(0.9 * x + 0.4) * Math.cos(0.7 * z) + 0.05 * x + 0.04 * Math.sin(2.3 * x + 1.7 * z);
const GROUND_BUMP = prep(terrain(-9, 9, -9, 9, 0.75, BUMP, () => 'g_ground'));
const label = (s: string) => <text x={30} y={60} fill="#fff" fontSize={34} fontFamily="sans-serif" stroke="#000" strokeWidth={4} paintOrder="stroke">{s}</text>;

const scene = (v: View, items: Item[], t: number, title: string, extra?: React.ReactNode, ground = GROUND) => (
  <Scene view={v} light={LIGHT} mats={MATS} items={[{kind: 'mesh', mesh: ground, key: 'g', sortKey: 'max'}, ...items]} t={t} over={<g>{label(title)}{extra}</g>} />
);
/** a caption floating over a world point */
const tag = (p: V3, text: string, key: string, size = 30): Item => ({
  kind: 'sprite', pos: p, key, bias: 50, noCull: true,
  draw: (c) => <text x={f2(c.x)} y={f2(c.y)} fill="#FFF7E0" fontSize={size} fontFamily="sans-serif" textAnchor="middle" stroke="#000" strokeWidth={4} paintOrder="stroke">{text}</text>,
});
/** a stand-in Crew member (rig figure) */
const person = (key: string, role: Role2, t: number, pos: V3, heading: number, pose: Pose, world?: FigSpec['world'], seed = 3): FigSpec =>
  ({key, look: lookR2(role), t, seed, pos: {x: pos.x, y: pos.y, z: pos.z}, heading, pose, world});
/** a hand-held bar (stand-in tool) from the grip to the tip */
const bar = (a: V3, b: V3, key: string): Item => cable(a, b, 0, '#59626A', 0.04, key, true, 2);
const fwdH = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const keysV = (t: number, k: [number, V3, ((x: number) => number)?][]): V3 => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp3(k[i - 1][1], k[i][1], (k[i][2] ?? smooth)((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
const keysN = (t: number, k: [number, number, ((x: number) => number)?][]): number => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (k[i][2] ?? smooth)((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
const poseAt = (t: number, k: [number, Pose][]): Pose => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return blendPose(k[i - 1][1], k[i][1], smooth((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
const FIGHT: Pose = {...BRACED({fists: true}), drop: 14};

// ================================================================== page 8: block → shove → press → combo; parry; catch
const ZA = 0, ZB = 0, XA = -1.7, XB = 2.4;
// pair A — a punch blocked in its path, the unit shoves, presses the retreating man and lands a two-hit combo
const hxA = (t: number) => {
  let x = XA - 0.35;
  x -= 0.68 * easeOut(clamp((t - 1.85) / 0.45));
  x -= 0.45 * smooth(clamp((t - 2.35) / 1.05));
  x -= 0.5 * easeOut(clamp((t - 3.9) / 0.4));
  return x;
};
const guardA = (t: number, side: 1 | -1): V3 => ({x: hxA(t) + 0.3, y: 1.47 + (side > 0 ? 0 : 0.05), z: ZA + side * 0.09});
const PA: V3 = {x: XA + 0.15, y: 1.47, z: ZA + 0.04};
const fistA = (t: number): V3 => keysV(t, [
  [0.7, {x: hxA(0) + 0.08, y: 0.98, z: ZA + 0.26}],
  [1.04, {x: hxA(0) - 0.02, y: 1.3, z: ZA + 0.24}],
  [1.3, PA, easeIn2],
  [1.62, {x: hxA(0) + 0.05, y: 1.38, z: ZA + 0.2}, easeOut],
  [2.0, guardA(2.0, 1)],
]);
const handA = (t: number): V3 => (t < 2.0 ? fistA(t) : guardA(t, 1));
const unitA = (t: number): UnitSpec => ({
  id: 801, t, pos: {x: XA + 0.55, y: 0, z: ZA}, heading: 270, idle: 0.4, look: {x: hxA(t), y: 1.55, z: ZA},
  posture: [[-1, 'guard']],
  parry: {t0: 1.3, side: 'L', at: fistA, kind: 'block', force: 1.1},
  shove: {t0: 1.85, target: {x: hxA(1.85) + 0.16, y: 1.3, z: ZA}},
  press: {t0: 2.3, t1: 3.3, target: (tt) => ({x: hxA(tt), y: 1.3, z: ZA}), reach: 0.92},
  strikes: [{t0: 3.55, side: 'L', target: guardA(3.55, -1)}, {t0: 3.9, side: 'R', target: guardA(3.9, 1), step: 0.15}],
});
const personA = (t: number): FigSpec => {
  const pose = poseAt(t, [[0, FIGHT], [1.3, {...FIGHT, lean: 12, twist: -14}], [1.7, FIGHT], [1.85, FIGHT], [2.1, KNOCKED_BACK(0.35)], [2.6, BLOCK_HIGH], [3.9, BLOCK_HIGH], [4.15, KNOCKED_BACK(0.45)], [5.0, FIGHT]]);
  return person('pA', 'breaker', t, {x: hxA(t), y: 0, z: ZA}, 90, pose, {handR: handA(t), handL: t > 2.1 ? guardA(t, -1) : undefined}, 5);
};
// pair B — an overhead hammer-fist parried off the forearm; a thrust caught at the wrist and wrenched
const PB: V3 = {x: XB + 0.1, y: 1.5, z: ZB + 0.02};
const fistBpre = (t: number): V3 => keysV(t, [
  [0.55, {x: XB - 0.34, y: 0.98, z: ZB + 0.25}],
  [0.98, {x: XB - 0.44, y: 1.72, z: ZB + 0.16}],
  [1.25, PB, easeIn2],
]);
const PC: V3 = {x: XB + 0.1, y: 1.34, z: ZB + 0.03};
const thrustB = (t: number): V3 => keysV(t, [
  [1.9, {x: XB - 0.3, y: 1.12, z: ZB + 0.22}],
  [2.25, {x: XB - 0.38, y: 1.2, z: ZB + 0.24}],
  [2.5, PC, easeIn2],
]);
const unitB = (t: number): UnitSpec => ({
  id: 802, t, pos: {x: XB + 0.62, y: 0, z: ZB}, heading: 270, idle: 0.4, look: {x: XB - 0.3, y: 1.6, z: ZB},
  posture: [[-1, 'guard']],
  parry: {t0: 1.25, side: 'R', at: fistBpre, kind: 'parry'},
  catch: {t0: 2.5, side: 'R', at: thrustB, t1: 3.7, wrench: {t0: 2.85, dir: {x: -0.2, y: 0, z: -1}, dist: 0.45, deg: 35}},
});
const handB = (t: number): V3 => {
  if (t < 1.25) return fistBpre(t);
  if (t < 1.9) {
    // after contact the fist rides off the unit's forearm (outward, down), then is pulled back
    const a = unitAttach(unitB(Math.min(t, 1.45)));
    const off = add3(a.forearmR, {x: -0.06, y: 0.07, z: 0});
    return t < 1.45 ? off : lerp3(off, thrustB(1.9), smooth((t - 1.45) / 0.45));
  }
  if (t < 2.5) return thrustB(t);
  if (t < 3.7) return unitAttach(unitB(t)).catchR;
  return lerp3(unitAttach(unitB(3.7)).catchR, {x: hxB(t) + 0.1, y: 1.0, z: zB(t) + 0.25}, smooth((t - 3.7) / 0.5));
};
const pull = (t: number): V3 => (t < 2.5 ? {x: 0, y: 0, z: 0} : mul3(sub3(unitAttach(unitB(Math.min(t, 3.7))).catchR, unitAttach(unitB(2.5)).catchR), 0.7));
const hxB = (t: number) => XB - 0.42 + pull(t).x;
const zB = (t: number) => ZB + pull(t).z;
const personB = (t: number): FigSpec => {
  const pose = poseAt(t, [[0, FIGHT], [1.0, {...FIGHT, lean: -6}], [1.25, {...FIGHT, lean: 16, drop: 20}], [1.6, FIGHT], [2.5, {...FIGHT, lean: 14, twist: -12}], [3.1, {...KNOCKED_BACK(0.1), lean: 26, drop: 30}], [3.9, FIGHT]]);
  return person('pB', 'runner', t, {x: hxB(t), y: 0, z: zB(t)}, 90 + pull(t).z * 40, pose, {handR: handB(t)}, 7);
};

// ================================================================== page 9: dodges (bar swings) and counters
type DodgeCase = {x: number; z: number; kind: 'lean' | 'duck' | 'step'; t0: number; y: number; dir: V3; amount: number; counter: (t0: number, hx: number, z: number) => Partial<UnitSpec>};
const DODGES: DodgeCase[] = [
  {x: -4.0, z: 0, kind: 'lean', t0: 1.4, y: 1.98, dir: {x: 1, y: 0, z: 0.15}, amount: 1.25, counter: (t0, hx, z) => ({strikes: [{t0: t0 + 0.62, side: 'L', target: {x: hx + 0.32, y: 1.5, z: z - 0.05}}]})},
  {x: 0, z: 0, kind: 'duck', t0: 2.3, y: 1.86, dir: {x: 0.35, y: 0, z: 0}, amount: 1.25, counter: (t0, hx, z) => ({strikes: [{t0: t0 + 0.55, side: 'R', target: {x: hx + 0.3, y: 1.25, z: z + 0.04}}]})},
  {x: 4.0, z: 0, kind: 'step', t0: 3.2, y: 1.62, dir: {x: 1, y: 0, z: 0.35}, amount: 1.5, counter: (t0, hx, z) => ({moves: [{t0: t0 + 0.45, t1: t0 + 1.1, to: {x: hx + 1.15, y: 0, z}, face: {x: hx, y: 0, z}, guard: true}]})},
];
const swingTheta = (t: number, t0: number) => keysN(t - t0, [[-0.8, 30], [-0.35, 115], [0, 0, easeIn2], [0.2, -62, easeOut], [0.8, 30]]);
const HX9 = -0.62;
const swing = (c: DodgeCase, t: number) => {
  const th = (swingTheta(t, c.t0) * Math.PI) / 180;
  // the grip stays within the man's reach (shoulder height ~1.1 m); the bar angles up so its tip sweeps the target height
  const S = {x: c.x + HX9 + 0.05, y: 1.45, z: c.z + 0.08};
  const dh = {x: Math.cos(th), y: 0, z: Math.sin(th)};
  const sE = clamp((c.y - 1.45) / 0.95, -0.3, 0.8), cE = Math.sqrt(1 - sE * sE);
  const grip = add3(S, mul3(dh, 0.42));
  return {grip, tip: add3(grip, mul3({x: dh.x * cE, y: sE, z: dh.z * cE}, 0.95))};
};
const unit9 = (c: DodgeCase, i: number, t: number): UnitSpec => ({
  id: 900 + i, t, pos: {x: c.x + 0.6, y: 0, z: c.z}, heading: 270, idle: 0.4, look: {x: c.x + HX9, y: 1.6, z: c.z}, posture: [[-1, 'guard']],
  dodge: {t0: c.t0, dir: c.dir, kind: c.kind, amount: c.amount},
  ...c.counter(c.t0, c.x + HX9, c.z),
});

// ================================================================== page 10: brace + shove-back; turn to threat; retreat
const ZC = 0, ZD = 0, XC = -2.6, XD = 3.0;
const unitC = (t: number): UnitSpec => ({id: 1001, t, pos: {x: XC + 0.55, y: 0, z: ZC}, heading: 270, idle: 0.4, look: {x: XC - 1.5, y: 1.5, z: ZC}, posture: [[-1, 'ready']], brace: {t0: 1.6, dir: {x: 1, y: 0, z: 0}, shove: 2.05}});
/** he meets the covering forearms (not the chest behind them): his shoulder leads his feet by ~0.45 m in the charge */
const contactC = () => { const a = unitAttach(unitC(1.6)); return Math.min(a.forearmL.x, a.forearmR.x, a.handL.x, a.handR.x) - 0.66; };
const hxC = (t: number) => {
  const xc = contactC();
  if (t < 0.55) return XC - 3.2;
  if (t < 1.6) { const k = (t - 0.55) / 1.05; return lerp(XC - 3.2, xc, k * k * (1.6 - 0.6 * k)); }
  let x = xc - 0.04 * smooth((t - 1.6) / 0.25);
  x -= 1.15 * easeOut(clamp((t - 2.05) / 0.55));
  return x;
};
const personC = (t: number): FigSpec => {
  const pose = poseAt(t, [[0, FIGHT], [0.7, CHARGE_POSE], [1.6, {...CHARGE_POSE, drop: 40}], [2.05, {...CHARGE_POSE, drop: 40}], [2.3, KNOCKED_BACK(0.55)], [3.2, KNOCKED_BACK(0.3)], [3.8, FIGHT]]);
  return person('pC', 'breaker', t, {x: hxC(t), y: 0, z: ZC}, 90, pose, undefined, 9);
};
// the second threat walks in from behind the unit
const E_PATH = [{x: XD + 4.0, z: -2.2}, {x: XD + 1.6, z: -0.6}];
const eDist = (t: number) => clamp((t - 0.5) * 1.2, 0, 2.9);
const personE = (t: number): FigSpec => {
  const g = gaitW(E_PATH, eDist(t), WALK_W, () => 0);
  const stop = smooth((eDist(t) - 2.3) / 0.6);
  return {...person('pE', 'runner', t, g.pos, g.heading, blendPose(g.pose, FIGHT, stop), {footL: g.footL, footR: g.footR}, 11)};
};
const eHead = (t: number): V3 => { const g = gaitW(E_PATH, eDist(t), WALK_W, () => 0); return {x: g.pos.x, y: 1.6, z: g.pos.z}; };
const unitD = (t: number): UnitSpec => ({
  id: 1002, t, pos: {x: XD + 0.3, y: 0, z: ZD}, heading: 270, idle: 0.4, look: {x: XD - 2.0, y: 1.6, z: ZD}, posture: [[-1, 'guard']],
  attend: [{t0: 1.05, at: eHead}],
  turns: [{t0: 1.3, to: {x: XD + 2.2, y: 0, z: -1.0}}],
  moves: [{t0: 2.6, t1: 4.2, to: {x: XD + 0.2, y: 0, z: -2.1}, face: {x: XD + 0.0, y: 0, z: 0.4}, guard: true}],
});

// ================================================================== page 11: damage and failure on bumpy ground
const dmgUnits = (t: number): UnitSpec[] => [
  {id: 1101, t, pos: {x: 0, y: 0, z: 0}, heading: 200, ground: BUMP, idle: 0.3,
    hits: [{t0: 0.8, dir: {x: -0.3, y: 0, z: 1}, strength: 1}, {t0: 1.7, dir: {x: 0.8, y: 0, z: 0.5}, strength: 1.3}],
    damage: {chest: {t0: 0.8, dir: {x: -0.3, y: 0.35, z: 1}, speed: 3.6}, armOff: {side: 'R', t0: 1.7, dir: {x: 0.7, y: 0.4, z: 0.6}, speed: 3.6}, leak: {t0: 1.75}, dead: {t0: 3.0}},
    fall: {t0: 2.5, dir: {x: -0.7, y: 0, z: 0.6}}},
  {id: 1102, t, pos: {x: 2.3, y: 0, z: -1.2}, heading: 225, ground: BUMP, idle: 0.3,
    hits: [{t0: 1.0, dir: {x: 0.3, y: 0, z: -1}, strength: 0.8}, {t0: 1.9, dir: {x: 1, y: 0, z: 0.2}, strength: 1}],
    damage: {back: {t0: 1.0, dir: {x: 0.3, y: 0.8, z: -1}, speed: 3}, pauldronL: {t0: 1.9, dir: {x: -0.4, y: 0.6, z: 1}, speed: 3}, dent: {t0: 1.9, deg: -10}}},
];
const dmgDrones = (t: number): DroneSpec[] => [
  {id: 1103, t, pos: {x: -2.2, y: 2.6, z: -0.6}, heading: 120, ground: BUMP, hit: {t0: 1.3, dir: {x: 0.6, y: -0.2, z: 0.7}}},
  {id: 1104, t, pos: {x: 1.2, y: 2.3, z: 1.6}, heading: 300, ground: BUMP, smash: {t0: 2.2, dir: {x: -0.3, y: 0.2, z: 0.8}, speed: 4}},
];

// ================================================================== page 12: heavy weight
const hvDist = (t: number) => {
  // accelerate over 1 s, cruise 0.9 m/s, decelerate over the last 1.4 s, halt at 6.0
  const v = 0.9, a = 1.0, d = 1.4, T = 6.0;
  if (t <= 0) return 0;
  if (t < a) return (v * t * t) / (2 * a);
  const cr = (v * a) / 2;
  if (t < T - d) return cr + v * (t - a);
  const end = cr + v * (T - d - a) + (v * d) / 2;
  if (t >= T) return end;
  const r = T - t;
  return end - (v * r * r) / (2 * d);
};
const HV_PATH = straightPath({x: -7, y: 0, z: 0}, 90);
const heavy12 = (t: number): HeavySpec => ({
  id: 1201, t, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path: HV_PATH, dist: hvDist(t), distAt: hvDist}, dust: true,
  look: t > 6.2 ? {x: 4.5, y: 0.6, z: 1.2} : undefined, eye: t > 6.4 ? 'amber' : 'cyan',
  ram: {t0: 7.3, target: {x: 3.9, y: 0.8, z: 0.3}},
  fire: {t0: 9.0, target: {x: 40, y: 0, z: -12}},
});

// ================================================================== page 13: securing
const S1: V3 = {x: -0.7, y: 0, z: 0.35}, S2: V3 = {x: 0.7, y: 0, z: -0.45};
const S3_PATH = [{x: 0.3, z: 0.9}, {x: 2.4, z: 2.4}];
const s3Dist = (t: number) => clamp((t - 4.2) * 0.55, 0, 2.2);
const HANDS_UP: Pose = {armL: {local: {r: -40, u: 330, f: 30}}, armR: {local: {r: 40, u: 330, f: 30}}, handL: 'open', handR: 'open', face: {brows: 0.6, mouth: 'flat'}};
const s1Spec = (t: number): FigSpec => person('s1', 'tether', t, S1, 120, blendPose({...KNEEL('R'), ...HANDS_UP}, {...KNEEL('R'), ...HANDS_UP, lean: 18, drop: KNEEL('R').drop ?? 0}, smooth((t - 2.2) / 0.5)), undefined, 13);
const s2Spec = (t: number): FigSpec => person('s2', 'decoy', t, S2, 300, blendPose(STAND, {...STAND, ...HANDS_UP}, smooth((t - 0.6) / 0.8)), undefined, 15);
const s3Spec = (t: number): FigSpec => {
  const g = gaitW(S3_PATH, s3Dist(t), {...WALK_W, stride: 0.7}, () => 0);
  return person('s3', 'drone', t, g.pos, g.heading, blendPose(g.pose, STAND, smooth((s3Dist(t) - 1.7) / 0.5)), {footL: g.footL, footR: g.footR}, 17);
};
const s3Head = (t: number): V3 => { const g = gaitW(S3_PATH, s3Dist(t), {...WALK_W, stride: 0.7}, () => 0); return {x: g.pos.x, y: 1.55, z: g.pos.z}; };
const RING_IN = ringSlots({x: 0, y: 0, z: 0}, 4.6, 9, 131, 1300);
const RING_OUT = ringSlots({x: 0, y: 0, z: 0}, 7.4, 9, 131, 1300);
const restrainer = (t: number, v: View): UnitSpec => {
  const shoulder = (tt: number) => figureRig(v, s1Spec(tt)).torso({r: -SH_X, u: SH_H - 4, f: 6});
  const arm = (tt: number) => figureRig(v, s1Spec(tt)).torso({r: SH_X * 0.25, u: SH_H - 14, f: -26});
  return {
    id: 1350, t, pos: {x: -2.4, y: 0, z: -0.6}, heading: 60, idle: 0.3, posture: [[-1, 'guard'], [2.6, 'ready']],
    moves: [{t0: 0.6, t1: 1.9, to: {x: -1.62, y: 0, z: -0.05}, face: S1}],
    restrain: {t0: 2.4, side: 'both', at: shoulder, at2: arm, press: 0.4},
  };
};

// ================================================================== page 14: routes around wrecks
const WRECK_H: HeavySpec = {id: 1401, t: 0, pos: {x: 14, y: 0, z: 0.6}, heading: 20, kneeBreak: {t0: -10, leg: 1, dir: {x: 1, y: 0, z: 0}}, eye: 'off'};
const WRECK_U: UnitSpec[] = [
  {id: 1402, t: 0, pos: {x: 21, y: 0, z: -3.2}, heading: 300, fall: {t0: -10, dir: {x: 0.2, y: 0, z: 1}}, damage: {dead: {t0: -10}}},
  {id: 1403, t: 0, pos: {x: 25, y: 0, z: 4.2}, heading: 80, fall: {t0: -10, dir: {x: -1, y: 0, z: 0.2}}, damage: {dead: {t0: -10}}},
  {id: 1404, t: 0, pos: {x: 8, y: 0, z: -4.6}, heading: 10, fall: {t0: -10, dir: {x: 0.8, y: 0, z: -0.4}}, damage: {dead: {t0: -10}}},
];
const WRECKS14 = [{kind: 'heavy', spec: (T: number) => ({...WRECK_H, t: T})}, ...WRECK_U.map((u) => ({kind: 'unit', spec: (T: number) => ({...u, t: T})}))];

export const MechLab: React.FC<{page?: number; cam?: number}> = ({page = 0, cam: camSel = 0}) => {
  /** a close three-quarter on one pair (cam 1, 2, 3) for inspection sheets */
  const close = (x: number, z = 0, back = 1): Cam3 => ({pos: {x: x + 0.15 * back, y: 1.55, z: z + 3.7}, target: {x: x + 0.1, y: 1.2, z}, fov: 40});
  const f = useCurrentFrame();
  const t = f / 30;
  if (page === 0 || page === 6) {
    // turnarounds (page 0: combat units + drone up close; page 6: the heavy). One view per 20 frames.
    const views: [number, number, string][] = [[0, 6, 'front'], [40, 6, 'three-quarter'], [90, 6, 'side'], [140, 6, 'rear three-quarter'], [180, 6, 'back'], [30, -10, 'low angle'], [30, 40, 'high angle']];
    const vi = Math.min(views.length - 1, Math.floor(f / 20));
    const [az, el, name] = views[vi];
    const heavyPage = page === 6;
    const target: V3 = heavyPage ? {x: 0, y: 3.0, z: 0} : {x: 0, y: 1.25, z: 0};
    const cam: Cam3 = orbit(target, heavyPage ? 17 : 6.2, 180 + az, el, 40);
    const items: Item[] = heavyPage
      ? heavy({id: 4, t, pos: {x: 0, y: 0, z: 0}, heading: 180})
      : [
          ...combatUnit({id: 1, t, pos: {x: -0.75, y: 0, z: 0}, heading: 180, eye: 'cyan', idle: 0.3}),
          ...combatUnit({id: 2, t, pos: {x: 0.85, y: 0, z: 0.3}, heading: 180, eye: 'amber', idle: 0.3, raise: {t0: -1, t1: 99, side: 'R'}}),
          ...drone({id: 3, t, pos: {x: 0.1, y: 2.55, z: -0.6}, heading: 180, eye: 'cyan'}),
        ];
    return scene(makeView(cam), items, t, `${heavyPage ? 'heavy' : 'combat units + drone'} · ${name}`);
  }
  if (page === 1) {
    // action cycles up close: march (planted feet), strike → block exchange, raise
    const cam: Cam3 = {pos: {x: 1.8, y: 1.6, z: 4.2}, target: {x: 1.8, y: 1.15, z: -2}, fov: 42};
    const cyc = Math.floor(t / 3) * 3;
    const items: Item[] = [
      ...combatUnit({id: 11, t, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path: straightPath({x: -4.5, y: 0, z: -4.5}, 90), dist: t * 1.25, start: 0}}),
      ...combatUnit({id: 12, t, pos: {x: 1.0, y: 0, z: -2}, heading: 90, strike: {t0: cyc + 1.2, side: 'R', target: {x: 2.15, y: 1.75, z: -2.05}}}),
      ...combatUnit({id: 13, t, pos: {x: 2.6, y: 0, z: -2}, heading: 270, block: {t0: cyc + 0.75, t1: cyc + 1.6, side: 'L'}, hits: [{t0: cyc + 1.2, dir: {x: 1, y: 0, z: 0}, strength: 0.6}]}),
    ];
    return scene(makeView(cam), items, t, 'actions · march (planted feet) · strike → block');
  }
  if (page === 7) {
    // heavy: ram strike and launcher fire; drone dive / mark / cutter
    const cam: Cam3 = {pos: {x: 6, y: 4.2, z: 17}, target: {x: 4, y: 2.2, z: 0}, fov: 42};
    const cyc = Math.floor(t / 3) * 3;
    const ph = t % 3;
    const items: Item[] = [
      ...heavy({id: 14, t, pos: {x: 9, y: 0, z: -6}, heading: 250, ram: {t0: cyc + 1.6, target: {x: 4.6, y: 0.5, z: -4.2}}, fire: {t0: cyc + 2.6, target: {x: -10, y: 0, z: 4}}}),
      ...drone({id: 15, t, pos: {x: lerp(-2, 6, smooth(ph / 2.2)), y: lerp(5, 1.2, smooth(ph / 2.2)), z: 2}, heading: 100, vel: {x: 4, y: -2, z: 0}, eye: 'amber'}),
      ...drone({id: 16, t, pos: {x: 0, y: 3.5, z: 3}, heading: 120, look: {x: 4.6, y: 0.5, z: -4.2}, mark: {target: {x: 4.6, y: 0.5, z: -4.2}}, eye: 'amber', cutter: (Math.sin(t * 2) + 1) / 2}),
    ];
    return scene(makeView(cam), items, t, 'heavy ram + launcher · drone dive · drone mark + cutter');
  }
  if (page === 2) {
    // damage sequence: plate torn, arm detached, fall, wreck
    const cam: Cam3 = {pos: {x: 1.5, y: 2.2, z: 8.0}, target: {x: 0.2, y: 0.9, z: -1}, fov: 42};
    const items: Item[] = [
      ...combatUnit({
        id: 21, t, pos: {x: 0, y: 0, z: 0}, heading: 120,
        hits: [{t0: 0.8, dir: {x: 1, y: 0, z: -0.3}, strength: 1}, {t0: 1.9, dir: {x: 0.6, y: 0, z: 0.8}, strength: 1.3}],
        damage: {chest: {t0: 0.8, dir: {x: 1, y: 0.3, z: -0.4}, speed: 4.5}, armOff: {side: 'R', t0: 1.9, dir: {x: 0.5, y: 0.5, z: 1}, speed: 4}, leak: {t0: 1.95}},
        fall: {t0: 2.6, dir: {x: -0.6, y: 0, z: -0.8}},
      }),
      ...combatUnit({id: 22, t, pos: {x: 2.6, y: 0, z: -1.5}, heading: 250, damage: {back: {t0: 1.2, dir: {x: 0.4, y: 0.5, z: -1}}, pauldronL: {t0: 2.0, dir: {x: -1, y: 0.4, z: 0}}}}),
      ...combatUnit({id: 23, t, pos: {x: -2.2, y: 0, z: -2.5}, heading: 160, hits: [{t0: 1.0, dir: {x: 0, y: 0, z: -1}, strength: 1.2}], fall: {t0: 1.05, dir: {x: 0.2, y: 0, z: -1}, getUp: 3.2}, lockAt: 4.2}),
    ];
    return scene(makeView(cam), items, t, 'damage · chest plate · arm torn off · fall · wreck persists · knocked down and gets up');
  }
  if (page === 3) {
    // heavy topple after a knee break (front-left leg pinned)
    const cam: Cam3 = {pos: {x: 16, y: 5, z: 12}, target: {x: -1, y: 2.0, z: -2}, fov: 44};
    const items: Item[] = [
      ...heavy({id: 31, t, pos: {x: 0, y: 0, z: 0}, heading: 200, gait: {path: straightPath({x: 1, y: 0, z: -3}, 200), dist: Math.min(t, 1.2) * 1.2}, kneeBreak: {t0: 1.4, leg: 0, dir: {x: -1, y: 0, z: 0.4}}}),
    ];
    return scene(makeView(cam), items, t, 'heavy · knee broken · topple · wreck');
  }
  if (page === 4) {
    // formation re-form: a 3-rank line advancing west halts as one, then re-forms into an arc around the survivors'
    // position (ripple delay, paths sorted so they don't cross); LOD by distance (full near, mid, far sprites)
    const center: V3 = {x: 20, y: 0, z: 0};
    const advance = column(straightPath({x: 37, y: 0, z: 0}, 270), 42, 14, 1.9, 2.4, 1.3, 0, 41, 1.0);
    const B = arcSlots(center, 8.5, 28, 152, 42, 42, 3, 2.2);
    const A = advance.slots(1.0 + 0.8).map((s) => ({...s, path: undefined, dist: undefined, ctl: undefined}));
    const re = reformSlots(A, B, 1.5, 0.03, 2.6, center, 2.4);
    const form: Formation = {slots: (tt) => (tt < 1.5 ? advance.slots(tt) : re.slots(tt))};
    const cam: Cam3 = {pos: {x: 25, y: 30, z: 17}, target: {x: 27, y: 0, z: 0}, fov: 50};
    const v = makeView(cam);
    const crewMark: Item = {kind: 'sprite', pos: center, key: 'crew', draw: (c) => <circle cx={c.x} cy={c.y} r={10} fill="#FFC744" stroke="#162A32" strokeWidth={3} />};
    return scene(v, [crewMark, ...armyItems(v, t, form, {})], t, 'formation · advance → halt as one → re-form into an arc (ripple) · LOD');
  }
  if (page === 5) {
    // the army filling the avenue from a high wide — a front block holding, columns streaming west along the avenue
    // and south out of two cross streets, heavies among them, drones above
    const cam: Cam3 = {pos: {x: 78, y: 30, z: 40}, target: {x: 175, y: 0, z: -8}, fov: 42};
    const v = makeView(cam);
    const front = standing(lineSlots({x: 112, y: 0, z: 0}, 270, 12, 2.0, 3, 2.4, 61));
    const avenue = column(straightPath({x: 150, y: 0, z: 0}, 90 + 180), 6 * 34, 6, 3.6, 2.7, 1.3, -6, 62);
    const cross1 = column(polyPathFn([{x: 124, y: 0, z: -110}, {x: 124, y: 0, z: -14}, {x: 100, y: 0, z: -7}]), 3 * 26, 3, 2.6, 2.6, 1.3, -40, 63);
    const cross2 = column(straightPath({x: 262, y: 0, z: -40}, 180), 3 * 30, 3, 2.6, 2.6, 1.3, -6, 64);
    const army = combine(front, avenue, cross1, cross2);
    const drones: Item[] = Array.from({length: 18}, (_, i) => drone({id: 900 + i, t, pos: {x: 120 + (i % 9) * 22 + Math.sin(t * 0.7 + i) * 2, y: 12 + (i % 3) * 6, z: -24 + Math.floor(i / 9) * 30}, heading: 270, eye: 'cyan', lod: 'far', scale: 1.6})).flat();
    const heavies: Item[] = [0, 1, 2].map((k) => heavy({id: 950 + k, t, pos: {x: 0, y: 0, z: 0}, heading: 270, gait: {path: straightPath({x: 210 + k * 46, y: 0, z: k % 2 ? 8 : -8}, 270), dist: t * 0.9}, lod: k === 0 ? 'mid' : 'far'})).flat();
    return scene(v, [...armyItems(v, t, army, {maxFull: 6, maxMid: 30, farFrom: 90}), ...drones, ...heavies], t, 'army · avenue from a high wide (front block, columns, heavies, drones)');
  }
  if (page === 8) {
    const cam: Cam3 = camSel === 1 ? close(XA + 0.1) : camSel === 2 ? close(XB + 0.2) : {pos: {x: 0.6, y: 1.8, z: 7.6}, target: {x: 0.6, y: 1.25, z: 0}, fov: 46};
    const v = makeView(cam);
    const items: Item[] = [
      ...combatUnit(unitA(t)), figureSprite(personA(t)),
      ...combatUnit(unitB(t)), figureSprite(personB(t)),
      tag({x: XA + 0.1, y: 2.55, z: ZA}, t < 1.75 ? 'BLOCK in the punch path' : t < 2.3 ? 'SHOVE (hips, step)' : t < 3.4 ? 'PRESS: stepping pursuit' : 'COMBO: jab → cross', 'tA'),
      tag({x: XB + 0.15, y: 2.55, z: ZB}, t < 1.9 ? 'PARRY: deflect the hammer-fist' : t < 2.85 ? 'CATCH the wrist' : 'WRENCH (through the hips)', 'tB'),
    ];
    return scene(v, items, t, `R3 exchange · block → shove → press → combo · parry · catch + wrench · ${t.toFixed(2)} s`);
  }
  if (page === 9) {
    const cam: Cam3 = camSel >= 1 ? close(DODGES[camSel - 1].x + 0.1) : {pos: {x: 0.2, y: 1.9, z: 10.5}, target: {x: 0.2, y: 1.2, z: 0}, fov: 52};
    const v = makeView(cam);
    const items: Item[] = [];
    DODGES.forEach((c, i) => {
      const u = unit9(c, i, t);
      items.push(...combatUnit(u));
      const s = swing(c, t);
      const pose = poseAt(t - c.t0, [[-1, FIGHT], [-0.35, {...FIGHT, twist: 28, lean: -4}], [0, {...FIGHT, twist: -26, lean: 10}], [0.3, {...FIGHT, twist: -34, lean: 12}], [0.9, FIGHT]]);
      items.push(figureSprite(person(`p9${i}`, i === 1 ? 'runner' : 'breaker', t, {x: c.x + HX9, y: 0, z: c.z}, 90, pose, {handR: s.grip}, 20 + i)));
      items.push(bar(s.grip, s.tip, `bar9${i}`));
      items.push(tag({x: c.x + 0.1, y: 2.6, z: c.z}, `DODGE · ${c.kind}${t > c.t0 + 0.3 ? ' → counter' : ''}`, `t9${i}`));
    });
    return scene(v, items, t, `R3 dodge · clear before the bar passes (lean back · duck · step back) · ${t.toFixed(2)} s`);
  }
  if (page === 10) {
    const cam: Cam3 = camSel === 1 ? {...close(XC - 0.3), fov: 46} : camSel === 2 ? {pos: {x: XD + 0.6, y: 2.4, z: 5.2}, target: {x: XD + 0.4, y: 1.0, z: 0}, fov: 48} : {pos: {x: 0.6, y: 2.6, z: 10.8}, target: {x: 0.6, y: 1.0, z: 0}, fov: 52};
    const v = makeView(cam);
    const items: Item[] = [
      ...combatUnit(unitC(t)), figureSprite(personC(t)),
      ...combatUnit(unitD(t)), figureSprite(personE(t)),
      figureSprite(person('pW', 'tether', t, {x: XD - 2.0, y: 0, z: ZD}, 90, FIGHT, undefined, 23)),
      tag({x: XC + 0.0, y: 2.6, z: ZC}, t < 1.6 ? 'BRACE: turn in, rear foot back, lower' : t < 2.05 ? 'absorb' : 'SHOVE BACK', 'tC'),
      tag({x: XD + 0.4, y: 2.7, z: ZD}, t < 1.05 ? 'holding the man in front' : t < 2.6 ? 'ATTEND → TURN TO THREAT (planted pivot)' : 'RETREAT TO REGROUP (guard, facing)', 'tD'),
    ];
    return scene(v, items, t, `R3 brace + shove-back · attend → turn to threat → retreat · ${t.toFixed(2)} s`);
  }
  if (page === 11) {
    const cam: Cam3 = {pos: {x: 3.6, y: 2.7, z: 7.4}, target: {x: 0.4, y: 0.7, z: -0.2}, fov: 46};
    const v = makeView(cam);
    const items: Item[] = [...dmgUnits(t).flatMap((u) => combatUnit(u)), ...dmgDrones(t).flatMap((d) => drone(d))];
    return scene(v, items, t, `R3 failure first, then gravity: plate pivots off · arm hangs, drops · knees give → topple (limp arms) · drones · ${t.toFixed(2)} s`, undefined, GROUND_BUMP);
  }
  if (page === 12) {
    const sp = heavy12(t);
    const a = heavyAttach(sp);
    const cam: Cam3 = {pos: {x: 1.5, y: 2.0, z: 15.5}, target: {x: 0.6, y: 2.6, z: 0}, fov: 50};
    const v = makeView(cam);
    const marks: Item[] = a.feet.map((p, i) => ({kind: 'sprite', pos: {x: p.x, y: 0.02, z: p.z}, key: `fm${i}`, bias: 10, draw: (c) => <circle cx={f2(c.x)} cy={f2(c.y + 4)} r={7} fill={a.planted[i] ? '#3FCF6B' : '#FF8A3C'} stroke="#000" strokeWidth={2} />}));
    const target: Item[] = sp.ram ? [{kind: 'sprite', pos: sp.ram.target, key: 'rt', draw: (c) => <circle cx={f2(c.x)} cy={f2(c.y)} r={9} fill="none" stroke="#FFB23F" strokeWidth={3} />}] : [];
    const n = a.planted.filter(Boolean).length;
    return scene(v, [...heavy(sp), ...marks, ...target], t, `R3 heavy weight · planted feet ${n}/4 (green) · compression + dust on each landing · halt · ram wind-up → recoil · launcher brace → kick · ${t.toFixed(2)} s`);
  }
  if (page === 13) {
    const cam: Cam3 = camSel === 1 ? {pos: {x: -1.0, y: 1.5, z: 3.4}, target: {x: -0.95, y: 0.95, z: 0.2}, fov: 42} : {pos: {x: 4.2, y: 3.4, z: 7.2}, target: {x: 0.1, y: 0.9, z: 0.3}, fov: 54};
    const v = makeView(cam);
    const ring = securing(stepInto(RING_OUT, RING_IN, 0.4, {spread: 1.4}), {
      t0: 2.6, posture: 'ready', span: 56, watch: {x: 0, y: 1.0, z: 0},
      attend: (s: Slot) => (Math.hypot(s.pos.x - 2.4, s.pos.z - 2.4) < 4.2 ? {t0: staggerT(s.id, 4.6, 0.7, 5), at: s3Head} : undefined),
    });
    const items: Item[] = [
      ...armyItems(v, t, ring, {maxFull: 12, ctl: () => ({idle: 0.25})}),
      ...combatUnit(restrainer(t, v)),
      figureSprite(s1Spec(t)), figureSprite(s2Spec(t)), figureSprite(s3Spec(t)),
      tag({x: 0, y: 3.0, z: 0}, t < 2.6 ? 'STEP INTO A PERIMETER (staggered)' : t < 4.6 ? 'READY POSTURE · SCANS WITH PAUSES' : 'ATTENTION → the moving survivor', 't13'),
      tag({x: -1.3, y: 2.6, z: 0.1}, t < 2.4 ? 'moves in' : 'RESTRAIN (grip tracks his shoulder)', 't13r', 26),
    ];
    return scene(v, items, t, `R3 securing · perimeter · ready · scan · attend · restrain · ${t.toFixed(2)} s`);
  }
  if (page === 14) {
    const cam: Cam3 = {pos: {x: 10, y: 17, z: 19}, target: {x: 17, y: 0, z: 0}, fov: 50};
    const v = makeView(cam);
    const obs = obstaclesFrom(WRECKS14, t);
    const col = column(straightPath({x: 40, y: 0, z: 0}, 270), 5 * 12, 5, 2.4, 2.6, 1.4, -14, 141, undefined, 0, {avoid: obs, clear: 0.7});
    const wrecks: Item[] = [...heavy({...WRECK_H, t}), ...WRECK_U.flatMap((u) => combatUnit({...u, t}))];
    const rings: Item[] = obs.map((o, i) => ({kind: 'sprite', pos: {x: o.x, y: 0.02, z: o.z}, key: `ob${i}`, bias: 0.5, draw: (c) => <ellipse cx={f2(c.x)} cy={f2(c.y)} rx={f2(o.r * c.k)} ry={f2(o.r * c.k * 0.6)} fill="none" stroke={(o.h ?? 1) <= 0.6 ? '#3FCF6B' : '#FF8A3C'} strokeWidth={2} strokeDasharray="6 5" />}));
    return scene(v, [...wrecks, ...rings, ...armyItems(v, t, col, {maxFull: 30, maxMid: 40})], t, `R3 routes · lanes detour around the toppled heavy (orange) · step over fallen units (green) · ${t.toFixed(2)} s`);
  }
  // page 15: silhouettes — side-on pairs, full and mid LOD, far sprites in the distance
  const cam: Cam3 = {pos: {x: 0, y: 2.0, z: 14}, target: {x: 0, y: 1.2, z: 0}, fov: 40};
  const v = makeView(cam);
  const row = (x: number, z: number, h: number, lod: UnitSpec['lod'], id: number, extra: Partial<UnitSpec> = {}) => combatUnit({id, t, pos: {x, y: 0, z}, heading: h, lod, idle: 0.2, ...extra});
  const items: Item[] = [
    ...row(-4.2, 0, 90, 'full', 1501), ...row(-3.3, 0.6, 90, 'full', 1502, {posture: 'guard'}),
    ...row(-1.0, 0, 90, 'mid', 1503), ...row(-0.1, 0.6, 90, 'mid', 1504, {posture: 'guard'}),
    ...row(2.4, 0, 0, 'full', 1505), ...row(3.5, 0, 60, 'mid', 1506, {posture: 'ready'}),
    ...Array.from({length: 8}, (_, i) => row(-10 + i * 3, -40, i % 2 ? 90 : 270, 'far', 1510 + i)).flat(),
    tag({x: -3.75, y: 2.6, z: 0.3}, 'full · side-on', 's1', 26), tag({x: -0.55, y: 2.6, z: 0.3}, 'mid · side-on', 's2', 26), tag({x: 2.9, y: 2.6, z: 0}, 'full front · mid 3/4', 's3', 26),
  ];
  return scene(v, items, t, 'R3 silhouettes · deeper torso, knee guards, head brow + fins + crest, mid LOD keeps pauldrons, firmer ink');
};
void [seg, norm3, fwdH, STAND];
