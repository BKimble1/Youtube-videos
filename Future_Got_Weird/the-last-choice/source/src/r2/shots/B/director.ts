// Section B: the Director's performance as one continuous function of film time (9.30 → 35.80), so every shot of the
// section sees the same body at the same moment: buried prone under a slab on the crest (B1: the right hand comes
// out and braces), the rise (B2: drag, chest up — the slab slides off his back —, a knee under him, weight onto the
// front foot with a hand on a rebar stub, a staggered push to standing), two steps down to the brink (B3), breathing
// (B4), the strap pulled tight with his teeth (B5), braced and still (B6). Contacts are world points: palms, knees and
// feet on groundH, the rebar grip on the stub's top. No React here (rig poses and world geometry only).
import {V3, add3, mul3, lerp, lerp3, clamp, smooth, easeIn, easeOut, easeInOut, Ease, noise} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN} from '../../world/plan';
import {groundH} from '../../world/ground';
import {headingVec} from '../../engine/camera';
import {keyPose, layer, Key, Pose} from '../../rig/poses';
import type {WorldTargets} from '../../rig/sprite';
import {TB} from './beats';

// ------------------------------------------------------------------ places
export const HD = 96; // he faces east (a little south of it: toward the cameras on his right)
const F = headingVec(HD), Rt = headingVec(HD + 90);
const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
/** prone pelvis (B1), where he kneels and stands up (B2), where he ends (PLAN.directorStand) */
export const R0: V3 = gp(0.0, 1.52);
export const R1: V3 = gp(0.15 + F.x * 1.03 - Rt.x * 0.08, 1.52 + F.z * 1.03 - Rt.z * 0.08); // where he kneels and stands
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

// ------------------------------------------------------------------ props he touches
/** where the right hand comes out from under the slab and braces (B1) */
export const HAND_OUT: V3 = onG(R0, HD, 0.5, 0.76, 0.035);
/** The rebar stub he grabs: bars out of a concrete lump on his right, a little ahead (top = the grip). */
export const REBAR = (() => {
  const base = onG(R1, HD, 0.42, 0.55, 0.0);
  const top = add3(base, {x: 0.05, y: 0.6, z: 0.04});
  return {base, top, grip: add3(base, {x: 0.04, y: 0.5, z: 0.03})};
})();
/** how far the stub flexes under his pull (0..1) and its direction (toward him) */
export const rebarFlex = (T: number) => {
  const on = smooth((T - TB.rebar) / 0.12) * (1 - smooth((T - TB.release) / 0.15));
  const load = keyN([[TB.rebar, 0.25], [TB.weight, 0.7], [TB.rise, 1], [TB.step, 0.8], [TB.release, 0.2]], T);
  const ring = T > TB.release ? Math.exp(-(T - TB.release) * 7) * Math.sin((T - TB.release) * 38) * 0.35 : 0;
  return on * load + ring;
};
export const REBAR_PULL: V3 = (() => { const d = {x: R1.x - REBAR.base.x, y: 0, z: R1.z - REBAR.base.z}; const l = Math.hypot(d.x, d.z); return {x: d.x / l, y: 0, z: d.z / l}; })();

