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
  plateWear, hipReel, Part, figureSprite,
} from '../../rig';
import {TB_CREW, DIRECTOR_SEAT} from './tableau';
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

/** His right hand: pressed to his left side, taken by her and lifted a little, laid down on his lap when she leaves. */
export const dirHandR = (T: number): {pos: V3; orient: {fingers: V3; palm: V3; w: number}} => {
  const R = figureRig(SOLVE_VIEW, dirBase(T));
  const wound = R.torso({r: -30, u: 48, f: 40});
  const fwdH = hv(DIR.heading), left = hv(DIR.heading - 90);
  // where she holds it: in front of his left hip, toward her, a little up
  const held = add3(R.torso({r: -24, u: 6, f: 74}), {x: left.x * 0.16 + fwdH.x * 0.04, y: 0.09, z: left.z * 0.16 + fwdH.z * 0.04});
  const lap = R.torso({r: -8, u: -4, f: 64});
  const k1 = smooth((T - (CLASP_T - 0.05)) / 0.7);
  const k2 = smooth((T - 197.95) / 0.5);
  const pos = lerp3(lerp3(wound, held, k1), lap, k2);
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
/** Where she kneels at his left side (E1/E2) and at the van door (F1, the radio). */
export const PIL_Q = at3(DIR.pos, DIR.heading - 60, 1.0, 0, 0);
/** At the radio: in front of the van door, to the radio's west (between him and the radio), facing the knob. */
export const PIL_K = (() => {
  const n = hv(RADIO.heading), back = hv(RADIO.heading + 90);
  const x = RADIO.pos.x + n.x * 0.75 + back.x * 0.5, z = RADIO.pos.z + n.z * 0.75 + back.z * 0.5;
  return {x, y: groundH(x, z), z};
})();
const PIL_HQ = headingTo(PIL_Q, DIR.pos);
const PIL_HK = headingTo(PIL_K, RADIO.knob);
/** After the radio she turns back toward him (he is then ~30° to her right). */
const PIL_HEND = headingTo(PIL_K, DIR.pos) - 30;

/** The knob: its axis (out of the radio front), and two in-plane directions (local x and up on the radio face). */
export const KNOB = (() => {
  const o = radioFn({x: 0, y: 0, z: 0});
  const ax = norm3(sub3(radioFn({x: 1, y: 0, z: 0}), o));
  const ay = norm3(sub3(radioFn({x: 0, y: 1, z: 0}), o));
  const n = norm3(sub3(radioFn({x: 0, y: 0, z: -1}), o)); // the radio's front faces local −z
  return {c: RADIO.knob, n, ax, ay, r: 0.018};
})();
/** The twist: her fingers' angle on the knob face (deg in the ax/ay plane), and the knob's own pointer angle. */
export const GRIP_T = 199.5, TWIST_A = 199.6, TWIST_B = M.RADIO_CLICK, RELEASE_T = 200.75;
export const twistK = (T: number) => (T < TWIST_A ? 0 : T > TWIST_B ? 1 : easeIn(clamp((T - TWIST_A) / (TWIST_B - TWIST_A))) * 0.35 + smooth((T - TWIST_A) / (TWIST_B - TWIST_A)) * 0.65);
export const knobAngle = (T: number) => -150 + 105 * twistK(T); // pointer: OFF (−150°) → ON (−45°), a firm quarter-plus turn
const inPlane = (deg: number) => add3(mul3(KNOB.ax, Math.cos((deg * Math.PI) / 180)), mul3(KNOB.ay, Math.sin((deg * Math.PI) / 180)));

/** Her left hand on the knob (world wrist target + orientation) while gripping; null when not touching. */
const knobHand = (T: number) => {
  const fa = 122 - 105 * twistK(T); // fingers' direction on the face rotates with the knob
  const fingers = norm3(add3(mul3(inPlane(fa), 0.62), mul3(KNOB.n, -0.78)));
  const grip = add3(KNOB.c, mul3(KNOB.n, 0.035));
  const wrist = sub3(grip, mul3(fingers, 0.075));
  // the palm faces the knob's side the fingers wrap round (toward the axis), thumb on the near side
  const palm = norm3(add3(mul3(inPlane(fa - 90), 0.7), mul3(KNOB.n, -0.3)));
  return {wrist, fingers, palm};
};

type Crawl = {pos: V3; heading: number; handL: V3; handR: V3; footL: V3; footR: V3};
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
  return {
    pos, heading,
    handR: at3(a, heading, 0.4 + hR.d - step, 0.17, 0.03 + hR.lift * 0.07),
    handL: at3(a, heading, 0.4 + hL.d - step * 2, -0.17, 0.03 + hL.lift * 0.07),
    footL: at3(a, heading, -0.34 + kL.d - step * 2, -0.11, 0.05 + kL.lift * 0.04),
    footR: at3(a, heading, -0.34 + kR.d - step, 0.11, 0.05 + kR.lift * 0.04),
  };
};

