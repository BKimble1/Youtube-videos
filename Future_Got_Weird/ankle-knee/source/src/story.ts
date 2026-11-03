// The timeline. Every beat is keyed to the measured word times (data/timeline.json) and every value is a pure
// function of t. Shots:
//   S1 pitch   0 -> Wyatt      the kick already underway; follow-through; he jogs on, the lens closes on the joint
//   S2 illus   Wyatt -> That   the original leg: diseased knee, removal, the half-turn, the join (illus.tsx)
//   S4 bench   That -> When    prosthesis fitted, both legs, he sits: both knees bend together
//   S5 bed     When -> learned recovery: face and foot, one toe wiggle, a slight smile
//   S6 pitch   learned -> end  the cleat plants, weight shift, short approach, the kick that frame 0 completes
import {DUR, word, clamp, ss, ss5, lerp} from './lib';
import {Cam, CKey, glide, travel} from './camera';
import {WPose, Leg, DIMW, joints} from './art/wyatt';
import {EXPR_NEUTRAL, Expr, mixExpr} from './dc/Head';
import {spline, splineV, footOnPlan, reach, clampHip, Swing} from './motion';
import {V} from './dc/math';

export const T = {
  wyatt: word('Wyatt').start,
  bone: word('bone').start,
  cancer: word('cancer.').start,
  surgeons: word('Surgeons').start,
  remove: word('remove').start,
  knee2: word('knee', 1).start,
  save: word('save').start,
  foot: word('foot.').start,
  they: word('they', 1).start,
  turned2: word('turned', 1).start,
  around: word('around').start,
  attached: word('attached').start,
  thigh: word('thigh,').start,
  toes: word('toes').start,
  pointing: word('pointing').start,
  behind: word('behind').start,
  that: word('That').start,
  bent: word('bent').start,
  same: word('same').start,
  other: word('other').start,
  when: word('When').start,
  woke: word('woke').start,
  wiggle: word('wiggle').start,
  toes2: word('toes', 1).start,
  learned: word('learned').start,
  newleg: word('new').start,
  kick: word('kick').start,
  ball: word('ball.').start,
};
export type Shot = 'pitch1' | 'illus' | 'bench' | 'bed' | 'pitch6';
/** S2 -> S4: the illustration dissolves into the real leg in the same pose and place */
export const ILL_END = T.that + 0.02, ILL_DISS = 0.36;
export const shotAt = (t: number): Shot => (t < T.wyatt ? 'pitch1' : t < ILL_END ? 'illus' : t < T.when ? 'bench' : t < T.learned ? 'bed' : 'pitch6');

