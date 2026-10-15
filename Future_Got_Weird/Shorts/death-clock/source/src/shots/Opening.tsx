// V3 opening, 0-5.8 s: the supported collapse. He is already in distress (right hand at his chest); the knees give,
// the hips drop straight down over planted feet (leg IK keeps the shoes where they stand), the left hand reaches
// for the grass beside his hip, contacts, the elbow gives under the weight and locks, and the torso settles
// leaning on that arm. The camera is low and three-quarter, then follows the bracing wrist into the band.
import {EXPR_GASP, EXPR_PAIN, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {ManPose} from '../art/Man';
import {DogPose, DOG_IDLE} from '../art/Dog';
import {clamp, easeInOut, easeOut, inv, lerp, noise1, settle} from '../lib/math';
import {SKey, spline, splineRec, spring} from '../lib/motion';
import {B} from '../lib/timeline3';
import {GROUND, followThrough} from './StreetShots';

// feet stay where they stand through the whole collapse
export const FOOT_L = {x: 340, y: GROUND - 36};
export const FOOT_R = {x: 430, y: GROUND - 44};
/** where the left hand meets the grass and stays */
export const PLANT = {x: 616, y: GROUND - 14};

const P0: ManPose = {
  x: 640, y: 1214, s: 1.22, torso: 18, chest: 14, neck: 12, turn: 0.45, pelvis: 6,
  lTu: -300, lTv: 40, lWx: PLANT.x, lWy: PLANT.y, lW: 0, lElb: -1, lWr: 8,
  rTu: -84, rTv: -2, rWx: 560, rWy: GROUND, rW: 0, rElb: 1, rWr: -16,
  lHip: -6, lKnee: 20, lAnk: 0, rHip: 10, rKnee: 16, rAnk: 4, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.4,
  lAx: FOOT_L.x, lAy: FOOT_L.y, lA: 1, rAx: FOOT_R.x, rAy: FOOT_R.y, rA: 1,
};
const K = (o: Partial<ManPose>): ManPose => ({...P0, ...o});

/** The settled, supported pose: sitting on the grass, knees up, leaning on the locked left arm. */
export const PROP: ManPose = K({x: 672, y: 1712, torso: 16, chest: 34, neck: -12, pelvis: 18, lW: 1, lElb: -1, lWr: 84, turn: 0.42});

// frame keys (film frames; the low three-quarter shot starts at frame 8, mid-buckle)
export const COLLAPSE: SKey<ManPose>[] = [
  [0, K({y: 1236, torso: 10, chest: 18, neck: 10})],
  [8, K({y: 1290, torso: 10, chest: 20, neck: 8, lTu: -290, lTv: 10})],
  // the knees give: the legs still carry him, the hips sink forward toward the feet and the torso folds over them,
  // the left hand starts its reach for the grass; then the legs fail and he sits back as he drops (y: hipFallY)
  [18, K({x: 634, y: 1360, torso: 15, chest: 24, neck: 4, lTu: -250, lTv: -40, lW: 0.35, lWr: 40})],
  [28, K({x: 662, y: 1506, torso: 15, chest: 27, neck: 0, pelvis: 12, lW: 0.8, lWr: 70})],
  // hips meet the grass; the upper back keeps curling forward and the hand meets the grass a beat later
  [35, K({x: 672, y: 1716, torso: 13, chest: 30, neck: -4, pelvis: 18, lW: 0.96, lWr: 80}), 'hit'],
  [39, K({x: 672, y: 1714, torso: 15, chest: 33, neck: -8, pelvis: 18, lW: 1, lWr: 84}), 'hit'],
  // the weight goes onto the arm: the shoulder lowers, the elbow gives, then locks as he settles
  [45, K({x: 672, y: 1712, torso: 18, chest: 37, neck: -6, pelvis: 18, lW: 1, lWr: 84})],
  [56, {...PROP}, 'stop'],
];

/** V4: after the hips meet the grass their height has its own keys, starting at rest. With one shared tangent the
 *  'hit' arrival at 35 overshot about 17 units into the ground and rebounded, which kicked the elbow and the head. */
const HIP_LANDED: [number, number, ('auto' | 'stop' | 'hit')?][] = [
  [B.hipHit, COLLAPSE[4][1].y, 'stop'],
  [39, COLLAPSE[5][1].y],
  [45, COLLAPSE[6][1].y],
  [56, PROP.y, 'stop'],
];

/** V4 polish: the hips' height from the cut to the impact. It was one constant ~16 units/frame glide (a sit onto an
 *  invisible chair). Now the legs fail progressively: the hips' acceleration grows linearly from the cut (constant
 *  jerk), so they never drift at a steady speed, and they land at exactly B.hipHit at about 33 units/frame. */
const FALL_V0 = 7; // units/frame at the cut: he is already buckling
const hipFallY = (f: number) => {
  const y0 = COLLAPSE[1][1].y;
  const T = B.hipHit - B.cut;
  const J = (6 * (COLLAPSE[4][1].y - y0 - FALL_V0 * T)) / T ** 3;
  const t = f - B.cut;
  return y0 + FALL_V0 * t + (J * t ** 3) / 6;
};

const collapseBody = (f: number): ManPose => {
  let m = splineRec(f, COLLAPSE);
  if (f >= B.cut && f <= B.hipHit) m = {...m, y: hipFallY(f)};
  if (f > B.hipHit) m = {...m, y: spline(f, HIP_LANDED)};
  // tremor while still up, and laboured breathing once down
  const up = 1 - inv(26, 36, f);
  const down = inv(40, 60, f);
  m = {...m, torso: m.torso + up * noise1(f * 0.7, 3) * 1.1, neck: m.neck + noise1(f * 0.5, 9) * 1.2, breath: 0.5 + 0.5 * Math.sin(f * (0.32 + 0.1 * up))};
  // the hips land with weight: a small compression and recovery of the pelvis height (no bounce in the air)
  if (f > 35) {
    const st = settle((f - 35) / 30, 4.5, 13);
    m = {...m, y: m.y + (1 - st) * 4};
  }
  // laboured breathing once down: the chest lifts and drops over the locked arm
  if (down > 0) m = {...m, torso: m.torso + down * 0.6 * Math.sin(f * 0.21), chest: m.chest + down * 1.4 * Math.sin(f * 0.21 + 0.6), breath: 0.5 + 0.5 * Math.sin(f * 0.21 + 0.6)};
  return m;
};

export type OpenState = {man: ManPose; expr: Expr; lHand: HandPose; rHand: HandPose; dog: DogPose; hairSway: number; blink: number};

export const collapseState = (f: number): OpenState => {
  const ft = followThrough(collapseBody, f);
  const body = collapseBody(f);
  const man = {...body, neck: body.neck + ft.headLag};
  const expr =
    f < 20 ? mixExpr(EXPR_PAIN, EXPR_WINCE, inv(6, 20, f)) : f < 38 ? mixExpr(EXPR_WINCE, EXPR_GASP, inv(30, 38, f)) : mixExpr(EXPR_GASP, {...EXPR_PAIN, gx: -0.2, gy: 0.75}, inv(40, 56, f));
  // the reaching hand opens before contact, spreads on contact and grips the grass under the weight
  const lHand = f < 16 ? HAND_RELAXED : f < 34 ? mixHand(HAND_RELAXED, HAND_BRACE, inv(16, 30, f)) : mixHand(HAND_BRACE, {...HAND_BRACE, curl: [0.16, 0.16, 0.2, 0.22], spread: 0.95}, inv(40, 50, f));
  const rHand = mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.56, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  const back = easeOut(inv(24, 40, f));
  const dog: DogPose = {
    ...DOG_IDLE,
    x: 1010 + 60 * back,
    y: GROUND - 10,
    s: 1.4,
    facing: -1,
    head: lerp(20, 30, inv(20, 36, f)),
    ears: clamp(spring((t) => lerp(0.35, 0.95, inv(22, 32, t)), f, 0.09, 0.3), 0, 1.15),
    tail: spring((t) => lerp(12, -6, inv(26, 40, t)), f, 0.07, 0.35),
    lean: 7 * Math.sin(Math.PI * inv(26, 46, f)),
    step: f * 0.5,
    stepAmt: Math.sin(Math.PI * inv(26, 44, f)) * 0.8,
    worry: lerp(0.6, 1, inv(22, 36, f)),
  };
  const blink = f > 58 ? clamp(1 - Math.abs(((f - 58) % 70) - 3) / 3) : 0;
  return {man, expr, lHand, rHand, dog, hairSway: ft.hairSway, blink};
};

/** V4: the one dog pose for the whole film (Journey3 and Aftermath3 both read it, so the collar, and the leash clipped
 *  to it, come from one place). f is story time: Aftermath3 passes its loop time (f >= TOTAL for frames 0-7).
 *  The collapse startle (step back, lean, perked ears), then alert idling beside him, then, after green, it sits. */
export const dogAt = (f: number): DogPose => {
  if (f < B.settle) return collapseState(f).dog;
  if (f < B.map0) {
    const d0 = collapseState(B.settle).dog;
    return {...d0, head: d0.head + 5 * Math.sin(f * 0.05), tail: d0.tail + 3 * Math.sin(f * 0.19), stepAmt: 0, lean: 2 * Math.sin(f * 0.04)};
  }
  const sit = easeInOut(inv(B.green, B.life, f));
  return {
    x: 1070,
    y: 1790,
    s: 1.4,
    facing: -1,
    sit,
    head: 26 + 4 * Math.sin(f * 0.05),
    ears: 0.95,
    tail: lerp(-6, 14, easeInOut(inv(B.rise0, B.green, f))) + 6 * Math.sin(f * 0.3) * sit,
    lean: 0,
    step: 0,
    stepAmt: 0,
    worry: lerp(1, 0.4, easeInOut(inv(B.rise0, B.life, f))),
  };
};

/** Low three-quarter framing of the collapse (camera y below his chest, ground in the lower third). */
/** V4 polish: the camera takes up only part of the hips' drop and trails it on a spring (it lags the fall instead of
 *  cancelling it), catches up after the impact and hands over to the original path by 46; a small, quickly damped
 *  jolt as the hips hit. */
const CAM_FOLLOW = 0.51;
const CAM_K = 0.5;
const camDrop = (f: number) => 1310 + CAM_FOLLOW * (hipFallY(clamp(f, B.cut, B.hipHit)) - COLLAPSE[1][1].y);
export const collapseCam = (f: number) => ({
  x: spline(f, [[8, 560], [24, 540], [40, 490], [56, 480]]),
  y:
    lerp(spring(camDrop, f, CAM_K, 1, 30), spline(f, [[8, 1310], [24, 1400], [40, 1520], [56, 1540]]), easeInOut(inv(40, 46, f))) -
    (f > B.hipHit ? 3 * Math.exp(-(f - B.hipHit) / 3) * Math.sin((f - B.hipHit) * 1.9) : 0),
  z: spline(f, [[8, 1.34], [24, 1.38], [40, 1.5], [56, 1.56]]),
});
