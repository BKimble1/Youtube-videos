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
import {solveHeavy, HEAVY_DIM, unitAttach} from '../../mech';
import {V3, clamp, smooth, lerp, easeIn, easeOut, rnd} from '../../../kit/math';
import {M} from '../../timing';
import {TB_RING, TB_OUTER, TB_HOLDERS, TB_WRECKS, TB_HEAVY2, TB_DRONES, TB_CREW, DIRECTOR_HEAD, T0 as TB_T0, w1Ground} from '../EF/tableau';
import {EV} from './times';
import {ARC_START, arcStartPos, HEAVY2_START} from './start';
import {BLOCK_PLATE, RUNNER_CHEST, LAUNCHER_FRONT, LAUNCHER_GRIP, tugGrip, STRIKE_PLATE, HEAVY_STRIKE, PILOT_DOWN, PLANT} from './marks';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, chordPath, pathLen, fwdOf, headingTo, win, after, wrapD, quadSteps, heavyStance} from './motion';
import {avoid, pushOut} from './obstacles';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const RING_C = {x: 11.4, z: 3.2};
const hv = (h: number): XZ => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});

// ================================================================== unit timelines
export type UStep =
  /** walk/run along a polyline (planted gait feet; A/D = accel/decel s; D > 0 ends in the standing stance) */
  | {k: 'walk'; pts: XZ[]; T0: number; T1: number; A?: number; D?: number; stride?: number; /** no obstacle bending */ raw?: boolean}
  /** keyed root (each key a stop) with planted steps */
  | {k: 'keys'; root: KR[]; feet?: {L: KP[]; R: KP[]}; /** the kit's own standing feet (a static stop: = the tableau's spec) */ kitFeet?: boolean};
export type UPlan = {id: number; name: string; steps: UStep[]; eye?: 'cyan' | 'amber'; act?: (T: number) => Partial<UnitSpec>};

const stepT0 = (s: UStep) => (s.k === 'walk' ? s.T0 : s.root[0][0]);
const FEET = new WeakMap<object, {L: KP[]; R: KP[]}>();
const AVOIDED = new WeakMap<object, XZ[]>();
/** the unit's standing stance as autoSteps footholds (= the kit's standing feet: half hipW + 0.04, left 4 cm back) */
const stanceSteps = (root: KR[]) => autoSteps(root, {half: 0.19, stag: -0.04, stepLen: 0.55});

/** the ground a walking unit's pelvis rides on: the kerbs' 0.15 m steps eased into 0.45 m ramps (feet stay planted
 *  within a few centimetres; the body no longer jumps a kerb in one frame) */
const G_SOFT = (x: number, z: number) => { let a = 0; for (let k = -5; k <= 5; k++) a += G(x + 0.032 * k, z + 0.04 * k); return a / 11; };
const softFor = (w: number) => (w <= 0.001 ? G : w >= 0.999 ? G_SOFT : (x: number, z: number) => lerp(G(x, z), G_SOFT(x, z), w));
const walkPts = (s: Extract<UStep, {k: 'walk'}>): XZ[] => {
  let pts = AVOIDED.get(s);
  if (!pts) AVOIDED.set(s, (pts = s.raw ? s.pts : avoid(s.pts, 0.62, 0.4, {T: s.T0})));
  return pts;
};
/** once per plan: a keyed stop after a walk starts on the walk's own end heading, and the last key before a walk ends
 *  on the walk's first heading (the routed path's, not the planned one's) — no turn in one frame either way */
const PREPPED = new WeakSet<object>();
const prep = (pl: UPlan) => {
  if (PREPPED.has(pl)) return;
  PREPPED.add(pl);
  pl.steps.forEach((s, i) => {
    if (s.k !== 'keys') return;
    const prev = pl.steps[i - 1], next = pl.steps[i + 1];
    if (prev && prev.k === 'walk') {
      const pts = walkPts(prev);
      s.root[0] = [s.root[0][0], s.root[0][1], s.root[0][2], chordPath(pts, 0.7)(pathLen(pts)).heading];
    }
    if (next && next.k === 'walk' && s.root.length > 1) {
      const pts = walkPts(next);
      const k = s.root[s.root.length - 1];
      s.root[s.root.length - 1] = [k[0], k[1], k[2], chordPath(pts, 0.7)(0).heading];
    }
  });
};

export const unitAt = (pl: UPlan, T: number): UnitSpec => {
  prep(pl);
  let i = 0;
  pl.steps.forEach((s, k) => { if (T >= stepT0(s)) i = k; });
  const s = pl.steps[i];
  const base: UnitSpec = {id: pl.id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, idle: 0.5, eye: pl.eye ?? 'cyan', key: `d4u${pl.id}`};
  let sp: UnitSpec;
  if (s.k === 'walk') {
    const pts = walkPts(s);
    const L = pathLen(pts), A = s.A ?? 0.6, D = s.D ?? 0.6;
    const path: Path = chordPath(pts, 0.7);
    const dist = runDist(Math.min(T, s.T1), s.T0, s.T1, L, A, D);
    const vc = cruise(s.T0, s.T1, L, A, D);
    const k = clamp(runSpeed(T, s.T0, s.T1, L, A, D) / Math.max(0.5, vc));
    const fast = clamp((vc - 1.8) / 2);
    const end = path(L);
    sp = {
      // (the softened ground mid-walk only: a walk starts and ends on the true ground, where the feet stand still)
      ...base, pos: end.pos, heading: end.heading, ground: softFor(smooth((T - s.T0) / 0.5) * (1 - smooth((T - (s.T1 - 0.5)) / 0.5))),
      gait: {path, dist, stride: s.stride ?? 1.45 + 0.85 * fast, lift: 0.14 + 0.08 * fast, start: A > 0.25 ? 0 : undefined, end: D > 0 ? L : undefined},
      crouch: (0.03 + 0.16 * fast) * k, lean: (3 + 12 * fast) * k,
    };
  } else {
    const r = keyRoot(s.root, T);
    if (s.kitFeet) sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h};
    else {
      let feet = s.feet ?? FEET.get(s);
      if (!feet) FEET.set(s, (feet = stanceSteps(s.root)));
      sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: footAt(feet.L, T, 0.11), R: footAt(feet.R, T, 0.11)}};
    }
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
    [175.5, 12.78, 6.36], [176.35, 12.8, 6.4], [177.42, 9.35, 3.45], [M.STRIKE, 9.15, 3.35], [178.0, 7.0, 3.42], [180.65, 6.6, 3.1],
  ];
  let x = k[0][1], z = k[0][2];
  if (T >= k[k.length - 1][0]) { x = k[k.length - 1][1]; z = k[k.length - 1][2]; }
  else for (let i = 1; i < k.length; i++) if (T <= k[i][0]) { const u = smooth((T - k[i - 1][0]) / (k[i][0] - k[i - 1][0])); x = lerp(k[i - 1][1], k[i][1], u); z = lerp(k[i - 1][2], k[i][2], u); break; }
  const down = smooth((T - 179.3) / 1.3);
  return {x, y: G(x, z) + lerp(1.6, 0.92, down), z};
};

