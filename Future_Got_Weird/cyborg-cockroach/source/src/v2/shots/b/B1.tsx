// B1 (143-186, "Scientists strapped a tiny"): the fitting, at a high angle (az 20, el 46) over the fitting station's
// dark cutting mat. The living medic stands, antennae searching, breathing. Two gloved hands, already coming down when
// the film's foam wipe clears (the descent began before the cut), each pinch one end of the module (saddle, board and
// the loaded launch tube) between index and thumb; its wires hang slack from the board to the electrodes already at the
// antenna bases and cerci. The module comes down, its slight misalignment closing as it lands, and is pressed home on
// "strapped" (B_SEAT): the body gives a little under the press and the wires lie down along the shell. The fingers then
// open and the hands lift away (still rising at the cut). The camera is locked off: the hands carry the action.
// The same insect, pose function and world carry on in B2 (the tight side view of the mounting, its first step).
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {Frame, toW, add as add3, V3} from '../../../lib/v3';
import {clamp, sr, ramp, easeIn} from '../../../lib/ease';
import {V} from '../../../lib/math';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {Mat2D, GloveArm, ArmPose, solvePinch, OPEN_POSE, mixPose, carriedWires, WireDraw, setOff, FPS} from './common';

// ------------------------------------------------------------------ the shared action (one insect, one world: B1-B2)
/** the module is pressed home (s): on "strapped" (5.47-5.79) */
export const B_SEAT = 5.55;
/** the insect's first step (s), early in B2 */
export const B_GO = 6.27;
export const B_SPEED = 36;
const S_REST = plantedStop(0);
const PATH = straightPath([-S_REST, 0, 0], 0);
export const bWalkS = (t: number) => S_REST + setOff(t, B_GO, B_SPEED, 0.5);
/** the descent started before the cut (under the foam wipe): at B1's first frame the module is ~32 mm up and moving */
const T_DESC = 4.5, LIFT0 = 52;
/** the module's height above its seat (mm): a decelerating descent that lands at B_SEAT */
export const packLift = (t: number) => (t >= B_SEAT ? 0 : LIFT0 * Math.pow(1 - clamp((t - T_DESC) / (B_SEAT - T_DESC)), 1.6));
/** the press: the body gives a little under the fingers, then recovers */
const press = (t: number) => {
  const d = t - (B_SEAT - 0.03);
  return d <= 0 ? 0 : (1 - Math.exp(-d / 0.04)) * Math.exp(-d / 0.3);
};
export const bPose = (t: number): RoachPose => {
  const p = press(t);
  // the antennae: searching; they flick back at the press, and point ahead once it walks
  const go = sr(t, B_GO - 0.25, B_GO + 0.35);
  return poseRoach({
    path: PATH, s: bWalkS(t), t, search: 0.85, seed: 3,
    offset: [0, -1.3 * p, 0],
    antL: {yaw: 0.72 + 0.35 * p - 0.14 * go, pitch: 0.22 + 0.3 * p + 0.06 * go, curl: 0.85 - 0.2 * p},
    antR: {yaw: 0.72 + 0.35 * p - 0.14 * go, pitch: 0.22 + 0.3 * p + 0.06 * go, curl: 0.85 - 0.2 * p},
  });
};
/** the module's frame: the body frame, lifted and a little off its seat (back and to the far side) while it is carried */
const packFrame = (f: Frame, t: number): Frame => {
  const l = packLift(t), k = clamp(l / 40);
  return {...f, o: add3(f.o, [-3.5 * k, l, -6 * k])};
};

// grip points on the module (body frame of the seated module, mm): each hand pinches one end of the saddle, the index
// tip against its near side, the thumb tip against its far side
const GRIPS: {I: V3; T: V3}[] = [
  {I: [-14.6, 22.9, 10.6], T: [-14.6, 23.6, -10.2]}, // the rear end (the researcher's right hand, screen left)
  {I: [16.4, 22.9, 10.6], T: [16.4, 23.6, -10.2]}, // the front end (left hand, screen right)
];
const G_REF: V3 = [0, 23, 0];
const HAND_MM = 60;

