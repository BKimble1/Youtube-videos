// V2 timeline. Every beat is keyed to the approved narration's measured word times (data/timeline.json); every
// value is a pure function of t. One new action, angle or piece of information about every second.
//   open    0     -> Wyatt     backward foot close-up -> widen to the fitted leg and ball -> flex -> strike -> ball at the lens
//   scan    Wyatt -> Surgeons  the ball's circle matches a round knee scan; the diseased bone shows itself
//   anat    Surgeons -> They   side anatomy: the diseased middle separates; follow the kept shin, ankle and foot
//   turn    They  -> and       the half-turn about the shin's long axis, a steady shot of its own
//   attach  and   -> That      the shin rises to the thigh; widen to Wyatt in profile, toes pointing back
//   rails   That  -> When      rehab rails, low three-quarter: one supported knee bend
//   bed     When  -> And       recovery: toes against the blanket, a wiggle creases it, his eyes, a slight smile
//   lace    And   -> tug       the crease matches a loose lace pulled snug
//   step    tug   -> that      the cleat plants; one confident approach step (low front three-quarter)
//   kick    that  -> end       the whole kid: plant, weight over, strike, he watches the ball; the bent leg -> frame 0
import {DUR, word, clamp, ss, ss5, lerp} from '../lib';
import {Cam, CKey, glide, travel} from '../camera';
import {spline, splineV} from '../motion';
import {BPose} from './body';
import {kickPose, legTo, happy, focus, ANK} from './poses';
import {EXPR_NEUTRAL, Expr, mixExpr} from '../dc/Head';
import {V} from '../dc/math';
import {DIMW, dirA} from '../art/wyatt';

const w = (s: string, n = 0) => word(s, n).start;
export const T = {
  turned: w('turned'), ankle: w('ankle'), working: w('working'), knee: w('knee'),
  wyatt: w('wyatt'), bone: w('bone'), cancer: w('cancer'),
  surgeons: w('surgeons'), remove: w('remove'), knee2: w('knee', 1), save: w('save'), foot: w('foot'),
  they: w('they', 1), lower: w('lower'), halfway: w('halfway'), around: w('around'),
  and: w('and'), attached: w('attached'), thigh: w('thigh'), with: w('with'), toes: w('toes'), pointing: w('pointing'), behind: w('behind'), him: w('him'),
  that: w('that'), backward: w('backward'), bent: w('bent'), same: w('same'), other: w('other'), knee3: w('knee', 2),
  when: w('when'), woke: w('woke'), wiggle: w('wiggle'), toes2: w('toes', 1),
  and2: w('and', 1), learned: w('learned'), use: w('use'), newleg: w('new'), leg2: w('leg', 1),
  that2: w('that', 1), foot2: w('foot', 1), helped: w('helped'), kick: w('kick'), soccer: w('soccer'), ball: w('ball'),
};
export type Shot2 = 'open' | 'scan' | 'anat' | 'turn' | 'attach' | 'rails' | 'bed' | 'lace' | 'step' | 'kick';
export const CUTS: [number, Shot2][] = [
  [0, 'open'], [T.wyatt, 'scan'], [T.surgeons - 0.06, 'anat'], [T.they - 0.04, 'turn'], [T.and - 0.02, 'attach'],
  [T.that - 0.02, 'rails'], [T.when - 0.02, 'bed'], [T.and2 - 0.02, 'lace'], [T.learned + 0.17, 'step'], [T.that2 - 0.04, 'kick'],
];
export const shot2At = (t: number): Shot2 => {
  let s: Shot2 = 'open';
  for (const [t0, n] of CUTS) if (t >= t0) s = n;
  return s;
};
export const shotStart = (n: Shot2) => CUTS.find((c) => c[1] === n)![0];
export const shotEnd = (n: Shot2) => { const i = CUTS.findIndex((c) => c[1] === n); return i + 1 < CUTS.length ? CUTS[i + 1][0] : DUR; };

