import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import {blink as blinkFn, rand} from '../../lib/anim';
import {E, SOFT, drift, sp} from '../../lib/motion';
import {handPos, reachLocal, type Arm, type Hair, type Look, type Mouth, type Pose} from '../Character';
import {projectWith, type HiddenTest, type ViewState} from '../../lib/room';

/**
 * Cast2: the Video 01 cutout rig (components/Character.tsx) extended for Video 02, with the SAME identities: heads,
 * hair, faces, outfits, colours and the 4 px ink line are copied from Character.tsx unchanged. What is new:
 *
 *  - LEGS that move. Each leg is a two-segment leg (thigh + shin, same pants and shoes) solved from a FOOT TARGET on
 *    the floor, so feet stay planted while the body sinks, shifts or leans. Legs can also be posed directly by angle
 *    (`legL`/`legR`, hip angle + knee bend). The gait helpers (`walkPose`, `tripPose`) give a frontal/3-4 cutout walk
 *    and a TIPTOE sneak whose feet never slide: the cycle phase is computed from the distance travelled.
 *  - `sink` (crouch: knees bend, feet stay put), `hunch` (shoulders and head come down), `shift` (weight shift over
 *    planted feet), `peek` (head and shoulders lean out sideways, as if looking round a corner).
 *  - Face options: `lid` (upper eyelids: half-lidded smug / deadpan), `eyes` (eye size: wide = busted), `pupil`
 *    (pupil size), `sweat` (a single sweat drop).
 *  - Pose presets (HANDS_ON_HIPS, ARMS_CROSSED, HAND_OVER_MOUTH, SNEAK_ARMS, HANDS_UP) in the existing Arm convention,
 *    expression presets (EXPR.smug / busted / deadpan), CROUCH, SETTLE / settleAt, handsOnKnees(pose).
 *  - World helpers that follow the body transform: handWorld2, reach2, reachGround, kneeWorld, mouthWorld, eyesWorld.
 *    Give the RigPlace the rig's frame/seed/life and they include the idle drift too (exact contacts).
 *  - Trip helpers: planTrip → tripDistance (timing) → tripPose (feet), tripDuration, tripContacts (footstep cue frames).
 *  - `bob` lifts the body (hops); the floor shadow stays on the floor. `frontTop` picks which front arm is on top.
 *
 * <Character2> accepts every prop of <Character> (look, pose, frame, seed, x, y, scale, flip, front, pass, holdL,
 * holdR, shadow, style, life, eyeDarts) and a plain Pose renders identically (legs straight, same geometry), so it is
 * a drop-in replacement. Ground point is (0, 0); the figure stands about 440 px tall at scale 1.
 *
 * Determinism: everything is a pure function of the props (`frame` drives blink, talk and idle life via seeded
 * functions). No Math.random, no clock.
 */

/* ------------------------------------------------------------------ types */

/** A leg posed by angle (forward kinematics). Character-local, deg.
 *  a: thigh angle from straight down, in the leg's bend plane (+ = the knee swings toward the bend direction);
 *  b: knee bend (+ = the shin folds back, so the knee points toward the bend direction);
 *  out: the bend direction, -1 (toward screen left) .. 0 (toward the camera, seen end-on: the leg foreshortens) .. +1
 *  (toward screen right). Default +1. */
export type Leg = {a: number; b: number; out?: number};

/** A foot target (inverse kinematics), character-local px. The leg is solved so the ankle sits on the target.
 *  x: ankle x (standing: -33 / +33); lift: px above the floor (0 = planted); pitch: deg, + = heel raised / toe down
 *  in the direction the shoe points; turn: -1..1 which way the shoe points (0 = at the camera, ±1 = 3/4 toward
 *  screen left/right); knee: -1..1 knee direction (default: slightly outward, mostly toward the camera). */
export type Foot = {x: number; lift?: number; pitch?: number; turn?: number; knee?: number};

export type Pose2 = Pose & {
  /** Lowers hips and upper body by px while feet stay planted (knees bend). Crouch ≈ 86. */
  sink?: number;
  /** 0..0.2: shoulders and head come down (a hunch); the torso compresses. */
  hunch?: number;
  /** Weight shift: pelvis and upper body slide sideways (px) over planted feet; the free knee relaxes. */
  shift?: number;
  /** Foot targets (default: standing, ankles at x = ∓33 on the floor). */
  feet?: {L: Foot; R: Foot};
  /** Angle-posed legs; override `feet` for that leg. */
  legL?: Leg;
  legR?: Leg;
  /** -1..1: head and shoulders lean out to the viewer's left (-) or right (+), as if peeking round an edge. */
  peek?: number;
  /** 0..1: upper eyelids lowered over the eye (0.5 = half-lidded, smug). */
  lid?: number;
  /** Eye size multiplier (1 = model; 1.22 = wide, busted). */
  eyes?: number;
  /** Pupil size multiplier (1 = model; 0.65 = pinpoint shock). */
  pupil?: number;
  /** 0..1: a sweat drop at the temple. */
  sweat?: number;
  /** Arms drawn in front of the torso when the `front` prop is not given (a preset can carry it). */
  armsFront?: 'L' | 'R' | 'both' | 'none';
  /** With both arms in front: which one is drawn on top (default 'L'). A prop held in the other hand then sits over
   *  that hand (e.g. the sensor box resting on the supporting palm: frontTop 'R'). */
  frontTop?: 'L' | 'R';
};

/* ------------------------------------------------------------------ geometry (identical to Character.tsx) */

const SHOULDER_Y = -292;
const SHOULDER_X = 66;
const HEAD_Y = -372;
const HEAD_R = 58;
const ARM_W = 30;

// legs: the rest pose reproduces Character.tsx's leg rects (x ±33, y -170..-10, 38 wide) and shoes exactly
const HIP_X = 33;
const HIP_Y = -151;
const ANKLE_Y = -29;
const THIGH = 62;
const SHIN = 60;
const LEG = THIGH + SHIN;
const LEG_W = 38;
const PIVOT_Y = -150; // pelvis line: lean and hunch pivot
const HUNCH_PX = 142; // shoulder height above the pelvis line
const SHOE_DY = 23;
const SHOE_RX = 30;
const SHOE_RY = 13;
const REACH = LEG - 0.05; // stance legs may straighten fully (the rest pose stays exactly Video 01's)
const KNEE_FLOOR = -24; // lowest knee centre (the knee's outline then just touches the floor)

type P = {x: number; y: number};
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (n: number) => Math.round(n * 100) / 100;

/** Standing feet. */
export const STAND_FEET: {L: Foot; R: Foot} = {L: {x: -HIP_X}, R: {x: HIP_X}};

/** Knee direction used when a Foot leaves `knee` unset: slightly outward (side × 0.35), mostly toward the camera. */
export const KNEE_DEFAULT = 0.35;

/* ------------------------------------------------------------------ pose mixing */

// an unset knee means the side's default (not 0), so blending a set knee against an unset one never jumps
const mixFoot = (a: Foot, b: Foot, t: number, side: -1 | 1): Foot => ({
  x: lerp(a.x, b.x, t),
  lift: lerp(a.lift ?? 0, b.lift ?? 0, t),
  pitch: lerp(a.pitch ?? 0, b.pitch ?? 0, t),
  turn: lerp(a.turn ?? 0, b.turn ?? 0, t),
  knee: a.knee === undefined && b.knee === undefined ? undefined : lerp(a.knee ?? side * KNEE_DEFAULT, b.knee ?? side * KNEE_DEFAULT, t),
});

/** Interpolate two Pose2s (arms, face, legs, feet). Mouth, armsFront and FK legs switch at t = 0.5.
 *  Mixing feet from two different places slides them: blend between poses whose planted feet coincide. */
