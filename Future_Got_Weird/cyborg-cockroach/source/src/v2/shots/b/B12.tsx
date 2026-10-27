// B1 (136-185, "Scientists strapped a tiny") and B2 (186-221, "launcher onto a living").
// B1: a three-quarter view from the insect's front right, looking down onto the white tray (el 32: from straight above
// the hands would hide what they hold). The living medic stands, antennae searching, breathing. Two gloved hands come
// down from above, each pinching one end of the removable backpack between index (near side) and thumb (far side),
// like the finished Shorts' hands holding a cocoon. The pack comes down with its wires hanging slack from the board to
// the electrodes already at the antenna bases and cerci, hovers a moment over the back, and is pressed home on
// "strapped" (5.53 s): the body gives a little under the press and the wires lie down along the shell. From then on the
// pack is in the body frame (it never slides).
// B2: straight down from above, wider. The fingers open and the hands lift away (rising toward the camera, drawing back
// to the far side and out of the top of the frame), revealing the seated pack; the insect feels about with its antennae
// and sets off toward screen right (its first steps, the tripod gait seen from above).
import React from 'react';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {Frame, toW, add as add3, V3} from '../../../lib/v3';
import {clamp, keys, sr, ramp, easeIn, smoother} from '../../../lib/ease';
import {V} from '../../../lib/math';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, Bench2, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {Tray2D, FoamBox, LAB_BLOCKS, GloveArm, ArmPose, solvePinch, placeIndex, pinchPose, OPEN_POSE, mixPose, carriedWires, WireDraw, setOff, FPS} from './common';

// ------------------------------------------------------------------ the shared action (one insect, one world)
/** the pack is pressed home (s) */
export const B_SEAT = 5.53;
/** the insect sets off (s) */
export const B_GO = 6.45;
export const B_SPEED = 46;
const S_REST = plantedStop(0);
const PATH = straightPath([-S_REST, 0, 0], 0);
export const bWalkS = (t: number) => S_REST + setOff(t, B_GO, B_SPEED, 0.55);
/** the pack's height above its seat (mm) */
export const packLift = (t: number) => keys(t, [[136 / FPS, 44], [158 / FPS, 6.5], [161 / FPS, 6.5], [B_SEAT, 0]]);
/** the press: the body gives a little under the fingers, then recovers */
const press = (t: number) => {
  const d = t - (B_SEAT - 0.04);
  return d <= 0 ? 0 : (1 - Math.exp(-d / 0.035)) * Math.exp(-d / 0.22);
};
export const bPose = (t: number): RoachPose => {
  const p = press(t);
  // the antennae: searching; they flick back at the press, and point ahead once it walks
  const go = sr(t, B_GO - 0.3, B_GO + 0.4);
  return poseRoach({
    path: PATH, s: bWalkS(t), t, search: 0.85, seed: 3,
    offset: [0, -1.3 * p, 0],
    antL: {yaw: 0.72 + 0.35 * p - 0.12 * go, pitch: 0.22 + 0.3 * p, curl: 0.85 - 0.2 * p},
    antR: {yaw: 0.72 + 0.35 * p - 0.12 * go, pitch: 0.22 + 0.3 * p, curl: 0.85 - 0.2 * p},
  });
};
/** the pack's frame: the body frame, lifted and drawn back toward the far side while it is carried */
const packFrame = (f: Frame, t: number): Frame => {
  const l = packLift(t), k = clamp(l / 44);
  return {...f, o: add3(f.o, [-4 * k, l, -7 * k])};
};

// grip points on the pack (body frame of the seated pack, mm): each hand pinches one end of the saddle, the index tip
// against its near side, the thumb tip against its far side (just showing over the far top edge)
const GRIPS: {I: V3; T: V3}[] = [
  {I: [-14.6, 22.9, 10.6], T: [-14.6, 23.6, -10.2]}, // the rear end (the researcher's right hand, screen left)
  {I: [16.4, 22.9, 10.6], T: [16.4, 23.6, -10.2]}, // the front end (left hand, screen right)
];
const G_REF: V3 = [0, 23, 0];
const HAND_MM = 60;

type Grip = ArmPose[];
const memo: Record<string, Grip> = {};
/** solve both pinches once per view (at the seated reference pose); afterwards the hands are carried with the pack */
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
/** a solved grip seen through another view of the same angles (scale and origin changed) */
const mapGrip = (g: Grip, vRef: View, v: View): Grip => {
  const k = v.s / vRef.s;
  const o0 = P(vRef, [0, 0, 0]), o1 = P(v, [0, 0, 0]);
  return g.map((a) => ({...a, L: a.L * k, wrist: {x: o1[0] + (a.wrist.x - o0[0]) * k, y: o1[1] + (a.wrist.y - o0[1]) * k}}));
};

type HandMove = {release: number; up: number; back: number};
/** the insect, its pack (carried or seated) and the hands, through view v. `grip` is in v's screen space for the
 *  reference pose refF; the hands are carried with the pack until they let go, then lifted (up, mm) and drawn back
 *  toward the far side (back, mm). depthK: how much nearer things are drawn larger per mm of height (a view from
 *  straight above, where height does not move them on screen) */
