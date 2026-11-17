// Shots 3-4: the bench and the microscope.
//  3  A match cut from the glass fish (shot 2 ends on its side-B profile, centred, about 640 px long) to the same
//     profile, the same size and place: the paper-and-gelatin fish held in tweezers. The caudal fin piece, in a second
//     pair, docks onto the gelatin hinge. The camera pulls back fast to the scientist holding it at eye level (the fish
//     is 14 mm long), then rushes back in to the hinge.
//  4  Into the tissue: living cardiomyocytes, aligned, beating together.
import React from 'react';
import {basis, V3} from '../core/cam';
import {Layer, Cam as Cam2} from '../dc/camera';
import {Man} from '../dc/Man';
import {mixExpr} from '../dc/Head';
import {INK} from '../dc/ink';
import {add, mul, V} from '../dc/math';
import {mixHand} from '../dc/Hand';
import {Fish} from '../fish/Fish';
import {FishPose} from '../fish/model';
import {Bench, LabWall, WorkMat} from '../lab/set';
import {BASE, EXPR_FOCUS, EXPR_PROUD, H_PINCH, H_REST, HERO_LAB, LS, pinchOf, placeHand} from '../lab/cast';
import {CellField} from '../art/cells';
import {clamp, lerp, ss, ssOut, T} from '../lib';

/** where the fish's centre (s = 0.45) is held, in lab units */
export const FC: V = {x: -560, y: 1112};
const FS = 0.1; // lab units per fish unit
const fishPose: FishPose = {pos: [0, 0, 0], yaw: 0, A: 0, actA: 0, actB: 0, mature: 0, TK: 1};
/** lab point of a fish-local point (side B faces the camera, so the fish heads screen-left) */
const fl = (x: number, y: number): V => ({x: FC.x - x * FS, y: FC.y + y * FS});
const GRIP_A = fl(28, -16.5); // the anterior top edge
const GRIP_B = fl(-62, -15); // the caudal fin's upper lobe root

