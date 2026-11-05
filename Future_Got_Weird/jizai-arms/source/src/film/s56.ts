// S5 (21.6 - 26.2): a separate demonstration (deliberate cut): two wearers. The guesser (right) unlocks the arm on
// his right hip terminal (collar twist), draws it out along the terminal axis and passes it across; the second wearer
// (left) takes it by the upper link, lines the plug up with her free left-hip terminal, pushes it home and turns
// the collar; the light comes on and the arm makes a small controlled movement. The camera follows the arm.
// S6 (26.2 - 31.0): the borrowed arm moves beside her own arms; the camera glides out to show her extra limb; then
// she turns to the lens and the borrowed hand reaches toward the viewer, the camera pushing in, and the last second
// blends body, arms and camera into the frame-0 composition (shifted to where she stands), so the loop cuts on the
// same foreground robot hand.
import {Cam, v3, V3, a3, k3, mixCam, M3, mm, rAxis} from '../r3/m3';
import {StageState, Wearer, ArmSlot, FreeArm} from '../r3/stage';
import {ArmPose, armFK} from '../r3/robot';
import {TermId} from '../r3/harness';
import {mixExpr} from '../dc/Head';
import {mixHand} from '../dc/Hand';
import {kn, kpath, ramp, win, io, lin} from './tracks';
import {basePose, blinkAt, breathAt, EX_HAPPY, EX_WOW, EX_CALM, GUESSER, WEARER2, HAND_GRIP, HAND_HANG, hangL, hangR, reachSlot, termFrame, mixFrame} from './cast';
import {s1Wearer, s1Cam} from './s1';

export const DPOS = v3(-40, 0, 0);
export const WPOS = v3(40, 0, 0);
const D_FACE = 0, W_FACE = 0;
const lerpPose = (a: ArmPose, b: ArmPose, u: number): ArmPose => ({
  yaw: a.yaw + (b.yaw - a.yaw) * u,
  pitch: a.pitch + (b.pitch - a.pitch) * u,
  elbow: a.elbow + (b.elbow - a.elbow) * u,
  wp: a.wp + (b.wp - a.wp) * u,
  wr: a.wr + (b.wr - a.wr) * u,
  grip: a.grip + (b.grip - a.grip) * u,
  spread: (a.spread ?? 0.4) + ((b.spread ?? 0.4) - (a.spread ?? 0.4)) * u,
});
const idle = (p: ArmPose, t: number, ph: number, k = 1): ArmPose => ({...p, pitch: p.pitch + 3 * k * Math.sin(t * 1.3 + ph), elbow: p.elbow + 4 * k * Math.sin(t * 1.1 + ph * 1.7), grip: p.grip + 0.08 * k * Math.sin(t * 2 + ph)});
const inLim = (p: ArmPose): ArmPose => ({...p, wp: Math.max(-78, Math.min(78, p.wp)), elbow: Math.max(-133, Math.min(133, p.elbow)), pitch: Math.max(-123, Math.min(123, p.pitch))});
const memo = new Map<string, ArmPose>();
const M = (key: string, f: () => ArmPose) => {
  if (!memo.has(key)) memo.set(key, f());
  return memo.get(key)!;
};

const Wp0 = basePose(WPOS, W_FACE);
const Dp0 = basePose(DPOS, D_FACE);
/** world point from a body-local offset for a pose */
const loc = (pos: V3, face: number, l: V3) => {
  const c = Math.cos((face * Math.PI) / 180), s = Math.sin((face * Math.PI) / 180);
  return v3(pos.x + c * l.x + s * l.z, l.y, pos.z - s * l.x + c * l.z);
};
// rest poses (body-local targets turned into world)
const wRest = (tid: TermId) =>
  M(`w${tid}`, () => {
    const L: Record<string, [V3, V3, V3, 1 | -1]> = {
      UL: [v3(44, 186, 4), v3(0.4, 0.9, 0.1), v3(-0.3, 0, 1), 1],
      UR: [v3(-30, 196, -6), v3(-0.2, 1, 0.0), v3(0.3, 0, 1), -1],
      LL: [v3(46, 112, 12), v3(0.5, -0.3, 0.8), v3(-0.2, -1, 0.2), 1],
      LR: [v3(-44, 110, 14), v3(-0.5, -0.3, 0.8), v3(0.2, -1, 0.2), -1],
    };
    const [w, d, p, es] = L[tid];
    const r = (q: V3) => loc(v3(0, 0, 0), W_FACE, q);
    return reachSlot(Wp0, tid, loc(WPOS, W_FACE, w), r(d), r(p), 0.3, 0.45, es);
  });
