// Section D4 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
//
// Every machine here is one of the aftermath tableau's (shots/EF/tableau.ts) on its way INTO that state: D4's last
// frames are the tableau. The arc that pressed the Crew at the start (start.ts ARC_START) follows them west and
// tightens into the east half of the ring round the van; the ring's west half and most of the outer ring come round
// the ridge's ends from the north and the south (the ring closing on every side, D4-6); heavy 2 walks the whole way
// from the crater to the van, is blinded and staggers off a slab, comes on again, rams, and steps back into its
// sector of the ring (TB_HEAVY2). The named units:
//   W1 7501  closest at the start: its hammer blow cracks the plate through (153.42); the Director's plate smashes
//            its chest plate off at 163.3 → falls NE at (13.4, −3.0) (TB_WRECKS[0])
//   W2 7502  the breaker's club tears its left arm off at 164.4 → falls S at (15.0, 3.9) (TB_WRECKS[1])
//   W3 7503  the cable round its shins (164.78), the Director's drive (165.02) → topples N at (16.8, −2.6) (TB_WRECKS[2])
//   H1 7101  tears the launcher out of the tether operator's hands (157.55); holds her wrist from 180.4
//   H5 7105  the south flanker: cuts across the runner's path and strikes him down (155.86); stands over him
//   H2–H4    ride with the arc, then hold the decoy maker (181.0), the flare carrier (181.7), the breaker (182.3)
//   drone 7601 dives on the drone pilot at 170.22, then holds low over the ring (TB_DRONES[0])
import type {UnitSpec, HeavySpec, DroneSpec, Path} from '../../mech';
import {V3, clamp, smooth, lerp, easeIn, easeOut, rnd} from '../../../kit/math';
import {M} from '../../timing';
import {TB_RING, TB_OUTER, TB_HOLDERS, TB_WRECKS, TB_HEAVY2, TB_DRONES, DIRECTOR_HEAD, T0 as TB_T0} from '../EF/tableau';
import {EV} from './times';
import {ARC_START, arcStartPos, HEAVY2_START} from './start';
import {BLOCK_PLATE, RUNNER_CHEST, LAUNCHER_FRONT, LAUNCHER_GRIP, tugGrip, STRIKE_PLATE, HEAVY_STRIKE, PILOT_DOWN, PLANT} from './marks';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, pathLen, fwdOf, headingTo, win, after, wrapD, quadSteps, heavyStance} from './motion';
import {avoid} from './obstacles';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const RING_C = {x: 11.4, z: 3.2};
const hv = (h: number): XZ => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});

// ================================================================== unit timelines
export type UStep =
  /** walk/run along a polyline (planted gait feet; A/D = accel/decel s; D > 0 ends in the standing stance) */
  | {k: 'walk'; pts: XZ[]; T0: number; T1: number; A?: number; D?: number; stride?: number; /** no obstacle bending */ raw?: boolean}
  /** keyed root (each key a stop) with planted steps */
  | {k: 'keys'; root: KR[]; feet?: {L: KP[]; R: KP[]}};
export type UPlan = {id: number; name: string; steps: UStep[]; eye?: 'cyan' | 'amber'; act?: (T: number) => Partial<UnitSpec>};

const stepT0 = (s: UStep) => (s.k === 'walk' ? s.T0 : s.root[0][0]);
const FEET = new WeakMap<object, {L: KP[]; R: KP[]}>();
const AVOIDED = new WeakMap<object, XZ[]>();
/** the unit's standing stance as autoSteps footholds (= the kit's standing feet: half hipW + 0.04, left 4 cm back) */
const stanceSteps = (root: KR[]) => autoSteps(root, {half: 0.19, stag: -0.04, stepLen: 0.55});

export const unitAt = (pl: UPlan, T: number): UnitSpec => {
  let i = 0;
  pl.steps.forEach((s, k) => { if (T >= stepT0(s)) i = k; });
  const s = pl.steps[i];
  const base: UnitSpec = {id: pl.id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, idle: 0.5, eye: pl.eye ?? 'cyan', key: `d4u${pl.id}`};
  let sp: UnitSpec;
  if (s.k === 'walk') {
    let pts = AVOIDED.get(s);
    if (!pts) AVOIDED.set(s, (pts = s.raw ? s.pts : avoid(s.pts, 0.62)));
    const L = pathLen(pts), A = s.A ?? 0.6, D = s.D ?? 0.6;
    const path: Path = linePath(pts, 1.4);
    const dist = runDist(Math.min(T, s.T1), s.T0, s.T1, L, A, D);
    const vc = cruise(s.T0, s.T1, L, A, D);
    const k = clamp(runSpeed(T, s.T0, s.T1, L, A, D) / Math.max(0.5, vc));
    const fast = clamp((vc - 1.8) / 2);
    const end = path(L);
    sp = {
      ...base, pos: end.pos, heading: end.heading,
      gait: {path, dist, stride: s.stride ?? 1.45 + 0.85 * fast, lift: 0.14 + 0.08 * fast, start: A > 0.25 ? 0 : undefined, end: D > 0 ? L : undefined},
      crouch: (0.03 + 0.16 * fast) * k, lean: (3 + 12 * fast) * k,
    };
  } else {
    const r = keyRoot(s.root, T);
    let feet = s.feet ?? FEET.get(s);
    if (!feet) FEET.set(s, (feet = stanceSteps(s.root)));
    sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: footAt(feet.L, T, 0.11), R: footAt(feet.R, T, 0.11)}};
  }
  return {...sp, ...(pl.act ? pl.act(T) : {})};
};
/** a walk whose last segment arrives along `h` (the unit stops facing h at p): approach point `back` m behind */
const arrive = (p: XZ, h: number, back = 2): XZ => ({x: p.x - hv(h).x * back, z: p.z - hv(h).z * back});
/** the active one of several strikes (each has a window −0.42 … +0.85 s around its contact) */
const pickStrike = (T: number, list: NonNullable<UnitSpec['strike']>[]) => list.find((s) => T > s.t0 - 0.43 && T < s.t0 + 0.86);

