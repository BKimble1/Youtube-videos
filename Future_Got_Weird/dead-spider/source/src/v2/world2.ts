// V2: the experiment as pure functions of time (seconds), every event placed from the measured V2 narration.
// Two places:
// - the hook pad (origin): a dead wolf spider on a white specimen pad and a hand-held 1 mL syringe with its needle;
// - the lab bench: the same kind of syringe held upright in a clamp on a swinging stand arm (the "claw"). The arm turns
//   about the stand rod and slides up and down it, so the gripper visits four stations on one arc: the insertion pad,
//   the test block, the dish, and the second spider. The stand carries the gripper; the specimen never moves itself.
import {clamp, keyS, lerp, ss, ss5} from '../lib';
import {legContact, NEEDLE_IN, sdfBox, sdfEll, sdfPlane, sdfUnion, SDF, SpiderPose, toWorld} from '../spider';
import {add3, rotZ, sub3, V3} from '../three';
import {T, word} from './lib2';
import {AIR, legTracks, SpringParams} from './spring';

// ------------------------------------------------------------------ narration anchors
export const TM = {
  needle: word('needle').start, // 0.72
  dead: word('dead').start, // 1.41
  could: word('could').start, // 2.80
  move: word('move').start, // 3.60
  again: word('again').end, // 4.48
  because: word('because').start, // 4.56
  dies: word('dies').start, // 5.32
  all: word('all').start, // 6.00
  curl: word('curl').start, // 6.80
  inward: word('inward').start, // 7.04
  you2: T('you see').start, // 7.84
  fluid: word('fluid').start, // 9.20
  pressure1: word('pressure').start, // 9.52
  straighten: word('straighten').start, // 9.92
  legs2: T('their legs').end, // 10.99
  and2: T('and when they die').start, // 11.00
  die: word('die').start, // 11.64
  pressure2: word('pressure', 1).start, // 12.24
  disappears: word('disappears').start, // 12.48
  so: word('so').start, // 13.52
  attached: word('attached').start, // 14.24
  syringe: word('syringe').start, // 14.72
  dead2: word('dead', 1).start, // 15.60
  pumped: word('pumped').start, // 16.60
  air: word('air').start, // 16.96
  its: T('its legs suddenly').start, // 18.16
  suddenly: word('suddenly').start, // 18.64
  spread: word('spread').start, // 19.04
  open: word('open').start, // 19.36
  but: word('but').start, // 20.11
  released: word('released').start, // 20.48
  pressure3: word('pressure', 2).start, // 20.96
  legs3: T('the legs clamped').start, // 21.67
  clamped: word('clamped').start, // 22.16
  shut: word('shut').start, // 22.68
  theyd: word("they'd").start, // 23.43
  working: word('working').start, // 25.31
  claw: word('claw').start, // 25.52
  and4: T('and they actually').start, // 26.21
  pick: word('pick').start, // 27.52
  another: word('another').start, // 28.29
  dead4: word('dead', 3).start, // 28.76
  spider4: word('spider', 4).start, // 28.96
};

// ------------------------------------------------------------------ cuts (s)
export const CUT = {
  overhead: 4.52, // Beat A: the neutral overhead explanation (match on the open spider)
  leg: 7.8, // Beat B1: inside one leg
  body: 10.96, // Beat B2: the whole spider in cutaway, pressure lost
  lab: 13.48, // Beat C1: the lab, operator and claw stand
  needle: 14.9, // C2: the needle into the prosoma
  plunger: 16.47, // C3: plunger -> air -> legs (one continuous move)
  release: 20.11, // D1: the hand lets the pressure out
  clamp: 21.6, // D2: three-quarter view, the legs clamp the block
  claw: 23.39, // the working claw: lift, carry, drop
  reveal: 26.19, // the final reveal over the second spider
  tight: 28.0, // tight on the grab and the lift
  end: 30.2,
};