const dRest = (tid: TermId) =>
  M(`d${tid}`, () => {
    const L: Record<string, [V3, V3, V3, 1 | -1]> = {
      UL: [v3(30, 196, -6), v3(0.2, 1, 0.0), v3(-0.3, 0, 1), 1],
      UR: [v3(-42, 188, 6), v3(-0.4, 0.9, 0.1), v3(0.3, 0, 1), -1],
      LL: [v3(44, 112, 14), v3(0.5, -0.3, 0.8), v3(-0.2, -1, 0.2), 1],
    };
    const [w, d, p, es] = L[tid];
    const r = (q: V3) => loc(v3(0, 0, 0), D_FACE, q);
    return reachSlot(Dp0, tid, loc(DPOS, D_FACE, w), r(d), r(p), 0.3, 0.45, es);
  });
/** the carried arm's (unpowered) pose: folded, fingers loose */
const CARRY: ArmPose = {yaw: 0, pitch: 28, elbow: 78, wp: 18, wr: 0, grip: 0.35, spread: 0.3};

// ------------------------------------------------------------------------------------------------ timing
const SWING = -180;
const T = {
  reach: 22.35, grab: 22.8, unlock: 23.15, out: 23.55, lift: 24.35, take: 24.32, release: 24.55,
  align: 24.85, home: 25.12, lock: 25.25, wake: 25.45,
};

/** Base frame and plug state of the moving arm. */
const swapArm = (t: number) => {
  const tw = termFrame(Wp0, 'LR');
  const td = termFrame(Dp0, 'LL');
  if (t < T.out) {
    const po = kn(t, [[T.unlock, 0], [T.out, 10, io]]);
    return {stage: 'W' as const, plugOut: po, base: tw.face, B: tw.B};
  }
  if (t < T.align) {
    const u = ramp(t, T.out, T.align, io);
    const a = a3(tw.face, k3(tw.B.z, 10));
    const b = a3(td.face, k3(td.B.z, 10));
    const mid = v3((a.x + b.x) / 2, Math.max(a.y, b.y) + 16, (a.z + b.z) / 2 + 22);
    const p = kpath(u, [[0, a], [0.5, mid], [1, b]]);
    // the plug turns from W's terminal axis to the reverse of D's (it travels across, then points back in)
    const Bt: M3 = mm(rAxis(v3(0, 1, 0), SWING * u), tw.B);
    const B: M3 = mixFrame(Bt, td.B, ramp(u, 0.75, 1, io));
    return {stage: 'F' as const, plugOut: 0, base: p, B};
  }
  const po = kn(t, [[T.align, 10], [T.home, 0, io]]);
  return {stage: 'D' as const, plugOut: po, base: td.face, B: td.B};
};