// ------------------------------------------------------------------ the Director's head (for the units' looks)
/** approximate head position of the Director through D4 (pure: from the choreography's key positions) */
export const dirHeadAt = (T: number): V3 => {
  const k: [number, number, number][] = [
    [M.P4, 36.6, 1.0], [150.8, 35.5, 1.1], [152.75, 29.6, 1.75], [154.6, 29.2, 1.8], [156.6, 22.5, 2.95], [159.8, 12.6, 0.3],
    [162.4, 12.65, 0.35], [163.3, 13.0, -2.3], [165.0, 15.9, -2.5], [168.5, 16.2, -2.0], [170.6, 14.2, 0.9], [175.0, 12.3, 5.7],
    [176.3, 12.2, 5.6], [177.42, 9.35, 3.45], [M.STRIKE, 9.15, 3.35], [178.0, 7.0, 3.42], [180.65, 6.6, 3.1],
  ];
  let x = k[0][1], z = k[0][2];
  if (T >= k[k.length - 1][0]) { x = k[k.length - 1][1]; z = k[k.length - 1][2]; }
  else for (let i = 1; i < k.length; i++) if (T <= k[i][0]) { const u = smooth((T - k[i - 1][0]) / (k[i][0] - k[i - 1][0])); x = lerp(k[i - 1][1], k[i][1], u); z = lerp(k[i - 1][2], k[i][2], u); break; }
  const down = smooth((T - 179.3) / 1.3);
  return {x, y: G(x, z) + lerp(1.6, 0.92, down), z};
};

// ------------------------------------------------------------------ W1 (7501): the blow on the plate; smashed at 163.3
const W1_TB = TB_WRECKS[0];
const W1_AT = {x: 31.64, z: 1.72};
const W1: UPlan = {
  id: 7501, name: 'W1', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[1]).pos, {x: 36.0, z: 1.25}, {x: 33.1, z: 1.6}, W1_AT], T0: M.P4, T1: 152.95, A: 1.0, D: 0.4},
    {k: 'keys', root: [[152.95, W1_AT.x, W1_AT.z, 263], [153.2, W1_AT.x, W1_AT.z, 270], [154.4, W1_AT.x + 0.12, W1_AT.z, 270], [154.9, W1_AT.x, W1_AT.z, 272]]},
    {k: 'walk', pts: [W1_AT, {x: 24.5, z: -0.5}, {x: 18.6, z: -2.8}, {x: 16.0, z: -2.95}, arrive(W1_TB.pos, W1_TB.heading, 1.2), W1_TB.pos], T0: 154.9, T1: 161.6, A: 0.5, D: 0.6},
    {k: 'keys', root: [[161.6, W1_TB.pos.x, W1_TB.pos.z, W1_TB.heading]]},
  ],
  act: (T) => {
    const dead = T >= W1_TB.fall.t0;
    return {
      strike: pickStrike(T, [{t0: EV.w1Swing, side: 'R', target: {x: BLOCK_PLATE.x + 0.06, y: BLOCK_PLATE.y + 0.04, z: BLOCK_PLATE.z}, kind: 'hammer'}]),
      raise: {t0: 162.55, t1: 163.35, side: 'R'},
      look: dead ? undefined : dirHeadAt(T),
      hits: [{t0: EV.w1Swing + 0.02, dir: {x: 1, y: 0, z: 0}, strength: 0.55}, {t0: EV.w1Smash, dir: {x: 0.85, y: 0, z: -0.5}, strength: 1.5}],
      fall: W1_TB.fall, damage: W1_TB.damage, idle: dead ? 0 : 0.45,
    };
  },
};