export const mixPose2 = (p: Pose2, q: Pose2, t: number): Pose2 => {
  const m = (a: number | undefined, b: number | undefined, d = 0) => lerp(a ?? d, b ?? d, t);
  const fp = p.feet ?? STAND_FEET;
  const fq = q.feet ?? STAND_FEET;
  return {
    armL: {a: m(p.armL.a, q.armL.a), b: m(p.armL.b, q.armL.b)},
    armR: {a: m(p.armR.a, q.armR.a), b: m(p.armR.b, q.armR.b)},
    lean: m(p.lean, q.lean),
    tilt: m(p.tilt, q.tilt),
    lookX: m(p.lookX, q.lookX),
    lookY: m(p.lookY, q.lookY),
    brows: m(p.brows, q.brows),
    browAsym: m(p.browAsym, q.browAsym),
    mouth: t < 0.5 ? p.mouth : q.mouth,
    bob: m(p.bob, q.bob),
    blink: q.blink ?? p.blink,
    sink: m(p.sink, q.sink),
    hunch: m(p.hunch, q.hunch),
    shift: m(p.shift, q.shift),
    feet: p.feet || q.feet ? {L: mixFoot(fp.L, fq.L, t, -1), R: mixFoot(fp.R, fq.R, t, 1)} : undefined,
    legL: t < 0.5 ? p.legL : q.legL,
    legR: t < 0.5 ? p.legR : q.legR,
    peek: m(p.peek, q.peek),
    lid: m(p.lid, q.lid),
    eyes: m(p.eyes, q.eyes, 1),
    pupil: m(p.pupil, q.pupil, 1),
    sweat: m(p.sweat, q.sweat),
    armsFront: t < 0.5 ? p.armsFront : q.armsFront,
    frontTop: t < 0.5 ? p.frontTop : q.frontTop,
  };
};

/** Lay a partial pose (an expression, an arm preset) over a pose, blended by t (0 = base, 1 = fully applied). */
export const withPose = (base: Pose2, over: Partial<Pose2>, t = 1): Pose2 => (t <= 0 ? base : mixPose2(base, {...base, ...over}, clamp(t, 0, 1)));

/* ------------------------------------------------------------------ presets */

/** Neutral standing pose (Character's IDLE) as a Pose2. */
export const IDLE2: Pose2 = {armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, lean: 0, tilt: 0, lookX: 0, lookY: 0, brows: 0, mouth: 'smile'};

/** Arm presets, solved with the rig's own IK (reachLocal) so hands land on the body where they should. */
export const ARMS = {
  /** Fists on hips, elbows out. */
  handsOnHips: {armL: reachLocal(-78, -168, -1, -1), armR: reachLocal(78, -168, 1, -1)},
  /** Forearms folded across the chest (draw both arms in front: armsFront 'both'). */
  armsCrossed: {armL: reachLocal(30, -218, -1, -1), armR: reachLocal(-30, -230, 1, -1)},
  /** Right hand over the mouth, elbow tucked in front of the chest (draw the right arm in front). */
  handOverMouth: {armL: {a: 10, b: 14}, armR: reachLocal(4, -334, 1, -1)},
  /** Sneaking paws: both hands raised in front of the chest, elbows out (both arms in front). */
  sneak: {armL: reachLocal(-34, -262, -1, -1), armR: reachLocal(34, -262, 1, -1)},
  /** Hands up beside the head (surprise / busted). */
  handsUp: {armL: reachLocal(-118, -410, -1, 1), armR: reachLocal(118, -410, 1, 1)},
} satisfies Record<string, {armL: Arm; armR: Arm}>;

/** Body presets as full Poses (Pose2) in the existing Arm convention. */
export const HANDS_ON_HIPS: Pose2 = {...IDLE2, ...ARMS.handsOnHips, armsFront: 'none'};
export const ARMS_CROSSED: Pose2 = {...IDLE2, ...ARMS.armsCrossed, armsFront: 'both'};
export const HAND_OVER_MOUTH: Pose2 = {...IDLE2, ...ARMS.handOverMouth, armsFront: 'R', mouth: 'flat'};
export const SNEAK_ARMS: Pose2 = {...IDLE2, ...ARMS.sneak, armsFront: 'both'};
export const HANDS_UP: Pose2 = {...IDLE2, ...ARMS.handsUp, armsFront: 'none'};

/** Expression presets (face fields only; lay them over any pose with withPose). */
export const EXPR = {
  /** Guesser: half-lidded, one brow up, smirk, head cocked. */
  smug: {lid: 0.5, eyes: 1, pupil: 1, brows: -0.2, browAsym: 0.6, mouth: 'smirk', tilt: 5, lookX: 0.3, lookY: 0.1},
  /** Guesser caught: wide eyes, pinpoint pupils, brows up, small 'o' mouth, a sweat drop. */
  busted: {lid: 0, eyes: 1.22, pupil: 0.62, brows: 1, browAsym: 0, mouth: 'o', tilt: -3, sweat: 1},
  /** Checker: level gaze straight out, lids a third down, flat mouth, no tilt. */
  deadpan: {lid: 0.36, eyes: 1, pupil: 1, brows: -0.05, browAsym: 0, mouth: 'flat', tilt: 0, lookX: 0, lookY: 0},
} satisfies Record<string, Partial<Pose2>>;

/** CROUCH: hips down 86 px and a hunch (the figure is ~25 % shorter), feet planted where they stand, knees splayed
 *  out to the sides so the bend reads in the frontal view. */
export const CROUCH: Partial<Pose2> = {sink: 86, hunch: 0.12, lookY: 0.15, feet: {L: {x: -HIP_X, knee: -0.88}, R: {x: HIP_X, knee: 0.88}}};

/** SETTLE: weight shifted onto the right leg (contrapposto); mirror with side -1 via settlePose. */
export const SETTLE: Partial<Pose2> = settlePose(1, 1);

/** A weight shift onto `side`'s leg, scaled by `amount` (0..1, may overshoot). The free knee relaxes inward; at
 *  amount 0 the result equals the plain standing pose (so settleAt() can sit in a pose before its cue). */
export function settlePose(amount: number, side: -1 | 1 = 1): Partial<Pose2> {
  const k = amount;
  const kk = clamp(k, 0, 1);
  // the free leg's knee turns from its default (outward) to inward as the weight leaves it
  const freeKnee = (s: -1 | 1) => lerp(s * KNEE_DEFAULT, -s * 0.55, kk);
  const feet = {L: {x: -HIP_X, knee: side === 1 ? freeKnee(-1) : undefined}, R: {x: HIP_X, knee: side === -1 ? freeKnee(1) : undefined}};
  return {shift: side * 13 * k, lean: -side * 1.6 * k, tilt: side * 2 * k, feet};
}

/** The settle as a motion: weight shifts at t0 with a soft overshoot and comes to rest (pose fragment). */
export const settleAt = (g: number, t0: number, side: -1 | 1 = 1, amount = 1): Partial<Pose2> => settlePose(amount * sp(g, t0, SOFT), side);

/* ------------------------------------------------------------------ legs: IK, FK, gait */

/** Ankle raise that keeps the toe of a pitched shoe on the floor. */
const heelRaise = (pitch: number, turn: number) => {
  const r = rad(pitch * Math.abs(turn));
  if (Math.abs(r) < 1e-4) return 0;
  const cx = turn * 8;
  const cy = SHOE_DY;
  const yc = cx * Math.sin(r) + cy * Math.cos(r);
  const ext = Math.hypot(SHOE_RX * Math.sin(r), SHOE_RY * Math.cos(r));
  return Math.max(0, yc + ext - (SHOE_DY + SHOE_RY));
};

/**
 * 2.5-D two-bone leg: hip and ankle on screen, the knee pushed along `kneeDir` (-1 = screen left, 0 = toward the
 * camera, so the leg foreshortens, +1 = screen right). Unreachable targets give a straight leg pointing at them.
 */
export const solveLeg = (hip: P, ankle: P, kneeDir: number): {knee: P; ankle: P} => {
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const d0 = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / d0;
  const uy = dy / d0;
  const maxD = LEG - 0.01;
  const a = d0 > maxD ? {x: hip.x + ux * maxD, y: hip.y + uy * maxD} : ankle;
  const d = clamp(d0, Math.abs(THIGH - SHIN) + 1, maxD);
  const s = (THIGH * THIGH - SHIN * SHIN + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, THIGH * THIGH - s * s));
  const kd = clamp(kneeDir, -1, 1);
  const kz = Math.sqrt(1 - kd * kd);
  const dot = kd * ux;
  const px = kd - dot * ux;
  const py = -dot * uy;
  const pl = Math.hypot(px, py, kz) || 1;
  return {knee: {x: hip.x + ux * s + (px / pl) * h, y: hip.y + uy * s + (py / pl) * h}, ankle: a};
};

