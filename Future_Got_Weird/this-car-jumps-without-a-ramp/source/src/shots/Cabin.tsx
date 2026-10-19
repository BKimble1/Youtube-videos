// 1:33–1:48 — the passenger. The bend again, front view; the camera pushes through the windscreen into the cabin; the
// passenger on the outside seat is held by the belt and pressed into the outside bolster; then the camera backs out and the
// car runs through the lens into the real replay.
//   93.4   front view, level car in the bend ("a level car doesn't make the corner disappear")
//   95.5   push into the passenger half of the windscreen, then through the glass
//   97.0   the seat's sideways force on the passenger (one short arrow that stops at the body, never crossing it)
//   101    pressed into the bolster, a little lean; "less lean, not less force"
//   106.5  back out to the exterior; the car runs through the lens
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w} from '../cues';
import {FrontCar, TRACK_HALF} from '../car/front';
import {Callout, Label, Stage} from '../kit/stage';
import {CabinCutaway, LeanForceMeters, bolsterFace} from './CabinCutaway';
import {TrackScene, BEND_START, trackAt} from '../kit/track3d';
import {Cam3, carToWorld} from '../kit/view3d';
import {easeInOut, keys, lerp, seg, smooth, win} from '../kit/util';
import {SPEED} from './Bend';

export const T5 = {
  and: w('b5', 'and'),
  corner: w('b5', 'corner'),
  disappear: w('b5', 'disappear'),
  your: w('b5', 'your'),
  sideways: w('b5', 'sideways'),
  force: w('b5', 'force'),
  turn: w('b5', 'turn'),
  seat: w('b5', 'seat'),
  provides: w('b5', 'provides'),
  you: w('b5', 'you'),
  pressed: w('b5', 'pressed'),
  bolster: w('b5', 'bolster'),
  leans: w('b5', 'leans'),
  even: w('b5', 'even'),
  feel: w('b5', 'feel'),
  less: w('b5', 'less'),
  bodyCtl: w('b5', 'body', 1),
  cancellation: w('b5', 'cancellation'),
  watch: w('b6', 'watch'),
};
export const CABIN_IN = T5.and - 0.0;
export const CABIN_OUT = T5.watch - 0.3; // = the real replay's first frame (108.04)
export const REPLAY_AT = 108.04;
const sAt = (t: number) => BEND_START + 50000 + (t - CABIN_IN) * SPEED;

const FRONT_F = 2100, FRONT_H = 1500, D_CAR = 5200;
const DRIVER_X = 330; // the driver's seat (car's left = screen-right) in body millimetres
const ROLL = 0.8;
const ROLL_CAB = 5, ROLL_LESS = 1.4; // the cabin diagram's lean, before and after the body control (illustrative)