// ------------------------------------------------------------------ W2 (7502): its arm torn off by the club at 164.4
const W2_TB = TB_WRECKS[1];
const W2_WAIT = {x: 36.8, z: 2.5};
const W2: UPlan = {
  id: 7502, name: 'W2', eye: 'amber',
  steps: [
    // it closes on the block from the east and watches it (clear of the D4-1b lens), then follows the retreat
    {k: 'walk', pts: [arcStartPos(ARC_START[3]).pos, {x: 39.0, z: 3.0}, W2_WAIT], T0: M.P4, T1: 153.4, A: 0.2, D: 0.6},
    {k: 'keys', root: [[153.4, W2_WAIT.x, W2_WAIT.z, headingTo({x: 39.0, z: 3.0}, W2_WAIT)], [153.8, W2_WAIT.x, W2_WAIT.z, 268], [154.5, W2_WAIT.x, W2_WAIT.z, 266]]},
    {k: 'walk', pts: [W2_WAIT, {x: 32.6, z: 2.4}, {x: 27.0, z: 3.9}, {x: 24.0, z: 5.0}, {x: 20.0, z: 5.1}, arrive(W2_TB.pos, W2_TB.heading), W2_TB.pos], T0: 154.5, T1: 161.4, A: 0.5, D: 0.7},
    {k: 'keys', root: [[161.4, W2_TB.pos.x, W2_TB.pos.z, W2_TB.heading]]},
  ],
  act: (T) => {
    const dead = T >= W2_TB.fall.t0;
    return {
      // it raises its left arm to club the breaker down; the breaker's swing meets the arm first
      strike: T < EV.club ? pickStrike(T, [{t0: EV.club + 0.2, side: 'L', target: {x: 13.9, y: G(13.9, 4.3) + 1.5, z: 4.3}, kind: 'hammer'}]) : undefined,
      look: dead ? undefined : T < 163.5 ? dirHeadAt(T) : {x: 13.9, y: 1.5, z: 4.3},
      hits: [{t0: EV.club, dir: {x: 0.35, y: 0, z: 1}, strength: 1.3}],
      fall: W2_TB.fall, damage: W2_TB.damage, idle: dead ? 0 : 0.45,
    };
  },
};

// ------------------------------------------------------------------ W3 (7503): the cable round its shins; driven over
const W3_TB = TB_WRECKS[2];
const W3: UPlan = {
  id: 7503, name: 'W3', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[2]).pos, {x: 37.0, z: -3.6}, {x: 28.0, z: -3.9}, {x: 24.5, z: -2.6}, {x: 21.5, z: -3.0}, arrive(W3_TB.pos, W3_TB.heading), W3_TB.pos], T0: M.P4, T1: 161.9, A: 0.2, D: 0.7},
    {k: 'keys', root: [[161.9, W3_TB.pos.x, W3_TB.pos.z, W3_TB.heading]]},
  ],
  act: (T) => {
    const dead = T >= W3_TB.fall.t0;
    // it starts a step toward the tether operator as the cable binds its shins (164.78): it lurches, arms out
    const lurch = win(T, EV.cableWrap, W3_TB.fall.t0 + 0.1, 0.12, 0.1);
    return {
      look: dead ? undefined : T < 164.2 ? dirHeadAt(T) : {x: 15.3, y: 1.4, z: -1.1},
      raise: {t0: 164.1, t1: 164.95, side: 'R'},
      lean: dead ? undefined : 6 * lurch, twist: dead ? undefined : -10 * lurch,
      hits: [{t0: EV.cableHaul, dir: {x: -0.6, y: 0, z: 0.5}, strength: 0.45}, {t0: EV.w3Drive, dir: {x: 0.6, y: 0, z: -0.8}, strength: 1.4}],
      fall: W3_TB.fall, damage: W3_TB.damage, idle: dead ? 0 : 0.45,
    };
  },
};