const logLerp = (a: number, b: number, u: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
export const benchCam = (t: number): Cam2 => {
  const t0 = T.s3;
  const back = ss(t, t0 + 0.32, t0 + 0.86);
  const inn = ss(t, t0 + 1.02, T.s4 + 0.02);
  const z = logLerp(logLerp(45, 2.05, back), 300, inn * inn);
  const wide: V = {x: -405, y: 1010};
  const hinge = fl(-22, 0);
  const c0 = FC;
  const c = back < 1 ? {x: lerp(c0.x, wide.x, back), y: lerp(c0.y, wide.y, back)} : {x: lerp(wide.x, hinge.x, ss(inn, 0, 0.4)), y: lerp(wide.y, hinge.y, ss(inn, 0, 0.4))};
  return {x: c.x, y: c.y, z};
};

const Tweezers: React.FC<{tip: V; hand: V; open: number; k: number}> = ({tip, hand, open, k}) => {
  const d = {x: hand.x - tip.x, y: hand.y - tip.y};
  const L = Math.hypot(d.x, d.y);
  const u = {x: d.x / L, y: d.y / L};
  const n = {x: -u.y, y: u.x};
  const end = add(tip, mul(u, L + 26));
  const blade = (sgn: number) => {
    const a = add(tip, mul(n, sgn * (0.25 + open)));
    const b = add(add(tip, mul(u, L * 0.55)), mul(n, sgn * (2.6 + open * 0.6)));
    const c = add(end, mul(n, sgn * 2.2));
    const c2 = add(end, mul(n, sgn * 0.4));
    const b2 = add(add(tip, mul(u, L * 0.55)), mul(n, sgn * (1.0 + open * 0.6)));
    const a2 = add(tip, mul(n, sgn * open));
    return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${c2.x},${c2.y} L${b2.x},${b2.y} L${a2.x},${a2.y} Z`;
  };
  return (
    <g>
      <path d={blade(1)} fill="#C3CED6" stroke={INK} strokeWidth={0.7 * k} strokeLinejoin="round" />
      <path d={blade(-1)} fill="#A9B6C0" stroke={INK} strokeWidth={0.7 * k} strokeLinejoin="round" />
    </g>
  );
};

export const Shot3: React.FC<{t: number}> = ({t}) => {
  const cam = benchCam(t);
  const k = 1 / Math.max(1, cam.z * 0.5);
  const t0 = T.s3;
  const dock = ss(t, t0 + 0.05, t0 + 0.3);
  // the scientist: holding the fish up at eye level with the near hand, docking the tail with the far hand
  let p = {...BASE, x: -120, y: 1500, s: LS, torso: 7, chest: 9, neck: 10, turn: 0.42};
  const handA = add(GRIP_A, {x: 62, y: -66});
  const tailOff = {x: (1 - dock) * 1.6, y: (1 - dock) * -0.5};
  const gripB = add(GRIP_B, tailOff);
  const handB = add(gripB, {x: 78, y: -36});
  p = placeHand(p, 'L', handA, 132, 0.62, 0.0);
  p = placeHand(p, 'R', add(handB, {x: 0, y: 0}), 150, 0.62, 0.02);
  const pa = pinchOf(p, 'L', H_PINCH);
  const pb = pinchOf(p, 'R', H_PINCH);
  const expr = mixExpr(EXPR_FOCUS, EXPR_PROUD, ss(t, t0 + 0.55, t0 + 0.9));
  const B = (off: V) => basis({eye: [0, 0, -4000], target: [0, 0, 0], f: FS * 4000, cx: FC.x + off.x, cy: FC.y + off.y});
  const look = {muscle: 0, gnode: false, pxScale: cam.z};
  // the fish and both tools, in lab units
  const fishEl = (
    <g>
      <Fish id="b3t" B={B(tailOff)} pose={fishPose} look={{...look, only: 'tail'}} />
      <Fish id="b3b" B={B({x: 0, y: 0})} pose={fishPose} look={{...look, only: 'body'}} />
    </g>
  );
  const twA = <Tweezers tip={GRIP_A} hand={pa.p} open={0} k={k} />;
  const twB = <Tweezers tip={gripB} hand={pb.p} open={0} k={k} />;
  // into the tissue: the cells come up through the gelatin as the camera rushes in
  const cellIn = ss(t, T.s4 - 0.16, T.s4);
  void H_REST;
  void mixHand;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <Layer cam={cam} depth={2.2}>
        <LabWall id="b3w" />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Man id="b3m" pose={p} expr={expr} lHand={H_PINCH} rHand={H_PINCH} outfit={HERO_LAB} inkK={0.9} />
        <Bench id="b3n" k={1} />
        <WorkMat id="b3k" k={1} />
        {fishEl}
        <Man id="b3h" pose={p} expr={expr} lHand={H_PINCH} rHand={H_PINCH} outfit={HERO_LAB} inkK={0.9} handsOnly holdL={{front: [0, 1, 2, 3], obj: twA}} holdR={{front: [0, 1, 2, 3], obj: twB}} />
      </Layer>
      {cellIn > 0 && <CellField id="b3c" cx={540} cy={960} px={lerp(120, 260, cellIn)} t={t} freq={1.8} opacity={cellIn} />}
    </svg>
  );
};

export const Shot4: React.FC<{t: number}> = ({t}) => {
  const u = clamp((t - T.s4) / (T.s5 - T.s4));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <CellField id="b4c" cx={540} cy={960} px={lerp(260, 330, ssOut(u, 0, 1))} t={t} freq={1.8} />
    </svg>
  );
};
/** the cells over the start of shot 5, shrinking as the camera pulls back to the fish's side */
export const CellsOut: React.FC<{t: number}> = ({t}) => {
  const u = clamp((t - T.s5) / 0.42);
  if (u >= 1) return null;
  return <CellField id="b5c" cx={540} cy={960} px={logLerp(330, 40, ss(u, 0, 1))} t={t} freq={1.8} opacity={1 - ss(u, 0.35, 1)} />;
};
export type {V3};
