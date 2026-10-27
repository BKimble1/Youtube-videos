// V3: the experiment as pure functions of time, on the unchanged V2 narration (v2/lib2, data/timeline_v2.json).
// Places:
// - the hook mat (origin): a dead wolf spider on a dark lab mat; a slender needle comes in and punctures the prosoma;
// - open ground (Beat A) and a leaf (Beat B): living spiders, standing, whose feet stay on the surface as they die;
// - the lab bench: the claw stand of V2, its arm swinging over an arc of stations (insertion pad, test block, dish,
//   and a separate raised platform with a dark mat where the second spider lies).
import {keyS, lerp, ss, ss5} from '../lib';
import {legContact, legLocal, NEEDLE_IN, sdfBox, sdfEll, sdfPlane, sdfUnion, SDF, SpiderPose, toWorld} from '../spider';
import {add3, rotZ, sub3, V3} from '../three';
import {T, word} from '../v2/lib2';
import {AIR, LAG2, legTracks, legTracksPer, SpringParams} from '../v2/spring';

export const TM = {
  needle: word('needle').start,
  dead: word('dead').start, // 1.41
  move: word('move').start, // 3.60
  again: word('again').end,
  dies: word('dies').start, // 5.32
  all: word('all').start, // 6.00
  curl: word('curl').start, // 6.80
  inward: word('inward').start,
  see: word('see').start, // 8.12
  fluid: word('fluid').start, // 9.20
  pressure1: word('pressure').start, // 9.52
  straighten: word('straighten').start, // 9.92
  legs2: T('their legs').end, // 10.99
  die: word('die').start, // 11.64
  pressure2: word('pressure', 1).start, // 12.24
  disappears: word('disappears').start, // 12.48
  attached: word('attached').start, // 14.24
  dead2: word('dead', 1).start, // 15.60
  pumped: word('pumped').start, // 16.60
  air: word('air').start,
  suddenly: word('suddenly').start, // 18.64
  spread: word('spread').start, // 19.04
  open: word('open').start, // 19.36
  released: word('released').start, // 20.48
  clamped: word('clamped').start, // 22.16
  claw: word('claw').start, // 25.52
  pick: word('pick').start, // 27.52
  another: word('another').start, // 28.29
  dead4: word('dead', 3).start, // 28.76
};

export const CUT = {
  nature: 4.52, // Beat A: a living spider on open ground (match on the open silhouette)
  leaf: 7.8, // Beat B: a living spider on a leaf; into one joint and back out
  lab: 13.48, // the operator steadies the specimen
  needle: 14.3, // the needle comes down to the front body section
  attach: 15.0, // close on the needle going in
  follow: 15.78, // up the connected syringe to the plunger, and back down with the air
  side: 18.15, // tight side view: air in, the legs expand over the test block
  under: 19.0, // down under the spider: the open legs come down round the block
  release: 20.0, // three-quarter on the plunger: the finger lifts, the plunger rises
  grip: 21.0, // down the needle with the air leaving, to the grip: the legs close on the block
  hold: 22.0, // the block held: a slight lift, the legs stay clamped
  clamp: 19.45,
  lift: 23.39, // a new three-quarter angle: the block beneath the curled legs; follow the carry
  travel: 26.19, // at spider level toward another platform, behind foreground equipment
  reveal: 27.0, // close on the open gripper coming down; tilt to reveal the second spider
  end: 30.2,
};

