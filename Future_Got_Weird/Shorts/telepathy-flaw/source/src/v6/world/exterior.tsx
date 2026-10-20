// V4 café exterior world: the two people stand on the sidewalk in front of the café; shots are cameras into it.
import React from 'react';
import {clamp, lerp, V} from '../../lib/math';
import {splineRec, SKey} from '../../lib/motion';
import {HAND_RELAXED, HandPose, mixHand} from '../../art/Hand';
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

/** V6 standing poses, authored as silhouettes first. Offsets are rig units (x ES) from the figure's shoulder line, `f` toward the
 *  figure's front and `d` down. The weight-bearing leg is straight under its hip; the other leg rests with the foot placed
 *  ahead/behind and the heel lifted. The two characters stand differently (she: weight on her back leg, one foot forward, the
 *  free arm straight and quiet; he: weight on his front leg, the other foot back and out, the free arm a little forward with the
 *  elbow soft). The cup arm is bent with the elbow near the ribs and the cup at the lower chest. */
export type Lim = {f: number; d: number; wr?: number; ha?: number; hw?: number};
export type StandPose = {
  hipH: number;
  /** ankle x offsets from the pelvis, toward the figure's front (rig px at scale 1) and heel lift (rig units) */
  nearFoot: number;
  farFoot: number;
  nearUp: number;
  farUp: number;
  pelvis: number;
  cup: Lim;
  free: Lim;
  freeHand: HandPose;
  /** how the free (far) arm is layered: 0 = its forearm and hand are drawn outside the torso only (the arm hangs behind the body and
   *  shows past the contour / below the hem), 1 = the forearm crosses in front of the torso */
  farFront?: number;
  /** far shoulder offset across the torso (rig units; default: the rig's own) */
  farSv?: number;
};
const HAND_SOFT: HandPose = {curl: [0.26, 0.32, 0.38, 0.44], spread: 0.08, thumb: 12, thumbCurl: 0.45};
const HAND_LOOSE: HandPose = {curl: [0.36, 0.44, 0.5, 0.56], spread: 0.06, thumb: 10, thumbCurl: 0.55};
export const W_STAND: StandPose = {hipH: 509, nearFoot: -34, farFoot: 58, nearUp: 0, farUp: 8, pelvis: 2.5, cup: {f: 104, d: 192, wr: 30}, free: {f: -95, d: 368, wr: 0}, freeHand: HAND_SOFT};
export const M_STAND: StandPose = {hipH: 509, nearFoot: 58, farFoot: -40, nearUp: 8, farUp: 0, pelvis: -2.5, cup: {f: 100, d: 194, wr: 28}, free: {f: -78, d: 364, wr: 8}, freeHand: HAND_LOOSE};
export type ExtOv = {w?: Partial<StandPose>; m?: Partial<StandPose>};

export const solveExterior = (t: number, ov: ExtOv = {}) => {
  const r = rAt(t);
  const WP = {...W_STAND, ...ov.w};
  const MP = {...M_STAND, ...ov.m};
  const mk = (fx: -1 | 1, x: number, P: StandPose, extra: Partial<Fig>): Fig => ({
    fx,
    x,
    floor: EXT_FLOOR,
    s: ES,
    hipH: P.hipH,
    pelvis: P.pelvis,
    nearFoot: P.nearFoot * fx,
    farFoot: P.farFoot * fx,
    nearFootUp: P.nearUp,
    farFootUp: P.farUp,
    nearElbow: -1,
    farElbow: -1,
    bodyW: 0.86,
    farFront: P.farFront ?? 0,
    farShoulderV: P.farSv,
    ...extra,
  });
  // weight shift: the pelvis moves, the feet stay where they are (the foot offsets absorb the shift)
  const wx = EW_X + r.wShift;
  const mx = EM_X + r.mShift;
  const wFig0 = mk(1, wx, WP, {torso: r.torso, neck: r.neck, yaw: r.yaw});
  const wB = {...wFig0, nearFoot: (wFig0.nearFoot ?? 0) - r.wShift / ES, farFoot: (wFig0.farFoot ?? 0) - r.wShift / ES};
  const W0 = womanJoints(figure(wB));
  const at = (J: {Sh: V}, fx: 1 | -1, L: Lim): V => ({x: J.Sh.x + fx * L.f * ES, y: J.Sh.y + L.d * ES});
  const hand = at(W0, 1, WP.cup);
  const wFar = at(W0, 1, WP.free);
  const wPose = figure({...wB, nearHand: hand, nearWrist: WP.cup.wr ?? 0, farHand: wFar, farWrist: WP.free.wr ?? 0, farHa: WP.free.ha, farHw: WP.free.hw ?? 0});
  const mFig0 = mk(-1, mx, MP, {torso: r.mtorso, neck: r.mneck, yaw: r.myaw});
  const mB = {...mFig0, nearFoot: (mFig0.nearFoot ?? 0) - r.mShift / ES, farFoot: (mFig0.farFoot ?? 0) - r.mShift / ES};
  const M0 = manJoints(figure(mB));
  // he has a coffee too: the near hand holds a takeaway cup at the lower chest, the elbow near the ribs
  const mHand = at(M0, -1, MP.cup);
  const mFar = at(M0, -1, MP.free);
  const mPose = figure({...mB, nearHand: mHand, nearWrist: -(MP.cup.wr ?? 0), farHand: mFar, farWrist: MP.free.wr ?? 0, farHa: MP.free.ha, farHw: MP.free.hw ?? 0});
  const WJ = womanJoints(wPose);
  const MJ = manJoints(mPose);
  return {wPose, mPose, wHead: WJ.head, mHead: MJ.head, hand, mHand, wFreePt: wFar, mFreePt: mFar, wFree: WP.freeHand, mFree: MP.freeHand, wExpr: exprAt(t, W_EX), mExpr: exprAt(t, M_EX), wBlink: blinkAt(t, 1.3, [[1.9, 2.5]]), mBlink: blinkAt(t, 2.2)};
};

export const ExteriorWorld: React.FC<{t: number; f: number; cam: Cam; ov?: ExtOv; extra?: (s: ReturnType<typeof solveExterior>) => React.ReactNode}> = ({t, f, cam, ov, extra}) => {
  const s = solveExterior(t, ov);
  const cup = <PaperCup id="pc" x={s.hand.x + 6} y={s.hand.y + 56 * ES} s={ES * 0.95} f={f} steam={0.6} />;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        <ExteriorBack f={f} />
        <ExteriorFront f={f} />
        <Woman id="eW" pose={s.wPose} expr={s.wExpr} blink={s.wBlink} lHand={mixHand(HAND_RELAXED, GRIP, 0.75)} rHand={s.wFree} held={cup} />
        <Man id="eM" pose={s.mPose} expr={s.mExpr} blink={s.mBlink} lHand={mixHand(HAND_RELAXED, GRIP, 0.75)} rHand={s.mFree} held={<PaperCup id="pcm" x={s.mHand.x - 6} y={s.mHand.y + 56 * ES} s={ES * 0.95} f={f} steam={0.6} />} headOverlay={<Implant4 yaw={s.mPose.yaw ?? 20} glow={extGlow(t)} color="#46CFFF" f={f} />} />
        {extra?.(s)}
      </Layer>
    </g>
  );
};

export type {V};
void lerp;
