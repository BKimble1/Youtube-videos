// The Crew in E/F (and the aftermath poses D4 ends on): the Director dying against the slab, the drone pilot reaching
// him, holding his hand and later turning the radio on, the others held by units, the runner down. Every figure is a
// FigSpec at film time T built on the tableau (tableau.ts); contacts are world points shared by both bodies.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, lerp, lerp3, clamp, smooth, easeIn, noise} from '../../../kit/math';
import {View, headingVec, Item, SpriteItem, makeView} from '../../engine';
import {groundH, RADIO} from '../../world';
import {radioFn} from '../../world/props';
import {
  FigSpec, figureRig, figProps, figLight, figureParts, Pose, keyPose, layer, SLUMP, KNEEL, LYING_BACK, STAND, lookR2, dmgR2,
  plateWear, hipReel, Part, figureSprite, SH_X, SH_H, UPPER, FORE, HIP_H, THIGH, SHIN, PINCH_X,
} from '../../rig';

/** rig units per metre (440 units = 1.75 m) */
const RIG_PER_M = 251.4;
import {TB_CREW, DIRECTOR_SEAT} from './tableau';
import {KNOB_POS} from './camera';
import {M} from '../../timing';

const hv = headingVec;
/** World point relative to a body: fwd / right (m) along its heading, `up` above the ground there (or absolute y). */
export const at3 = (p: {x: number; z: number}, heading: number, fwd: number, right: number, up: number): V3 => {
  const f = hv(heading), r = hv(heading + 90);
  const x = p.x + f.x * fwd + r.x * right, z = p.z + f.z * fwd + r.z * right;
  return {x, y: groundH(x, z) + up, z};
};
const headingTo = (a: {x: number; z: number}, b: {x: number; z: number}) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
const wrap = (a: number) => ((a + 540) % 360) - 180;