// ------------------------------------------------------------------ the hook
export const MAT_Z = 1.5; // the dark lab mat on the bench
export const H_YAW = 222;
export const H_REST_Z = MAT_Z + 1.5;
/** needle tip above the insertion point: already coming in at frame 0, a quick puncture */
export const H_NEEDLE = (t: number) => keyS(t, [[0, 9], [0.22, 0], [0.31, -0.9]], (x) => x * x * (1.6 - 0.6 * x));
/** the puncture shudder: a small, fast, decaying vibration of the body on the needle (mm) */
export const H_SHAKE = (t: number) => (t < 0.22 ? 0 : 0.16 * Math.exp(-(t - 0.22) / 0.07) * Math.sin(2 * Math.PI * 24 * (t - 0.22)));
/** the syringe lifts the needled spider clear of the mat as the air goes in */
export const H_Z = (t: number) => keyS(t, [[0, H_REST_Z], [0.36, H_REST_Z], [0.95, H_REST_Z + 6.6]]);
export const H_POS = (t: number): V3 => [0, 0, H_Z(t) + H_SHAKE(t)];
/** the leg the camera closes on at the end of the hook (and the living spider's same leg at the match) */
export const HOOK_LEG = 1;
/** the first legs to react (the pressure reaches them first) */
const FIRST = [0, 5, 2];
/** stopper travel of the syringe, 0..1 (1 = pushed home) */
export const H_PLUNGER = (t: number) => keyS(t, [[0, 0.45], [0.34, 0.45], [0.52, 0.72], [2.18, 0.72], [2.32, 0.84], [2.66, 0.84], [2.8, 0.76], [3.42, 0.76], [3.56, 0.98]]);
/** pressure in the specimen 0..1 (drives the air accent) */
export const H_PRESS = (t: number) => keyS(t, [[0, 0], [0.36, 0], [0.5, 0.85], [1.05, 0.85], [1.4, 0.55], [2.22, 0.55], [2.34, 0.9], [2.68, 0.9], [2.8, 0.65], [3.45, 0.65], [3.56, 1]]);
const hookCmd = (i: number) => (t: number) => {
  const first = FIRST.includes(i);
  const lag = first ? 0 : 0.05 + 0.03 * ((i * 3) % 5);
  // injection snaps the legs open; then they hook down (grip); answer each push of the plunger; widest on "MOVE"
  return keyS(t - lag, [[0, 0], [0.38, 0], [0.46, 1], [1.05, 1], [1.4, 0.6], [2.22, 0.6], [2.32, 0.95], [2.68, 0.95], [2.8, 0.7], [3.45, 0.7], [3.53, 1]]);
};
const H_LEGS = legTracksPer(Array.from({length: 8}, (_, i) => hookCmd(i)), AIR, 0, 4.7);
export const hookLegsFree = H_LEGS;
export const hookPose = (t: number): SpiderPose => {
  const P: SpiderPose = {pos: H_POS(t), yaw: H_YAW, e: H_LEGS(t)};
  return {...P, e: P.e.map((e, i) => legContact(P, i, e, sdfPlane(MAT_Z)))};
};
/** the hook's clamp stand (the syringe is held upright in it) */
export const H_ROD: V3 = [-30, 78, 0];

// ------------------------------------------------------------------ living spiders on a surface
/** raise each leg about its base just enough that no part of it goes below the ground (feet stay on the surface) */
export const groundLegs = (P: SpiderPose, groundZ: number): SpiderPose => {
  const dth = P.e.map((e, i) => {
    const low = (d: number) => {
      const L = legLocal(i, e, d).map((q) => toWorld(P, q));
      let m = Infinity;
      for (let k = 2; k < L.length; k++) m = Math.min(m, L[k][2] - (k === L.length - 1 ? 0.12 : 0.25) * (P.s ?? 1));
      return m - groundZ;
    };
    if (low(0) >= 0) return 0;
    let lo = 0, hi = 80;
    for (let k = 0; k < 16; k++) {
      const m = (lo + hi) / 2;
      if (low(m) < 0) lo = m;
      else hi = m;
    }
    return hi;
  });
  return {...P, dth};
};
const DEATH: SpringParams = {open: [1.4, 0.9], close: [1.0, 0.86]};
/** standing height: the open feet just reach the ground; the curled rest height: on the abdomen */
export const STAND = 3.38;
export const REST = 1.55;