// ------------------------------------------------------------------ the rise: hands, feet, body
const PRONE: Pose = {drop: 150, bodyPitch: 86, lean: 0, head: {pitch: -40, yaw: 8}, legL: {fk: {fwd: 4, knee: 6}}, legR: {fk: {fwd: -4, knee: 12}}, handL: 'relaxed', handR: 'reach', face: {lid: 0.3, lids: 0.6, mouth: 'pant', brows: 0.3, worry: 0.5}};
const RISE: Key[] = [
  [TB.pull - 0.1, PRONE],
  // drag: head up, the right arm pulls, face strained
  [TB.pullEnd, {...PRONE, drop: 146, bodyPitch: 84, head: {pitch: -48, yaw: 4}, handL: 'brace', handR: 'brace', face: {lids: 0.25, mouth: 'grit', brows: -0.5, squint: 0.4}}],
  // chest up on straight arms (the slab slides off his back)
  [TB.chestUp, {drop: 126, bodyPitch: 58, lean: -6, head: {pitch: -30}, legL: {fk: {fwd: 6, knee: 16}}, legR: {fk: {fwd: 0, knee: 20}}, handL: 'brace', handR: 'brace', face: {lids: 0.15, mouth: 'open', open: 0.7, brows: -0.7, squint: 0.5}}, easeOut],
  // a knee under him
  [TB.knee, {drop: 104, bodyPitch: 32, lean: 4, head: {pitch: -16}, legL: {fk: {fwd: 82, knee: 118}}, legR: {fk: {fwd: 0, knee: 30}}, handL: 'brace', handR: 'brace', face: {lids: 0.2, mouth: 'pant', brows: -0.3, worry: 0.3}}],
  [TB.knee + 0.3, {drop: 100, bodyPitch: 28, lean: 6, head: {pitch: -22}, legL: {fk: {fwd: 82, knee: 118}}, legR: {fk: {fwd: 0, knee: 30}}, handL: 'brace', handR: 'brace', face: {lids: 0.3, mouth: 'pant', brows: 0.2, worry: 0.5}}],
  // kneeling on the right knee, the left foot planted forward, torso up, the right hand to the rebar
  [TB.kneel, {drop: 88, bodyPitch: 8, lean: 22, head: {pitch: -6, yaw: 10}, handL: 'fist', handR: 'open', face: {lids: 0.1, mouth: 'grit', brows: -0.6}}],
  [TB.rebar + 0.1, {drop: 86, bodyPitch: 6, lean: 24, head: {pitch: -4, yaw: 16}, handL: 'fist', handR: 'grip', face: {mouth: 'grit', brows: -0.7, squint: 0.3}}],
  // weight onto the front foot, pulling on the stub: the pelvis rises
  [TB.weight, {drop: 46, bodyPitch: 0, lean: 30, side: -3, head: {pitch: -2, yaw: 6}, handL: 'fist', handR: 'grip', face: {mouth: 'grit', brows: -0.9, squint: 0.6}}, easeOut],
  [TB.rise, {drop: 40, bodyPitch: 0, lean: 28, side: -4, head: {pitch: -6}, handL: 'fist', handR: 'grip', face: {mouth: 'grit', brows: -1, squint: 0.7}}],
  // the push to standing, staggered: a half step to catch himself
  [TB.step, {drop: 18, bodyPitch: 0, lean: 12, side: 5, head: {pitch: 2, roll: -4}, handL: 'fist', handR: 'grip', face: {mouth: 'open', open: 0.5, brows: 0.1, worry: 0.3}}, easeOut],
  [TB.stood, {drop: 14, bodyPitch: 0, lean: 8, side: 2, head: {pitch: 6, roll: -3}, handL: 'fist', handR: 'open', face: {mouth: 'pant', brows: -0.2, worry: 0.2}, breath: 0.55}],
  [TB.stood + 0.4, {drop: 16, bodyPitch: 0, lean: 7, head: {pitch: 10}, handL: 'fist', handR: 'fist', face: {mouth: 'pant', brows: -0.3}, breath: 0.6}],
];

/** the injured left arm (plate) held in against the body once he stands */
const ARM_IN = {armL: {local: {r: -40, u: 196, f: 46}, pole: {r: -1, u: -0.4, f: -0.3}}};
const ARM_R_HANG = {armR: {local: {r: 74, u: 150, f: 18}}};