// ----------------------------------------------------------------------------------------------- the kick + jog
export const BALL = {x: 0, y: -11, r: 11};
export const CONTACT = 0.133;
const L = DUR; // the loop length: S6's last keys are S1's first ones shifted by L
/** the kicking (near, prosthetic) ankle path around the loop seam: S6's backswing -> frame 0 -> contact -> follow-through */
const KICK_PA: [number, V][] = [
  [L - 0.75, {x: 86, y: -7.7}], [L - 0.62, {x: 94, y: -20}], [L - 0.36, {x: 86, y: -38}], [L - 0.15, {x: 58, y: -31}],
  [L + 0, {x: 33, y: -21}], [L + CONTACT, {x: 24, y: -15.3}], [L + 0.27, {x: -20, y: -31}], [L + 0.46, {x: -35, y: -45}],
  [L + 0.64, {x: -38, y: -32}], [L + 0.85, {x: -40, y: -7.7}],
];
const KICK_PITCH: [number, number][] = [[L - 0.75, 90], [L - 0.62, 62], [L - 0.36, 48], [L - 0.15, 52], [L, 58], [L + CONTACT, 66], [L + 0.27, 104], [L + 0.46, 116], [L + 0.64, 104], [L + 0.85, 90]];
/** hip x across the seam and through the S1 jog / S6 approach */
const HIPX: [number, number][] = [
  [T.learned - 0.2, 290], [T.learned + 0.15, 283], [T.learned + 0.9, 266], [L - 2.85, 224], [L - 2.35, 178], [L - 1.85, 134],
  [L - 1.35, 92], [L - 0.8, 52], [L - 0.4, 40], [L, 32], [L + CONTACT, 29], [L + 0.45, 20], [L + 0.85, -10], [L + 1.32, -60],
  [L + 1.78, -108], [L + 2.24, -156], [L + 2.7, -204], [L + 3.16, -252], [L + 3.62, -300], [L + 4.0, -338],
];
// footfalls (S1 jog and S6 approach), all in loop time (S1 times + L)
const FAR_SW: Swing[] = [
  {t0: T.learned + 1.0, t1: T.learned + 1.45, x0: 292, x1: 218, h: 9},
  {t0: L - 2.3, t1: L - 1.85, x0: 218, x1: 130, h: 10},
  {t0: L - 1.3, t1: L - 0.8, x0: 130, x1: 20, h: 11},
  {t0: L + 0.92, t1: L + 1.32, x0: 20, x1: -88, h: 11},
  {t0: L + 1.84, t1: L + 2.24, x0: -88, x1: -184, h: 11},
  {t0: L + 2.76, t1: L + 3.16, x0: -184, x1: -280, h: 11},
];
const NEAR_SW: Swing[] = [
  {t0: L - 2.8, t1: L - 2.35, x0: 262, x1: 174, h: 10},
  {t0: L - 1.8, t1: L - 1.35, x0: 174, x1: 86, h: 10},
  {t0: L - 0.75, t1: L + 0.85, x0: 86, x1: -40, h: 0}, // the kick (its own path, KICK_PA)
  {t0: L + 1.38, t1: L + 1.78, x0: -40, x1: -136, h: 12},
  {t0: L + 2.3, t1: L + 2.7, x0: -136, x1: -232, h: 12},
  {t0: L + 3.22, t1: L + 3.62, x0: -232, x1: -328, h: 12},
];
/** S1's speed ramp: real time through the strike (the ball is gone by 0.35 s), slow motion for the follow-through
 *  while the lens closes on the joint, real time again as the leg comes down into the match cut */