// ------------------------------------------------------------------ H1 (7101): disarms the tether operator
const H1_TB = TB_HOLDERS[0];
const H1_AT = {x: 19.5, z: -1.3};
const H1_HOLD = {x: 21.0, z: -2.8}, H1_WAIT = {x: 16.25, z: -0.38};
/** H1's left fist through the disarm (world): reach → on the launcher's barrel → the tug → torn free, lifted, flung down */
export const h1Fist = (T: number): {hand: V3; w: number; open: boolean} | null => {
  if (T < 156.6 || T > 158.75) return null;
  const off = {x: LAUNCHER_FRONT.x - LAUNCHER_GRIP.x, y: LAUNCHER_FRONT.y - LAUNCHER_GRIP.y, z: LAUNCHER_FRONT.z - LAUNCHER_GRIP.z};
  const onL = (t: number) => { const g = tugGrip(t); return {x: g.x + off.x, y: g.y + off.y, z: g.z + off.z}; };
  const up: V3 = {x: 19.35, y: G(19.35, -1.55) + 2.05, z: -1.55}, slam: V3 = {x: 19.0, y: G(19.0, -1.0) + 0.75, z: -1.0};
  let hand: V3, w = 1;
  if (T < EV.disarmGrab) { w = smooth((T - 156.6) / (EV.disarmGrab - 156.6)); hand = onL(EV.disarmGrab); }
  else if (T < EV.disarmTear) hand = onL(T);
  else if (T < 157.85) hand = lerp3s(onL(EV.disarmTear), up, easeOut((T - EV.disarmTear) / 0.3));
  else if (T < EV.launcherDrop) hand = lerp3s(up, slam, easeIn((T - 157.85) / (EV.launcherDrop - 157.85)));
  else { hand = slam; w = 1 - smooth((T - EV.launcherDrop) / 0.6); }
  return {hand, w, open: T < EV.disarmGrab - 0.05 || T > EV.launcherDrop};
};
const H1: UPlan = {
  id: 7101, name: 'H1', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[0]).pos, {x: 31.0, z: -3.2}, {x: 23.0, z: -1.9}, arrive(H1_AT, 268, 1.5), H1_AT], T0: M.P4, T1: 156.75, A: 0.2, D: 0.5},
    {k: 'keys', root: [[156.75, H1_AT.x, H1_AT.z, 268], [EV.disarmGrab, H1_AT.x, H1_AT.z, 268], [157.5, H1_AT.x + 0.1, H1_AT.z, 268], [158.0, H1_AT.x - 0.05, H1_AT.z, 266], [170.4, H1_AT.x, H1_AT.z, 262], [170.7, H1_AT.x, H1_AT.z, 140]]},
    // out of heavy 2's way as it comes on; then round behind the fight to the tether operator (its tableau grip 180.4)
    {k: 'walk', pts: [H1_AT, H1_HOLD], T0: 170.7, T1: 171.9, A: 0.4, D: 0.5, raw: true},
    {k: 'keys', root: [[171.9, H1_HOLD.x, H1_HOLD.z, headingTo(H1_AT, H1_HOLD)], [172.4, H1_HOLD.x, H1_HOLD.z, 250], [175.5, H1_HOLD.x, H1_HOLD.z, 252], [175.8, H1_HOLD.x, H1_HOLD.z, headingTo(H1_HOLD, {x: 19.0, z: -2.4})]]},
    {k: 'walk', pts: [H1_HOLD, {x: 19.0, z: -2.4}, {x: 17.6, z: -1.2}, H1_WAIT], T0: 175.8, T1: 177.9, A: 0.4, D: 0.5, raw: true},
    {k: 'keys', root: [[177.9, H1_WAIT.x, H1_WAIT.z, headingTo({x: 17.6, z: -1.2}, H1_WAIT)], [178.4, H1_WAIT.x, H1_WAIT.z, headingTo(H1_WAIT, {x: 14.4, z: -1.0})]]},
    {k: 'walk', pts: [H1_WAIT, {x: 14.4, z: -1.0}, H1_TB.pos], T0: 178.4, T1: 179.7, A: 0.3, D: 0.4, raw: true},
    {k: 'keys', root: [[179.7, H1_TB.pos.x, H1_TB.pos.z, headingTo({x: 14.4, z: -1.0}, H1_TB.pos)], [179.95, H1_TB.pos.x, H1_TB.pos.z, H1_TB.heading]]},
  ],
  act: (T) => {
    const f = h1Fist(T);
    return {
      look: T < 159.5 ? {x: LAUNCHER_GRIP.x - 0.3, y: LAUNCHER_GRIP.y + 0.35, z: LAUNCHER_GRIP.z} : T > 179.4 ? {x: 12.4, y: 1.4, z: 0.5} : dirHeadAt(T),
      armL: f && f.w > 0.02 ? {hand: f.w >= 1 ? f.hand : lerp3s(restHand(T, 'L'), f.hand, f.w), open: f.open} : undefined,
      hits: [{t0: EV.disarmTear, dir: {x: 0.6, y: 0, z: 0}, strength: 0.4}],
      crouch: 0.06 * win(T, 157.85, 158.6, 0.15, 0.3), lean: 8 * win(T, 157.85, 158.6, 0.15, 0.3),
    };
  },
};
/** a unit's resting left/right fist (approx., world) for blending a hand control in and out (from H1's keyed root) */
const restHand = (T: number, side: 'L' | 'R'): V3 => {
  const sp = unitAt({...H1, act: undefined}, T);
  const f = fwdOf(sp.heading), r = {x: Math.cos((sp.heading * Math.PI) / 180), z: Math.sin((sp.heading * Math.PI) / 180)};
  const sd = side === 'L' ? -1 : 1;
  return {x: sp.pos.x + f.x * 0.12 + r.x * sd * 0.42, y: G(sp.pos.x, sp.pos.z) + 0.9, z: sp.pos.z + f.z * 0.12 + r.z * sd * 0.42};
};
/** where the torn launcher ends up (thrown down at 158.1) */
export const LAUNCHER_REST = {x: 18.92, z: -0.86, yaw: 205};

// ------------------------------------------------------------------ H5 (7105): strikes the runner down, stands over him
const H5_TB = TB_HOLDERS[4];
const H5_AT = {x: 16.55, z: 8.35};
const H5: UPlan = {
  id: 7105, name: 'H5', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[4]).pos, {x: 31.0, z: 10.4}, {x: 22.0, z: 9.9}, {x: 17.85, z: 9.05}, H5_AT], T0: M.P4, T1: 155.45, A: 0.25, D: 0.3},
    {k: 'keys', root: [[155.45, H5_AT.x, H5_AT.z, 298], [155.66, H5_AT.x - 0.05, H5_AT.z - 0.05, 66], [157.4, H5_AT.x - 0.05, H5_AT.z - 0.05, 66],
      [158.3, 16.95, 6.8, 78], [159.0, 18.55, 6.05, 140], [159.45, H5_TB.pos.x, H5_TB.pos.z, H5_TB.heading]]},
  ],
  act: (T) => ({
    strike: pickStrike(T, [{t0: EV.runnerHit, side: 'R', target: RUNNER_CHEST, kind: 'punch'}]),
    look: T < EV.runnerHit + 0.4 ? {x: RUNNER_CHEST.x, y: RUNNER_CHEST.y + 0.35, z: RUNNER_CHEST.z} : H5_TB.look ?? {x: 18.1, y: 0.2, z: 7.6},
    crouch: lerp(0, H5_TB.crouch, smooth((T - 158.9) / 0.8)), lean: lerp(0, H5_TB.lean, smooth((T - 158.9) / 0.8)),
    idle: lerp(0.5, 0.18 * 0.6, smooth((T - 158.9) / 0.8)),
  }),
};