export type DirB = {
  pos: V3; heading: number; pose: Pose; world: WorldTargets;
  /** world points used by the shots (FX, sound, the camera): palm contacts etc. */
  palmR?: V3; palmL?: V3;
  /** false while he lies prone: the legs lie behind him (don't drop the pelvis to reach the feet) */
  reach?: boolean;
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
  // the right hand: hidden under the slab, slides out, lifts, slaps down, presses; pulls; plants under the shoulder;
  // up to the rebar stub; lets go
  const handOut = HAND_OUT;
  const under = onG(R0, HD, 0.48, 0.5, 0.07);
  const slapP = handOut;
  const lifted = add3(handOut, {x: -F.x * 0.03, y: 0.075, z: -F.z * 0.03});
  const pull1 = onG(R0, HD, 0.98, 0.3, 0.035); // reached forward for the first pull
  const push2 = onG(lerp3(R0, R1, 0.43), HD, 0.88, 0.24, 0.035);
  const handR = keyV([
    [9.3, under], [TB.slideOut, under], [TB.lift, add3(handOut, {x: -F.x * 0.07, y: 0.02, z: -F.z * 0.07}), easeOut],
    [TB.lift + 0.22, lifted, easeOut], [TB.slap, slapP, easeIn], [TB.pull - 0.04, slapP],
    [TB.pull + 0.1, add3(lerp3(slapP, pull1, 0.5), {x: 0, y: 0.1, z: 0})], [TB.pull + 0.22, pull1, easeIn], [TB.pullEnd - 0.1, pull1],
    [TB.pullEnd + 0.05, add3(lerp3(pull1, push2, 0.5), {x: 0, y: 0.12, z: 0})], [TB.push + 0.08, push2, easeIn],
    [TB.knee + 0.25, push2], [TB.knee + 0.55, onB(R1, HD, 0.45, 0.4, 0.62)], [TB.rebar, REBAR.grip, easeIn],
    [TB.release, add3(REBAR.grip, {x: 0, y: 0.1, z: 0})], [TB.stood, onB(R1, HD, 0.16, 0.36, 0.86)],
  ], T);
  const flex = rebarFlex(T);
  const handRf = T > TB.rebar - 0.05 && T < TB.release + 0.1 ? add3(handR, mul3(REBAR_PULL, 0.06 * flex)) : handR;
  // the left (plate) arm: forearm dragged along, a palm planted for the push, then onto the left knee, then held in
  const elbowL = onG(R0, HD, 0.78, -0.3, 0.05);
  const palmL1 = onG(R0, HD, 1.05, -0.3, 0.035);
  const palmL2 = onG(lerp3(R0, R1, 0.43), HD, 0.8, -0.28, 0.035);
  const kneeL = (k: V3) => add3(k, {x: 0, y: 0.06, z: 0});
  const footLfwd = onG(R1, HD, 0.32, -0.16, 0.02);
  const kneeLpt = onB(footLfwd, HD, 0.02, 0, 0.5);
  const handL = keyV([
    [9.3, elbowL], [TB.pull + 0.1, elbowL], [TB.pull + 0.3, add3(palmL1, {x: 0, y: 0.08, z: 0})], [TB.pull + 0.45, palmL1, easeIn],
    [TB.pullEnd, palmL1], [TB.push + 0.05, add3(palmL2, {x: 0, y: 0.1, z: 0})], [TB.push + 0.2, palmL2, easeIn],
    [TB.knee + 0.1, palmL2], [TB.kneel - 0.1, kneeL(kneeLpt)], [TB.rise, kneeL(onB(footLfwd, HD, 0.04, 0, 0.56))],
    [TB.step, onB(R1, HD, 0.26, -0.24, 1.0)], [TB.stood, onB(R1, HD, 0.22, -0.26, 1.02)],
  ], T);
  // feet: dragging behind (toes in the rubble), the left foot comes forward under him, the right knee goes down,
  // the right foot steps up beside the left
  const fL0 = onG(R0, HD, -0.56, -0.13, 0.08), fR0 = onG(R0, HD, -0.58, 0.13, 0.08);
  const footL = keyV([
    [TB.pull, fL0], [TB.pullEnd - 0.1, onG(lerp3(R0, R1, 0.41), HD, -0.58, -0.13, 0.07), easeOut], [TB.push, onG(lerp3(R0, R1, 0.43), HD, -0.58, -0.13, 0.07)], [TB.chestUp, onG(lerp3(R0, R1, 0.73), HD, -0.6, -0.13, 0.06), easeOut],
    [TB.knee - 0.15, onG(R1, HD, -0.2, -0.15, 0.08)], [TB.knee, onG(R1, HD, 0.06, -0.15, 0.03)],
    [TB.knee + 0.3, onG(R1, HD, 0.06, -0.15, 0.03)], [TB.kneel, footLfwd, easeOut], [TB.step, footLfwd],
    [TB.stood, onG(R1, HD, 0.22, -0.17, 0.02)],
  ], T);
  const footR = keyV([
    [TB.pull, fR0], [TB.pullEnd - 0.1, onG(lerp3(R0, R1, 0.41), HD, -0.6, 0.13, 0.07), easeOut], [TB.push, onG(lerp3(R0, R1, 0.43), HD, -0.6, 0.13, 0.07)], [TB.chestUp, onG(lerp3(R0, R1, 0.73), HD, -0.62, 0.14, 0.08), easeOut],
    [TB.knee, onG(R1, HD, -0.55, 0.14, 0.09)], [TB.kneel, onG(R1, HD, -0.46, 0.15, 0.1)], [TB.rise, onG(R1, HD, -0.42, 0.16, 0.08)],
    [TB.rise + 0.2, onG(R1, HD, -0.36, 0.16, 0.16)], [TB.step, onG(R1, HD, -0.02, 0.19, 0.02), easeIn], [TB.stood, onG(R1, HD, -0.06, 0.19, 0.02)],
  ], T);
  // planted palms: the wrist bends so the palm lies on the rubble, fingers forward and a little out
  const liftK = (a: number, b: number) => (T > a && T < b ? Math.sin(Math.PI * (T - a) / (b - a)) : 0);
  const plantR = (T < TB.slap ? smooth((T - (TB.lift - 0.3)) / 0.5) * (1 - 0.4 * smooth((T - TB.lift) / 0.2)) + 0.4 * smooth((T - (TB.slap - 0.12)) / 0.12) : T < TB.knee + 0.3 ? 1 : 1 - smooth((T - (TB.knee + 0.3)) / 0.25)) * (1 - 0.7 * liftK(TB.pull - 0.04, TB.pull + 0.22) - 0.7 * liftK(TB.pullEnd - 0.1, TB.push + 0.08));
  const plantL = T < TB.pull + 0.3 ? 0.5 : T < TB.knee + 0.2 ? smooth((T - (TB.pull + 0.3)) / 0.25) : 1 - smooth((T - (TB.knee + 0.2)) / 0.3);
  const orientR = {fingers: add3(mul3(F, 0.9), mul3(Rt, 0.35)), palm: palmDown, w: clamp(plantR)};
  const orientL = {fingers: add3(mul3(F, 0.9), mul3(Rt, -0.35)), palm: palmDown, w: clamp(plantL)};
  // breath, effort
  const pose: Pose = {
    ...pose0,
    bodyPitch: (pose0.bodyPitch ?? 0) - slopeDeg * lying,
    handR: T < TB.slideOut ? 'reach' : T < TB.slap + 0.8 ? 'open' : T < TB.knee + 0.3 ? 'brace' : pose0.handR,
    breath: T < TB.pull ? 0.45 : 0.55,
    ...(T > TB.stood - 0.3 ? {armL: {local: {r: -40, u: 196, f: 46}, pole: {r: -1, u: -0.4, f: -0.3}, w: smooth((T - TB.stood + 0.3) / 0.5)}} : {}),
  };
  // B1: the head lifts a fraction as he gathers himself (a breath), the fingers press
  // B1: face down in the rubble under the slab; on the strain he lifts it (a breath), ready to drag himself out
  if (T < TB.pull) {
    pose.head = {pitch: lerp(10, -36, smooth((T - TB.strain) / 0.5)) + 3 * Math.sin(T * 2.2), yaw: 14};
    const wake = smooth((T - 9.75) / 0.5);
    pose.face = {lid: lerp(1, 0.35, wake), mouth: T > TB.slap - 0.05 && T < TB.slap + 0.5 ? 'grit' : 'pant', open: 0.3, brows: lerp(0.1, -0.5, smooth((T - TB.lift) / 0.3)), worry: 0.5, lookX: 0.6 * wake, lookY: 0.4 * wake};
  }
  const world: WorldTargets = {handR: handRf, handL, footL, footR, orientR, orientL};
  if (T > TB.stood) { world.handL = undefined; world.handR = undefined; world.orientL = undefined; world.orientR = undefined; }
  return {pos, heading: HD, pose: T > TB.stood ? layer(pose, ARM_R_HANG) : pose, world, palmR: slapP, palmL: palmL1, reach: T > TB.knee - 0.2};
};

