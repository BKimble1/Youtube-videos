// The experiment as pure functions of time (seconds). Every shot samples these, so a cut never disagrees with the
// previous view about where the needle is, how far the plunger has travelled, how open the legs are, or where the
// payload sits. Event times are read from the measured narration (lib.T / word).
//
// Places on the one lab bench (mm; bench top z = 0; the operator stands behind the bench at +x):
//   A  specimen pad (needle insertion)            x =    0
//   D  gripping zone: the small block               x = -150
//   E  load test on a balance pan                   x = -300
//   F  second-specimen tray                         x = -450
//   B  operator station: the syringe in a ring stand on the bench, 700 mm behind the specimens; the operator stands
//      behind the bench
import {clamp, keyS, lerp, ss, ss5, T, word} from './lib';
import {legContact, sdfBox, sdfCyl, sdfEll, sdfPlane, sdfUnion, SDF, SpiderPose, toWorld, NEEDLE_IN} from './spider';
import {add3, spline3, V3} from './three';

// ------------------------------------------------------------------ narration anchors
export const TM = {
  needle: word('needle').start, // 0.727
  dead: word('dead').start, // 1.367
  legsOpened: T('legs opened').start, // 2.727
  opened: word('opened').start, // 3.207
  youSee: word('see').start - 0.1,
  pressure1: word('pressure').start, // 5.487
  extend: word('extend').start, // 6.727
  legs2: T('their legs').end,
  die: word('die').start, // 8.607
  drops: word('drops').start, // 9.727
  curl: word('curl').start, // 10.967
  inward: word('inward').end, // 11.847
  but: word('but').start, // 12.22
  push: word('push').start, // 13.367
  air: word('air').start,
  needle2: word('needle', 1).start, // 14.167
  spread: word('spread').start, // 14.647
  again: word('again').end, // 15.98
  released: word('released').start, // 16.487
  pressure3: word('pressure', 2).start, // 17.127
  snapped: word('snapped').start, // 17.927
  object: word('object').start, // 18.967
  objectEnd: word('object').end, // 19.807
  thisTurned: word('this').start, // 19.847
  claw: word('claw').start, // 21.447
  lift: word('lift').start, // 22.207
  weight: word('weight').start, // 23.487
  weightEnd: word('weight').end, // 23.86
  they3: word('even').start - 0.24,
  reach: word('reach').start, // 24.847
  down: word('down…').start,
  and4: T('and pick').start, // 25.794
  another: word('another').start, // 26.167
  spider4: T('another spider').end, // 27.287
};

// ------------------------------------------------------------------ cuts (s); a cut lands on a frame boundary
export const CUT = {
  cutaway: 4.1, // the living-spider illustration
  specimenD: 12.17, // back to the experiment: the curled specimen at D
  operator: 12.98, // the operator station
  low: 14.47, // the low view at the block (reached by the move along the tube)
  insert: 16.73, // the syringe: release
  side: 17.4, // side view: closure and the lift
  load: 19.83, // the load test
  tray: 23.86, // the tray
  end: 30.0,
};

// ------------------------------------------------------------------ station B: the syringe (one syringe, one tube)
export const B_SYR_TIP: V3 = [60, 700, 44];
export const B_SYR_AXIS: V3 = [0, 0, 1];
export const BENCH_BACK = 900;
export const WALL_Y = 1350;
/** the tube from a hub (top) to the syringe nozzle: up off the hub, down onto the bench, along it, up into the nozzle */
export const tubeRoute = (hubTop: V3, benchZ: number): V3[] => {
  const n = B_SYR_TIP;
  const z = benchZ + 0.9;
  const dx = n[0] - hubTop[0];
  // control points; the drawn route is a dense 3D spline through them
  return spline3([
    hubTop,
    add3(hubTop, [0.2, 0.8, 3.5]),
    add3(hubTop, [1.2, 7, 4.5]),
    [hubTop[0] + dx * 0.03 + 2, 26, (hubTop[2] + z) * 0.45],
    [hubTop[0] + dx * 0.08, 52, z + 0.6],
    [hubTop[0] + dx * 0.3, 240, z],
    [hubTop[0] + dx * 0.7, 520, z],
    [n[0] - 6, 650, z],
    [n[0] - 1.5, 690, z + 8],
    [n[0], n[1], n[2] - 14],
    [n[0], n[1], n[2] - 1],
  ], 10);
};

