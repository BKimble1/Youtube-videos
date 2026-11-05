// S2 (6.45 - 12.75): the invention. The camera leaves the operator and goes round the wearer to the harness; the body
// turns translucent (an x-ray isolation, in place) as the camera reaches the back, where all SIX terminals show; the
// four arms slide out along their terminal axes and the terminal lights count off; one arm is pushed home and its
// collar turns to lock on "limbs"; the camera comes back round as the body returns.
// S3 (12.75 - 16.5): the controller. A physical split: the half-scale model close to the lens on the left, the full
// arm on the wearer farther away on the right, at about the same size; shoulder rotation, elbow, wrist and hand.
// S4 (16.5 - 21.6): another person moves your extra hand. Wearer in front, operator behind; push to the operator's
// fingers; a match cut from the model's wrist to the full wrist (same view direction, distance x2: an identical
// frame); pull back as the robot hand pats the wearer's shoulder while his own hands hang still.
import {Cam, v3, V3, a3, k3, n3, s3, mixCam} from '../r3/m3';
import {StageState, Wearer, ArmSlot} from '../r3/stage';
import {ArmPose} from '../r3/robot';
import {TermId} from '../r3/harness';
import {mixExpr} from '../dc/Head';
import {kn, kpath, ramp, win, io, lin, outC} from './tracks';
import {basePose, blinkAt, breathAt, EX_HAPPY, EX_WOW, EX_FOCUS, EX_CALM, GUESSER, OPERATOR, hangL, hangR, reachSlot, slotGeo} from './cast';
import {CART, CUP0, TABLE, MINI_BASE, MINI_STAND, W_UR, operatorPose, slotGeoMini, urDriven, s1Wearer, cupFromGeo} from './s1';

const W0 = basePose(v3(0, 0, 0), 0);
const lerpPose = (a: ArmPose, b: ArmPose, u: number): ArmPose => ({
  yaw: a.yaw + (b.yaw - a.yaw) * u,
  pitch: a.pitch + (b.pitch - a.pitch) * u,
  elbow: a.elbow + (b.elbow - a.elbow) * u,
  wp: a.wp + (b.wp - a.wp) * u,
  wr: a.wr + (b.wr - a.wr) * u,
  grip: a.grip + (b.grip - a.grip) * u,
  spread: (a.spread ?? 0.4) + ((b.spread ?? 0.4) - (a.spread ?? 0.4)) * u,
});
/** Camera mix with distance and focal length interpolated on a log scale (zooms and dollies read evenly). */
const logMix = (a: Cam, b: Cam, u: number): Cam => ({...mixCam(a, b, u), dist: a.dist * Math.pow(b.dist / a.dist, u), f: a.f * Math.pow(b.f / a.f, u)});
const memo = new Map<string, ArmPose>();
const R = (key: string, tid: TermId, w: V3, d: V3, p: V3, g: number, es: 1 | -1): ArmPose => {
  if (!memo.has(key)) memo.set(key, reachSlot(W0, tid, w, d, p, g, 0.45, es));
  return memo.get(key)!;
};
/** Rest poses for S2 - S4 (computed once). */
const REST = () => ({
  UL: R('rUL', 'UL', v3(44, 186, 4), v3(0.4, 0.9, 0.1), v3(-0.3, 0, 1), 0.3, 1),
  UR: {...urDriven(4.4), grip: 0.3},
  LL: R('rLL', 'LL', v3(47, 114, 10), v3(0.5, -0.3, 0.8), v3(-0.2, -1, 0.2), 0.35, 1),
  LR: R('rLR', 'LR', v3(-42, 108, 22), v3(-0.3, -0.3, 1), v3(0.2, -1, 0.2), 0.35, -1),
});
const idle = (p: ArmPose, t: number, ph: number): ArmPose => ({...p, pitch: p.pitch + 3 * Math.sin(t * 1.3 + ph), elbow: p.elbow + 4 * Math.sin(t * 1.1 + ph * 1.7), grip: p.grip + 0.08 * Math.sin(t * 2 + ph)});

// ------------------------------------------------------------------------------------------------ S2
const s1End = (() => {
  let cache: Wearer | null = null;
  return () => (cache ??= s1Wearer(6.45));
})();