// ------------------------------------------------------------------ the Crew's places the machines aim at (pure)
/** a survivor's head where the tableau holds them (for the securing units' attention after the strike) */
const crewHead = (role: keyof typeof TB_CREW, up = 1.25): V3 => ({x: TB_CREW[role].pos.x, y: TB_CREW[role].pos.y + up, z: TB_CREW[role].pos.z});
/** D4's securing ends here: from 184.95 the tableau's own (EF ringSpecs: 'ready' at readyAt, its scans and attention) */
export const SECURE_END = 184.3;
/**
 * What a ring unit standing in its slot does in D4 on top of the tableau's spec (EF ringSpecs, which keeps it 'idle'
 * until its readyAt): it scans the area with pauses, and after the strike its attention snaps to the nearest survivor
 * and tracks them. All of it ends by SECURE_END (fading over 0.5 s), before the tableau's own securing begins, so at
 * FINAL_HIT the unit is exactly the tableau's.
 */
export const ringExtras = (id: number, tSet: number): Pick<UnitSpec, 'scan' | 'attend'> => {
  const slot = slotOf(id).pos;
  const nearest = (['tether', 'decoy', 'flares', 'breaker', 'runner', 'drone'] as const)
    .map((r) => ({r, d: Math.hypot(TB_CREW[r].pos.x - slot.x, TB_CREW[r].pos.z - slot.z)})).sort((a, b) => a.d - b.d)[0];
  const tA = Math.max(tSet + 0.6, staggerT(id, M.STRIKE + 1.2, 2.2, 9));
  const att = nearest.d < 9.5 && tA < SECURE_END - 0.5;
  return {
    scan: {t0: tSet + 0.35 + rnd(id * 5) * 0.5, t1: att ? tA : SECURE_END, center: {x: RING_C.x - 1.5, y: 1.0, z: RING_C.z + 0.5}, span: 64, dwell: 0.9, seed: id},
    attend: att ? [{t0: tA, at: crewHead(nearest.r, nearest.r === 'runner' ? 0.25 : nearest.r === 'drone' ? 0.6 : 1.15), t1: SECURE_END, turn: false}] : undefined,
  };
};
/** a per-unit start offset (seeded): staggered, never synchronised */
const staggerT = (id: number, t0: number, spread: number, salt: number) => t0 + rnd(id * 13 + salt) * spread;

// ------------------------------------------------------------------ W1 (7501): THE PLATE answered; smashed at ARRIVAL
const W1_TB = TB_WRECKS[0];
const W1_AT = {x: 31.64, z: 1.72};
/** it follows the displacement: two step-drags after him, re-chambering */
const W1_PRESS = [{x: W1_AT.x - 0.28, z: W1_AT.z + 0.02}, {x: W1_AT.x - 0.62, z: W1_AT.z + 0.03}];
const W1: UPlan = {
  id: 7501, name: 'W1', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[1]).pos, {x: 36.0, z: 1.25}, {x: 33.1, z: 1.6}, W1_AT], T0: M.P4, T1: 152.95, A: 1.0, D: 0.4},
    {k: 'keys', root: [[152.95, W1_AT.x, W1_AT.z, 263], [153.2, W1_AT.x, W1_AT.z, 270], [EV.w1Press, W1_AT.x, W1_AT.z, 270], [154.02, W1_PRESS[0].x, W1_PRESS[0].z, 270], [154.32, W1_PRESS[1].x, W1_PRESS[1].z, 268], [154.95, W1_PRESS[1].x, W1_PRESS[1].z, 266]]},
    {k: 'walk', pts: [W1_PRESS[1], {x: 24.5, z: -0.5}, {x: 18.6, z: -2.8}, {x: 16.0, z: -2.95}, arrive(W1_TB.pos, W1_TB.heading, 1.2), W1_TB.pos], T0: 154.95, T1: 161.6, A: 0.5, D: 0.6},
    {k: 'keys', root: [[161.6, W1_TB.pos.x, W1_TB.pos.z, W1_TB.heading]], kitFeet: true},
  ],
  act: (T) => {
    const dead = T >= W1_TB.fall.t0;
    return {
      strikes: [
        // the hammer on the plate (the crack goes right through); the hook at his head as he turns away (he ducks it)
        {t0: EV.w1Swing, side: 'R', target: {x: BLOCK_PLATE.x + 0.06, y: BLOCK_PLATE.y + 0.04, z: BLOCK_PLATE.z}, kind: 'hammer'},
        {t0: EV.w1Hook, side: 'L', target: onG(30.12, 1.76, 1.62), kind: 'hook'},
        // ARRIVAL: it swings first at the charging Director — he ducks under it into its open chest
        {t0: EV.w1Hammer, side: 'R', target: onG(12.86, -1.72, 1.66), kind: 'hook'},
      ],
      posture: [[-1, 'guard'], [W1_TB.fall.t0 + 0.9, 'idle']],
      look: dead ? undefined : dirHeadAt(T),
      hits: [{t0: EV.w1Swing + 0.02, dir: {x: 1, y: 0, z: 0}, strength: 0.55}, {t0: EV.w1Smash, dir: {x: 0.85, y: 0, z: -0.5}, strength: 1.5}],
      fall: W1_TB.fall, damage: W1_TB.damage, idle: dead ? 0 : 0.45, ground: w1Ground, // it stands and falls on low rubble
    };
  },
};