/** Beat A: the same silhouette as the hook's end, on open ground; it dies, its legs fold and it sinks */
export const A_POS0 = H_POS(CUT.nature);
export const A_GROUND = A_POS0[2] - STAND;
const A_CMD = (t: number) => keyS(t, [[0, 1], [TM.curl - 0.75, 1], [TM.curl + 0.15, 0]]);
/** the legs fold one after another (front pair first, the back legs last), not as one */
const A_LAG = [0.0, 0.08, 0.17, 0.26, 0.04, 0.12, 0.21, 0.3];
const A_LEGS = legTracksPer(A_LAG.map((l) => (t: number) => A_CMD(t - l)), DEATH, CUT.nature - 0.1, CUT.leaf + 0.1);
export const A_LIFE = (t: number) => 1 - ss(t, TM.dies - 0.05, TM.dies + 0.6);
export const natPose = (t: number): SpiderPose => {
  const alive = A_LIFE(t);
  const sink = ss5(t, TM.curl - 0.45, TM.curl + 0.95);
  const z = A_GROUND + lerp(STAND, REST, sink) + 0.05 * alive * Math.sin(2 * Math.PI * 1.1 * t);
  // the first frames carry the hook's last pose, so the match holds
  const e = t < CUT.nature + 0.25 ? H_LEGS(t).map((x, i) => lerp(Math.min(1, x), A_LEGS(t)[i], ss(t, CUT.nature, CUT.nature + 0.25))) : A_LEGS(t);
  return groundLegs({pos: [0, 0, z], yaw: H_YAW, e}, A_GROUND);
};

/** Beat B: a living spider on a leaf, one front leg raised and bent; pressure straightens it; at death all fold */
export const B_LEG = 4;
export const B_YAW = 20;
export const B_GROUND = 0;
const B_FOCUS = (t: number) => keyS(t, [[0, 0.3], [TM.straighten - 0.2, 0.3], [TM.straighten + 0.15, 1]]);
const B_DIE = (t: number) => keyS(t, [[0, 1], [TM.disappears - 0.05, 1], [TM.disappears + 0.35, 0]]);
const B_TR_F = legTracks(B_FOCUS, {open: [1.5, 0.72], close: [1.5, 0.8]}, CUT.leaf - 0.2, CUT.lab + 0.2);
const B_TR_D = legTracks(B_DIE, DEATH, CUT.leaf - 0.2, CUT.lab + 0.2);
export const B_ALIVE = (t: number) => 1 - ss(t, TM.die - 0.1, TM.die + 0.4);
export const B_PRESS = (t: number) => keyS(t, [[0, 0.32], [TM.fluid - 0.1, 0.32], [TM.pressure1 + 0.3, 1], [TM.pressure2 - 0.1, 1], [TM.pressure2 + 0.5, 0.1]]);
export const B_SQUEEZE = (t: number) => keyS(t, [[0, 0.2], [TM.fluid - 0.1, 0.2], [TM.pressure1 + 0.15, 1], [TM.legs2, 0.72], [TM.die - 0.1, 0.72], [TM.die + 0.45, 0]]);
export const leafPose = (t: number): SpiderPose => {
  const f = B_TR_F(t), d = B_TR_D(t);
  const e = d.map((x, i) => (i === B_LEG ? Math.min(f[i], x) : x));
  const sink = ss5(t, TM.disappears + 0.05, TM.disappears + 0.9);
  return groundLegs({pos: [0, 0, B_GROUND + lerp(STAND, REST, sink)], yaw: B_YAW, e}, B_GROUND);
};

// ------------------------------------------------------------------ the lab
export const PAD_Z = 2;
export const ROD: V3 = [300, 140, 0];
export const ARM_LEN = 120;
export const PHI = {pad: -100, block: -84, dish: -66, s2: -18};
export const station = (phi: number): V3 => {
  const a = (phi * Math.PI) / 180;
  return [ROD[0] + ARM_LEN * Math.cos(a), ROD[1] + ARM_LEN * Math.sin(a), 0];
};
export const YAW_OFF = 66;
export const L_REST_Z = PAD_Z + 1.5;
export const GRIP_Z_BLOCK = 5.05;
export const BLOCK_H = 1.8;
/** the final platform: a dark mat on a riser block */
export const RISER = 16;
export const PLAT = {c: station(PHI.s2), half: 17, top: RISER + MAT_Z};
export const S2_SCALE = 0.92;
export const S2_CROSS = 80;
export const S2_MID = 2.0;
export const GRIP_Z_S2 = PLAT.top + 5.35;
export const L_PHI = (t: number) =>
  keyS(t, [
    [0, PHI.pad],
    [16.5, PHI.pad],
    [17.65, PHI.block], // swung over the test block while the first air goes in
    [23.78, PHI.block],
    [24.95, PHI.dish],
    [25.7, PHI.dish],
    [27.35, PHI.s2],
  ]);
