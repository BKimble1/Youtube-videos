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

type ER = {neck: number; yaw: number; torso: number; chest: number; mneck: number; myaw: number; mtorso: number; cupLift: number};
const R = (o: Partial<ER>): ER => ({neck: 0, yaw: 20, torso: 3, chest: 0, mneck: 0, myaw: 22, mtorso: 3, cupLift: 0, ...o});
const KEYS: SKey<ER>[] = [
  [0.7, R({neck: 15, yaw: 14})],
  [2.02, R({neck: 15, yaw: 14})],
  [2.3, R({neck: -1, yaw: 22, torso: 2})],
  [2.65, R({neck: -3, yaw: 22, torso: 2})],
  [3.3, R({neck: -2, yaw: 22, torso: 2, myaw: 26, mneck: -4})],
];
const E = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});
const W_EX: ExprKey[] = [
  [0.7, E({smile: 0.25, lid: 0.2, gx: 0.3, gy: 0.9, flush: 0.2})],
  [2.02, E({smile: 0.25, lid: 0.2, gx: 0.3, gy: 0.9, flush: 0.2})],
  [2.12, E({smile: 0.2, lid: 0, gx: 0.6, gy: 0.3, browIn: 0.1, pupil: 1.05})],
  [2.32, E({smile: 0.6, lid: 0.05, gx: 0.85, gy: 0, flush: 0.35, open: 0.1})],
  [2.55, X.wGlad],
  [3.3, X.wGlad],
];
const M_EX: ExprKey[] = [
  [0.7, E({smile: 0.45, lid: 0.12, gx: -0.8, flush: 0.2})],
  [1.9, E({smile: 0.6, lid: 0.1, gx: -0.8, flush: 0.25, open: 0.1})],
  [2.5, E({smile: 0.85, lid: 0.18, gx: -0.8, flush: 0.35, open: 0.2, wide: 1.05})],
  [3.3, E({smile: 0.9, lid: 0.18, gx: -0.7, flush: 0.4, open: 0.24, wide: 1.06})],
];

/** implant pulses (thinking the greeting) */
const pulse = (t: number, t0: number, w = 0.14) => Math.exp(-(((t - t0) / w) ** 2));
export const extGlow = (t: number) => clamp(0.3 + 0.9 * Math.max(pulse(t, 1.04), pulse(t, 1.42), pulse(t, 2.0, 0.18)));

export const solveExterior = (t: number) => {
  const r = splineRec(t, KEYS);
  const mk = (fx: -1 | 1, x: number, extra: Partial<Fig>): Fig => ({fx, x, floor: EXT_FLOOR, s: ES, hipH: 512, ...extra});
  const wFig0 = mk(1, EW_X, {torso: r.torso, neck: r.neck, yaw: r.yaw, nearFoot: -24, farFoot: 56, farRest: {u: -366, v: -64}, nearElbow: -1, farElbow: -1});
  const W0 = womanJoints(figure(wFig0));
  const hand = {x: W0.Sh.x + 112 * ES, y: W0.Sh.y + 300 * ES};
  const wFig = {...wFig0, nearHand: hand, nearWrist: 36};
  const wPose = figure(wFig);
  const mFig = mk(-1, EM_X, {torso: r.mtorso, neck: r.mneck, yaw: r.myaw, nearFoot: 24, farFoot: -52, nearRest: {u: -371, v: 64}, farRest: {u: -366, v: -62}, nearElbow: -1, farElbow: -1});
  const mPose = figure(mFig);
  const WJ = womanJoints(wPose);
  const MJ = manJoints(mPose);
  return {wPose, mPose, wHead: WJ.head, mHead: MJ.head, hand, wExpr: exprAt(t, W_EX), mExpr: exprAt(t, M_EX), wBlink: blinkAt(t, 1.3, [[1.9, 2.5]]), mBlink: blinkAt(t, 2.2)};
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
        <Man id="eM" pose={s.mPose} expr={s.mExpr} blink={s.mBlink} lHand={HAND_RELAXED} rHand={HAND_RELAXED} headOverlay={<Implant4 yaw={s.mPose.yaw ?? 20} glow={extGlow(t)} color="#46CFFF" f={f} />} />
        {extra?.(s)}
      </Layer>
    </g>
  );
};

export type {V};
void lerp;