export const s2State = (t: number): StageState => {
  const rest = REST();
  const e = s1End();
  const from = (tid: TermId) => e.arms.find((a) => a.tid === tid)!.pose;
  const back = ramp(t, 6.45, 7.6, io); // settle from the S1 poses to rest
  const pose = {...W0};
  pose.blink = blinkAt(t, 1.2);
  pose.breath = breathAt(t);
  pose.expr = mixExpr(EX_CALM, EX_HAPPY, win(t, 12.9, 13.1, 13.3, 13.6));
  pose.hYaw = kn(t, [[6.45, -40], [7.6, 10, io], [12.75, 10]]);
  pose.L = hangL(0, 0.4 * Math.sin(t * 1.6));
  pose.R = hangR(0, 0.4 * Math.sin(t * 1.6 + 0.6));
  const out = (tid: TermId) => {
    // all four slide out along their axes on "six sockets"; LL comes almost off and is pushed home on "limbs"
    const o = kn(t, [[9.55, 0], [10.05, 12, io], [10.85, 12], [11.3, 0, io]]);
    if (tid === 'UL') return kn(t, [[9.55, 0], [10.05, 12, io], [10.9, 16, io], [11.78, 0, io]]);
    return o;
  };
  const collar = (tid: TermId) => (tid === 'UL' ? kn(t, [[9.6, 0], [9.95, 60, io], [11.75, 60], [11.95, 0, outC]]) : kn(t, [[9.6, 0], [9.95, 60, io], [11.2, 60], [11.4, 0, outC]]));
  const led = (tid: TermId) => {
    const order: TermId[] = ['UL', 'UR', 'ML', 'MR', 'LL', 'LR'];
    const i = order.indexOf(tid);
    const t0 = 10.05 + i * 0.11;
    const blink = win(t, t0, t0 + 0.04, t0 + 0.2, t0 + 0.3);
    const on = tid.startsWith('M') ? 0 : t < 9.6 || t > (tid === 'UL' ? 11.95 : 11.4) ? 1 : 0.15;
    return Math.max(on, blink);
  };
  // LL puts the cup back on the cart (6.45 - 7.35), lets go, then settles to rest
  const llPut = (() => {
    const w = kpath(t, [[6.45, slotGeo(pose, 'LL', from('LL')).W], [7.25, v3(29.6, 100.4, 19.6)]], io);
    const g = kn(t, [[7.25, 0.74], [7.5, 0.05, io]]);
    const put = reachSlot(pose, 'LL', t < 7.25 ? w : v3(29.6 - 3 * ramp(t, 7.3, 7.6), 100.4 + 2 * ramp(t, 7.3, 7.6), 19.6 - 3 * ramp(t, 7.3, 7.6)), v3(0.05, 0, 1), v3(1, 0, -0.05), g, 0.3, 1);
    return t < 7.5 ? put : lerpPose(put, idle(rest.LL, t, 2), ramp(t, 7.5, 8.6, io));
  })();
  const cupNow = t < 7.3 ? cupFromGeo(slotGeo(pose, 'LL', llPut)) : CUP0;
  const arms: ArmSlot[] = (['UL', 'UR', 'LL', 'LR'] as TermId[]).map((tid, i) => ({
    tid,
    pose: tid === 'LL' ? llPut : tid === 'UR' ? lerpPose(from(tid), rest.UR, back) : lerpPose(from(tid), idle(rest[tid as 'UL'], t, i), back),
    plugOut: out(tid),
    collar: collar(tid),
    led: t > 9.6 && t < (tid === 'UL' ? 11.95 : 11.4) ? 0.1 : 1,
  }));
  const urNow = arms.find((a) => a.tid === 'UR')!.pose;
  const termLed: Partial<Record<TermId, number>> = {};
  (['UL', 'UR', 'ML', 'MR', 'LL', 'LR'] as TermId[]).forEach((tid) => (termLed[tid] = led(tid)));
  const ghost = win(t, 8.55, 9.35, 12.62, 13.08);
  const tg = kpath(t, [
    [6.45, v3(-58, 146, 32)],
    [7.4, v3(-4, 144, 4)],
    [8.6, v3(0, 138, -8)],
    [9.9, v3(-2, 130, -22)],
    [10.9, v3(-2, 128, -22)],
    [11.45, v3(19, 168, -22)],
    [11.95, v3(19, 168, -22)],
    [12.7, v3(4, 150, -8)],
    [13.3, v3(-20, 146, 6)],
  ], lin);
  const cam: Cam = {
    t: tg,
    yaw: kn(t, [[6.45, -12], [7.4, 18, io], [8.6, 62, io], [9.9, 194, io], [10.9, 200, lin], [11.45, 196, io], [11.95, 192, lin], [13.3, 10, io]]),
    pitch: kn(t, [[6.45, 2], [8.6, 5, io], [9.9, 10, io], [10.9, 10], [11.45, 4, io], [13.3, 3, io]]),
    dist: kn(t, [[6.45, 160], [7.4, 152, io], [8.6, 152, io], [9.9, 186, io], [10.9, 180], [11.45, 74, io], [11.95, 70], [13.3, 175, io]]),
    f: 1380,
    roll: 0,
  };
  return {
    cam,
    wearers: [{id: 'w', look: GUESSER, pose, arms, legs: true, ghost, termLed}],
    people: [{id: 'op', look: OPERATOR, pose: operatorPose(t, slotGeoMini(urNow)), legs: true}],
    mini: {base: MINI_BASE, B: W_UR.B, pose: urNow, side: -1, stand: MINI_STAND},
    table: TABLE,
    cart: CART,
    cup: {pos: cupNow, zBias: t < 7.3 ? 1.5 : 0},
  };
};