// ------------------------------------------------------------------------------------- the pitch (open + kick)
export const BALL = {x: -33, y: -11, r: 11};
const STAG = {x: -15, y: -0.8};
const SUPPORT = {x: -15, y: -ANK};
/** frame 0's leg: thigh nearly vertical, the turned ankle bent so his own foot points straight back */
const NEAR0 = {hip: 4, knee: 58};
const H0 = {x: 0, y: -72};
export const A0 = {x: H0.x + 35 * dirA(NEAR0.hip).x, y: H0.y + 35 * dirA(NEAR0.hip).y};
const PA0 = {x: A0.x + DIMW.shin * dirA(NEAR0.hip - NEAR0.knee).x, y: A0.y + DIMW.shin * dirA(NEAR0.hip - NEAR0.knee).y};
/** frame 0's camera: tight on the backward foot and the other knee beside it */
export const CAM0: Cam = {x: A0.x - 2.6, y: A0.y + 1.5, w: 38, eye: -40};
export const STRIKE1 = T.knee - 0.08; // the opening strike, on "knee"
export const STRIKE2 = T.kick + 0.14; // the closing strike
/** the toes' small flex that is already beginning in frame 0 (and ends the loop) */
const toeFlex = (t: number) => {
  const u = ((t + 0.3) % DUR) / 1; // phase so it is mid-rise at t = 0 and at the loop
  void u;
  const a = (x: number) => Math.max(0, Math.sin(Math.PI * clamp(x)));
  return 30 * a((t + 0.25) / 0.9) + 30 * a((t - (DUR - 0.25)) / 0.9);
};

// near leg angles in the opening (deg): the wind-up bends the turned ankle; on "working" it straightens (the flex
// that powers the kick) before the cleat meets the ball on "knee"
const OPEN_HIP: [number, number][] = [[0, 4], [0.55, 3], [1.15, -2], [T.working - 0.05, -9], [T.working + 0.22, 2], [STRIKE1, 10], [STRIKE1 + 0.25, 42], [STRIKE1 + 0.6, 56], [T.wyatt, 58]];
const OPEN_KNEE: [number, number][] = [[0, 58], [0.55, 60], [1.15, 70], [T.working - 0.05, 80], [T.working + 0.22, 52], [STRIKE1, 14], [STRIKE1 + 0.25, 6], [STRIKE1 + 0.6, 10], [T.wyatt, 16]];
const OPEN_HX: [number, number][] = [[0, 0], [0.55, -0.5], [1.15, -1.5], [T.working, -2], [STRIKE1, -4.5], [T.wyatt, -9]];
// the closing kick: last strides from the right, support foot beside the ball, strike, follow-through, and the leg
// comes back down bent, into frame 0
const END_HX: [number, number][] = [[T.that2 - 0.1, 118], [T.that2 + 0.4, 84], [T.helped + 0.1, 44], [STRIKE2 - 0.32, 6], [STRIKE2, -3], [STRIKE2 + 0.3, -7], [DUR - 0.5, -1], [DUR, 0]];
const END_PA: [number, V][] = [
  [STRIKE2 - 0.5, {x: 34, y: -ANK}], [STRIKE2 - 0.3, {x: 44, y: -26}], [STRIKE2 - 0.14, {x: 30, y: -36}], [STRIKE2, {x: -5, y: -8.5}],
  [STRIKE2 + 0.22, {x: -36, y: -32}], [STRIKE2 + 0.45, {x: -30, y: -30}], [DUR - 0.5, {x: 14, y: -22}], [DUR, PA0],
];
const END_PITCH: [number, number][] = [[STRIKE2 - 0.5, 90], [STRIKE2 - 0.3, 58], [STRIKE2 - 0.14, 50], [STRIKE2, 98], [STRIKE2 + 0.22, 112], [STRIKE2 + 0.45, 100], [DUR - 0.5, 70]];
type Sw = {t0: number; t1: number; x0: number; x1: number; h: number};
const footOn = (t: number, sw: Sw[], x0: number) => {
  let x = x0;
  for (const s of sw) {
    if (t < s.t0) return {p: {x: s.x0, y: -ANK}, pitch: 90};
    if (t <= s.t1) {
      const u = (t - s.t0) / (s.t1 - s.t0);
      return {p: {x: lerp(s.x0, s.x1, ss5(u, 0, 1)), y: -ANK - Math.sin(Math.PI * Math.pow(u, 0.8)) * s.h}, pitch: lerp(66, 90, ss(u, 0.4, 1))};
    }
    x = s.x1;
  }
  return {p: {x, y: -ANK}, pitch: 90};
};
const END_FAR: Sw[] = [{t0: T.that2 - 0.3, t1: T.that2 + 0.14, x0: 150, x1: 72, h: 10}, {t0: T.helped - 0.1, t1: STRIKE2 - 0.34, x0: 72, x1: SUPPORT.x, h: 12}];
const END_NEAR: Sw[] = [{t0: T.that2 + 0.1, t1: T.that2 + 0.58, x0: 112, x1: 34, h: 11}];