// ------------------------------------------------------------------ W2 (7502): at the decoy maker; the club takes its arm
const W2_TB = TB_WRECKS[1];
const W2_WAIT = {x: 36.8, z: 2.5};
/** the decoy maker's head where W2's hammer is aimed (she is beside the breaker; crew.tsx DEC_SEGS at 164.6) */
export const W2_TARGET = onG(13.25, 5.2, 1.5);
const W2: UPlan = {
  id: 7502, name: 'W2', eye: 'amber',
  steps: [
    // it closes on the block from the east and watches it (clear of the D4-1b lens), then follows the retreat
    {k: 'walk', pts: [arcStartPos(ARC_START[3]).pos, {x: 39.0, z: 3.0}, W2_WAIT], T0: M.P4, T1: 153.4, A: 0.2, D: 0.6},
    {k: 'keys', root: [[153.4, W2_WAIT.x, W2_WAIT.z, headingTo({x: 39.0, z: 3.0}, W2_WAIT)], [153.8, W2_WAIT.x, W2_WAIT.z, 268], [154.5, W2_WAIT.x, W2_WAIT.z, 266]]},
    {k: 'walk', pts: [W2_WAIT, {x: 32.6, z: 2.4}, {x: 27.0, z: 3.9}, {x: 24.0, z: 5.0}, {x: 20.0, z: 5.1}, arrive(W2_TB.pos, W2_TB.heading), W2_TB.pos], T0: 154.5, T1: 161.4, A: 0.5, D: 0.7},
    {k: 'keys', root: [[161.4, W2_TB.pos.x, W2_TB.pos.z, W2_TB.heading]], kitFeet: true},
  ],
  act: (T) => {
    const dead = T >= W2_TB.fall.t0;
    return {
      // its hammer winds up at the decoy maker; the breaker's swing meets the raised arm first (the arm comes off)
      strikes: T < EV.club ? [{t0: EV.w2Wind + 0.5, side: 'L', target: W2_TARGET, kind: 'hammer'}] : undefined,
      posture: [[-1, 'guard'], [W2_TB.fall.t0 + 0.9, 'idle']],
      look: dead ? undefined : T < 163.4 ? dirHeadAt(T) : W2_TARGET,
      hits: [{t0: EV.club, dir: {x: 0.35, y: 0, z: 1}, strength: 1.3}],
      fall: W2_TB.fall, damage: W2_TB.damage, idle: dead ? 0 : 0.45,
    };
  },
};

// ------------------------------------------------------------------ W3 (7503): at the tether operator; the cable; driven over
const W3_TB = TB_WRECKS[2];
/** the tether operator's chest where W3's punch is aimed (crew.tsx TTH_SEGS at 165.0) */
const W3_TARGET = onG(14.95, -0.22, 1.25);
const W3: UPlan = {
  id: 7503, name: 'W3', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[2]).pos, {x: 37.0, z: -3.6}, {x: 28.0, z: -3.9}, {x: 24.5, z: -2.6}, {x: 21.5, z: -3.0}, arrive(W3_TB.pos, W3_TB.heading), W3_TB.pos], T0: M.P4, T1: 161.9, A: 0.2, D: 0.7},
    {k: 'keys', root: [[161.9, W3_TB.pos.x, W3_TB.pos.z, W3_TB.heading]], kitFeet: true},
  ],
  act: (T) => {
    const dead = T >= W3_TB.fall.t0;
    // it steps at the tether operator, winding up; the cable binds its shins (164.78): it lurches, arms out
    const lurch = win(T, EV.cableWrap, W3_TB.fall.t0 + 0.1, 0.12, 0.1);
    return {
      strikes: T < EV.cableWrap ? [{t0: 165.12, side: 'R', target: W3_TARGET, kind: 'punch'}] : undefined,
      posture: [[-1, 'guard'], [W3_TB.fall.t0 + 0.9, 'idle']],
      look: dead ? undefined : T < 164.2 ? dirHeadAt(T) : {x: 15.3, y: 1.4, z: -1.1},
      lean: dead ? undefined : 6 * lurch, twist: dead ? undefined : -10 * lurch,
      hits: [{t0: EV.cableHaul, dir: {x: -0.6, y: 0, z: 0.5}, strength: 0.45}, {t0: EV.w3Drive, dir: {x: 0.6, y: 0, z: -0.8}, strength: 1.4}],
      fall: W3_TB.fall, damage: W3_TB.damage, idle: dead ? 0 : 0.45,
    };
  },
};

// ------------------------------------------------------------------ H1 (7101): THE TETHER answered (the launcher torn away)
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
let armLOff = false;
const H1: UPlan = {
  id: 7101, name: 'H1', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[0]).pos, {x: 31.0, z: -3.2}, {x: 23.0, z: -1.9}, arrive(H1_AT, 268, 1.5), H1_AT], T0: M.P4, T1: 156.75, A: 0.2, D: 0.5},
    {k: 'keys', root: [[156.75, H1_AT.x, H1_AT.z, 268], [EV.disarmGrab, H1_AT.x, H1_AT.z, 268], [157.5, H1_AT.x + 0.1, H1_AT.z, 268], [158.0, H1_AT.x - 0.05, H1_AT.z, 266], [168.9, H1_AT.x, H1_AT.z, 262], [169.2, H1_AT.x, H1_AT.z, 140]]},
    // out of heavy 2's way as it comes on; then round behind the fight to the tether operator (its tableau grip 180.4)
    {k: 'walk', pts: [H1_AT, H1_HOLD], T0: 169.2, T1: 170.4, A: 0.4, D: 0.5, raw: true},
    {k: 'keys', root: [[170.4, H1_HOLD.x, H1_HOLD.z, headingTo(H1_AT, H1_HOLD)], [170.9, H1_HOLD.x, H1_HOLD.z, 250], [175.5, H1_HOLD.x, H1_HOLD.z, 252], [175.8, H1_HOLD.x, H1_HOLD.z, headingTo(H1_HOLD, {x: 19.0, z: -2.4})]]},
    // (round the north side of sch_21 at (16.57, 0.51): its path keeps 0.6 m off the chunk)
    {k: 'walk', pts: [H1_HOLD, {x: 19.0, z: -2.4}, {x: 17.6, z: -1.35}, H1_WAIT], T0: 175.8, T1: 177.9, A: 0.4, D: 0.5, raw: true},
    {k: 'keys', root: [[177.9, H1_WAIT.x, H1_WAIT.z, headingTo({x: 17.6, z: -1.35}, H1_WAIT)], [178.4, H1_WAIT.x, H1_WAIT.z, headingTo(H1_WAIT, {x: 14.0, z: -1.35})]]},
    {k: 'walk', pts: [H1_WAIT, {x: 14.0, z: -1.35}, H1_TB.pos], T0: 178.4, T1: 179.7, A: 0.3, D: 0.4, raw: true},
    {k: 'keys', root: [[179.7, H1_TB.pos.x, H1_TB.pos.z, headingTo({x: 14.0, z: -1.35}, H1_TB.pos)], [179.95, H1_TB.pos.x, H1_TB.pos.z, H1_TB.heading]]},
  ],
  act: (T) => {
    const f = armLOff ? null : h1Fist(T);
    return {
      look: T < 159.5 ? {x: LAUNCHER_GRIP.x - 0.3, y: LAUNCHER_GRIP.y + 0.35, z: LAUNCHER_GRIP.z} : T > 179.4 ? onG(12.3, 0.5, 0.95) : T > 177.8 ? crewHead('tether') : dirHeadAt(T),
      posture: [[-1, 'guard'], [158.9, 'ready'], [168.4, 'guard'], [178.9, 'idle']],
      armL: f && f.w > 0.02 ? {hand: f.w >= 1 ? f.hand : lerp3s(restHand(T, 'L'), f.hand, f.w), open: f.open} : undefined,
      hits: [{t0: EV.disarmTear, dir: {x: 0.6, y: 0, z: 0}, strength: 0.4}],
      crouch: 0.06 * win(T, 157.85, 158.6, 0.15, 0.3), lean: 8 * win(T, 157.85, 158.6, 0.15, 0.3) + H1_TB.lean * smooth((T - 179.0) / 0.9),
    };
  },
};
/** H1's own left hand without the disarm's hand control (its guard), for blending the control in and out */
const restHand = (T: number, side: 'L' | 'R'): V3 => {
  armLOff = true;
  const sp = unitAt(H1, T);
  armLOff = false;
  const a = unitAttach(sp);
  return side === 'L' ? a.handL : a.handR;
};
/** where the torn launcher ends up (thrown down at 158.1) */
export const LAUNCHER_REST = {x: 18.92, z: -0.86, yaw: 205};