// ------------------------------------------------------------------ the hook: a hand-held syringe
export const PAD_Z = 2; // the specimen pads are 2 mm thick on the bench (z = 0)
export const H_YAW = 206;
/** the hand turns the hanging spider toward the camera while it is open ("into a DEAD spider"): its dead face */
export const H_YAW_T = (t: number) => H_YAW + 30 * ss5(t, 1.0, 2.45);
export const H_REST_Z = PAD_Z + 1.5; // the curled spider rests on its abdomen and leg bends
/** needle tip height above the insertion point (mm; negative = inserted) */
export const H_NEEDLE = (t: number) => keyS(t, [[0, 3.4], [0.2, 0], [0.3, -0.9]], (x) => ss(x, 0, 1) * 0.6 + x * 0.4);
/** the hand lifts the needled spider clear of the pad as the air goes in */
export const H_Z = (t: number) => keyS(t, [[0, H_REST_Z], [0.3, H_REST_Z], [0.72, H_REST_Z + 5.8]]);
export const H_POS = (t: number): V3 => [0, 0, H_Z(t)];
/** stopper travel of the hand-held syringe, 0..1 (1 = pushed home) */
export const H_PLUNGER = (t: number) => keyS(t, [[0, 0.62], [0.33, 0.62], [0.58, 0.86], [2.5, 0.86], [2.74, 0.7], [3.36, 0.7], [3.56, 0.97]]);
/** the commanded leg extension: open on the first push, eased back as the pressure is let out, open again on "MOVE" */
const H_CMD = (t: number) => keyS(t, [[0, 0], [0.4, 0], [0.5, 1], [2.56, 1], [2.68, 0.1], [3.44, 0.1], [3.52, 1]]);
const H_LEGS = legTracks(H_CMD, AIR, 0, 4.6);
export const hookPose = (t: number): SpiderPose => {
  const P: SpiderPose = {pos: H_POS(t), yaw: H_YAW_T(t), e: H_LEGS(t)};
  return {...P, e: P.e.map((e, i) => legContact(P, i, e, sdfPlane(PAD_Z)))};
};

// ------------------------------------------------------------------ Beat A: a spider dies (neutral, overhead)
const A_CMD = (t: number) => keyS(t, [[0, 1], [TM.curl - 0.22, 1], [TM.curl + 0.3, 0]]);
const DEATH: SpringParams = {open: [1.4, 0.9], close: [1.15, 0.85]};
const A_LEGS = legTracks(A_CMD, DEATH, CUT.overhead - 0.1, CUT.leg + 0.1);
/** the overhead spider: the same individual and pose as the hook's last frame, then the death curl */
export const A_Z = H_Z(CUT.overhead);
export const A_YAW2 = H_YAW_T(CUT.overhead);
export const overheadPose = (t: number): SpiderPose => ({pos: [0, 0, A_Z], yaw: A_YAW2, e: t < CUT.overhead + 0.3 ? H_LEGS(t).map((e, i) => lerp(e, A_LEGS(t)[i], ss(t, CUT.overhead, CUT.overhead + 0.3))) : A_LEGS(t)});
/** life drains from the colours on "dies" */
export const A_LIFE = (t: number) => 1 - ss(t, TM.dies - 0.05, TM.dies + 0.5);

// ------------------------------------------------------------------ the lab: the claw stand
export const ROD: V3 = [300, 140, 0];
export const ARM_LEN = 120;
export const PHI = {pad: -100, block: -84, dish: -66, s2: -48};
/** gripper station on the arc */
export const station = (phi: number): V3 => {
  const a = (phi * Math.PI) / 180;
  return [ROD[0] + ARM_LEN * Math.cos(a), ROD[1] + ARM_LEN * Math.sin(a), 0];
};
export const YAW_OFF = 66; // the spider's heading relative to the arm
/** arm angle (deg) */
export const L_PHI = (t: number) =>
  keyS(t, [
    [0, PHI.pad],
    [19.5, PHI.pad],
    [20.75, PHI.block],
    [23.78, PHI.block],
    [24.95, PHI.dish],
    [25.78, PHI.dish],
    [26.62, PHI.s2],
  ]);