// ------------------------------------------------------------------------------------------------ S3 + S4
/** The driven upper-right arm through S3 and S4 (joint space; the model copies it exactly). */
let s4Keys: [number, ArmPose][] | null = null;
const jointLerp = (K: [number, ArmPose][], t: number): ArmPose => {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [t0, a] = K[i];
    const [t1, b] = K[i + 1];
    if (t <= t1) return lerpPose(a, b, io(Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))));
  }
  return K[K.length - 1][1];
};
const wrapNear = (p: ArmPose, ref: ArmPose): ArmPose => ({...p, wr: ref.wr + ((((p.wr - ref.wr) % 360) + 540) % 360) - 180, yaw: ref.yaw + ((((p.yaw - ref.yaw) % 360) + 540) % 360) - 180});
export const urS34 = (t: number): ArmPose => {
  const r = REST().UR;
  const A = r;
  if (t < 16.5) {
    // S3 demos: shoulder rotation (yaw), elbow, wrist + hand
    const yaw = kn(t, [[13.3, A.yaw], [13.4, A.yaw], [14.0, A.yaw - 38, io], [16.5, A.yaw - 38]]);
    const elbow = kn(t, [[13.3, A.elbow], [14.05, A.elbow], [14.7, A.elbow - 50, io], [16.5, A.elbow - 50]]);
    const wp = kn(t, [[13.3, A.wp], [14.75, A.wp], [15.15, A.wp + 40, io], [15.55, A.wp - 20, io], [16.5, A.wp]]);
    const wr = kn(t, [[13.3, A.wr], [14.75, A.wr], [15.6, A.wr + 70, io], [16.5, A.wr + 70]]);
    const grip = kn(t, [[13.3, 0.3], [15.05, 0.3], [15.3, 0.85, io], [15.6, 0.1, io], [16.5, 0.25]]);
    return {yaw, pitch: A.pitch, elbow, wp, wr, grip, spread: 0.5};
  }
  if (!s4Keys) {
    const e3: ArmPose = {...A, yaw: A.yaw - 38, elbow: A.elbow - 50, wr: A.wr + 70, grip: 0.25, spread: 0.5};
    const Rk = (w: V3, d: V3, p: V3, g: number) => wrapNear(reachSlot(W0, 'UR', w, d, p, g, 0.5, -1), e3);
    const Rk1 = (w: V3, d: V3, p: V3, g: number) => wrapNear(reachSlot(W0, 'UR', w, d, p, g, 0.5, 1), e3);
    const front = Rk1(v3(-30, 186, 30), v3(0.25, 0.35, 1), v3(0.2, -0.3, 1), 0.2);
    const front2 = {...front, wr: front.wr + 35, wp: front.wp + 25, grip: 0.45};
    const over = Rk1(v3(-2, 206, 4), v3(0.3, -0.8, 0.2), v3(0, -1, 0), 0.3);
    const pat = Rk1(v3(-6, 197, 2), v3(0.3, -0.85, 0.2), v3(0, -1, 0), 0.4);
    s4Keys = [[16.5, e3], [17.5, front], [18.2, front], [18.9, front2], [19.5, over], [19.85, pat], [20.15, over], [20.45, pat], [20.8, over], [21.6, over]];
  }
  return jointLerp(s4Keys, t);
};