/** Angle-posed leg (FK). */
const fkLeg = (hip: P, leg: Leg) => {
  const out = leg.out ?? 1;
  const knee = {x: hip.x + Math.sin(rad(leg.a)) * THIGH * out, y: hip.y + Math.cos(rad(leg.a)) * THIGH};
  const ankle = {x: knee.x + Math.sin(rad(leg.a - leg.b)) * SHIN * out, y: knee.y + Math.cos(rad(leg.a - leg.b)) * SHIN};
  return {knee, ankle};
};

export type GaitStyle = 'walk' | 'tiptoe';
export type GaitSpec = {
  /** step length (half a cycle), character-local px */
  step: number;
  /** fraction of the cycle each foot is on the floor */
  duty: number;
  /** swing foot lift, px */
  lift: number;
  /** stance shoe pitch (deg): 0 = flat, ~32 = on the toes */
  pitch: number;
  /** extra swing pitch (deg) */
  swingPitch: number;
  /** constant knee bend (sink, px) on top of the gait's natural bob */
  crouch: number;
  hunch: number;
  /** lean into the direction of travel, deg */
  lean: number;
  /** arm swing, deg */
  armSwing: number;
};

export const GAITS: Record<GaitStyle, GaitSpec> = {
  walk: {step: 84, duty: 0.58, lift: 22, pitch: 0, swingPitch: 14, crouch: 3, hunch: 0, lean: 2.5, armSwing: 10},
  tiptoe: {step: 72, duty: 0.56, lift: 44, pitch: 30, swingPitch: 16, crouch: 22, hunch: 0.06, lean: 5, armSwing: 0},
};

/** Full gait cycle (two steps) in world px for a rig drawn at `scale`. */
export const strideLength = (style: GaitStyle = 'walk', scale = 1) => GAITS[style].step * 2 * scale;

/** Distance travelled (world px) → gait cycle phase (cycles). Feed the result to walkPose: feet never slide. */
export const phaseFromDistance = (distancePx: number, scale = 1, style: GaitStyle = 'walk') => distancePx / strideLength(style, scale);

const swingEase = (u: number) => (1 - Math.cos(Math.PI * clamp(u, 0, 1))) / 2;
const liftCurve = (u: number) => Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.85);

type FootState = {x: number; lift: number; pitch: number; swing: number};

/**
 * One foot along the travel axis (local px, travel frame). c = body travel (local px), hs = hip offset (+33 lead foot,
 * -33 trail foot), o = cycle offset (0 lead, 0.5 trail). With `end` set, the trip starts from a standing stance at
 * c = 0 and ends in one at c = end (half-steps at both ends); `end` must be a multiple of half a cycle.
 */
const footAt = (c: number, hs: number, o: number, sp_: GaitSpec, step: number, end?: number): FootState => {
  const Lc = step * 2;
  const D = sp_.duty;
  const stance = (x: number): FootState => ({x, lift: 0, pitch: sp_.pitch, swing: 0});
  if (end !== undefined) {
    if (c <= 0) return stance(hs);
    if (c >= end) return stance(hs + end);
  }
  const q = c / Lc - o + D / 2;
  const k = Math.floor(q);
  const r = q - k;
  const F = (j: number) => hs + (j + o) * Lc;
  if (r < D) return stance(F(k));
  // swing from footprint k to k+1 over body travel [cs, ce]
  let cs = (k + o + D / 2) * Lc;
  let ce = (k + 1 + o - D / 2) * Lc;
  let x0 = F(k);
  let x1 = F(k + 1);
  if (end !== undefined) {
    if (cs < 0) {
      cs = 0;
      x0 = hs;
    }
    if (ce > end) {
      ce = end;
      x1 = hs + end;
    }
  }
  const u = clamp((c - cs) / Math.max(1e-6, ce - cs), 0, 1);
  const pitch = sp_.pitch + sp_.swingPitch * Math.sin(Math.PI * u) * (sp_.pitch > 0 ? 1 : 1 - 2 * u);
  return {x: x0 + (x1 - x0) * swingEase(u), lift: sp_.lift * liftCurve(u) * Math.min(1, (x1 - x0) / step), pitch, swing: u > 0 && u < 1 ? 1 : 0};
};

export type GaitOptions = {
  style?: GaitStyle;
  /** +1 = travelling toward screen right, -1 = left. */
  dir?: 1 | -1;
  /** Upper-body pose to walk with (arms, face). Default IDLE2 (walk) or SNEAK_ARMS (tiptoe). */
  base?: Pose2;
  /** 0..1 how much arm swing / sneak-bob to add (default 1). */
  arms?: number;
  /** Override the step length (local px). */
  step?: number;
};

const gaitPose = (c: number, opts: GaitOptions, end?: number): Pose2 => {
  const style = opts.style ?? 'walk';
  const g = GAITS[style];
  const dir = opts.dir ?? 1;
  const step = opts.step ?? g.step;
  const base = opts.base ?? (style === 'tiptoe' ? SNEAK_ARMS : IDLE2);
  const lead = footAt(c, HIP_X, 0, g, step, end);
  const trail = footAt(c, -HIP_X, 0.5, g, step, end);
  const cc = end !== undefined ? clamp(c, 0, end) : c;
  const toFoot = (f: FootState): Foot => ({x: dir * (f.x - cc), lift: f.lift + heelRaise(f.pitch, 1), pitch: f.pitch, turn: dir, knee: dir});
  const fLead = toFoot(lead);
  const fTrail = toFoot(trail);
  const feet = dir === 1 ? {L: fTrail, R: fLead} : {L: fLead, R: fTrail};
  // ease the lean and swing in over the first half-step and out over the last
  const ramp = end !== undefined ? E.inOut(clamp(Math.min(cc, end - cc) / step, 0, 1)) : 1;
  const ph = (cc / (step * 2)) * Math.PI * 2;
  const arms = (opts.arms ?? 1) * ramp;
  const swing = style === 'walk' ? Math.sin(ph) * g.armSwing * arms : 0;
  const paw = style === 'tiptoe' ? Math.sin(ph * 2) * 3 * arms : 0;
  return {
    ...base,
    armL: {a: base.armL.a + dir * swing + paw, b: base.armL.b + Math.abs(swing) * 0.8 - paw},
    armR: {a: base.armR.a + dir * swing + paw, b: base.armR.b + Math.abs(swing) * 0.8 - paw},
    lean: base.lean + dir * g.lean * ramp,
    sink: (base.sink ?? 0) + g.crouch,
    hunch: (base.hunch ?? 0) + g.hunch,
    feet,
    lookX: base.lookX === 0 ? dir * 0.45 : base.lookX,
  };
};

/**
 * Periodic gait at a cycle phase (cycles; use phaseFromDistance). Feet are relative to the rig's x, which must
 * advance by `dir * phase * strideLength(style, scale)`; then planted feet stay exactly still on the floor.
 */
export const walkPose = (phase: number, opts: GaitOptions = {}): Pose2 => gaitPose(phase * (opts.step ?? GAITS[opts.style ?? 'walk'].step) * 2, opts);

export type TripPlan = {style: GaitStyle; scale: number; distance: number; steps: number; step: number; stepPx: number};

/** Plan a trip of `distancePx` world px: a whole number of steps, step length adjusted (≤ ±25 %) to fit exactly. */
export const planTrip = (distancePx: number, scale = 1, style: GaitStyle = 'walk'): TripPlan => {
  const base = GAITS[style].step;
  const local = Math.abs(distancePx) / scale;
  const steps = Math.max(1, Math.round(local / base));
  const step = local / steps;
  return {style, scale, distance: Math.abs(distancePx), steps, step, stepPx: step * scale};
};

/**
 * Start-to-stop locomotion: from a standing stance, `plan.steps` steps, back to a standing stance. `travelled` is the
 * distance covered so far (world px, 0..plan.distance); move the rig's x by `dir * travelled`. The first and last
 * steps are half-steps (the rear foot lifts first; the last foot closes beside the other), so a stand pose can be
 * blended in before and after without any foot sliding.
 */
