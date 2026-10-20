// V4 café exterior world: the two people stand on the sidewalk in front of the café; shots are cameras into it.
import React from 'react';
import {clamp, lerp, V} from '../../lib/math';
import {splineRec, SKey} from '../../lib/motion';
import {HAND_RELAXED, mixHand} from '../../art/Hand';
import {Cam, Layer} from '../../lib/camera';
import {Man, manJoints} from '../rig/Man';
import {Woman, womanJoints} from '../rig/Woman';
import {Fig, figure} from '../rig/poses';
import {PaperCup} from '../env/Props';
import {EXT_FLOOR, ExteriorBack, ExteriorFront} from '../env/Exterior';
import {Implant4} from '../art/Implant';
import {GRIP, X, ExprKey, exprAt, blinkAt} from './interior';
import {Expr, EXPR_NEUTRAL} from '../../art/Head';

export const ES = 0.66;
export const EW_X = 335;
export const EM_X = 770;

type ER = {neck: number; yaw: number; torso: number; chest: number; mneck: number; myaw: number; mtorso: number; cupLift: number; wShift: number; mShift: number};
const R = (o: Partial<ER>): ER => ({neck: 0, yaw: 20, torso: 3, chest: 0, mneck: 0, myaw: 22, mtorso: 3, cupLift: 0, wShift: 0, mShift: 0, ...o});
// Acting channels: the eyes (expression keys) lead, the head follows, then the torso, then the weight. She looks down at her
// cup; when his greeting lands (2.02 s) her eyes come up first, her head follows, her torso straightens and she shifts her
// weight toward him. He glances up while he thinks it (the implant pulses), then looks at her and leans in a little.
const HEAD_KEYS: SKey<ER>[] = [
  [0.7, R({neck: 15, yaw: 14, myaw: 22, mneck: 0})],
  [1.0, R({neck: 15, yaw: 14, myaw: 25, mneck: -4})],
  [1.45, R({neck: 15, yaw: 14, myaw: 25, mneck: -6})],
  [1.85, R({neck: 15, yaw: 14, myaw: 22, mneck: -1})],
  [2.1, R({neck: 14, yaw: 15, myaw: 22, mneck: -1})],
  [2.42, R({neck: -1, yaw: 22, myaw: 24, mneck: -2})],
  [2.7, R({neck: -3, yaw: 22, myaw: 26, mneck: -4})],
  [3.3, R({neck: -2, yaw: 22, myaw: 26, mneck: -4})],
];
const BODY_KEYS: SKey<ER>[] = [
  [0.7, R({torso: 3, mtorso: 3, wShift: 0, mShift: 0})],
  [1.85, R({torso: 3, mtorso: 3, wShift: 0, mShift: 0})],
  [2.2, R({torso: 3, mtorso: 2, wShift: 0, mShift: -2})],
  [2.65, R({torso: 1.6, mtorso: 1.5, wShift: 6, mShift: -5})],
  [3.3, R({torso: 1.8, mtorso: 1.5, wShift: 6.5, mShift: -5.5})],
];
const rAt = (t: number): ER => ({...splineRec(t, HEAD_KEYS), ...splineRec(t, BODY_KEYS)} as ER);
const E = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
const W_EX: ExprKey[] = [
  [0.7, E({smile: 0.25, lid: 0.2, gx: 0.3, gy: 0.9, flush: 0.2})],
  [1.98, E({smile: 0.25, lid: 0.2, gx: 0.3, gy: 0.9, flush: 0.2})],
  [2.06, E({smile: 0.2, lid: 0, gx: 0.55, gy: 0.1, browIn: 0.1, pupil: 1.05})],
  [2.28, E({smile: 0.6, lid: 0.05, gx: 0.85, gy: 0, flush: 0.35, open: 0.1})],
  [2.55, X.wGlad],
  [3.3, X.wGlad],
];
const M_EX: ExprKey[] = [
  [0.7, E({smile: 0.45, lid: 0.12, gx: -0.8, flush: 0.2})],
  [1.0, E({smile: 0.3, lid: 0.05, gx: -0.35, gy: -0.55, flush: 0.2, browIn: 0.15})],
  [1.5, E({smile: 0.3, lid: 0.05, gx: -0.3, gy: -0.6, flush: 0.2, browIn: 0.15})],
  [1.84, E({smile: 0.6, lid: 0.1, gx: -0.8, flush: 0.25, open: 0.1})],
  [2.5, E({smile: 0.85, lid: 0.18, gx: -0.8, flush: 0.35, open: 0.2, wide: 1.05})],
  [3.3, E({smile: 0.9, lid: 0.18, gx: -0.7, flush: 0.4, open: 0.24, wide: 1.06})],
];

