// R2 pose library. Poses are body-local (Loc = r right, u up from the ground, f forward; rig units at s = 1: the
// figure is 440 tall, pelvis at u 165, shoulders at u ≈ 292, hands hang at u ≈ 130) so they read the same from any
// camera. Contacts with the world (palms on rubble, a hand on a shoulder, a grip on a machine) are given as world
// targets through the sprite layer instead. Actions are keyed sequences — anticipation → action → contact → reaction
// → recovery — sampled with keyPose().
import {FigProps, Loc, ArmT, LegT, Face} from './figure';
import {HandShape} from './hands';
import {lerp, clamp, smooth, easeOut, easeIn, Ease} from '../../kit/math';

export type Pose = Partial<FigProps>;

const lerpLoc = (a: Loc | undefined, b: Loc | undefined, k: number): Loc | undefined =>
  a && b ? {r: lerp(a.r, b.r, k), u: lerp(a.u, b.u, k), f: lerp(a.f, b.f, k)} : k < 0.5 ? a : b;
const lerpN = (a: number | undefined, b: number | undefined, k: number, d = 0) => lerp(a ?? d, b ?? d, k);
const lerpArm = (a: ArmT | undefined, b: ArmT | undefined, k: number): ArmT | undefined => {
  if (!a && !b) return undefined;
  const A = a ?? {}, B = b ?? {};
  const fk = A.fk || B.fk ? {fwd: lerpN(A.fk?.fwd, B.fk?.fwd, k, 4), out: lerpN(A.fk?.out, B.fk?.out, k, 8), bend: lerpN(A.fk?.bend, B.fk?.bend, k, 14)} : undefined;
  // local targets: if only one side has a target, fade its weight
  let local = lerpLoc(A.local, B.local, k), w = lerpN(A.w ?? (A.local ? 1 : 0), B.w ?? (B.local ? 1 : 0), k);
  if (!A.local && B.local) local = B.local;
  if (A.local && !B.local) local = A.local;
  return {fk, local, w, pole: lerpLoc(A.pole, B.pole, k) ?? A.pole ?? B.pole, palm: lerpLoc(A.palm, B.palm, k) ?? A.palm ?? B.palm};
};
const lerpLeg = (a: LegT | undefined, b: LegT | undefined, k: number): LegT | undefined => {
  if (!a && !b) return undefined;
  const A = a ?? {}, B = b ?? {};
  const fk = A.fk || B.fk ? {fwd: lerpN(A.fk?.fwd, B.fk?.fwd, k, 0), knee: lerpN(A.fk?.knee, B.fk?.knee, k, 0)} : undefined;
  let local = lerpLoc(A.local, B.local, k), w = lerpN(A.w ?? (A.local ? 1 : 0), B.w ?? (B.local ? 1 : 0), k);
  if (!A.local && B.local) local = B.local;
  if (A.local && !B.local) local = A.local;
  return {fk, local, w, pitch: lerpN(A.pitch, B.pitch, k), pole: lerpLoc(A.pole, B.pole, k) ?? A.pole ?? B.pole};
};
const lerpFace = (a: Face | undefined, b: Face | undefined, k: number): Face | undefined => {
  if (!a && !b) return undefined;
  const A = a ?? {}, B = b ?? {};
  return {
    ...(k < 0.5 ? A : B),
    brows: lerpN(A.brows, B.brows, k), worry: lerpN(A.worry, B.worry, k), open: lerpN(A.open, B.open, k),
    lid: lerpN(A.lid, B.lid, k), lids: lerpN(A.lids, B.lids, k), squint: lerpN(A.squint, B.squint, k),
    lookX: lerpN(A.lookX, B.lookX, k), lookY: lerpN(A.lookY, B.lookY, k), unfocus: lerpN(A.unfocus, B.unfocus, k),
  };
};