const s5People = (t: number) => {
  const sa = swapArm(t);
  const collar = t < T.lock ? kn(t, [[T.grab, 0], [T.unlock, 60, io]]) : kn(t, [[T.home, 60], [T.lock, 0, io]]);
  // the arm's joints: powered rest -> folded on unlock -> powered and moving after the lock
  const wake = ramp(t, T.wake, T.wake + 0.5, io);
  const fold = ramp(t, T.unlock, T.unlock + 0.45, io);
  const restW = wRest('LR');
  const restD = dRest('LL');
  let armPose = lerpPose(restW, CARRY, fold);
  if (t > T.lock) {
    const live = lerpPose(restD, {...restD, elbow: restD.elbow - Math.sign(restD.elbow || 1) * 30, wp: restD.wp - 25, grip: 0.7}, win(t, T.wake + 0.4, T.wake + 0.7, T.wake + 0.9, T.wake + 1.3));
    armPose = inLim(lerpPose(CARRY, live, wake));
  }
  // geometry of the moving arm (world)
  const g = armFK(sa.base, sa.B, armPose, -1, 1, sa.plugOut);
  const plugGrip = a3(a3(g.plug, k3(g.B.z, 3.2)), k3(g.B.x, 3.6));
  const linkGrip = a3(a3(g.plug, k3(g.B.z, 4.4)), k3(g.B.x, -3.8));

  // ---- W (guesser): right hand to the collar, twist, draw out, lift across, release
  const wp = {...Wp0};
  wp.blink = blinkAt(t, 0.7);
  wp.breath = breathAt(t, 0.5);
  wp.hYaw = kn(t, [[21.6, -26], [22.3, -40, io], [23.6, -40, io], [24.5, -30, io]]);
  wp.hNod = kn(t, [[21.6, 0], [22.3, 18, io], [23.6, 8, io], [24.5, 0, io]]);
  wp.expr = mixExpr(EX_CALM, EX_HAPPY, win(t, 24.2, 24.6, 26.2, 26.6));
  wp.L = hangL(0, 0.3 * Math.sin(t * 1.6));
  const wHold = win(t, T.reach, T.grab, T.release - 0.05, T.release + 0.35);
  const wR = hangR();
  const wReach: typeof wR = {h: plugGrip, world: true, pole: v3(-0.5, -0.3, -1), dir: v3(-0.2, -0.6, -0.6), thumb: v3(0, 1, 0), hand: mixHand(HAND_HANG, HAND_GRIP, ramp(t, T.reach + 0.25, T.grab))};
  wp.R = wHold > 0.001 ? blendArm(wR, wReach, wHold, loc, WPOS, W_FACE) : wR;
  // ---- D (second wearer): left hand meets the arm's upper link, guides the plug home, lets go
  const dp = {...Dp0};
  dp.blink = blinkAt(t, 2.1);
  dp.breath = breathAt(t, 1.3);
  dp.hYaw = kn(t, [[21.6, 26], [22.3, 34, io], [24.0, 34, io], [25.2, 44, io], [26.2, 34, io]]);
  dp.hNod = kn(t, [[21.6, 0], [22.3, 14, io], [25.2, 18, io], [26.2, 6, io]]);
  dp.expr = mixExpr(mixExpr(EX_CALM, EX_HAPPY, ramp(t, 23.4, 24.0)), EX_WOW, win(t, 25.3, 25.5, 25.9, 26.3));
  dp.R = hangR(0, 0.3 * Math.sin(t * 1.6 + 1));
  const dHold = win(t, 24.0, T.take, T.lock + 0.05, T.lock + 0.45);
  const dL = hangL();
  const dReach: typeof dL = {h: linkGrip, world: true, pole: v3(0.5, -0.3, -1), dir: v3(0.3, -0.5, -0.6), thumb: v3(0, 1, 0), hand: mixHand(HAND_HANG, HAND_GRIP, ramp(t, 24.12, T.take))};
  dp.L = dHold > 0.001 ? blendArm(dL, dReach, dHold, loc, DPOS, D_FACE) : dL;

  const wArms: ArmSlot[] = [
    {tid: 'UL', pose: idle(wRest('UL'), t, 0)},
    {tid: 'UR', pose: idle(wRest('UR'), t, 1)},
    {tid: 'LL', pose: idle(wRest('LL'), t, 2)},
  ];
  const dArms: ArmSlot[] = [
    {tid: 'UL', pose: idle(dRest('UL'), t, 0.5)},
    {tid: 'UR', pose: idle(dRest('UR'), t, 1.5)},
  ];
  let free: FreeArm[] = [];
  const BAND = '#EF6B55';
  if (sa.stage === 'W') wArms.push({tid: 'LR', pose: armPose, plugOut: sa.plugOut, collar, led: 1 - fold, band: undefined});
  else if (sa.stage === 'F') free = [{id: 'swap', base: sa.base, B: sa.B, pose: armPose, side: -1, collar: 60}];
  else dArms.push({tid: 'LL', pose: armPose, plugOut: sa.plugOut, collar, led: ramp(t, T.lock, T.lock + 0.12), side: -1});
  void BAND;
  const ledD: Partial<Record<TermId, number>> = {LL: t > T.lock ? 1 : 0, UL: 1, UR: 1};
  const ledW: Partial<Record<TermId, number>> = {UL: 1, UR: 1, LL: 1, LR: t < T.unlock ? 1 : 0};
  return {
    w: {id: 'w', look: GUESSER, pose: wp, arms: wArms, legs: true, termLed: ledW} as Wearer,
    d: {id: 'd', look: WEARER2, pose: dp, arms: dArms, legs: true, termLed: ledD} as Wearer,
    free,
    g,
  };
};