export const L_Z = (t: number) =>
  keyS(t, [
    [0, L_REST_Z],
    [16.02, L_REST_Z],
    [16.45, L_REST_Z + 6.5],
    [19.05, L_REST_Z + 6.5],
    [19.95, GRIP_Z_BLOCK], // lowered so the open legs stand round the block
    [22.3, GRIP_Z_BLOCK],
    [22.85, GRIP_Z_BLOCK + 2.4], // a slight lift: the block comes up in the closed legs
    [23.35, GRIP_Z_BLOCK + 2.4],
    [24.0, 15.5],
    [25.7, 15.5],
    [26.3, PLAT.top + 17],
    [27.3, PLAT.top + 17],
    [28.4, GRIP_Z_S2],
    [28.95, GRIP_Z_S2],
    [29.8, GRIP_Z_S2 + 10],
  ]);
export const L_NEEDLE = (t: number) => keyS(t, [[0, 30], [14.3, 30], [15.1, 3.6], [15.45, 0], [15.58, -0.9]]);
export const L_GLUE = (t: number) => ss(t, 15.7, 16.0);
export const L_PLUNGER = (t: number) =>
  keyS(t, [
    [0, 0],
    [16.62, 0],
    [16.98, 0.17],
    [18.5, 0.17],
    [18.66, 0.45],
    [20.5, 0.45],
    [21.2, 0.03],
    [25.18, 0.03],
    [25.38, 0.45],
    [28.35, 0.45],
    [28.62, 0.03],
  ]);
export const L_FINGER = (t: number) => keyS(t, [[0, 1], [16.4, 1], [16.6, 0], [20.38, 0], [20.55, 1]]);
const L_CMD = (t: number) =>
  keyS(t, [
    [0, 0],
    [17.55, 0],
    [17.85, 0.12],
    [18.62, 0.12],
    [18.7, 1],
    [21.6, 1],
    [21.67, 0],
    [25.38, 0],
    [25.46, 1],
    [28.62, 1],
    [28.7, 0],
  ]);
/** closing is slightly staggered: front legs first, back legs last, like a gripper's fingers */
const CLOSE_LAG = [0.0, 0.03, 0.06, 0.09, 0.015, 0.045, 0.075, 0.1];
const L_LEGS = (() => {
  const cmds = Array.from({length: 8}, (_, i) => (t: number) => {
    const opening = L_CMD(t + 0.001) >= L_CMD(t - 0.001);
    return L_CMD(t - (opening ? LAG2[i] : CLOSE_LAG[i]));
  });
  return legTracksPer(cmds, AIR, 13.0, 30.4);
})();
export const labLegsFree = L_LEGS;
export const L_PRESS = (t: number) => keyS(t, [[0, 0], [16.98, 0], [17.5, 0.4], [18.62, 0.4], [18.72, 1], [20.5, 1], [21.6, 0], [25.38, 0], [25.45, 1], [28.4, 1], [28.68, 0]]);
/** the air leaving: a pale slug running back up the needle (0..1 along it, 1 = at the hub) */
export const L_OUTFLOW = (t: number) => (t > 20.85 && t < 21.55 ? (t - 20.85) / 0.7 : t > 28.42 && t < 28.7 ? (t - 28.42) / 0.28 : -1);
export const L_YAW = (t: number) => L_PHI(t) + YAW_OFF;
export const L_POS = (t: number): V3 => {
  const s = station(L_PHI(t));
  return [s[0], s[1], L_Z(t)];
};