/** Blend two poses (numbers and targets interpolate; hand shapes and mouths switch at the middle). */
export const blendPose = (a: Pose, b: Pose, k: number): Pose => ({
  ...(k < 0.5 ? a : b),
  drop: lerpN(a.drop, b.drop, k), lean: lerpN(a.lean, b.lean, k), side: lerpN(a.side, b.side, k), twist: lerpN(a.twist, b.twist, k),
  bodyPitch: lerpN(a.bodyPitch, b.bodyPitch, k), bodyRoll: lerpN(a.bodyRoll, b.bodyRoll, k),
  yaw: lerpN(a.yaw, b.yaw, k),
  pelvis: a.pelvis || b.pelvis ? {r: lerpN(a.pelvis?.r, b.pelvis?.r, k), u: lerpN(a.pelvis?.u, b.pelvis?.u, k), f: lerpN(a.pelvis?.f, b.pelvis?.f, k)} : undefined,
  bodyPivot: lerpLoc(a.bodyPivot, b.bodyPivot, k),
  head: a.head || b.head ? {yaw: lerpN(a.head?.yaw, b.head?.yaw, k), pitch: lerpN(a.head?.pitch, b.head?.pitch, k), roll: lerpN(a.head?.roll, b.head?.roll, k)} : undefined,
  armL: lerpArm(a.armL, b.armL, k), armR: lerpArm(a.armR, b.armR, k), legL: lerpLeg(a.legL, b.legL, k), legR: lerpLeg(a.legR, b.legR, k),
  face: lerpFace(a.face, b.face, k),
  breath: lerpN(a.breath, b.breath, k, 0.15),
});

export type Key = [number, Pose, Ease?];
/** Sample a keyed pose sequence at t (the segment arriving at a key uses that key's ease, default smooth). */
export const keyPose = (keys: Key[], t: number): Pose => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const e = keys[i][2] ?? smooth;
      return blendPose(keys[i - 1][1], keys[i][1], e((t - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0])));
    }
  }
  return keys[keys.length - 1][1];
};
/** Merge pose layers (later wins; arms/legs/face merged field by field). */
export const layer = (...ps: Pose[]): Pose => ps.reduce((acc, p) => ({...acc, ...p, face: {...acc.face, ...p.face}, head: {...acc.head, ...p.head}}), {} as Pose);

// ------------------------------------------------------------------ named poses
export const STAND: Pose = {drop: 0, lean: 2, armL: {fk: {fwd: 4, out: 8, bend: 14}}, armR: {fk: {fwd: 4, out: 8, bend: 14}}, handL: 'relaxed', handR: 'relaxed', breath: 0.15};

/** Wide braced stance, knees bent, fists up (ready to fight). */
export const BRACED = (o: {wide?: number; fists?: boolean} = {}): Pose => ({
  drop: 26, lean: 10,
  legL: {local: {r: -62 * (o.wide ?? 1), u: 10, f: 42}}, legR: {local: {r: 62 * (o.wide ?? 1), u: 10, f: -46}},
  armL: {local: {r: -18, u: 280, f: 110}, pole: {r: -1, u: -0.4, f: -0.2}}, armR: {local: {r: 52, u: 250, f: 70}, pole: {r: 1, u: -0.5, f: -0.3}},
  handL: o.fists === false ? 'open' : 'fist', handR: o.fists === false ? 'open' : 'fist',
  face: {mouth: 'grit', brows: -0.5},
  breath: 0.4,
});
export const CROUCH: Pose = {drop: 72, lean: 30, legL: {local: {r: -42, u: 10, f: 44}}, legR: {local: {r: 46, u: 12, f: -40}, pitch: -30}, armL: {local: {r: -40, u: 150, f: 118}}, armR: {local: {r: 70, u: 112, f: 62}}, handL: 'brace', handR: 'fist', head: {pitch: -16}};
/** Kneel on one knee (side: which knee is down). */
export const KNEEL = (down: 'L' | 'R' = 'R'): Pose => {
  const d = down === 'R' ? 1 : -1;
  return {
    drop: 84, lean: 6,
    legL: d > 0 ? {local: {r: -36, u: 10, f: 72}} : {local: {r: -36, u: 34, f: -72}, pitch: -50},
    legR: d > 0 ? {local: {r: 36, u: 34, f: -72}, pitch: -50} : {local: {r: 36, u: 10, f: 72}},
    armL: {local: {r: -34, u: 116, f: 92}}, armR: {local: {r: 62, u: 130, f: 30}},
    handL: 'relaxed', handR: 'relaxed',
  };
};

