// Section B: the Director's performance as one continuous function of film time (9.30 → 35.80), so every shot of the
// section sees the same body at the same moment: buried prone under a slab on the crest (B1: the right hand comes
// out, slaps down, presses, claws and slips back), the rise (B2: two drags on planted palms, the press-up on straight
// arms — the slab slides off his back —, the hips come back over a knee, kneel, the bar, the shoulders go forward
// over the front foot, the right foot comes under him, the drive up, a half step to catch himself), two steps down to
// the brink (B3), the heavy's look met (B5a: he knows it has picked him out), the strap pulled tight with his teeth
// (B5b), braced (B6a), the plate up into the sentry's mark and down again (B6b). Contacts are world points: palms,
// knees and feet on groundH, the left palm on the solved left knee, the bar's grip. Feet that carry weight never move;
// they lift to step. No React here (rig poses and world geometry only).
import {V3, add3, sub3, mul3, norm3, dot3, cross3, lerp, lerp3, clamp, smooth, easeIn, easeOut, easeInOut, Ease, noise} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN} from '../../world/plan';
import {groundH} from '../../world/ground';
import {headingVec} from '../../engine/camera';
import {keyPose, layer, blendPose, Key, Pose} from '../../rig/poses';
import {expr, exprMix} from '../../rig/faces';
import {HIP_H, HIP_X, THIGH, SHIN} from '../../rig/figure';
import type {WorldTargets} from '../../rig/sprite';
import {TB, SENTRY_T} from './beats';
import {heavyPosB, groupD, restD, VAN_FRONT_X, sentryPos} from './army';

// ------------------------------------------------------------------ places
export const HD = 96; // he faces east (a little south of it: toward the cameras on his right)
const F = headingVec(HD), Rt = headingVec(HD + 90);
const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
/** prone pelvis (B1), where he kneels and stands up (B2), where he ends (PLAN.directorStand) */
export const R0: V3 = gp(0.0, 1.52);
export const R1: V3 = gp(0.15 + F.x * 1.03 - Rt.x * 0.08, 1.52 + F.z * 1.03 - Rt.z * 0.08); // where he kneels
export const STAND: V3 = gp(PLAN.directorStand.x, PLAN.directorStand.z);
export const STAND_HEADING = 90;
/** a point near a root, along his heading / to his right; on the ground (+up) or body-relative (y from the root) */
const onG = (root: V3, h: number, f: number, r: number, up = 0): V3 => {
  const a = headingVec(h), b = headingVec(h + 90);
  return gp(root.x + a.x * f + b.x * r, root.z + a.z * f + b.z * r, up);
};
const onB = (root: V3, h: number, f: number, r: number, up: number): V3 => {
  const a = headingVec(h), b = headingVec(h + 90);
  return {x: root.x + a.x * f + b.x * r, y: root.y + up, z: root.z + a.z * f + b.z * r};
};
/** rig units per metre */
const U = 251.4;

// ------------------------------------------------------------------ timing (film seconds)
export {TB};