// payloads
export const BLOCK_YAW0 = 18;
const BLOCK_REST: V3 = (() => {
  const s = station(PHI.block);
  return [s[0], s[1], BLOCK_H];
})();
export const T_LIFT_BLOCK = 22.3;
export const T_DROP = 25.47;
export const DISH = {c: station(PHI.dish), r: 15, floor: 1.0, rim: 5.5};
export const blockAt = (t: number): {c: V3; yaw: number} => {
  if (t <= T_LIFT_BLOCK) return {c: BLOCK_REST, yaw: BLOCK_YAW0};
  const carry = (u: number) => {
    const d = L_PHI(u) - PHI.block;
    const rel = rotZ(sub3(BLOCK_REST, [ROD[0], ROD[1], 0]), d);
    return {c: [ROD[0] + rel[0], ROD[1] + rel[1], BLOCK_H + L_Z(u) - L_Z(T_LIFT_BLOCK)] as V3, yaw: BLOCK_YAW0 + d};
  };
  if (t <= T_DROP) return carry(t);
  const r = carry(T_DROP);
  return {c: [r.c[0], r.c[1], dropZ(t - T_DROP, r.c[2], DISH.floor + BLOCK_H)], yaw: r.yaw};
};
const dropZ = (dt: number, z0: number, zf: number) => {
  const g = 5200;
  const t1 = Math.sqrt((2 * (z0 - zf)) / g);
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
const S2_BASE: SpiderPose = (() => {
  const s = station(PHI.s2);
  const yaw = PHI.s2 + YAW_OFF + S2_CROSS;
  const a = (yaw * Math.PI) / 180;
  const k = S2_MID * S2_SCALE;
  return {pos: [s[0] + k * Math.cos(a), s[1] + k * Math.sin(a), PLAT.top + 1.5 * S2_SCALE] as V3, yaw, e: [0.06, 0.1, 0.02, 0.08, 0.05, 0.0, 0.1, 0.04], s: S2_SCALE};
})();
export const T_LIFT_S2 = 28.95;
export const PAD_HALF = 22;
export const s2At = (t: number): SpiderPose => ({...S2_BASE, pos: add3(S2_BASE.pos, [0, 0, t <= T_LIFT_S2 ? 0 : Math.max(0, L_Z(t) - L_Z(T_LIFT_S2))])});
const s2Solid = (P: SpiderPose): SDF => {
  const k = P.s ?? 1;
  return sdfUnion(sdfEll(toWorld(P, [0, 0, 0]), [2.7 * k, 2.3 * k, 1.5 * k]), sdfEll(toWorld(P, [-4.75, 0, 0.35]), [3.4 * k, 2.6 * k, 2.1 * k]));
};
export const labSolid = (t: number): SDF => {
  const b = blockAt(t);
  const parts: SDF[] = [sdfPlane(0), sdfBox(add3(station(PHI.pad), [0, 0, PAD_Z / 2]), [PAD_HALF, PAD_HALF, PAD_Z / 2], 0.5, 0), sdfBox(b.c, [BLOCK_H, BLOCK_H, BLOCK_H], 0.35, b.yaw)];
  if (t > 25.9) parts.push(s2Solid(s2At(t)), sdfBox(add3(PLAT.c, [0, 0, PLAT.top / 2]), [PLAT.half, PLAT.half, PLAT.top / 2], 0.5, 0));
  return sdfUnion(...parts);
};
export const labPose = (t: number): SpiderPose => {
  const P: SpiderPose = {pos: L_POS(t), yaw: L_YAW(t), e: L_LEGS(t)};
  const solid = labSolid(t);
  // the first-contact sweep applies only while the legs close from open onto a payload (the two grabs)
  const sweep = (t > 21.5 && t < 25.4) || t > 28.55;
  return {...P, e: P.e.map((e, i) => legContact(P, i, e, solid, sweep))};
};
export const entryOf = (P: SpiderPose) => toWorld(P, NEEDLE_IN);