// ------------------------------------------------------------------ H2–H4: ride with the arc, then hold the others
const holderPlan = (idx: 1 | 2 | 3, arcI: number, hold: XZ, via: XZ[], approach: [number, number]): UPlan => {
  const tb = TB_HOLDERS[idx];
  const a = arcStartPos(ARC_START[arcI]);
  const holdH = headingTo(hold, RING_C);
  return {
    id: tb.id, name: tb.key, eye: 'amber',
    steps: [
      {k: 'walk', pts: [a.pos, {x: lerp(a.pos.x, hold.x, 0.45), z: lerp(a.pos.z, hold.z, 0.45) + 0.8}, arrive(hold, holdH, 1.5), hold], T0: M.P4, T1: 160.6 + idx * 0.4, A: 0.2, D: 0.6},
      {k: 'keys', root: [[160.6 + idx * 0.4, hold.x, hold.z, holdH], [approach[0], hold.x, hold.z, holdH + 4]]},
      {k: 'walk', pts: [hold, ...via, tb.pos], T0: approach[0], T1: approach[1] - 0.35, A: 0.5, D: 0.5},
      {k: 'keys', root: [[approach[1] - 0.35, tb.pos.x, tb.pos.z, headingTo(via[via.length - 1], tb.pos)], [approach[1], tb.pos.x, tb.pos.z, tb.heading]]},
    ],
    act: (T) => ({look: T < approach[0] ? dirHeadAt(T) : undefined}),
  };
};
const H2 = holderPlan(1, 18, {x: 21.5, z: 12.4}, [{x: 15.6, z: 10.1}, {x: 13.2, z: 8.6}, {x: 12.9, z: 7.0}], [176.9, EV.grabDecoy - 0.55]);
const H3 = holderPlan(2, 17, {x: 24.4, z: 11.0}, [{x: 18.6, z: 9.9}, {x: 15.9, z: 8.45}], [177.9, EV.grabFlares - 0.55]);
const H4 = holderPlan(3, 16, {x: 17.6, z: 14.6}, [{x: 14.4, z: 9.4}, {x: 11.4, z: 8.6}], [178.3, EV.grabBreaker - 0.55]);
/** when each holder's tableau spec takes over (the reach before the grab starts at t0 − 0.5) */
export const HOLDER_FINAL: Record<number, number> = {7101: 179.95, 7102: EV.grabDecoy - 0.55, 7103: EV.grabFlares - 0.55, 7104: EV.grabBreaker - 0.55, 7105: 159.75};

// ------------------------------------------------------------------ the ring: the arc tightens (east), the rest closes in
type Slot = {id: number; pos: V3; heading: number};
const slotOf = (id: number): Slot => (TB_RING.find((u) => u.id === id) ?? TB_OUTER.find((u) => u.id === id))!;
const outward = (p: XZ, d: number): XZ => {
  const dx = p.x - RING_C.x, dz = p.z - RING_C.z, L = Math.hypot(dx, dz) || 1;
  return {x: p.x + (dx / L) * d, z: p.z + (dz / L) * d};
};
/** an escort unit: from the start arc, alongside the retreat, to a hold point outside its slot; it closes in later */
const escortPlan = (a: (typeof ARC_START)[number], j: number): UPlan => {
  const s = slotOf(a.id);
  const outer = a.id >= 7300;
  const hold = outward(s.pos, outer ? 3.2 : 3.6);
  const st = arcStartPos(a);
  const holdH = headingTo(hold, RING_C);
  // they keep pace with the retreat (≤ ≈ 2.7 m/s), the far ones arriving later
  const Lw = pathLen([st.pos, arrive(hold, holdH, 1.5), hold]);
  const tHold = Math.max(159.4, M.P4 + Lw / 2.7) + rnd(a.id * 7) * 1.2;
  const tIn = Math.max(tHold + 1, 168.2 + (j % 6) * 0.9 + rnd(a.id * 3) * 0.8);
  const tSet = tIn + 3.0 + rnd(a.id * 5) * 1.4 + (outer ? 2.5 : 0);
  return {
    id: a.id, name: `esc${a.id}`, eye: 'cyan',
    steps: [
      {k: 'walk', pts: [st.pos, arrive(hold, holdH, 1.5), hold], T0: M.P4, T1: tHold, A: 0.2, D: 0.6},
      {k: 'keys', root: [[tHold, hold.x, hold.z, holdH], [tIn, hold.x, hold.z, holdH]]},
      {k: 'walk', pts: [hold, arrive(s.pos, s.heading, 1.2), s.pos], T0: tIn, T1: tSet, A: 0.5, D: 0.6},
      {k: 'keys', root: [[tSet, s.pos.x, s.pos.z, s.heading]]},
    ],
    act: (T) => ({look: T < tIn ? dirHeadAt(T) : undefined, idle: T > tSet ? 0.18 : 0.45}),
  };
};
const ESCORT_IDS = new Set(ARC_START.filter((a) => a.role === 'ring' || a.role === 'outer').map((a) => a.id));
const ESCORT: UPlan[] = ARC_START.filter((a) => ESCORT_IDS.has(a.id)).map((a, j) => escortPlan(a, j));
/** the ring's west half and the outer ring's: round the ridge's north and south ends (they appear on the crest) */
const flankPlan = (s: Slot, j: number): UPlan => {
  const north = s.pos.z < RING_C.z;
  const sz = north ? -1 : 1;
  // radially in from well outside the slot (spread by bearing), having come round the ridge's end from the north/south
  const out = outward(s.pos, 3.0);
  const via = outward(s.pos, 8.5);
  const start: XZ = {x: via.x + 4 + rnd(s.id * 3) * 2, z: via.z + sz * (13 + rnd(s.id * 5) * 3)};
  const T0 = 162.5 + (j % 7) * 0.9 + rnd(s.id * 11) * 1.2;
  const T1 = 179.0 + rnd(s.id * 13) * 4.5 + (s.id >= 7300 ? 1.0 : 0);
  return {
    id: s.id, name: `flk${s.id}`, eye: 'cyan',
    steps: [
      {k: 'walk', pts: [start, via, arrive(s.pos, s.heading, 1.4), s.pos], T0, T1, A: 0.6, D: 0.7},
      {k: 'keys', root: [[T1, s.pos.x, s.pos.z, s.heading]]},
    ],
    act: (T) => ({idle: T > T1 ? 0.18 : 0.4}),
  };
};
const FLANK: UPlan[] = [...TB_RING, ...TB_OUTER].filter((u) => !ESCORT_IDS.has(u.id)).map((u, j) => flankPlan(u, j));
/** when each ring unit is set in its tableau slot (its tableau spec draws from then on) */
export const RING_SET: Record<number, number> = {};
[...ESCORT, ...FLANK].forEach((p) => { const k = p.steps[p.steps.length - 1]; if (k.k === 'keys') RING_SET[p.id] = k.root[0][0] + 0.25; });