export const rampRate = (t: number) => 1 - 0.72 * ss(t, 0.3, 0.62) * (1 - ss(t, 2.25, 2.9));
const TAU: number[] = (() => {
  const out = [0];
  for (let i = 1; i <= 400; i++) out.push(out[i - 1] + rampRate((i - 0.5) / 100) / 100);
  return out;
})();
export const tau = (t: number) => {
  if (t <= 0) return t;
  const i = Math.min(399, Math.floor(t * 100));
  return TAU[i] + (TAU[i + 1] - TAU[i]) * (t * 100 - i);
};
/** loop time: S6 runs in [learned, L), S1 runs in [L, L + wyatt) on its ramped clock */
const lt = (t: number) => (t < T.learned - 0.5 ? L + tau(t) : t);
const footState = (tt: number, sw: Swing[], x0: number) => {
  // heel-off before each swing, toes-down through the swing, flat at landing
  const f = footOnPlan(tt, sw, x0);
  let pitch = 90;
  const next = sw.find((s) => s.h > 0 && tt < s.t0 && s.t0 - tt < 0.14);
  if (next) { const k = 1 - (next.t0 - tt) / 0.14; f.p.y -= 2.8 * k; pitch = 90 - 22 * k; }
  if (!f.flat) { pitch = lerp(68, 90, ss(f.u, 0.35, 1)); f.p.y -= 2.8 * (1 - ss(f.u, 0, 0.35)); }
  return {p: f.p, pitch};
};
export const pitchState = (t: number) => {
  const tt = lt(t);
  const Hx = spline(tt, HIPX);
  // near foot: S6 plant (coming down at learned), approach swings, then the kick path around the seam
  let nP: V, nPitch: number;
  if (tt >= L - 0.75 && tt <= L + 0.85) {
    nP = splineV(tt, KICK_PA);
    nPitch = spline(tt, KICK_PITCH);
  } else if (tt < T.learned + 0.14) {
    const u = ss(tt, T.learned - 0.25, T.learned + 0.14);
    nP = {x: lerp(276, 262, ss5(u, 0, 1)), y: lerp(-30, -7.7, Math.pow(u, 1.6))};
    nPitch = lerp(80, 90, u);
  } else {
    const f = footState(tt, NEAR_SW, 262);
    nP = f.p; nPitch = f.pitch;
  }
  const ff = footState(tt, FAR_SW, 292);
  const fP = ff.p;
  // hip height: a small dip on the weight shift, a jog bob, and never so high that a planted foot floats
  const jog = ss(tt, L + 0.8, L + 1.3);
  let Hy = -70.2 + 1.6 * Math.sin(((tt - (L + 0.85)) / 0.46) * Math.PI * 2) * jog;
  Hy += 1.4 * Math.sin(Math.PI * ss(tt, T.learned + 0.1, T.learned + 1.0)) * (tt < L ? 1 : 0);
  const stagger = 3;
  const plantedN = nP.y > -8 ? [nP] : [];
  const plantedF = fP.y > -8 ? [{x: fP.x - stagger, y: fP.y}] : [];
  Hy = clampHip(Hy, Hx, [...plantedN, ...plantedF]);
  const H = {x: Hx, y: Hy};
  const near: Leg = reach(H, nP, nPitch);
  const far: Leg = reach({x: Hx + stagger, y: Hy - 0.4}, fP, ff.pitch);
  // torso, arms, face
  const kickPhase = tt >= L - 0.7 && tt <= L + 0.9 ? 1 : 0;
  const kp = ss(tt, L - 0.75, L - 0.4) * (1 - ss(tt, L + 0.6, L + 1.0));
  const lean = lerp(6, -7, kp) + (tt > L + 0.25 && tt < L + 0.7 ? -3 * Math.sin(Math.PI * (tt - L - 0.25) / 0.45) : 0);
  const ph = ((tt - (L + 0.85)) / 0.92) * Math.PI * 2;
  const swingN = Math.sin(ph) * jog;
  // walking arm swing in S6 approach
  const walk = tt < L ? ss(tt, T.learned + 0.9, T.learned + 1.3) * (1 - kp) : 0;
  const ph6 = ((tt - (T.learned + 1.0)) / 1.0) * Math.PI * 2;
  const aN = {sh: lerp(lerp(-8, -48, kp), 34 * swingN, jog) + walk * 26 * Math.sin(ph6), el: lerp(lerp(18, 34, kp), 75, jog) + walk * 20};
  const aF = {sh: lerp(lerp(8, 72, kp), -34 * swingN, jog) - walk * 26 * Math.sin(ph6), el: lerp(lerp(18, 18, kp), 75, jog) + walk * 20};
  void kickPhase;
  const happy: Expr = {...EXPR_NEUTRAL, smile: 0.95, open: 0.28, teeth: 0.55, wide: 1.05, gx: -0.5, gy: 0.35, flush: 0.4};
  const focus: Expr = {...EXPR_NEUTRAL, smile: 0.35, open: 0.06, browDown: 0.25, gx: -0.6, gy: 0.75};
  const expr = mixExpr(happy, focus, kp * 0.8);
  const pose: WPose = {x: Hx, y: Hy, lean, near, far, stagger, aN, aF, neck: 6 + 8 * kp, turn: 1, expr, blink: 0};
  // the ball: at rest until the cleat meets it, then a low drive to the left
  const tb = tt - L - CONTACT;
  const ball = tb < 0 || tt < L ? {...BALL, spin: 0, smear: 0} : {x: BALL.x - 720 * tb, y: Math.min(BALL.y, BALL.y - 170 * tb + 490 * tb * tb), r: BALL.r, spin: -tb * 26, smear: clamp(tb / 0.05)};
  return {pose, ball, tt};
};