// ---- B3: two steps down from R1 to the brink (STAND), heading turning to due east
const steps = (T: number): DirB => {
  const h = lerp(HD, STAND_HEADING, smooth((T - TB.step1) / 1.0));
  const fL1 = onG(R1, HD, 0.22, -0.17, 0.02), fR1 = onG(R1, HD, -0.06, 0.19, 0.02);
  const fR2 = onG(STAND, STAND_HEADING, -0.12, 0.17, 0.02), fL2 = onG(STAND, STAND_HEADING, 0.24, -0.16, 0.02);
  // anticipation: weight onto the left foot, then the right steps down past it; then the left steps down ahead
  const footR = keyV([[TB.step1, fR1], [TB.step1 + 0.22, add3(lerp3(fR1, fR2, 0.5), {x: 0, y: 0.14, z: 0}), easeOut], [TB.step1End, fR2, easeIn]], T);
  const footL = keyV([[TB.step2, fL1], [TB.step2 + 0.24, add3(lerp3(fL1, fL2, 0.5), {x: 0, y: 0.13, z: 0}), easeOut], [TB.step2End, fL2, easeIn]], T);
  const root = keyV([[TB.step1 - 0.2, R1], [TB.step1, onG(R1, HD, 0.03, -0.06)], [TB.step1End + 0.05, lerp3(R1, STAND, 0.55)], [TB.step2End + 0.08, STAND], [TB.settle, STAND]], T);
  const pos = {...root, y: groundH(root.x, root.z)};
  const dip = 10 * Math.sin(Math.PI * clamp((T - TB.step1) / (TB.step1End - TB.step1 + 0.05))) + 9 * Math.sin(Math.PI * clamp((T - TB.step2) / (TB.step2End - TB.step2 + 0.08)));
  const pose: Pose = {
    drop: 16 + dip, lean: 8, side: keyN([[TB.step1 - 0.2, 0], [TB.step1, -4], [TB.step1End, 3], [TB.step2End, -2], [TB.settle, 0]], T),
    head: {pitch: 12 - 4 * smooth((T - TB.step2End) / 0.3), yaw: 0}, ...ARM_IN, ...ARM_R_HANG,
    armR: {local: {r: 80, u: 168 + 20 * Math.sin(Math.PI * clamp((T - TB.step1) / 1.0)), f: 26}},
    handL: 'fist', handR: 'relaxed', face: {mouth: 'pant', brows: -0.3, worry: 0.2}, breath: 0.6,
  };
  return {pos, heading: h, pose, world: {footL, footR}};
};