type A3 = ReturnType<typeof hangL>;
/** Blend a hanging arm toward a world-target reach (the IK target moves smoothly between the two). */
const blendArm = (hang: A3, reach: A3, u: number, locF: typeof loc, pos: V3, face: number): A3 => {
  const hw = locF(pos, face, hang.h);
  const h = v3(hw.x + (reach.h.x - hw.x) * u, hw.y + (reach.h.y - hw.y) * u, hw.z + (reach.h.z - hw.z) * u);
  const dW = locF(v3(0, 0, 0), face, hang.dir!);
  const thW = locF(v3(0, 0, 0), face, hang.thumb!);
  const pW = locF(v3(0, 0, 0), face, hang.pole);
  const L = (a: V3, b: V3) => v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
  return {h, world: true, pole: hang.pole === reach.pole ? hang.pole : locInv(L(pW, reach.pole), face), dir: L(dW, reach.dir!), thumb: L(thW, reach.thumb!), hand: mixHand(hang.hand, reach.hand, u)};
};
/** world direction -> body-local (pole is given body-local) */
const locInv = (d: V3, face: number) => {
  const c = Math.cos((face * Math.PI) / 180), s = Math.sin((face * Math.PI) / 180);
  return v3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
};

export const s5State = (t: number): StageState => {
  const P = s5People(t);
  const sa = swapArm(t);
  const base = a3(sa.base, k3(sa.B.z, sa.plugOut));
  const follow = v3(base.x, base.y + 4, base.z + 10);
  const tg = t < 22.3 ? v3(0, 140, 0) : kpath(t, [[22.3, v3(0, 140, 0)], [22.9, v3(24, 118, -12)], [T.out, v3(follow.x, 118, -8)], [T.align, v3(-22, 118, -10)], [T.lock, v3(-24, 118, -10)], [26.2, v3(-36, 134, 0)]], lin);
  const cam: Cam = {
    t: tg,
    yaw: kn(t, [[21.6, 0], [22.9, -12, io], [T.out, -10], [T.align, 12, io], [T.lock, 14], [26.2, 10, io]]),
    pitch: kn(t, [[21.6, 8], [22.9, 26, io], [T.lock, 26], [26.2, 8, io]]),
    dist: kn(t, [[21.6, 222], [22.9, 150, io], [24.0, 160, io], [T.lock, 138, io], [26.2, 150, io]]),
    f: 1380,
  };
  return {cam, wearers: [P.w, P.d], free: P.free};
};