// ---------------------------------------------------------------------------------------------------- cameras
export const CAM0: Cam = {x: 14, y: -44, w: 72, eye: -40};
export const pitchCam = (t: number): Cam => {
  const tt = lt(t);
  const Hx = spline(tt, HIPX);
  if (tt >= L) {
    // S1: frame 0, a slight drift while the ball goes, then the push onto the ankle-knee joint. The lens tracks a
    // time-smoothed joint position sideways only (a fixed height), so the swinging leg never whips the frame.
    const focusAt = (q: number) => {
      const j = joints(pitchState(Math.max(0, q)).pose);
      return j.A.x + 0.3 * (j.PA.x - j.A.x);
    };
    let fx = 0;
    const NS = 9;
    for (let i = 0; i < NS; i++) fx += focusAt(t + ((i - (NS - 1) / 2) / (NS - 1)) * 0.7) / NS;
    const k = ss5(t, 0.55, 1.6);
    const a: Cam = {x: lerp(14, fx + 4, ss5(t, 0.1, 0.55)), y: lerp(-44, -50, ss(t, 0.2, 0.6)), w: 72, eye: -40};
    const b: Cam = {x: fx + 2, y: -37, w: lerp(52, 54, ss(t, 1.5, 3.3)), eye: -40};
    return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: Math.exp(lerp(Math.log(a.w), Math.log(b.w), k)), eye: lerp(a.eye, b.eye, k)};
  }
  // S6: on the cleat as it plants, up and out to the whole boy, track the approach, down onto frame 0
  const keys: CKey[] = [
    [T.learned, {x: 262, y: -22, w: 46, eye: -30}],
    [T.learned + 0.3, {x: 263, y: -26, w: 50, eye: -32}],
    [T.learned + 1.35, {x: spline(T.learned + 1.35, HIPX) - 10, y: -82, w: 106, eye: -84}, travel],
    [L - 1.5, {x: spline(L - 1.5, HIPX) - 10, y: -78, w: 100, eye: -80}, travel],
    [L, CAM0, travel],
  ];
  const c = glide(tt, keys);
  if (tt > T.learned + 1.35 && tt < L - 1.5) c.x = spline(tt, HIPX) - 10;
  return c;
};
export const jointsAt = (p: WPose) => joints(p);
export {DIMW};