// ------------------------------------------------------------------ H5 (7105): THE RUNNER's route cut; stands over him
const H5_TB = TB_HOLDERS[4];
const H5_AT = {x: 16.55, z: 8.35};
const H5: UPlan = {
  id: 7105, name: 'H5', eye: 'amber',
  steps: [
    {k: 'walk', pts: [arcStartPos(ARC_START[4]).pos, {x: 31.0, z: 10.4}, {x: 22.0, z: 9.9}, {x: 17.85, z: 9.05}, H5_AT], T0: M.P4, T1: 155.42, A: 0.25, D: 0.3},
    {k: 'keys', root: [[155.42, H5_AT.x, H5_AT.z, 298], [155.74, H5_AT.x - 0.05, H5_AT.z - 0.05, 66], [157.4, H5_AT.x - 0.05, H5_AT.z - 0.05, 66],
      [158.3, 16.95, 6.8, 78], [159.0, 18.55, 6.05, 140], [159.45, H5_TB.pos.x, H5_TB.pos.z, H5_TB.heading]]},
  ],
  act: (T) => ({
    strikes: [{t0: EV.runnerHit, side: 'R', target: RUNNER_CHEST, kind: 'punch'}],
    posture: [[-1, 'guard'], [157.6, 'ready']],
    look: T < EV.runnerHit + 0.4 ? {x: RUNNER_CHEST.x, y: RUNNER_CHEST.y + 0.35, z: RUNNER_CHEST.z} : H5_TB.look ?? {x: 18.1, y: 0.2, z: 7.6},
    crouch: lerp(0, H5_TB.crouch, smooth((T - 158.9) / 0.8)), lean: lerp(0, H5_TB.lean, smooth((T - 158.9) / 0.8)),
    idle: lerp(0.5, 0.18 * 0.6, smooth((T - 158.9) / 0.8)),
  }),
};

// ------------------------------------------------------------------ H2–H4: ride with the arc, hold, then take the others
const holderPlan = (idx: 1 | 2 | 3, arcI: number, hold: XZ, via: XZ[], approach: [number, number]): UPlan => {
  const tb = TB_HOLDERS[idx];
  const a = arcStartPos(ARC_START[arcI]);
  const holdH = headingTo(hold, RING_C);
  const tH = 160.6 + idx * 0.4;
  const plan: UPlan = {
    id: tb.id, name: tb.key, eye: 'amber',
    steps: [
      {k: 'walk', pts: [a.pos, {x: lerp(a.pos.x, hold.x, 0.45), z: lerp(a.pos.z, hold.z, 0.45) + 0.8}, arrive(hold, holdH, 1.5), hold], T0: M.P4, T1: tH, A: 0.2, D: 0.6},
      {k: 'keys', root: [[tH, hold.x, hold.z, holdH], [approach[0] - 0.45, hold.x, hold.z, holdH + 4], [approach[0], hold.x, hold.z, headingTo(hold, via[0])]]},
      {k: 'walk', pts: [hold, ...via, tb.pos], T0: approach[0], T1: approach[1] - 0.35, A: 0.5, D: 0.5},
      {k: 'keys', root: [[approach[1] - 0.35, tb.pos.x, tb.pos.z, headingTo(via[via.length - 1], tb.pos)], [approach[1], tb.pos.x, tb.pos.z, tb.heading]]},
    ],
    act: (T) => {
      // its head comes to rest straight ahead (the tableau's spec has no look) as it reaches its place
      const ahead = (() => { const r = unitAt({...plan, act: undefined}, T); const f = fwdOf(r.heading); return onG(r.pos.x + f.x * 6, r.pos.z + f.z * 6, 1.9); })();
      const settle = smooth((T - (approach[1] - 0.75)) / 0.6);
      const lk = T < approach[0] ? dirHeadAt(T) : tb.who ? crewHead(tb.who) : ahead;
      return {
      look: settle > 0 ? lerp3s(lk, ahead, settle) : lk,
      crouch: tb.crouch * settle, lean: tb.lean * settle,
      posture: [[-1, 'guard'], [tH + 0.3, 'ready'], [approach[0], 'guard'], [approach[1] - 1.25, 'idle']],
      scan: {t0: tH + 0.8, t1: approach[0] - 0.4, center: {x: RING_C.x, y: 1, z: RING_C.z}, span: 50, seed: tb.id},
      };
    },
  };
  return plan;
};
const H2 = holderPlan(1, 18, {x: 21.5, z: 12.4}, [{x: 15.6, z: 10.1}, {x: 13.2, z: 8.6}, {x: 12.9, z: 7.0}], [176.9, EV.grabDecoy - 0.55]);
const H3 = holderPlan(2, 17, {x: 24.4, z: 11.0}, [{x: 18.6, z: 9.9}, {x: 15.9, z: 8.45}], [177.9, EV.grabFlares - 0.55]);
const H4 = holderPlan(3, 16, {x: 17.6, z: 14.6}, [{x: 14.4, z: 9.4}, {x: 12.9, z: 8.75}], [178.3, EV.grabBreaker - 0.55]);
/** when each holder's tableau spec takes over (the reach before the grab starts at t0 − 0.5) */
export const HOLDER_FINAL: Record<number, number> = {7101: 179.95, 7102: EV.grabDecoy - 0.55, 7103: EV.grabFlares - 0.55, 7104: EV.grabBreaker - 0.55, 7105: 159.75};