/** Keyed scalar (smoothstep between keys). */
export const kn = (T: number, keys: [number, number][]): number => {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (T <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], smooth((T - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
/** Keyed point (smoothstep between keys). */
export const kv = (T: number, keys: [number, V3][]): V3 => {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (T <= keys[i][0]) return lerp3(keys[i - 1][1], keys[i][1], smooth((T - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};

// A neutral view for solving world points of a body (the rig's world points do not depend on the view).
const SOLVE_VIEW: View = makeView({pos: {x: 9.5, y: 1.4, z: 7.5}, target: {x: 7, y: 0.6, z: 3.2}, fov: 40});

// ================================================================== the Director
export const DIR = {pos: DIRECTOR_SEAT, heading: TB_CREW.director.heading};
/** Final breath (cue final_breath at this time) and the eyes closing (M.EYES_CLOSE). */
export const FINAL_BREATH = 195.0;
/** When the drone pilot's hands close on his. */
export const CLASP_T = 189.45;

/** His breathing, −1 (empty) … 1 (full): ragged and shallow, slowing; one last small breath; then none. */
export const dirBreath = (T: number) => kn(T, [
  [186.0, -0.2], [186.9, 0.15], [187.35, 0.85], [188.25, -0.55], [189.05, 0.7], [190.2, -0.5], [191.1, 0.55], [192.3, -0.45],
  [193.2, 0.42], [194.3, -0.42], [FINAL_BREATH, 0.8], [196.15, -0.75], [197.2, -0.82],
]);

const dirFace = (T: number) => {
  const lidK: [number, number][] = [
    [186.9, 0.38], [188.0, 0.42], [188.55, 0.44], [188.68, 1.0], [188.86, 0.42], [189.45, 0.3], [189.9, 0.2], [190.6, 0.24],
    [191.3, 0.4], [191.9, 0.44], [192.05, 0.9], [192.25, 0.46], [193.1, 0.5], [194.4, 0.54], [FINAL_BREATH, 0.46], [195.9, 0.6],
    [196.24, 0.64], [M.EYES_CLOSE + 0.07, 1.0],
  ];
  const lid = kn(T, lidK);
  const unfocus = kn(T, [[186.9, 0.5], [189.3, 0.48], [189.95, 0.1], [190.7, 0.14], [191.5, 0.55], [193.1, 0.7], [195.4, 0.85], [196.6, 0.95]]);
  // eyes toward her (his left); they lose her again
  const lookX = kn(T, [[186.9, 0.05], [189.25, 0.05], [189.85, -0.75], [191.2, -0.6], [193.1, -0.32], [195.2, -0.2]]);
  const lookY = kn(T, [[186.9, 0.35], [189.25, 0.3], [189.85, 0.1], [191.4, 0.25], [194, 0.4]]);
  const b = dirBreath(T);
  const dead = T > 196.1;
  const open = dead ? kn(T, [[196.1, 0.32], [197.3, 0.18]]) : clamp(0.14 + 0.2 * b + (T > 194.5 && T < 196.1 ? 0.28 * smooth((T - 194.5) / 0.45) * (1 - smooth((T - 195.2) / 0.9)) : 0), 0, 0.6);
  return {
    lid, unfocus, lookX, lookY, blink: false, mouth: 'breath' as const, open,
    brows: kn(T, [[186.9, 0.25], [189.6, 0.4], [191.4, 0.28], [196.6, 0.12], [197.6, 0.05]]),
    worry: kn(T, [[186.9, 0.5], [189.6, 0.32], [191.4, 0.45], [196.6, 0.2], [197.6, 0.1]]),
  };
};

/** His body pose at T (no hand targets): slumped against the slab, the breath in the chest and head, the death settle. */
export const directorPose = (T: number): Pose => {
  const b = dirBreath(T);
  const settle = smooth((T - M.EYES_CLOSE) / 1.3); // the neck lets go after the eyes close
  const turn = kn(T, [[186.9, 0], [189.2, 0], [190.2, 1], [192.8, 0.75], [196.6, 0.6]]);
  const base = SLUMP({lean: 27, headRoll: 12});
  return {
    ...base,
    lean: 0, bodyPitch: -(27 + b * 1.3),
    head: {pitch: 24 - b * 2.2 + settle * 5, yaw: -16 * turn, roll: 12 + settle * 7},
    // left arm limp along his left side on the ground (the shattered plate on its forearm)
    armL: {local: {r: -66, u: 30, f: 44}, pole: {r: -1, u: 0.2, f: -0.4}},
    handL: 'limp', handR: 'relaxed',
    face: dirFace(T),
    breath: 0,
    shadow: 1,
  };
};

const dirBase = (T: number): FigSpec => ({
  key: 'ef_dir', look: lookR2('director'), t: T, seed: 11, pos: DIR.pos, heading: DIR.heading,
  pose: {...directorPose(T), wearL: plateWear('shattered'), dmg: dmgR2('director', T)},
});

/** His right hand: pressed to his left side, then taken by her and lifted a little; she keeps holding it to the end. */
export const dirHandR = (T: number): {pos: V3; orient: {fingers: V3; palm: V3; w: number}} => {
  const R = figureRig(SOLVE_VIEW, dirBase(T));
  const wound = R.torso({r: -30, u: 48, f: 40});
  const fwdH = hv(DIR.heading), left = hv(DIR.heading - 90);
  // where she holds it: in front of his left hip, toward her, a little up — kept within his reach (his right arm crosses
  // his body), so her hands close on his real hand, not on a point past it
  const held0 = add3(R.torso({r: -24, u: 6, f: 74}), {x: left.x * 0.16 + fwdH.x * 0.04, y: 0.09, z: left.z * 0.16 + fwdH.z * 0.04});
  const shR = R.torso({r: SH_X, u: SH_H, f: 0});
  const dh = sub3(held0, shR), lh = Math.hypot(dh.x, dh.y, dh.z), maxR = ((UPPER + FORE) / 251.4) * 0.93;
  const held = lh > maxR ? add3(shR, mul3(dh, maxR / lh)) : held0;
  const k1 = smooth((T - (CLASP_T - 0.05)) / 0.7);
  const pos = lerp3(wound, held, k1);
  const bodyN = norm3(sub3(R.torso({r: 0, u: 60, f: 0}), R.torso({r: 0, u: 60, f: 40})));
  // pressing: palm on his side, fingers toward his left; held: palm down onto her palm, fingers toward her
  const palm = norm3(lerp3(bodyN, {x: 0, y: -1, z: 0}, k1));
  const fingers = norm3(lerp3({x: left.x * 0.7 - fwdH.x * 0.2, y: -0.5, z: left.z * 0.7 - fwdH.z * 0.2}, {x: left.x * 0.8 + fwdH.x * 0.4, y: -0.25, z: left.z * 0.8 + fwdH.z * 0.4}, k1));
  return {pos, orient: {fingers, palm, w: 1}};
};

/** His head (world; ~stable: the breath moves it by a centimetre) and his chest — perspective anchors for close shots. */
export const DIR_HEAD: V3 = {x: 6.53, y: 1.095, z: 3.04};
export const DIR_CHEST: V3 = {x: 6.72, y: 0.66, z: 3.18};

export const directorSpec = (T: number, anchor?: V3): FigSpec => {
  const s = dirBase(T);
  const h = dirHandR(T);
  return {...s, anchor, world: {handR: h.pos, orientR: h.orient}};
};

// ================================================================== the drone pilot (checker)
const PIL0 = TB_CREW.drone.pos; // on hands and knees at FINAL_HIT
/** Where she kneels at his left side, facing him (E1/E2): close enough that her arms bend as she holds his hand. */
export const PIL_Q = at3(DIR.pos, DIR.heading - 60, 0.9, 0, 0);
const PIL_HQ = headingTo(PIL_Q, DIR.pos);
/** Where she settles after the radio: back at his side, a little further off, sitting up (her head clear of his face
 *  from the rising camera). */
const PIL_E = at3(DIR.pos, DIR.heading - 56, 1.0, 0, 0);
const PIL_HE = headingTo(PIL_E, DIR.pos);

/** The knob: its axis (out of the radio front), and two in-plane directions (local x and up on the radio face). */
export const KNOB = (() => {
  const o = radioFn({x: 0, y: 0, z: 0});
  const ax = norm3(sub3(radioFn({x: 1, y: 0, z: 0}), o));
  const ay = norm3(sub3(radioFn({x: 0, y: 1, z: 0}), o));
  const n = norm3(sub3(radioFn({x: 0, y: 0, z: -1}), o)); // the radio's front faces local −z
  return {c: RADIO.knob, n, ax, ay, r: 0.018};
})();
/** The twist: her fingers' angle on the knob face (deg in the ax/ay plane), and the knob's own pointer angle. */
export const GRIP_T = 199.5, TWIST_A = 199.6, TWIST_B = M.RADIO_CLICK, RELEASE_T = 200.6;
export const twistK = (T: number) => (T < TWIST_A ? 0 : T > TWIST_B ? 1 : easeIn(clamp((T - TWIST_A) / (TWIST_B - TWIST_A))) * 0.35 + smooth((T - TWIST_A) / (TWIST_B - TWIST_A)) * 0.65);
/** Where her fingertips hold the knob's rim (deg in the face's ax/ay plane: 0 = toward her (west), 90 = up): they
 *  turn with it, from below-west to above-west, a firm quarter-plus turn. */
const holdAngle = (T: number) => -52 + 105 * twistK(T);
/** The knob's pointer (deg): opposite her fingertips, so it stays clear of her hand — OFF lower right → ON upper right. */
export const knobAngle = (T: number) => holdAngle(T) + 180;
const inPlane = (deg: number) => add3(mul3(KNOB.ax, Math.cos((deg * Math.PI) / 180)), mul3(KNOB.ay, Math.sin((deg * Math.PI) / 180)));

/**
 * Her right hand on the knob (world wrist target + orientation): the curled fingertips close on the knob's near rim
 * (its face, with the pointer, stays clear beyond them) and the hand turns round the knob with it. The palm is turned
 * toward the lens: a gripping hand seen from its back reads as a fist.
 */
const knobHand = (T: number) => {
  const hw = holdAngle(T);
  // the hand lies across the knob's face from her side, fingers toward the rim and a little in: as the knob turns the
  // whole hand turns round it (a dial turned by the wrist, readable at a glance)
  const fingers = norm3(add3(mul3(inPlane(hw + 180), 0.85), mul3(KNOB.n, -0.5)));
  // thumb and index pinch the knob's rim (rig 'pinch': the knob sits between the two fingertips, PINCH_X along the
  // hand, so it shows between them); the pointer on its face points on past the fingertips
  const pinchC = add3(KNOB.c, mul3(KNOB.n, 0.01));
  const wrist = sub3(pinchC, mul3(fingers, PINCH_X / RIG_PER_M));
  const toCam = norm3(sub3(KNOB_POS, KNOB.c));
  const dp = toCam.x * fingers.x + toCam.y * fingers.y + toCam.z * fingers.z;
  const palm = norm3(sub3(toCam, mul3(fingers, dp)));
  return {wrist, fingers, palm};
};

/** His hand while she holds it (still once he has died). */
export const HELD = dirHandR(197.5).pos;
/**
 * Where she kneels to turn the radio on without letting go of him: turned toward the van door (north-west), his hand
 * at her left, the knob at her right, her shoulders just in front of the line between them.
 */
export const REACH = (() => {
  const W = knobHand(GRIP_T).wrist;
  const heading = headingTo(HELD, W) - 90;
  const mid = lerp3(HELD, W, 0.6);
  const b = hv(heading + 180);
  const x = mid.x + b.x * 0.3, z = mid.z + b.z * 0.3;
  return {pos: {x, y: groundH(x, z), z}, heading};
})();

// her timeline after the clasp (film s)
const LET_R = 198.05; // her right hand leaves his; the left keeps holding it
const TURN = {a: 198.3, b: 199.1}; // she turns on her knees toward the van door
const REACH_A = 198.75; // the right hand sets off for the knob
const LOOK_BACK = 200.12; // the radio speaks: she looks back at him, her hand still on the knob
const BACK = {a: 200.95, b: 202.4}; // she turns back to him on her knees
const RETURN_T = 202.05; // her right hand back on his

type Crawl = {pos: V3; heading: number; handL: V3; handR: V3; footL: V3; footR: V3; ph: number};
/** Hands-and-knees crawl along a line from a to b between t0 and t1: hand R, knee L, hand L, knee R per cycle. */
const crawlAt = (T: number, a: V3, b: V3, t0: number, t1: number, cycles = 2): Crawl => {
  const heading = headingTo(a, b);
  const L = Math.hypot(b.x - a.x, b.z - a.z);
  const u = clamp((T - t0) / (t1 - t0));
  // the body surges after each knee step (piecewise), the limbs step at fixed phases
  const step = L / (cycles * 2); // a hand or a knee moves this far per step
  const n = cycles;
  const ph = u * n; // cycle phase
  const k = Math.floor(Math.min(ph, n - 1e-6)), f = ph - k;
  const bodyD = (k + smooth(f)) * (L / n) * 0.98 + (u >= 1 ? L * 0.02 : 0);
  const pos = at3(a, heading, Math.min(L, bodyD), 0, 0);
  // limb step progress within the cycle: hand R 0–.3, knee L .2–.5, hand L .5–.8, knee R .7–1.0
  const limb = (s0: number) => {
    let d = 0, lift = 0;
    for (let c = 0; c < n; c++) {
      const w = clamp(((u * n) - c - s0) / 0.3);
      d += smooth(w) * step * 2;
      lift += Math.sin(Math.PI * clamp(w)) * (w > 0 && w < 1 ? 1 : 0);
    }
    return {d, lift};
  };
  const hR = limb(0), kL = limb(0.2), hL = limb(0.5), kR = limb(0.7);
  // each limb is planted, then swings one stride (2·step) forward; centred so that on average it sits at its place
  // relative to the body (a limb that swings early in the cycle leads, one that swings late trails)
  const c = (s0: number) => -(0.35 - s0) * step * 2;
  return {
    pos, heading, ph,
    handR: at3(a, heading, CRAWL_HAND + c(0) + hR.d, 0.16, 0.035 + hR.lift * 0.1),
    handL: at3(a, heading, CRAWL_HAND + c(0.5) + hL.d, -0.16, 0.035 + hL.lift * 0.1),
    footL: at3(a, heading, CRAWL_FOOT + c(0.2) + kL.d, -0.11, 0.05 + kL.lift * 0.06),
    footR: at3(a, heading, CRAWL_FOOT + c(0.7) + kR.d, 0.11, 0.05 + kR.lift * 0.06),
  };
};
/** Planted hands sit this far ahead of the body root while crawling (under the shoulders, a little forward). */
const CRAWL_HAND = 0.44, CRAWL_FOOT = -0.2;
/** On hands and knees, the back inclined ~40° (not a plank), the head up toward him. */
const CRAWL_POSE: Pose = {drop: 84, bodyPitch: 50, lean: 0, handL: 'brace', handR: 'brace', head: {pitch: -38}, legL: {pole: {r: -0.1, u: 0.3, f: 1}}, legR: {pole: {r: 0.1, u: 0.3, f: 1}}};
const KNEEL_UP: Pose = {drop: 80, lean: 14, bodyPitch: 0, legL: {local: {r: -30, u: 28, f: -72}, pitch: -50}, legR: {local: {r: 30, u: 28, f: -72}, pitch: -50}, handL: 'relaxed', handR: 'relaxed'};
/** A kneeling foot (the ankle behind the knee, the shin on the ground) for a body at pos/heading whose pelvis is
 *  lowered by `drop` (rig units): the knee lands on the ground in front of the hips, the ankle a shin's length behind. */
const kneelFoot = (pos: V3, heading: number, sd: 1 | -1, drop = 80, lift = 0) => {
  const hipH = (HIP_H - drop) / 251.4, th = THIGH / 251.4, sn = SHIN / 251.4;
  const kf = Math.sqrt(Math.max(0, th * th - (hipH - 0.06) ** 2));
  return at3(pos, heading, kf - sn * 0.99, sd * 0.12, 0.05 + lift);
};

const pilotFace = (T: number) => ({
  brows: kn(T, [[186.9, 0.55], [190.0, 0.7], [196.6, 0.85], [199.3, 0.5]]),
  worry: kn(T, [[186.9, 0.85], [190.0, 0.95], [199.3, 0.8]]),
  mouth: (T > 189.6 && T < 191.2 ? 'flat' : 'sad') as 'flat' | 'sad',
  lid: kn(T, [[186.9, 0.1], [196.0, 0.15], [197.0, 0.35], [199.3, 0.2], [202, 0.3]]),
  lookY: kn(T, [[186.9, 0.3], [189, 0.5]]),
});

/** Her body root and heading after the clasp: at his side → turned to the van door → back to him. */
const kneelAt = (T: number) => {
  const kT = smooth((T - TURN.a) / (TURN.b - TURN.a)), kB = smooth((T - BACK.a) / (BACK.b - BACK.a));
  const pos = lerp3(lerp3(PIL_Q, REACH.pos, kT), PIL_E, kB);
  const heading = PIL_HQ + wrap(REACH.heading - PIL_HQ) * kT + wrap(PIL_HE - REACH.heading) * kB;
  return {pos, heading};
};
/** One kneeling foot through the two turns (each foot steps on its own beat, lifting a little). */
const turnFoot = (T: number, sd: 1 | -1, drop: number) => {
  const st = (t0: number, t1: number) => ({k: smooth((T - t0) / (t1 - t0)), lift: T > t0 && T < t1 ? Math.sin((Math.PI * (T - t0)) / (t1 - t0)) : 0});
  // the right foot leads toward the van, the left follows; coming back the left leads
  const a = sd > 0 ? st(TURN.a, TURN.a + 0.42) : st(TURN.a + 0.35, TURN.b);
  const b = sd > 0 ? st(BACK.a + 0.5, BACK.b) : st(BACK.a, BACK.a + 0.6);
  const f0 = kneelFoot(PIL_Q, PIL_HQ, sd, drop), f1 = kneelFoot(REACH.pos, REACH.heading, sd, drop), f2 = kneelFoot(PIL_E, PIL_HE, sd, drop);
  return add3(lerp3(lerp3(f0, f1, a.k), f2, b.k), {x: 0, y: 0.06 * (a.lift + b.lift), z: 0});
};

/** Which way her right arm is layered against his hand in the pair sprite. */
export type RightLayer = 'under' | 'free' | 'top';
export const pilotRightLayer = (T: number): RightLayer => (T < LET_R + 0.2 ? 'under' : T < RETURN_T - 0.25 ? 'free' : 'top');

/** The drone pilot at T. */
export const pilotSpec = (T: number, anchor?: V3): FigSpec => {
  const look = lookR2('drone');
  const dmg = dmgR2('drone', T);
  const base = {key: 'ef_pil', look, t: T, seed: 5, anchor};
  const C1 = 188.35; // end of the crawl
  // the crawl stops a little short of her kneeling spot: she sits up clear of him, then shuffles in on her knees
  const crawlEnd = at3(PIL0, headingTo(PIL0, PIL_Q), Math.hypot(PIL_Q.x - PIL0.x, PIL_Q.z - PIL0.z) - 0.25, 0, 0);
  if (T < C1 + 0.05) {
    const cr = crawlAt(T, PIL0, crawlEnd, 186.4, C1, 2);
    // the body rolls and twists toward the stepping side, and dips as each knee comes through
    const w = Math.sin(2 * Math.PI * cr.ph);
    const bob = Math.abs(Math.sin(2 * Math.PI * cr.ph));
    const moving = clamp((T - 186.4) / 0.2) * (1 - clamp((T - (C1 - 0.15)) / 0.2));
    return {...base, pos: cr.pos, heading: cr.heading,
      pose: {...CRAWL_POSE, drop: (CRAWL_POSE.drop ?? 0) + 6 * bob * moving, twist: 7 * w * moving, side: -4 * w * moving,
        head: {pitch: -38 + 4 * bob * moving, yaw: -6 * w * moving}, face: {...pilotFace(T), lookY: -0.45}, dmg},
      world: {handL: cr.handL, handR: cr.handR, footL: cr.footL, footR: cr.footR,
        orientL: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}, orientR: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}}};
  }
  const end = crawlAt(C1, PIL0, crawlEnd, 186.4, C1, 2);
  const up = smooth((T - C1) / 0.75);
  // ---- body: sit up beside him, shuffle in; (198.3) turn toward the van door; (200.95) turn back to him
  const shuffle = smooth((T - 188.9) / 0.5);
  const kAt = kneelAt(T);
  const pos = T < TURN.a ? lerp3(end.pos, PIL_Q, shuffle) : kAt.pos;
  const heading = T < TURN.a ? end.heading + wrap(PIL_HQ - end.heading) * up : kAt.heading;
  const towardKnob = smooth((T - (REACH_A - 0.2)) / 0.5) * (1 - smooth((T - LOOK_BACK) / 0.55));
  const towardHim = smooth((T - LOOK_BACK) / 0.55) * (1 - smooth((T - (BACK.a + 0.3)) / 1.0));
  const pose = layer(
    keyPose([
      [C1, {...CRAWL_POSE}],
      [C1 + 0.75, {...KNEEL_UP, lean: 14}],
      [CLASP_T - 0.55, {...KNEEL_UP, lean: 24, drop: 88}], // reaching for his hand: shoulders forward and down
      [CLASP_T, {...KNEEL_UP, lean: 29, drop: 94, twist: -6}],
      [191.2, {...KNEEL_UP, lean: 27, drop: 97, twist: -5}],
      [196.6, {...KNEEL_UP, lean: 26, drop: 99, twist: -4}],
      [LET_R, {...KNEEL_UP, lean: 26, drop: 99}],
      // turned to the van door: the left shoulder dips toward his hand, the right rises to the knob
      [TURN.b, {...KNEEL_UP, lean: 12, drop: 92, side: 10}],
      [GRIP_T, {...KNEEL_UP, lean: 16, drop: 94, side: 13}],
      [RELEASE_T, {...KNEEL_UP, lean: 15, drop: 94, side: 12}],
      [BACK.a, {...KNEEL_UP, lean: 18, drop: 96, side: 4}],
      [BACK.b, {...KNEEL_UP, lean: 9, drop: 104}], // facing him again, sitting back toward her heels, head bowed
    ], T),
    {
      head: {
        pitch: T < TURN.a ? lerp(-30, 30, up) : 24 - 6 * towardKnob + 10 * smooth((T - BACK.a) / (BACK.b - BACK.a)),
        yaw: 38 * towardKnob - 52 * towardHim,
        roll: kn(T, [[190, 0], [192, -8], [197, -12], [TURN.b, -4], [BACK.b, -10]]),
      },
      face: {...pilotFace(T), lookY: T < TURN.a ? lerp(-0.1, 0.5, up) : 0.5, lookX: 0.4 * towardKnob - 0.4 * towardHim}, dmg,
    },
  );
  const knee = (sd: 1 | -1) => (T < TURN.a ? lerp3(sd < 0 ? end.footL : end.footR, kneelFoot(lerp3(end.pos, PIL_Q, shuffle), PIL_HQ, sd, pose.drop), up) : turnFoot(T, sd, pose.drop ?? 90));
  // ---- hands. Her left hand closes over his at the clasp and keeps holding it to the end. Her right hand is under his
  // until 198.05, goes to the knob (contact GRIP_T), turns it (the click), lets go and comes back onto his hand.
  const H = dirHandR(T);
  const fwdD = hv(DIR.heading);
  const toHer = norm3(sub3(PIL_Q, DIR.pos));
  const under = add3(H.pos, {x: toHer.x * 0.03, y: -0.045, z: toHer.z * 0.03});
  const over = add3(H.pos, {x: -fwdD.x * 0.02 - toHer.x * 0.06, y: 0.05, z: -fwdD.z * 0.02 - toHer.z * 0.06});
  // from the turn on, her left hand holds his from her side (her fingers round his palm), which buys her the reach
  const side = add3(H.pos, {x: toHer.x * 0.075, y: 0.035, z: toHer.z * 0.075});
  const top = add3(H.pos, {x: -fwdD.x * 0.04 - toHer.x * 0.01, y: 0.075, z: -fwdD.z * 0.04 - toHer.z * 0.01});
  const reach = smooth((T - (CLASP_T - 0.5)) / 0.5); // right hand under his (contact CLASP_T)
  const reachL = smooth((T - (CLASP_T - 0.2)) / 0.5); // then the left hand closes over it
  const restR0 = at3(PIL_Q, PIL_HQ, 0.22, 0.12, 0.33), restL0 = at3(PIL_Q, PIL_HQ, 0.24, -0.14, 0.34);
  const hL = lerp3(lerp3(lerp3(end.handL, restL0, up), over, reachL), side, smooth((T - TURN.a) / 0.6));
  // the right hand's path
  const restR = at3(pos, heading, 0.2, 0.17, 0.33);
  const kh = knobHand(T);
  const pre = add3(kh.wrist, add3(mul3(KNOB.n, 0.15), {x: 0, y: -0.05, z: 0}));
  let hR: V3, shapeR: 'open' | 'relaxed' | 'grip' | 'pinch' = 'relaxed', orR = {fingers: kh.fingers, palm: kh.palm, w: 0};
  const clasp = {palm: {x: 0, y: 1, z: 0}, fingers: norm3({x: -toHer.x, y: -0.15, z: -toHer.z}), w: reach};
  if (T < LET_R) {
    hR = lerp3(lerp3(end.handR, restR0, up), under, reach);
    shapeR = reach > 0.5 ? 'open' : 'relaxed';
    orR = clasp;
  } else if (T < REACH_A) {
    const k = smooth((T - LET_R) / (REACH_A - LET_R));
    hR = lerp3(under, restR, k);
    orR = {...clasp, w: 1 - k};
  } else if (T < GRIP_T) {
    // out to a point in front of the knob, then in onto it, the hand turned to grip it on the way (back of the hand
    // leading, fingers open), closing as it arrives
    const k1 = smooth((T - REACH_A) / (GRIP_T - 0.3 - REACH_A));
    const k2 = smooth((T - (GRIP_T - 0.3)) / 0.3);
    hR = lerp3(lerp3(restR, pre, k1), kh.wrist, k2);
    shapeR = T > GRIP_T - 0.06 ? 'pinch' : T > REACH_A + 0.25 ? 'open' : 'relaxed';
    orR = {fingers: kh.fingers, palm: kh.palm, w: smooth((T - (REACH_A + 0.1)) / 0.4)};
  } else if (T < RELEASE_T) {
    hR = kh.wrist;
    shapeR = 'pinch';
    orR = {fingers: kh.fingers, palm: kh.palm, w: 1};
  } else {
    // off the knob (back along its axis, fingers opening), then over onto his hand
    const off = smooth((T - RELEASE_T) / 0.35);
    const k = smooth((T - (RELEASE_T + 0.3)) / (RETURN_T - RELEASE_T - 0.3));
    const away = add3(kh.wrist, add3(mul3(KNOB.n, 0.1), {x: 0, y: 0.02, z: 0}));
    hR = lerp3(lerp3(kh.wrist, away, off), top, k);
    shapeR = T < RELEASE_T + 0.12 ? 'pinch' : T < RELEASE_T + 0.4 ? 'open' : 'relaxed';
    const onHim = {palm: {x: 0, y: -1, z: 0}, fingers: norm3({x: fwdD.x, y: -0.4, z: fwdD.z}), w: smooth((T - (RETURN_T - 0.4)) / 0.4)};
    orR = k < 0.5 ? {fingers: kh.fingers, palm: kh.palm, w: 1 - smooth(k / 0.5)} : onHim;
  }
  return {...base, pos, heading,
    pose: {...pose, handR: shapeR, handL: 'relaxed',
      // elbows out and down (a reach, not a point)
      armL: {pole: {r: -1, u: -0.6, f: -0.2}}, armR: {pole: {r: 1, u: -0.6, f: -0.2}}},
    world: {handR: hR, handL: hL, footL: knee(-1), footR: knee(1), orientR: orR,
      orientL: {palm: {x: 0, y: -1, z: 0}, fingers: norm3({x: fwdD.x, y: -0.4, z: fwdD.z}), w: reachL}}};
};

/** Her perspective anchor: the chest; while her right arm is out to the knob, most of the way along it (so the hand on
 *  the knob is drawn at its true size next to it). */
export const pilotAnchor = (T: number): V3 => {
  const p = pilotSpec(T);
  const chest = {x: p.pos.x, y: p.pos.y + 0.6, z: p.pos.z};
  // (held until her hand has left the frame on its way back to his, so it never swells)
  const w = smooth((T - 198.85) / 0.55) * (1 - smooth((T - (RELEASE_T + 0.65)) / 0.5));
  return w <= 0 ? chest : lerp3(chest, lerp3(chest, knobHand(T).wrist, 0.85), w);
};

/**
 * One sprite drawing the Director and the drone pilot together with the clasp layered correctly: his body, her right
 * arm and the palm under his hand, his right arm and hand, then the rest of her (torso, head, the hand on his wrist).
 * `right` moves her right arm: 'under' his hand (the clasp), 'free' (with her body: the reach to the radio) or 'top'
 * (laid over the clasp). Painter depth: his seat.
 */
export const clasped = (dir: FigSpec, pil: FigSpec, right: RightLayer = 'under', o: {bias?: number; noCull?: boolean} = {}): SpriteItem => ({
  kind: 'sprite', key: 'ef_pair', pos: dir.pos, bias: o.bias ?? 0.25, noCull: o.noCull,
  draw: (c) => {
    const a = figProps(c.view, dir), b = figProps(c.view, pil);
    if (a.F.k < 0.4) return null;
    const pa = figureParts({...a.props, light: figLight(c, a.F)}).parts, pb = figureParts({...b.props, light: figLight(c, b.F)}).parts;
    const sort = (ps: Part[]) => ps.slice().sort((x, y) => x.z - y.z);
    const hisHand = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const herR = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const herL = (q: Part) => q.key === 'arm0' || q.key === 'handf0';
    const shadows = [...pa, ...pb].filter((q) => q.key === 'shadow');
    // who is nearer the camera decides whose body is in front; the clasp itself is always her palm, his hand, her hand
    const nearer = (p: V3) => Math.hypot(p.x - c.view.pos.x, p.z - c.view.pos.z);
    const sheFar = nearer(pil.pos) > nearer(dir.pos);
    const herBody = sort(pb.filter((q) => q.key !== 'shadow' && !herL(q) && (right === 'free' || !herR(q))));
    const herTop = sort(pb.filter((q) => herL(q) || (right === 'top' && herR(q))));
    const order: Part[] = [
      ...shadows,
      ...(sheFar ? herBody : []),
      ...sort(pa.filter((q) => q.key !== 'shadow' && !hisHand(q))),
      ...(right === 'under' ? sort(pb.filter(herR)) : []),
      ...sort(pa.filter(hisHand)),
      ...(sheFar ? [] : herBody),
      ...herTop,
    ];
    return <g>{order.map((q, i) => <g key={`${i}_${q.key}`}>{q.el}</g>)}</g>;
  },
});

// ================================================================== the others (held, sitting, down)
const struggle = (T: number, seed: number) => (1 - smooth((T - 188.5) / 5)) * noise(T * 2.3, seed);

/** The tableau grip point of a held person, with a little struggle early in E1 (shared with the holder's fist). */
export const gripAt = (role: 'tether' | 'decoy' | 'flares' | 'breaker', T: number): V3 => {
  const c = TB_CREW[role];
  const g = c.held!.at;
  const f = hv(c.heading);
  const s = struggle(T, role.length * 3.1);
  return {x: g.x + f.x * s * 0.06, y: g.y + Math.abs(s) * 0.02, z: g.z + f.z * s * 0.06};
};

const lookHead = (pos: {x: number; z: number}, heading: number, k = 1) => clamp(wrap(headingTo(pos, DIR.pos) - heading), -70, 70) * k;

export const heldSpec = (role: 'tether' | 'decoy' | 'flares' | 'breaker' | 'runner', T: number): FigSpec => {
  const c = TB_CREW[role];
  const look = lookR2(role);
  const dmg = dmgR2(role, T);
  const base = {key: `ef_${role}`, look, t: T, seed: role.length + 20, pos: c.pos, heading: c.heading};
  const s = struggle(T, role.length * 3.1);
  const grief = smooth((T - M.EYES_CLOSE) / 2.5);
  const yawH = -lookHead(c.pos, c.heading);
  if (role === 'tether') {
    return {...base, pose: {...STAND, drop: 14, lean: 18 + s * 5 - grief * 4, twist: 6, head: {pitch: 8 + grief * 14, yaw: yawH * 0.5},
      armR: {local: {r: 24, u: 230 - grief * 40, f: 120 - grief * 40}}, handR: grief > 0.5 ? 'relaxed' : 'open', handL: 'fist',
      legL: {local: {r: -40, u: 10, f: 46}}, legR: {local: {r: 44, u: 10, f: -50}},
      face: {brows: 0.75, worry: 0.95, mouth: grief > 0.4 ? 'sad' : 'open', open: 0.25, lid: 0.12 + grief * 0.2}, dmg, extra: hipReel(0)},
      world: {handL: gripAt('tether', T)}};
  }
  if (role === 'decoy') {
    return {...base, pose: {...KNEEL('L'), lean: 10 + s * 3, head: {pitch: 10 + grief * 16, yaw: yawH * 0.4},
      armL: {local: {r: -8, u: 286 - grief * 10, f: 46}}, handL: 'relaxed', handR: 'fist',
      face: {brows: 0.8, worry: 1, mouth: 'sad', lid: 0.18 + grief * 0.25}, dmg},
      world: {handR: gripAt('decoy', T)}};
  }
  if (role === 'flares') {
    return {...base, pose: {...KNEEL('R'), lean: 26 + s * 4 + grief * 6, head: {pitch: 22 + grief * 10, yaw: yawH * 0.3},
      armL: {local: {r: -40, u: 112, f: 70}}, handL: 'fist', handR: 'fist',
      face: {brows: 0.5, worry: 0.8, mouth: 'grit', lid: 0.3 + grief * 0.3}, dmg},
      world: {handR: gripAt('flares', T)}};
  }
  if (role === 'breaker') {
    return {...base, pose: {drop: 128, lean: 8, bodyPitch: -10, head: {pitch: 6 + grief * 12, yaw: yawH * 0.6},
      legL: {local: {r: -36, u: 12, f: 150}}, legR: {local: {r: 40, u: 46, f: 80}, pitch: -10},
      // right hand clutching the bleeding left forearm, left arm across his lap
      armL: {local: {r: 10, u: 120, f: 70}}, armR: {local: {r: -14, u: 130, f: 76}}, handL: 'relaxed', handR: 'grip',
      face: {brows: 0.5, worry: 0.8, mouth: 'grit', lid: 0.25 + grief * 0.25}, dmg}};
  }
  // runner: down on his back, alive — breathing, the head turned toward the van, one hand moves
  return {...base, pose: {...LYING_BACK, head: {roll: 12, yaw: -40, pitch: -4}, armR: {fk: {fwd: 20 + 8 * Math.sin(T * 0.9), out: 40, bend: 30}},
    face: {brows: 0.4, worry: 0.6, mouth: 'pant', lid: 0.45}, breath: 0.5, dmg}};
};

/** All aftermath Crew figures except the pair at the slab (for wides). */
export const othersItems = (T: number): Item[] => (['tether', 'decoy', 'flares', 'breaker', 'runner'] as const).map((r) => figureSprite(heldSpec(r, T)));

/** For D4: the Crew as they are at FINAL_HIT (the pair drawn as one clasp-aware sprite). */
export const aftermathCrewItems = (T: number): Item[] => [clasped(directorSpec(T), pilotSpec(T)), ...othersItems(T)];

