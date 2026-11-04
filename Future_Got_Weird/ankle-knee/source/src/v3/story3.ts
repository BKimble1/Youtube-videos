// V3 timeline, keyed to the V3 narration master (the approved take with dead air capped at 0.30 s;
// data/timeline_v3.json). Every value is a pure function of t.
//   open    0      backward foot close-up -> follow the flex down the connected shin -> one strike (~1.1 s) -> ball at the lens
//   scan    1.8    V2's ball-to-scan match; enter the knee image; "bone cancer" identifies the diseased bone
//   anat    4.45   the scan's bone contours match into the side anatomy; the middle separates; travel with the kept piece
//   turn    They   a purpose-drawn three-quarter view: the heel passes toward the lens, the toes come round backward
//   attach  and    the shin rises into line with the thigh and seats (complete before anything widens)
//   rehab   with   proof shot: hip -> both legs in profile (shoe toward the front rail, toes toward the bench); past the
//                  near rail into a lower angle for one weight-bearing bend
//   foot    When   recovery: the turned foot, big toe and small toes; one wiggle creases the blanket
//   face    (cut on the wiggle) Wyatt notices; a small smile; a blanket fold
//   lace    And    the fold matches a lace pulled tight on a cleat
//   plant   tug    the cleat plants on turf
//   kick    to use the wide shot: approach, planted support foot, strike toward goal, follow-through -> frame 0
import TL from '../data/timeline_v3.json';
import {clamp, ss, ss5, lerp} from '../lib';
import {Cam, CKey, glide, travel} from '../camera';
import {spline} from '../motion';
import {BPose} from '../v2/body';
import {legTo, happy, focus, ANK, HAND_EASY, HAND_OPEN} from '../v2/poses';
import {mixExpr} from '../dc/Head';
import {V} from '../dc/math';
import {DIMW, dirA} from '../art/wyatt';

export const DUR3: number = TL.duration;
export const FRAMES3: number = TL.frames;
export type Cap3 = {text: string; emph: string[]; start: number; end: number; show: number; hide: number};
export const CAPS3 = TL.captions as Cap3[];
const WORDS3 = TL.words as {word: string; start: number; end: number}[];
const k = (s: string) => s.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');
export const w3 = (s: string, n = 0) => {
  const hit = WORDS3.filter((x) => k(x.word) === k(s))[n];
  if (!hit) throw new Error(`word not in narration: ${s} #${n}`);
  return hit.start;
};
export const T3 = {
  ankle: w3('ankle'), working: w3('working'), knee: w3('knee'), wyatt: w3('wyatt'), bone: w3('bone'), cancer: w3('cancer'),
  surgeons: w3('surgeons'), remove: w3('remove'), knee2: w3('knee', 1), but: w3('but'), save: w3('save'), foot: w3('foot'),
  they: w3('they', 1), halfway: w3('halfway'), around: w3('around'), and: w3('and'), attached: w3('attached'), thigh: w3('thigh'),
  with: w3('with'), toes: w3('toes'), pointing: w3('pointing'), behind: w3('behind'), him: w3('him'),
  that: w3('that'), backward: w3('backward'), bent: w3('bent'), same: w3('same'), other: w3('other'), knee3: w3('knee', 2),
  when: w3('when'), woke: w3('woke'), wiggle: w3('wiggle'), toes2: w3('toes', 1),
  and2: w3('and', 1), learned: w3('learned'), use: w3('use'), newleg: w3('new'), leg2: w3('leg', 1),
  that2: w3('that', 1), foot2: w3('foot', 1), helped: w3('helped'), him2: w3('him', 1), kick: w3('kick'), ball: w3('ball'),
};
export type Shot3 = 'open' | 'scan' | 'anat' | 'turn' | 'attach' | 'rehab' | 'foot' | 'face' | 'lace' | 'plant' | 'kick';
export const STRIKE_A = 1.12; // the opening strike
export const SCAN_T = 1.8; // the ball fills the lens; the scan circle takes over
export const FACE_T = T3.wiggle + 0.3; // cut on the wiggle's movement
export const CUTS3: [number, Shot3][] = [
  [0, 'open'], [SCAN_T, 'scan'], [T3.cancer + 0.47, 'anat'], [T3.they - 0.05, 'turn'], [T3.and - 0.05, 'attach'],
  [T3.with - 0.03, 'rehab'], [T3.when - 0.04, 'foot'], [FACE_T, 'face'], [T3.and2 - 0.04, 'lace'], [T3.learned + 0.08, 'plant'],
  [T3.learned + 0.4, 'kick'],
];
export const shot3At = (t: number): Shot3 => { let s: Shot3 = 'open'; for (const [t0, n] of CUTS3) if (t >= t0) s = n; return s; };
export const start3 = (n: Shot3) => CUTS3.find((c) => c[1] === n)![0];
export const end3 = (n: Shot3) => { const i = CUTS3.findIndex((c) => c[1] === n); return i + 1 < CUTS3.length ? CUTS3[i + 1][0] : DUR3; };