// ------------------------------------------------------------------ the ring: the arc tightens (east), the rest closes in
type Slot = {id: number; pos: V3; heading: number};
const slotOf = (id: number): Slot => (TB_RING.find((u) => u.id === id) ?? TB_OUTER.find((u) => u.id === id))!;
const outward = (p: XZ, d: number): XZ => {
  const dx = p.x - RING_C.x, dz = p.z - RING_C.z, L = Math.hypot(dx, dz);
  return {x: p.x + (dx / L) * d, z: p.z + (dz / L) * d};
};
/** a place to stand: pushed clear of the set's solid pieces (the feet must not stand on rubble) */
const clearSpot = (p: XZ): XZ => pushOut(p, 0.55, {stepH: 0.1});
/**
 * An escort unit: from the start arc, alongside the retreat (guard up, ≤ 2.7 m/s: they herd, they do not wait in
 * striking range), to a hold point outside its slot (weapon lowered but ready, scanning); at ringStep they step over
 * the wrecks and close into their slots (stepping into blocking positions), then secure.
 */
const escortPlan = (a: (typeof ARC_START)[number], j: number): UPlan => {
  const s = slotOf(a.id);
  const outer = a.id >= 7300;
  const hold = clearSpot(outward(s.pos, outer ? 3.2 : 3.6));
  const st = arcStartPos(a);
  const holdH = headingTo(hold, RING_C);
  const Lw = pathLen([st.pos, arrive(hold, holdH, 1.5), hold]);
  const tHold = Math.max(159.4, M.P4 + Lw / 2.7) + rnd(a.id * 7) * 1.2;
  const tIn = Math.max(tHold + 1, EV.ringStep + (j % 6) * 0.75 + rnd(a.id * 3) * 0.7);
  const tSet = tIn + 3.0 + rnd(a.id * 5) * 1.4 + (outer ? 2.5 : 0);
  return {
    id: a.id, name: `esc${a.id}`, eye: 'cyan',
    steps: [
      {k: 'walk', pts: [st.pos, clearSpot(arrive(hold, holdH, 1.5)), hold], T0: M.P4, T1: tHold, A: 0.2, D: 0.6},
      {k: 'keys', root: [[tHold, hold.x, hold.z, holdH], [tIn, hold.x, hold.z, holdH]]},
      {k: 'walk', pts: [hold, clearSpot(arrive(s.pos, s.heading, 1.2)), s.pos], T0: tIn, T1: tSet, A: 0.5, D: 0.6},
      {k: 'keys', root: [[tSet, s.pos.x, s.pos.z, headingTo(clearSpot(arrive(s.pos, s.heading, 1.2)), s.pos)], [tSet + 0.5, s.pos.x, s.pos.z, s.heading]]},
    ],
    act: (T) => ({
      look: T < tHold ? dirHeadAt(T) : undefined, idle: T > tSet ? 0.18 : 0.45,
      // herding (guard), holding beyond reach (weapon lowered but ready, scanning), closing in (guard), settling in the
      // slot into the tableau's stance ('idle' until its own 'ready'); ringExtras takes over in the slot (battle.tsx)
      posture: [[-1, 'guard'], [tHold + 0.25, 'ready'], [tIn - 0.2, 'guard'], [tSet - 0.75, 'idle']],
      scan: {t0: tHold + 0.6, t1: tIn - 0.3, center: {x: 12.5, y: 1.0, z: 3.0}, span: 46, seed: a.id},
    }),
  };
};
const ESCORT_IDS = new Set(ARC_START.filter((a) => a.role === 'ring' || a.role === 'outer').map((a) => a.id));
const ESCORT: UPlan[] = ARC_START.filter((a) => ESCORT_IDS.has(a.id)).map((a, j) => escortPlan(a, j));
/** the south route along the ridge foot is closed early: these two step into the gap before ARRIVAL (seen from the van) */
const BLOCKERS = new Set([7206, 7207]);
/** the ring's west half and the outer ring's: round the ridge's north and south ends (they appear on the crest) */
const flankPlan = (s: Slot, j: number): UPlan => {
  const north = s.pos.z < RING_C.z;
  const sz = north ? -1 : 1;
  const early = BLOCKERS.has(s.id);
  // radially in from well outside the slot (spread by bearing), having come round the ridge's end from the north/south
  const via = clearSpot(outward(s.pos, 8.5));
  const start: XZ = clearSpot({x: via.x + 4 + rnd(s.id * 3) * 2, z: via.z + sz * (13 + rnd(s.id * 5) * 3)});
  const T0 = early ? 152.4 + rnd(s.id) * 0.8 : 162.5 + (j % 7) * 0.9 + rnd(s.id * 11) * 1.2;
  const T1 = early ? EV.blockersSet - 0.2 + rnd(s.id * 2) * 0.5 : 179.0 + rnd(s.id * 13) * 4.5 + (s.id >= 7300 ? 1.0 : 0);
  const blockAt = early ? clearSpot(outward(s.pos, 1.6)) : null;
  const steps: UStep[] = early ? [
    {k: 'walk', pts: [start, via, clearSpot(arrive(blockAt!, s.heading, 1.4)), blockAt!], T0, T1, A: 0.6, D: 0.7},
    {k: 'keys', root: [[T1, blockAt!.x, blockAt!.z, headingTo(clearSpot(arrive(blockAt!, s.heading, 1.4)), blockAt!)], [T1 + 0.5, blockAt!.x, blockAt!.z, s.heading], [EV.ringStep + 1.0 + rnd(s.id) * 0.6, blockAt!.x, blockAt!.z, headingTo(blockAt!, s.pos)]]},
    {k: 'walk', pts: [blockAt!, s.pos], T0: EV.ringStep + 1.0 + rnd(s.id) * 0.6, T1: EV.ringStep + 2.6 + rnd(s.id) * 0.6, A: 0.4, D: 0.5, raw: true},
    {k: 'keys', root: [[EV.ringStep + 2.6 + rnd(s.id) * 0.6, s.pos.x, s.pos.z, headingTo(blockAt!, s.pos)], [EV.ringStep + 3.1 + rnd(s.id) * 0.6, s.pos.x, s.pos.z, s.heading]]},
  ] : [
    {k: 'walk', pts: [start, via, clearSpot(arrive(s.pos, s.heading, 1.4)), s.pos], T0, T1, A: 0.6, D: 0.7},
    {k: 'keys', root: [[T1, s.pos.x, s.pos.z, headingTo(clearSpot(arrive(s.pos, s.heading, 1.4)), s.pos)], [T1 + 0.5, s.pos.x, s.pos.z, s.heading]]},
  ];
  const tSet = (steps[steps.length - 1] as Extract<UStep, {k: 'keys'}>).root[0][0];
  return {
    id: s.id, name: `flk${s.id}`, eye: 'cyan', steps,
    act: (T) => ({idle: T > tSet ? 0.18 : 0.4, posture: early ? [[-1, 'guard'], [T1 + 0.3, 'ready'], [tSet - 2.0, 'guard'], [tSet - 0.75, 'idle']] : [[-1, 'guard'], [tSet - 0.75, 'idle']],
      scan: early ? {t0: T1 + 0.6, t1: tSet - 2.2, center: {x: 12.0, y: 1.0, z: 4.0}, span: 50, seed: s.id} : undefined}),
  };
};
const FLANK: UPlan[] = [...TB_RING, ...TB_OUTER].filter((u) => !ESCORT_IDS.has(u.id)).map((u, j) => flankPlan(u, j));
/** when each ring unit is set in its slot */
export const RING_IN: Record<number, number> = {};
[...ESCORT, ...FLANK].forEach((p) => { const k = p.steps[p.steps.length - 1]; if (k.k === 'keys') RING_IN[p.id] = k.root[0][0]; });
/** when each ring unit's tableau spec (plus ringExtras) takes over: a quarter second after it is set in its slot */
export const RING_SET: Record<number, number> = {};
[...ESCORT, ...FLANK].forEach((p) => { RING_SET[p.id] = RING_IN[p.id] + 0.75; });