const CRAWL_POSE: Pose = {drop: 82, bodyPitch: 70, lean: 0, handL: 'brace', handR: 'brace', head: {pitch: -18}, legL: {pole: {r: -0.1, u: -1, f: 0.6}}, legR: {pole: {r: 0.1, u: -1, f: 0.6}}};
const KNEEL_UP: Pose = {drop: 80, lean: 14, bodyPitch: 0, legL: {local: {r: -30, u: 28, f: -72}, pitch: -50}, legR: {local: {r: 30, u: 28, f: -72}, pitch: -50}, handL: 'relaxed', handR: 'relaxed'};

const pilotFace = (T: number) => ({
  brows: kn(T, [[186.9, 0.55], [190.0, 0.7], [196.6, 0.85], [199.3, 0.5]]),
  worry: kn(T, [[186.9, 0.85], [190.0, 0.95], [199.3, 0.8]]),
  mouth: (T > 189.6 && T < 191.2 ? 'flat' : 'sad') as 'flat' | 'sad',
  lid: kn(T, [[186.9, 0.1], [196.0, 0.15], [197.0, 0.35], [199.3, 0.2], [202, 0.3]]),
  lookY: kn(T, [[186.9, 0.3], [189, 0.5]]),
});

/** The drone pilot at T. */
export const pilotSpec = (T: number, anchor?: V3): FigSpec => {
  const look = lookR2('drone');
  const dmg = dmgR2('drone', T);
  const base = {key: 'ef_pil', look, t: T, seed: 5, anchor};
  const C1 = 188.35; // end of the crawl
  // the crawl stops a little short of her kneeling spot; she sits up straight there (her head rises clear of his)
  // (it stops 25 cm short of her kneeling spot: she sits up clear of him, then shuffles in on her knees as she reaches)
  const crawlEnd = at3(PIL0, headingTo(PIL0, PIL_Q), Math.hypot(PIL_Q.x - PIL0.x, PIL_Q.z - PIL0.z) - 0.25, 0, 0);
  if (T < C1 + 0.05) {
    const cr = crawlAt(T, PIL0, crawlEnd, 186.4, C1, 2);
    return {...base, pos: cr.pos, heading: cr.heading,
      pose: {...CRAWL_POSE, face: {...pilotFace(T), lookY: -0.5}, dmg},
      world: {handL: cr.handL, handR: cr.handR, footL: cr.footL, footR: cr.footR, orientL: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}, orientR: {palm: {x: 0, y: -1, z: 0}, fingers: hv(cr.heading), w: 1}}};
  }
  if (T < 198.3) {
    // sit up onto her knees beside him, reach, hold his hand; lay it down at 197.95
    const end = crawlAt(C1, PIL0, crawlEnd, 186.4, C1, 2);
    const up = smooth((T - C1) / 0.75);
    const pos = lerp3(end.pos, PIL_Q, smooth((T - 188.9) / 0.5));
    const heading = end.heading + wrap(PIL_HQ - end.heading) * up;
    const pose = layer(
      keyPose([[C1, {...CRAWL_POSE}], [C1 + 0.75, {...KNEEL_UP, lean: 12}], [CLASP_T, {...KNEEL_UP, lean: 22}], [191, {...KNEEL_UP, lean: 20}], [196.6, {...KNEEL_UP, lean: 16}], [197.9, {...KNEEL_UP, lean: 20}]], T),
      {head: {pitch: lerp(-30, 30, up), yaw: 0, roll: kn(T, [[190, 0], [192, -8], [197, -12]])}, face: {...pilotFace(T), lookY: lerp(-0.1, 0.5, up)}, dmg},
    );
    // hands: from the ground to his hand (contact at CLASP_T), holding it; her left hand over his wrist
    const H = dirHandR(T);
    const toHer = norm3(sub3(PIL_Q, DIR.pos));
    const under = add3(H.pos, {x: toHer.x * 0.03, y: -0.045, z: toHer.z * 0.03});
    const over = add3(H.pos, {x: -hv(DIR.heading).x * 0.02 - toHer.x * 0.06, y: 0.05, z: -hv(DIR.heading).z * 0.02 - toHer.z * 0.06});
    const reach = smooth((T - (CLASP_T - 0.55)) / 0.55);
    const letGo = smooth((T - 197.95) / 0.35);
    const restR = at3(PIL_Q, PIL_HQ, 0.22, 0.12, 0.33), restL = at3(PIL_Q, PIL_HQ, 0.24, -0.14, 0.34);
    const fromR = lerp3(end.handR, restR, up), fromL = lerp3(end.handL, restL, up);
    const hR = lerp3(lerp3(fromR, under, reach), restR, letGo), hL = lerp3(lerp3(fromL, over, reach), restL, letGo);
    const fing = norm3(sub3(DIR.pos, PIL_Q));
    return {...base, pos, heading,
      pose: {...pose, handR: reach > 0.5 && letGo < 0.5 ? 'open' : 'relaxed', handL: 'relaxed'},
      world: {handR: hR, handL: hL, footL: lerp3(end.footL, at3(PIL_Q, PIL_HQ, -0.33, -0.12, 0.05), up), footR: lerp3(end.footR, at3(PIL_Q, PIL_HQ, -0.33, 0.12, 0.05), up),
        orientR: {palm: {x: 0, y: 1, z: 0}, fingers: {x: fing.x, y: -0.15, z: fing.z}, w: reach * (1 - letGo)},
        orientL: {palm: {x: 0, y: -1, z: 0}, fingers: norm3({x: hv(DIR.heading).x, y: -0.4, z: hv(DIR.heading).z}), w: reach * (1 - letGo)}}};
  }
  // she turns to the van door and kneels at the radio (off screen in E2), reaches with her right hand, turns the knob,
  // lets go; then she turns back toward him on her knees — right foot, left knee, right foot — and sits back on her heels
  const m = smooth((T - 198.3) / 0.85);
  const pos = lerp3(PIL_Q, PIL_K, m);
  const HB = PIL_HK, HE = PIL_HEND;
  const hBody = T < 201.3 ? PIL_HQ + wrap(HB - PIL_HQ) * smooth((T - 198.2) / 0.7) : HB + wrap(HE - HB) * smooth((T - 201.35) / 1.25);
  const step = (t0: number, t1: number) => ({k: smooth((T - t0) / (t1 - t0)), lift: T > t0 && T < t1 ? Math.sin(Math.PI * (T - t0) / (t1 - t0)) : 0});
  const sR1 = step(201.3, 201.72), sL = step(201.68, 202.12), sR2 = step(202.1, 202.55), sR3 = step(202.55, 203.0);
  const hMid = HB + wrap(HE - HB) * 0.5;
  const hR = HB + wrap(hMid - HB) * sR1.k + wrap(HE - hMid) * sR2.k;
  const hL = HB + wrap(HE - HB) * sL.k;
  const footFwd = at3(PIL_K, hR, 0.286, 0.143, 0.04 + 0.06 * (sR1.lift + sR2.lift));
  const footR = lerp3(footFwd, at3(PIL_K, HE, -0.24, 0.12, 0.12 + 0.05 * sR3.lift), sR3.k);
  const footL = at3(PIL_K, hL, -0.286, -0.143, 0.135 + 0.05 * sL.lift);
  const toHim = clamp(wrap(headingTo(PIL_K, DIR.pos) - hBody), -62, 62);
  const lookTurn = smooth((T - 201.5) / 1.3);
  const sitK = sR3.k;
  const pose = layer(
    keyPose([[198.3, {...KNEEL_UP, lean: 14}], [199.0, {...KNEEL('L'), lean: 16}], [GRIP_T, {...KNEEL('L'), lean: 26, twist: 6}], [RELEASE_T, {...KNEEL('L'), lean: 24, twist: 6}],
      [201.3, {...KNEEL('L'), lean: 12, twist: 2}], [202.55, {...KNEEL('L'), lean: 8, drop: 90}], [203.0, {...KNEEL_UP, drop: 112, lean: 4}]], T),
    {head: {pitch: lerp(14, 18, lookTurn) + 4 * sitK, yaw: toHim * lookTurn, roll: 0}, face: {...pilotFace(T), lookX: 0.5 * lookTurn}, dmg},
  );
  // right hand: reach the knob (contact GRIP_T), twist (to the click), hold, let go, rest on her thigh
  const kh = knobHand(T);
  const pre = add3(kh.wrist, add3(mul3(KNOB.n, 0.16), {x: 0, y: -0.06, z: 0}));
  const restR = at3(PIL_K, hBody, 0.18, 0.16, 0.34 - 0.08 * sitK);
  const reach = smooth((T - 198.95) / (GRIP_T - 198.95));
  const off = smooth((T - RELEASE_T) / 0.6);
  const touching = T >= GRIP_T - 0.04 && T < RELEASE_T + 0.08;
  const hRw = T < GRIP_T ? lerp3(restR, lerp3(pre, kh.wrist, smooth((T - (GRIP_T - 0.28)) / 0.28)), reach) : lerp3(add3(kh.wrist, mul3(KNOB.n, 0.05 * off)), restR, off);
  return {...base, pos, heading: hBody,
    pose: {...pose, handR: touching ? 'grip' : 'relaxed', handL: 'relaxed', armL: {local: {r: -26, u: 118 - 20 * sitK, f: 62}}},
    // the hand travels to the knob already turned to grip it (back of the hand leading), not palm-out
    world: {handR: hRw, orientR: {fingers: kh.fingers, palm: kh.palm, w: touching ? 1 : T < GRIP_T ? smooth((T - 199.0) / 0.3) : 1 - off},
      footL, footR}};
};