type Grip = ArmPose[];
const memo: Record<string, Grip> = {};
/** solve both pinches once per view (at the seated reference pose); afterwards the hands are carried with the module */
const solveGrips = (key: string, v: View, f: Frame, angs: [number, number], fores: [number, number], tss: [1 | -1, 1 | -1]): Grip => {
  if (memo[key]) return memo[key];
  const L = HAND_MM * v.s;
  const pv = (p: V3): V => {
    const q = P(v, toW(f, p));
    return {x: q[0], y: q[1]};
  };
  memo[key] = GRIPS.map((g, i) => {
    const r = solvePinch(pv(g.I), pv(g.T), angs[i], L, tss[i]);
    return {wrist: r.wrist, ang: r.ang, L, ts: tss[i], pose: r.pose, fore: fores[i]};
  });
  return memo[key];
};

/** the release: the fingers open, then the hands rise and draw back (mm), accelerating away */
export const B1_OPEN: [number, number] = [174, 181];
export const handRelease = (f: number) => ({release: sr(f, B1_OPEN[0], B1_OPEN[1]), up: 62 * easeIn(ramp(f, 176, 188), 1.7), back: 26 * easeIn(ramp(f, 176, 188), 1.7)});

// ------------------------------------------------------------------ B1
const B1_AZ = 20, B1_EL = 46, B1_S = 9.6;
const B1_AT: V3 = [-2, 12, 0];
export const b1View = (): View => viewAt(B1_AZ, B1_EL, B1_S, B1_AT, 540, 1080);

export const B1: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const id = `b1f${f}`;
  const v = b1View();
  const refF = bPose(B_SEAT + 0.4).frame;
  const grip = solveGrips('b1', v, refF, [70, 110], [246, 294], [-1, 1]);
  const hm = handRelease(f);
  const pose = bPose(t);
  const fb = pose.frame;
  const fp = packFrame(fb, t);
  const lift = packLift(t);
  const w = carriedWires(fb, fp, lift);
  // the hands ride with the module (screen offset of its grip point) until they let go, then rise and draw back
  const ref0 = P(v, toW(refF, G_REF)), ref1 = P(v, toW(packFrame(bPose(t).frame, t), G_REF));
  const o = P(v, [0, 0, 0]), dW = P(v, [0, hm.up, -hm.back]);
  const d: V = {x: ref1[0] - ref0[0] + dW[0] - o[0], y: ref1[1] - ref0[1] + dW[1] - o[1]};
  const hands = grip.map((a) => ({...a, pose: hm.release > 0 ? mixPose(a.pose, OPEN_POSE, hm.release) : a.pose, wrist: {x: a.wrist.x + d.x, y: a.wrist.y + d.y}}));
  // shadows: the module's on the back (soft, pushed down-right with height) and the hands' on the mat
  const sc = P(v, toW(fb, [1, 20, 0]));
  const packSh = lift > 0.3 ? (
    <g>
      <defs>
        <filter id={`${id}-ps`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(1.0 * v.s + lift * 0.1 * v.s)} />
        </filter>
      </defs>
      <ellipse cx={f2(sc[0] + lift * 0.3 * v.s)} cy={f2(sc[1] + lift * 0.25 * v.s * v.F[1])} rx={f2(16 * v.s)} ry={f2(9.5 * v.s * Math.max(0.4, v.F[1]))} fill="#1A1612" opacity={0.32 * (1 - clamp(lift / 70))} filter={`url(#${id}-ps)`} />
    </g>
  ) : null;
  const hgt = lift + 30 + hm.up;
  const shOff = {x: hgt * 0.3 * v.s, y: hgt * 0.36 * v.s * v.F[1]};
  const benchFar = P(v, [0, 0, -330])[1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.benchTop} />
      <g filter={`url(#${id}-wb)`}>
        <g transform={`translate(-260 ${f2(benchFar - 1010 * 1.25)}) scale(1.25)`}>
          <LabWall2 id={`${id}w`} />
        </g>
      </g>
      <Mat2D v={v} x0={-190} x1={230} z0={-250} z1={190} />
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: `${id}r`,
          gear: (
            <g>
              {packSh}
              <WireDraw v={v} w={w} />
              <Gear2D id={`${id}g`} v={v} f={fp} g={{kind: 'injector', noWires: true}} />
            </g>
          ),
        }}
      />
      {hands.map((a, i) => (
        <GloveArm key={i} id={`${id}h${i}`} a={a} shadow={{alpha: 0.12 * (1 - clamp(hm.up / 120)), offset: shOff}} />
      ))}
    </svg>
  );
};