// ------------------------------------------------------------------------------------------------ S6 + loop
const LOOP0 = 30.2; // the blend into the frame-0 composition starts here
export const s6State = (t: number): StageState => {
  const P = s5People(26.2);
  const d = P.d;
  const pose = {...d.pose};
  pose.blink = blinkAt(t, 2.1);
  pose.breath = breathAt(t, 1.3);
  const restD = dRest('LL');
  // the borrowed arm moves naturally: a slow wave and finger roll beside her own arms
  const live: ArmPose = {
    ...restD,
    yaw: restD.yaw + 14 * Math.sin((t - 26.2) * 1.9),
    elbow: restD.elbow - Math.sign(restD.elbow || 1) * kn(t, [[26.2, 0], [27.0, 34, io], [27.8, 10, io], [28.6, 38, io]]),
    wp: restD.wp + 22 * Math.sin((t - 26.2) * 2.6),
    grip: 0.3 + 0.35 * Math.sin((t - 26.2) * 3.4) ** 2,
  };
  // loop target: the frame-0 poses, continued in negative time (s1 tracks are keyed from -0.8)
  const lt = t - 31.0;
  const L0 = s1Wearer(lt);
  const lp = (tid: TermId) => L0.arms.find((a) => a.tid === tid)!.pose;
  const u = ramp(t, LOOP0 - 1.2, LOOP0, io);
  pose.face = D_FACE * (1 - ramp(t, 28.6, LOOP0, io));
  pose.hYaw = kn(t, [[26.2, 34], [26.6, 48, io], [28.6, 30], [LOOP0, L0.pose.hYaw, io]]);
  pose.hNod = kn(t, [[26.2, 6], [28.6, 4], [LOOP0, L0.pose.hNod, io]]);
  pose.hRoll = kn(t, [[26.2, 0], [LOOP0, L0.pose.hRoll, io]]);
  pose.expr = mixExpr(EX_WOW, EX_HAPPY, ramp(t, 26.5, 27.2));
  pose.L = hangL(0, 0.3 * Math.sin(t * 1.6));
  pose.R = hangR(0, 0.3 * Math.sin(t * 1.6 + 0.6));
  const arms: ArmSlot[] = [
    {tid: 'UL', pose: lerpPose(idle(dRest('UL'), t, 0.5), lp('UL'), u)},
    {tid: 'UR', pose: lerpPose(idle(dRest('UR'), t, 1.5), lp('UR'), u)},
    {tid: 'LL', pose: inLim(lerpPose(inLim(live), lp('LL'), u)), side: -1},
  ];
  // the guesser beside her, three arms now
  const w = P.w;
  const wp = {...w.pose, blink: blinkAt(t, 0.7), breath: breathAt(t, 0.5), hYaw: -26, expr: EX_HAPPY};
  const wArms = w.arms.map((a, i) => ({...a, pose: idle(wRest(a.tid), t, i)}));
  // camera: glide out (reveal), then the push toward the reaching hand that becomes frame 0
  const glide: Cam = {
    t: kpath(t, [[26.2, v3(-36, 134, 0)], [27.6, v3(-22, 140, 0)], [28.6, v3(-30, 142, 4)]]),
    yaw: kn(t, [[26.2, 10], [28.6, 6, io]]),
    pitch: kn(t, [[26.2, 8], [28.6, 4]]),
    dist: kn(t, [[26.2, 150], [27.6, 236, io], [28.6, 230]]),
    f: 1380,
  };
  const c0 = s1Cam(lt);
  const loopCam: Cam = {...c0, t: a3(c0.t, DPOS)};
  const cu = ramp(t, 28.6, LOOP0, io);
  const cam = t < 28.6 ? glide : t < LOOP0 ? {...mixCam(glide, loopCam, cu), dist: glide.dist * Math.pow(loopCam.dist / glide.dist, cu)} : loopCam;
  return {
    cam,
    wearers: [
      {id: 'w', look: GUESSER, pose: wp, arms: wArms, legs: true, termLed: w.termLed},
      {id: 'd', look: WEARER2, pose, arms, legs: true, termLed: {UL: 1, UR: 1, LL: 1}},
    ],
  };
};
void lin;
void HAND_GRIP;