// ---- the Director with the plate (left forearm)
/** High block: forearm across the face, plate facing forward. */
export const BLOCK_HIGH: Pose = {
  drop: 22, lean: 8, twist: -12,
  legL: {local: {r: -50, u: 10, f: 50}}, legR: {local: {r: 58, u: 10, f: -50}},
  armL: {local: {r: 34, u: 338, f: 82}, pole: {r: -1, u: -0.15, f: 0.2}, palm: {r: 0.1, u: 0, f: -1}},
  armR: {local: {r: 64, u: 240, f: 60}},
  handL: 'fist', handR: 'fist', head: {pitch: 6}, face: {mouth: 'grit', brows: -0.7, squint: 0.4},
};
/** Mid block: forearm vertical in front of the chest. */
export const BLOCK_MID: Pose = {
  ...BLOCK_HIGH,
  armL: {local: {r: 10, u: 300, f: 100}, pole: {r: -1, u: -0.6, f: 0}, palm: {r: 0.3, u: 0, f: -1}},
};
/** Shield bash: plate driven forward, weight onto the front foot. */
export const BASH = (k: number): Pose => blendPose(
  {...BLOCK_MID, lean: 4, drop: 24},
  {drop: 30, lean: 22, twist: -24, legL: {local: {r: -40, u: 10, f: 96}}, legR: {local: {r: 56, u: 10, f: -70}, pitch: -20},
    armL: {local: {r: -4, u: 286, f: 168}, pole: {r: -1, u: -0.5, f: 0}, palm: {r: 0.2, u: 0, f: -1}}, armR: {local: {r: 70, u: 230, f: -20}},
    handL: 'fist', handR: 'fist', face: {mouth: 'grit', brows: -0.9}},
  clamp(k),
);
/** Shoulder charge, plate tucked in front of the left shoulder. */
export const CHARGE_POSE: Pose = {
  drop: 34, lean: 30, twist: -30,
  armL: {local: {r: -6, u: 280, f: 110}, pole: {r: -1, u: -0.3, f: 0}, palm: {r: 0.3, u: 0, f: -1}}, armR: {local: {r: 58, u: 200, f: -50}},
  handL: 'fist', handR: 'fist', face: {mouth: 'grit', brows: -1},
};

// ---- honest's breaker: overhead swing (two hands on the tool: right = rear trigger handle, left = front handle)
export const SWING_BREAKER = (k: number): Pose => {
  // 0 ready → 0.35 wind-up high behind the head → 0.55 strike down/forward (contact) → 0.75 recoil → 1 recover
  const ready: Pose = {drop: 20, lean: 8, armR: {local: {r: 30, u: 230, f: 40}}, armL: {local: {r: -14, u: 240, f: 120}}, handL: 'grip', handR: 'grip', twoHanded: true, legL: {local: {r: -50, u: 10, f: 46}}, legR: {local: {r: 56, u: 10, f: -46}}};
  const wind: Pose = {drop: 12, lean: -16, twist: 18, armR: {local: {r: 24, u: 380, f: -60}}, armL: {local: {r: -6, u: 420, f: 10}}, handL: 'grip', handR: 'grip', twoHanded: true, face: {mouth: 'grit', brows: -0.8}, legL: {local: {r: -52, u: 10, f: 56}}, legR: {local: {r: 58, u: 10, f: -54}}};
  const strike: Pose = {drop: 46, lean: 36, twist: -8, armR: {local: {r: 26, u: 236, f: 92}}, armL: {local: {r: -10, u: 190, f: 176}}, handL: 'grip', handR: 'grip', twoHanded: true, face: {mouth: 'grit', brows: -1}, legL: {local: {r: -50, u: 10, f: 84}}, legR: {local: {r: 58, u: 10, f: -62}}};
  const recoil: Pose = {...strike, drop: 40, lean: 26, armL: {local: {r: -10, u: 214, f: 150}}, armR: {local: {r: 26, u: 250, f: 70}}};
  return keyPose([[0, ready], [0.35, wind, easeOut], [0.55, strike, easeIn], [0.75, recoil, easeOut], [1, ready]], k);
};

// ---- clerkA's tether launcher (right hand), left hand steadies the right wrist
export const AIM: Pose = {drop: 18, lean: 6, twist: 14, armR: {local: {r: 36, u: 300, f: 168}, pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}, armL: {local: {r: 18, u: 286, f: 128}, palm: {r: 1, u: 0.3, f: 0}}, handR: 'grip', handL: 'brace', head: {pitch: -2}, face: {squint: 0.6, mouth: 'flat', brows: -0.5}, legL: {local: {r: -50, u: 10, f: 50}}, legR: {local: {r: 54, u: 10, f: -44}}};
export const FIRE_RECOIL = (k: number): Pose => blendPose(AIM, {...AIM, lean: -4, armR: {local: {r: 40, u: 316, f: 140}, pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}}, k < 0.3 ? easeOut(k / 0.3) : 1 - smooth((k - 0.3) / 0.7));