// ------------------------------------------------------------------ station A: insertion and first opening
export const PAD_TOP = 0; // the specimen pad's top surface (the bench is 3 mm below)
export const BENCH_Z = -3;
export const A_YAW = 204;
/** the support raises the needled specimen a little before the air goes in (the curled legs rest on the pad) */
export const A_BODY_Z = (t: number) => lerp(1.72, 3.6, ss5(t, 1.1, 2.05));
export const A_POS = (t: number): V3 => [0, 0, A_BODY_Z(t)];
/** needle tip height above the insertion point (mm; negative = inside the prosoma) */
export const A_NEEDLE = (t: number) => keyS(t, [[0, 5.2], [0.42, 0], [0.55, -0.9]], (x) => ss(x, 0, 1));
/** the glue bead that seals the puncture */
export const A_GLUE = (t: number) => ss(t, 0.6, 0.86);
/** plunger travel at the station-A syringe, 0..1 */
export const A_PLUNGER = (t: number) => ss(t, TM.dead + 0.05, 3.3) * (1 - 0) - 0.0;
/** pressure in the specimen (follows the plunger with a short lag) */
export const A_PRESS = (t: number) => clamp(ss(t, 1.9, 3.45));
/** the commanded leg extension at A (0 curled, 1 open); legs start opening just before "legs opened" */
export const A_EXT = (t: number) => ss5(t, 2.2, 3.55) * (1 - ss(t, 30, 31));

// ------------------------------------------------------------------ station D: open, lower round the block, close, lift
export const D_X = -150;
export const BLOCK = {c: [D_X, 0, 1.8] as V3, h: [1.8, 1.8, 1.8] as V3, yaw: 18};
export const D_YAW = 196;
/** support height of the body centre above the bench */
export const D_Z = (t: number) =>
  keyS(t, [
    [0, 12.6],
    [TM.again - 0.15, 12.6],
    [CUT.insert - 0.05, 5.05], // lowered so the open legs surround the block
    [TM.object - 0.3, 5.05],
    [CUT.load + 0.2, 12.5], // the lift
  ]);
export const D_POS = (t: number): V3 => [D_X + 0.8, 0.2, D_Z(t)];
/** syringe plunger at the operator station (shared by D's push and release) */
export const B_PLUNGER = (t: number) => keyS(t, [[0, 0], [TM.push - 0.05, 0], [TM.push + 0.55, 1], [CUT.insert + 0.12, 1], [CUT.insert + 0.38, 0.22]]);
/** commanded extension at D: curled -> open on "spread them open again" -> closed when the pressure is released */
export const D_EXT = (t: number) => {
  const open = ss5(t, TM.spread - 0.1, TM.again - 0.25);
  const close = ss(t, CUT.side + 0.12, TM.snapped + 0.02);
  return open * (1 - close);
};
export const D_SOLID: SDF = sdfUnion(sdfBox(BLOCK.c, BLOCK.h, 0.35, BLOCK.yaw), sdfPlane(0));
/** the block rides with the gripper once the lift starts */
export const D_BLOCK_LIFT = (t: number) => (t <= TM.object - 0.3 ? 0 : Math.max(0, D_Z(t) - D_Z(TM.object - 0.3)));

// ------------------------------------------------------------------ station E: the load test on a balance
export const E_X = -300;
export const PAN_TOP = 9; // the balance pan surface
/** the payload: a small polymer weight of 43.6 mg (1.3x the gripper's 33.5 mg, Yap et al. 2022) */
export const WEIGHT = {r: 1.5, h: 2.0}; // 3 mm x 4 mm: 28 mm3 of a 1.55 g/cm3 polymer = 44 mg
export const E_YAW = 186;
export const E_Z = (t: number) => keyS(t, [[0, PAN_TOP + 5.3], [TM.lift - 0.42, PAN_TOP + 5.3], [TM.weightEnd + 0.12, PAN_TOP + 11.5]]);
export const E_POS = (t: number): V3 => [E_X + 0.3, 0, E_Z(t)];
export const E_WEIGHT_C = (t: number): V3 => [E_X, 0, PAN_TOP + WEIGHT.h + Math.max(0, E_Z(t) - E_Z(0))];
export const E_SOLID = (t: number): SDF => sdfCyl(E_WEIGHT_C(t), WEIGHT.r, WEIGHT.h);
/** the balance reading (mg): the weight's mass while it rests on the pan, falling to zero as the pan unloads */
export const E_READ = (t: number) => 43.6 * (1 - ss(E_Z(t) - E_Z(0), 0.0, 0.25));