export const pitchPose = (t: number): {pose: BPose; ball: {x: number; y: number; spin: number; gone: boolean; far?: number}; toe: number} => {
  const toe = toeFlex(t);
  if (t < T.that2 - 0.5) {
    // the opening
    const Hx = spline(t, OPEN_HX);
    const H = {x: Hx, y: -72 + 0.8 * Math.sin(Math.PI * ss(t, STRIKE1 - 0.3, STRIKE1 + 0.3))};
    const hip = spline(t, OPEN_HIP), knee = spline(t, OPEN_KNEE);
    const near = {hip, knee, ank: lerp(0, -6, ss(t, STRIKE1 - 0.2, STRIKE1))};
    const wind = ss(t, 0.6, T.working) * (1 - ss(t, STRIKE1, STRIKE1 + 0.3));
    const strike = ss(t, T.working, STRIKE1 + 0.1);
    const pose = kickPose({
      H, stag: STAG, fFoot: SUPPORT, nearPA: {x: 0, y: 0}, nearPitch: 90, chest: lerp(2, -6, wind) + 10 * strike * (1 - ss(t, STRIKE1 + 0.3, T.wyatt)), pelvis: lerp(3, -2, wind) + 6 * strike,
      aN: {sh: lerp(-30, -52, wind) + 26 * strike, el: lerp(26, 34, wind)}, aF: {sh: lerp(46, 70, wind) - 10 * strike, el: lerp(70, 50, wind)},
      expr: mixExpr(focus, happy, ss(t, STRIKE1 + 0.1, STRIKE1 + 0.5)), neck: 10,
    });
    pose.near = near;
    const tb = t - STRIKE1;
    return {pose, toe, ball: tb < 0 ? {x: BALL.x, y: BALL.y, spin: 0, gone: false} : {x: BALL.x, y: BALL.y, spin: -tb * 18, gone: true}};
  }
  // the ending
  const Hx = spline(t, END_HX);
  const fs = footOn(t, END_FAR, 150);
  let nP: V, nPitch: number;
  if (t >= STRIKE2 - 0.5) { nP = splineV(t, END_PA); nPitch = t >= DUR - 0.5 ? lerp(70, 90 + (NEAR0.hip - NEAR0.knee) - 0, 0) : spline(t, END_PITCH); }
  else { const f = footOn(t, END_NEAR, 112); nP = f.p; nPitch = f.pitch; }
  const stance = fs.p.y > -ANK - 0.5 ? fs.p : null;
  let Hy = -71 + 1.4 * Math.sin((t - T.that2) * Math.PI * 4) * (1 - ss(t, STRIKE2 - 0.6, STRIKE2 - 0.3));
  if (stance) Hy = Math.max(Hy, stance.y - Math.sqrt(Math.max(0, 65.5 ** 2 - (Hx + STAG.x - stance.x) ** 2)));
  if (nP.y > -ANK - 0.5) Hy = Math.max(Hy, nP.y - Math.sqrt(Math.max(0, 65.5 ** 2 - (Hx - nP.x) ** 2)));
  // settle exactly onto frame 0's hip
  Hy = lerp(Hy, -72, ss(t, DUR - 0.6, DUR));
  const H = {x: Hx, y: Hy};
  const run = 1 - ss(t, STRIKE2 - 0.5, STRIKE2 - 0.25);
  const ph = Math.sin((t - T.that2) * Math.PI * 2.1);
  const after = ss(t, STRIKE2 + 0.05, STRIKE2 + 0.5);
  const back = ss(t, DUR - 0.6, DUR);
  const pose = kickPose({
    H, stag: STAG, fFoot: fs.p, nearPA: nP, nearPitch: nPitch,
    chest: lerp(lerp(12, -4, ss(t, STRIKE2 - 0.4, STRIKE2 - 0.1)) + 10 * ss(t, STRIKE2 - 0.1, STRIKE2 + 0.1) * (1 - after), 2, back), pelvis: lerp(6, 3, back),
    aN: {sh: lerp(lerp(-40 * ph, -50, 1 - run), -30, back), el: lerp(lerp(60, 34, 1 - run), 26, back)},
    aF: {sh: lerp(lerp(40 * ph, 70, 1 - run), 46, back), el: lerp(lerp(64, 52, 1 - run), 70, back)},
    expr: mixExpr(mixExpr(happy, focus, ss(t, STRIKE2 - 0.6, STRIKE2 - 0.2) * (1 - after)), focus, back), neck: lerp(4, 10, back) - 8 * after * (1 - back),
  });
  pose.far = legTo({x: H.x + STAG.x, y: H.y + STAG.y}, fs.p, fs.pitch);
  if (t >= DUR - 0.5) {
    // the last half-second blends to frame 0's exact leg angles
    const u = ss5(t, DUR - 0.5, DUR);
    pose.near = {hip: lerp(pose.near.hip, NEAR0.hip, u), knee: lerp(pose.near.knee, NEAR0.knee, u), ank: lerp(pose.near.ank, 0, u)};
  }
  // he watches the ball go
  pose.expr = {...pose.expr, gx: lerp(pose.expr.gx, -0.9, after * (1 - back)), gy: lerp(pose.expr.gy, -0.1, after * (1 - back))};
  const tb = t - STRIKE2;
  const ball = tb < 0 ? {x: BALL.x, y: BALL.y, spin: 0, gone: false} : {x: BALL.x - 230 * tb, y: Math.min(BALL.y, BALL.y - 170 * tb + 260 * tb * tb), spin: -tb * 16, gone: false, far: tb};
  return {pose, toe, ball};
};
/** frame 0's pose (also the loop's end) */
export const POSE0 = () => pitchPose(0).pose;
export {PA0, H0, NEAR0, SUPPORT, STAG, EXPR_NEUTRAL};
export type {Expr};