// ---- clerkB sketches on the tablet (left hand holds it, right index finger draws)
export const SKETCH = (t: number, speed = 1): Pose => ({
  drop: 6, lean: 12,
  // tablet held at the chest (below the chin, so the face reads over it), the right hand drawing on it
  armL: {local: {r: -30, u: 212, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}},
  armR: {local: {r: 4 + 10 * Math.sin(t * 5 * speed), u: 222 + 8 * Math.sin(t * 7.3 * speed), f: 104}, palm: {r: -0.3, u: -0.4, f: -1}},
  handL: 'grip', handR: 'point', head: {pitch: 24, yaw: -4}, face: {mouth: 'flat', brows: -0.4, lookY: 0.8},
});

// ---- host throws (flare / canister) with the right hand
export const THROW = (k: number): Pose => {
  const a: Pose = {drop: 14, lean: 4, armR: {local: {r: 56, u: 250, f: 40}}, armL: {local: {r: -50, u: 220, f: 60}}, handR: 'grip', handL: 'open', legL: {local: {r: -44, u: 10, f: 40}}, legR: {local: {r: 50, u: 10, f: -40}}};
  const wind: Pose = {drop: 18, lean: -12, twist: 28, armR: {local: {r: 70, u: 350, f: -80}, pole: {r: 1, u: -0.4, f: -0.2}}, armL: {local: {r: -40, u: 290, f: 120}}, handR: 'grip', handL: 'open', legL: {local: {r: -50, u: 10, f: 56}}, legR: {local: {r: 52, u: 10, f: -56}}};
  const rel: Pose = {drop: 26, lean: 26, twist: -26, armR: {local: {r: 14, u: 320, f: 150}}, armL: {local: {r: -60, u: 200, f: -20}}, handR: 'open', handL: 'fist', legL: {local: {r: -50, u: 10, f: 70}}, legR: {local: {r: 52, u: 24, f: -60}, pitch: -30}};
  const fol: Pose = {...rel, drop: 30, lean: 30, armR: {local: {r: -14, u: 200, f: 110}}};
  return keyPose([[0, a], [0.4, wind], [0.62, rel, easeIn], [0.8, fol], [1, a]], k);
};

// ---- guesser prys with the halligan (two hands, levering down)
export const PRY = (k: number): Pose => blendPose(
  {drop: 60, lean: 34, armR: {local: {r: 30, u: 250, f: 70}}, armL: {local: {r: -10, u: 150, f: 120}}, handL: 'grip', handR: 'grip', twoHanded: true, legL: {local: {r: -50, u: 10, f: 60}}, legR: {local: {r: 56, u: 10, f: -40}}, face: {mouth: 'grit', brows: -0.7}},
  {drop: 76, lean: 44, armR: {local: {r: 30, u: 170, f: 110}}, armL: {local: {r: -10, u: 170, f: 140}}, handL: 'grip', handR: 'grip', twoHanded: true, legL: {local: {r: -50, u: 10, f: 60}}, legR: {local: {r: 56, u: 10, f: -40}}, face: {mouth: 'grit', brows: -1}},
  k,
);