export const tripPose = (travelled: number, plan: TripPlan, opts: Omit<GaitOptions, 'style' | 'step'> = {}): Pose2 => {
  const end = plan.steps * plan.step;
  return gaitPose(clamp(travelled / plan.scale, 0, end), {...opts, style: plan.style, step: plan.step}, end);
};

/**
 * Distance along a planned trip at frame g (world px), starting at `start`, `framesPerStep` per step. `pulse` 0..1
 * gives the sneak rhythm (0 = steady speed, 1 = each step eases in and out). The first step accelerates and the last
 * decelerates, so the body never starts or stops dead.
 */
export const tripDistance = (g: number, start: number, plan: TripPlan, framesPerStep: number, pulse = 0) => {
  const t = (g - start) / framesPerStep;
  if (t <= 0) return 0;
  if (t >= plan.steps) return plan.distance;
  const k = Math.floor(t);
  const f = t - k;
  // first step: accelerates from rest to the steady speed (2f² - f³); last step mirrors it; both C1 at the joints
  const accel = (u: number) => 2 * u * u - u * u * u;
  const base = plan.steps === 1 ? E.inOut(f) : k === 0 ? accel(f) : k === plan.steps - 1 ? 1 - accel(1 - f) : f;
  const e = plan.steps === 1 ? base : lerp(base, E.inOut(f), clamp(pulse, 0, 1));
  return (k + e) * plan.stepPx;
};

/** Frames a planned trip takes at `framesPerStep` (the rig arrives at start + tripDuration). */
export const tripDuration = (plan: TripPlan, framesPerStep: number) => plan.steps * framesPerStep;

/**
 * Frames (rounded) at which a foot lands during a trip driven by tripDistance with the same arguments: the footstep
 * cues for the sound sheet. Pure function; samples the gait at quarter frames.
 */
export const tripContacts = (start: number, plan: TripPlan, framesPerStep: number, pulse = 0): number[] => {
  const g = GAITS[plan.style];
  const end = plan.steps * plan.step;
  const out: number[] = [];
  let prev = [0, 0];
  const last = start + tripDuration(plan, framesPerStep) + 1;
  for (let i = 0; start + i * 0.25 <= last; i++) {
    const f = start + i * 0.25;
    const c = tripDistance(f, start, plan, framesPerStep, pulse) / plan.scale;
    const s = [footAt(c, HIP_X, 0, g, plan.step, end).swing, footAt(c, -HIP_X, 0.5, g, plan.step, end).swing];
    s.forEach((v, j) => {
      if (prev[j] === 1 && v === 0) out.push(Math.round(f));
    });
    prev = s;
  }
  return out;
};

/* ------------------------------------------------------------------ world helpers (reach / handWorld for Character2) */

/**
 * Where a rig is drawn (the same x, y, scale, flip given to <Character2>). Optionally also the rig's `frame`, `seed`
 * and `life`: then the world helpers below include the idle drift the rig adds (lean and breathing sink, ±1-2 px), so a
 * hand placed with reach2 stays exactly on a world-fixed target. Without `frame` they use the pose as given.
 */
export type RigPlace = {x: number; y: number; scale: number; flip?: boolean; frame?: number; seed?: number; life?: number};

/**
 * The pose <Character2> actually draws: the scene's pose plus the seeded idle life (head tilt, lean and breathing
 * drift, eye darts). Pure function of its arguments.
 */
export const livePose = (pose0: Pose2, frame: number, seed = 1, life = 1, eyeDarts = true): Pose2 => {
  const saccade = (() => {
    if (!eyeDarts || life <= 0) return {x: 0, y: 0};
    const period = 70 + Math.floor(rand(seed * 11) * 50);
    const k = Math.floor((frame + seed * 13) / period);
    const p = (frame + seed * 13) % period;
    const tx = (rand(seed * 101 + k) - 0.5) * 0.36;
    const ty = (rand(seed * 211 + k) - 0.5) * 0.22;
    const px = (rand(seed * 101 + k - 1) - 0.5) * 0.36;
    const py = (rand(seed * 211 + k - 1) - 0.5) * 0.22;
    const u = Math.min(1, p / 4);
    return {x: (px + (tx - px) * u) * life, y: (py + (ty - py) * u) * life};
  })();
  return {
    ...pose0,
    tilt: pose0.tilt + drift(frame, seed, 170) * 1.3 * life,
    lean: pose0.lean + drift(frame, seed + 7, 210) * 0.7 * life,
    // idle drift moves the upper body only (feet stay planted), as a tiny breathing sink
    sink: (pose0.sink ?? 0) + (drift(frame, seed + 3, 96) * 1.4 + 1.4) * life * 0.5,
    lookX: clamp(pose0.lookX + saccade.x, -1, 1),
    lookY: clamp(pose0.lookY + saccade.y, -1, 1),
  };
};

/** The pose the helpers should measure: with the rig's idle drift when the place carries its frame. */
const placedPose = (ch: RigPlace, pose: Pose2) => (ch.frame === undefined ? pose : livePose(pose, ch.frame, ch.seed ?? 1, ch.life ?? 1, false));

/** The upper-body transform of a pose (shared by drawing and the hand helpers). */
const bodyXf = (pose: Pose2, sinkEff: number) => {
  const peek = pose.peek ?? 0;
  return {
    tx: pose.shift ?? 0,
    ty: sinkEff,
    lean: pose.lean + peek * 6,
    hd: (pose.hunch ?? 0) * HUNCH_PX,
  };
};

const rot = (p: P, deg: number, c: P): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};

/** Hip joints for a pose (character-local, before bob). */
const hipJoints = (pose: Pose2, sink: number) => {
  const xf = bodyXf(pose, sink);
  const roll = -(pose.shift ?? 0) * 0.38;
  const piv = {x: 0, y: PIVOT_Y};
  const mk = (side: -1 | 1) => {
    const p = rot({x: side * HIP_X, y: HIP_Y}, xf.lean + roll, piv);
    return {x: p.x + xf.tx, y: p.y + xf.ty};
  };
  return {L: mk(-1), R: mk(1)};
};

/** The sink needed so every foot target is reachable (the rig always adds it, so feet never leave their targets). */
const neededSink = (pose: Pose2) => {
  const feet = pose.feet ?? STAND_FEET;
  const hips = hipJoints(pose, 0);
  let need = 0;
  (['L', 'R'] as const).forEach((k) => {
    if (k === 'L' ? pose.legL : pose.legR) return;
    const f = feet[k];
    const hip = hips[k];
    const ay = ANKLE_Y - (f.lift ?? 0);
    const dx = f.x - hip.x;
    const v = Math.sqrt(Math.max(0, REACH * REACH - dx * dx));
    need = Math.max(need, ay - hip.y - v);
  });
  return need;
};

/** Total hip drop: what the foot targets need plus the pose's own extra bend. */
const effectiveSink = (pose: Pose2) => (pose.sink ?? 0) + neededSink(pose);

/** Arm frame (where ArmShape draws, before the hunch drop) → ground frame (character-local, before bob). */
const armToGround = (pose: Pose2, p: P): P => {
  const xf = bodyXf(pose, effectiveSink(pose));
  const q = rot({x: p.x, y: p.y + xf.hd}, xf.lean, {x: 0, y: PIVOT_Y});
  return {x: q.x + xf.tx, y: q.y + xf.ty};
};

/** Ground frame → arm frame (inverse of armToGround). */
const groundToArm = (pose: Pose2, p: P): P => {
  const xf = bodyXf(pose, effectiveSink(pose));
  const q = rot({x: p.x - xf.tx, y: p.y - xf.ty}, -xf.lean, {x: 0, y: PIVOT_Y});
  return {x: q.x, y: q.y - xf.hd};
};

/** Ground frame → world. */
const groundToWorld = (ch: RigPlace, pose: Pose2, q: P): P => {
  const sx = ch.flip ? -q.x : q.x;
  return {x: ch.x + sx * ch.scale, y: ch.y + (q.y + (pose.bob ?? 0)) * ch.scale};
};

/** Local (unflipped, pre-scale) → world, for a point drawn inside the upper body's arm frame. */
const armFrameToWorld = (ch: RigPlace, pose: Pose2, p: P): P => groundToWorld(ch, pose, armToGround(pose, p));