export const openCam = (t: number): Cam => {
  const keys: CKey[] = [
    [0, CAM0],
    [0.55, {x: -4, y: -41, w: 80, eye: -40}],
    [T.working - 0.1, {x: 4, y: -42, w: 80, eye: -40}, travel],
    [STRIKE1 + 0.1, {x: -10, y: -38, w: 70, eye: -40}, travel],
    [T.wyatt, {x: -16, y: -40, w: 68, eye: -40}, travel],
  ];
  return glide(t, keys);
};
export const kickCam = (t: number): Cam => {
  const Hx = spline(t, END_HX);
  const keys: CKey[] = [
    [shotStart('kick'), {x: Hx - 18, y: -74, w: 120, eye: -62}],
    [STRIKE2 - 0.35, {x: -14, y: -72, w: 118, eye: -60}, travel],
    [STRIKE2 + 0.45, {x: -36, y: -74, w: 124, eye: -60}, travel],
    [STRIKE2 + 0.75, {x: -32, y: -72, w: 120, eye: -60}, travel],
    [DUR - 0.62, {x: -14, y: -66, w: 104, eye: -56}, travel],
    [DUR, CAM0, travel],
  ];
  const c = glide(t, keys);
  if (t < STRIKE2 - 0.35) c.x = lerp(Hx - 18, c.x, ss(t, STRIKE2 - 0.9, STRIKE2 - 0.35));
  return c;
};
/** the socket finish: the illustrative cutaway in the opening and as the ending pushes into frame 0 */
export const socketClear = (t: number) => (t < T.that2 - 0.5 ? 1 : ss(t, DUR - 0.55, DUR - 0.1));