// ------------------------------------------------------------------------------------------------ the illustration
const STAND: WPose = {x: 0, y: -72.3, lean: 0, near: {hip: 0, knee: 0, ank: 0}, far: {hip: 0, knee: 0, ank: 0}, stagger: 8, aN: {sh: 4, el: 8}, aF: {sh: -4, el: 8}, neck: 0, turn: 1, expr: EXPR_NEUTRAL, blink: 0};
const CUT_POSE = () => pitchState(T.wyatt - 1e-4).pose;
/** where the hip comes to rest in the illustration (and where S4 starts) */
export const XS = (() => CUT_POSE().x - 22)();
export const illusState = (t: number) => {
  const p0 = CUT_POSE();
  const dt = t - T.wyatt;
  // carry the stride across the cut, settling to standing
  const land = ss5(dt, 0, 0.55);
  const Hx = lerp(p0.x, XS, 1 - (1 - clamp(dt / 0.55)) ** 2);
  const Hy = lerp(p0.y, -72.3, land) + lerp(0, -1.4, ss(t, T.that - 0.45, T.that));
  const hip = lerp(p0.near.hip, 0, land), knee = lerp(p0.near.knee, 0, land);
  const ghost: WPose = {...STAND, x: Hx, y: Hy, stagger: lerp(p0.stagger, 8, land), lean: lerp(p0.lean, 0, land),
    far: {hip: lerp(p0.far.hip, 0, land), knee: lerp(p0.far.knee, 0, land), ank: lerp(p0.far.ank, 0, land)},
    aN: {sh: lerp(p0.aN.sh, 4, land), el: lerp(p0.aN.el, 8, land)}, aF: {sh: lerp(p0.aF.sh, -4, land), el: lerp(p0.aF.el, 8, land)}};
  const win = ss(t, T.bone - 0.3, T.bone + 0.05) * (1 - ss(t, T.remove + 0.2, T.remove + 0.6));
  const tumor = ss(t, T.bone - 0.05, T.cancer + 0.1) * (1 - 0.35 * ss(t, T.cancer + 0.6, T.surgeons + 0.3));
  const mark = ss(t, T.surgeons, T.surgeons + 0.4);
  const cuts = ss(t, T.surgeons + 0.05, T.surgeons + 0.45);
  const split = t >= T.surgeons + 0.5;
  const midOut = ss5(t, T.remove - 0.02, T.knee2 + 0.1);
  const save = Math.sin(Math.PI * clamp((t - (T.save - 0.15)) / 1.2));
  const yaw = 180 * ss5(t, T.turned2 + 0.12, T.around + 0.3);
  const ring = ss(t, T.turned2 - 0.1, T.turned2 + 0.2) * (1 - ss(t, T.around + 0.25, T.around + 0.55));
  const rise = ss5(t, T.attached - 0.05, T.thigh + 0.05);
  const seam = ss(t, T.thigh - 0.1, T.thigh + 0.2);
  const align = ss(t, T.toes, T.toes + 0.3) * (1 - ss(t, T.that - 0.5, T.that - 0.2));
  const point = 55 * ss5(t, T.that - 0.5, T.that - 0.1);
  const fit = ss(t, T.that - 0.38, T.that - 0.02);
  const fitPose: WPose = {...STAND, x: Hx, y: Hy};
  // the toes stir once on "pointing" (they are the backward end now), and once when the foot is saved
  const tw = (a: number) => { const u = clamp((t - a) / 0.55); return u > 0 && u < 1 ? Math.sin(Math.PI * 2 * u) * (1 - u) : 0; };
  const toeCurl = 22 * tw(T.pointing) + 14 * tw(T.save + 0.1);
  return {ghost, H: {x: Hx, y: Hy}, hip, knee, win, tumor, mark, cuts, split, midOut, save, toeCurl, yaw, ring, rise, seam, align, point, fit, fitPose};
};
export const illusCam = (t: number): Cam => {
  const c0 = pitchCam(T.wyatt - 1e-4);
  const keys: CKey[] = [
    [T.wyatt, c0],
    [T.wyatt + 0.95, {x: XS - 3, y: -44, w: 66, eye: -40}],
    [T.save + 0.6, {x: XS - 3, y: -42, w: 62, eye: -40}],
    [T.they + 0.25, {x: XS - 1, y: -31, w: 47, eye: -40}],
    [T.attached - 0.05, {x: XS - 1, y: -32, w: 47, eye: -40}],
    [T.thigh + 0.3, {x: XS + 2, y: -42, w: 58, eye: -40}],
    [T.that - 0.5, {x: XS + 3, y: -39, w: 47, eye: -40}],
    [T.that + 0.02, {x: XS + 2, y: -41, w: 52, eye: -40}],
  ];
  return glide(t, keys);
};

