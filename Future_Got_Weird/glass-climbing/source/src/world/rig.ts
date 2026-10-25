// Hand and foot placement on the Crew rig (dc/Man): the hand helpers are the Real Web Fluid V6 lab's (Lab6.tsx
// placeHand / handUV), here shared by every scene; the foot helpers place an ankle so the shoe's arch sits on a stirrup
// bar or the sole on the floor.
import {DIM, manJoints, ManPose} from '../dc/Man';
import {digitTips, HandPose} from '../dc/Hand';
import {add, clamp, deg, lerpV, mul, perp, sub, V} from '../dc/math';

export const dirOf = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});
export const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** closed round a bar: the fingers wrap over it, the thumb opposes from the other side */
export const H_BAR: HandPose = {curl: [0.74, 0.8, 0.84, 0.88], spread: 0.06, thumb: 34, thumbCurl: 0.55};
/** the grip opening as a hand comes off or onto a bar */
export const H_BAR_OPEN: HandPose = {curl: [0.42, 0.46, 0.5, 0.54], spread: 0.16, thumb: 44, thumbCurl: 0.3};
export const H_REST: HandPose = {curl: [0.24, 0.3, 0.34, 0.38], spread: 0.28, thumb: 20, thumbCurl: 0.35};

export const handUV = (pose: HandPose, which: 'index' | 'thumb' | 'pinch' | 'grip'): {u: number; v: number} => {
  const t = digitTips({x: 0, y: 0}, 0, 1, 1, pose);
  const p = which === 'index' ? t.tips[0] : which === 'thumb' ? t.thumb : which === 'pinch' ? lerpV(t.tips[0], t.thumb, 0.5) : lerpV(lerpV(t.tips[0], t.tips[1], 0.5), t.thumb, 0.42);
  return {u: p.x, v: p.y};
};

export type Side = 'L' | 'R';
/** the pose with one hand placed so its hand-unit point (gu, gv) lies on `grip` with the hand axis at `ang`; when the
 *  target is close to the shoulder the arm is foreshortened (it points toward the camera) instead of folding */
export const placeHand = (p: ManPose, side: Side, grip: V, ang: number, gu: number, gv: number): ManPose => {
  const LH = DIM.hand * p.s;
  const ARM = (DIM.upperArm + DIM.foreArm) * p.s;
  const ts = side === 'L' ? 1 : -1;
  const d = dirOf(ang);
  const drawnWrist = sub(sub(grip, mul(d, gu * LH)), mul(perp(d), gv * LH * ts));
  const S = side === 'L' ? manJoints(p).L.S : manJoints(p).R.S;
  const dist = Math.hypot(drawnWrist.x - S.x, drawnWrist.y - S.y);
  const fa = clamp(dist / (ARM * 0.82), 0.5, 1);
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

/** where the hand's grip point actually is (the rig never stretches an arm, so a far target is not reached) */
export const achievedGrip = (p: ManPose, side: Side, gu: number, gv: number) => {
  const LH = DIM.hand * p.s;
  const ts = side === 'L' ? 1 : -1;
  const j = manJoints(p);
  const A = side === 'L' ? j.L : j.R;
  const wrist = add(A.W, mul(A.foreDir, -6 * p.s));
  const dd = dirOf(A.handAng);
  return add(add(wrist, mul(dd, gu * LH)), mul(perp(dd), gv * LH * ts));
};

/** how far the hand actually lands from where it was asked to go (QA: the rig never stretches an arm) */
export const handError = (p: ManPose, side: Side, grip: V, ang: number, gu: number, gv: number) => {
  const LH = DIM.hand * p.s;
  const ts = side === 'L' ? 1 : -1;
  const j = manJoints(p);
  const A = side === 'L' ? j.L : j.R;
  const wrist = add(A.W, mul(A.foreDir, -6 * p.s));
  const dd = dirOf(A.handAng);
  const at = add(add(wrist, mul(dd, gu * LH)), mul(perp(dd), gv * LH * ts));
  return Math.hypot(at.x - grip.x, at.y - grip.y);
};

/** shoe geometry relative to the ankle for a planted foot (toes toward screen-left): the arch's bar point and the sole */
export const ARCH = (s: number): V => ({x: -30 * s, y: 36 * s});
export const SOLE = 27; // ankle height above the floor for a flat foot (rig units at s = 1)
export const ankleForBar = (bar: V, s: number): V => sub(bar, ARCH(s));
export const barForAnkle = (A: V, s: number): V => add(A, ARCH(s));