export const NAMED: Record<string, UPlan> = {W1, W2, W3, H1, H5, H2, H3, H4};
export const RING_PLANS: UPlan[] = [...ESCORT, ...FLANK];
export const unitD4 = (name: string, T: number): UnitSpec => unitAt(NAMED[name], T);

// ================================================================== HEAVY 2
// Its walk uses the kit walker's own geometry (mech/heavy.tsx): the lateral sequence (FL, RR, FR, RL a quarter cycle
// apart), duty 0.75 (three feet planted), stride 3.0 m, each stance centred under its hip — so a planted foot never has
// to reach past the leg — written out as keyed footholds with their landing times (`plants`: the hull compresses and
// settles on each landing). The hull is lowered just enough that every foot stays within the leg's reach (the kit does
// this for its own gait; with keyed feet the section owns the hull height). Each walk stops on a quarter stride (a
// multiple of 0.75 m), the instant one foot has landed and the next has not lifted: all four feet down, none hanging.
//   P4 → 165.95  out of the crater along one line (heading 262), already walking at the cut; it halts to fire (aim
//                164.7) — the last flare blinds it first (166.14)
//   166.18–167.42  blinded: it steps back off the slab (the rear-left foot lands on its edge, the slab tips, the foot
//                slides off), the others step back to catch it
//   168.4        the eye clears (the head shakes it off); 168.9 → 176.0 it comes on again, slow, to the van
//   177.76       the ram (wind-up from 176.46) onto the Director's plate; 178.9 → 180.9 one step back into its sector
type XZH = [number, number, number];
const HPH = [0, 0.5, 0.75, 0.25], H_STRIDE = 3.0, H_DUTY = 0.75, H_LIFT = 0.55;
type HWalk = {t0: number; t1: number; a: XZH; b: XZH; L: number; ease: (u: number) => number; standStart: boolean};
/** a constant-speed walk with a decelerating tail (it was already walking at the cut in) */
const cruiseStop = (tail: number) => (u: number) => (u < 1 - tail ? u / (1 - tail / 2) : (1 - tail + tail * (1 - (1 - (u - (1 - tail)) / tail) ** 2) / 2) / (1 - tail / 2));
/** start from rest, come on slowly, settle into the stop */
const startStop = (u: number) => smooth(u);
const hwPos = (w: HWalk, d: number): {x: number; z: number; h: number} => {
  const k = d / w.L;
  return {x: lerp(w.a[0], w.b[0], k), z: lerp(w.a[1], w.b[1], k), h: w.a[2] + wrapD(w.b[2] - w.a[2]) * clamp(k)};
};
const hwDist = (w: HWalk, T: number): number => {
  if (T < w.t0 && !w.standStart) return -(w.L / ((w.t1 - w.t0) * (1 - 0.12 / 2))) * (w.t0 - T); // walking in before the cut
  return w.L * w.ease(clamp((T - w.t0) / (w.t1 - w.t0)));
};
/** the walk's foothold for leg i at walk distance d (planted, or swinging between two plants) */
const hwFoot = (w: HWalk, i: number, d: number): V3 => {
  const ph = HPH[i];
  const c = d / H_STRIDE + ph, n = Math.floor(c), u = c - n;
  const plant = (k: number): [number, number] => {
    const r = w.standStart && k <= 0 ? hwPos(w, 0) : hwPos(w, (k - ph + H_DUTY / 2) * H_STRIDE);
    // (a foot does not come down on a wreck or a chunk: it is set beside it)
    const q = heavyStance(r.x, r.z, r.h, i), c = pushOut({x: q[0], z: q[1]}, 0.38, {stepH: 0.22, T: w.t0 + 0.5});
    return [c.x, c.z];
  };
  if (u < H_DUTY) { const q = plant(n); return onG(q[0], q[1]); }
  const s = (u - H_DUTY) / (1 - H_DUTY);
  const A = plant(n), B = plant(n + 1), e = smooth(s);
  const x = lerp(A[0], B[0], e), z = lerp(A[1], B[1], e);
  return {x, y: Math.max(lerp(G(A[0], A[1]), G(B[0], B[1]), e), G(x, z)) + Math.sin(Math.PI * s) * H_LIFT, z};
};
/** landing times of every leg over a walk (film s), with the foothold */
const hwLandings = (w: HWalk): {t: number; leg: number; pos: V3}[] => {
  const out: {t: number; leg: number; pos: V3}[] = [];
  const d0 = hwDist(w, w.t0 - (w.standStart ? 0 : 2)), d1 = w.L;
  HPH.forEach((ph, leg) => {
    for (let k = Math.ceil(d0 / H_STRIDE + ph); (k - ph) * H_STRIDE <= d1 + 1e-6; k++) {
      const dk = (k - ph) * H_STRIDE;
      if (dk <= d0 + 1e-6 || (w.standStart && dk <= 1e-6)) continue;
      let lo = w.t0 - (w.standStart ? 0 : 2), hi = w.t1;
      for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (hwDist(w, m) < dk) lo = m; else hi = m; }
      out.push({t: hi, leg, pos: hwFoot(w, leg, dk + 1e-4)});
    }
  });
  return out;
};
const L262 = (x: number): XZH => [x, 2.2 + (20.2 - x) * Math.tan((8 * Math.PI) / 180), 262];
const ALONG = (from: XZH, to: {x: number; z: number}, L: number): {x: number; z: number} => {
  const dx = to.x - from[0], dz = to.z - from[1], D = Math.hypot(dx, dz);
  return {x: from[0] + (dx / D) * L, z: from[1] + (dz / D) * L};
};
// the walk out of the crater: 41 quarter strides (30.75 m) from HEAVY2_START along heading 262
const W0_A: XZH = [HEAVY2_START.pos.x, HEAVY2_START.pos.z, 262];
const W0_B: XZH = (() => { const f = hv(262); return [W0_A[0] + f.x * 30.75, W0_A[1] + f.z * 30.75, 262]; })();
export const H2_STOP: XZH = W0_B;
/** where it ends up after the stumble (a step and a half back), on the line of its last approach to the van */
const H2_BACK_XZ = ALONG([HEAVY_STRIKE.x, HEAVY_STRIKE.z, 0], {x: 26.15, z: 1.42}, 9.75);
export const H2_BACK: XZH = [H2_BACK_XZ.x, H2_BACK_XZ.z, 263];
export const H2_SLAB = {x: 29.3, z: 3.55};
const HW0: HWalk = {t0: M.P4, t1: EV.heavyStop, a: W0_A, b: W0_B, L: 30.75, ease: cruiseStop(0.12), standStart: false};
const HW2: HWalk = {t0: EV.heavyGo, t1: EV.heavyArrive, a: H2_BACK, b: [HEAVY_STRIKE.x, HEAVY_STRIKE.z, HEAVY_STRIKE.h], L: 9.75, ease: startStop, standStart: true};
const STEP_BACK = {t0: EV.heavyBack, t1: EV.heavyBackEnd, a: [HEAVY_STRIKE.x, HEAVY_STRIKE.z, HEAVY_STRIKE.h] as XZH, b: [TB_HEAVY2.pos.x, TB_HEAVY2.pos.z, TB_HEAVY2.heading] as XZH};
export const heavy2Root = (T: number): {x: number; z: number; h: number} => {
  if (T < HW0.t1) return hwPos(HW0, hwDist(HW0, T));
  if (T < HW2.t0) {
    // blinded: it rears and steps back off the slab, catching itself
    const u = easeOut(clamp((T - 166.2) / (167.3 - 166.2)));
    return {x: lerp(H2_STOP[0], H2_BACK[0], u), z: lerp(H2_STOP[1], H2_BACK[1], u), h: H2_STOP[2] + wrapD(H2_BACK[2] - H2_STOP[2]) * u};
  }
  if (T < STEP_BACK.t0) return hwPos(HW2, hwDist(HW2, T));
  const u = smooth(clamp((T - STEP_BACK.t0) / (STEP_BACK.t1 - STEP_BACK.t0)));
  const a = STEP_BACK.a, b = STEP_BACK.b;
  return {x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), h: a[2] + wrapD(b[2] - a[2]) * u};
};
/** keyed footholds after the walk out (the stumble) and after the approach (the step back), per leg */
const H2_KEYS: {stumble: KP[][]; back: KP[][]} = (() => {
  const end0 = [0, 1, 2, 3].map((i) => hwFoot(HW0, i, HW0.L));
  const st: KP[][] = end0.map((p) => [[HW0.t1, p.x, p.z]] as KP[]);
  const back = (i: number) => heavyStance(H2_BACK[0], H2_BACK[1], H2_BACK[2], i);
  const hold = (i: number, t: number) => { const L = st[i]; L.push([t, L[L.length - 1][1], L[L.length - 1][2]]); };
  [0, 1, 2, 3].forEach((i) => hold(i, 166.18));
  // rear-left: back onto the slab's edge (166.38), the slab tips (166.46) and the foot slides off it; set down again
  const rl = back(2);
  st[2].push([166.38, H2_SLAB.x - 0.25, H2_SLAB.z - 0.05, 0.6], [EV.stumble + 0.02, H2_SLAB.x - 0.25, H2_SLAB.z - 0.05], [166.62, rl[0] + 0.55, rl[1] + 0.45, 0]);
  st[3].push([166.42, st[3][st[3].length - 1][1], st[3][st[3].length - 1][2]], [166.78, ...back(3), 0.45] as KP);
  st[0].push([166.62, st[0][st[0].length - 1][1], st[0][st[0].length - 1][2]], [166.98, ...back(0), 0.5] as KP);
  st[1].push([166.85, st[1][st[1].length - 1][1], st[1][st[1].length - 1][2]], [167.22, ...back(1), 0.5] as KP);
  st[2].push([167.05, rl[0] + 0.55, rl[1] + 0.45], [167.42, rl[0], rl[1], 0.35]);
  // the step back into its sector (one deliberate step per leg, the front-right first: clear of H1 coming in)
  const end2 = [0, 1, 2, 3].map((i) => hwFoot(HW2, i, HW2.L));
  const fin = (i: number) => heavyStance(TB_HEAVY2.pos.x, TB_HEAVY2.pos.z, TB_HEAVY2.heading, i);
  const bk: KP[][] = end2.map((p) => [[HW2.t1, p.x, p.z]] as KP[]);
  const dur = STEP_BACK.t1 - STEP_BACK.t0, sw = dur / 4;
  [1, 2, 0, 3].forEach((i, j) => {
    const t0 = STEP_BACK.t0 + j * sw, L = bk[i];
    L.push([t0, L[L.length - 1][1], L[L.length - 1][2]], [t0 + sw * 0.9, ...fin(i), 0.45] as KP);
  });
  return {stumble: st, back: bk};
})();
/** every landing of heavy 2's feet (film s, leg, foothold): the walks', the stumble's and the step back's */
const H2_LANDINGS: {t: number; leg: number; pos: V3}[] = (() => {
  const out = [...hwLandings(HW0), ...hwLandings(HW2)];
  for (const set of [H2_KEYS.stumble, H2_KEYS.back]) set.forEach((k, leg) => k.forEach((kk, j) => {
    if (j === 0) return;
    const p = k[j - 1];
    if (Math.hypot(kk[1] - p[1], kk[2] - p[2]) < 0.05) return;
    out.push({t: kk[0], leg, pos: onG(kk[1], kk[2])});
  }));
  return out.sort((a, b) => a.t - b.t);
})();
const h2Feet = (T: number): V3[] => {
  if (T < HW0.t1) { const d = hwDist(HW0, T); return [0, 1, 2, 3].map((i) => hwFoot(HW0, i, d)); }
  if (T < HW2.t0) return H2_KEYS.stumble.map((k, i) => footY(i, T, footAt(k, T, 0.5)));
  if (T < STEP_BACK.t0) { const d = hwDist(HW2, T); return [0, 1, 2, 3].map((i) => hwFoot(HW2, i, d)); }
  return H2_KEYS.back.map((k) => footAt(k, T, 0.45));
};
/** foot on the slab (raised by its thickness) before the slip */
const footY = (i: number, T: number, p: V3): V3 => (i === 2 && T > 166.3 && T < EV.stumble + 0.03 && Math.hypot(p.x - (H2_SLAB.x - 0.25), p.z - (H2_SLAB.z - 0.05)) < 0.4 ? {...p, y: p.y + 0.3 * smooth((T - 166.3) / 0.08)} : p);
const H2_MAXL = (HEAVY_DIM.upperLen + HEAVY_DIM.lowerLen) * 0.985;
/** the group it levels its launcher at (ARRIVAL), and where it looks once blinded */
const H2_AIM = onG(13.6, 1.6, 1.2);