export const NAMED: Record<string, UPlan> = {W1, W2, W3, H1, H5, H2, H3, H4};
export const RING_PLANS: UPlan[] = [...ESCORT, ...FLANK];
export const unitD4 = (name: string, T: number): UnitSpec => unitAt(NAMED[name], T);

// ================================================================== HEAVY 2
// Hull root: one line out of the crater (heading 262) to the stop where it is blinded; it staggers back off a slab
// (166.41), recovers, comes on to the van (176.3), rams (177.76), steps back into the ring's open sector (TB_HEAVY2).
type HSeg = {t0: number; t1: number; a: [number, number, number]; b: [number, number, number]; ease: (u: number) => number};
/** a constant-speed walk with a decelerating tail (it was already walking at the cut in) */
const cruiseStop = (tail: number) => (u: number) => (u < 1 - tail ? u / (1 - tail / 2) : (1 - tail + tail * (1 - (1 - (u - (1 - tail)) / tail) ** 2) / 2) / (1 - tail / 2));
const L262 = (x: number): [number, number, number] => [x, 2.2 + (20.2 - x) * Math.tan((8 * Math.PI) / 180), 262];
export const H2_STOP = L262(24.7), H2_BACK: [number, number, number] = [26.15, 1.42, 263];
export const H2_SLAB = {x: 29.3, z: 3.55};
const HSEGS: HSeg[] = [
  {t0: M.P4, t1: 165.95, a: [HEAVY2_START.pos.x, HEAVY2_START.pos.z, 262], b: H2_STOP, ease: cruiseStop(0.12)},
  {t0: 166.2, t1: 167.3, a: H2_STOP, b: H2_BACK, ease: (u) => easeOut(u)},
  {t0: EV.heavyGo, t1: 176.3, a: H2_BACK, b: [HEAVY_STRIKE.x, HEAVY_STRIKE.z, HEAVY_STRIKE.h], ease: smooth},
  {t0: EV.heavyBack, t1: EV.heavyBackEnd, a: [HEAVY_STRIKE.x, HEAVY_STRIKE.z, HEAVY_STRIKE.h], b: [TB_HEAVY2.pos.x, TB_HEAVY2.pos.z, TB_HEAVY2.heading], ease: smooth},
];
export const heavy2Root = (T: number): {x: number; z: number; h: number} => {
  let r = HSEGS[0].a;
  for (const s of HSEGS) {
    if (T < s.t0) break;
    const u = s.ease(clamp((T - s.t0) / (s.t1 - s.t0)));
    r = [lerp(s.a[0], s.b[0], u), lerp(s.a[1], s.b[1], u), s.a[2] + wrapD(s.b[2] - s.a[2]) * u];
  }
  // before the cut (D3's last frames) it walks on the same line
  if (T < M.P4) { const v = HEAVY2_START.speed, f = hv(262); return {x: HSEGS[0].a[0] - f.x * v * (M.P4 - T), z: HSEGS[0].a[1] - f.z * v * (M.P4 - T), h: 262}; }
  return {x: r[0], z: r[1], h: r[2]};
};
/** heavy 2's planted feet: generated per move (lateral sequence), plus the slip off the slab at the stumble */
const H2_FEET: KP[][] = (() => {
  const legs: KP[][] = [[], [], [], []];
  // the long walk: already in motion at the cut (cycle ≈ 1.45 s at 2.05 m/s)
  const walk = (s: HSeg, cyc: number, first: boolean) => {
    const n = Math.max(1, Math.round((s.t1 - s.t0) / cyc)), c0 = (s.t1 - s.t0) / n, sw = c0 * 0.25;
    const order = [0, 3, 1, 2];
    const at = (t: number) => heavy2Root(t);
    if (first) [0, 1, 2, 3].forEach((i) => { const r = at(s.t0 - c0 * 0.55); legs[i].push([s.t0 - 2, ...heavyStance(r.x, r.z, r.h, i)] as KP); });
    for (let c = 0; c < n; c++) order.forEach((i, j) => {
      const t0 = s.t0 + c * c0 + j * sw - (first && c === 0 ? 0 : 0), t1 = t0 + sw * 0.92;
      const r = at(c === n - 1 ? s.t1 : Math.min(s.t1, t1 + c0 * 0.4));
      const p = heavyStance(r.x, r.z, r.h, i);
      const L = legs[i];
      L.push([t0, L[L.length - 1][1], L[L.length - 1][2]], [t1, p[0], p[1], 0.55]);
    });
  };
  walk(HSEGS[0], 1.45, true);
  // blinded (166.14): it rears; stumble (166.41): stepping back, the rear-left foot lands on the slab's edge, the slab
  // tips and the foot slips off; the others step back to catch it
  const b = heavy2Root(167.3);
  const back = (i: number) => heavyStance(b.x, b.z, b.h, i);
  const L = legs;
  const hold = (i: number, t: number) => L[i].push([t, L[i][L[i].length - 1][1], L[i][L[i].length - 1][2]]);
  [0, 1, 2, 3].forEach((i) => hold(i, 166.18));
  const rl = back(2);
  L[2].push([166.38, H2_SLAB.x - 0.25, H2_SLAB.z - 0.05, 0.6]); // onto the slab edge
  L[2].push([EV.stumble + 0.02, H2_SLAB.x - 0.25, H2_SLAB.z - 0.05], [166.62, rl[0] + 0.55, rl[1] + 0.45, 0]); // the slip (a slide)
  L[3].push([166.42, L[3][L[3].length - 1][1], L[3][L[3].length - 1][2]], [166.78, ...back(3), 0.45] as KP);
  L[0].push([166.62, L[0][L[0].length - 1][1], L[0][L[0].length - 1][2]], [166.98, ...back(0), 0.5] as KP);
  L[1].push([166.85, L[1][L[1].length - 1][1], L[1][L[1].length - 1][2]], [167.22, ...back(1), 0.5] as KP);
  L[2].push([167.05, rl[0] + 0.55, rl[1] + 0.45], [167.42, rl[0], rl[1], 0.35]);
  // comes on again; then steps back into its sector
  const add = (seg: HSeg, cyc: number, order?: number[]) => {
    const root: KR[] = [[seg.t0, seg.a[0], seg.a[1], seg.a[2]], [seg.t1, seg.b[0], seg.b[1], seg.b[2]]];
    const q = quadSteps(root, {cycle: cyc, lift: 0.5, order});
    // quadSteps assumes smooth easing between keys: same as these segments
    q.forEach((k, i) => k.slice(1).forEach((kk) => L[i].push(kk)));
  };
  add(HSEGS[2], 1.9);
  add(HSEGS[3], 2.1, [1, 2, 0, 3]);
  return L;
})();
/** foot on the slab (raised by its thickness) before the slip */
const footY = (i: number, T: number, p: V3): V3 => (i === 2 && T > 166.3 && T < EV.stumble + 0.03 && Math.hypot(p.x - (H2_SLAB.x - 0.25), p.z - (H2_SLAB.z - 0.05)) < 0.4 ? {...p, y: p.y + 0.3 * smooth((T - 166.3) / 0.08)} : p);