/** Where the hand of `pose`'s arm on `side` lands in world space (accounts for sink, hunch, shift, lean, flip, bob,
 *  and the idle drift when `ch` carries the rig's frame). */
export const handWorld2 = (ch: RigPlace, pose: Pose2, side: -1 | 1) => {
  const lp = placedPose(ch, pose);
  const h = handPos(side === -1 ? lp.armL : lp.armR, side);
  return armFrameToWorld(ch, lp, {x: h.hx, y: h.hy});
};

/** Arm that puts the hand on a world point (two-bone IK through the pose's body transform). */
export const reach2 = (ch: RigPlace, pose: Pose2, side: -1 | 1, wx: number, wy: number, elbow: 1 | -1 = 1): Arm => {
  const lp = placedPose(ch, pose);
  const q = {x: ((wx - ch.x) / ch.scale) * (ch.flip ? -1 : 1), y: (wy - ch.y) / ch.scale - (lp.bob ?? 0)};
  const a = groundToArm(lp, q);
  return reachLocal(a.x, a.y, side, elbow);
};

/** Arm that puts the hand on a character-local ground-frame point (feet at 0,0, before bob; e.g. a knee). */
export const reachGround = (pose: Pose2, side: -1 | 1, gx: number, gy: number, elbow: 1 | -1 = 1): Arm => {
  const a = groundToArm(pose, {x: gx, y: gy});
  return reachLocal(a.x, a.y, side, elbow);
};

/** Head transform of a pose: offset and rotation about the neck pivot (character-local, arm frame). */
const headXf = (pose: Pose2) => {
  const peek = pose.peek ?? 0;
  return {dx: peek * 30, dy: Math.abs(peek) * 5, rot: pose.tilt + peek * 15};
};

/** The mouth centre in world space (for a hand-over-mouth reach that follows a tilted / peeking head). */
export const mouthWorld = (ch: RigPlace, pose: Pose2) => {
  const lp = placedPose(ch, pose);
  const h = headXf(lp);
  const m = rot({x: 0, y: HEAD_Y + 34}, h.rot, {x: 0, y: HEAD_Y + 50});
  return armFrameToWorld(ch, lp, {x: m.x + h.dx, y: m.y + h.dy});
};

/** Where a world-px rig of `scale` has its eyes (centre between them), e.g. to aim a look or a sight line. */
export const eyesWorld = (ch: RigPlace, pose: Pose2) => {
  const lp = placedPose(ch, pose);
  const h = headXf(lp);
  const m = rot({x: 0, y: HEAD_Y - 6}, h.rot, {x: 0, y: HEAD_Y + 50});
  return armFrameToWorld(ch, lp, {x: m.x + h.dx, y: m.y + h.dy});
};

/* ------------------------------------------------------------------ legs (pure geometry, shared by drawing and helpers) */

type LegGeo = {hip: P; knee: P; ankle: P; turn: number; pitch: number; side: -1 | 1};

/** Both legs of a pose in the ground frame (character-local, before bob): hips, knees, ankles. */
const legsOf = (pose: Pose2): {L: LegGeo; R: LegGeo} => {
  const hips = hipJoints(pose, effectiveSink(pose));
  const feet = pose.feet ?? STAND_FEET;
  const one = (k: 'L' | 'R', side: -1 | 1): LegGeo => {
    const hip = hips[k];
    const fk = k === 'L' ? pose.legL : pose.legR;
    const f = feet[k];
    if (fk) {
      const {knee, ankle} = fkLeg(hip, fk);
      return {hip, knee, ankle, turn: f.turn ?? 0, pitch: f.pitch ?? 0, side};
    }
    const tgt = {x: f.x, y: ANKLE_Y - (f.lift ?? 0)};
    const kd = f.knee ?? side * KNEE_DEFAULT;
    let sol = solveLeg(hip, tgt, kd);
    if (sol.knee.y > KNEE_FLOOR) {
      // a sideways knee would poke through the floor (deep sink + lifted foot): turn it toward the camera just enough
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        if (solveLeg(hip, tgt, kd * mid).knee.y > KNEE_FLOOR) hi = mid;
        else lo = mid;
      }
      sol = solveLeg(hip, tgt, kd * lo);
    }
    return {hip, knee: sol.knee, ankle: sol.ankle, turn: f.turn ?? 0, pitch: f.pitch ?? 0, side};
  };
  return {L: one('L', -1), R: one('R', 1)};
};

/** A knee in world space (side -1 = the screen-left leg). */
export const kneeWorld = (ch: RigPlace, pose: Pose2, side: -1 | 1) => {
  const lp = placedPose(ch, pose);
  return groundToWorld(ch, lp, legsOf(lp)[side === -1 ? 'L' : 'R'].knee);
};

/**
 * Arms with both hands resting on the knees of `pose` (use on a crouch: withPose(crouch, handsOnKnees(crouch))).
 * Draws both arms in front of the legs. Compute it from the final leg pose (same feet, sink and lean).
 */
export const handsOnKnees = (pose: Pose2): Pick<Pose2, 'armL' | 'armR' | 'armsFront'> => {
  const legs = legsOf(pose);
  // the mitt centre sits just above and outside the knee cap, so the palm covers the top of the knee
  const on = (k: LegGeo) => reachGround(pose, k.side, k.knee.x + k.side * 3, k.knee.y - 20, 1);
  return {armL: on(legs.L), armR: on(legs.R), armsFront: 'both'};
};

/* ------------------------------------------------------------------ drawing pieces (copied from Character.tsx) */

const ArmShape: React.FC<{arm: Arm; side: -1 | 1; skin: string; sleeve: string; children?: React.ReactNode}> = ({arm, side, skin, sleeve, children}) => {
  const {ex, ey, hx, hy, angle} = handPos(arm, side);
  const sx = SHOULDER_X * side;
  return (
    <g>
      <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey} ${hx},${hy}`} fill="none" stroke={C.ink} strokeWidth={ARM_W + OUTLINE * 2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${sx},${SHOULDER_Y} ${ex},${ey}`} fill="none" stroke={sleeve} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${ex},${ey} ${hx},${hy}`} fill="none" stroke={skin} strokeWidth={ARM_W} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${hx}, ${hy}) rotate(${angle})`}>
        <ellipse cx={0} cy={6} rx={20} ry={18} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} />
        <ellipse cx={side * -14} cy={-2} rx={8} ry={10} fill={skin} stroke={C.ink} strokeWidth={OUTLINE} transform={`rotate(${side * -30})`} />
        <ellipse cx={side * -14} cy={-2} rx={6} ry={8} fill={skin} transform={`rotate(${side * -30})`} />
      </g>
      {children && <g transform={`translate(${hx}, ${hy})`}>{children}</g>}
    </g>
  );
};