// ---- hits and falls
/** Knocked backward (k 0 → 1: impact, stagger, fall onto the back). */
export const KNOCKED_BACK = (k: number): Pose => {
  const hit: Pose = {drop: 10, lean: -24, bodyPitch: 0, armL: {fk: {fwd: 60, out: 30, bend: 30}}, armR: {fk: {fwd: 70, out: 40, bend: 20}}, handL: 'open', handR: 'open', head: {pitch: -20}, face: {mouth: 'pain', brows: 0.6, lids: 0.3}};
  const tip: Pose = {drop: 30, lean: -20, bodyPitch: -30, legL: {fk: {fwd: 30, knee: 30}}, legR: {fk: {fwd: 10, knee: 20}}, armL: {fk: {fwd: 110, out: 50, bend: 20}}, armR: {fk: {fwd: 100, out: 60, bend: 20}}, handL: 'open', handR: 'open', head: {pitch: -10}, face: {mouth: 'pain', brows: 0.6}};
  const down: Pose = {drop: 146, lean: 0, bodyPitch: -86, legL: {fk: {fwd: 20, knee: 30}}, legR: {fk: {fwd: 6, knee: 10}}, armL: {fk: {fwd: 140, out: 60, bend: 20}}, armR: {fk: {fwd: 100, out: 70, bend: 30}}, handL: 'open', handR: 'limp', head: {pitch: -6, roll: 8}, face: {mouth: 'pain', lids: 0.5}};
  return keyPose([[0, STAND], [0.15, hit, easeOut], [0.5, tip], [1, down, easeIn]], k);
};
/** Lying on the back (pelvis on the ground). */
export const LYING_BACK: Pose = {drop: 146, bodyPitch: -86, legL: {fk: {fwd: 14, knee: 16}}, legR: {fk: {fwd: 4, knee: 6}}, armL: {fk: {fwd: 30, out: 50, bend: 20}}, armR: {fk: {fwd: 20, out: 40, bend: 30}}, handL: 'limp', handR: 'limp', head: {roll: 12}};
/** Sitting slumped against a wall/slab behind (lean back into it), legs out. */
export const SLUMP = (o: {lean?: number; headRoll?: number} = {}): Pose => ({
  drop: 128, lean: 0, bodyPitch: -(o.lean ?? 24),
  legL: {local: {r: -40, u: 12, f: 150}, pole: {r: -0.3, u: 1, f: 0.4}}, legR: {local: {r: 52, u: 12, f: 128}, pole: {r: 0.3, u: 1, f: 0.4}},
  armL: {local: {r: -20, u: 100, f: 72}, pole: {r: -1, u: 0, f: -0.4}}, armR: {local: {r: 70, u: 46, f: 40}},
  handL: 'limp', handR: 'limp', head: {pitch: 14, roll: o.headRoll ?? 16}, face: {mouth: 'breath', lids: 0.35},
  breath: 0.3,
});
/** Hand on another's shoulder: the reaching arm's world target is supplied by the shot; this is the body. */
export const REACH_SHOULDER: Pose = {drop: 4, lean: 6, armR: {local: {r: 40, u: 300, f: 120}, palm: {r: 0, u: -1, f: 0.3}}, handR: 'brace'};
/** Catch: a braced body ready to take a falling person's weight (hands placed by world targets on the faller's back). */
export const CATCH_BODY: Pose = {drop: 40, lean: 14, legL: {local: {r: -60, u: 10, f: 50}}, legR: {local: {r: 64, u: 10, f: -60}, pitch: -10}, handL: 'brace', handR: 'brace', face: {mouth: 'grit', brows: -0.5}};

// ---- the rise from the rubble (proof 1). Time in seconds from the first solo note (0 … ~7.4).
// Hand and foot CONTACTS are world targets (from the shot); these keys shape the body between them.
export const RISE_KEYS: Key[] = [
  // prone, face down, half buried: head lifting, right palm reaching to brace
  [0.0, {drop: 150, bodyPitch: 84, lean: 0, head: {pitch: -46}, legL: {fk: {fwd: 4, knee: 6}}, legR: {fk: {fwd: -4, knee: 10}}, handL: 'relaxed', handR: 'brace', face: {lids: 0.55, mouth: 'pant', brows: 0.3, worry: 0.4}}],
  // the push: arms straighten, chest rises off the rubble
  [1.3, {drop: 128, bodyPitch: 58, lean: -6, head: {pitch: -34}, legL: {fk: {fwd: 6, knee: 14}}, legR: {fk: {fwd: 0, knee: 18}}, handL: 'brace', handR: 'brace', face: {lids: 0.3, mouth: 'grit', brows: -0.4}}, easeOut],
  // a knee under him (left knee forward under the hips)
  [2.6, {drop: 104, bodyPitch: 30, lean: 4, head: {pitch: -18}, legL: {fk: {fwd: 82, knee: 118}}, legR: {fk: {fwd: 0, knee: 30}}, handL: 'brace', handR: 'brace', face: {lids: 0.2, mouth: 'pant', brows: -0.3}}],
  // kneeling on the right knee, left foot planted forward, torso coming up, right hand to the left knee
  [3.8, {drop: 86, bodyPitch: 8, lean: 22, head: {pitch: -8}, handL: 'fist', handR: 'brace', face: {lids: 0.1, mouth: 'grit', brows: -0.6}}],
  // weight onto the front foot, pushing on the knee: the pelvis rises
  [5.0, {drop: 40, bodyPitch: 0, lean: 26, head: {pitch: -4}, handL: 'fist', handR: 'brace', face: {mouth: 'grit', brows: -0.8}}, easeOut],
  // staggered stand: a half step to catch the balance, the injured left arm (plate) held in
  [6.2, {drop: 12, bodyPitch: 0, lean: 8, side: 4, head: {pitch: 4, roll: -4}, handL: 'fist', handR: 'open', face: {mouth: 'pant', brows: 0.1, worry: 0.3}}],
  // braced, breathing
  [7.2, {drop: 16, bodyPitch: 0, lean: 6, head: {pitch: 0}, handL: 'fist', handR: 'fist', face: {mouth: 'pant', brows: -0.3}, breath: 0.55}],
];

export const HANDS: HandShape[] = ['relaxed', 'fist', 'open', 'grip', 'brace', 'reach', 'point', 'limp'];
void lerp;