export const heavy2At = (T: number): HeavySpec => {
  // from the moment it has settled back in its sector, it IS the tableau's heavy 2
  if (T >= EV.heavyBackEnd + 0.6) return {id: TB_HEAVY2.id, t: T, pos: TB_HEAVY2.pos, heading: TB_HEAVY2.heading, look: TB_HEAVY2.look, eye: TB_HEAVY2.eye, ground, key: 'tb_heavy2'};
  const r = heavy2Root(T);
  const feet = H2_FEET.map((k, i) => footY(i, T, footAt(k, T, 0.5)));
  // look: the Crew → the flare (blinded: the head jerks up and away) → the drone pilot (the ram's target) → the Director
  const blind = win(T, EV.flareHit, 169.0, 0.05, 1.2);
  const look: V3 = T < 175.6 ? (T < EV.flareHit ? dirHeadAt(T) : {x: r.x - 8 + 6 * blind, y: 6 + 4 * blind, z: r.z + 4 * blind})
    : T < M.STRIKE + 0.6 ? {x: PILOT_DOWN.x, y: G(PILOT_DOWN.x, PILOT_DOWN.z) + 0.7, z: PILOT_DOWN.z} : DIRECTOR_HEAD;
  const dip = 0.32 * win(T, EV.stumble, 167.6, 0.12, 0.9);
  return {
    id: TB_HEAVY2.id, t: T, pos: {x: r.x, y: 0, z: r.z}, heading: r.h, ground, key: 'tb_heavy2', eye: 'amber',
    feet, drop: dip, look,
    stumble: {t0: EV.stumble, dir: {x: 0.55, y: 0, z: 0.85}, strength: 1.3},
    ram: {t0: M.STRIKE, target: STRIKE_PLATE},
    stepOver: [],
  };
};
/** heavy 2's footfalls (time, world point) for dust and the ground shake (sound) */
export const heavy2Footfalls = (Ta: number, Tb: number): {t: number; pos: V3; leg: number}[] => {
  const out: {t: number; pos: V3; leg: number}[] = [];
  H2_FEET.forEach((k, leg) => k.forEach((kk, j) => {
    if (j === 0) return;
    const prev = k[j - 1];
    if (Math.hypot(kk[1] - prev[1], kk[2] - prev[2]) < 0.05) return;
    if (kk[0] > Ta && kk[0] <= Tb) out.push({t: kk[0], pos: onG(kk[1], kk[2]), leg});
  }));
  return out.sort((a, b) => a.t - b.t);
};