/** implant pulses (thinking the greeting) */
const pulse = (t: number, t0: number, w = 0.14) => Math.exp(-(((t - t0) / w) ** 2));
export const extGlow = (t: number) => clamp(0.3 + 0.9 * Math.max(pulse(t, 1.04), pulse(t, 1.42), pulse(t, 2.0, 0.18)));

export const solveExterior = (t: number) => {
  const r = rAt(t);
  const mk = (fx: -1 | 1, x: number, extra: Partial<Fig>): Fig => ({fx, x, floor: EXT_FLOOR, s: ES, hipH: 512, ...extra});
  // weight shift: the pelvis moves, the feet stay where they are (the foot offsets absorb the shift)
  const wx = EW_X + r.wShift;
  const mx = EM_X + r.mShift;
  // the far arm hangs forward of the thigh, well below the cup hand: its forearm comes out from behind the torso's front contour
  // and the hand is a separate shape from the cup hand (it was a hand with no visible arm at the hip)
  const farArm = {farShoulderV: -74, farElbow: -1 as const, farFront: 1};
  const wFig0 = mk(1, wx, {torso: r.torso, neck: r.neck, yaw: r.yaw, nearFoot: -24 - r.wShift / ES, farFoot: 56 - r.wShift / ES, nearElbow: -1, ...farArm});
  const W0 = womanJoints(figure(wFig0));
  const hand = {x: W0.Sh.x + 112 * ES, y: W0.Sh.y + 300 * ES};
  const wFar = {x: hand.x + 34, y: hand.y + 84};
  const wFig = {...wFig0, nearHand: hand, nearWrist: 36, farHand: wFar, farWrist: 0, farHa: 78, farHw: 1};
  const wPose = figure(wFig);
  const mFig0 = mk(-1, mx, {torso: r.mtorso, neck: r.mneck, yaw: r.myaw, nearFoot: 24 - r.mShift / ES, farFoot: -52 - r.mShift / ES, nearElbow: -1, ...farArm});
  const M0 = manJoints(figure(mFig0));
  // he has a coffee too: the near hand holds a takeaway cup at the waist (arms bent, not hanging as tubes)
  const mHand = {x: M0.Sh.x - 112 * ES, y: M0.Sh.y + 300 * ES};
  const mFar = {x: mHand.x - 34, y: mHand.y + 84};
  const mPose = figure({...mFig0, nearHand: mHand, nearWrist: -36, farHand: mFar, farWrist: 0, farHa: 102, farHw: 1});
  const WJ = womanJoints(wPose);
  const MJ = manJoints(mPose);
  return {wPose, mPose, wHead: WJ.head, mHead: MJ.head, hand, mHand, wExpr: exprAt(t, W_EX), mExpr: exprAt(t, M_EX), wBlink: blinkAt(t, 1.3, [[1.9, 2.5]]), mBlink: blinkAt(t, 2.2)};
};

export const ExteriorWorld: React.FC<{t: number; f: number; cam: Cam; extra?: (s: ReturnType<typeof solveExterior>) => React.ReactNode}> = ({t, f, cam, extra}) => {
  const s = solveExterior(t);
  const cup = <PaperCup id="pc" x={s.hand.x + 6} y={s.hand.y + 56 * ES} s={ES * 0.95} f={f} steam={0.6} />;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        <ExteriorBack f={f} />
        <ExteriorFront f={f} />
        <Woman id="eW" pose={s.wPose} expr={s.wExpr} blink={s.wBlink} lHand={mixHand(HAND_RELAXED, GRIP, 0.75)} rHand={HAND_RELAXED} held={cup} />
        <Man id="eM" pose={s.mPose} expr={s.mExpr} blink={s.mBlink} lHand={mixHand(HAND_RELAXED, GRIP, 0.75)} rHand={HAND_RELAXED} held={<PaperCup id="pcm" x={s.mHand.x - 6} y={s.mHand.y + 56 * ES} s={ES * 0.95} f={f} steam={0.6} />} headOverlay={<Implant4 yaw={s.mPose.yaw ?? 20} glow={extGlow(t)} color="#46CFFF" f={f} />} />
        {extra?.(s)}
      </Layer>
    </g>
  );
};

export type {V};
void lerp;