const HairShape: React.FC<{hair: Hair; color: string}> = ({hair, color}) => {
  const cy = HEAD_Y;
  const r = HEAD_R;
  const st = {fill: color, stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
  switch (hair) {
    case 'crop':
      return <path d={`M ${-r - 2} ${cy - 8} Q ${-r} ${cy - r - 18} 0 ${cy - r - 16} Q ${r} ${cy - r - 18} ${r + 2} ${cy - 8} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r - 2} ${cy - 8} Z`} {...st} />;
    case 'bun':
      return (
        <g>
          <circle cx={0} cy={cy - r - 20} r={20} {...st} />
          <path d={`M ${-r - 2} ${cy - 8} Q ${-r} ${cy - r - 16} 0 ${cy - r - 14} Q ${r} ${cy - r - 16} ${r + 2} ${cy - 8} Q ${r * 0.6} ${cy - r * 0.5} 0 ${cy - r * 0.55} Q ${-r * 0.6} ${cy - r * 0.5} ${-r - 2} ${cy - 8} Z`} {...st} />
        </g>
      );
    case 'curly':
      return (
        <g>
          {[-48, -30, -10, 10, 30, 48].map((x, i) => (
            <circle key={i} cx={x} cy={cy - r + 6 - (i === 0 || i === 5 ? 0 : 14)} r={i === 0 || i === 5 ? 20 : 24} {...st} />
          ))}
          <circle cx={-62} cy={cy - 10} r={16} {...st} />
          <circle cx={62} cy={cy - 10} r={16} {...st} />
        </g>
      );
    case 'swoop':
      return (
        <path d={`M ${-r - 4} ${cy - 4} Q ${-r - 6} ${cy - r - 24} ${-10} ${cy - r - 20} Q ${r + 10} ${cy - r - 30} ${r + 8} ${cy - r + 10} Q ${r - 10} ${cy - r - 2} ${20} ${cy - r + 2} Q ${-20} ${cy - r + 4} ${-r - 4} ${cy - 4} Z`} {...st} />
      );
    case 'bob':
      return (
        <path d={`M ${-r - 10} ${cy + 26} L ${-r - 10} ${cy - 10} Q ${-r - 6} ${cy - r - 20} 0 ${cy - r - 18} Q ${r + 6} ${cy - r - 20} ${r + 10} ${cy - 10} L ${r + 10} ${cy + 26} L ${r - 6} ${cy + 26} L ${r - 6} ${cy - 20} Q ${r * 0.5} ${cy - r * 0.6} 0 ${cy - r * 0.62} Q ${-r * 0.5} ${cy - r * 0.6} ${-r + 6} ${cy - 20} L ${-r + 6} ${cy + 26} Z`} {...st} />
      );
    case 'spiky':
      return (
        <path d={`M ${-r} ${cy - 12} L ${-r + 4} ${cy - r - 22} L ${-28} ${cy - r - 4} L ${-14} ${cy - r - 34} L 0 ${cy - r - 6} L 14 ${cy - r - 36} L 28 ${cy - r - 4} L ${r - 4} ${cy - r - 22} L ${r} ${cy - 12} Q ${r * 0.6} ${cy - r * 0.55} 0 ${cy - r * 0.6} Q ${-r * 0.6} ${cy - r * 0.55} ${-r} ${cy - 12} Z`} {...st} />
      );
    default:
      return null;
  }
};

const MouthShape: React.FC<{mouth: Mouth; y: number; talkPhase?: number}> = ({mouth, y, talkPhase = 0}) => {
  const st = {fill: 'none', stroke: C.ink, strokeWidth: OUTLINE, strokeLinecap: 'round' as const};
  switch (mouth) {
    case 'smile':
      return <path d={`M -16 ${y} Q 0 ${y + 14} 16 ${y}`} {...st} />;
    case 'grin':
      return (
        <g>
          <path d={`M -22 ${y - 2} Q 0 ${y + 30} 22 ${y - 2} Z`} fill={C.ink} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
          <path d={`M -16 ${y + 1} Q 0 ${y + 9} 16 ${y + 1} L 16 ${y + 5} Q 0 ${y + 12} -16 ${y + 5} Z`} fill={C.white} />
        </g>
      );
    case 'flat':
      return <path d={`M -14 ${y + 2} L 14 ${y + 2}`} {...st} />;
    case 'o':
      return <ellipse cx={0} cy={y + 4} rx={8} ry={10} fill={C.ink} />;
    case 'smirk':
      return <path d={`M -14 ${y + 4} Q 4 ${y + 12} 17 ${y - 3}`} {...st} />;
    case 'frown':
      return <path d={`M -16 ${y + 6} Q 0 ${y - 6} 16 ${y + 6}`} {...st} />;
    case 'hmm':
      return <path d={`M -14 ${y + 2} Q -4 ${y + 7} 4 ${y + 1} Q 10 ${y - 3} 14 ${y + 3}`} {...st} />;
    case 'talk': {
      const open = 3 + 7 * Math.abs(Math.sin(talkPhase));
      return <ellipse cx={0} cy={y + 4} rx={9} ry={open} fill={C.ink} />;
    }
    default:
      return null;
  }
};

/** A two-segment leg in pants with the ink outline (same width and caps as the Video 01 leg rects). */
const LegShape: React.FC<{hip: P; knee: P; ankle: P; pants: string}> = ({hip, knee, ankle, pants}) => {
  const pts = `${f2(hip.x)},${f2(hip.y)} ${f2(knee.x)},${f2(knee.y)} ${f2(ankle.x)},${f2(ankle.y)}`;
  return (
    <g>
      <polyline points={pts} fill="none" stroke={C.ink} strokeWidth={LEG_W + OUTLINE * 2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts} fill="none" stroke={pants} strokeWidth={LEG_W} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Shoe (Video 01 ellipse), nudged forward when it turns 3/4 and rotated about the ankle for pitch. */
const ShoeShape: React.FC<{ankle: P; side: -1 | 1; turn: number; pitch: number; color: string}> = ({ankle, side, turn, pitch, color}) => (
  <g transform={`translate(${f2(ankle.x)} ${f2(ankle.y)}) rotate(${f2(pitch * turn)})`}>
    <ellipse cx={f2(side * (1 - Math.abs(turn)) + turn * 8)} cy={SHOE_DY} rx={SHOE_RX} ry={SHOE_RY} fill={color} stroke={C.ink} strokeWidth={OUTLINE} />
  </g>
);

/* ------------------------------------------------------------------ the rig */

export type Character2Props = {
  look: Look;
  /** A Pose (Video 01) or a Pose2. */
  pose: Pose2;
  /** for blink / talk phase / idle life (deterministic) */
  frame: number;
  seed?: number;
  x?: number;
  y?: number;
  scale?: number;
  /** mirror the figure */
  flip?: boolean;
  /** Arm(s) drawn in front of the torso; 'both' is new. Defaults to pose.armsFront, then 'none'. */
  front?: 'L' | 'R' | 'both' | 'none';
  /** Split drawing so props can sit between the body and the front arm(s). */
  pass?: 'all' | 'body' | 'frontArm';
  /** prop attached to the left / right hand (character-local coords, hand at 0,0) */
  holdL?: React.ReactNode;
  holdR?: React.ReactNode;
  shadow?: boolean;
  style?: React.CSSProperties;
  /** idle life: 0 = frozen, 1 = default */
  life?: number;
  eyeDarts?: boolean;
  /** With both arms in front, which is drawn on top. Defaults to pose.frontTop, then 'L'. */
  frontTop?: 'L' | 'R';
};

/** The Video 02 rig: Video 01's Character with moving legs, crouch, weight shift, peek and new face options. */
export const Character2: React.FC<Character2Props> = ({look, pose: pose0, frame, seed = 1, x = 0, y = 0, scale = 1, flip = false, front, pass = 'all', holdL, holdR, shadow = true, style, life = 1, eyeDarts = true, frontTop}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  // idle life is layered on top of the scene's pose, never replacing it (livePose is exported for the helpers)
  const pose = livePose(pose0, frame, seed, life, eyeDarts);
  const bl = pose.blink ?? blinkFn(frame, seed);
  const bob = pose.bob ?? 0;
  const breathe = Math.sin((frame / 48 + seed) * Math.PI * 2) * 1.2;
  const eyeY = HEAD_Y - 6;
  const fr = front ?? pose.armsFront ?? 'none';
  const drawBody = pass !== 'frontArm';
  const drawFrontArm = pass !== 'body';
  const frontL = fr === 'L' || fr === 'both';
  const frontR = fr === 'R' || fr === 'both';
  const topR = (frontTop ?? pose.frontTop ?? 'L') === 'R';
  const sleeve = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;

  // legs and the upper-body transform
  const sink = effectiveSink(pose);
  const xf = bodyXf(pose, sink);
  const feet = pose.feet ?? STAND_FEET;
  const {L: legL, R: legR} = legsOf(pose);
  // the leg nearer the camera is drawn last: when walking (shoes turned), the leg on the trailing side of the turn
  const turnAvg = ((feet.L.turn ?? 0) + (feet.R.turn ?? 0)) / 2;
  const legOrder = turnAvg < -0.05 ? [legL, legR] : turnAvg > 0.05 ? [legR, legL] : [legL, legR];
  const shadowX = (legL.ankle.x + legR.ankle.x) / 2;
  const shadowK = 1 - clamp(-bob / 160, 0, 0.3);

  const head = headXf(pose);
  const neckPiv = {x: 0, y: HEAD_Y + 50};
  const neckTop = (sx: number) => {
    const p = rot({x: sx, y: HEAD_Y + 40}, head.rot, neckPiv);
    return {x: p.x + head.dx, y: p.y + head.dy};
  };
  const nTL = neckTop(-16);
  const nTR = neckTop(16);

  const LArm = (
    <ArmShape arm={pose.armL} side={-1} skin={look.skin} sleeve={sleeve}>
      {holdL}
    </ArmShape>
  );
  const RArm = (
    <ArmShape arm={pose.armR} side={1} skin={look.skin} sleeve={sleeve}>
      {holdR}
    </ArmShape>
  );
  const browL = -12 - pose.brows * 6;
  const browR = -12 - pose.brows * 6 - (pose.browAsym ?? 0) * 8;
  const eyeK = pose.eyes ?? 1;
  const pupK = pose.pupil ?? 1;
  const lid = clamp(pose.lid ?? 0, 0, 1);
  const sweat = clamp(pose.sweat ?? 0, 0, 1);
  const upperXf = `translate(${f2(xf.tx)} ${f2(xf.ty)}) rotate(${f2(xf.lean)} 0 ${PIVOT_Y})`;
  const torsoD = `M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L 52 ${SHOULDER_Y - 22} Q 82 ${SHOULDER_Y - 18} 76 ${SHOULDER_Y + 2} L 66 -150 Q 0 -138 -66 -150 Z`;

  return (
    <svg
      viewBox="-200 -500 400 520"
      width={400 * scale}
      height={520 * scale}
      style={{position: 'absolute', left: x - 200 * scale, top: y - 500 * scale, overflow: 'visible', ...style}}
    >
      {/* the floor shadow stays on the floor when the body hops (bob < 0) and shrinks a little with the height */}
      {shadow && drawBody && (
        <g transform={flip ? 'scale(-1,1)' : undefined}>
          <ellipse cx={f2(shadowX)} cy={2} rx={f2(92 * shadowK)} ry={f2(14 * shadowK)} fill={C.shadow} />
        </g>
      )}
      <g transform={`${flip ? 'scale(-1,1)' : ''} translate(0, ${f2(bob)})`}>
        {/* back arm(s), behind the legs as in Video 01 */}
        {drawBody && (
          <g transform={upperXf}>
            <g transform={`translate(0 ${f2(xf.hd)})`}>
              {!frontL && LArm}
              {!frontR && RArm}
            </g>
          </g>
        )}
        {/* legs (ground frame: feet stay where their targets are) */}
        {drawBody &&
          legOrder.map((l) => (
            <g key={l.side}>
              <LegShape hip={l.hip} knee={l.knee} ankle={l.ankle} pants={look.pants} />
              <ShoeShape ankle={l.ankle} side={l.side} turn={l.turn} pitch={l.pitch} color={look.shoes} />
            </g>
          ))}
        <g transform={upperXf}>
          {drawBody && (
            <g>
              {/* torso (breathes; compresses with the hunch) */}
              <g transform={`translate(0 ${PIVOT_Y}) scale(1 ${f2((1 - (pose.hunch ?? 0)) * (1 + breathe / 300) * 10000) / 10000}) translate(0 ${-PIVOT_Y})`}>
                <path d={torsoD} fill={look.shirt} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                {look.stripes && (
                  <g clipPath={`url(#torso${uid})`}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <rect key={i} x={-90} y={SHOULDER_Y - 10 + i * 30} width={180} height={14} fill={look.stripes} />
                    ))}
                  </g>
                )}
                <defs>
                  <clipPath id={`torso${uid}`}>
                    <path d={torsoD} />
                  </clipPath>
                </defs>
                {look.stripes && <path d={torsoD} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />}
                {look.overlay === 'vest' && (
                  <path d={`M -58 ${SHOULDER_Y - 16} L -26 ${SHOULDER_Y - 18} L -14 ${SHOULDER_Y + 40} L -40 -152 L -62 -152 Z M 58 ${SHOULDER_Y - 16} L 26 ${SHOULDER_Y - 18} L 14 ${SHOULDER_Y + 40} L 40 -152 L 62 -152 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'cardigan' && (
                  <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L -22 ${SHOULDER_Y - 22} L -10 -150 L -66 -150 Z M 76 ${SHOULDER_Y + 2} Q 82 ${SHOULDER_Y - 18} 52 ${SHOULDER_Y - 22} L 22 ${SHOULDER_Y - 22} L 10 -150 L 66 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'apron' && (
                  <path d={`M -34 ${SHOULDER_Y - 10} L 34 ${SHOULDER_Y - 10} L 60 -150 L -60 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.overlay === 'jacket' && (
                  <path d={`M -76 ${SHOULDER_Y + 2} Q -82 ${SHOULDER_Y - 18} -52 ${SHOULDER_Y - 22} L -30 ${SHOULDER_Y - 22} L 0 ${SHOULDER_Y + 50} L -8 -150 L -66 -150 Z M 76 ${SHOULDER_Y + 2} Q 82 ${SHOULDER_Y - 18} 52 ${SHOULDER_Y - 22} L 30 ${SHOULDER_Y - 22} L 0 ${SHOULDER_Y + 50} L 8 -150 L 66 -150 Z`} fill={look.overlayColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                )}
                {look.accessories.includes('tie') && <path d={`M -9 ${SHOULDER_Y - 16} L 9 ${SHOULDER_Y - 16} L 12 ${SHOULDER_Y + 60} L 0 ${SHOULDER_Y + 74} L -12 ${SHOULDER_Y + 60} Z`} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />}
                {look.accessories.includes('nametag') && <rect x={18} y={SHOULDER_Y + 10} width={40} height={22} rx={4} fill={C.white} stroke={C.ink} strokeWidth={3} />}
                {look.accessories.includes('nametag') && <rect x={24} y={SHOULDER_Y + 18} width={28} height={5} rx={2} fill={C.inkMuted} />}
              </g>
              <g transform={`translate(0 ${f2(xf.hd)})`}>
                {/* neck: a quad from the collar to the (possibly peeking) head */}
                <path d={`M -16 ${HEAD_Y + 74} L 16 ${HEAD_Y + 74} L ${f2(nTR.x)} ${f2(nTR.y)} L ${f2(nTL.x)} ${f2(nTL.y)} Z`} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                {look.accessories.includes('bowtie') && (
                  <g transform={`translate(0 ${SHOULDER_Y - 14})`}>
                    <path d="M -26 -12 L 0 0 L -26 12 Z M 26 -12 L 0 0 L 26 12 Z" fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                    <circle cx={0} cy={0} r={6} fill={C.coralDeep} stroke={C.ink} strokeWidth={3} />
                  </g>
                )}
                {/* head */}
                <g transform={`translate(${f2(head.dx)} ${f2(head.dy)}) rotate(${f2(head.rot)} 0 ${HEAD_Y + 50})`}>
                  {look.hair === 'bob' && <HairShape hair="bob" color={look.hairColor} />}
                  <ellipse cx={0} cy={HEAD_Y} rx={HEAD_R} ry={HEAD_R + 4} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                  <ellipse cx={-HEAD_R - 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                  <ellipse cx={HEAD_R + 2} cy={HEAD_Y + 6} rx={9} ry={12} fill={look.skin} stroke={C.ink} strokeWidth={OUTLINE} />
                  {look.accessories.includes('earring') && <circle cx={HEAD_R + 2} cy={HEAD_Y + 20} r={5} fill={C.saffron} stroke={C.ink} strokeWidth={3} />}
                  {look.hair !== 'bob' && <HairShape hair={look.hair} color={look.hairColor} />}
                  {look.accessories.includes('beard') && (
                    <path d={`M -44 ${HEAD_Y + 14} Q -46 ${HEAD_Y + 70} 0 ${HEAD_Y + 74} Q 46 ${HEAD_Y + 70} 44 ${HEAD_Y + 14} Q 30 ${HEAD_Y + 36} 0 ${HEAD_Y + 34} Q -30 ${HEAD_Y + 36} -44 ${HEAD_Y + 14} Z`} fill={look.hairColor} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                  )}
                  {look.cheeks && (
                    <g opacity={0.55}>
                      <circle cx={-34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
                      <circle cx={34} cy={HEAD_Y + 16} r={9} fill={C.coral} />
                    </g>
                  )}
                  {/* eyes (with optional lids, size and pupil size) */}
                  {[-1, 1].map((s) => {
                    const rx = 12 * eyeK;
                    const ry = Math.max(0.6, 13 * eyeK * bl);
                    const lidY = -ry + 2 * ry * lid;
                    const chord = rx * Math.sqrt(Math.max(0, 1 - (lidY / ry) ** 2));
                    const pr = 5.5 * pupK;
                    const clip = `eye${uid}${s < 0 ? 'l' : 'r'}`;
                    const by = s < 0 ? browL : browR;
                    const browLift = -(eyeK - 1) * 13; // brows ride up with wide eyes
                    return (
                      <g key={s} transform={`translate(${s * 21} ${eyeY})`}>
                        <defs>
                          <clipPath id={clip}>
                            <ellipse cx={0} cy={0} rx={rx} ry={ry} />
                          </clipPath>
                        </defs>
                        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={C.white} />
                        {bl > 0.25 && <circle cx={f2(pose.lookX * 5 * eyeK)} cy={f2(pose.lookY * 4 * eyeK)} r={f2(pr)} fill={C.ink} />}
                        {bl > 0.25 && <circle cx={f2(pose.lookX * 5 * eyeK + 2 * pupK)} cy={f2(pose.lookY * 4 * eyeK - 2 * pupK)} r={f2(1.6 * Math.max(0.7, pupK))} fill={C.white} />}
                        {lid > 0.01 && bl > 0.25 && (
                          <g clipPath={`url(#${clip})`}>
                            <rect x={-rx - 2} y={-ry - 2} width={rx * 2 + 4} height={f2(lidY + ry + 2)} fill={look.skin} />
                          </g>
                        )}
                        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={C.ink} strokeWidth={3} />
                        {lid > 0.01 && bl > 0.25 && <line x1={f2(-chord - 1)} y1={f2(lidY)} x2={f2(chord + 1)} y2={f2(lidY)} stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />}
                        <line x1={-12} y1={f2(by + browLift)} x2={12} y2={f2(by + browLift + s * pose.brows * 6)} stroke={C.ink} strokeWidth={OUTLINE + 1} strokeLinecap="round" transform="translate(0 -10)" />
                      </g>
                    );
                  })}
                  {/* nose */}
                  <path d={`M 2 ${HEAD_Y + 2} Q 10 ${HEAD_Y + 16} 0 ${HEAD_Y + 18}`} fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
                  <MouthShape mouth={pose.mouth} y={HEAD_Y + 30} talkPhase={frame / 2.2} />
                  {look.accessories.includes('glasses') && (
                    <g fill="none" stroke={C.ink} strokeWidth={3.5}>
                      <rect x={-37} y={eyeY - 15} width={30} height={26} rx={7} />
                      <rect x={7} y={eyeY - 15} width={30} height={26} rx={7} />
                      <line x1={-7} y1={eyeY - 4} x2={7} y2={eyeY - 4} />
                    </g>
                  )}
                  {look.accessories.includes('roundGlasses') && (
                    <g fill="none" stroke={C.ink} strokeWidth={3.5}>
                      <circle cx={-21} cy={eyeY} r={17} />
                      <circle cx={21} cy={eyeY} r={17} />
                      <line x1={-4} y1={eyeY - 2} x2={4} y2={eyeY - 2} />
                    </g>
                  )}
                  {look.accessories.includes('visor') && (
                    <path d={`M ${-HEAD_R - 8} ${HEAD_Y - 30} Q 0 ${HEAD_Y - 44} ${HEAD_R + 8} ${HEAD_Y - 30} L ${HEAD_R + 20} ${HEAD_Y - 14} Q 0 ${HEAD_Y - 2} ${-HEAD_R - 20} ${HEAD_Y - 14} Z`} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
                  )}
                  {look.accessories.includes('headset') && (
                    <g fill="none" stroke={C.ink} strokeWidth={4}>
                      <path d={`M ${-HEAD_R - 6} ${HEAD_Y} Q ${-HEAD_R - 6} ${HEAD_Y - HEAD_R - 14} 0 ${HEAD_Y - HEAD_R - 16} Q ${HEAD_R + 6} ${HEAD_Y - HEAD_R - 14} ${HEAD_R + 6} ${HEAD_Y}`} />
                      <rect x={HEAD_R - 2} y={HEAD_Y - 6} width={14} height={22} rx={5} fill={C.ink} />
                      <path d={`M ${HEAD_R + 4} ${HEAD_Y + 16} Q ${HEAD_R + 10} ${HEAD_Y + 46} 22 ${HEAD_Y + 42}`} />
                    </g>
                  )}
                  {look.accessories.includes('pencil') && (
                    <g transform={`translate(${HEAD_R - 6} ${HEAD_Y - 20}) rotate(-70)`}>
                      <rect x={-5} y={-30} width={10} height={60} rx={2} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
                      <path d="M -5 30 L 0 40 L 5 30 Z" fill={look.skin} stroke={C.ink} strokeWidth={3} />
                    </g>
                  )}
                  {sweat > 0.01 && (
                    <g transform={`translate(${-HEAD_R + 8} ${HEAD_Y - 24}) scale(${f2(0.4 + 0.6 * sweat)})`} opacity={f2(Math.min(1, sweat * 1.5))}>
                      <path d="M 0 -15 Q 9 -2 9 5 A 9 9 0 0 1 -9 5 Q -9 -2 0 -15 Z" fill={C.tealLight} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              </g>
            </g>
          )}
          {/* front arm pass */}
          {drawFrontArm && (frontL || frontR) && (
            <g transform={`translate(0 ${f2(xf.hd)})`}>
              {/* with both arms in front, the frontTop arm (and anything it holds) is drawn last */}
              {frontR && !topR && RArm}
              {frontL && LArm}
              {frontR && topR && RArm}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

/**
 * Does the frontal rig drawn at `place` (feet x, y in world px, scale) cover the screen point q? A pose-independent
 * approximation of the Character2 silhouette (head and hair, torso with the arms, legs) in rig px; `growPx` (world px)
 * widens it for clearance checks. One copy for every scene (S1, S3, S9 had private `rigHides`).
 */
export const rigCovers = (place: {x: number; y: number; scale: number}, q: {x: number; y: number}, growPx = 0) => {
  const lx = (q.x - place.x) / place.scale;
  const ly = (q.y - place.y) / place.scale;
  const gr = growPx / place.scale;
  if ((lx / (92 + gr)) ** 2 + ((ly + 388) / (100 + gr)) ** 2 < 1) return true; // head and hair
  if (Math.abs(lx) < 82 + gr && ly > -300 - gr && ly < -140) return true; // torso and arms
  return Math.abs(lx) < 60 + gr && ly >= -140 && ly < 0; // legs
};

/**
 * Overlay-light HiddenTest for the people: a light-plane point that lies behind a figure (plan z less than the figure's
 * z + 5 cm) is hidden where it falls inside that figure's drawn silhouette, so a W -> H leg ends at his outline instead
 * of crossing his chest, and fans and dots pass behind both people. OR it with lib/room partitionHides.
 */
export const figuresHide = (s: ViewState, h: number, figs: {z: number; place: {x: number; y: number; scale: number}}[]): HiddenTest => (p) => {
  const q = projectWith(s, {x: p.x, z: p.z, h: p.h ?? h});
  return figs.some((f) => p.z < f.z + 0.05 && rigCovers(f.place, q));
};

/** Hit cue when light reaches a figure from behind (the leg itself is hidden by the partition and his body): a crisp
 *  saffron rim on the wall-side (up-left) outline, as a CSS filter for <Character2 style={{...rigStyle(..), filter}}>.
 *  `t` 0..1 (e.g. tw(g, hit - 1, 3) * (1 - tw(g, hit + 6, 10))). */
export const rimFlash = (t: number, scale: number, color = C.saffron): string | undefined => {
  if (t <= 0.01) return undefined;
  const n = parseInt(color.slice(1), 16);
  const rgba = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.min(1, t).toFixed(3)})`;
  return `drop-shadow(${(-6 * scale).toFixed(1)}px ${(-5 * scale).toFixed(1)}px 0 ${rgba})`;
};