// ------------------------------------------------------------------ station F: reach down, pick up another spider
export const F_X = -450;
export const TRAY_FLOOR = 2.2;
export const F_YAW = 180;
export const F_Z = (t: number) =>
  keyS(t, [
    [0, 24],
    [TM.they3, 24],
    [TM.and4 + 0.1, 13.2], // reaching down toward the tray
    [TM.another + 0.65, 7.5], // around the second spider
    [TM.spider4 + 0.25, 7.5],
    [29.2, 15.5], // both lifted
  ]);
export const F_POS = (t: number): V3 => [F_X - 0.4, 0.3, F_Z(t)];
/** the legs open as it is lowered (air in), close when it is round the second spider (air out) */
export const F_EXT = (t: number) => ss5(t, TM.they3 + 0.25, TM.down + 0.2) * (1 - ss(t, TM.spider4 - 0.55, TM.spider4 - 0.1));
/** the second specimen: a curled, inert wolf spider lying in the tray */
export const S2_REST: SpiderPose = {pos: [F_X - 0.6, 2.4, TRAY_FLOOR + 1.72], yaw: 98, e: [0.05, 0.1, 0.0, 0.08, 0.06, 0.0, 0.1, 0.04]};
export const S2_LIFT = (t: number) => (t <= TM.spider4 + 0.25 ? 0 : Math.max(0, F_Z(t) - F_Z(TM.spider4 + 0.25)));
export const S2_AT = (t: number): SpiderPose => ({...S2_REST, pos: add3(S2_REST.pos, [0, 0, S2_LIFT(t)])});
/** what the upper spider's legs can touch at F: the second spider's body (two ellipsoids) and the tray floor */
export const F_SOLID = (t: number): SDF => {
  const P = S2_AT(t);
  return sdfUnion(sdfEll(toWorld(P, [0, 0, 0]), [2.7, 2.3, 1.5]), sdfEll(toWorld(P, [-4.75, 0, 0.35]), [3.4, 2.6, 2.1]), sdfPlane(TRAY_FLOOR));
};

// ------------------------------------------------------------------ the gripper at any time
/** per-leg lag (s): the shared pressure reaches the legs a few frames apart */
export const LAG = [0.0, 0.03, 0.05, 0.02, 0.04, 0.01, 0.06, 0.035];
export const withLag = (fn: (t: number) => number, t: number) => LAG.map((l) => fn(t - l));

export const gripperPose = (t: number, station: 'A' | 'D' | 'E' | 'F'): SpiderPose => {
  if (station === 'A') return {pos: A_POS(t), yaw: A_YAW, e: withLag(A_EXT, t)};
  if (station === 'D') {
    const P: SpiderPose = {pos: D_POS(t), yaw: D_YAW, e: withLag(D_EXT, t)};
    const lift = D_BLOCK_LIFT(t);
    const solid = lift > 0 ? sdfUnion(sdfBox(add3(BLOCK.c, [0, 0, lift]), BLOCK.h, 0.35, BLOCK.yaw), sdfPlane(0)) : D_SOLID;
    return {...P, e: P.e.map((e, i) => legContact(P, i, e, solid))};
  }
  if (station === 'E') {
    // the gripper is already closed round the weight when this demonstration begins
    const P: SpiderPose = {pos: E_POS(t), yaw: E_YAW, e: Array(8).fill(0)};
    const solid = sdfUnion(E_SOLID(t), sdfPlane(PAN_TOP));
    return {...P, e: P.e.map((e, i) => legContact(P, i, e, solid))};
  }
  const P: SpiderPose = {pos: F_POS(t), yaw: F_YAW, e: withLag(F_EXT, t)};
  const solid = F_SOLID(t);
  return {...P, e: P.e.map((e, i) => legContact(P, i, e, solid))};
};
/** the needle's entry point and its axis top (the hub) for a gripper pose */
export const needleEntry = (P: SpiderPose) => toWorld(P, NEEDLE_IN);