const TB_H2 = (T: number): HeavySpec => ({id: TB_HEAVY2.id, t: T, pos: TB_HEAVY2.pos, heading: TB_HEAVY2.heading, look: TB_HEAVY2.look, eye: TB_HEAVY2.eye, ground, key: 'tb_heavy2'});
export const heavy2At = (T: number): HeavySpec => {
  // from the moment it has settled back in its sector, it IS the tableau's heavy 2
  if (T >= EV.heavyBackEnd + 0.6) return TB_H2(T);
  const sp = heavy2Raw(T);
  const need = h2Need(T);
  return need > 0 ? {...sp, drop: (sp.drop ?? 0) + need} : sp;
};
/** heavy 2 before the reach drop */
const heavy2Raw = (T: number): HeavySpec => {
  if (T >= EV.heavyBackEnd + 0.6) return TB_H2(T);
  const r = heavy2Root(T);
  const feet = h2Feet(T);
  const plants = [0, 1, 2, 3].map((leg) => { let t: number | undefined; for (const l of H2_LANDINGS) { if (l.t > T) break; if (l.leg === leg) t = l.t; } return t; });
  // look: the Crew → (aim) the group → the flare (blinded: the head jerks up and away, shakes it off) → the Crew →
  // the drone pilot (the ram's target) → the Director
  const blind = win(T, EV.flareHit, EV.heavyRecover + 0.3, 0.05, 0.6);
  const shake = T > EV.heavyRecover - 0.5 && T < EV.heavyRecover + 0.3 ? Math.sin((T - (EV.heavyRecover - 0.5)) * 22) * (1 - smooth((T - EV.heavyRecover) / 0.3)) : 0;
  const look: V3 = T < EV.heavyOnHer ? (T < EV.flareHit ? (T > EV.heavyAim - 0.6 ? H2_AIM : dirHeadAt(T)) : {x: r.x - 8 + 6 * blind + 3 * shake, y: lerp(2.0, 6 + 4 * blind, blind), z: r.z + 4 * blind}) 
    : T < M.STRIKE + 0.6 ? onG(PILOT_DOWN.x, PILOT_DOWN.z, 0.7) : DIRECTOR_HEAD;
  const dip = 0.32 * win(T, EV.stumble, 167.6, 0.12, 0.9);
  // the launcher levelled at them as it halts (it would have fired: the flare comes first), then thrown up and away
  const aim: V3 | undefined = T > EV.heavyAim - 0.8 && T < EV.heavyRecover + 0.8 ? (T < EV.flareHit ? H2_AIM : {x: r.x - 6, y: 9 + 6 * blind, z: r.z + 6}) : undefined;
  const sp: HeavySpec = {
    id: TB_HEAVY2.id, t: T, pos: {x: r.x, y: 0, z: r.z}, heading: r.h, ground, key: 'tb_heavy2', eye: 'amber',
    feet, plants, drop: dip, look, aim,
    stumble: {t0: EV.stumble, dir: {x: 0.55, y: 0, z: 0.85}, strength: 1.3},
    ram: {t0: M.STRIKE, target: STRIKE_PLATE},
    stepOver: [],
  };
  return sp;
};
/** how far the hull must come down at T for every foot to stay within reach (no smoothing) */
const rawNeed = (sp: HeavySpec): number => {
  if (!sp.feet) return 0;
  const R0 = solveHeavy(sp);
  let need = 0;
  R0.hip.forEach((H, i) => {
    const f = sp.feet![i]!;
    const A = {x: f.x, y: f.y + 0.22, z: f.z};
    const h = Math.min(H2_MAXL * 0.999, Math.hypot(H.x - A.x, H.z - A.z)), v = H.y - A.y;
    if (h * h + v * v > H2_MAXL * H2_MAXL) need = Math.max(need, v - Math.sqrt(H2_MAXL * H2_MAXL - h * h));
  });
  return need;
};
/** the hull's reach drop on a 1/60 s grid: the max over ±0.3 s, averaged over ±0.25 s (≥ the raw need everywhere) */
const NEED_T0 = 149.2, NEED_T1 = EV.heavyBackEnd + 0.7, NEED_DT = 1 / 60;
let NEED: number[] | null = null;
const h2Need = (T: number): number => {
  if (T < NEED_T0 || T > NEED_T1) return 0;
  if (!NEED) {
    const n = Math.ceil((NEED_T1 - NEED_T0) / NEED_DT) + 1;
    const raw: number[] = [];
    for (let i = 0; i < n; i++) raw.push(rawNeed(heavy2Raw(NEED_T0 + i * NEED_DT)));
    const W = Math.round(0.3 / NEED_DT), A = Math.round(0.25 / NEED_DT);
    const env = raw.map((_, i) => { let m = 0; for (let j = Math.max(0, i - W); j <= Math.min(n - 1, i + W); j++) m = Math.max(m, raw[j]); return m; });
    NEED = env.map((_, i) => { let s = 0, c = 0; for (let j = Math.max(0, i - A); j <= Math.min(n - 1, i + A); j++) { s += env[j]; c++; } return Math.max(raw[i], s / c); });
  }
  const u = (T - NEED_T0) / NEED_DT, i = Math.floor(u), k = u - i;
  const a = NEED[Math.max(0, Math.min(NEED.length - 1, i))], b = NEED[Math.max(0, Math.min(NEED.length - 1, i + 1))];
  return lerp(a, b, k);
};
/** heavy 2's footfalls (time, world point) for dust and the ground shake (sound) */
export const heavy2Footfalls = (Ta: number, Tb: number): {t: number; pos: V3; leg: number}[] => H2_LANDINGS.filter((l) => l.t > Ta && l.t <= Tb);

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