export const s34State = (t: number): StageState => {
  const rest = REST();
  const pose = {...W0};
  pose.blink = blinkAt(t, 1.2);
  pose.breath = breathAt(t);
  const ur = urS34(t);
  const urG = slotGeo(pose, 'UR', ur);
  // the wearer watches his extra hand in S4; his own hands hang still
  const watch = ramp(t, 16.8, 17.4);
  const toHand = n3(s3(urG.W, a3(pose.pos, v3(0, 172, 0))));
  const hy = (Math.atan2(toHand.x, toHand.z) * 180) / Math.PI;
  pose.hYaw = kn(t, [[12.75, 10], [13.4, -30, io], [16.5, -30]]) * (1 - watch) + Math.max(-60, Math.min(60, hy)) * watch;
  pose.hNod = -8 * watch;
  pose.expr = mixExpr(mixExpr(EX_CALM, EX_WOW, win(t, 17.2, 17.5, 18.2, 18.6)), EX_HAPPY, win(t, 19.6, 19.9, 21.6, 22));
  pose.expr = {...pose.expr, gx: -0.35 * watch, gy: -0.3 * watch};
  pose.L = hangL(0, 0.25 * Math.sin(t * 1.6));
  pose.R = hangR(0, 0.25 * Math.sin(t * 1.6 + 0.6));
  const arms: ArmSlot[] = [
    {tid: 'UL', pose: idle(rest.UL, t, 0)},
    {tid: 'UR', pose: ur},
    {tid: 'LL', pose: idle(rest.LL, t, 2)},
    {tid: 'LR', pose: idle(rest.LR, t, 3)},
  ];
  const mg = slotGeoMini(ur);
  const op = operatorPose(t, mg);
  // cameras
  let cam: Cam;
  const MATCH = 18.5;
  const VY = 56, VP = 4;
  if (t < 16.5) {
    // S3: the physical split. Model near the lens (lower left), full arm about twice as far (upper right): the
    // half-size model and the full arm read at about the same size. Then travel to the full arm.
    const split: Cam = {t: v3(-46, 152, 22), yaw: -11, pitch: -9, dist: 136, f: 960, sx: 250, sy: -40};
    const intro: Cam = {t: v3(-20, 146, 6), yaw: 10, pitch: 3, dist: 175, f: 1380, sx: 0, sy: 0};
    const urE = urG.E;
    const arm: Cam = {t: v3(urE.x - 6, urE.y + 4, urE.z), yaw: -6, pitch: -2, dist: 110, f: 1380, sx: 0, sy: 0};
    const u1 = ramp(t, 13.3, 13.85, io);
    const u2 = ramp(t, 15.0, 16.45, io);
    cam = u2 > 0 ? mixCam(split, arm, u2) : mixCam(intro, split, u1);
  } else if (t < MATCH) {
    // S4a: wearer in front (seen from his left), operator behind him; push along one direction to the operator's
    // fingers on the model's wrist
    const push = ramp(t, 17.55, MATCH, io);
    const intro = ramp(t, 16.5, 17.3, io);
    const wide: Cam = {t: v3(-40, 138, 14), yaw: VY, pitch: 12, dist: 236, f: 1380};
    const prev: Cam = {t: v3(urG.E.x - 6, urG.E.y + 4, urG.E.z), yaw: -6, pitch: -2, dist: 110, f: 1380};
    const FZ = (1380 * 250) / 46;
    const close: Cam = {t: mg.W, yaw: VY, pitch: VP, dist: 250, f: FZ};
    const w2 = mixCam(prev, wide, intro);
    cam = logMix(w2, close, push);
  } else {
    // S4b: the matched frame on the full wrist (same direction, same lens, distance x2), then the pull back
    const FZ = (1380 * 250) / 46;
    const back = ramp(t, MATCH + 0.3, 20.3, io);
    const close: Cam = {t: urG.W, yaw: VY, pitch: VP, dist: 500, f: FZ};
    const wide: Cam = {t: v3(-6, 136, 6), yaw: VY - 6, pitch: 13, dist: 200, f: 1380};
    cam = logMix(close, wide, back);
  }
  return {
    cam,
    wearers: [{id: 'w', look: GUESSER, pose, arms, legs: true}],
    people: [{id: 'op', look: OPERATOR, pose: op, legs: true}],
    mini: {base: MINI_BASE, B: W_UR.B, pose: ur, side: -1, stand: MINI_STAND},
    table: TABLE,
    cart: CART,
    cup: {pos: CUP0, zBias: 0},
  };
};
void EX_FOCUS;
void outC;