const Scene: React.FC<{id: string; t: number; v: View; grip: Grip; refF: Frame; hm: HandMove; depthK?: number}> = ({id, t, v, grip, refF, hm, depthK = 0}) => {
  const pose = bPose(t);
  const fb = pose.frame;
  const fp = packFrame(fb, t);
  const lift = packLift(t);
  const w = carriedWires(fb, fp, lift);
  // the hands follow the pack until they let go (they do not walk with the insect afterwards)
  const tf = Math.min(t, B_GO - 0.1);
  const ref0 = P(v, toW(refF, G_REF)), ref1 = P(v, toW(packFrame(bPose(tf).frame, tf), G_REF));
  const o = P(v, [0, 0, 0]), dW = P(v, [0, hm.up, -hm.back]);
  const d: V = {x: ref1[0] - ref0[0] + dW[0] - o[0], y: ref1[1] - ref0[1] + dW[1] - o[1]};
  const pc = P(v, toW(fp, G_REF));
  const kP = 1 + depthK * lift, kH = 1 + depthK * (lift + hm.up);
  const hands = grip.map((a) => {
    const pose2 = hm.release > 0 ? mixPose(a.pose, OPEN_POSE, hm.release) : a.pose;
    const wx = a.wrist.x + d.x, wy = a.wrist.y + d.y;
    return {...a, pose: pose2, L: a.L * kH, wrist: {x: pc[0] + (wx - pc[0]) * kH, y: pc[1] + (wy - pc[1]) * kH}};
  });
  const packXf = kP !== 1 ? `translate(${f2(pc[0])} ${f2(pc[1])}) scale(${kP.toFixed(4)}) translate(${f2(-pc[0])} ${f2(-pc[1])})` : undefined;
  // shadows: the pack's on the back (soft, pushed down-right with height) and the hands' on the tray
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
  return (
    <g>
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: `${id}r`,
          gear: (
            <g>
              {packSh}
              <WireDraw v={v} w={w} warp={kP !== 1 ? {c: pc, k: kP} : undefined} />
              <g transform={packXf}>
                <Gear2D id={`${id}g`} v={v} f={fp} g={{kind: 'injector', noWires: true}} />
              </g>
            </g>
          ),
        }}
      />
      {hands.map((a, i) => (
        <GloveArm key={i} id={`${id}h${i}`} a={a} shadow={{alpha: 0.11 * (1 - clamp(hm.up / 150)), offset: shOff}} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ B1
const B1_AZ = 20, B1_EL = 32, B1_S = 9.0;
const B1_AT: V3 = [-2, 12, 0];
export const b1View = (t: number): View => {
  // one slow push in toward the pack as it comes down
  const u = sr(t, 136 / FPS, 175 / FPS);
  return viewAt(B1_AZ, B1_EL, B1_S * (1 + 0.07 * u), B1_AT, 540, 1200 - 30 * u);
};
export const B1: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const v = b1View(t);
  const refF = bPose(B_SEAT + 0.6).frame;
  const vRef = viewAt(B1_AZ, B1_EL, B1_S, B1_AT, 540, 1200);
  const grip = mapGrip(solveGrips('b1', vRef, refF, [70, 110], [244, 296], [-1, 1]), vRef, v);
  // the far bench edge, wall and cabinets in scene px behind the tray (blurred)
  const benchFar = P(v, [0, 0, -330])[1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Backdrop id={`b1f${f}`} v={v} far={benchFar} />
      <Tray2D v={v} x0={-200} x1={240} z0={-260} z1={170} grid={20} />
      {LAB_BLOCKS.map((k, i) => (
        <FoamBox key={i} id={`b1f${f}k${i}`} v={v} b={k.b} color={k.c} />
      ))}
      <Scene id={`b1f${f}`} t={t} v={v} grip={grip} refF={refF} hm={{release: 0, up: 0, back: 0}} />
    </svg>
  );
};
/** the lab beyond the bench: the wall (blurred) from the bench's far edge up */
const Backdrop: React.FC<{id: string; v: View; far: number}> = ({id, far}) => (
  <g>
    <defs>
      <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
    <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.benchTop} />
    <g filter={`url(#${id}-wb)`}>
      <g transform={`translate(-260 ${f2(far - 1010 * 1.25)}) scale(1.25)`}>
        <LabWall2 id={`${id}w`} />
      </g>
    </g>
  </g>
);

// ------------------------------------------------------------------ B2
const B2_AZ = 0, B2_EL = 90, B2_S = 8.4;
const B2_AT: V3 = [8, 0, 0];
export const b2View = (t: number): View => {
  // the camera drifts with the insect as it sets off (it keeps a little of its travel)
  const dx = bWalkS(t) - S_REST;
  return viewAt(B2_AZ, B2_EL, B2_S, [B2_AT[0] + 0.6 * dx, 0, 0], 500, 1000);
};
export const B2: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const v = b2View(t);
  const refF = bPose(B_SEAT + 0.6).frame;
  const vRef = b2View(186 / FPS);
  const grip = mapGrip(solveGrips('b2', vRef, refF, [70, 110], [250, 290], [-1, 1]), vRef, v);
  const release = sr(f, 187, 194);
  const u = easeIn(ramp(f, 189, 211), 1.8);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Tray2D v={v} x0={-200} x1={260} z0={-170} z1={170} grid={20} />
      {LAB_BLOCKS.map((k, i) => (
        <FoamBox key={i} id={`b2f${f}k${i}`} v={v} b={k.b} color={k.c} />
      ))}
      <Scene id={`b2f${f}`} t={t} v={v} grip={grip} refF={refF} hm={{release, up: 150 * u, back: 120 * u}} depthK={0.0042} />
    </svg>
  );
};
void smoother;
void Bench2;
void Layer;
