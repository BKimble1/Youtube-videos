// The scientist: the Weird Crew's guesser in his lab outfit (white coat over the striped tee, clear safety glasses,
// nitrile gloves), on the Death Clock rig as carried by Real Web Fluid V6 (dc/), unchanged. Hand placement and the
// pinch geometry are Real Web Fluid's (v6/Lab6.tsx placeHand / handUV), so held tools sit exactly between the digits.
import {DIM, GUESSER, manJoints, ManPose, Outfit} from '../dc/Man';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';
import {digitTips, HandPose} from '../dc/Hand';
import {add, clamp, deg, lerpV, mul, perp, sub, V} from '../dc/math';

export const GLOVE = '#9DC3E6';
export const COAT = '#F4F7FA';
export const HERO_LAB: Outfit = {...GUESSER, shirt: COAT, stripe: null, longSleeve: true, glasses: true, glove: GLOVE};
export const LS = 1.25;
export const LH = DIM.hand * LS;
const ARM = (DIM.upperArm + DIM.foreArm) * LS;

export const BASE: ManPose = {
  x: 0, y: 0, s: LS, torso: 4, chest: 4, neck: -2, turn: 0.45, pelvis: 0,
  lTu: 150, lTv: -40, lWx: 0, lWy: 0, lW: 0, lElb: -1, lWr: 0,
  rTu: 150, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: -1, rWr: 0,
  lHip: 6, lKnee: 4, lAnk: 0, rHip: -6, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
} as ManPose;

export const EXPR_FOCUS: Expr = {...EXPR_NEUTRAL, browIn: 0.05, browDown: 0.7, lid: 0.22, squint: 0.1, smile: -0.05, open: 0.02, wide: 0.9, gx: -0.75, gy: -0.15, flush: 0.2};
export const EXPR_LAB: Expr = {...EXPR_NEUTRAL, browIn: 0.15, browDown: 0.25, lid: 0.18, smile: 0.2, gx: -0.5, gy: 0.55};
export const EXPR_PROUD: Expr = {...EXPR_NEUTRAL, browIn: 0.2, browDown: 0.1, lid: 0.15, squint: 0.15, smile: 0.6, open: 0.08, wide: 1.05, teeth: 0.4, gx: -0.6, gy: 0.35};
export const EXPR_LOOK_R: Expr = {...EXPR_NEUTRAL, browIn: 0.3, browDown: 0.05, lid: 0.12, smile: 0.35, gx: 0.85, gy: 0.2};

export const H_REST: HandPose = {curl: [0.24, 0.3, 0.34, 0.38], spread: 0.28, thumb: 20, thumbCurl: 0.35};
export const H_FLAT: HandPose = {curl: [0.08, 0.1, 0.12, 0.16], spread: 0.3, thumb: 30, thumbCurl: 0.15};
export const H_PINCH: HandPose = {curl: [0.3, 0.92, 0.95, 0.97], spread: 0.1, thumb: 16, thumbCurl: 0.3};
export const H_PEN: HandPose = {curl: [0.42, 0.62, 0.86, 0.9], spread: 0.1, thumb: 22, thumbCurl: 0.4};

export const dirOf = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
export const handUV = (pose: HandPose, which: 'index' | 'thumb' | 'pinch'): {u: number; v: number} => {
  const t = digitTips({x: 0, y: 0}, 0, 1, 1, pose);
  const p = which === 'index' ? t.tips[0] : which === 'thumb' ? t.thumb : lerpV(t.tips[0], t.thumb, 0.5);
  return {u: p.x, v: p.y};
};
export type Side = 'L' | 'R';
/** the pose with one hand placed so its hand-unit point (gu, gv) lies on `grip`, hand axis at `ang` */
export const placeHand = (p: ManPose, side: Side, grip: V, ang: number, gu: number, gv: number): ManPose => {
  const ts = side === 'L' ? 1 : -1;
  const d = dirOf(ang);
  const drawnWrist = sub(sub(grip, mul(d, gu * LH)), mul(perp(d), gv * LH * ts));
  const S = side === 'L' ? manJoints(p).L.S : manJoints(p).R.S;
  const dist = Math.hypot(drawnWrist.x - S.x, drawnWrist.y - S.y);
  const fa = clamp(dist / (ARM * 0.82), 0.62, 1);
  let fd = d;
  let q = p;
  for (let i = 0; i < 4; i++) {
    const W = add(drawnWrist, mul(fd, 6 * p.s));
    q = side === 'L' ? {...p, lWx: W.x, lWy: W.y, lW: 1, lFa: fa} : {...p, rWx: W.x, rWy: W.y, rW: 1, rFa: fa};
    const j = manJoints(q);
    fd = (side === 'L' ? j.L : j.R).foreDir;
  }
  const wr = wrap(ang - deg(Math.atan2(fd.y, fd.x)));
  return side === 'L' ? {...q, lWr: wr} : {...q, rWr: wr};
};
/** where the drawn hand is: wrist and axis angle */
export const drawnHand = (p: ManPose, side: Side) => {
  const j = manJoints(p);
  const A = side === 'L' ? j.L : j.R;
  return {wrist: add(A.W, mul(A.foreDir, -6 * p.s)), ang: A.handAng};
};
/** the pinch point (between index and thumb tips) of a drawn hand */
export const pinchOf = (p: ManPose, side: Side, pose: HandPose) => {
  const h = drawnHand(p, side);
  const t = digitTips(h.wrist, h.ang, LH, side === 'L' ? 1 : -1, pose);
  return {p: lerpV(t.tips[0], t.thumb, 0.5), index: t.tips[0], thumb: t.thumb, ang: h.ang};
};
