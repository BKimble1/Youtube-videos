// Cast, places and shared helpers for the shots.
import {EXPR_NEUTRAL, Expr} from '../dc/Head';
import {HAND_RELAXED, HandPose} from '../dc/Hand';
import {Pose3, GUESSER, OPERATOR, WEARER2, bodyFrame, Arm3} from '../r3/body';
import {terminal, TermId} from '../r3/harness';
import {ArmPose, reachArm, armFK, ArmGeo, frameZ} from '../r3/robot';
import {a3, k3, n3, s3, V3, v3, M3, mv} from '../r3/m3';
import {sideOf} from '../r3/stage';

export {GUESSER, OPERATOR, WEARER2};
export const FPS = 30;
export const DUR = 31.0;

export const EX_HAPPY: Expr = {...EXPR_NEUTRAL, smile: 0.75, open: 0.12, wide: 1.05, browIn: 0.0, lid: 0.08};
export const EX_WOW: Expr = {...EXPR_NEUTRAL, smile: 0.5, open: 0.34, wide: 0.86, browIn: 0.35, lid: 0, pupil: 1.05};
export const EX_FOCUS: Expr = {...EXPR_NEUTRAL, smile: 0.2, open: 0.02, browDown: 0.25, lid: 0.18};
export const EX_CALM: Expr = {...EXPR_NEUTRAL, smile: 0.45};

export const HAND_HANG: HandPose = {curl: [0.42, 0.48, 0.52, 0.56], spread: 0.22, thumb: 16, thumbCurl: 0.5};
export const HAND_GRIP: HandPose = {curl: [0.62, 0.68, 0.72, 0.76], spread: 0.3, thumb: 40, thumbCurl: 0.55};
export const HAND_PINCH: HandPose = {curl: [0.5, 0.58, 0.7, 0.78], spread: 0.25, thumb: 34, thumbCurl: 0.5};
export {HAND_RELAXED};

/** Relaxed arms hanging at the sides (body-local targets). */
export const hangL = (dx = 0, dy = 0, dz = 0): Arm3 => ({h: v3(22.6 + dx, 99.5 + dy, 3.5 + dz), pole: v3(0.35, 0, -1), dir: v3(0.05, -1, 0.12), thumb: v3(0, 0, 1), hand: HAND_HANG});
export const hangR = (dx = 0, dy = 0, dz = 0): Arm3 => ({h: v3(-22.6 + dx, 99.5 + dy, 3.5 + dz), pole: v3(-0.35, 0, -1), dir: v3(-0.05, -1, 0.12), thumb: v3(0, 0, 1), hand: HAND_HANG});

export const basePose = (pos: V3, face: number, expr: Expr = EX_CALM): Pose3 => ({
  pos,
  face,
  lean: 0,
  hYaw: 0,
  hNod: 0,
  hRoll: 0,
  L: hangL(),
  R: hangR(),
  expr,
  blink: 0,
  breath: 0,
});

/** Blink: a quick close every ~3.4 s (offset per person). */
export const blinkAt = (t: number, off = 0) => {
  const p = ((t + off) % 3.4) * 30;
  return p < 2 ? p / 2 : p < 4 ? 1 - (p - 2) / 2 : 0;
};
export const breathAt = (t: number, off = 0) => Math.sin((t + off) * 1.6);

/** A plugged arm reaching a wrist target with a given hand direction / palm direction (world). */
export const reachSlot = (pose: Pose3, tid: TermId, wrist: V3, dir: V3, palm: V3, grip: number, spread: number, eSide: 1 | -1, wrRef?: number, plugOut = 0): ArmPose => {
  const t = terminal(bodyFrame(pose), tid);
  const base = a3(t.face, k3(t.B.z, plugOut));
  return reachArm(base, t.B, wrist, dir, palm, {yaw: 0, pitch: 0, elbow: 0, wp: 0, wr: 0, grip, spread}, sideOf(tid), eSide, 1, wrRef);
};
export const slotGeo = (pose: Pose3, tid: TermId, ap: ArmPose, plugOut = 0): ArmGeo => {
  const t = terminal(bodyFrame(pose), tid);
  return armFK(t.face, t.B, ap, sideOf(tid), 1, plugOut);
};
export const termFrame = (pose: Pose3, tid: TermId) => terminal(bodyFrame(pose), tid);

/** Interpolate two frames (z axis and x hint lerped then re-orthonormalised). */
export const mixFrame = (A: M3, B: M3, t: number): M3 => {
  const z = n3(a3(k3(A.z, 1 - t), k3(B.z, t)));
  const x = n3(a3(k3(A.x, 1 - t), k3(B.x, t)));
  return frameZ(z, x);
};
export {mv, s3};
