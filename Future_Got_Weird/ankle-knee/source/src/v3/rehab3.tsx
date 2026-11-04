// V3 proof shot (replaces V2's standing hold) and the weight-bearing bend, one continuous shot in the rehab room.
// "with his toes pointing behind him": start at his hip, track down just far enough to show both legs in profile. His
// ordinary trainer points at the front of the parallel bars; his own toes, in the rimmed socket, point back at the
// treatment bench behind him. "That backward ankle now bent the same way as his other knee": the lens carries past
// the near rail into a lower three-quarter angle, and he makes one smooth, weight-bearing bend: hips lower, both
// joints flex, elbows bend; the near hand wraps over the rail, the far hand is behind its rail.
import React from 'react';
import {Cam, D0, Layer, camScale, glide, CKey, travel, proj, W, H} from '../camera';
import {Inked, InkPath} from '../dc/ink';
import {Capsule, SoftShadow, Blob} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {cleatLow} from '../art/wyatt';
import {C} from '../art/pal';
import {ss, ss5, lerp, clamp} from '../lib';
import {Room, Rail} from '../v2/rails';
import {Wyatt2, bjoints, BPose} from '../v2/body';
import {legTo, focus, HAND_GRIP, ANK} from '../v2/poses';
import {T3, start3, end3} from './story3';

const RAIL_Y = -70, DN = D0 - 30, DF = D0 + 30;
const toD0 = (c: Cam, D: number, x: number, y: number): V => ({x: c.x + (x - c.x) * (D0 / D), y: c.eye + (y - c.eye) * (D0 / D)});
const FRONT_X = -46; // the front end of the bars (where his trainer points)

export const rehabCam = (t: number): Cam => {
  const t0 = start3('rehab');
  const keys: CKey[] = [
    [t0, {x: 3, y: -72, w: 42, eye: -72}],
    [T3.toes + 0.45, {x: -4, y: -44, w: 104, eye: -52}, travel],
    [T3.that - 0.05, {x: -5, y: -43, w: 100, eye: -50}, travel],
    [T3.bent - 0.1, {x: -8, y: -45, w: 86, eye: -26}, travel],
    [T3.same + 0.35, {x: -8, y: -40, w: 78, eye: -26}, travel],
    [end3('rehab'), {x: -8, y: -40, w: 76, eye: -26}, travel],
  ];
  return glide(t, keys);
};
export const bendU = (t: number) => ss5(t, T3.bent - 0.1, T3.same + 0.3);
export const rehabPose = (t: number, c: Cam): BPose => {
  const u = bendU(t);
  const turn = ss(t, T3.that - 0.05, T3.bent);
  const stag = {x: lerp(-10, -17, turn), y: lerp(-0.8, -2.6, turn)};
  const Hp = {x: 1.6 * u, y: -73.2 + 8.5 * u};
  const nF = {x: -2, y: -ANK}, fF = {x: -2 + stag.x + 1, y: -ANK + stag.y};
  // hands: the wrist sits above and behind the rail, the hand wraps forward over it (never the rail through a wrist)
  const xg = -22;
  const rn = toD0(c, DN, xg, RAIL_Y), rf = toD0(c, DF, xg - 6, RAIL_Y);
  const rr = 2.0;
  return {
    hip: Hp, pelvis: 4 + 6 * u, chest: 3 + 8 * u,
    near: legTo(Hp, nF, 90), far: legTo({x: Hp.x + stag.x, y: Hp.y + stag.y}, fF, 90), stag,
    aN: {T: {x: rn.x + 3.4, y: rn.y - rr * (D0 / DN) - 2.6}, elbow: -1}, aF: {T: {x: rf.x + 3.4, y: rf.y - rr * (D0 / DF) - 2.6}, elbow: -1},
    hN: HAND_GRIP, hF: HAND_GRIP, hAbsN: 128, hAbsF: 128,
    neck: 6 + 10 * u + 6 * ss(t, T3.toes, T3.pointing), turn: lerp(1, 0.75, turn), expr: {...focus, gx: lerp(-0.4, -0.2, turn), gy: lerp(0.5, 0.95, u), smile: 0.3 + 0.2 * u}, blink: 0,
  };
};
const Bench: React.FC<{c: Cam; k: string; iw: number}> = ({c, k, iw}) => {
  // a padded treatment bench behind him, seen side-on a little deeper than the subject plane
  const D = D0 + 45;
  const q = (x: number, y: number) => toD0(c, D, x, y);
  const top = [q(34, -52), q(120, -52), q(120, -44), q(34, -44)];
  return (
    <g>
      {[42, 112].map((x, i) => <Capsule key={i} id={`${k}bl${i}`} a={q(x, -44)} b={q(x, 0)} ra={1.6} rb={1.6} color={shade(C.metal, 0.15)} />)}
      <SoftShadow id={`${k}bs`} c={q(77, 0)} rx={46} ry={2.2} alpha={0.22} color="#6B5A3C" />
      <Inked w={iw}><Blob id={`${k}bp`} d={closed(top, 0.3)} c={q(60, -56)} r={50} color="#4F87B8" k={0.6} /></Inked>
      <Inked w={iw}><InkPath d={closed([q(92, -53), q(108, -58), q(119, -56), q(119, -52), q(92, -52)], 0.4)} fill={lit(C.sheet, 0.1)} /></Inked>
    </g>
  );
};
const FrontEnd: React.FC<{c: Cam; k: string; iw: number}> = ({c, k, iw}) => {
  // the front of the parallel bars: the two end posts and the cross-rail between them
  const a = toD0(c, DN, FRONT_X, RAIL_Y), b = toD0(c, DF, FRONT_X, RAIL_Y);
  return (
    <g>
      <Inked w={iw}><InkPath d={`M${fmt(a.x)},${fmt(a.y - 2)} L${fmt(b.x)},${fmt(b.y - 1.6)} L${fmt(b.x)},${fmt(b.y + 1.6)} L${fmt(a.x)},${fmt(a.y + 2)} Z`} fill="#C3CBD3" /></Inked>
    </g>
  );
};
export const RehabShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = rehabCam(t);
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const p = rehabPose(t, c);
  const j = bjoints(p);
  const toe = 26 * Math.max(0, Math.sin(Math.PI * clamp((t - T3.pointing) / 0.5)));
  return (
    <>
      <Room c={c} k={k} />
      <Layer c={c}>
        <Bench c={c} k={`${k}be`} iw={iw} />
        <Rail c={c} D={DF} k={`${k}rf0`} posts={[FRONT_X, 120]} />
        <FrontEnd c={c} k={`${k}fe`} iw={iw} />
        {[{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot)}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot)}].map((f, i) => (
          <SoftShadow key={i} id={`${k}fs${i}`} c={{x: f.x, y: 0.3}} rx={12} ry={2} alpha={0.3} color="#6B5A3C" />
        ))}
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'sneaker', shoeF: 'sneaker', prosthesis: true, socket: {clear: 1, local: 0, rim: 1}, toeCurl: toe, shirt: '#F2A33C', shorts: '#2E3F5C', sock: '#FFFFFF',
          behind: <Rail c={c} D={DF} k={`${k}rf`} posts={[]} />,
          beforeNearArm: <Rail c={c} D={DN} k={`${k}rn`} posts={[FRONT_X, 135]} />}} />
      </Layer>
      {void proj}{void W}{void H}
    </>
  );
};