// ------------------------------------------------------------------------------------ the pitch (open + kick)
export const BALL3 = {x: -38, y: -11, r: 11};
export const SUPPORT3: V = {x: -11, y: -ANK};
export const GOAL_X = -250, GOAL_D = 720;
const STAG0 = {x: -14, y: -0.8};
const H0 = {x: 0, y: -71.5};
const NEAR0 = {hip: -4, knee: 60};
export const A0 = {x: H0.x + 35 * dirA(NEAR0.hip).x, y: H0.y + 35 * dirA(NEAR0.hip).y};
/** frame 0: tight on the backward foot at knee height; his ordinary knee and forward shoe beside it; the socket rim,
 *  pylon and cleat connected below; the ball just out of frame (it appears as the lens follows the flex down) */
export const CAM0: Cam = {x: -1, y: -27, w: 50, eye: -40};
const toeFlex = (t: number) => 18 * Math.max(0, Math.sin(Math.PI * clamp((t + 0.2) / 0.8))) + 18 * Math.max(0, Math.sin(Math.PI * clamp((t - (DUR3 - 0.2)) / 0.8)));

// the opening: the turned ankle is already straightening at frame 0 (the leg on its way through); contact ~1.1 s
const O_HIP: [number, number][] = [[0, -4], [0.45, -1], [0.85, 5], [STRIKE_A, 10], [STRIKE_A + 0.25, 32], [SCAN_T, 46]];
const O_KNEE: [number, number][] = [[0, 60], [0.45, 55], [0.85, 34], [STRIKE_A, 14], [STRIKE_A + 0.25, 6], [SCAN_T, 10]];
const O_HX: [number, number][] = [[0, 0], [0.5, -2], [STRIKE_A, -8], [SCAN_T, -12]];
// the closing kick: three connected poses (approach, planted support foot, follow-through) and back into frame 0
export const STRIKE_B = T3.him2 + 0.15;
const K0 = start3('kick');
type Sw = {t0: number; t1: number; x0: number; x1: number; h: number};
const FAR_SW: Sw[] = [{t0: K0 + 0.02, t1: K0 + 0.5, x0: 168, x1: 82, h: 10}, {t0: K0 + 1.06, t1: STRIKE_B - 0.5, x0: 82, x1: SUPPORT3.x, h: 12}];
const NEAR_SW: Sw[] = [{t0: K0 + 0.55, t1: K0 + 1.02, x0: 122, x1: 34, h: 11}];
const K_HX: [number, number][] = [[K0 - 0.3, 150], [K0 + 0.5, 112], [K0 + 1.02, 64], [STRIKE_B - 0.5, 10], [STRIKE_B, -8], [STRIKE_B + 0.35, -12], [DUR3 - 0.6, -2], [DUR3, 0]];
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
// near leg after the last near stride: backswing, strike, follow-through, down and bent into frame 0's angles
const K_HIP: [number, number][] = [[STRIKE_B - 0.5, 0], [STRIKE_B - 0.22, -14], [STRIKE_B, 10.5], [STRIKE_B + 0.25, 44], [STRIKE_B + 0.5, 30], [DUR3 - 0.55, 0], [DUR3, NEAR0.hip]];
const K_KNEE: [number, number][] = [[STRIKE_B - 0.5, 20], [STRIKE_B - 0.22, 78], [STRIKE_B, 14], [STRIKE_B + 0.25, 6], [STRIKE_B + 0.5, 30], [DUR3 - 0.55, 58], [DUR3, NEAR0.knee]];