/** World point keys with per-segment easing (the arriving key's ease). */
type KV = [number, V3, Ease?];
export const keyV = (keys: KV[], t: number): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp3(keys[i - 1][1], keys[i][1], (keys[i][2] ?? easeInOut)((t - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
type KN = [number, number, Ease?];
const keyN = (keys: KN[], t: number): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (keys[i][2] ?? easeInOut)((t - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
const win = (t: number, a: number, b: number, ri: number, ro: number) => smooth((t - a) / ri) * (1 - smooth((t - (b - ro)) / ro));

// ------------------------------------------------------------------ props he touches
/** where the right hand comes out from under the slab and braces (B1) */
export const HAND_OUT: V3 = onG(R0, HD, 0.5, 0.76, 0.035);
/** The rebar stub he hauls himself up on: bars out of a small concrete lump right in front of him, a little to his
 * right (top = the grip). From B2's lens (south-south-east) it stands to the right of his body, clear of his face,
 * hands and knees. */
export const REBAR = (() => {
  const base = onG(R1, HD, 0.64, 0.12, 0.0);
  const top = add3(base, {x: 0.05, y: 0.62, z: 0.04});
  return {base, top, grip: add3(base, {x: 0.04, y: 0.5, z: 0.03})};
})();
/** how far the stub flexes under his pull (0..1) and its direction (toward him) */
export const rebarFlex = (T: number) => {
  const on = smooth((T - TB.rebar) / 0.12) * (1 - smooth((T - TB.release) / 0.15));
  const load = keyN([[TB.rebar, 0.25], [TB.weight, 0.6], [TB.step, 0.75], [TB.rise + 0.25, 1], [TB.up, 0.85], [TB.stagger + 0.1, 0.6], [TB.release, 0.2]], T);
  const ring = T > TB.release ? Math.exp(-(T - TB.release) * 7) * Math.sin((T - TB.release) * 38) * 0.35 : 0;
  return on * load + ring;
};
export const REBAR_PULL: V3 = (() => { const d = {x: R1.x - REBAR.base.x, y: 0, z: R1.z - REBAR.base.z}; const l = Math.hypot(d.x, d.z); return {x: d.x / l, y: 0, z: d.z / l}; })();

// ------------------------------------------------------------------ the rise: hands, feet, body
/** his feet at the end of the rise (the left planted forward at the kneel, the right after the half step) and the
 * standing root between them (B3's steps start here) */
const FOOT_L_FWD = onG(R1, HD, 0.32, -0.16, 0.02);
const FOOT_R_UNDER = onG(R1, HD, 0.04, 0.19, 0.02);
const FOOT_R_STOOD = onG(R1, HD, 0.22, 0.19, 0.02);
export const R1S: V3 = onG(R1, HD, 0.27, 0.015);
/** pelvis forward offset (rig units) that puts the hips over R1S while the root stays at R1 */
const PF_STOOD = 0.27 * U;

const PRONE: Pose = {drop: 150, bodyPitch: 86, lean: 0, head: {pitch: -40, yaw: 8}, legL: {fk: {fwd: 4, knee: 6}}, legR: {fk: {fwd: -4, knee: 12}}, handL: 'relaxed', handR: 'reach', face: expr('exhaustion', 0.8)};
const LEGS_PRONE = {legL: {fk: {fwd: 6, knee: 16}}, legR: {fk: {fwd: 0, knee: 20}}};
const LEGS_KNEE = {legL: {fk: {fwd: 82, knee: 118}}, legR: {fk: {fwd: 0, knee: 30}}};
// effort lives in the trunk and the head: the head drives at the hands on a pull, the chest rises on the press, the
// hips go back over the knee and then forward over the front foot; faces from the rig's presets (effort, pain,
// exhaustion, concentration, resolve)
const RISE: Key[] = [
  [TB.pull - 0.3, PRONE],
  // gather: a breath in, the head comes up, brows knit
  [TB.pull + 0.02, {...PRONE, drop: 148, head: {pitch: -50, yaw: 4}, handL: 'brace', handR: 'brace', face: expr('effort', 0.7)}],
  // the first drag: head and shoulders drive toward the planted hands, teeth set
  [TB.pull + 0.35, {...PRONE, drop: 145, bodyPitch: 83, lean: -3, head: {pitch: -57, yaw: 2}, handL: 'brace', handR: 'brace', face: expr('effort', 1)}],
  [TB.pullEnd, {...PRONE, drop: 146, bodyPitch: 84, head: {pitch: -44, yaw: 4}, handL: 'brace', handR: 'brace', face: expr('exhaustion', 0.7, {mouth: 'pant', open: 0.45})}],
  // the press: palms under the shoulders; the left (plate) arm takes weight — a wince
  [TB.push + 0.16, {drop: 138, bodyPitch: 75, lean: -4, head: {pitch: -38}, ...LEGS_PRONE, handL: 'brace', handR: 'brace', face: exprMix('effort', 'pain', 0.55)}],
  // chest up on straight arms (the slab slides off his back): a cry through the teeth
  [TB.chestUp, {drop: 124, bodyPitch: 54, lean: -8, head: {pitch: -26}, ...LEGS_PRONE, handL: 'brace', handR: 'brace', face: expr('effort', 1, {mouth: 'open', open: 0.55})}, easeOut],
  // the slab slams down behind him: a flinch
  [TB.slabLand + 0.06, {drop: 118, bodyPitch: 46, lean: -2, head: {pitch: -12, roll: 5}, ...LEGS_PRONE, handL: 'brace', handR: 'brace', face: exprMix('pain', 'exhaustion', 0.35)}],
  // a knee under him: the hips come up and BACK over the knees, the weight onto the hands and the right knee
  [TB.knee + 0.05, {drop: 104, bodyPitch: 34, lean: 4, head: {pitch: -14}, ...LEGS_KNEE, pelvis: {f: -10}, handL: 'brace', handR: 'brace', face: expr('exhaustion', 1)}],
  [TB.knee + 0.32, {drop: 98, bodyPitch: 26, lean: 8, head: {pitch: -20}, ...LEGS_KNEE, pelvis: {f: -14}, handL: 'brace', handR: 'brace', face: expr('exhaustion', 1, {open: 0.5})}],
  // kneeling on the right knee, the left foot planted forward, the torso up; his eyes go to the bar
  [TB.kneel, {drop: 88, bodyPitch: 8, lean: 20, head: {pitch: 16, yaw: 14}, pelvis: {f: -8}, handL: 'brace', handR: 'open', face: expr('concentration', 0.9, {mouth: 'pant', open: 0.3})}],
  [TB.rebar + 0.1, {drop: 88, bodyPitch: 4, lean: 24, head: {pitch: 12, yaw: 10}, pelvis: {f: -4}, handL: 'brace', handR: 'grip', face: expr('effort', 0.6)}],
  // load: the shoulders go forward over the front knee, the back knee comes off the ground
  [TB.weight, {drop: 84, bodyPitch: 0, lean: 40, head: {pitch: 10, yaw: 4}, pelvis: {f: 16}, handL: 'brace', handR: 'grip', face: expr('effort', 1)}],
  // the right foot comes in under him: a deep, lopsided crouch over both feet, the bar holding him
  [TB.step, {drop: 84, bodyPitch: 0, lean: 40, side: -3, head: {pitch: 8}, pelvis: {f: 36}, handL: 'brace', handR: 'grip', face: expr('effort', 0.85, {mouth: 'pant', open: 0.4})}],
  // the drive: both legs straighten, the bar bends toward him, the left palm shoves down on the knee
  [TB.rise + 0.22, {drop: 62, bodyPitch: 0, lean: 32, side: -3, head: {pitch: 2}, pelvis: {f: 44}, handL: 'brace', handR: 'grip', face: expr('effort', 1, {mouth: 'pain'})}, easeIn],
  [TB.up, {drop: 22, bodyPitch: 0, lean: 14, side: -4, head: {pitch: -2}, pelvis: {f: 52}, handL: 'fist', handR: 'grip', face: expr('effort', 0.8, {mouth: 'open', open: 0.45})}, easeOut],
  // the half step to catch his balance (the right foot), a sway; pain
  [TB.staggerEnd, {drop: 18, bodyPitch: 0, lean: 11, side: 5, head: {pitch: 2, roll: -4}, pelvis: {f: 64}, handL: 'fist', handR: 'grip', face: expr('pain', 0.6)}, easeOut],
  [TB.stood, {drop: 14, bodyPitch: 0, lean: 8, side: 2, head: {pitch: 6, roll: -3}, pelvis: {f: PF_STOOD}, handL: 'fist', handR: 'open', face: expr('exhaustion', 0.9), breath: 0.55}],
  [TB.stood + 0.4, {drop: 16, bodyPitch: 0, lean: 7, head: {pitch: 8}, pelvis: {f: PF_STOOD}, handL: 'fist', handR: 'fist', face: exprMix('exhaustion', 'resolve', 0.4), breath: 0.6}],
];

/** his breath through the rise (chest −1 … 1): in before each effort, held through it, out after */
const riseChest = (T: number) => keyN([
  [TB.pull - 0.4, -0.1], [TB.pull - 0.05, 0.7], [TB.pullEnd - 0.1, 0.55], [TB.pullEnd + 0.08, -0.5, easeOut], [TB.push + 0.1, 0.45],
  [TB.chestUp, 0.8], [TB.slabLand, 0.2], [TB.slabLand + 0.25, -0.6, easeOut], [TB.knee + 0.3, 0.25], [TB.kneel, -0.35], [TB.rebar, 0.7],
  [TB.step, 0.6], [TB.up, 0.85], [TB.staggerEnd, -0.6, easeOut], [TB.stood, 0.3], [TB.stood + 0.3, -0.4],
], T);

/** the injured left arm (plate) held in against the body once he stands */
const ARM_IN = {armL: {local: {r: -40, u: 196, f: 46}, pole: {r: -1, u: -0.4, f: -0.3}}};
const ARM_R_HANG = {armR: {local: {r: 74, u: 150, f: 18}}};

export type DirB = {
  pos: V3; heading: number; pose: Pose; world: WorldTargets;
  /** world points used by the shots (FX, sound, the camera): palm contacts etc. */
  palmR?: V3; palmL?: V3;
  /** false while he lies prone: the legs lie behind him (don't drop the pelvis to reach the feet) */
  reach?: boolean;
  /** what his eyes are on (world), and how much */
  gaze?: V3; gazeW?: number;
};

const palmDown = {x: 0, y: -1, z: 0};

/** The Director at film time T (B section). */
export const dirB = (T: number): DirB => {
  if (T < 16.76) return rise(T);
  if (T < TB.settle + 0.2) return steps(T);
  if (T >= TB.look - 0.2 && T < TB.ready + 0.6) return strap(T);
  return standing(T);
};

/** the prone root dragged forward: pull 1 (the right arm), pull 2 + chest up, the hips come over the knee */
export const rootB = (T: number): V3 => keyV([[TB.pull + 0.22, R0], [TB.pullEnd - 0.1, lerp3(R0, R1, 0.41), easeOut], [TB.push, lerp3(R0, R1, 0.43)], [TB.chestUp, lerp3(R0, R1, 0.73), easeOut], [TB.knee + 0.15, R1]], T);

/** the left knee of the planted left leg (world), solved like the rig solves it: hip from the pose, foot planted,
 * the knee bending forward (so the left palm can stay ON the knee while the hips move) */
const kneeL = (root: V3, pose: Pose, foot: V3): V3 => {
  const hipH = (HIP_H - (pose.drop ?? 0) + (pose.pelvis?.u ?? 0)) / U, pf = (pose.pelvis?.f ?? 0) / U;
  const hip = add3(add3({x: root.x, y: root.y + hipH, z: root.z}, mul3(F, pf)), mul3(Rt, -HIP_X / U));
  const ankle = add3(foot, {x: 0, y: 0.04, z: 0});
  const a = THIGH / U, b = SHIN / U;
  const d = sub3(ankle, hip), L = Math.min(Math.hypot(d.x, d.y, d.z), a + b - 1e-4), dn = norm3(d);
  const x = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(0, a * a - x * x));
  // the bend direction: forward (his heading), made perpendicular to hip → ankle
  const pole = add3(F, mul3(Rt, -0.15));
  const pp = norm3(sub3(pole, mul3(dn, dot3(pole, dn))));
  return add3(add3(hip, mul3(dn, x)), mul3(pp, h));
};

// ---- B1 + B2: prone → standing at R1
const rise = (T: number): DirB => {
  // the root: dragged forward in two pulls, then the hips come over the knee
  const root = rootB(T);
  const pos = {...root, y: groundH(root.x, root.z)};
  // terrain: lying on a slope that falls toward his head — pitch the prone body down it (fades as he rises)
  const slope = (groundH(pos.x + F.x * 0.6, pos.z + F.z * 0.6) - groundH(pos.x - F.x * 0.6, pos.z - F.z * 0.6)) / 1.2;
  const slopeDeg = (Math.atan(slope) * 180) / Math.PI;
  const pose0 = keyPose(RISE, T);
  const lying = clamp(((pose0.bodyPitch ?? 0) - 20) / 64);
  // ---- the right hand: hidden under the slab, slides out over the grit, lifts, slaps down, presses (a tremor in the
  // load), claws and slips back an inch toward the slab; reaches forward for the first drag; plants under the
  // shoulder for the press; up to the bar; lets go
  const under = onG(R0, HD, 0.48, 0.5, 0.07);
  const slapP = HAND_OUT;
  const slipP = add3(HAND_OUT, {x: -F.x * 0.035 - Rt.x * 0.02, y: 0, z: -F.z * 0.035 - Rt.z * 0.02});
  const lifted = add3(HAND_OUT, {x: -F.x * 0.03, y: 0.075, z: -F.z * 0.03});
  const pull1 = onG(R0, HD, 0.98, 0.3, 0.035); // reached forward for the first drag
  const push2 = onG(lerp3(R0, R1, 0.43), HD, 0.88, 0.24, 0.035);
  const handR0 = keyV([
    [9.3, under], [TB.slideOut, under], [TB.lift, add3(HAND_OUT, {x: -F.x * 0.07, y: 0.02, z: -F.z * 0.07}), easeOut],
    [TB.lift + 0.22, lifted, easeOut], [TB.slap, slapP, easeIn], [TB.strain + 0.05, slapP], [TB.slip, slipP, easeIn], [TB.pull - 0.04, slipP],
    [TB.pull + 0.1, add3(lerp3(slipP, pull1, 0.5), {x: 0, y: 0.1, z: 0})], [TB.pull + 0.22, pull1, easeIn], [TB.pullEnd - 0.1, pull1],
    [TB.pullEnd + 0.05, add3(lerp3(pull1, push2, 0.5), {x: 0, y: 0.12, z: 0})], [TB.push + 0.08, push2, easeIn],
    [TB.knee + 0.25, push2], [TB.knee + 0.55, onB(R1, HD, 0.45, 0.32, 0.62)], [TB.rebar, REBAR.grip, easeIn],
    [TB.release, add3(REBAR.grip, {x: 0, y: 0.1, z: 0})], [TB.stood, onB(R1, HD, 0.3, 0.36, 0.86)],
  ], T);
  // the press trembles (the forearm carrying his weight against the slab); a few millimetres
  const shake = win(T, TB.press - 0.05, TB.slip + 0.05, 0.12, 0.1) * 0.0016;
  const handR = add3(handR0, {x: noise(T * 9, 3) * shake, y: Math.abs(noise(T * 11, 5)) * shake * 0.5, z: noise(T * 8, 7) * shake});
  const flex = rebarFlex(T);
  const handRf = T > TB.rebar - 0.05 && T < TB.release + 0.1 ? add3(handR, mul3(REBAR_PULL, 0.06 * flex)) : handR;
  // ---- feet: dragging behind (toes in the rubble), the left foot comes forward under him and steps out in front
  // (planted from the kneel to the end), the right knee goes down behind and stays; the right foot comes in under
  // him (lifted), then the half step forward beside the left
  const fL0 = onG(R0, HD, -0.56, -0.13, 0.08), fR0 = onG(R0, HD, -0.58, 0.13, 0.08);
  const kneelR = onG(R1, HD, -0.44, 0.15, 0.09);
  const footL = keyV([
    [TB.pull, fL0], [TB.pullEnd - 0.1, onG(lerp3(R0, R1, 0.41), HD, -0.58, -0.13, 0.07), easeOut], [TB.push, onG(lerp3(R0, R1, 0.43), HD, -0.58, -0.13, 0.07)], [TB.chestUp, onG(lerp3(R0, R1, 0.73), HD, -0.6, -0.13, 0.06), easeOut],
    [TB.knee - 0.15, onG(R1, HD, -0.2, -0.15, 0.08)], [TB.knee, onG(R1, HD, 0.06, -0.15, 0.03)],
    [TB.knee + 0.3, onG(R1, HD, 0.06, -0.15, 0.03)], [TB.knee + 0.45, onG(R1, HD, 0.2, -0.16, 0.13), easeOut], [TB.kneel, FOOT_L_FWD, easeIn],
  ], T);
  const footR = keyV([
    [TB.pull, fR0], [TB.pullEnd - 0.1, onG(lerp3(R0, R1, 0.41), HD, -0.6, 0.13, 0.07), easeOut], [TB.push, onG(lerp3(R0, R1, 0.43), HD, -0.6, 0.13, 0.07)], [TB.chestUp, onG(lerp3(R0, R1, 0.73), HD, -0.62, 0.14, 0.08), easeOut],
    [TB.knee, onG(R1, HD, -0.5, 0.15, 0.09)], [TB.knee + 0.12, kneelR, easeOut], [TB.weight + 0.04, kneelR],
    [TB.weight + 0.2, onG(R1, HD, -0.2, 0.18, 0.17), easeOut], [TB.step, FOOT_R_UNDER, easeIn],
    [TB.stagger, FOOT_R_UNDER], [TB.stagger + 0.12, onG(R1, HD, 0.14, 0.2, 0.09), easeOut], [TB.staggerEnd, FOOT_R_STOOD, easeIn],
  ], T);
  // ---- the left (plate) arm: forearm dragged along, a palm planted for each drag and the press, then ON the left
  // knee (solved: it rides the knee while the hips move), shoving down through the drive, then held in
  const elbowL = onG(R0, HD, 0.78, -0.3, 0.05);
  const palmL1 = onG(R0, HD, 1.05, -0.3, 0.035);
  const palmL2 = onG(lerp3(R0, R1, 0.43), HD, 0.8, -0.28, 0.035);
  const onKnee = add3(kneeL(R1, pose0, FOOT_L_FWD), add3(mul3(F, 0.025), {x: 0, y: 0.07, z: 0}));
  const kneeW = T < TB.kneel - 0.3 ? 0 : T < TB.up ? smooth((T - (TB.kneel - 0.3)) / 0.25) : 1 - smooth((T - TB.up) / 0.25);
  const handL0 = keyV([
    [9.3, elbowL], [TB.pull + 0.1, elbowL], [TB.pull + 0.3, add3(palmL1, {x: 0, y: 0.08, z: 0})], [TB.pull + 0.45, palmL1, easeIn],
    [TB.pullEnd, palmL1], [TB.push + 0.05, add3(palmL2, {x: 0, y: 0.1, z: 0})], [TB.push + 0.2, palmL2, easeIn],
    [TB.knee + 0.1, palmL2], [TB.kneel - 0.3, add3(palmL2, {x: 0, y: 0.18, z: 0})],
    [TB.up, onB(R1, HD, 0.42, -0.26, 0.75)], [TB.staggerEnd, onB(R1, HD, 0.4, -0.24, 0.98)], [TB.stood, onB(R1, HD, 0.36, -0.26, 1.02)],
  ], T);
  const handL = lerp3(handL0, onKnee, kneeW);
  // planted palms: the wrist bends so the palm lies on the rubble (or the knee), fingers forward and a little out
  const liftK = (a: number, b: number) => (T > a && T < b ? Math.sin(Math.PI * (T - a) / (b - a)) : 0);
  const plantR = (T < TB.slap ? smooth((T - (TB.lift - 0.3)) / 0.5) * (1 - 0.4 * smooth((T - TB.lift) / 0.2)) + 0.4 * smooth((T - (TB.slap - 0.12)) / 0.12) : T < TB.knee + 0.3 ? 1 : 1 - smooth((T - (TB.knee + 0.3)) / 0.25)) * (1 - 0.7 * liftK(TB.pull - 0.04, TB.pull + 0.22) - 0.7 * liftK(TB.pullEnd - 0.1, TB.push + 0.08));
  const plantL = T < TB.pull + 0.3 ? 0.5 : T < TB.knee + 0.2 ? smooth((T - (TB.pull + 0.3)) / 0.25) : Math.max(1 - smooth((T - (TB.knee + 0.2)) / 0.3), kneeW);
  const orientR = {fingers: add3(mul3(F, 0.9), mul3(Rt, 0.35)), palm: palmDown, w: clamp(plantR)};
  const orientL = {fingers: add3(mul3(F, 0.9), mul3(Rt, -0.35)), palm: palmDown, w: clamp(plantL)};
  // the right hand's shape: reaching under the slab, spread as it comes out and slaps, braced through the press,
  // clawing into the grit (and slipping), braced for the drags; then the pose's (open → grip on the bar)
  const handRShape = T < TB.slideOut ? 'reach' : T < TB.slap - 0.04 ? 'open' : T < TB.strain ? 'brace' : T < TB.pull + 0.05 ? 'grip' : T < TB.knee + 0.3 ? 'brace' : pose0.handR;
  const pose: Pose = {
    ...pose0,
    bodyPitch: (pose0.bodyPitch ?? 0) - slopeDeg * lying,
    handR: handRShape,
    ...(T > TB.pull - 0.4 && T < TB.stood + 0.3 ? {chest: riseChest(T)} : {breath: 0.5}),
    ...(T > TB.stood - 0.3 ? {armL: {local: {r: -40, u: 196, f: 46}, pole: {r: -1, u: -0.4, f: -0.3}, w: smooth((T - TB.stood + 0.3) / 0.5)}} : {}),
  };
  // B1: face down in the rubble under the slab; on the strain he lifts it (a breath), ready to drag himself out
  if (T < TB.pull) {
    pose.head = {pitch: lerp(10, -36, smooth((T - TB.strain) / 0.5)) + 3 * Math.sin(T * 2.2), yaw: 14};
    const wake = smooth((T - 9.75) / 0.5);
    pose.face = {...expr('pain', 0.5 + 0.5 * win(T, TB.slap - 0.05, TB.pull, 0.1, 0.3)), lid: lerp(1, 0.35, wake), lookX: 0.6 * wake, lookY: 0.4 * wake};
  }
  const world: WorldTargets = {handR: handRf, handL, footL, footR, orientR, orientL};
  if (T > TB.stood) { world.handL = undefined; world.handR = undefined; world.orientL = undefined; world.orientR = undefined; }
  // eyes: on the hands while he drags, the bar while he kneels and rises, ahead (east) once he is up
  const gaze = T < TB.pull ? undefined : T < TB.knee ? add3(pull1, {x: 0.3, y: 0.1, z: 0}) : T < TB.up ? REBAR.top : {x: 60, y: 2, z: 0};
  return {pos, heading: HD, pose: T > TB.stood ? layer(pose, ARM_R_HANG) : pose, world, palmR: slapP, palmL: palmL1, reach: T > TB.knee - 0.2, gaze, gazeW: T < TB.pull ? 0 : 0.8};
};

// ---- B3: two steps down from the rise (R1S) to the brink (STAND), heading turning to due east
const steps = (T: number): DirB => {
  const h = lerp(HD, STAND_HEADING, smooth((T - TB.step1) / 1.0));
  const fL1 = FOOT_L_FWD, fR1 = FOOT_R_STOOD;
  const fR2 = onG(STAND, STAND_HEADING, -0.12, 0.17, 0.02), fL2 = onG(STAND, STAND_HEADING, 0.24, -0.16, 0.02);
  // anticipation: weight onto the left foot, then the right steps down past it; then the left steps down ahead
  const footR = keyV([[TB.step1, fR1], [TB.step1 + 0.22, add3(lerp3(fR1, fR2, 0.5), {x: 0, y: 0.12, z: 0}), easeOut], [TB.step1End, fR2, easeIn]], T);
  const footL = keyV([[TB.step2, fL1], [TB.step2 + 0.24, add3(lerp3(fL1, fL2, 0.5), {x: 0, y: 0.12, z: 0}), easeOut], [TB.step2End, fL2, easeIn]], T);
  const root = keyV([[TB.step1 - 0.2, R1S], [TB.step1, onG(R1S, HD, 0.0, -0.06)], [TB.step1End + 0.05, lerp3(R1S, STAND, 0.5)], [TB.step2End + 0.08, STAND], [TB.settle, STAND]], T);
  const pos = {...root, y: groundH(root.x, root.z)};
  const dip = 8 * Math.sin(Math.PI * clamp((T - TB.step1) / (TB.step1End - TB.step1 + 0.05))) + 7 * Math.sin(Math.PI * clamp((T - TB.step2) / (TB.step2End - TB.step2 + 0.08)));
  const pose: Pose = {
    drop: 16 + dip, lean: 8, side: keyN([[TB.step1 - 0.2, 0], [TB.step1, -4], [TB.step1End, 3], [TB.step2End, -2], [TB.settle, 0]], T),
    head: {pitch: 12 - 4 * smooth((T - TB.step2End) / 0.3), yaw: 0}, ...ARM_IN, ...ARM_R_HANG,
    armR: {local: {r: 80, u: 168 + 20 * Math.sin(Math.PI * clamp((T - TB.step1) / 1.0)), f: 26}},
    handL: 'fist', handR: 'relaxed', face: exprMix('exhaustion', 'resolve', 0.45 + 0.3 * smooth((T - TB.step2End) / 0.5), {mouth: 'pant', open: 0.3}), breath: 0.6,
  };
  return {pos, heading: h, pose, world: {footL, footR}, gaze: {x: 80, y: 2, z: 0}, gazeW: 0.7};
};

// ---- standing on the brink (B3 after the steps … B6): braced on the slope, breathing; the plate arm at the ready.
// From 35.75 on this is exactly what section C1 continues from (C reads dirB until its pivot): keep it so.
export const STAND_FEET = {L: onG(STAND, STAND_HEADING, 0.24, -0.16, 0.02), R: onG(STAND, STAND_HEADING, -0.12, 0.17, 0.02)};
/** the heavy's head (B4's heavy, HEAVIES_B[0]): what he looks at from H3 (it has turned to him) to the strap */
export const heavyHeadB = (T: number): V3 => { const p = heavyPosB(0, T); return {x: p.x - 2.15, y: 4.6, z: p.z}; };
/** the vanguard's front rank, centre (where his eyes rest when nothing singles him out) */
const vanFront = (T: number): V3 => ({x: VAN_FRONT_X + restD('van') - groupD('van', T), y: 2.0, z: 0});
const standBase = (T: number): Pose => {
  const ready = smooth((T - TB.ready) / 0.8); // after the strap: the plate comes up to a low guard
  const h1 = smooth((T - M.H1) / 0.25) * (1 - smooth((T - M.H1 - 1.6) / 1.0)); // the army's step: he tenses
  const sway = noise(T * 0.4, 11) * 1.2;
  return {
    drop: 16 + 4 * h1 + 3 * ready, lean: 7 + 2 * h1, side: sway, twist: -6 * ready,
    head: {pitch: lerp(8, 2, ready) - 6 * h1, yaw: 0},
    armL: {local: {r: lerp(-40, -28, ready), u: lerp(196, 232, ready), f: lerp(46, 78, ready)}, pole: {r: -1, u: -0.4, f: -0.3}},
    armR: {local: {r: 74, u: 150 + 6 * h1, f: 18 + 6 * ready}},
    handL: 'fist', handR: h1 > 0.5 ? 'fist' : 'relaxed',
    face: {mouth: h1 > 0.3 ? 'flat' : 'pant', brows: -0.3 - 0.4 * h1 - 0.2 * ready, worry: 0.2 * (1 - ready), squint: 0.2 * ready},
    breath: lerp(0.6, 0.42, smooth((T - 20) / 8)),
  };
};
const standing = (T: number): DirB => {
  let pose = standBase(T);
  let gaze: V3 = T < M.H3 ? vanFront(T) : T < TB.look ? heavyHeadB(T) : vanFront(T);
  // ---- B5a: the heavy's head has come round to him. The breath catches, brows go up and pinch (it has picked him
  // out), a beat, then they come down and the jaw sets; the chin comes up a fraction
  const see = win(T, TB.see - 0.08, TB.set + 0.2, 0.18, 0.5), set = win(T, TB.set - 0.1, TB.look, 0.45, 0.3);
  if (see > 0.001 || set > 0.001) {
    const f = exprMix('realization', 'resolve', smooth((T - TB.set + 0.1) / 0.5));
    const catchK = win(T, TB.see - 0.05, TB.see + 0.7, 0.12, 0.45);
    pose = layer(pose, {
      face: lerpFaceK(pose.face ?? {}, f, Math.max(see, set)),
      head: {pitch: (pose.head?.pitch ?? 0) - 3 * set + 2 * catchK, yaw: 0},
      lean: (pose.lean ?? 7) - 2 * catchK, chest: lerp(0.1, 0.75, catchK) - 0.5 * set,
    });
  }
  // ---- B6b: the sentry comes at him. He does not step back: the plate comes up between it and his face, the weight
  // goes forward into it; when it backs off the plate goes back down to his low guard (by 35.62: C picks up from here)
  const g = win(T, TB.guard, TB.guardLow, TB.guardUp - TB.guard, TB.guardLow - TB.guardDown);
  if (g > 0.001) {
    pose = blendPose(pose, layer(pose, {
      drop: (pose.drop ?? 19) + 6, lean: (pose.lean ?? 7) + 6, twist: -14,
      armL: {local: {r: -6, u: 286, f: 96}, pole: {r: -1, u: -0.6, f: 0.1}, palm: {r: -0.5, u: 0.1, f: -1}},
      armR: {local: {r: 62, u: 196, f: 52}}, handR: 'fist',
      head: {pitch: 4, yaw: 0},
      face: {...expr('anger', 0.6), mouth: 'grit'},
    }), g);
  }
  const sentry = T > SENTRY_T.go + 1.2 && T < TB.guardLow + 0.1;
  if (sentry) gaze = sentryPos(T);
  return {pos: STAND, heading: STAND_HEADING, pose, world: {footL: STAND_FEET.L, footR: STAND_FEET.R}, gaze, gazeW: T > TB.guardLow + 0.1 ? 0 : 0.85};
};
const lerpFaceK = (a: Pose['face'], b: NonNullable<Pose['face']>, k: number): NonNullable<Pose['face']> =>
  blendPose({face: a}, {face: b}, k).face ?? b;

// ---- B5b: he looks down at the left arm and pulls the plate's strap tight with his teeth and the right hand
const strap = (T: number): DirB => {
  const base = standing(T);
  const up = smooth((T - TB.raise) / 0.4) * (1 - smooth((T - TB.letGo) / 0.5));
  const bite = smooth((T - TB.bite) / 0.2) * (1 - smooth((T - TB.tugEnd - 0.1) / 0.25));
  const tug = keyN([[TB.tug - 0.05, 0], [TB.tug + 0.08, -0.3, easeOut], [TB.tugEnd, 1, easeIn], [TB.tugEnd + 0.18, 0.85], [TB.letGo, 0.6]], T);
  const look = smooth((T - TB.look) / 0.35) * (1 - smooth((T - TB.ready) / 0.5));
  const pose: Pose = {
    ...base.pose,
    // the forearm comes up across the chest, plate outward, wrist toward his mouth
    armL: {local: {r: lerp(-40, 20, up), u: lerp(196, 262, up), f: lerp(46, 62, up)}, pole: {r: -1, u: -0.6, f: -0.1}},
    // the right hand takes the strap's end at the buckle, then pulls it down and out across his body
    armR: {local: {r: lerp(74, lerp(4, 84, clamp(tug)), up), u: lerp(150, lerp(244, 168, clamp(tug)), up), f: lerp(18, lerp(78, 44, clamp(tug)), up)}, pole: {r: 1, u: -0.5, f: -0.2}},
    handR: up > 0.4 ? 'grip' : 'relaxed', handL: 'fist',
    head: {pitch: lerp(4, 30, look) - 10 * tug * bite, yaw: lerp(0, -32, look) + 16 * tug * bite, roll: 6 * tug * bite},
    lean: (base.pose.lean ?? 7) + 4 * bite,
    face: bite > 0.4 ? expr('effort', 0.9, {lookY: 0.7 * look, lookX: -0.5 * look}) : expr('resolve', 0.8, {mouth: look > 0.5 ? 'flat' : 'pant', lookY: 0.7 * look, lookX: -0.5 * look}),
  };
  // eyes: down on the strap while he works it, back up to the army as the guard comes up
  return {...base, pose, gaze: undefined, gazeW: 0};
};

/** For section C: where and how he stands at the end of B (35.80). */
export const DIRECTOR_B_END = {pos: STAND, heading: STAND_HEADING, feet: STAND_FEET};
void [easeIn, easeOut, PLAN, cross3];