export const Cabin: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = sAt(t);
  const tp = trackAt(s);
  const pose = {e: tp.e, n: tp.n, psi: tp.psi};
  // the car runs through the lens at the very end
  const passIn = CABIN_OUT - 0.55;
  const pass = seg(t, passIn, CABIN_OUT);
  const dCar = lerp(D_CAR, 380, pass * pass * pass);
  const eye = carToWorld(pose, [1450 + dCar, FRONT_H, 0]);
  const cam: Cam3 = {eye, yaw: pose.psi + Math.PI, pitch: 0, f: FRONT_F, cx: 960, cy: 300};
  const sc = FRONT_F / dCar;
  const gy = 300 + (FRONT_F * FRONT_H) / dCar;

  // push into the windscreen, a round cutaway opens there, the cabin fills the frame; the same camera move reversed on the way out
  const IN0 = T5.disappear - 0.35, IN1 = T5.your - 0.3;
  const OUT0 = T5.cancellation + 0.08, OUT1 = CABIN_OUT - 0.6;
  const inK = easeInOut(seg(t, IN0, IN1));
  const outK = easeInOut(seg(t, OUT0, OUT1));
  const zk = inK * (1 - outK);
  const Z = 1 + 1.7 * zk;
  const focus = {x: 960 + DRIVER_X * sc, y: gy - 1070 * sc};
  const fx = 960 + (focus.x - 960) * zk, fy = 540 + (focus.y - 540) * zk;
  const irisA = easeInOut(seg(t, T5.your - 0.7, T5.your + 0.25));
  const irisB = easeInOut(seg(t, OUT0 - 0.05, OUT0 + 0.45));
  const iris = irisA * (1 - irisB);
  const irisR = lerp(70, 1190, iris);
  const irisC = {x: 960 + (focus.x - 960) * zk * 0 + 0, y: 540};
  // iris centre: the driver's windscreen position on screen (it is the screen centre once the zoom has settled)
  const wsx = 960 + ((960 + DRIVER_X * sc - fx) * Z), wsy = 540 + (gy - 1070 * sc - fy) * Z;
  irisC.x = wsx + (960 - wsx) * iris;
  irisC.y = wsy + (540 - wsy) * iris;
  const path = win(t, T5.and, T5.disappear + 0.4, 0.35, 0.4);

  const arrow = smooth(seg(t, T5.sideways - 0.1, T5.sideways + 0.4)) * (1 - smooth(seg(t, OUT0 - 0.2, OUT0 + 0.1)));
  const press = keys(t, [[T5.seat - 0.2, 0.0], [T5.provides + 0.2, 0.5], [T5.pressed + 0.4, 1]], easeInOut) * smooth(seg(t, T5.sideways - 0.3, T5.sideways + 0.3));
  const leanK = keys(t, [[T5.even - 0.1, 0], [T5.less + 0.25, 1]], easeInOut);
  const roll = lerp(ROLL_CAB, ROLL_LESS, leanK) * smooth(seg(t, T5.your - 0.4, T5.your + 0.6)) + 0.4 * Math.sin(t * 3.1) * 0.1;
  const meters = win(t, T5.feel - 0.2, OUT0 + 0.1, 0.35, 0.3);
  const faceX = bolsterFace(press);
  const open = iris > 0.98;
  return (
    <AbsoluteFill>
      <Stage bg={C.paper}>
        <g transform={`translate(960 540) scale(${Z}) translate(${-fx} ${-fy})`}>
          <TrackScene cam={cam} s0={s - 150000} s1={s + 20000} pathHint={{sFrom: s - 120000, sTo: s - 3000, opacity: path}} />
          <g transform={`translate(960 ${gy}) scale(${sc} ${-sc})`}>
            <FrontCar px={sc * Z} roll={ROLL + 0.12 * Math.sin(t * 5.3)} dz={3 * Math.sin(t * 7.1) + 2 * Math.sin(t * 11.3)} id="cabin" />
          </g>
        </g>
        {iris > 0.001 && (
          <g>
            <clipPath id="iris">
              <circle cx={irisC.x} cy={irisC.y} r={irisR} />
            </clipPath>
            <g clipPath="url(#iris)">
              <CabinCutaway frame={frame} roll={roll} press={press} arrow={arrow} />
              <LeanForceMeters lean={roll / ROLL_CAB} force={0.82} opacity={meters} />
              <Label x={faceX - 120} y={508} text="SIDEWAYS FORCE" color={C.tealLight} size={36} opacity={win(t, T5.sideways - 0.05, T5.seat - 0.15, 0.3, 0.3) * (open ? 1 : 0)} />
              <Callout x={400} y={430} tx={faceX - 170} ty={530} text="SEAT BOLSTER" color={C.white} size={36} opacity={win(t, T5.seat - 0.05, T5.you - 0.1, 0.25, 0.3) * (open ? 1 : 0)} />
            </g>
            <circle cx={irisC.x} cy={irisC.y} r={irisR} fill="none" stroke={C.ink} strokeWidth={14} opacity={1 - smooth(seg(iris, 0.9, 1))} />
            <circle cx={irisC.x} cy={irisC.y} r={irisR - 7} fill="none" stroke={C.cream} strokeWidth={5} opacity={1 - smooth(seg(iris, 0.9, 1))} />
          </g>
        )}
        <Label x={960} y={70} text="LESS LEAN, NOT LESS FORCE" color={C.saffron} size={52} opacity={win(t, T5.leans + 0.1, OUT0 + 0.3, 0.3, 0.3)} />
      </Stage>
    </AbsoluteFill>
  );
};