export const GRIP_Z_BLOCK = 5.05;
export const BLOCK_H = 1.8;
export const S2_SCALE = 0.92;
export const S2_CROSS = 90; // the second spider lies across the gripper's heading
export const S2_MID = 2.0; // mm behind its prosoma centre: the middle of its body
export const GRIP_Z_S2 = PAD_Z + 5.35;
/** height of the gripper's body centre above the bench */
export const L_Z = (t: number) =>
  keyS(t, [
    [0, H_REST_Z],
    [16.02, H_REST_Z],
    [16.45, H_REST_Z + 6.5], // lifted off the pad on the needle
    [20.3, H_REST_Z + 6.5],
    [21.45, GRIP_Z_BLOCK], // lowered so the open legs surround the block
    [22.95, GRIP_Z_BLOCK],
    [23.75, 15.5], // the lift
    [25.78, 15.5],
    [26.62, 16.5],
    [28.02, GRIP_Z_S2], // reaching down over the second spider
    [28.78, GRIP_Z_S2],
    [29.72, 15.2], // both lifted
  ]);
/** the needle tip above the entry point before it goes in (the arm comes down the rod) */
export const L_NEEDLE = (t: number) => keyS(t, [[0, 30], [13.7, 30], [15.05, 4.2], [15.45, 0], [15.6, -0.9]]);
export const L_GLUE = (t: number) => ss(t, 15.72, 16.02);
/** plunger travel at the claw, 0..1 */
export const L_PLUNGER = (t: number) =>
  keyS(t, [
    [0, 0],
    [16.62, 0],
    [16.98, 0.17], // "pumped air": the first push
    [18.5, 0.17],
    [18.66, 0.45], // the decisive push: "suddenly"
    [20.64, 0.45],
    [21.75, 0.03], // "released the pressure": the air pushes the plunger back up
    [25.18, 0.03],
    [25.38, 0.45], // air in to drop the block
    [28.2, 0.45],
    [28.45, 0.03], // released over the second spider
  ]);
/** the index finger on the thumb rest: 0 = pressing, 1 = lifted off */
export const L_FINGER = (t: number) => keyS(t, [[0, 1], [16.4, 1], [16.6, 0], [20.45, 0], [20.62, 1], [25.0, 1], [25.18, 0], [28.15, 0], [28.3, 1]]);
/** commanded leg extension (pressure inside the specimen) */
const L_CMD = (t: number) =>
  keyS(t, [
    [0, 0],
    [17.55, 0],
    [17.85, 0.12], // the first air arrives: the legs stir
    [18.62, 0.12],
    [18.7, 1], // spread open
    [21.95, 1],
    [22.02, 0], // clamped
    [25.38, 0],
    [25.46, 1], // let go of the block
    [28.27, 1],
    [28.35, 0], // clamp on the second spider
  ]);
const L_LEGS = legTracks(L_CMD, AIR, 13.0, 30.4);
/** the legs' free (no-contact) extensions, for finding contact moments */
export const labLegsFree = L_LEGS;
export const hookLegsFree = (t: number) => H_LEGS(t);
/** pressure in the specimen, 0..1 (drives the air accent) */
export const L_PRESS = (t: number) => keyS(t, [[0, 0], [16.98, 0], [17.5, 0.4], [18.62, 0.4], [18.72, 1], [21.3, 1], [22.0, 0], [25.38, 0], [25.45, 1], [28.25, 1], [28.36, 0]]);

export const L_YAW = (t: number) => L_PHI(t) + YAW_OFF;
/** the gripper body centre */
export const L_POS = (t: number): V3 => {
  const s = station(L_PHI(t));
  return [s[0], s[1], L_Z(t)];
};