// ---- standing on the brink (B3 after the steps, B4, B6): braced on the slope, breathing; the plate arm at the ready
export const STAND_FEET = {L: onG(STAND, STAND_HEADING, 0.24, -0.16, 0.02), R: onG(STAND, STAND_HEADING, -0.12, 0.17, 0.02)};
const standing = (T: number): DirB => {
  const ready = smooth((T - TB.ready) / 0.8); // after the strap: the plate comes up to a low guard
  const h1 = smooth((T - M.H1) / 0.25) * (1 - smooth((T - M.H1 - 1.6) / 1.0)); // the army's step: he tenses
  const sway = noise(T * 0.4, 11) * 1.2;
  const pose: Pose = {
    drop: 16 + 4 * h1 + 3 * ready, lean: 7 + 2 * h1, side: sway, twist: -6 * ready,
    head: {pitch: lerp(8, 2, ready) - 6 * h1, yaw: 0},
    armL: {local: {r: lerp(-40, -28, ready), u: lerp(196, 232, ready), f: lerp(46, 78, ready)}, pole: {r: -1, u: -0.4, f: -0.3}},
    armR: {local: {r: 74, u: 150 + 6 * h1, f: 18 + 6 * ready}},
    handL: 'fist', handR: h1 > 0.5 ? 'fist' : 'relaxed',
    face: {mouth: h1 > 0.3 ? 'flat' : 'pant', brows: -0.3 - 0.4 * h1 - 0.2 * ready, worry: 0.2 * (1 - ready), squint: 0.2 * ready},
    breath: lerp(0.6, 0.42, smooth((T - 20) / 8)),
  };
  return {pos: STAND, heading: STAND_HEADING, pose, world: {footL: STAND_FEET.L, footR: STAND_FEET.R}};
};

// ---- B5: he looks down at the left arm and pulls the plate's strap tight with his teeth and the right hand
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
    armR: {local: {r: lerp(74, lerp(10, 44, tug), up), u: lerp(150, lerp(248, 214, tug), up), f: lerp(18, 74, up)}, pole: {r: 1, u: -0.5, f: -0.2}},
    handR: up > 0.4 ? 'grip' : 'relaxed', handL: 'fist',
    head: {pitch: lerp(4, 30, look) - 10 * tug * bite, yaw: lerp(0, -32, look) + 16 * tug * bite, roll: 6 * tug * bite},
    lean: (base.pose.lean ?? 7) + 4 * bite,
    face: {mouth: bite > 0.4 ? 'grit' : look > 0.5 ? 'flat' : 'pant', brows: -0.5 - 0.4 * bite, squint: 0.5 * bite, lookY: 0.7 * look, lookX: -0.5 * look},
  };
  return {...base, pose};
};

/** For section C: where and how he stands at the end of B (35.80). */
export const DIRECTOR_B_END = {pos: STAND, heading: STAND_HEADING, feet: STAND_FEET};
void [easeIn, easeOut, PLAN];