export type PitchState = {pose: BPose; toe: number; ball: {x: number; y: number; spin: number; D: number; show: boolean}};
export const pitchState3 = (t: number): PitchState => {
  const toe = toeFlex(t);
  if (t < T3.and2) {
    const H = {x: spline(t, O_HX), y: H0.y};
    const hip = spline(t, O_HIP), knee = spline(t, O_KNEE);
    const s = ss(t, 0.5, STRIKE_A);
    const pose: BPose = {
      hip: H, pelvis: 3 + 4 * s, chest: -2 + 9 * s, near: {hip, knee, ank: lerp(0, -6, s)},
      far: legTo({x: H.x + STAG0.x, y: H.y + STAG0.y}, SUPPORT3, 90), stag: STAG0,
      aN: {sh: lerp(-34, -52, s), el: lerp(26, 22, s)}, aF: {sh: lerp(52, 74, s), el: lerp(64, 40, s)}, hN: HAND_EASY, hF: HAND_OPEN, wN: -8, wF: 12,
      neck: 10, turn: 0.95, expr: mixExpr(focus, happy, ss(t, STRIKE_A, STRIKE_A + 0.4)), blink: 0,
    };
    return {pose, toe, ball: {...BALL3, spin: 0, D: 170, show: t < STRIKE_A}};
  }
  const Hx = spline(t, K_HX);
  const fs = footOn(t, FAR_SW, 168);
  const kick = t >= STRIKE_B - 0.5;
  const nf = footOn(t, NEAR_SW, 122);
  // the plant insert: the prosthetic cleat comes down onto the turf (cut on the lace's tug)
  const pl = start3('plant');
  if (t < pl + 0.25) nf.p.y = lerp(-25, -ANK, Math.pow(ss(t, pl - 0.04, pl + 0.2), 1.4));
  const turn = ss(t, STRIKE_B - 0.45, STRIKE_B) * (1 - ss(t, STRIKE_B + 0.3, DUR3 - 0.2));
  const stag = {x: lerp(lerp(-6, STAG0.x, ss(t, DUR3 - 0.8, DUR3)), -19, turn), y: lerp(-0.6, -0.75, turn) + (STAG0.y + 0.6) * ss(t, DUR3 - 0.8, DUR3)};
  let Hy = -71 + 1.3 * Math.sin((t - K0) * Math.PI * 4) * (1 - ss(t, STRIKE_B - 0.7, STRIKE_B - 0.4));
  const planted: V[] = [];
  if (fs.p.y > -ANK - 0.5) planted.push({x: fs.p.x - stag.x, y: fs.p.y});
  if (!kick && nf.p.y > -ANK - 0.5) planted.push(nf.p);
  for (const q of planted) Hy = Math.max(Hy, q.y - Math.sqrt(Math.max(0, 65.4 ** 2 - (Hx - q.x) ** 2)));
  Hy = lerp(Hy, H0.y, ss(t, DUR3 - 0.6, DUR3));
  const H = {x: Hx, y: Hy};
  const near = kick ? {hip: spline(t, K_HIP), knee: spline(t, K_KNEE), ank: lerp(-6, 0, ss(t, STRIKE_B + 0.3, DUR3))} : legTo(H, nf.p, nf.pitch);
  const run = 1 - ss(t, STRIKE_B - 0.6, STRIKE_B - 0.3);
  const ph = Math.sin((t - K0) * Math.PI * 2.0);
  const settle = ss(t, DUR3 - 0.6, DUR3);
  const watch = ss(t, STRIKE_B + 0.05, STRIKE_B + 0.45) * (1 - settle);
  const strikeP = 1 - run;
  const pose: BPose = {
    hip: H, pelvis: lerp(6 + 4 * turn, 3, settle), chest: lerp(lerp(13, -2, strikeP) + 9 * turn, -2, settle),
    near, far: legTo({x: H.x + stag.x, y: H.y + stag.y}, fs.p, fs.pitch), stag,
    aN: {sh: lerp(lerp(-40 * ph, -50, strikeP), -34, settle), el: lerp(lerp(62, 22, strikeP), 26, settle)},
    aF: {sh: lerp(lerp(40 * ph, 78, strikeP), 52, settle), el: lerp(lerp(66, 34, strikeP), 64, settle)},
    hN: HAND_EASY, hF: HAND_OPEN, wN: -8, wF: 12, neck: lerp(4, 10, settle) - 6 * watch, turn: 0.95,
    expr: {...mixExpr(happy, focus, ss(t, STRIKE_B - 0.6, STRIKE_B - 0.2) * (1 - ss(t, STRIKE_B, STRIKE_B + 0.3)) + settle * 0.6), gx: lerp(-0.4, -0.95, watch), gy: lerp(0.5, -0.2, watch)},
    blink: 0,
  };
  // the ball: resting in the shot before the shoe reaches it, then away toward the goal
  const tb = t - STRIKE_B;
  let ball = {...BALL3, spin: 0, D: 170, show: true};
  if (tb > 0) {
    const u = Math.min(1, tb / 0.95);
    const D = 170 + (GOAL_D - 170) * (1 - (1 - u) ** 1.6);
    const x = lerp(BALL3.x, GOAL_X + 60, ss(u, 0, 1));
    const y = -11 - 80 * Math.sin(Math.PI * Math.min(1, u * 0.95)) * (1 - 0.4 * u) - 40 * u;
    ball = {x, y: Math.min(-11, y), r: 11, spin: -tb * 18, D, show: t < DUR3 - 0.35};
  }
  return {pose, toe, ball};
};
export const openCam3 = (t: number): Cam => glide(t, [
  [0, CAM0],
  [0.42, {x: -2, y: -26, w: 48, eye: -40}],
  [0.95, {x: -14, y: -34, w: 76, eye: -40}, travel],
  [SCAN_T, {x: -20, y: -36, w: 72, eye: -40}, travel],
]);
export const kickCam3 = (t: number): Cam => {
  const Hx = spline(t, K_HX);
  const keys: CKey[] = [
    [K0, {x: Hx - 22, y: -76, w: 120, eye: -64}],
    [STRIKE_B - 0.55, {x: -26, y: -76, w: 120, eye: -64}, travel],
    [STRIKE_B + 0.85, {x: -40, y: -78, w: 126, eye: -64}, travel],
    [DUR3 - 0.6, {x: -16, y: -60, w: 96, eye: -54}, travel],
    [DUR3, CAM0, travel],
  ];
  const c = glide(t, keys);
  if (t < STRIKE_B - 0.55) c.x = lerp(Hx - 22, c.x, ss(t, STRIKE_B - 1.1, STRIKE_B - 0.55));
  return c;
};
/** the socket's finish on the pitch: the rimmed cutaway in the opening and the closing push; solid while he plays */
export const socket3 = (t: number) => {
  const c = t < T3.and2 ? 1 : ss(t, DUR3 - 0.6, DUR3 - 0.15);
  return {clear: c, local: 0, rim: c};
};
export {DIMW, ss5};