// ================================================================== drones: into their tableau places
type DKey = [number, number, number, number];
const DRONE_KEYS: Record<number, DKey[]> = {
  // the diver: follows the fight, dives on the drone pilot at 170.22, rebounds up the way it came (away from D4-5's
  // lens), then settles low over the ring
  7601: [[M.P4, 46, 7.5, 7], [158, 24, 7.5, 7], [165.5, 17.5, 7.8, 7.6], [169.45, 15.4, 7.2, 7.2], [170.22, 11.42, 1.66, 3.97], [170.62, 12.0, 3.1, 3.5], [172.6, 8.8, 5.0, 7.2], [175.5, 6.2, 5.6, 9.4]],
  7602: [[M.P4, 50, 9, -6], [160, 26, 8.5, -5.5], [170, 17, 7.2, -4.6], [178, 14.5, 6.4, -3.8]],
  7603: [[M.P4, 44, 12, -12], [162, 20, 11, -9], [172, 7, 9.6, -4.5], [179, 3.2, 9.2, -2.6]],
  7604: [[M.P4, 48, 10, 12], [161, 27, 9, 12], [171, 20, 8.2, 11], [178.5, 17.4, 7.6, 10.2]],
  7605: [[M.P4, 64, 22, -8], [175, 41, 21, -9], [183, 38, 21, -9]],
  7606: [[M.P4, 84, 30, 6], [183, 66, 29, 7]],
  7607: [[M.P4, 70, 17, 12], [180, 52, 16, 13]],
  7608: [[M.P4, 110, 34, -12], [183, 94, 34, -12]],
};
const kxyz = (k: DKey[], T: number): V3 => {
  if (T <= k[0][0]) return {x: k[0][1], y: k[0][2], z: k[0][3]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const u = (T - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
    // the dive accelerates into the hit, the pull-up decelerates
    const e = k[i][0] === EV.droneHit ? easeIn(u) : k[i - 1][0] === EV.droneHit ? easeOut(u) : smooth(u);
    return {x: lerp(k[i - 1][1], k[i][1], e), y: lerp(k[i - 1][2], k[i][2], e), z: lerp(k[i - 1][3], k[i][3], e)};
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};
export const droneD4 = (id: number, T: number): DroneSpec => {
  const tb = TB_DRONES.find((d) => d.id === id)!;
  const k = DRONE_KEYS[id];
  // hovering sway, dying away into the tableau's stillness
  // (none on the diver through its dive: it must hit her head where the keys put it)
  const sway = (1 - smooth((T - (k[k.length - 1][0] - 1)) / 4)) * (id === 7601 ? 1 - win(T, 168.9, 171.2, 0.5, 0.6) : 1);
  const s = (f: number, p: number) => Math.sin(T * f + id * p) * sway;
  const p0 = kxyz(k, T);
  const pos = {x: p0.x + s(0.37, 1.3) * 0.6, y: p0.y + s(0.6, 2.1) * 0.25, z: p0.z + s(0.29, 0.7) * 0.6};
  const p1 = kxyz(k, T + 0.05), pm = kxyz(k, T - 0.05);
  const vel = {x: (p1.x - pm.x) * 10, y: (p1.y - pm.y) * 10, z: (p1.z - pm.z) * 10};
  const moving = Math.hypot(vel.x, vel.z) > 0.6;
  const heading = moving ? (Math.atan2(vel.x, -vel.z) * 180) / Math.PI : tb.heading;
  const diving = id === 7601 && T > 169.3 && T < 170.5;
  const look = diving ? {x: 11.45, y: 1.6, z: 4.0} : T > 182 ? tb.look : dirHeadAt(T);
  return {id, t: T, pos, heading: moving ? heading : tb.heading + wrapD(heading - tb.heading) * 0, vel, look, eye: id === 7601 ? 'amber' : tb.eye, ground, key: `tb_d${id}`,
    mark: id === 7601 && T > 168.9 && T < 170.1 ? {target: {x: 11.45, y: 1.5, z: 4.0}, color: 'amber'} : undefined};
};
export const DRONE_IDS = TB_DRONES.map((d) => d.id);

// ------------------------------------------------------------------ checks for later sections
export const D4_END = TB_T0;
void [after, PLANT];