// ------------------------------------------------------------------------------------------------ S4: the bench
export const BENCH_X = XS + 27;
const SEAT_H: V = {x: XS + 19, y: -44.5};
export const benchState = (t: number) => {
  const u = ss5(t, T.bent - 0.12, T.other + 0.15); // lowering onto the bench
  const Hx = lerp(XS, SEAT_H.x, u), Hy = lerp(-73.7, SEAT_H.y, u) + 2.2 * Math.sin(Math.PI * u) * 0.5;
  const nF = {x: XS - 4, y: -7.7}, fF = {x: XS + 6, y: -7.7};
  const H = {x: Hx, y: Hy};
  const sy = 2 * u, st = 8 + 9 * u;
  const fF2 = {x: XS + 10, y: fF.y};
  const near = reach(H, nF, 90), far = reach({x: Hx + st, y: Hy - 0.4 - sy}, fF2, 90);
  const lean = 0 + 24 * Math.sin(Math.PI * clamp(u * 1.1)) + 6 * u;
  const arm = (k: number) => ({sh: lerp(4, 38, u) + 10 * Math.sin(Math.PI * u) * k, el: lerp(10, 40, u)});
  const expr: Expr = {...EXPR_NEUTRAL, smile: 0.5, gx: -0.3, gy: 0.4};
  const pose: WPose = {x: Hx, y: Hy, lean, near, far, stagger: st, staggerY: sy, aN: arm(1), aF: arm(-1), neck: 4 + 6 * u, turn: 1, expr, blink: 0};
  return {pose};
};
export const benchCam = (t: number): Cam => {
  const keys: CKey[] = [
    [ILL_END, illusCam(ILL_END)],
    [ILL_END + 0.2, illusCam(ILL_END)],
    [T.bent - 0.1, {x: XS + 6, y: -50, w: 80, eye: -55}],
    [T.when, {x: XS + 4, y: -46, w: 74, eye: -50}],
  ];
  const c = glide(t, keys);
  if (t < ILL_END + 0.2) c.eye = -40;
  return c;
};
// ------------------------------------------------------------------------------------------------ S5: recovery
export const bedState = (t: number) => {
  const A4 = joints(benchState(T.when - 1e-4).pose).A;
  const A = {x: A4.x, y: A4.y};
  const H = {x: A.x + 35 * Math.cos(0.698), y: A.y + 35 * Math.sin(0.698)};
  const hip = 90 + 40;
  // waking, looking down, one toe wiggle, the slightest smile, then the toes press down (the cut on action)
  const open = ss(t, T.woke - 0.05, T.woke + 0.35);
  const look = ss(t, T.woke + 0.45, T.woke + 0.95);
  const wig = clamp((t - (T.wiggle + 0.02)) / 0.62);
  const toeCurl = 38 * Math.sin(Math.PI * 2 * wig) * (wig < 1 ? 1 : 0) * (1 - 0.3 * wig) + 30 * ss(t, T.learned - 0.32, T.learned - 0.02);
  const smile = ss(t, T.toes2 - 0.05, T.toes2 + 0.45);
  const expr: Expr = {...EXPR_NEUTRAL, lid: lerp(0.5, 0.22, look), smile: lerp(0.05, 0.45, smile), gx: lerp(0, -0.75, look), gy: lerp(0.1, 0.85, look), flush: 0.2, browIn: 0.15 + 0.2 * smile};
  const pose: WPose = {x: H.x, y: H.y, lean: -22, near: {hip, knee: 0, ank: 0}, far: {hip: 92, knee: 0, ank: 0}, stagger: 0, aN: {sh: 30, el: 50}, aF: {sh: 20, el: 40}, neck: lerp(-8, 14, look), turn: 1, expr, blink: 1 - open};
  return {pose, A, H, toeCurl, fa: 5};
};
export const bedCam = (t: number): Cam => {
  const st = bedState(t);
  const H = st.H;
  const j = joints(st.pose);
  // frame the face and the hanging foot together
  const mid = {x: (j.headC.x + st.A.x) / 2, y: (j.headC.y + st.A.y + 14) / 2};
  const span = Math.abs(j.headC.x - st.A.x) + 30;
  const keys: CKey[] = [
    [T.when, benchCam(T.when - 1e-4)],
    [T.when + 0.12, benchCam(T.when - 1e-4)],
    [T.woke + 0.35, {x: mid.x, y: mid.y, w: span, eye: -50}],
    [T.toes2 + 0.4, {x: mid.x - 3, y: mid.y + 2, w: span * 0.94, eye: -50}],
    [T.learned, {x: st.A.x + 6, y: st.A.y + 6, w: 58, eye: -50}],
  ];
  return glide(t, keys);
};