// ------------------------------------------------------------------ payloads
export const BLOCK_YAW0 = 18;
const BLOCK_REST: V3 = (() => {
  const s = station(PHI.block);
  return [s[0], s[1], BLOCK_H];
})();
export const T_LIFT_BLOCK = 22.95;
export const T_DROP = 25.47;
export const DISH = {c: station(PHI.dish), r: 15, floor: 1.0, rim: 5.5};
/** the block: on the bench, carried rigidly in the closed legs, dropped into the dish */
export const blockAt = (t: number): {c: V3; yaw: number} => {
  if (t <= T_LIFT_BLOCK) return {c: BLOCK_REST, yaw: BLOCK_YAW0};
  const carry = (u: number) => {
    // rigid with the gripper: rotate about the rod by the arm's turn, rise with the arm
    const d = L_PHI(u) - PHI.block;
    const rel = rotZ(sub3(BLOCK_REST, [ROD[0], ROD[1], 0]), d);
    return {c: [ROD[0] + rel[0], ROD[1] + rel[1], BLOCK_H + L_Z(u) - L_Z(T_LIFT_BLOCK)] as V3, yaw: BLOCK_YAW0 + d};
  };
  if (t <= T_DROP) return carry(t);
  const r = carry(T_DROP);
  const z0 = r.c[2], zf = DISH.floor + BLOCK_H;
  return {c: [r.c[0], r.c[1], dropZ(t - T_DROP, z0, zf)], yaw: r.yaw};
};
/** a short fall and two small bounces */
const dropZ = (dt: number, z0: number, zf: number) => {
  const g = 5200; // mm/s^2 (a touch under gravity, so the fall spans a few frames)
  const h = z0 - zf;
  const t1 = Math.sqrt((2 * h) / g);
  if (dt < t1) return z0 - 0.5 * g * dt * dt;
  let v = g * t1 * 0.28;
  let tt = dt - t1;
  for (let k = 0; k < 2; k++) {
    const tb = (2 * v) / g;
    if (tt < tb) return zf + v * tt - 0.5 * g * tt * tt;
    tt -= tb;
    v *= 0.3;
  }
  return zf;
};
/** the second dead spider: smaller, paler, lying across the gripper's path */
const S2_BASE: SpiderPose = (() => {
  // its mid-body (between the two body sections) lies under the middle of the gripper's ring of legs
  const s = station(PHI.s2);
  const yaw = PHI.s2 + YAW_OFF + S2_CROSS;
  const a = (yaw * Math.PI) / 180;
  const k = S2_MID * S2_SCALE;
  return {pos: [s[0] + k * Math.cos(a), s[1] + k * Math.sin(a), PAD_Z + 1.5 * S2_SCALE] as V3, yaw, e: [0.06, 0.1, 0.02, 0.08, 0.05, 0.0, 0.1, 0.04], s: S2_SCALE};
})();
export const T_LIFT_S2 = 28.78;
export const PAD_HALF = 22;
export const S2_PAD = 15;
export const s2At = (t: number): SpiderPose => ({...S2_BASE, pos: add3(S2_BASE.pos, [0, 0, t <= T_LIFT_S2 ? 0 : Math.max(0, L_Z(t) - L_Z(T_LIFT_S2))])});
const s2Solid = (P: SpiderPose): SDF => {
  const k = P.s ?? 1;
  return sdfUnion(sdfEll(toWorld(P, [0, 0, 0]), [2.7 * k, 2.3 * k, 1.5 * k]), sdfEll(toWorld(P, [-4.75, 0, 0.35]), [3.4 * k, 2.6 * k, 2.1 * k]));
};
/** what the gripper's legs can touch: the bench, the insertion pad, the block, the dish floor, the second spider */
export const labSolid = (t: number): SDF => {
  const b = blockAt(t);
  const parts: SDF[] = [sdfPlane(0), sdfBox(add3(station(PHI.pad), [0, 0, PAD_Z / 2]), [PAD_HALF, PAD_HALF, PAD_Z / 2], 0.5, 0), sdfBox(b.c, [BLOCK_H, BLOCK_H, BLOCK_H], 0.35, b.yaw)];
  if (t > 26) parts.push(s2Solid(s2At(t)), sdfBox(add3(station(PHI.s2), [0, 0, PAD_Z / 2]), [S2_PAD, S2_PAD, PAD_Z / 2], 0.5, 0));
  return sdfUnion(...parts);
};

export const labPose = (t: number): SpiderPose => {
  const P: SpiderPose = {pos: L_POS(t), yaw: L_YAW(t), e: L_LEGS(t)};
  const solid = labSolid(t);
  return {...P, e: P.e.map((e, i) => legContact(P, i, e, solid))};
};
/** the needle entry point for a pose */
export const entryOf = (P: SpiderPose) => toWorld(P, NEEDLE_IN);
void clamp;