/**
 * One sprite drawing the Director and the drone pilot together with the clasp layered correctly: his body, her far
 * (right) arm and the palm under his hand, his right arm and hand, then the rest of her (torso, head, the hand on his
 * wrist). Painter depth: his seat.
 */
export const clasped = (dir: FigSpec, pil: FigSpec): SpriteItem => ({
  kind: 'sprite', key: 'ef_pair', pos: dir.pos, bias: 0.25,
  draw: (c) => {
    const a = figProps(c.view, dir), b = figProps(c.view, pil);
    if (a.F.k < 0.4) return null;
    const pa = figureParts({...a.props, light: figLight(c, a.F)}).parts, pb = figureParts({...b.props, light: figLight(c, b.F)}).parts;
    const sort = (ps: Part[]) => ps.slice().sort((x, y) => x.z - y.z);
    const hisHand = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const herUnder = (q: Part) => q.key === 'arm1' || q.key === 'handf1';
    const shadows = [...pa, ...pb].filter((q) => q.key === 'shadow');
    // who is nearer the camera decides whose body is in front; the clasp itself is always her palm, his hand, her hand
    const nearer = (p: V3) => Math.hypot(p.x - c.view.pos.x, p.z - c.view.pos.z);
    const sheFar = nearer(pil.pos) > nearer(dir.pos);
    const herBody = sort(pb.filter((q) => q.key !== 'shadow' && !herUnder(q) && q.key !== 'arm0' && q.key !== 'handf0'));
    const herTop = sort(pb.filter((q) => q.key === 'arm0' || q.key === 'handf0'));
    const order: Part[] = [
      ...shadows,
      ...(sheFar ? herBody : []),
      ...sort(pa.filter((q) => q.key !== 'shadow' && !hisHand(q))),
      ...sort(pb.filter((q) => q.key !== 'shadow' && herUnder(q))),
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

